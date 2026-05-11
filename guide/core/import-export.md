# 导入与导出

NodeWarden 有两类导入导出：

- **密码库导入导出**：用户级，面向 Bitwarden JSON/CSV/ZIP 和 NodeWarden 扩展格式。
- **实例级备份导入导出**：管理员级，面向整站恢复，见备份中心章节。

这两类不要混在一起理解。密码库导入导出只处理当前用户的 vault 数据；实例级备份导入导出会影响整站用户、配置、文件夹、密码项、域名规则和可选附件。

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

用户级导出主要发生在前端。服务端负责提供已登录用户的 vault 数据和附件下载 URL，前端负责解密、重新加密或打包格式。维护导出格式时优先看：

- `webapp/src/lib/export-formats.ts`
- `webapp/src/lib/download.ts`
- `webapp/src/lib/api/vault.ts`
- `src/handlers/ciphers.ts`
- `src/handlers/attachments.ts`

## 导入限制

服务端导入接口 `/api/ciphers/import` 有数量限制：

```text
folders + ciphers <= 5000
```

这是为了避免单次 Worker 请求处理过多 D1 batch 和 JSON 数据。

网页端导入会把解析和加密转换放在前端做，再提交给服务端。导入期间请求会带：

```text
X-NodeWarden-Import: 1
```

服务端会让 `/api/ciphers/import` 和导入期间的附件上传绕过普通认证 API 限流，避免大批量导入被每分钟 API 配额截断。这个 bypass 只对明确的导入路径生效，不是通用免限流开关。

## Bitwarden ZIP 附件

导入带附件 ZIP 时，网页端会把密码项和附件按服务端接口拆分：

1. 导入 folders 和 ciphers。
2. 建立源 cipher 到新 cipher 的映射。
3. 创建附件元数据。
4. 上传附件正文。

这也是为什么附件恢复需要同时考虑 D1 元数据和 R2/KV 文件对象。

具体流程是：

```text
ImportPage.tsx
  -> webapp/src/lib/import-formats*.ts 解析来源格式
  -> POST /api/ciphers/import 写入 folders/ciphers
  -> POST /api/ciphers/{id}/attachment/v2 创建附件元数据
  -> PUT/POST 短 token URL 上传附件正文
```

如果附件上传失败，密码项可能已经导入成功，但附件正文不完整。维护导入 UX 时要让用户能看到这种部分成功状态，而不是只显示“导入完成”。

## 和实例备份的区别

密码库导入导出面向“用户密码库迁移”，不会包含管理员配置、备份目标、用户状态、schema 状态等实例级信息。

实例备份面向“整站恢复”，会导出用户、密码项、文件夹、域名规则、修订时间、部分配置和可选附件，但不会导出所有运行态表。

如果你要改实例级备份，不要从本页的用户导入导出代码入手，应看：

- `src/handlers/backup.ts`
- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `src/services/backup-settings-crypto.ts`
- `shared/backup-schema.ts`
- `webapp/src/components/BackupCenterPage.tsx`

实例级备份有文件名 hash、manifest、shadow 表、fresh instance 保护和 replace existing 分支，风险明显高于用户级导入导出。
