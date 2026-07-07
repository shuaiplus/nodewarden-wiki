# 更新与维护

NodeWarden 的更新重点是保持代码、D1 schema、前端资源和 JWT_SECRET 稳定。

各版本变更仅在 GitHub 的 [RELEASE_NOTES.md](https://github.com/shuaiplus/NodeWarden/blob/main/RELEASE_NOTES.md) 维护，wiki 不再单独写版本说明。

## Fork 用户要做什么

如果你 Fork 了仓库，在 GitHub 页面点击：

```text
Sync fork -> Update branch
```

然后等待 Cloudflare 重新部署。部署完成后，Worker 首次处理请求时会检查 D1 schema version；如果版本变化，会自动执行运行时 schema 初始化。

用户更新项目时通常不需要手动跑 SQL。真正需要确认的是：

- Cloudflare 绑定仍然存在，例如 `DB`、`JWT_SECRET`、`NOTIFICATIONS_HUB`、`ATTACHMENTS` 或 `ATTACHMENTS_KV`。
- `JWT_SECRET` 没有被重新生成。
- 部署日志里没有 D1 初始化失败。
- 大版本更新前已经做过一次可验证备份。

## 仓库里的 GitHub Actions

主仓库当前只有 **三个** workflow（`.github/workflows/`）。它们**不能代替**你在 GitHub 上对 fork 点的 **Sync fork → Update branch**；普通用户仍靠 fork 同步拉新版本。

| 文件 | Actions 里显示名称 | 触发 | 作用 |
| --- | --- | --- | --- |
| `codeql.yml` | CodeQL Advanced | 任意分支 push | CodeQL 分析 Actions 与 JS/TS（`security-extended`、`security-and-quality`）。 |
| `security-extra.yml` | Extra Security Scan | 任意分支 push | Gitleaks 密钥扫描（摘要与 artifact）+ OSV 依赖扫描（上传 SARIF，有漏洞则失败）。 |
| `sync-global-domains.yml` | Sync Bitwarden global domains | 每周一 cron 或手动 | 执行 `npm run domains:sync`，只改 `global_domains.bitwarden.json` 与 `.meta.json`，校验 `global_domains.custom.json` 未动，并开 PR。手动可填 `bitwarden_ref`（运行前会校验）。 |

旧文档里的 **Sync upstream**（`sync-upstream.yml`）**已不在当前仓库**。Fork 维护者请从 [shuaiplus/NodeWarden](https://github.com/shuaiplus/NodeWarden) 用 GitHub fork 同步或自己的 git 流程更新。

### 全局域名规则同步（维护者）

细节见 [域名规则](/zh/guide/core/domain-rules)。本地等价命令：

```powershell
npm run domains:sync
npm run domains:sync -- --ref main
```

`npm run deploy:kv` 会在 `wrangler deploy` 前执行 `scripts/ensure-kv.cjs`，确保 KV 命名空间绑定存在。

详细规则见 [域名规则](/zh/guide/core/domain-rules)。

## 更新不会要求手动迁移

项目的 D1 schema 初始化是运行时幂等执行的。`src/services/storage.ts` 里有 `STORAGE_SCHEMA_VERSION`，只要版本变化，Worker 会重新跑 `src/services/storage-schema.ts` 里的 SQL。

你需要关注的是：

- 部署日志里是否有数据库初始化失败。
- 新版本是否新增了必要绑定。
- 是否仍保留原来的 JWT_SECRET。

如果你是贡献者，改 schema 时必须同时更新：

- `migrations/0001_init.sql`
- `src/services/storage-schema.ts`
- `src/services/storage.ts` 里的 `STORAGE_SCHEMA_VERSION`

如果新增的是持久数据，还要继续检查 `backup-archive.ts`、`backup-import.ts` 和前端备份类型。否则新数据能写入，但备份无法完整恢复。

## 更新前建议做备份

更新前建议在备份中心手动导出一次实例备份。密码库类项目的数据价值远高于部署本身，更新前应先确保存在可验证的恢复点。

如果开启了远程定时备份，也建议手动点一次运行并确认成功。远程备份会记录最后成功时间、文件名、大小、路径和错误信息。

## 不要做的事

- 不要删除 D1 数据库再部署，除非你准备从备份恢复。
- 不要重置 JWT_SECRET。
- 不要把 `backup.settings.v1` 当普通 JSON 手改，当前它可能是加密信封。
- 不要手动清理 `attachments/` 目录下的远程备份附件，除非你确认没有任何备份 ZIP 还引用这些 blob。
- 不要手改 `src/static/global_domains.bitwarden.json` 这类生成文件来提交长期规则。
