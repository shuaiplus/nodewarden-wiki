# 前端架构

NodeWarden 的网页密码库是仓库内自研的 Vite + Preact 应用，不依赖官方 Bitwarden Web Vault。它既要服务普通用户的密码库操作，也要承担管理员、备份中心、导入导出、设备管理和 demo 展示等功能。

## 技术栈

主要依赖：

- `preact`：组件运行时。
- `@tanstack/react-query`：远端数据获取、缓存和刷新。
- `wouter`：轻量路由。
- `lucide-preact`：图标。
- `@zip.js/zip.js`、`fflate`：导入导出和备份 ZIP 处理。
- `qrcode-generator`：TOTP 二维码展示。
- `tailwindcss`、`postcss`、普通 CSS：样式构建。

构建入口是 `webapp/vite.config.ts`，生产构建输出到根目录 `dist/`，由 Worker assets 提供静态资源服务。

## App 生命周期

`webapp/src/App.tsx` 是前端总控层，负责：

- 读取本地 session。
- 根据 JWT_SECRET 风险状态、登录状态、锁定状态决定当前 phase。
- 登录、注册、解锁、锁定和退出。
- 初始化 React Query 查询。
- 连接 `/notifications/hub`，接收 vault 和备份进度事件。
- 组织管理员、备份、设备、Send、域名规则等跨页面 actions。
- 根据 route 渲染认证页、主应用页、公开 Send 页、404 页等。

为了降低首屏等待，应用还会在主界面可用后通过 `app-preload.ts` 在后台预热部分懒加载资源和 locale chunk。

## 页面组件分层

`webapp/src/components/` 放页面级组件和通用外壳：

| 组件 | 职责 |
| --- | --- |
| `AuthViews.tsx` | 登录、注册、解锁和 TOTP challenge。 |
| `AppAuthenticatedShell.tsx` | 登录后的应用外壳、导航和主题切换。 |
| `AppMainRoutes.tsx` | 主应用路由分发。 |
| `VaultPage.tsx` | 密码库列表、详情、编辑入口和移动端 detail sheet。 |
| `SendsPage.tsx`、`PublicSendPage.tsx` | 私有 Send 管理和公开 Send 访问。 |
| `SettingsPage.tsx` | 账号安全、主密码、TOTP、恢复码、API Key。 |
| `SecurityDevicesPage.tsx` | 授权设备和 2FA 信任管理。 |
| `AdminPage.tsx` | 用户、邀请码和用户状态管理。 |
| `BackupCenterPage.tsx` | 备份目标、手动导入导出、远程备份和恢复。 |
| `DomainRulesPage.tsx` | 等效域名规则。 |
| `ImportPage.tsx` | 多格式导入。 |
| `NotFoundPage.tsx` | 未知路由和不可用公开 Send 的 404。 |

`webapp/src/components/vault/` 和 `webapp/src/components/backup-center/` 是两个较大的功能子域，分别承载密码项编辑细节和备份中心复杂交互。

## 数据与 API 层

`webapp/src/lib/api/` 下的模块负责调用后端接口。业务组件不应手写散落的 fetch 路径，优先走这些 API helper。

常见数据流：

```text
组件事件
  -> hook/action
  -> lib/api/*
  -> authedFetch/session refresh
  -> Worker API
  -> React Query invalidate/refetch
  -> UI 更新
```

登录态相关逻辑在 `app-auth.ts`、`app-support.ts` 和 `crypto.ts` 周围。密码库解密相关逻辑在：

- `vault-decrypt.ts`
- `decrypt-cipher.ts`
- `vault-worker.ts`
- `vault-cache.ts`

大库场景下，缓存和 worker 解密可以减少主线程压力。

## 路由与页面状态

前端同时支持普通路径和部分 hash route 兼容。`App.tsx` 会判断：

- 认证页 route。
- 已登录主应用 route。
- 公开 Send route。
- 导入导出别名 route。
- 未知或格式错误 route。

非管理员访问 `/admin`、`/backup` 等需要管理员权限的区域时，会被路由逻辑挡住或引导回合适页面。

## i18n

`webapp/src/lib/i18n.ts` 是语言加载入口。locale 文件是独立完整包，不是英文增量覆盖。

当前原则：

- 用户选择语言后持久化到本地。
- 本地选择优先于浏览器语言。
- 语言包按需加载。
- 加载失败时硬 fallback 到英文。
- 新增文案必须同步所有 locale，并运行 `npm run i18n:validate`。

避免在模块顶层直接调用 `t()` 生成常量。翻译应在 render 或运行时函数里读取，否则异步 i18n 初始化前可能冻结成 raw key。

## 样式与移动端

样式分布在 `webapp/src/styles*.css` 和组件相关 class 中。这个前端的目标是“像正式管理软件”，不是营销页。

维护时注意：

- 移动端表单要整体压缩节奏，不只缩小某一个按钮。
- 备份中心、设置页、详情页都要考虑手机上是否过空。
- 不要让说明文字常驻挤占主要操作，次要说明适合折叠或按需显示。
- 深色主题、错误态、空状态和加载态要同步检查。

## Demo 构建

Demo 模式使用：

```powershell
npm run build:demo
```

它会使用 demo 数据和 Cloudflare Pages 的 SPA fallback。生产构建不应包含 demo vault 数据、demo 操作逻辑或 demo 专用图标。

## 改动建议

- 页面新增远端数据时，优先接入 React Query 的 query/mutation 和统一错误提示。
- 新增用户可见文案时，同步 locale，不要只改中文或英文。
- 新增路由时，同时检查 `App.tsx` 的 known route、导航、404、移动端标题。
- 新增大体积功能时，考虑是否需要懒加载或后台预热。
- 修改密码项 shape 时，同时检查加密、解密、导入、导出、sync 和官方客户端兼容。

