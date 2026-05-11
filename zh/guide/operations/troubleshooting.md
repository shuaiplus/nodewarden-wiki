# 排错清单

## 部署后 API 500

检查：

- D1 是否绑定为 `DB`。
- JWT_SECRET 是否存在、长度是否至少 32。
- JWT_SECRET 是否仍是示例值。
- Worker 日志里是否有数据库初始化错误。
- `NOTIFICATIONS_HUB` Durable Object 是否迁移/绑定成功。

## 注册失败

常见原因：

- JWT_SECRET 弱或缺失。
- 邮箱格式错误。
- 前端没有提交 publicKey / encryptedPrivateKey。
- KDF 参数低于最低要求。
- 后续用户没有邀请码。

## 官方客户端登录失败

检查：

- 服务器 URL 不要带 `/api`。
- 客户端是否能访问 `/identity/accounts/prelogin`。
- 密码是否正确。
- TOTP 是否需要。
- 账号是否被禁用。
- 登录失败次数是否触发临时锁定。

## 同步成功但客户端打不开库

重点检查：

- 某条 cipher 的 `name` 是否不是有效 EncString。
- 附件 `fileName` 是否不是有效 EncString。
- SSH key 是否缺 `keyFingerprint`。
- `UserDecryptionOptions` 是否被改坏。
- 最近是否导入了异常数据。

## 附件下载 401

可能原因：

- 下载 token 过期。
- token 已被使用过一次。
- JWT_SECRET 变了。
- cipherId 或 attachmentId 不匹配。

## 远程备份失败

检查：

- WebDAV URL 是否以 `http://` 或 `https://` 开头。
- WebDAV 用户名/密码是否正确。
- S3 endpoint、bucket、access key、secret key 是否完整。
- 远程路径是否有权限创建目录。
- Worker 是否能访问目标存储。
- 是否已有备份/还原任务占用运行锁。

## 还原失败

检查：

- ZIP 是否来自 NodeWarden 实例备份。
- 文件名 hash 是否匹配。
- 目标实例是否已有 vault/send 数据，是否需要勾选 replace existing。
- 附件存储是否绑定。
- KV 模式是否遇到大附件。

