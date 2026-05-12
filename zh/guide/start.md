# 入门路线

这条路线给想部署和使用 NodeWarden 的用户看。你不需要先读架构和贡献者文档。

## 按这个顺序阅读

1. [项目定位](/zh/guide/overview) - 先确认 NodeWarden 是否适合你的使用场景。
2. [快速部署](/zh/guide/quick-start) - 部署 Worker，配置存储，添加 `JWT_SECRET`，注册第一个管理员。
3. [Cloudflare 参数](/zh/guide/deployment/cloudflare) - 检查 Workers、D1、R2、KV、静态资源、cron 和 Durable Object 绑定。
4. [配置与密钥](/zh/guide/deployment/configuration) - 理解运行时配置、密钥和备份目标设置。
5. [客户端连接](/zh/guide/core/clients) - 连接官方 Bitwarden 客户端，理解登录、同步、API Key、2FA 和设备行为。

## 出问题时看这里

- [常见问题](/zh/guide/operations/faq) 先回答最常见的问题。
- [排错清单](/zh/guide/operations/troubleshooting) 按步骤检查部署、注册、登录、同步、附件、备份和恢复。
- [限制与边界](/zh/guide/operations/limitations) 说明 Cloudflare 限制和暂不支持的 Bitwarden Enterprise 能力。

## 现在可以先跳过什么

架构、数据模型、API 参考和开发约定都是贡献者内容。只有你准备修改 NodeWarden 本身时，才需要继续读那些页面。
