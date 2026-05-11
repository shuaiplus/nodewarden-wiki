# 快速开始

想先看界面，可以打开 [NodeWarden 在线 Demo](https://demo.nodewarden.app/)
- Demo 只用于体验网页端交互，不会保存真实数据。

## 可视化快速部署

1. Fork NodeWarden 仓库到自己的 GitHub 账号
2. 进入 [Cloudflare Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create)
3. 选择 Continue with GitHub 并选择你的仓库
4. 构建命令填 `npm run build`，部署命令填 `npm run deploy`
- 如果你打算用 KV 模式，把部署命令改成 `npm run deploy:kv`
5. 等部署完成后，打开生成的 Workers 域名

- Workers 默认域名在部分网络环境不可直连。如需自定义域名，到 [Workers 设置](https://dash.cloudflare.com/?to=/:account/workers/services/view/nodewarden/production/settings)里添加。

- 页面提示缺少 `JWT_SECRET` 时，到 Workers 设置里添加 Secret。正式环境至少使用 32 个字符以上的随机字符串，不要使用临时值或示例值。

这套流程里，用户实际做的是把代码交给 Cloudflare 构建并部署。代码里的 `wrangler.toml` 或 `wrangler.kv.toml` 决定绑定名，Worker 第一次处理请求时会自动初始化 D1 schema，不需要用户上传 SQL。

## CLI 部署

```powershell
git clone https://github.com/shuaiplus/NodeWarden.git
cd NodeWarden

npm install
npx wrangler login

# 默认 R2 模式
npm run deploy

# 可选 KV 模式
npm run deploy:kv
```

部署完成后设置 JWT_SECRET：

```powershell
npx wrangler secret put JWT_SECRET
```

`JWT_SECRET` 建议使用 32 位以上随机字符串。不要使用示例值，也不要写进 `wrangler.toml`、`.dev.vars` 或 GitHub 仓库。

## R2 模式和 KV 模式

| 存储 | 是否需绑卡 | 单个附件/Send 文件上限 | 免费额度 |
|---|---|---|---|
| R2 | 需要 | 100 MB（软限制可更改） | 10 GB |
| KV | 不需要 | 25 MiB（Cloudflare 限制） | 1 GB |

如果同时绑定了 R2 和 KV，会优先选择 R2。

选择存储模式时，本质上是在决定 `src/services/blob-store.ts` 会把附件和 Send 文件正文写到哪里：

| 模式 | 配置文件 | 绑定名 | 代码行为 |
| --- | --- | --- | --- |
| R2 | `wrangler.toml` | `ATTACHMENTS` | 优先写 R2，适合正式附件和文件 Send。 |
| KV | `wrangler.kv.toml` | `ATTACHMENTS_KV` | 不需要 R2，但单对象会受 KV 25 MiB 限制。 |

D1 里只保存附件和 Send 文件的元数据。真正的二进制正文不在 D1 表里。

## 首次注册

首次打开网址后，第一个注册的用户为管理员。注册接口会检查：

- `JWT_SECRET` 是否存在、是否仍是示例值、长度是否足够。
- 邮箱、主密码 hash、用户 key、公钥/私钥是否完整。
- KDF 参数是否满足最低要求。

第一个用户注册成功后，服务端会写入 `registered=true`，并记录 `user.register.first_admin` 审计日志。

后续注册默认需要邀请码。邀请码由管理员在网页端创建，服务端会把邀请码写入 `invites` 表，注册成功后标记为已使用。

## 第一次打开页面时发生什么

浏览器打开 Worker 域名时，Worker 会先尝试返回 `dist/` 里的前端资源。前端启动后会请求：

```text
GET /api/web-bootstrap
```

这个接口会返回：

- 当前默认 KDF 迭代次数。
- `JWT_SECRET` 是否缺失、过短或仍是示例值。
- 当前是否需要邀请码注册。

如果 `JWT_SECRET` 不安全，网页端会显示配置警告，认证 API 也会被服务端拦住。这个设计是为了避免用户在弱密钥实例里注册真实密码库。

## 第一次登录后应该做什么

建议按这个顺序完成：

1. 在设置里确认主密码提示是否安全，不要把真正密码写进去。
2. 绑定 TOTP，并保存恢复码。
3. 到备份中心添加一个 WebDAV 或 S3 兼容目标。
4. 手动运行一次远程备份。
5. 下载一次备份文件，确认文件名带有 hash 后缀。
6. 在测试实例上演练还原，确认附件和密码项都能恢复。

## 出问题先看哪里

[排错清单](/zh/guide/operations/troubleshooting)
