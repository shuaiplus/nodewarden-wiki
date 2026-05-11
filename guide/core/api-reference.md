# API 参考

本页汇总当前主要 HTTP 接口，方便排查客户端兼容、前端调用和反向代理问题。完整行为仍以 `src/router*.ts` 与对应 handler 为准。

## 公开接口

公开接口不要求 Bearer token，但敏感路径仍会走限流、same-origin 检查或一次性 token 校验。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/web-bootstrap`, `/web-bootstrap` | 网页端启动配置和风险提示。 |
| `GET` | `/config`, `/api/config`, `/api/version` | Bitwarden 兼容配置和版本。 |
| `POST` | `/identity/accounts/prelogin`, `/identity/accounts/prelogin/password` | 登录前读取 KDF 参数。 |
| `POST` | `/identity/connect/token` | 密码、refresh token、API Key 登录，也承载 Send V2 的 `send_access` grant。 |
| `POST` | `/identity/connect/revocation`, `/identity/connect/revoke` | 撤销 refresh token。 |
| `POST` | `/api/accounts/register` | 首次注册或邀请码注册。 |
| `POST` | `/api/accounts/password-hint` | 同源密码提示查询。 |
| `POST` | `/identity/accounts/recover-2fa`, `/api/accounts/recover-2fa` | 使用恢复码关闭 TOTP。 |
| `GET` | `/api/devices/knowndevice` | 官方客户端已知设备检查。 |
| `PUT`, `POST` | `/api/devices/identifier/{id}/clear-token` | 登录前设备 token 清理兼容路径，返回空 200。 |
| `GET` | `/icons/{hostname}/icon.png` | 网站图标代理，细节见 [网站图标](/guide/core/website-icons)。 |
| `POST`, `GET` | `/notifications/hub/negotiate`, `/notifications/hub` | 通知 negotiate 和 WebSocket。 |

## 账号与认证

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET`, `PUT` | `/api/accounts/profile` | 获取或更新个人资料。 |
| `POST`, `PUT` | `/api/accounts/password`, `/api/accounts/change-password` | 修改主密码并刷新 `securityStamp`。 |
| `POST` | `/api/accounts/keys` | 保存账号密钥材料。 |
| `GET`, `PUT`, `POST` | `/api/accounts/totp` | 获取或修改用户级 TOTP 状态。 |
| `POST` | `/api/accounts/totp/recovery-code`, `/api/two-factor/get-recover` | 获取或轮换 TOTP 恢复码。 |
| `GET` | `/api/accounts/revision-date` | 返回账号修订时间。 |
| `POST` | `/api/accounts/verify-password` | 校验主密码 hash。 |
| `PUT`, `POST` | `/api/accounts/verify-devices` | 开关设备验证。 |
| `POST` | `/api/accounts/api-key`, `/api/accounts/api_key` | 查看或创建个人 API Key。 |
| `POST` | `/api/accounts/rotate-api-key`, `/api/accounts/rotate_api_key` | 轮换个人 API Key，并清理旧 refresh token。 |

## 密码库

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
| `GET`, `POST` | `/api/folders` | 获取或创建文件夹。 |
| `GET`, `PUT`, `DELETE` | `/api/folders/{id}` | 获取、更新或删除文件夹。 |
| `POST` | `/api/folders/delete` | 批量删除文件夹。 |

