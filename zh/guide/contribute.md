# 贡献者路线

这条路线给想修改 NodeWarden 或审查技术改动的人看。如果你只是要部署一个实例，请先看 [入门路线](/zh/guide/start)。

## 架构路线

1. [整体架构](/zh/guide/architecture/overview) - 理解 Worker、前端资源、API、D1、R2、KV、cron 和 Durable Object 通知层如何组合。
2. [后端路由与服务层](/zh/guide/architecture/backend-routing-services) - 跟踪请求如何经过 router、handler、service、存储、限流和备份边界。
3. [前端架构](/zh/guide/architecture/frontend) - 理解 Vite 和 Preact Web Vault、路由、会话、React Query、i18n 和移动端体验。
4. [数据模型与迁移](/zh/guide/architecture/storage-schema) - 理解 D1 迁移、运行时 schema 初始化、表、索引和备份契约。

## 兼容路线

1. [兼容性策略](/zh/guide/architecture/compatibility) - 保持官方 Bitwarden 客户端在升级后继续可用。
2. [API 参考](/zh/guide/core/api-reference) - 查看公开、认证、密码库、附件、Send、设备、域名和管理员接口。
3. [实时通知](/zh/guide/architecture/realtime-notifications) - 理解 WebSocket 和 SignalR 风格通知行为。

## 改动路线

1. [变更维护地图](/zh/guide/architecture/change-map) - 在改动前找到正确代码区域。
2. [开发与代码约定](/zh/guide/architecture/development) - 遵守检查命令、i18n 规则、备份契约和密码项字段原则。
