# 变更维护地图

这页不是功能说明，而是给维护者和贡献者用的改动地图。改 NodeWarden 时，先判断“用户会做什么”，再顺着请求、存储、同步、备份、前端状态和自动化边界一起看。

## 先判断改动属于哪一类

| 改动类型 | 主要入口 | 必须一起检查 |
| --- | --- | --- |
| 登录、注册、主密码、API Key | `src/handlers/identity.ts`、`src/handlers/accounts.ts`、`src/services/auth.ts` | `securityStamp`、refresh token、设备记录、官方客户端响应字段、网页端 `app-auth.ts`。 |
| 密码项、文件夹、同步 | `src/handlers/ciphers.ts`、`src/handlers/folders.ts`、`src/handlers/sync.ts` | revision date、`cipherToResponse()`、未知字段透传、导入导出、`/api/sync` 缓存、前端解密。 |
| 附件 | `src/handlers/attachments.ts`、`src/services/blob-store.ts` | D1 附件元数据、R2/KV blob、短 token、一次性下载 jti、备份附件恢复。 |
| Send | `src/handlers/sends*.ts`、`src/services/storage-send-repo.ts` | 公开访问 token、密码校验、文件 blob、访问次数、删除日期、备份边界。 |
| 域名规则 | `src/handlers/domains.ts`、`src/services/domain-rules.ts` | 静态规则文件、用户排除项、D1 `domain_settings`、全局域名同步 Action。 |
| 网站图标 | `src/router-public.ts`、`webapp/src/components/vault/WebsiteIcon.tsx` | 上游源顺序、fallback、缓存 TTL、前端懒加载和错误缓存。 |
| 实时通知 | `src/durable/notifications-hub.ts`、`src/handlers/notifications.ts`、`webapp/src/App.tsx` | SignalR handshake、用户 DO、设备定向、vault sync 和备份进度。 |
| 备份中心 | `src/handlers/backup.ts`、`src/services/backup-*.ts`、`shared/backup-schema.ts` | 运行锁、配置加密信封、ZIP manifest、远程附件索引、导入 shadow 表、审计日志。 |
| 数据库 schema | `migrations/0001_init.sql`、`src/services/storage-schema.ts`、`src/services/storage.ts` | schema version、备份导出导入、前端类型、旧实例自动补齐。 |
| 前端页面或流程 | `webapp/src/App.tsx`、`webapp/src/components/*`、`webapp/src/lib/api/*` | 路由、移动端、深色主题、i18n、React Query 刷新、后台预加载。 |
| 文案和语言 | `webapp/src/lib/i18n/*` | 所有 locale 必须完整更新，并运行 `npm run i18n:validate`。 |

如果一个改动跨了持久数据、官方客户端响应或备份恢复，不要只改一层。NodeWarden 的很多 bug 都不是单文件问题，而是“保存了、同步没出”“同步出了、备份没带”“前端能用、官方客户端不认”。

## 一次用户操作会怎么流动

典型登录后操作的路径是：

```text
前端组件
  -> webapp/src/lib/api/*
  -> src/router.ts
  -> src/router-authenticated.ts 或 router-admin*.ts
  -> src/handlers/*
  -> src/services/*
  -> D1 / R2 / KV / Durable Object
  -> response
  -> React Query invalidate/refetch 或本地状态更新
```

官方客户端不会走网页端组件，但会走相同的 Worker API。只在 `webapp/` 里修通，不代表官方客户端修通；只在 handler 里返回字段，不代表网页端解密、缓存和移动端状态已经跟上。

## 持久数据改动要看什么

新增或改变持久数据时，按这个顺序查：

1. `migrations/0001_init.sql` 是否需要新增表、列或索引。
2. `src/services/storage-schema.ts` 是否同步写了幂等 SQL。
3. `src/services/storage.ts` 的 `STORAGE_SCHEMA_VERSION` 是否 bump。
4. `src/services/storage-*-repo.ts` 是否负责读写这个字段。
5. `src/services/backup-archive.ts` 是否导出。
6. `src/services/backup-import.ts` 是否导入、校验、shadow 表恢复。
7. `shared/backup-schema.ts` 或前端备份类型是否需要更新。
8. `/api/sync` 或前端 query 是否需要带出。
9. 是否需要写审计日志，或避免进入实例备份。

运行态数据默认不进备份。例如 refresh token、设备会话、登录失败限流、一次性下载 token、备份运行锁和审计日志都不应该被当作可迁移数据。

## 自动化会改哪些文件

| 自动化 | 触发方式 | 会改什么 | 不应该改什么 |
| --- | --- | --- | --- |
| `CodeQL Advanced`（`codeql.yml`） | 任意分支 push | GitHub Security 中的 CodeQL 结果。 | 业务源码。 |
| `Extra Security Scan`（`security-extra.yml`） | 任意分支 push | Gitleaks + OSV 报告/SARIF/artifacts。 | 业务源码。 |
| `Sync Bitwarden global domains`（`sync-global-domains.yml`） | 每周一 cron 或手动 `bitwarden_ref` | 通过 PR 更新 `global_domains.bitwarden.json`、`.meta.json`。 | `global_domains.custom.json`。 |
| `npm run domains:sync` | 本地或上述 Action | 与 Action 相同的 Bitwarden 域名生成 JSON。 | `global_domains.custom.json`。 |
| `npm run deploy:kv` | 本地/CI 部署 | `scripts/ensure-kv.cjs` 后部署 `wrangler.kv.toml`。 | D1 用户数据。 |
| `npm run build` | 本地或 Cloudflare 构建 | `dist/` 前端资源。 | 不代表远端已跑 D1 schema。 |
| `cd nodewarden-wiki && npm run build` | 本地 wiki | VitePress 产物。 | 不代表主应用构建通过。 |

Fork 用户用 **GitHub Sync fork** 更新代码；仓库内已无 upstream 自动同步 workflow。

贡献者提交 PR 时要分清楚：生成文件由 Action 更新，项目自定义文件由人工 PR 更新，用户个人设置由 D1 保存。

## 改后应该跑什么

| 改动 | 建议检查 |
| --- | --- |
| 后端、共享类型、schema | `npx tsc -p tsconfig.json --noEmit`，`npm run build`。 |
| 前端组件、路由、样式 | `npx tsc -p webapp/tsconfig.json --noEmit`，`npm run build`，至少检查桌面和移动端。 |
| i18n | `npm run i18n:validate`，再 `npm run build`。 |
| wiki | `cd nodewarden-wiki` 后运行 `npm run build`。 |
| 备份恢复 | 本地导出、远程备份、hash 校验、fresh instance 和 replace existing 分支都要想清楚。 |
| 官方客户端兼容 | 看 `/identity/connect/token`、`/api/sync`、附件/Send direct upload 响应 shape。 |

检查命令不是越多越好。关键是让命令覆盖这次改动真正影响的契约。

## 写 wiki 时应该写到什么程度

好的 NodeWarden wiki 页应该回答这些问题：

- 用户在哪里操作。
- 请求会打到哪个 API。
- 哪些 handler 和 service 负责处理。
- 数据写进 D1、R2/KV、Durable Object 还是静态文件。
- 是否更新 revision date、`securityStamp`、refresh token、审计日志或备份 runtime。
- 贡献者要改哪个文件，哪些文件是生成的。
- GitHub Action 或脚本会自动改哪些文件。
- 失败时用户会看到什么，维护者应该查哪里。

只写“支持某功能”不够。NodeWarden 的 wiki 应该让人知道这个功能为什么这样设计，以及改它时哪里会一起动。
