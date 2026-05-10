# 快速开始

开始之前可以先打开 Demo 看一下界面：

[NodeWarden 在线 Demo](https://nodewarden-demo.pages.dev/)

Demo 只用于体验网页端交互。正式使用必须部署自己的实例，并保存好自己的主密码、JWT_SECRET 和备份目标。

## 最短部署路径

1. Fork 仓库到自己的 GitHub 账号。
2. 在 Cloudflare Workers & Pages 创建项目。
3. 选择从 GitHub 仓库部署。
4. 保持默认构建命令：`npm run deploy`。
5. 绑定 D1 数据库 `DB`。
6. 默认 R2 模式需要绑定 R2 bucket `ATTACHMENTS`。
7. 保存 `JWT_SECRET` 为 Cloudflare Secret。
8. 打开 Workers 域名，注册第一个账号。

第一个注册用户会自动成为管理员。后续用户需要管理员创建邀请码。

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

| 模式 | 绑定 | 特点 |
| --- | --- | --- |
| R2 | `ATTACHMENTS` | 推荐模式，附件和 Send 文件上限按项目软限制走，当前默认 100 MB。 |
| KV | `ATTACHMENTS_KV` | 不绑卡也能用，但 Cloudflare KV 单对象限制约 25 MiB。 |

代码优先使用 R2。如果同时绑定了 R2 和 KV，`src/services/blob-store.ts` 会选择 R2。

## 首次注册

首次打开实例时注册第一个用户。注册接口会检查：

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

