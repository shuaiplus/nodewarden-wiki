# 限制与已知边界

NodeWarden 的目标是轻量自托管和常用官方客户端兼容，不是完整 Bitwarden Enterprise 服务端。部署前应先理解下面这些边界。

## Cloudflare 平台边界

NodeWarden 运行在 Cloudflare Workers 上，仍然受平台限制影响：

- JSON API 请求大小受 `src/config/limits.ts` 中 `request.maxBodyBytes` 限制。
- 附件和 Send 文件大小受 NodeWarden 自身限制和 Cloudflare 存储限制共同影响。
- KV 模式单对象上限更低，适合免绑卡和小附件；需要大附件应优先用 R2。
- 很大的导入任务可能受 Worker 执行时间、客户端超时或批量 SQL 限制影响，必要时应拆分导入。
- 定时备份适合后台长任务；不要把很长的工作流设计成一个一直打开的 HTTP 请求。

## 未实现的 Bitwarden 能力

当前不实现完整企业版能力：

- 组织
- 集合与集合成员权限
- 企业策略
- SSO
- SCIM
- 企业目录同步
- 组织事件日志
- 企业管理员密码重置
- 邮件发送式验证、邀请或密码提示流程

部分相关 API 会返回空列表，这是为了让个人密码库客户端流程继续走完，不代表这些功能已经实现。

## 部分支持的能力

| 能力 | 当前边界 |
| --- | --- |
| 登录 2FA | 支持用户级 TOTP、记住设备和恢复码；不覆盖官方所有 2FA provider。 |
| 通知 | 提供 Durable Object 通知中心，但不同客户端仍应以 `/api/sync` 为最终一致来源。 |
| API Key 登录 | 支持个人 API Key 的 `client_credentials` 登录；API Key 只负责认证，不能替代主密码解锁密码库。 |
| Passkey / FIDO2 字段 | 保留和展示密码项中的 FIDO2 兼容字段；不等同于完整账号级 WebAuthn 登录。 |
| 网站图标 | 通过上游图标服务代理，可能超时、缺失或回退到默认图标。 |
| 远程备份 | 支持 WebDAV 与 S3 兼容存储；具体稳定性仍取决于服务商的 WebDAV/S3 行为。 |

## 安全边界

- `JWT_SECRET` 必须长期稳定且足够强。缺失、示例值或过短密钥会阻止注册或认证 API。
- `users.master_password_hash` 只是服务端登录验证值，不是 vault 解密密钥。忘记主密码不能靠改数据库恢复。
- 密码提示会被查询接口返回，不能写主密码、恢复码、API Key 或任何能直接解锁密码库的信息。
- 备份目标里的 WebDAV/S3 密钥必须走备份设置加密信封，不应作为普通明文配置导出。
- 定期做离线或异地备份仍然必要。自托管不是免备份。

## 文档来源边界

以后以本 `wiki/` 目录、仓库 README、Release Notes 和源码为准。外部 AI 生成内容如果和这里冲突，应先按源码和本 Wiki 核对。

