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

## API Key 登录

客户端凭据模式使用：

- `client_id = user.<用户ID>`
- `client_secret = API Key`
- `scope = api`

API Key 可在网页端账号安全区域生成或轮换。轮换 API Key 会更新 `securityStamp` 并清理该用户 refresh token，使旧会话失效。

## 2FA

当前 NodeWarden 支持用户级 TOTP：

- 登录时如果用户启用了 TOTP，会返回官方客户端可识别的 2FA challenge。
- 支持记住设备 token。
- 支持恢复码关闭 TOTP，并在使用后轮换恢复码。

当前不支持组织级、邮件、WebAuthn 等完整 Bitwarden 2FA provider。

## 客户端兼容边界

NodeWarden 当前没有实现组织、集合、成员权限和企业策略。同步响应中的 `collections` 和 `policies` 会保持空结构，以避免客户端误判。

如果某个官方客户端升级后出现同步成功但解密失败，优先检查：

- `/api/sync` 返回的 cipher 字段形状。
- `EncString` 是否有效。
- `UserDecryptionOptions` 是否完整。
- SSH key、FIDO2、附件字段是否被客户端新增要求。

