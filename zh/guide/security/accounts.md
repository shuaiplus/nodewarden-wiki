# 账号与主密码

NodeWarden 遵循 Bitwarden 类密码库的基本边界：服务端用于验证登录的 hash，不等于可以解密密码库的密钥。

## 注册保存了什么

用户注册时，客户端会提交：

- email
- name
- masterPasswordHash
- 加密后的用户 key
- 加密私钥
- 公钥
- KDF 参数
- 主密码提示

服务端会把 `masterPasswordHash` 再做一层 PBKDF2-SHA256：

```text
serverHash = PBKDF2-SHA256(clientHash, email, 100000)
```

并加上 `$s$` 前缀保存。这样即使数据库泄漏，也不能直接拿数据库里的 hash 当作客户端提交值登录。

## 主密码不能靠改数据库恢复

`users.master_password_hash` 只用于服务端登录验证。真正解密密码库需要用户的加密 key、加密私钥和主密码派生出的密钥配合。

如果忘记主密码，仅仅修改 D1 里的 `master_password_hash`，最多只能骗过服务端登录检查，无法解开已有 vault key，也就无法解密密码库。

正确的密码变更流程必须把认证凭据和密码库 key 的包装结果一起更新：

- 保存新的服务端主密码认证 hash。
- 使用新主密码派生出的密钥，重新包装原有的用户 key。
- 轮换 `securityStamp`。
- 撤销已有 refresh token。

普通改密不会轮换用户 key，也不会重新加密密码项或私钥，并且不会修改 KDF 参数。用户 key 轮换和 KDF 修改是另外的加密操作。

## 改密请求兼容

在 Bitwarden 上游协议过渡期间，NodeWarden 同时接受两种完整的改密请求：

- 新格式：必须同时提供 `authenticationData` 和 `unlockData`。两者的 KDF 参数和 salt 必须相互一致，并与账号当前配置一致；必须包含 `unlockData.masterKeyWrappedUserKey`。
- 旧格式：必须同时提供 `newMasterPasswordHash` 和 `key`。

NodeWarden 自带 Web Vault 只发送新格式。服务端继续保留旧格式，用于兼容较旧的 Bitwarden 桌面端、浏览器扩展、移动端和 CLI。

如果请求会产生不完整或互相矛盾的加密状态，服务端会在写入用户记录前直接拒绝。尤其不能只更新认证 hash 而不替换主密钥包装后的用户 key，否则新密码虽然能通过登录验证，却无法解锁密码库。

请求格式只是客户端协议细节，不是账号的存储版本。现有账号不需要迁移，使用旧客户端改过密码也不会让账号永久变成“旧格式账号”。

这由 `src/handlers/accounts.ts` 的密码变更接口处理。

## securityStamp

access token 里包含 `sstamp`。每次验证 token 时，服务端会和用户当前 `securityStamp` 比较。

如果用户改密码、轮换 API Key、恢复 2FA 等高风险操作更新了 `securityStamp`，旧 access token 会失效。

## 密码提示

密码提示只是提醒，不是恢复密钥。它会通过密码提示接口返回给请求者，因此不要写：

- 主密码
- 恢复码
- API Key
- 私钥
- 能直接推导主密码的信息

服务端只限制长度和基本格式，不可能判断提示内容是否泄密。这个责任必须由用户自己承担。

## KDF 参数

当前支持 Bitwarden 常见 KDF 参数：

- PBKDF2-SHA256：迭代次数至少 100000。
- Argon2id：迭代次数至少 2，内存至少 16 MiB，并行度至少 1。

预登录接口会返回真实用户的 KDF 参数；如果用户不存在，也返回默认参数以减少用户枚举信号。

