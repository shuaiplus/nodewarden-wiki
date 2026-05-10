# 两步验证与设备

NodeWarden 当前实现的是用户级 TOTP，不是完整企业级 2FA provider 系统。

## 启用 TOTP

启用时需要：

- TOTP secret
- 当前验证码

服务端会规范化 secret，验证当前 token。如果验证通过，保存 `totp_secret`，并生成 `totp_recovery_code`。

启用或关闭 TOTP 后，会删除该用户 refresh token，要求客户端重新登录。

## 登录挑战

如果用户启用了 TOTP，密码验证通过后，服务端会返回官方客户端能识别的 2FA challenge：

- `TwoFactorProviders`
- `TwoFactorProviders2`
- `SsoEmail2faSessionToken`
- `MasterPasswordPolicy`
- OAuth 风格错误字段

Android 客户端对 provider 值比较敏感，所以代码里兼容了恢复码 provider 的不同历史值。

## 记住设备

如果用户勾选记住设备，服务端会生成 trusted two factor token，并绑定到 device identifier。

下次登录使用 remember provider 时，服务端会检查：

- token 是否存在。
- token 是否绑定当前 device identifier。
- token 是否属于当前用户。
- token 是否过期。

## 恢复码

恢复码可以关闭 TOTP。恢复成功后：

- `totp_secret` 清空。
- 恢复码轮换。
- `securityStamp` 更新。
- refresh token 全部删除。

恢复码应该离线保存。不要把它写到主密码提示里。

## 设备列表

设备表保存：

- device identifier
- 名称
- 类型
- session stamp
- 设备加密 key
- 禁用状态
- 最近访问时间

设备相关操作会影响 token 验证。删除设备后，该设备绑定的 token 会失效。

