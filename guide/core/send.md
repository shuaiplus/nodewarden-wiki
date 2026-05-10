# Send 与公开访问

Send 用于生成临时分享。NodeWarden 支持文本 Send 和文件 Send。

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

## 公开访问 token

公开访问不是直接暴露主账号 token。服务端会针对 Send 生成短期 access token，类型是 `send_access`，默认 5 分钟有效。

文件上传和下载也有独立短 token，和附件类似，用 JWT_SECRET 签名。

## 访问次数

`StorageService.incrementSendAccessCount()` 会原子增加访问次数。如果 Send 配置了最大访问次数，达到上限后访问会失败。

## 删除日期

Send 有删除日期。当前配置限制最远删除日期为 31 天，避免长期公开分享成为永久风险。

## 备份边界

当前实例级备份不导出 `sends` 表，也不导出 Send 文件正文。备份章节会单独说明这个边界。

