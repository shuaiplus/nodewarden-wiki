# 域名规则与图标

## 等效域名

NodeWarden 保存用户的域名匹配设置，包括：

- `equivalent_domains`
- `custom_equivalent_domains`
- `excluded_global_equivalent_domains`

这些数据保存在 D1 `domain_settings` 表。它们不是重复字段：一个表示客户端/UI 规则状态，一个表示自定义规则，一个表示从全局规则里排除的项目。

修改域名规则会更新用户 revision date，保证客户端或网页端同步能看到变化。

## 全局域名规则

项目内有静态全局域名文件：

- `src/static/global_domains.bitwarden.json`
- `src/static/global_domains.bitwarden.meta.json`
- `src/static/global_domains.custom.json`

同步脚本是：

```powershell
npm run domains:sync
```

## 网站图标

网页端会通过图标代理加载站点图标。图标请求属于公开只读路径，会经过限流和缓存。缓存 TTL 在 `src/config/limits.ts` 中配置。

图标功能只是 UI 辅助，不参与密码库解密，也不应该被当成登录域名判断的安全来源。

