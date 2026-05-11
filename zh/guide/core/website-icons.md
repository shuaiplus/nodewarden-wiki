# 网站图标

网站图标只是网页端的视觉辅助，用来让密码项列表更容易扫读。它不参与登录域名匹配，不参与密码库解密，也不能作为安全判断来源。

## 用户会看到什么

网页端会从密码项的第一个登录 URI 里取 hostname，然后尝试加载：

```text
/icons/{hostname}/icon.png?fallback=404
```

如果图标加载成功，列表里显示站点图标；如果失败，前端继续显示类型图标或默认地球图标。图标失败不会影响密码项打开、自动填充候选、导入导出或同步。

## 前端怎么加载

前端入口在：

- `webapp/src/components/vault/WebsiteIcon.tsx`
- `webapp/src/lib/website-utils.ts`
- `webapp/src/lib/website-icon-cache.ts`

加载流程是：

1. `firstCipherUri()` 取密码项第一个 URI。
2. `hostFromUri()` 从 URI 里解析 hostname；没有协议时会按 `https://` 补齐后解析。
3. `websiteIconUrl()` 生成 `/icons/{host}/icon.png?fallback=404`。
4. `WebsiteIcon` 用 `IntersectionObserver` 延迟加载，距离视口约 180px 时才开始请求。
5. `website-icon-cache.ts` 在前端内存里记录每个 host 的 `idle/loading/loaded/error` 状态，避免同一页面里重复加载同一个域名。

前端还有两个保护：

- 单个图标加载超过 15 秒会标记为错误。
- 错误状态 5 分钟后才允许重试，避免坏域名在列表滚动时反复打请求。

Demo 模式可以走 `demoBrandIconUrl()`，使用内置演示图标，不走真实图标代理。

## 服务端代理怎么取图标

服务端入口在 `src/router-public.ts` 的 `handleWebsiteIcon()`。它不是简单转发一个固定上游，而是按顺序尝试两个源：

| 顺序 | 上游 | 作用 |
| --- | --- | --- |
| 1 | `https://favicon.im/zh/{host}?larger=true&throw-error-on-404=true` | 优先取较清晰的网站图标，404 时继续下一个源。 |
| 2 | `https://icons.bitwarden.net/{host}/icon.png` | Bitwarden 图标服务作为 fallback。 |

每个上游请求都有 2.5 秒超时。服务端只接受 `Content-Type` 以 `image/` 开头的响应；非图片、非 2xx、超时或异常都会跳到下一个源。

Bitwarden 图标服务有时会返回默认地球图标。NodeWarden 会用已知字节数和 SHA-256 识别这个默认图标；如果命中，就当作没有可用站点图标，继续 fallback，而不是把 Bitwarden 默认图标缓存成真实网站图标。

## fallback 行为

`/icons/{host}/icon.png` 支持两种 fallback 模式：

| 请求 | 全部上游失败时 |
| --- | --- |
| 不带 `fallback=404` | 返回 NodeWarden 内置 SVG 地球图标。 |
| 带 `fallback=404` | 返回 404，让前端继续显示本地 fallback 图标。 |

网页端使用 `fallback=404`，因为列表里已经有本地 fallback，不需要服务端再返回一个默认图片。官方客户端或其他兼容客户端如果按 `/config` 里的图标服务模板请求，则可以得到默认图标或真实图标。

无效 hostname 会走同样的 fallback 分支。服务端会拒绝包含 `/`、`\` 或无法按 hostname 解析的值，避免把图标代理变成任意 URL 代理。

## 缓存和配置

图标缓存时间来自 `src/config/limits.ts`：

```text
LIMITS.cache.iconTtlSeconds
```

当前默认是 604800 秒，也就是 7 天。服务端返回真实图标和内置默认图标时都会带：

```text
Cache-Control: public, max-age=604800, immutable
```

上游 fetch 也会设置 Cloudflare `cacheEverything` 和同样的 cache TTL。404 fallback 会短缓存 300 秒。

`/config` 响应里会暴露：

- `_icon_service_url`
- `_icon_service_csp`
- `environment.icons`

这是为了兼容需要图标服务配置的客户端。修改图标服务路径时，不要只改 `/icons` 路由，也要检查 `/config` 输出。

## 修改时要注意

如果要换上游、调整顺序或改变 fallback，要同时检查：

- `src/router-public.ts`
- `src/config/limits.ts`
- `webapp/src/lib/website-utils.ts`
- `webapp/src/lib/website-icon-cache.ts`
- [API 参考](/zh/guide/core/api-reference)
- [限制与已知边界](/zh/guide/operations/limitations)

不要把图标结果用于域名规则、URI 匹配或登录安全判断。图标源是外部服务，可能缺失、超时、返回默认图标，也可能被站点自己的 favicon 策略影响。
