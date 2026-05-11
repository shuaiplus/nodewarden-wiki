# 项目定位

NodeWarden 是运行在 Cloudflare Workers 上的 Bitwarden 兼容服务端。它不是 Bitwarden 官方服务端的完整克隆，而是把个人密码库、原创 Web Vault、附件、Send、导入导出、备份中心和管理能力放进一个轻量部署模型。

你可以把它理解成三个层次：

- **服务端兼容层**：提供 `/identity/*`、`/api/sync`、`/api/ciphers/*`、附件、Send、预登录、令牌刷新等官方客户端需要的接口。
- **网页密码库**：仓库内 `webapp/` 是原创前端，不依赖官方 Web Vault，支持密码库管理、导入导出、备份中心、管理员页面等功能。
- **Cloudflare 运行层**：Worker 处理 API 与静态资源，D1 保存结构化数据，R2/KV 保存附件与 Send 文件，Durable Object 用于实时通知。

## 适合谁

NodeWarden 适合想要自托管密码库、希望部署成本低、愿意使用 Cloudflare Workers 生态的人。它尤其适合个人、小团队和家庭实例。

它不适合需要企业组织、集合权限、SSO、SCIM、企业目录同步、官方商业支持的场景。NodeWarden 当前没有实现 Bitwarden 的组织/集合权限模型，所以不要把它当作企业版 Bitwarden 替代品。

## 和 Vaultwarden 的差异

Vaultwarden 是成熟的 Rust 服务端，适合传统服务器、Docker、数据库和自管反向代理环境。NodeWarden 的路线不同：它优先服务 Cloudflare Workers，部署方式更轻，运维面更小，同时把备份中心、Web Vault 和 Cloudflare 存储能力做成项目内置功能。

## 当前能力概览

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 官方客户端登录 | 支持 | 密码登录、refresh token、API key 登录均有实现。 |
| `/api/sync` | 支持 | 会返回 profile、folders、ciphers、domains、sends 和客户端需要的解密选项。 |
| 网页密码库 | 支持 | `webapp/` 提供原创 Web Vault。 |
| 附件 | 支持 | R2 优先，KV 可选；KV 单对象受 Cloudflare 25 MiB 限制。 |
| Send | 支持 | 文本 Send、文件 Send、公开访问令牌与访问次数控制。 |
| 导入导出 | 支持 | 支持 Bitwarden JSON/CSV/ZIP，以及 NodeWarden 扩展格式。 |
| 云端备份中心 | 支持 | WebDAV 与 S3 兼容存储，支持定时、保留策略、远程浏览与还原。 |
| 多用户 | 支持 | 第一个用户自动成为管理员，后续用户通过邀请码注册。 |
| 组织/集合 | 不支持 | 当前 `collections` 返回空数组，不做组织权限模型。 |

## 设计原则

NodeWarden 的代码里有几个长期原则：

- **兼容优先**：官方客户端可能会传入服务端暂时不理解的字段。密码项会尽量保留未知字段，避免客户端升级后数据被服务端抹掉。
- **密钥分层处理**：JWT_SECRET、备份目标密码、S3 Secret 等不能当作普通明文配置处理。
- **备份白名单**：实例级备份只导出明确列入白名单的表和字段，不把运行锁、临时令牌、审计日志等运行态数据带走。
- **失败可解释**：备份还原、附件恢复、JWT_SECRET 缺失、KV 大文件限制等场景都会尽量给出明确错误。

## 阅读路径

如果只是部署，先看：

- [快速开始](/guide/quick-start)
- [配置与密钥](/guide/deployment/configuration)
- [常见问题](/guide/operations/faq)

如果要改代码，先看：

- [整体架构](/guide/architecture/overview)
- [后端路由与服务层](/guide/architecture/backend-routing-services)
- [前端架构](/guide/architecture/frontend)
- [变更维护地图](/guide/architecture/change-map)
- [开发与代码约定](/guide/architecture/development)
