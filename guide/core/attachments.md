# 附件与文件存储

NodeWarden 把附件元数据和文件正文分开存储。

## 存储位置

| 数据 | 保存位置 |
| --- | --- |
| 附件 ID、cipher_id、加密文件名、大小、加密 key | D1 `attachments` 表 |
| 附件二进制正文 | R2 `ATTACHMENTS` 或 KV `ATTACHMENTS_KV` |
| Send 文件正文 | R2/KV，key 前缀为 `sends/` |

附件对象 key 使用：

```text
<cipherId>/<attachmentId>
```

Send 文件对象 key 使用：

```text
sends/<sendId>/<fileId>
```

## R2 优先

`src/services/blob-store.ts` 会优先选择 R2：

1. 如果绑定 `ATTACHMENTS`，使用 R2。
2. 否则如果绑定 `ATTACHMENTS_KV`，使用 KV。
3. 都没有绑定时，上传会报“Attachment storage is not configured”。

## 大小限制

NodeWarden 默认附件上限是 100 MB，但 KV 模式会被压到 25 MiB。原因是 Cloudflare KV 单对象有限制。

如果你希望稳定使用附件和 Send 文件，推荐 R2。

## 上传流程

官方客户端上传附件通常分两步：

1. `POST /api/ciphers/{cipherId}/attachment/v2` 创建附件元数据。
2. 客户端拿到带 token 的 upload URL，再上传二进制正文。

上传 token 是短期 JWT，包含：

- `userId`
- `cipherId`
- `attachmentId`
- `exp`

服务端会检查 token、密码项归属、附件归属，再把文件写入 R2/KV。

## 下载流程

下载也使用短期 token：

1. 已登录用户请求附件信息。
2. 服务端生成 5 分钟有效的下载 token。
3. 客户端访问 `/api/attachments/{cipherId}/{attachmentId}?token=...`。
4. 服务端验证 token、检查附件存在、读取 R2/KV。

下载 token 里有 `jti`。服务端用 `used_attachment_download_tokens` 表记录已使用的 jti，确保同一个下载 token 只能消费一次。

## 删除流程

删除密码项或附件时，服务端会先删除 R2/KV 对象，再删 D1 元数据。批量删除附件时使用小并发，避免 Worker 请求里一次性压太多存储操作。

