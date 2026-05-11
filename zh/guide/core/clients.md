# 客户端连接

NodeWarden 目标是兼容官方 Bitwarden 客户端常用工作流，包括桌面端、浏览器扩展、移动端和网页端。

## 服务器地址

在官方客户端里选择自托管服务器，然后填入你的 Worker 域名：

```text
https://your-nodewarden.example.com
```

不要填 `/api` 或 `/identity`，客户端会自己拼接路径。

## 登录流程

官方客户端通常会先请求：

1. `/identity/accounts/prelogin`：获取 KDF 参数。
2. `/identity/connect/token`：用主密码 hash 登录。
3. `/api/sync`：同步 profile、folders、ciphers、domains、sends 等数据。

NodeWarden 会返回客户端需要的字段，例如 `email_verified`、`amr`、`premium`、`UserDecryptionOptions`、`userDecryption` 等，以兼容当前官方客户端解析逻辑。

服务端路径大致是：

```text
/identity/accounts/prelogin -> src/handlers/identity.ts
/identity/connect/token     -> src/handlers/identity.ts + src/services/auth.ts
/api/sync                   -> src/handlers/sync.ts
```

密码登录成功后，服务端会：

1. 校验客户端提交的 master password hash。
2. 如果用户启用了 TOTP，先返回官方客户端能识别的 2FA challenge。
3. 记录或更新设备信息。
4. 签发 access token。
5. 生成 refresh token，并按客户端类型决定返回给客户端还是写入网页端 HttpOnly cookie。
6. 返回用户 key、privateKey、KDF 参数和解密选项。

网页端和官方客户端的差异主要在 refresh token 存放方式。网页端登录会带 `X-NodeWarden-Web-Session: 1`，服务端把 refresh token 写入 `nodewarden_web_refresh` HttpOnly cookie；官方客户端仍按 Bitwarden 协议拿到 refresh token。

## API Key 登录

客户端凭据模式使用：

- `client_id = user.<用户ID>`
- `client_secret = API Key`
- `scope = api`

API Key 可在网页端账号安全区域生成或轮换。轮换 API Key 会更新 `securityStamp` 并清理该用户 refresh token，使旧会话失效。

API Key 登录只解决认证，不解锁密码库。客户端仍需要本地已有的密钥材料或用户主密码派生结果来解密 vault。维护 API Key 逻辑时要同时看：

- `src/handlers/accounts.ts`：查看或轮换 API Key。
- `src/handlers/identity.ts`：`client_credentials` grant。
- `src/services/auth.ts`：access token 和 refresh token。
- `webapp/src/hooks/useAccountSecurityActions.ts`：网页端操作和提示。

## 2FA

当前 NodeWarden 支持用户级 TOTP：

- 登录时如果用户启用了 TOTP，会返回官方客户端可识别的 2FA challenge。
- 支持记住设备 token。
- 支持恢复码关闭 TOTP，并在使用后轮换恢复码。

当前不支持组织级、邮件、WebAuthn 等完整 Bitwarden 2FA provider。

恢复码关闭 TOTP 会更新 `securityStamp`，清理 refresh token，并轮换新的恢复码。记住设备 token 会绑定 device identifier，不是全局免 2FA 令牌。

## 设备和会话

官方客户端会提交 device identifier、device name、device type 等信息。NodeWarden 会把设备写入 `devices` 表，并把 `did` 和 `dstamp` 放进 access token。

后续验证 token 时，如果设备记录不存在，或 token 里的 device session stamp 和当前设备记录不一致，该 token 会失效。因此：

- 删除设备会让该设备旧 token 失效。
- 更新设备 session stamp 可以让单设备重新登录。
- 清理 refresh token 会让旧 refresh 流程失效，但已签发的 access token 还要靠 `securityStamp` 或设备 stamp 拦截。

## 客户端兼容边界

NodeWarden 当前没有实现组织、集合、成员权限和企业策略。同步响应中的 `collections` 和 `policies` 会保持空结构，以避免客户端误判。

如果某个官方客户端升级后出现同步成功但解密失败，优先检查：

- `/api/sync` 返回的 cipher 字段形状。
- `EncString` 是否有效。
- `UserDecryptionOptions` 是否完整。
- SSH key、FIDO2、附件字段是否被客户端新增要求。

排查兼容问题时，不要只看 HTTP 状态码。很多官方客户端会在 `/api/sync` 返回 200 后，因为某个字段 shape 不符合预期而本地解密失败或直接崩溃。优先保存一份失败前的 sync 响应，再对照 `src/handlers/ciphers.ts` 的 `cipherToResponse()` 和 `src/handlers/sync.ts` 的过滤逻辑。
