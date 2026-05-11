# 后端路由与服务层

NodeWarden 后端不是传统长驻服务器，而是一个 Cloudflare Worker。它的核心结构是：入口负责规范化和初始化，路由负责鉴权与分发，handlers 负责协议行为，services 负责存储、加密、备份、限流等可复用逻辑。

## Worker 入口

`src/index.ts` 是 Worker 入口，承担几件基础工作：

- 注册 `NotificationsHub` Durable Object。
- 区分静态资源请求和 API 请求。
- 规范化请求路径，兼容 hash route、重复斜杠和客户端路径差异。
- 调用 D1 schema 初始化，确保新部署或升级后的数据库可用。
- 将 API 请求交给 `handleRequest()`。
- 在 scheduled handler 里触发 `runScheduledBackupIfDue()`。

如果数据库初始化失败，普通 API 会返回错误，定时备份会跳过并记录日志，避免在 schema 不完整时继续写入。

## 总路由

`src/router.ts` 是所有 API 请求的统一门面。

处理顺序大致是：

```text
OPTIONS CORS
请求体大小限制
公开路由 handlePublicRoute()
JWT_SECRET 安全检查
Bearer token 校验
用户状态检查
认证 API 限流
认证路由 handleAuthenticatedRoute()
404
```

这里有两个重要边界：

- `JWT_SECRET` 缺失、使用示例值或长度不足时，会阻止认证 API 继续执行。
- 普通 JSON API 有统一请求体大小限制；附件、Send 文件、备份导入等大文件路径单独处理。

## 公开路由

`src/router-public.ts` 处理不需要 Bearer token 的接口，但“不需要登录”不等于“不做保护”。

公开路由包括：

- `/api/web-bootstrap`：网页端启动参数和 JWT_SECRET 风险提示。
- `/config`、`/api/config`、`/api/version`：官方客户端配置发现。
- `/identity/accounts/prelogin`：KDF 参数。
- `/identity/connect/token`：密码登录、refresh token、API Key 登录。
- `/api/accounts/register`：首次注册和邀请码注册。
- `/api/accounts/password-hint`：同源密码提示查询。
- `/api/sends/access*`：公开 Send 访问。
- `/api/attachments/{cipherId}/{attachmentId}?token=...`：附件短 token 下载。
- `/icons/{hostname}/icon.png`：网站图标代理。
- `/notifications/hub/negotiate`、`/notifications/hub`：通知连接。

注册和密码提示有 same-origin 检查，登录、预登录、密码提示等敏感公开接口还有更严格的公开限流。

## 认证路由

`src/router-authenticated.ts` 是已登录用户的主路由，负责把请求分到账号、密码库、文件夹、附件、Send、域名规则、设备和管理员模块。

它还承担一些兼容策略：

- 拒绝未实现的账号危险操作，例如删除账号、删除整个 vault。
- 对 `/api/collections`、`/api/organizations`、`/api/policies`、`/api/auth-requests` 返回空兼容结构。
- 支持多个官方客户端历史路径别名，例如 `api_key` / `api-key`、`change-password` / `password`。
- 管理员路由最后分发，避免普通用户误进管理接口。

## 管理员路由

管理员接口分两层：

- `src/router-admin.ts`：用户、邀请码、用户状态和删除用户。
- `src/router-admin-backup.ts`：备份导出、导入、远程备份、远程浏览、完整性检查和恢复。

管理员删除用户时不只是删 D1 记录，还会先清理该用户关联的附件和文件 Send blob，避免 R2/KV 留下孤儿对象。

## Handler 层

`src/handlers/` 是协议行为层。每个文件对应一个业务域：

| 文件 | 职责 |
| --- | --- |
| `accounts.ts` | 注册、profile、改密码、TOTP、恢复码、密码提示、API Key。 |
| `identity.ts` | 登录、refresh token、API Key `client_credentials`、预登录、撤销。 |
| `ciphers.ts` | 密码项 CRUD、归档、回收站、批量操作、字段兼容。 |
| `folders.ts` | 文件夹 CRUD 和批量删除。 |
| `sync.ts` | `/api/sync` 全量同步响应。 |
| `attachments.ts` | 附件元数据、上传、下载、token、删除。 |
| `sends*.ts` | Send 私有操作、公开访问、文件上传下载。 |
| `devices.ts` | 设备识别、授权设备、信任清理。 |
| `domains.ts` | 等效域名规则读取和保存。 |
| `backup.ts` | 实例备份、远程备份、定时备份、恢复和完整性检查。 |
| `admin.ts` | 用户管理、邀请码、封禁和删除。 |
| `notifications.ts` | SignalR negotiate 和 Durable Object 连接。 |

Handler 应该尽量保持“协议入口”定位：解析请求、调用 service、组装响应，不要把通用存储或加密规则散落在多个 handler 里。

## Service 层

`src/services/` 是复用逻辑和持久化边界。

| 服务 | 职责 |
| --- | --- |
| `auth.ts` | access token、refresh token、API Key、securityStamp 校验。 |
| `storage.ts` | D1 聚合服务、schema 版本、清理、revision 更新。 |
| `storage-*-repo.ts` | 按表或领域拆开的 D1 repository。 |
| `storage-schema.ts` | 幂等 schema 初始化和迁移补齐。 |
| `blob-store.ts` | R2/KV blob 读写删除抽象。 |
| `ratelimit.ts` | 公开和认证 API 限流预算。 |
| `domain-rules.ts` | 全局和自定义等效域名规则合并。 |
| `backup-archive.ts` | 实例备份 ZIP、manifest、内容校验。 |
| `backup-import.ts` | shadow 表还原、校验、附件恢复。 |
| `backup-config.ts` | 备份设置规范化，兼容旧 `e3` 到 `s3`。 |
| `backup-settings-crypto.ts` | 备份目标配置加密信封。 |
| `backup-uploader.ts` | WebDAV 与 S3 上传、下载、列目录和删除。 |

## 修改建议

- 新增 API 路径时，先判断它是 public、authenticated 还是 admin，再放进对应 router。
- 新增持久字段时，同步检查 schema、backup、sync、导入导出和前端类型。
- 新增客户端兼容字段时，不要只改网页端；官方客户端主要看 `/identity/*` 和 `/api/sync`。
- 新增后台长任务时，优先复用通知中心和备份进度事件，不要让前端靠固定时间盲等。

