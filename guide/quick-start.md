# 快速开始

开始之前可以先打开 Demo 看一下界面：

[NodeWarden 在线 Demo](https://nodewarden-demo.pages.dev/)

Demo 只用于体验网页端交互。正式使用必须部署自己的实例，并保存好自己的主密码、JWT_SECRET 和备份目标。

## 可视化快速部署

1. Fork NodeWarden 仓库到自己的 GitHub 账号
2. 进入  [Cloudflare Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create)
3. 选择 Continue with GitHub 并选择你的仓库
4. 构建命令：`npm run build`、部署命令：`npm run deploy`
- 如果你打算用 KV 模式，把部署命令改成：`npm run deploy:kv`

5. 等部署完成后，打开生成的 Workers 域名（默认已被中国大陆封禁）
- 如需直连，请到[workers设置](https://dash.cloudflare.com/?to=/:account/workers/services/view/nodewarden/production/settings)添加自定义域名

6. 根据页面提示设置到[workers设置](https://dash.cloudflare.com/?to=/:account/workers/services/view/nodewarden/production/settings)添加`JWT_SECRET`
- 不建议临时乱填。这个值直接关系到令牌签发安全，正式环境至少使用 32 个字符以上的随机字符串


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

JWT_SECRET 建议使用 32 位以上随机字符串。不要使用示例值，也不要写进 `wrangler.toml`、`.dev.vars` 或 GitHub 仓库。

## R2 模式和 KV 模式

| 储存 | 是否需绑卡 | 单个附件/Send文件上限 | 免费额度 |
|---|---|---|---|
| R2 | 需要 | 100 MB（软限制可更改） | 10 GB |
| KV | 不需要 | 25 MiB（Cloudflare限制） | 1 GB |

如果同时绑定了 R2 和 KV，会优先选择 R2。

## 首次注册

首次打开网址后，第一个注册的用户为管理员。注册接口会检查：

- `JWT_SECRET` 是否存在。
- 是否仍是默认示例值。
- 长度是否至少 32 个字符。
- 邮箱、主密码 hash、用户 key、用户公钥/私钥是否完整。
- KDF 参数是否满足最低要求。

第一个用户注册成功后，服务端会写入 `registered=true`，并记录 `user.register.first_admin` 审计日志。

## 第一次登录后应该做什么

建议按这个顺序完成：

1. 在设置里确认主密码提示是否安全，不要把真正密码写进去。
2. 绑定 TOTP，并保存恢复码。
3. 到备份中心添加一个 WebDAV 或 S3 兼容目标。
4. 手动运行一次远程备份。
5. 下载一次备份文件，确认文件名带有 hash 后缀。
6. 在测试实例上演练还原，确认附件和密码项都能恢复。

## 最常见的部署错误

**打开页面后接口 500**

通常是 `JWT_SECRET` 没有设置、太短、仍是示例值，或者 D1 没绑定成功。先看 Cloudflare Worker 日志。

**附件上传失败**

检查是否绑定 `ATTACHMENTS` 或 `ATTACHMENTS_KV`。KV 模式不能上传超过 KV 限制的大文件。

**更新后登录状态全部失效**

如果 JWT_SECRET 变了，旧 access token、附件短链、Send 短链都会失效。正式环境必须把 JWT_SECRET 保存为 Cloudflare Secret，让它跟随部署长期存在。

