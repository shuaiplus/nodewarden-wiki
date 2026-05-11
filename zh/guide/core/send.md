# Send 与公开访问

Send 用于生成临时分享。NodeWarden 支持文本 Send 和文件 Send。

维护 Send 时要把两条线分开：登录用户管理自己的 Send，公开访问者只拿到短期访问能力。公开访问不能复用账号 access token，也不能绕过 Send 的禁用、过期、删除日期和访问次数限制。

## 数据结构

Send 结构化数据保存在 D1 `sends` 表：

- `id`
- `user_id`
- `type`
- `name`
- `notes`
- `data`
- `key`
- `password_hash`
- `password_salt`
- `password_iterations`
- `auth_type`
- `emails`
- `max_access_count`
- `access_count`
- `disabled`
- `hide_email`
- `expiration_date`
- `deletion_date`

文件 Send 的二进制正文保存在 R2/KV，key 为：

```text
sends/<sendId>/<fileId>
```

## 创建时会发生什么

网页端创建 Send 时，前端会先生成 Send 独立 key material，并用用户 vault key 加密后放入 `key` 字段。服务端只保存加密后的 name、notes、text/file 元数据和 Send key，不知道明文内容。

文本 Send 流程：

```text
SendsPage.tsx
  -> webapp/src/lib/api/send.ts createSend()
  -> POST /api/sends
  -> src/handlers/sends-private.ts handleCreateSend()
  -> D1 sends
```

文件 Send 流程多一步 blob 上传：

```text
POST /api/sends/file/v2
  -> 创建 D1 sends 行，返回短期上传 URL
PUT/POST /api/sends/{sendId}/file/{fileId}?token=...
  -> 校验上传 token
  -> 写入 R2/KV sends/{sendId}/{fileId}
```

这意味着文件 Send 由两部分组成：D1 中的 Send 记录和 R2/KV 中的文件正文。只恢复其中一边都不完整。

## 公开访问 token

公开访问不是直接暴露主账号 token。服务端会针对 Send 生成短期 access token，类型是 `send_access`，默认 5 分钟有效。

文件上传和下载也有独立短 token，和附件类似，用 JWT_SECRET 签名。

当前公开访问支持无额外认证和密码认证。邮箱认证字段会被保存用于兼容数据结构，但公开访问时会返回不支持，不会发送邮件验证码。

公开访问路径主要是：

```text
/send/{accessId}/{key}              -> 前端公开页
POST /api/sends/access/{accessId}   -> 校验 Send 可访问性和密码
POST /api/sends/{id}/access/file/{fileId}
GET  /api/sends/{id}/{fileId}?t=... -> 短 token 下载文件正文
```

`accessId` 是由 Send UUID 转出的公开 ID。URL 里的 key 部分是前端解密用的 Send key material，不是服务端登录凭据。服务端只用它派生密码 hash 或让前端解密内容。

## 访问次数

`StorageService.incrementSendAccessCount()` 会原子增加访问次数。如果 Send 配置了最大访问次数，达到上限后访问会失败。

文件下载 token 带 `jti`，服务端复用 `used_attachment_download_tokens` 表记录已消费 token。Send 文件下载会把 jti 加上 `send:` 前缀，避免和附件下载 token 混淆。

## 删除日期

Send 有删除日期。当前配置限制最远删除日期为 31 天，避免长期公开分享成为永久风险。

可访问性检查会同时看：

- `disabled`
- `max_access_count`
- `expiration_date`
- `deletion_date`
- 文件 blob 是否存在
- 密码是否正确

删除日期到期后不会立即把 D1 行和 blob 从存储里清理掉，但公开访问会失败。维护自动清理逻辑时，必须同时考虑 D1 sends 行和 `sends/<sendId>/<fileId>` blob。

## 备份边界

当前实例级备份不导出 `sends` 表，也不导出 Send 文件正文。备份章节会单独说明这个边界。

这个边界是故意的。Send 是临时分享能力，不是长期 vault 数据。把它纳入实例备份会带来几个额外问题：公开链接是否应恢复、访问次数是否应恢复、已过期 Send 是否应恢复、文件正文是否应跨实例继续可访问。当前版本选择不备份 Send，避免恢复后重新激活旧分享链接。

如果以后要改变这个边界，需要同时改：

- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `shared/backup-schema.ts`
- `wiki/guide/backup/scope.md`
- 前端备份计数和还原结果展示
