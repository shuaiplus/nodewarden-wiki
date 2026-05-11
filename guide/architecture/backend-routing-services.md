# 后端路由与服务层

后端是一个 Cloudflare Worker，不是传统长驻服务器。主线结构是：`index.ts` 负责入口和初始化，router 负责鉴权与分发，handler 负责协议行为，service 负责复用逻辑和持久化边界。

## 请求入口

`src/index.ts` 负责：

- 注册 `NotificationsHub` Durable Object。
- 区分静态资源和 API 请求。
- 规范化路径，兼容 hash route、重复斜杠和客户端路径差异。
- 调用 D1 schema 初始化。
- 把 API 请求交给 `handleRequest()`。
- 在 scheduled handler 中触发定时备份扫描。

数据库初始化失败时，普通 API 会返回错误，定时备份会跳过并记录日志，避免在 schema 不完整时继续写入。

## 路由分层

| 文件 | 职责 |
| --- | --- |
| `src/router.ts` | 总门面：CORS、请求体限制、公开路由、`JWT_SECRET` 检查、Bearer token 校验、限流、认证路由。 |
| `src/router-public.ts` | 登录前和公开访问接口，例如 config、prelogin、token、注册、密码提示、公开 Send、附件短 token、图标和通知 negotiate。 |
| `src/router-authenticated.ts` | 已登录用户接口，例如账号、密码库、文件夹、附件、Send、域名规则、设备和管理员分发。 |
| `src/router-devices.ts` | 设备列表、设备密钥、记住设备、信任状态和官方客户端设备兼容路径。 |
| `src/router-admin.ts` | 用户、邀请码、用户状态和删除用户。 |
| `src/router-admin-backup.ts` | 备份导出、导入、远程备份、远程浏览、完整性检查和恢复。 |

几个边界要记住：

- 公开路由不要求 Bearer token，但登录、注册、密码提示等仍有来源检查或限流。
- `JWT_SECRET` 缺失、使用示例值或长度不足时，认证 API 会被阻断。
- 附件、Send 文件、备份导入等大文件路径有单独限制，不走普通 JSON API 的同一套大小规则。
- 带 `X-NodeWarden-Import: 1` 的密码库导入和导入期间附件上传，会绕过普通认证 API 限流，避免大批量导入中途被限流打断。
- 未实现的组织、集合、策略等接口返回空兼容结构，不代表功能可用。

## Handler 层

`src/handlers/` 是协议行为层。这里应该做请求解析、业务调用和响应组装，不要把通用存储、加密、签名或备份规则散落在多个 handler 里。

| 领域 | 主要文件 |
| --- | --- |
| 账号与认证 | `accounts.ts`、`identity.ts`、`devices.ts` |
| 密码库 | `sync.ts`、`ciphers.ts`、`folders.ts`、`domains.ts` |
| 文件能力 | `attachments.ts`、`sends*.ts` |
| 管理能力 | `admin.ts`、`backup.ts` |
| 通知 | `notifications.ts` |

密码库相关 handler 要特别注意官方客户端兼容：未知字段保留、`EncString` 形状、revision 更新、stale update 防护和 `/api/sync` 输出必须一起考虑。

设备相关 handler 同时服务网页端和官方客户端。`knowndevice` 是登录前公开检查；设备列表、信任状态、设备 key、push token 和 clear-token 等操作在登录后处理，其中部分路径是为了兼容官方客户端不同版本的调用形状。

## Service 层

`src/services/` 是复用逻辑和持久化边界：

| 服务 | 职责 |
| --- | --- |
| `auth.ts` | access token、refresh token、API Key、`securityStamp` 校验。 |
| `storage*.ts` | D1 聚合服务、repository、schema 初始化、清理和 revision 更新。 |
| `blob-store.ts` | R2/KV blob 读写删除抽象。 |
| `ratelimit.ts` | 公开和认证 API 限流预算。 |
| `domain-rules.ts` | 全局和自定义等效域名规则合并。 |
| `backup-*.ts` | 备份 ZIP、还原、配置规范化、加密信封和远程上传。 |

`src/config/limits.ts` 是跨层共享的限制来源。token TTL、请求体大小、附件和 Send 文件上限、分页上限、限流预算、同步缓存和 Bitwarden 兼容版本都应该从这里确认，不要在 wiki 或 UI 里另写一套数字。

## 改动规则

- 新增 API 时，先判断它属于 public、authenticated 还是 admin。
- 新增持久字段时，同时检查 schema、backup、sync、导入导出和前端类型。
- 新增客户端兼容字段时，优先验证 `/identity/*` 和 `/api/sync`，不要只改网页端。
- 新增长任务时，优先复用通知中心和进度事件。
