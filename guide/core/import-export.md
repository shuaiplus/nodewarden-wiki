# 导入与导出

NodeWarden 有两类导入导出：

- **密码库导入导出**：用户级，面向 Bitwarden JSON/CSV/ZIP 和 NodeWarden 扩展格式。
- **实例级备份导入导出**：管理员级，面向整站恢复，见备份中心章节。

## 支持的导出格式

网页端当前列出的格式包括：

- Bitwarden JSON
- Bitwarden encrypted JSON
- Bitwarden JSON ZIP
- Bitwarden encrypted JSON ZIP
- NodeWarden JSON
- NodeWarden encrypted JSON

Bitwarden ZIP 会把 `data.json` 和附件打包。NodeWarden JSON 会在 Bitwarden 数据之外增加 `nodewardenAttachments` 或加密附件 payload。

## 加密导出

加密 JSON 支持两种思路：

- 账号密钥模式：用用户 vault key 生成校验字段。
- 文件密码模式：用导出时输入的文件密码派生密钥，再加密 JSON 内容。

文件密码模式会根据账号 KDF 参数使用 PBKDF2 或 Argon2id，并派生 enc/mac 两个子密钥。

## 导入限制

服务端导入接口 `/api/ciphers/import` 有数量限制：

```text
folders + ciphers <= 5000
```

这是为了避免单次 Worker 请求处理过多 D1 batch 和 JSON 数据。

## Bitwarden ZIP 附件

导入带附件 ZIP 时，网页端会把密码项和附件按服务端接口拆分：

1. 导入 folders 和 ciphers。
2. 建立源 cipher 到新 cipher 的映射。
3. 创建附件元数据。
4. 上传附件正文。

这也是为什么附件恢复需要同时考虑 D1 元数据和 R2/KV 文件对象。

## 和实例备份的区别

密码库导入导出面向“用户密码库迁移”，不会包含管理员配置、备份目标、用户状态、schema 状态等实例级信息。

实例备份面向“整站恢复”，会导出用户、密码项、文件夹、域名规则、修订时间、部分配置和可选附件，但不会导出所有运行态表。

