# 密码安全检查

Web 保险库提供 **密码安全** 功能，对当前已在浏览器中解锁的登录密码做三类风险检查：

1. **已泄露（Exposed）** — 密码是否出现在公开泄露语料中（Have I Been Pwned 的 Pwned Passwords）。
2. **重复使用（Reused）** — 同一密码是否被多个登录条目共用。
3. **弱密码（Weak）** — 是否未通过本地强度启发式（长度、字符种类、常见口令、简单序列等）。

本文说明如何使用、哪些数据会离开本机、以及**不会**发生的事。该能力仅存在于 NodeWarden **Web 保险库**；官方 Bitwarden 手机/桌面客户端不会打开本页。

## 入口在哪里

| 入口 | 路径 / 界面 |
| --- | --- |
| 整库扫描 | 侧栏 **密码安全**（路由 `/security/password-health`） |
| 单条登录项 | 保险库条目详情 → **检查泄露**（需已有解密后的登录密码） |

仅在解锁后可用。已删除的登录项、非登录类型密文不会参与扫描。

## 整库扫描做什么

整库扫描是 **手动启动** 的。在你点击 **开始检查**（或 **重新检查**）之前，不会向任何泄露库发请求。

扫描过程中，Web 保险库会：

1. 收集当前解锁会话中、带有已解密密码的合格登录条目。
2. 在浏览器内用 `crypto.subtle.digest` 计算每个密码的 **SHA-1**。
3. 按完整摘要分组，相同密码只对网络查询一次。
4. 对每个唯一摘要，向 Have I Been Pwned 发起 **k-匿名 range** 请求（见下文）。
5. **完全在本地** 完成重复使用与弱密码判断。
6. 展示汇总指标，以及需要关注的条目列表（可按类型筛选）。

结果只保留在当次页面会话中，**不会**写入 D1、R2、localStorage 或实例备份。

## 单条泄露检查

在条目详情中可只检查一条密码，无需生成整库报告。隐私模型相同：只向公开 range API 请求 SHA-1 的 **前缀**。整库的「重复 / 弱密码」统计仍需在密码安全页完成。

## 隐私模型（k-匿名）

