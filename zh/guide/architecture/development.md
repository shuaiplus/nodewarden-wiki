# 开发与代码约定

如果还没判断清楚这次改动会牵动哪些文件，先看 [变更维护地图](/zh/guide/architecture/change-map)。这页只列命令和局部约定，真正的跨层影响要从维护地图里反推。

## npm 脚本与 `scripts/`

| npm 脚本 | 用途 | 对应脚本 / 说明 |
| --- | --- | --- |
| `dev` / `dev:kv` | 本地 Worker + 前端 | `wrangler dev`（`wrangler.toml` 或 `wrangler.kv.toml`）。 |
| `dev:demo` | 仅演示前端 | Vite 5174 端口，`demo` 模式。 |
| `build` | 生产前端 | Vite 输出到 `dist/`。 |
| `build:demo` | 演示静态站 | demo 构建 + `scripts/pages-spa-redirects.cjs`。 |
| `deploy` / `deploy:kv` | 发布 Worker | `deploy:kv` 先跑 `scripts/ensure-kv.cjs`。 |
| `deploy:demo` | Pages 演示 | `build:demo` 后 `wrangler pages deploy`。 |
| `domains:sync` | 同步 Bitwarden 全局域名 | `scripts/sync-global-domains.mjs`（可选 `--ref`）。 |
| `i18n` / `i18n:validate` | 多语言完整性 | `scripts/i18n-validate.cjs`（依赖 `i18n-utils.cjs`）。 |

没有 `sync-upstream` 脚本；fork 更新靠 GitHub / git 操作。

## 推荐检查命令

后端或共享代码改动：

```powershell
npx tsc -p tsconfig.json --noEmit
npm run build
```

前端文案或 i18n 改动：

```powershell
npm run i18n:validate
npx tsc -p webapp/tsconfig.json --noEmit
npm run build
```

wiki 改动：

```powershell
cd nodewarden-wiki
npm run build
```

## 高风险区域

这些区域改动要特别小心：

- `src/handlers/ciphers.ts`
- `src/handlers/sync.ts`
- `src/services/storage-cipher-repo.ts`
- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `src/services/backup-settings-crypto.ts`
- `src/handlers/identity.ts`
- `src/handlers/accounts.ts`
- `src/services/storage-schema.ts`

## i18n 原则

前端 locale 是独立完整包，不是英文包加增量覆盖。新增文案要同步所有 locale，并运行 i18n 校验。

## 备份变更原则

备份导出和导入是契约。新增持久数据时不要只改导出，也不要只改导入。至少要同步：

- payload 类型
- SQL 查询
- manifest tableCounts
- 内容验证
- shadow 表导入
- 前端计数类型

## 密码库字段原则

不要随意删未知字段。官方客户端可能已经依赖它们。密码项逻辑应继续遵守：

- 保留未知字段。
- 覆盖服务端拥有字段。
- 对关键加密字段做兼容规范化。
- 同步前过滤明显坏数据。
