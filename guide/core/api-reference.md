# API 参考

本页汇总 NodeWarden 当前对外暴露的主要 HTTP 接口。它不是完整 Bitwarden Enterprise 协议清单，而是以当前代码实现为准，帮助排查客户端兼容、反向代理、备份和前端调用问题。

## 公开接口

这些接口不要求 Bearer token，但敏感接口仍会走公开限流、来源检查或一次性 token 校验。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/web-bootstrap`, `/web-bootstrap` | 网页端启动配置，包含 KDF 默认值、JWT_SECRET 风险状态、是否需要邀请注册。 |
| `GET` | `/config`, `/api/config` | Bitwarden 兼容配置，包含 API、Identity、Notifications、Icons 地址。 |
| `GET` | `/api/version` | 返回兼容服务端版本字符串。 |
| `POST` | `/identity/accounts/prelogin`, `/identity/accounts/prelogin/password` | 登录前读取用户 KDF 参数。 |
| `POST` | `/identity/connect/token` | 密码登录、refresh token、API Key `client_credentials` 登录。 |
| `POST` | `/identity/connect/revocation`, `/identity/connect/revoke` | 撤销 refresh token。 |
| `POST` | `/api/accounts/register` | 首次注册或邀请码注册。 |
| `POST` | `/api/accounts/password-hint` | 同源密码提示查询。 |
| `POST` | `/identity/accounts/recover-2fa`, `/api/accounts/recover-2fa` | 使用恢复码关闭 TOTP。 |
| `GET` | `/api/devices/knowndevice` | 官方客户端已知设备检查。 |
| `GET` | `/icons/{hostname}/icon.png` | 网站图标代理。 |
| `POST` | `/notifications/hub/negotiate` | SignalR negotiate 兼容入口。 |
| `GET` | `/notifications/hub` | Durable Object 通知 WebSocket。 |

## 账号与认证接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET`, `PUT` | `/api/accounts/profile` | 获取或更新个人资料。 |
| `POST`, `PUT` | `/api/accounts/password`, `/api/accounts/change-password` | 修改主密码、更新 key material、刷新 `securityStamp`。 |
| `POST` | `/api/accounts/keys` | 保存账号密钥材料。 |
| `GET`, `PUT`, `POST` | `/api/accounts/totp` | 获取或修改用户级 TOTP 状态。 |
| `POST` | `/api/accounts/totp/recovery-code`, `/api/two-factor/get-recover` | 获取或轮换 TOTP 恢复码。 |
| `GET` | `/api/accounts/revision-date` | 返回账号修订时间。 |
| `POST` | `/api/accounts/verify-password` | 校验主密码 hash。 |
| `PUT`, `POST` | `/api/accounts/verify-devices` | 开关设备验证。 |
| `POST` | `/api/accounts/api-key`, `/api/accounts/api_key` | 查看或创建个人 API Key。 |
| `POST` | `/api/accounts/rotate-api-key`, `/api/accounts/rotate_api_key` | 轮换个人 API Key，并清理旧 refresh token 会话。 |

## 密码库接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/sync` | 官方客户端全量同步入口。 |
| `GET`, `POST` | `/api/ciphers`, `/api/ciphers/create` | 获取或创建密码项。 |
| `GET`, `PUT`, `POST`, `DELETE` | `/api/ciphers/{id}` | 获取、更新或删除密码项。 |
| `PUT` | `/api/ciphers/{id}/delete` | 软删除到回收站。 |
| `DELETE` | `/api/ciphers/{id}/delete` | 永久删除。 |
| `PUT` | `/api/ciphers/{id}/restore` | 从回收站恢复。 |
| `PUT`, `POST` | `/api/ciphers/{id}/archive`, `/api/ciphers/{id}/unarchive` | 归档或取消归档。 |
| `PUT`, `POST` | `/api/ciphers/{id}/partial` | 局部更新。 |
| `POST`, `PUT` | `/api/ciphers/move` | 批量移动到文件夹。 |
| `POST` | `/api/ciphers/delete`, `/api/ciphers/delete-permanent`, `/api/ciphers/restore` | 批量软删、永久删除或恢复。 |
| `PUT`, `POST` | `/api/ciphers/archive`, `/api/ciphers/unarchive` | 批量归档或取消归档。 |
| `POST` | `/api/ciphers/import` | 导入密码库数据。 |

