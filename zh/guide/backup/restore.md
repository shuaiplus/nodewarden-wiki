# 还原与校验

还原流程的核心目标是：先验证，再替换，附件失败不污染数据库。

## 支持的还原来源

- 本地上传备份 ZIP。
- 从远程 WebDAV/S3 目标选择 ZIP 还原。

远程还原可以在备份中心浏览远程目录，只允许选择 `.zip` 文件。服务端会拒绝空路径、目录路径和非 ZIP 路径。

## 文件名 hash 校验

备份文件名形如：

```text
nodewarden_backup_20260510_031500_abc12.zip
```

末尾 5 位是 ZIP 内容 SHA-256 的前 5 位。导入时服务端会重新计算，如果不一致，默认拒绝。

管理员可以选择允许 hash 不匹配，但这会被写入审计日志里的 `checksumMismatchAccepted`。

## 解析 ZIP

`parseBackupArchive()` 会检查：

- ZIP 总大小不能超过当前限制。
- 解压后总大小不能超过当前限制。
- entry 数量不能过多。
- 必须存在 `manifest.json` 和 `db.json`。
- manifest formatVersion 必须支持。
- `db.json` 必须是有效 JSON。
- 如果附件是内联 ZIP 模式，必须包含每个附件文件。

## 内容校验

`validateBackupPayloadContents()` 会检查：

- users 必须有 id 和 email。
- 用户 id 不能重复。
- config key 不能为空。
- revision 必须指向存在的用户。
- domain_settings 必须指向存在的用户，且每个用户最多一条。
- folders 必须指向存在的用户，folder id 不能重复。
- ciphers 必须指向存在的用户。
- cipher 的 folder_id 必须存在。
- attachments 必须指向存在的 cipher。
- 每个附件必须有对应文件或远程 blob 引用。

## fresh instance 保护

默认还原要求目标实例没有 vault 或 send 数据。服务端会检查：

- `ciphers`
- `folders`
- `attachments`
- `sends`

如果已有数据且没有选择 replace existing，会返回冲突。

## shadow 表还原

还原不是直接 `DELETE` 正式表再插入。流程是：

1. 删除旧 shadow 表。
2. 从当前正式表 CREATE SQL 生成 shadow 表。
3. 把备份行插入 shadow 表。
4. 校验 shadow 表行数。
5. 恢复附件 blob。
6. 对恢复失败的附件，从 shadow 表删除对应行。
7. 再次校验 shadow 表行数。
8. 清空正式表。
9. 把 shadow 表内容插入正式表。
10. 删除 shadow 表。

这样如果中途失败，正式数据不会在前半段就被清掉。

## 附件恢复策略

附件恢复会根据目标存储做适配：

- R2：直接写入。
- KV：超过 25 MiB 的附件跳过。
- 未配置附件存储：所有附件跳过。

跳过附件时，服务端会返回 skipped 列表，并从恢复后的 attachments 表里移除这些行，避免前端看到不存在的附件。

## 替换恢复后的清理

如果选择 replace existing，恢复成功后会比较恢复前后的附件 blob key。旧库里不再被引用的 blob 会被清理，避免存储里堆积孤儿文件。

清理失败不会回滚数据库恢复，但会尽力执行。