NodeWarden 使用 [Have I Been Pwned Pwned Passwords range API](https://haveibeenpwned.com/API/v3#PwnedPasswords)（与主流密码管理器同类设计）。

### 会发送什么

| 会发送 | 不会发送 |
| --- | --- |
| 密码 SHA-1 的前 **5 位十六进制** | 密码明文 |
| HTTPS `GET`：`https://api.pwnedpasswords.com/range/{prefix}` | 完整 40 位 SHA-1 |
| 可选请求头 `Add-Padding: true` | 你的 NodeWarden 会话 Cookie / JWT |
| | 条目名称、用户名、URI 或账号邮箱（作为泄露查询的一部分） |

剩余 **35** 位后缀只在浏览器内与返回列表比对。一个前缀桶通常约有 **2000** 条已公开泄露过的哈希后缀。仅看到前缀的网络观察者**无法知道**你最终匹配了哪一条（如果有匹配）。

### Web 保险库侧的请求加固

客户端使用：

- `credentials: 'omit'` — 不带 Cookie 或 Authorization
- `referrerPolicy: 'no-referrer'` — 不把保险库源站作为 `Referer`
- `cache: 'no-store'`
- `mode: 'cors'`
- `Add-Padding: true` — 降低响应长度侧信道
- 约 12 秒超时；离开页面 / 取消会中止进行中的请求

`webapp/index.html` 中的 Content-Security-Policy 限制脚本可连接的目标：

```text
connect-src 'self' https://api.pwnedpasswords.com;
```

因此 Web 保险库脚本在 CSP 约束下不能随意连接任意第三方 API，仅允许本站与 HIBP range 主机。

### 绝不经过 NodeWarden 服务端

泄露 range 查询路径是 **浏览器 → api.pwnedpasswords.com**，**不**经过 Worker、D1、管理员接口或审计日志。自托管运维与实例管理员无法通过此功能收取保险库密码。

「重复使用」与「弱密码」检查完全不出网。

## 「已泄露 / 重复 / 弱」分别怎么判定

| 标签 | 判定方式 | 是否联网 |
| --- | --- | --- |
| **已泄露** | 本地算完整 SHA-1；只查询前缀；后缀命中则得到 HIBP 的出现 **次数** | 是（仅前缀） |
| **重复使用** | 本次解锁会话中，≥2 条合格登录共享同一完整 SHA-1 | 否 |
| **弱密码** | 本地规则：常见口令、过短、重复字符、简单序列、包含用户名片段、字符种类过少等 | 否 |

同一条目可同时命中多种风险。无风险条目不会塞进关注列表，便于处理。

### 网络失败

若 range API 不可达、超时或返回非成功状态，该密码计为 **不可用**（**不会**标成「安全」）。界面会提示部分检查未完成。其他密码的重复/弱结果仍然有效。

## 结果存储与生命周期

| 关注点 | 行为 |
| --- | --- |
| 存储位置 | 仅内存模块状态（`password-security-cache`） |
| 持久化 | 不写磁盘、不上服务器 |
| 锁定保险库 | 清空缓存 |
| 退出登录 | 清空缓存 |
| 离开已认证应用阶段 | 清空缓存 |
| 保险库数据指纹变化 | 按新快照重建扫描状态 |

报告页上的「显示密码」只切换 UI 可见性，数据本就来自已解锁解密的条目，**不会**因此再发一次明文。

## 使用条件与边界

- 需要 **已解锁** 的 Web 保险库会话，且登录密码已在内存中解密。
- 「已泄露」检查需要浏览器能访问 `api.pwnedpasswords.com` 的 HTTPS。离线或拦截该域名时，对应条目会记为不可用；重复/弱仍可在本地逻辑中完成（当前整库扫描会对失败的泄露查询标不可用）。
- **合格条目**：登录类型（`type === 1`）、未删除、解密密码非空。
- **并发**：最多约 5 个 range 请求并行，避免压垮公共 API。
- **不能替代**：注册时的主密码强度、两步验证、设备安全，或官方客户端自带的健康报告（若有）。

## 威胁模型摘要

| 攻击者 / 场景 | 能否靠本功能拿到你的保险库密码？ |
| --- | --- |
| 被动网络窃听（正常 HTTPS） | 否（只能看到密文流量） |
| 可解密 TLS 并看到 HTTP 路径的代理 | 最多看到 5 位十六进制前缀，无明文、无完整哈希 |
| Have I Been Pwned 运营方 | 按 range 设计只收到前缀 |
| NodeWarden 服务端 / 实例管理员 | 本功能无此数据通路 |
| 伪造 HIBP 响应（恶意中间人且你信任假证书） | 可谎报泄露次数；协议本身仍给不出密码 |
| 解锁态下的木马 / 恶意扩展可读页面 | 能 — 与任何已解锁密码管理器网页相同，非本检查独有 |
| 完全控制已解锁 Web 保险库的 XSS | 能 — 属通用前端沦陷，不是 k-匿名协议本身引入 |

**一句话：设计目标是明文密码与完整密码哈希永不上传。** 网络参与方最多看到匿名哈希前缀。在既定协议下，本功能不能当作向 NodeWarden 或 HIBP 远程拖库的通道。

## 实现索引（贡献者）

| 模块 | 位置 |
| --- | --- |
| range 客户端、SHA-1、弱密码启发式、整库报告 | `webapp/src/lib/password-security.ts` |
| 扫描进度与内存状态 | `webapp/src/lib/password-security-cache.ts` |
| 整库报告 UI | `webapp/src/components/PasswordSecurityPage.tsx` |
| 单条泄露按钮 | `webapp/src/components/vault/VaultDetailView.tsx` |
| 路由 `/security/password-health` | `webapp/src/components/AppMainRoutes.tsx` |
| 导航入口 | `webapp/src/components/AppAuthenticatedShell.tsx` |
| 锁定/登出清缓存 | `webapp/src/App.tsx` |
| CSP `connect-src` | `webapp/index.html` |

**没有**对应的 Worker 泄露查询接口。若将来增加服务端代理，不得接收完整哈希或明文，且须单独安全评审。

## 相关页面

- [账号与主密码](/zh/guide/security/accounts)
- [两步验证与设备](/zh/guide/security/two-factor-devices)
- [前端架构](/zh/guide/architecture/frontend)
- [离线使用](/zh/guide/client/offline-usage)
- [常见问题](/zh/guide/operations/faq)