## 文件夹接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET`, `POST` | `/api/folders` | 获取或创建文件夹。 |
| `GET`, `PUT`, `DELETE` | `/api/folders/{id}` | 获取、更新或删除文件夹。 |
| `POST` | `/api/folders/delete` | 批量删除文件夹。 |

## 附件接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `POST` | `/api/ciphers/{id}/attachment/v2`, `/api/ciphers/{id}/attachment` | 创建附件元数据与上传 token。 |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/ciphers/{id}/attachment/{attachmentId}` | 下载、上传或删除附件。 |
| `POST`, `PUT` | `/api/ciphers/{id}/attachment/{attachmentId}/metadata` | 更新附件元数据。 |
| `POST` | `/api/ciphers/{id}/attachment/{attachmentId}/delete` | 删除附件兼容路径。 |
| `GET` | `/api/attachments/{cipherId}/{attachmentId}?token=...` | token 化公开下载附件。 |

## Send 接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET`, `POST` | `/api/sends` | 获取或创建 Send。 |
| `GET`, `PUT`, `DELETE` | `/api/sends/{id}` | 获取、更新或删除 Send。 |
| `POST` | `/api/sends/file/v2` | 创建文件 Send 元数据与上传 token。 |
| `GET`, `POST`, `PUT` | `/api/sends/{id}/file/{fileId}` | 获取上传地址或上传 Send 文件。 |
| `PUT`, `POST` | `/api/sends/{id}/remove-password`, `/api/sends/{id}/remove-auth` | 移除 Send 密码或访问认证。 |
| `POST` | `/api/sends/delete` | 批量删除 Send。 |
| `POST` | `/api/sends/access`, `/api/sends/access/{id}` | 公开访问 Send。 |
| `POST` | `/api/sends/access/file/{id}`, `/api/sends/{id}/access/file/{fileId}` | 公开访问文件 Send。 |
| `GET` | `/api/sends/{id}/{fileId}` | 公开下载文件 Send。 |

## 管理员接口

这些接口要求当前用户是管理员。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/admin/users` | 用户列表。 |
| `GET`, `POST`, `DELETE` | `/api/admin/invites` | 获取、创建或清空邀请码。 |
| `DELETE` | `/api/admin/invites/{code}` | 撤销单个邀请码。 |
| `PUT`, `POST` | `/api/admin/users/{id}/status` | 启用或封禁用户。 |
| `DELETE` | `/api/admin/users/{id}` | 删除用户并清理关联附件和 Send 文件。 |
| `POST` | `/api/admin/backup/export` | 导出实例备份。 |
| `POST` | `/api/admin/backup/import` | 导入实例备份。 |
| `GET`, `PUT` | `/api/admin/backup/settings` | 获取或保存备份中心设置。 |
| `GET`, `POST` | `/api/admin/backup/settings/repair` | 检查或修复备份设置加密状态。 |
| `POST` | `/api/admin/backup/run` | 立即执行配置好的远程备份。 |
| `GET` | `/api/admin/backup/remote` | 浏览远程备份列表。 |
| `GET` | `/api/admin/backup/remote/download` | 下载远程备份。 |
| `GET` | `/api/admin/backup/remote/integrity` | 检查远程备份完整性。 |
| `DELETE` | `/api/admin/backup/remote/file` | 删除远程备份文件。 |
| `POST` | `/api/admin/backup/remote/restore` | 从远程备份还原。 |

## 兼容占位接口

NodeWarden 没有实现完整组织、集合和企业策略模型。以下接口在读取场景下返回空列表或空结构，让官方客户端可以继续完成个人密码库工作流：

- `/api/collections`
- `/api/organizations`
- `/api/policies`
- `/api/auth-requests`

如果客户端行为依赖组织权限、集合共享、企业策略或 SSO，这些空响应不能代表功能可用。

