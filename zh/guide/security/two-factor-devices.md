# 两步验证与设备

NodeWarden 为个人实例提供**用户级**两步登录：TOTP、YubiKey OTP、通行密钥 2FA、恢复码与记住设备。不是完整的 Bitwarden Enterprise 2FA 矩阵。

设备管理与可信设备移除位于 Web 保险库 **设置 → 安全**。

## 支持的提供商

| 提供商 | 用途 |
| --- | --- |
| 身份验证器（TOTP） | 登录 2FA；保险库条目 TOTP 支持 `steam://` URI。 |
| YubiKey OTP | 硬件 OTP 作为可管理的 2FA 提供商。 |
| 通行密钥 | 登录时的 WebAuthn 第二因素（与 **Passkey 账户登录** 不同，见 [Passkey 登录](/zh/guide/security/passkey-login)）。 |
| 恢复码 | 一次性关闭 2FA 并轮换密钥。 |
| 记住设备 | 在同一设备上跳过 2FA，直至信任令牌过期。 |

启用或关闭提供商会在需要时更新 `securityStamp` 并清除 refresh token，要求客户端重新认证。

## 启用 TOTP

需要：

- TOTP 密钥（手动或 Web 保险库上传二维码；`BarcodeDetector` 不完整时回退 `jsQR`）
- 当前验证码

验证通过后保存 `totp_secret` 并生成 `totp_recovery_code`。启用或关闭后会删除 refresh token。

## 登录挑战

需要 2FA 时，密码验证通过后会返回官方客户端可识别的挑战字段（`TwoFactorProviders` 等）。Android 对 provider 值敏感，代码兼容历史恢复码 provider 值。

**密码错误**不会清除同一设备上已有的「记住设备」令牌，便于用户修正密码后重试。

## 记住设备 / 恢复码 / 设备列表

逻辑与英文文档一致：信任令牌绑定 device identifier；恢复码离线保存；设备表记录 session stamp 等。

Web 保险库可**选择并删除**单个可信设备。v1.7.x 起官方客户端可通过 **设备注册** 路由登记设备。见 [客户端连接](/zh/guide/core/clients)、[登录请求](/zh/guide/core/login-requests)。