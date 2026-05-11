# 域名规则

域名规则用于兼容 Bitwarden 的“等效域名”能力。它不会解密密码，也不会改变密码项本身；它只告诉客户端和网页端：哪些登录域名可以被视为同一组，从而影响登录项匹配、自动填充候选和设置页展示。

## 用户会操作什么

普通用户只需要在网页端的“设置 -> 域名规则”里操作：

- 添加自定义等效域名组，例如把两个内部系统域名归为一组。
- 排除某条全局等效域名规则，例如不希望某组官方规则参与自己的匹配。
- 保存后，服务端会更新该用户的域名设置和 revision date，其他客户端或网页会话在同步后看到新结果。

这些设置是按用户保存的，不会修改项目里的静态全局规则文件，也不会影响其他用户。

## 数据怎么保存

用户域名设置保存在 D1 的 `domain_settings` 表。核心字段是：

| 字段 | 含义 |
| --- | --- |
| `equivalent_domains` | 当前有效的自定义等效域名组。它是兼容客户端读取和旧数据回退用的派生结果。 |
| `custom_equivalent_domains` | 用户自定义规则的完整状态，包含规则 `id`、域名列表和是否排除。网页端主要依赖它恢复编辑状态。 |
| `excluded_global_equivalent_domains` | 用户排除的全局规则 `type` 列表。只记录排除项，不复制整份全局规则。 |
| `updated_at` | 域名设置更新时间。保存时会同时推动用户 revision date。 |

`equivalent_domains` 和 `custom_equivalent_domains` 看起来相近，但不是重复字段。前者是“生效后的兼容结果”，后者是“用户编辑状态”。改这块代码时要保持两者一起保存，否则容易出现网页端显示和客户端同步结果不一致。

## 静态全局规则文件

项目内有三类静态全局规则文件：

| 文件 | 谁维护 | 作用 |
| --- | --- | --- |
| `src/static/global_domains.bitwarden.json` | GitHub Action 自动生成 | 从 `bitwarden/server` 同步来的官方全局等效域名规则。 |
| `src/static/global_domains.bitwarden.meta.json` | GitHub Action 自动生成 | 记录同步来源、ref、生成时间、规则数和源文件地址。 |
| `src/static/global_domains.custom.json` | NodeWarden 维护者或贡献者手动提交 PR | NodeWarden 自己补充的全局规则，不能被自动同步脚本覆盖。 |

如果用户或贡献者想给 NodeWarden 增加一条项目自带的全局规则，应该提交 PR 修改 `src/static/global_domains.custom.json`。不要手改 `src/static/global_domains.bitwarden.json`，因为它是生成文件，下次同步 Bitwarden 上游时会被覆盖。

自定义全局规则的 `type` 应避免和 Bitwarden 官方规则冲突。当前项目使用负数作为 NodeWarden 自定义规则编号，例如：

```json
{"type":-10001,"domains":["nodewarden.example","nw.example"],"excluded":false,"source":"nodewarden"}
```

## 自动同步会更新什么

仓库包含 `.github/workflows/sync-global-domains.yml`。它会按计划运行，也可以手动触发。

这个 Action 做三件事：

1. 执行 `npm run domains:sync`，从 `bitwarden/server` 拉取官方规则来源。
2. 只把结果写入 `src/static/global_domains.bitwarden.json` 和 `src/static/global_domains.bitwarden.meta.json`。
3. 检查 `src/static/global_domains.custom.json` 没有变化，然后自动创建同步 PR。

因此维护边界是固定的：

| 场景 | 应该更新 |
| --- | --- |
| 跟随 Bitwarden 官方新增、删除或调整全局规则 | 运行同步 Action，更新 `global_domains.bitwarden.json` 和 `global_domains.bitwarden.meta.json`。 |
| NodeWarden 自己补一条全局规则 | 人工 PR 更新 `global_domains.custom.json`。 |
| 普通用户只想改变自己的匹配行为 | 在设置页保存，写入 D1 `domain_settings`，不改仓库文件。 |

同步脚本 `scripts/sync-global-domains.mjs` 的来源是 Bitwarden 仓库里的：

- `src/Core/Enums/GlobalEquivalentDomainsType.cs`
- `src/Core/Utilities/StaticStore.cs`

脚本会解析 enum 里的 `type` 数字，再解析 `StaticStore.cs` 里的域名组，最后生成 NodeWarden 使用的 JSON。

也可以本地手动同步：

```powershell
npm run domains:sync
```

如果需要指定 Bitwarden ref：

```powershell
npm run domains:sync -- --ref main
```

## 运行时怎么合并

运行时入口在 `src/services/domain-rules.ts`。

服务启动打包时会导入：

- `global_domains.bitwarden.json`
- `global_domains.custom.json`

然后合并成统一的 `globalDomains` 列表。用户请求 `/api/settings/domains` 或 `/settings/domains` 时，服务端会读取 D1 中该用户的设置，再构造返回值：

| 返回字段 | 来源 |
| --- | --- |
| `globalEquivalentDomains` | 静态全局规则加上用户排除状态。被用户排除的规则仍可返回，但会带 `excluded: true`。 |
| `customEquivalentDomains` | D1 里保存的用户自定义规则完整状态。 |
| `equivalentDomains` | 用户未排除的自定义规则，和未排除的全局规则一起合并后，筛出和自定义域名相关的有效等效组。 |

合并时会先规范化域名、去重，再用连通分量方式合并重叠域名组。比如用户自定义了 `a.example` 和 `b.example`，全局规则里又有 `b.example` 和 `c.example`，最终会形成一组连通的等效域名。

## 保存时会发生什么

保存接口在 `src/handlers/domains.ts`。它兼容 camelCase 和 PascalCase 字段，所以网页端和 Bitwarden 风格客户端都能提交。

保存流程是：

1. 读取当前用户已有的 `domain_settings`。
2. 规范化提交的自定义规则和排除的全局规则。
3. 从未排除的自定义规则派生 `equivalent_domains`。
4. 一次性保存 `equivalent_domains`、`custom_equivalent_domains` 和 `excluded_global_equivalent_domains`。
5. 更新用户 revision date，让同步端知道这个账号状态有变化。
6. 重新读取并返回合并后的域名规则响应。

如果提交里没有带某个字段，服务端会尽量保留当前值，而不是把它清空。这是为了兼容只提交部分字段的客户端。

## 备份和恢复

实例备份会导出 `domain_settings`。这意味着用户自己的自定义规则、排除的全局规则和更新时间会随实例备份恢复。

静态全局规则文件不属于用户数据。它们跟随代码版本发布：

- Bitwarden 官方规则由同步 Action 跟随上游更新。
- NodeWarden 自定义全局规则由 `global_domains.custom.json` 的 PR 维护。
- 用户个人排除项只存 D1，恢复实例备份后仍然生效。
