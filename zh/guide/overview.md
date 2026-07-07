# 项目定位

NodeWarden 是运行在 Cloudflare Workers 上的 Bitwarden 兼容服务端。它不是 Bitwarden 官方服务端的完整克隆，而是把个人密码库、原创 Web Vault、附件、Send、导入导出、备份中心和管理能力放进一个轻量部署模型。

你可以把它理解成三个层次：

- **服务端兼容层**：提供 `/identity/*`、`/api/sync`、`/api/ciphers/*`、附件、Send、预登录、令牌刷新、登录请求、fill-assist 等官方客户端需要的接口。
- **网页密码库**：仓库内 `webapp/` 是原创前端，不依赖官方 Web Vault，支持密码库管理、导入导出、备份中心、设备与安全设置、管理员页面等。
- **Cloudflare 运行层**：Worker 处理 API 与静态资源，D1 保存结构化数据，R2/KV 保存附件与 Send 文件，Durable Object 用于实时通知。

## 适合谁

NodeWarden 适合想要自托管密码库、希望部署成本低、愿意使用 Cloudflare Workers 生态的人。它尤其适合个人、小团队和家庭实例。

它不适合需要企业组织、集合权限、SSO、SCIM、企业目录同步、官方商业支持的场景。NodeWarden 当前没有实现 Bitwarden 的组织/集合权限模型，所以不要把它当作企业版 Bitwarden 替代品。

## 和 Vaultwarden 的差异

Vaultwarden 是成熟的 Rust 服务端，适合传统服务器、Docker、数据库和自管反向代理环境。NodeWarden 的路线不同：它优先服务 Cloudflare Workers，部署方式更轻，运维面更小，同时把备份中心、Web Vault 和 Cloudflare 存储能力做成项目内置功能。

## 当前能力概览

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 官方客户端登录 | 支持 | 密码登录、refresh token、API key、Passkey 登录。 |
| 登录请求 | 支持 | 在另一台设备批准免密或跨设备登录。见 [登录请求](/zh/guide/core/login-requests)。 |
| `/api/sync` | 支持 | 返回 profile、folders、ciphers（含扩展类型）、domains、sends 与解密选项。 |
| 网页密码库 | 支持 | 原创 UI；设备管理在 **设置 → 安全**；支持全屏。 |
| TOTP（条目 + 2FA） | 支持 | 用户级 2FA；条目 TOTP 含 `steam://`；Web 端可上传二维码。 |
| 两步验证提供商 | 支持 | TOTP、YubiKey OTP、通行密钥 2FA、恢复码、记住设备。 |
| 附件 | 支持 | R2 优先，KV 可选；KV 单对象受 Cloudflare 25 MiB 限制。 |
| Send | 支持 | 文本/文件 Send、密码保护 Send、公开令牌与访问次数。 |
| 导入导出 | 支持 | Bitwarden JSON、CSV（多行/自定义字段）、ZIP、NodeWarden 扩展格式。 |
| 云端备份中心 | 支持 | WebDAV/S3（含 R2、B2、Tigris 预设）、定时、保留、远程浏览、带校验和的恢复。 |
| 多用户 | 支持 | 首用户为管理员；后续用户通常凭邀请码注册。 |
| 网站图标 | 支持 | 默认开启；为 Web 列表代理站点图标。 |
| PWA / 离线 | 支持 | 可安装的 Web 保险库与离线相关流程。 |
| 组织/集合 | 不支持 | `collections` 返回空数组，无组织权限模型。 |

## 设计原则

NodeWarden 的代码里有几个长期原则：

- **兼容优先**：官方客户端可能会传入服务端暂时不理解的字段。密码项会尽量保留未知字段，避免客户端升级后数据被服务端抹掉。
- **密钥分层处理**：JWT_SECRET、备份目标密码、S3 Secret 等不能当作普通明文配置处理。
- **备份白名单**：实例备份只导出明确允许的表和字段；运行锁、临时令牌、审计日志等运行态数据默认不进备份。
- **可解释失败**：恢复失败、附件缺失、JWT_SECRET 错误、KV 大文件限制等情况尽量给出清晰错误。

## 阅读路线

只想部署和使用：

- [入门路线](/zh/guide/start)

已在运维实例：

- [维护路线](/zh/guide/operate)

准备改代码或贡献：

- [贡献者路线](/zh/guide/contribute)