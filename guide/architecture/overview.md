# 整体架构

NodeWarden 是一个单 Worker 应用。前端、API、存储和定时任务都围绕 Cloudflare 绑定组织。

## 目录结构

```text
src/
  handlers/       API 业务处理
  services/       D1、备份、存储、限流、域名规则等服务
  utils/          JWT、响应、TOTP、UUID、设备解析等工具
  durable/        Durable Object 通知中心
  static/         全局域名规则静态数据
webapp/
  src/            Preact Web Vault
shared/
  backup-schema.ts
  app-version.ts
migrations/
  0001_init.sql   初始 D1 schema
wiki/
  VitePress 文档
```

## 请求生命周期

```text
src/index.ts
  normalizeRequestUrl()
  maybeServeAsset()
  ensureDatabaseInitialized()
  handleRequest()

src/router.ts
  CORS
  请求大小限制
  public route
  JWT_SECRET 安全检查
  access token 验证
  用户状态检查
  认证 API 限流
  authenticated route
```

公开路由包括注册、预登录、登录、公开 Send、附件短链、图标等。认证路由需要 Bearer token。

## 存储层

结构化数据在 D1：

- users
- user_revisions
- folders
- ciphers
- attachments
- sends
- refresh_tokens
- devices
- trusted_two_factor_device_tokens
- domain_settings
- invites
- config
- audit_logs
- login_attempts_ip
- used_attachment_download_tokens

二进制数据在 R2/KV：

- 附件正文
- Send 文件正文

## 通知层

Durable Object `NotificationsHub` 用于网页端事件通知，例如：

- vault sync revision 更新。
- 备份导出进度。
- 备份远程运行进度。
- 备份还原进度。

这让网页端不用靠盲等来感知长任务状态。

## 前端构建

`webapp/` 使用 Vite + Preact。构建脚本：

```powershell
npm run build
```

会输出到 `dist/`，由 Worker assets 服务。

Demo 模式使用：

```powershell
npm run build:demo
```

## 定时任务

Cloudflare cron 每 5 分钟调用 Worker scheduled handler。实际只处理备份扫描：

```text
src/index.ts -> scheduled() -> runScheduledBackupIfDue()
```

如果数据库初始化失败，定时备份会跳过并记录日志。
