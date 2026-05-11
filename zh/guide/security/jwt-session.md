# JWT 与会话

JWT_SECRET 是 NodeWarden 最关键的部署密钥之一。它不只签登录 token，还影响附件、Send 和备份配置。

## access token

登录成功后，服务端签发 HS256 JWT，默认 7200 秒有效。payload 包含：

- `sub`：用户 id
- `email`
- `name`
- `email_verified`
- `amr`
- `sstamp`
- `did`
- `dstamp`
- `iat`
- `exp`
- `iss`
- `premium`

`email_verified`、`amr`、`premium` 等字段是为了兼容官方客户端。

## refresh token

refresh token 是随机 32 字节生成的 base64url 字符串。数据库里不是保存明文 token，而是保存：

```text
sha256:<digest>
```

刷新 token 时，旧 refresh token 会被缩短到一个短重叠窗口，用来吸收浏览器扩展 popup/background 同时刷新的竞态。

网页端使用 `X-NodeWarden-Web-Session: 1` 登录后，refresh token 会写入 `nodewarden_web_refresh` HttpOnly cookie。网页本地存储不应该保存 refresh token 明文；官方客户端和浏览器扩展仍按自身协议保存并提交 refresh token。

## 设备绑定

如果客户端提交 device identifier，服务端会创建或更新设备记录，并把：

- `did`
- `dstamp`

写入 access token。验证 token 时会检查设备是否存在，以及 token 里的 device session stamp 是否等于当前设备记录。

这意味着删除设备或更新设备 session stamp，可以让该设备旧 token 失效。

## 附件和 Send 短 token

附件下载 token 默认 5 分钟有效，并带有 `jti`。服务端会记录已消费的 jti，防止同一个下载链接反复使用。

附件上传、Send 文件上传、Send 文件下载也都有独立短 token。公开 Send V2 访问会先换取 `send_access` token，再用它访问文件内容。它们都使用 JWT_SECRET 签名。

## JWT_SECRET 变更影响

JWT_SECRET 变化后：

- 所有 access token 无法验证。
- 附件短 token 无法验证。
- Send 短 token 无法验证。
- 备份配置 runtime 加密无法解密。

所以生产环境必须把 JWT_SECRET 存成 Secret，并在所有部署间保持稳定。

## HMAC key 缓存

`src/utils/jwt.ts` 会缓存由 JWT_SECRET 导入的 HMAC CryptoKey，避免每次签名/验证都重复 importKey。缓存 key 就是 secret 字符串。
