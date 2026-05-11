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

正确的密码变更流程必须同时更新：

- 新的 server-side master password hash
- 重新加密后的用户 key
- 重新加密后的私钥
- 可选 KDF 参数
- `securityStamp`
- refresh token 清理

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

