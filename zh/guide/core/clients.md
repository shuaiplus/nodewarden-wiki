# 客户端连接

NodeWarden 目标是兼容官方 Bitwarden 客户端常用工作流，包括桌面端、浏览器扩展、移动端和网页端。

## 服务器地址

在官方客户端里选择自托管服务器，填入 Worker 域名（不要带 `/api` 或 `/identity`）：

```text
https://your-nodewarden.example.com
```

## 登录流程

1. `/identity/accounts/prelogin` — KDF 参数  
2. `/identity/connect/token` — 主密码 hash（或 Passkey / API Key / 已记住的 2FA）  
3. `/api/sync` — 同步保险库数据  

返回字段包含 `email_verified`、`amr`、`UserDecryptionOptions` 等。网页端通过 `X-NodeWarden-Web-Session: 1` 将 refresh token 写入 HttpOnly cookie。

## Passkey 登录

账户级 WebAuthn/FIDO2 登录见 [Passkey 登录](/zh/guide/security/passkey-login)。通行密钥也可配置为第二因素。

## API Key 登录

`client_credentials` 模式；服务端以**哈希**存储 API Key。轮换会更新 `securityStamp` 并清除 refresh token。API Key 只认证客户端，不解锁保险库。

## 两步登录

支持用户级 **TOTP**、**YubiKey OTP**、**通行密钥 2FA**、记住设备、恢复码。见 [两步验证与设备](/zh/guide/security/two-factor-devices)。组织级邮件 2FA、SSO 等未实现；部分未支持路由返回明确「不支持」。

## 登录请求与 Fill-assist

免密批准与跨设备解锁使用 auth request；客户端可调用 `POST /fill-assist`。见 [登录请求](/zh/guide/core/login-requests)。

## 设备与会话

设备写入 `devices` 表；access token 含 `did`/`dstamp`。在 **设置 → 安全** 管理设备。v1.7.x 起支持设备注册路由。

## 条目类型与 TOTP

同步包含银行账户、驾驶证、护照等扩展类型。条目 TOTP 遵循 EncString 规则，支持 `steam://`。