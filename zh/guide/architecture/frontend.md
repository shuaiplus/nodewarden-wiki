# 前端架构

NodeWarden 的网页密码库是仓库内自研的 Vite + Preact 应用，不依赖官方 Bitwarden Web Vault。它同时承担密码库、Send、导入导出、备份中心、设备管理、管理员页面和 Demo 展示。

## 技术栈

| 依赖 | 用途 |
| --- | --- |
| `preact` | 组件运行时。 |
| `@tanstack/react-query` | 远端数据获取、缓存和刷新。 |
| `wouter` | 轻量路由。 |
| `lucide-preact` | 图标。 |
| `@zip.js/zip.js`、`fflate` | 导入导出和备份 ZIP 处理。 |
| `qrcode-generator` | TOTP 二维码。 |
| `tailwindcss`、`postcss`、CSS | 样式构建。 |

构建入口是 `webapp/vite.config.ts`。生产构建输出到根目录 `dist/`，再由 Worker assets 提供静态资源。

## App 总控

`webapp/src/App.tsx` 是前端总控层，负责 session、登录注册、锁定解锁、全局查询、通知连接、管理员能力、备份能力和主路由分发。

主界面可用后，`app-preload.ts` 会在后台预热部分懒加载资源和 locale chunk，降低后续页面切换等待。

网页端登录使用 `X-NodeWarden-Web-Session: 1` 标记浏览器会话。服务端会把 refresh token 放进 HttpOnly cookie，前端本地只保留邮箱、认证模式和解锁所需的会话状态，避免把 refresh token 明文写入 localStorage。

## 页面分层

| 区域 | 主要组件 |
| --- | --- |
| 认证 | `AuthViews.tsx` |
| 应用外壳 | `AppAuthenticatedShell.tsx`、`AppMainRoutes.tsx` |
| 密码库 | `VaultPage.tsx`、`components/vault/*` |
| Send | `SendsPage.tsx`、`PublicSendPage.tsx` |
| 设置与安全 | `SettingsPage.tsx`、`SecurityDevicesPage.tsx` |
| 管理与备份 | `AdminPage.tsx`、`BackupCenterPage.tsx`、`components/backup-center/*` |
| 其它工具 | `DomainRulesPage.tsx`、`ImportPage.tsx`、`NotFoundPage.tsx` |

大页面应继续按功能子域拆组件。拆分目标是降低认知负担和渲染成本，不是制造很碎的包装组件。

## 数据与 API

组件不要散落手写 `fetch` 路径，优先走 `webapp/src/lib/api/` 下的 helper。常见数据流是：

```text
组件事件 -> action/hook -> lib/api/* -> authedFetch/session refresh
  -> Worker API -> React Query invalidate/refetch -> UI 更新
```

登录态相关逻辑主要在 `app-auth.ts`、`app-support.ts` 和 `crypto.ts` 周围。密码库解密相关逻辑主要在 `vault-decrypt.ts`、`decrypt-cipher.ts`、`vault-worker.ts` 和 `vault-cache.ts`。

## 路由与权限

前端同时支持普通路径和部分 hash route 兼容。主要路由包括：

| 路由 | 页面 |
| --- | --- |
| `/login`, `/register`, `/lock`, `/recover-2fa` | 登录、注册、锁定和 2FA 恢复。 |
| `/vault`, `/vault/totp` | 密码库和验证码视图。 |
| `/sends` | Send 管理。 |
| `/send/{id}` | 公开 Send 访问，可带 key。 |
| `/settings`, `/settings/account`, `/settings/domain-rules` | 设置首页、账号设置和域名规则。 |
| `/security/devices` | 设备管理。 |
| `/backup` | 备份中心，仅管理员可进入。 |
| `/admin` | 用户和邀请管理，仅管理员可进入。 |
| `/backup/import-export` 及旧别名 | 导入导出工具。 |

新增页面时要检查：

- 登录前是否可访问。
- 登录后是否需要管理员权限。
- 移动端标题、导航和返回路径是否正确。
- 未知路径是否落到 `NotFoundPage.tsx`。
- 公开 Send 路由是否和普通登录态路由冲突。

移动端的 `/settings` 是设置入口页；桌面端更偏向直接进入账号设置。不要只验证一个视口。

## i18n

`webapp/src/lib/i18n.ts` 是语言加载入口。locale 文件必须是独立完整包，不是英文增量覆盖。

维护原则：

- 用户选择语言后持久化到本地。
- 本地选择优先于浏览器语言。
- 语言包按需加载，失败时硬 fallback 到英文。
- 新增文案必须同步所有 locale，并运行 `npm run i18n:validate`。
- 不要在模块顶层调用 `t()` 生成常量，避免异步初始化前冻结成 raw key。

生产构建会把非英文语言包拆成独立 chunk。新增语言时要同时更新 `Locale`、可用语言列表、浏览器语言识别、动态 loader、校验脚本和完整 locale 文件。

## 构建策略

`webapp/vite.config.ts` 里有两个需要维护者知道的策略：

- 普通生产构建会写入 noindex robots；Demo 构建允许被索引。
- 主要应用页面会被合到 `app-suite` chunk，非英文 locale 单独拆包，避免首屏一次性加载所有语言和大页面。

## 样式与移动端

这个前端的目标是正式管理软件，不是营销页。维护时注意：

- 移动端表单要整体压缩节奏，不只缩小某一个按钮。
- 设置页、备份中心、详情页要避免手机上过空。
- 次要说明适合折叠或按需显示，不要常驻挤占主操作。
- 深色主题、错误态、空状态和加载态要同步检查。

## 改动规则

- 新增远端数据时，优先接入 React Query 的 query/mutation 和统一错误提示。
- 新增路由时，同时检查 `App.tsx`、导航、404 和移动端标题。
- 新增大体积功能时，考虑懒加载或后台预热。
- 修改密码项 shape 时，同时检查加密、解密、导入、导出、sync 和官方客户端兼容。
