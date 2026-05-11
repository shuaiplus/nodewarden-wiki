# Website Icons

Website icons are visual aids for the Web Vault list. They do not participate in domain matching, vault decryption, or security decisions.

## What users see

The Web Vault takes the hostname from a cipher's first login URI and tries to load:

```text
/icons/{hostname}/icon.png?fallback=404
```

If the icon loads, the list shows the site icon. If it fails, the frontend keeps showing a type icon or default globe icon. Icon failures do not affect opening ciphers, autofill candidates, import/export, or sync.

## Frontend loading

Frontend entry points:

- `webapp/src/components/vault/WebsiteIcon.tsx`
- `webapp/src/lib/website-utils.ts`
- `webapp/src/lib/website-icon-cache.ts`

Load flow:

1. `firstCipherUri()` picks the first URI.
2. `hostFromUri()` parses the hostname. If no scheme is present, it tries parsing with `https://`.
3. `websiteIconUrl()` builds `/icons/{host}/icon.png?fallback=404`.
4. `WebsiteIcon` uses `IntersectionObserver` and starts loading only when the item is about 180 px from the viewport.
5. `website-icon-cache.ts` tracks each host as `idle`, `loading`, `loaded`, or `error` in frontend memory to avoid repeated loads for the same host.

Frontend protections:

- A single icon load that takes more than 15 seconds is marked as error.
- Error state is retried only after 5 minutes, preventing bad domains from being requested repeatedly during list scrolling.

Demo mode can use `demoBrandIconUrl()` and built-in demo icons instead of the real icon proxy.

## Server proxy

The server entry is `handleWebsiteIcon()` in `src/router-public.ts`. It tries two upstream sources in order:

| Order | Upstream | Purpose |
| --- | --- | --- |
| 1 | `https://favicon.im/zh/{host}?larger=true&throw-error-on-404=true` | Prefer a clearer favicon and continue on 404. |
| 2 | `https://icons.bitwarden.net/{host}/icon.png` | Bitwarden icon service fallback. |

Each upstream request has a 2.5 second timeout. The server accepts only responses whose `Content-Type` starts with `image/`. Non-image responses, non-2xx responses, timeouts, and errors move to the next source.

The Bitwarden icon service sometimes returns a default globe icon. NodeWarden detects that known default icon by byte size and SHA-256. If detected, it treats it as no usable site icon and continues fallback instead of caching the default as the real site icon.

## Fallback behavior

`/icons/{host}/icon.png` supports two fallback modes:

| Request | If all upstreams fail |
| --- | --- |
| Without `fallback=404` | Return NodeWarden's built-in SVG globe icon. |
| With `fallback=404` | Return 404 so the frontend keeps its local fallback icon. |

The Web Vault uses `fallback=404` because the list already has a local fallback. Official clients or other compatible clients that use the icon service template from `/config` can receive either a real icon or the built-in default icon.

Invalid hostnames follow the same fallback branch. The server rejects values containing `/`, `\`, or values that cannot be parsed as hostnames, so the icon proxy does not become an arbitrary URL proxy.

## Cache and config

Icon cache time comes from `src/config/limits.ts`:

```text
LIMITS.cache.iconTtlSeconds
```

The current default is 604800 seconds, or 7 days. Real icons and the built-in default icon are returned with:

```text
Cache-Control: public, max-age=604800, immutable
```

Upstream fetches also use Cloudflare `cacheEverything` and the same cache TTL. 404 fallback is cached for 300 seconds.

`/config` exposes:

- `_icon_service_url`
- `_icon_service_csp`
- `environment.icons`

This is for clients that need icon service configuration. When changing icon service paths, check both `/icons` routes and `/config` output.

## Change checklist

If you change upstreams, order, or fallback behavior, check:

- `src/router-public.ts`
- `src/config/limits.ts`
- `webapp/src/lib/website-utils.ts`
- `webapp/src/lib/website-icon-cache.ts`
- [API Reference](/guide/core/api-reference)
- [Limits and Boundaries](/guide/operations/limitations)

Do not use icon results for domain rules, URI matching, or login security. Icon sources are external services and can be missing, slow, defaulted, or affected by a site's own favicon behavior.