## 附件与 Send

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `POST` | `/api/ciphers/{id}/attachment/v2`, `/api/ciphers/{id}/attachment` | 创建附件元数据与上传 token。 |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/ciphers/{id}/attachment/{attachmentId}` | 下载、上传或删除附件。 |
| `POST`, `PUT` | `/api/ciphers/{id}/attachment/{attachmentId}/metadata` | 更新附件元数据。 |
| `POST` | `/api/ciphers/{id}/attachment/{attachmentId}/delete` | 删除附件兼容路径。 |
| `GET` | `/api/attachments/{cipherId}/{attachmentId}?token=...` | token 化公开下载附件。 |
| `POST`, `PUT` | `/api/ciphers/{id}/attachment/{attachmentId}?token=...` | token 化公开上传附件。 |
| `GET`, `POST` | `/api/sends` | 获取或创建 Send。 |
| `GET`, `PUT`, `DELETE` | `/api/sends/{id}` | 获取、更新或删除 Send。 |
| `POST` | `/api/sends/file/v2` | 创建文件 Send 元数据与上传 token。 |
| `GET`, `POST`, `PUT` | `/api/sends/{id}/file/{fileId}` | 获取上传地址或上传 Send 文件。 |
| `POST`, `PUT` | `/api/sends/{id}/file/{fileId}?token=...` | token 化公开上传 Send 文件。 |
| `PUT`, `POST` | `/api/sends/{id}/remove-password`, `/api/sends/{id}/remove-auth` | 移除 Send 密码或访问认证。 |
| `POST` | `/api/sends/delete` | 批量删除 Send。 |
| `POST` | `/api/sends/access`, `/api/sends/access/{id}` | 公开访问 Send。 |
| `POST` | `/api/sends/access/file/{id}`, `/api/sends/{id}/access/file/{fileId}` | 公开访问文件 Send。 |
| `GET` | `/api/sends/{id}/{fileId}` | 公开下载文件 Send。 |

## 域名规则与设备

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET`, `PUT`, `POST` | `/api/settings/domains`, `/settings/domains` | 获取或保存用户域名匹配规则。 |
| `GET`, `DELETE` | `/api/devices` | 获取设备列表或删除当前用户全部设备。 |
| `GET`, `DELETE` | `/api/devices/authorized` | 获取或清空已记住的 2FA 设备。 |
| `DELETE` | `/api/devices/authorized/{id}` | 撤销单个已记住设备。 |
| `GET`, `DELETE` | `/api/devices/{id}` | 获取或删除单个设备。 |
| `PUT` | `/api/devices/{id}/name` | 更新设备显示名。 |
| `GET` | `/api/devices/identifier/{id}` | 按 device identifier 查询设备。 |
| `PUT`, `POST` | `/api/devices/{id}/keys`, `/api/devices/identifier/{id}/keys` | 更新设备加密 key。 |
| `PUT`, `POST` | `/api/devices/identifier/{id}/token` | 更新设备 push token。 |
| `PUT`, `POST` | `/api/devices/identifier/{id}/web-push-auth` | 更新 Web Push 认证信息。 |
| `PUT`, `POST` | `/api/devices/identifier/{id}/clear-token` | 清理设备 token。 |
| `POST` | `/api/devices/{id}/retrieve-keys` | 获取设备密钥材料兼容接口。 |
| `POST`, `DELETE` | `/api/devices/{id}/deactivate` | 停用设备。 |
| `POST` | `/api/devices/update-trust`, `/api/devices/untrust` | 更新或撤销设备信任状态。 |

## 管理员接口

管理员接口要求当前用户是 admin。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/admin/users` | 用户列表。 |
| `GET`, `POST`, `DELETE` | `/api/admin/invites` | 获取、创建或清空邀请码。 |
| `DELETE` | `/api/admin/invites/{code}` | 撤销单个邀请码。 |
| `PUT`, `POST` | `/api/admin/users/{id}/status` | 启用或封禁用户。 |
| `DELETE` | `/api/admin/users/{id}` | 删除用户并清理关联附件和 Send 文件。 |
| `POST` | `/api/admin/backup/export`, `/api/admin/backup/import` | 导出或导入实例备份。 |
| `GET` | `/api/admin/backup/blob` | 本地完整导出时下载附件 blob，供前端重新打包 ZIP。 |
| `GET`, `PUT` | `/api/admin/backup/settings` | 获取或保存备份中心设置。 |
| `GET`, `POST` | `/api/admin/backup/settings/repair` | 检查或修复备份设置加密状态。 |
| `POST` | `/api/admin/backup/run` | 立即执行远程备份。 |
| `GET` | `/api/admin/backup/remote` | 浏览远程备份列表。 |
| `GET` | `/api/admin/backup/remote/download` | 下载远程备份。 |
| `GET` | `/api/admin/backup/remote/integrity` | 检查远程备份完整性。 |
| `DELETE` | `/api/admin/backup/remote/file` | 删除远程备份文件。 |
| `POST` | `/api/admin/backup/remote/restore` | 从远程备份还原。 |

## 兼容占位

NodeWarden 没有实现完整组织、集合和企业策略模型。`/api/collections`、`/api/organizations`、`/api/policies`、`/api/auth-requests` 在读取场景下会返回空列表或空结构，只用于保证个人密码库工作流继续运行。
