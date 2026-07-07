# 限制与已知边界

NodeWarden 的目标是轻量自托管和常用官方客户端兼容，不是完整 Bitwarden Enterprise 服务端。部署前先确认这些边界能接受。

## Cloudflare 平台边界

NodeWarden 运行在 Cloudflare Workers 上，受平台限制影响：

- JSON API 请求大小受 `src/config/limits.ts` 中 `request.maxBodyBytes` 限制。
- 附件和 Send 文件大小受 NodeWarden 自身限制和 Cloudflare 存储限制共同影响。
- KV 模式单对象上限更低，适合免绑卡和小附件；需要大附件应优先用 R2。
- 很大的导入任务可能受 Worker 执行时间、客户端超时或批量 SQL 限制影响，必要时拆分导入。
- 长任务优先走后台流程和进度通知，不适合设计成一个长时间打开的 HTTP 请求。

## 未实现的 Bitwarden 能力

当前不实现这些企业版能力：

- 组织
- 集合与集合成员权限
- 企业策略
- SSO
- SCIM
- 企业目录同步
- 组织事件日志
- 企业管理员密码重置
- 邮件发送式验证、邀请或密码提示流程（相关 API 可能返回明确的**不支持**）

部分相关 API 会返回空列表，这是为了让个人密码库客户端流程继续走完，不代表功能可用。

## 部分支持的能力

| 能力 | 当前边界 |
| --- | --- |
| 登录 2FA | 用户级 **TOTP**、**YubiKey OTP**、**通行密钥 2FA**、记住设备、恢复码；不覆盖官方所有 2FA provider。 |
| Passkey 登录 | 账户级 WebAuthn/FIDO2 登录与可选保险库解锁（PRF）。见 [Passkey 登录](/zh/guide/security/passkey-login)。 |
| 登录请求 | 批准/拒绝免密与跨设备流程；见 [登录请求](/zh/guide/core/login-requests)。 |
| 通知 | 提供 Durable Object 通知中心，但不同客户端仍应以 `/api/sync` 为最终一致来源。 |
| API Key 登录 | 支持个人 API Key 的 `client_credentials`；服务端以哈希存储密钥；不能替代主密码解锁密码库。 |
| 扩展条目类型 | 银行账户、驾驶证、护照、SSH、FIDO2 等；须满足 EncString 校验。 |
| 条目 TOTP | 贴近 Bitwarden 的 TOTP 与 `steam://` URI。 |
| 网站图标 | **默认始终开启**；代理上游并限制隐私。见 [网站图标](/zh/guide/core/website-icons)。已移除 `WEBSITE_ICONS_ENABLED`。 |
| 远程备份 | WebDAV/S3（R2、B2、Tigris 预设）；完整恢复有导入锁与 ZIP 校验和。 |
| Fill-assist | `POST /fill-assist` 辅助自动填充；不能绕过保险库解锁。 |

## 安全边界

- `JWT_SECRET` 必须长期稳定且足够强。缺失、示例值或过短密钥会阻止注册或认证 API。
- `users.master_password_hash` 只是服务端登录验证值，不是 vault 解密密钥。忘记主密码不能靠改数据库恢复。
- 密码提示会被查询接口返回，不能写主密码、恢复码、API Key 或任何能直接解锁密码库的信息。
- 备份目标里的 WebDAV/S3 密钥必须走备份设置加密信封，不应作为普通明文配置导出。
- 定期做离线或异地备份仍然必要。自托管不是免备份。

## 修改边界

- 新增持久数据时，要同步检查 schema、备份、导入还原和同步响应。
- 新增客户端兼容字段时，以官方客户端实际请求和 `/api/sync` 解析结果为准。
- 新增安全配置时，先判断它属于 Cloudflare Secret、D1 加密配置，还是不该持久化的运行态数据。