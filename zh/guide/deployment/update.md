# 更新与维护

NodeWarden 的更新重点是保持代码、D1 schema、前端资源和 JWT_SECRET 稳定。

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

## 自动同步

仓库包含同步上游的 GitHub Actions。可以在你自己的 Fork 里启用：

```text
Actions -> Sync upstream -> Enable workflow
```

启用后会按 workflow 配置定期同步。

`.github/workflows/sync-upstream.yml` 的行为分两种：

| 模式 | 触发方式 | 行为 |
| --- | --- | --- |
| 自动计划 | 每天按 cron 运行 | 读取上游最新 release tag，如果当前 fork 还没包含该提交，就合并到 `main` 并 push。 |
| 手动运行 | Actions 页面手动触发 | 如果填写 `target_commit`，会切到指定 commit 或 tag；如果留空，会使用 `upstream/main` 最新提交。 |

手动模式允许升级也允许回滚，所以 workflow 会对 `main` 做 force push。只在你明确知道目标提交时使用。

这个 workflow 会在同步后恢复自己的 `.github/workflows/sync-upstream.yml`，避免被上游覆盖。它不负责更新用户 D1 数据，也不负责生成备份。

## 全局域名规则同步

全局域名规则有独立 Action：`.github/workflows/sync-global-domains.yml`。

它只更新：

- `src/static/global_domains.bitwarden.json`
- `src/static/global_domains.bitwarden.meta.json`

它会检查 `src/static/global_domains.custom.json` 没有变化。NodeWarden 自己补充的全局域名规则应该由人工 PR 修改 `global_domains.custom.json`，不要混进自动同步生成文件。

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
