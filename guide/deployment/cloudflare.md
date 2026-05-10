# Cloudflare 部署

NodeWarden 的默认部署目标是 Cloudflare Workers。仓库会把前端构建到 `dist/`，Worker 同时处理 API 和静态资源。

## 运行结构

```text
浏览器 / 官方客户端
        |
        v
Cloudflare Worker
  |-- 静态资源 ASSETS -> dist/
  |-- API 路由 -> src/router.ts
  |-- D1 -> 账号、密码项、文件夹、附件元数据、Send、配置
  |-- R2/KV -> 附件与 Send 文件正文
  |-- Durable Object -> 前端实时通知
```

`src/index.ts` 会先尝试用 `ASSETS` 返回前端资源。属于 `/api/`、`/identity/`、`/icons/`、`/notifications/`、`/.well-known/`、`/config` 等路径的请求会交给 Worker API 处理。

## wrangler.toml 绑定

默认 `wrangler.toml` 使用这些绑定：

```toml
name = "nodewarden"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[assets]
binding = "ASSETS"
directory = "./dist"
not_found_handling = "single-page-application"
run_worker_first = false

[triggers]
crons = [ "*/5 * * * *" ]

[[d1_databases]]
binding = "DB"
database_name = "nodewarden-db"

[[durable_objects.bindings]]
name = "NOTIFICATIONS_HUB"
class_name = "NotificationsHub"

[[r2_buckets]]
binding = "ATTACHMENTS"
bucket_name = "nodewarden-attachments"
```

`crons = [ "*/5 * * * *" ]` 会每 5 分钟唤起一次 scheduled handler。真正是否执行备份，由备份配置里的时区、开始时间、间隔和上次运行时间决定。

## 必需资源

| 绑定 | 必需 | 用途 |
| --- | --- | --- |
| `DB` | 是 | D1 数据库，保存结构化数据。 |
| `JWT_SECRET` | 是 | JWT、附件短链、Send 短链、备份配置 runtime 加密都会用到。 |
| `NOTIFICATIONS_HUB` | 是 | 用于网页端实时同步、备份进度通知。 |
| `ASSETS` | 是 | 部署网页前端静态资源。 |
| `ATTACHMENTS` | 推荐 | R2 附件和 Send 文件存储。 |
| `ATTACHMENTS_KV` | 可选 | KV 附件和 Send 文件存储 fallback。 |

## 数据库自动初始化

NodeWarden 不要求你手动执行 SQL。Worker 第一次处理请求时会调用：

- `src/index.ts` -> `ensureDatabaseInitialized()`
- `src/services/storage.ts` -> `initializeDatabase()`
- `src/services/storage-schema.ts` -> `ensureStorageSchema()`

初始化逻辑会先创建 `config` 表，然后读取 `config.schema.version`。如果版本不同，会运行一批幂等 SQL，并把新版本写回 `config` 表。

这意味着更新后只要 schema 版本变了，现有实例会自动补齐表、列和索引。

## R2 部署

R2 是推荐模式。优点是大文件限制更宽松，附件和 Send 文件不用塞进 D1。

```powershell
npm run deploy
```

确保 Cloudflare 项目里有 R2 bucket，并且绑定名称叫 `ATTACHMENTS`。

## KV 部署

KV 模式适合不想绑卡、只需要小附件的实例。

```powershell
npm run deploy:kv
```

KV 模式使用 `wrangler.kv.toml`，绑定名是 `ATTACHMENTS_KV`。代码会把单个对象限制压到 Cloudflare KV 的 25 MiB 以内。

## Demo 部署

仓库有 Demo 专用脚本：

```powershell
npm run deploy:demo
```

这个脚本会先执行 `npm run build:demo`，再把 `dist` 部署到 Pages 项目。正式实例不要用 Demo 模式保存真实数据。

