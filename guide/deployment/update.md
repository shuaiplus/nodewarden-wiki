# 更新与维护

NodeWarden 的更新重点是保持代码、D1 schema、前端资源和 JWT_SECRET 稳定。

## 手动更新

如果你 Fork 了仓库，在 GitHub 页面点击：

```text
Sync fork -> Update branch
```

然后等待 Cloudflare 重新部署。

## 自动同步

仓库包含同步上游的 GitHub Actions。可以在你自己的 Fork 里启用：

```text
Actions -> Sync upstream -> Enable workflow
```

启用后会按 workflow 配置定期同步。

## 更新不会要求手动迁移

项目的 D1 schema 初始化是运行时幂等执行的。`src/services/storage.ts` 里有 `STORAGE_SCHEMA_VERSION`，只要版本变化，Worker 会重新跑 `src/services/storage-schema.ts` 里的 SQL。

你需要关注的是：

- 部署日志里是否有数据库初始化失败。
- 新版本是否新增了必要绑定。
- 是否仍保留原来的 JWT_SECRET。

## 更新前建议做备份

更新前建议在备份中心手动导出一次实例备份。原因很简单：密码库类项目的数据价值远高于部署本身。

如果开启了远程定时备份，也建议手动点一次运行并确认成功。远程备份会记录最后成功时间、文件名、大小、路径和错误信息。

## 不要做的事

- 不要删除 D1 数据库再部署，除非你准备从备份恢复。
- 不要重置 JWT_SECRET。
- 不要把 `backup.settings.v1` 当普通 JSON 手改，当前它可能是加密信封。
- 不要手动清理 `attachments/` 目录下的远程备份附件，除非你确认没有任何备份 ZIP 还引用这些 blob。

