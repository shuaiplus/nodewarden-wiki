# 配置与密钥

NodeWarden 的配置分两类：部署绑定和运行时数据。部署绑定由 Cloudflare 提供，运行时数据多数保存在 D1 的 `config` 表里。

## JWT_SECRET 必须用 Secret 保存

正式环境必须把 `JWT_SECRET` 保存为 Cloudflare Secret：

```powershell
npx wrangler secret put JWT_SECRET
```

不要把它写进：

- `wrangler.toml`
- `.dev.vars`
- GitHub Actions 日志
- README 截图
- 任何能被提交到仓库的文件

JWT_SECRET 变更的影响很大：

- 旧 access token 会失效。
- 附件上传/下载短 token 会失效。
- Send 文件上传/下载短 token 会失效。
- Send 访问 token 会失效。
- 备份配置 runtime 加密信封无法直接解密，需要管理员重新激活或修复。

因此更新项目时不要重新生成 JWT_SECRET。它应该像数据库密码一样长期保存。

## 服务端会拒绝弱 JWT_SECRET

`src/router.ts` 和 `src/handlers/accounts.ts` 都会检查 JWT_SECRET：

- 缺失：拒绝。
- 等于示例值 `Enter-your-JWT-key-here-at-least-32-characters`：拒绝。
- 少于 32 个字符：拒绝。

弱密钥不是警告级问题，而是会阻止注册或 API 请求继续执行。

## D1 config 表

`config` 表保存项目内部配置，例如：

- `registered`：是否已经完成首次注册。
- `schema.version`：当前 D1 schema 版本。
- `backup.settings.v1`：备份中心配置，加密后保存。
- `backup.runner.lock.v1`：备份/还原运行锁，临时运行态数据。

注意：`backup.runner.lock.v1` 不会进入实例备份。它只是避免多个备份任务重叠运行的锁。

## 备份目标配置

备份中心支持多个目标，每个目标包括：

- 名称
- 类型：`webdav` 或 `s3`
- 是否包含附件
- 远程路径
- 定时开关
- 开始时间
- 时区
- 间隔小时数
- 保留份数
- 运行状态

S3 是当前规范名称。旧配置里如果还有 `e3`，`src/services/backup-config.ts` 会兼容映射成 `s3`。

## 本地开发变量

本地开发可以用 `.dev.vars`，但不要把真实密钥提交。示例值只用于提醒格式，不能用于正式环境。

```ini
JWT_SECRET=Enter-your-real-random-secret-here
```

## 修改配置时的原则

- 密钥类配置用 Cloudflare Secret 或项目内加密信封保存。
- 运行态锁和临时状态不要进入备份。
- 新增持久配置时，先判断是否应该被备份，再同步改 `backup-archive.ts` 和 `backup-import.ts`。
