# 常见问题

## JWT_SECRET 可以随便换吗

不可以。换了会导致旧 token 失效，备份配置 runtime 解密失败。正式环境应该用 Cloudflare Secret 长期保存。

## 忘记主密码能改数据库恢复吗

不能。`master_password_hash` 只是登录验证，不是 vault 解密密钥。改数据库无法解密已有密码库。

## 备份会备份 Send 吗

当前实例备份不导出 `sends` 表，也不导出 Send 文件。它主要备份用户、密码项、文件夹、域名规则、附件和备份配置。

## 为什么远程备份 ZIP 里没有附件文件

远程备份为了增量复用附件，附件正文单独放在远程 `attachments/` 目录。ZIP 的 manifest 记录引用。还原时会按需读取这些 blob。

本地完整导出勾选附件后，前端会拉取 blob 并重新打包成带附件文件的 ZIP。

## KV 模式为什么大附件失败

Cloudflare KV 单对象有大小限制。NodeWarden 在 KV 模式下会把附件/Send 文件限制压到 25 MiB。需要大附件请使用 R2。

## 更新后需要手动跑 SQL 吗

通常不需要。Worker 会根据 `config.schema.version` 自动运行幂等 schema 初始化。

## 第一个用户为什么是管理员

首次注册时，如果 `users` 表为空，服务端会把第一个用户设为 admin，并写入 `registered=true`。

## 可以向 Bitwarden 官方反馈 NodeWarden 的问题吗

不要。NodeWarden 是独立项目，和 Bitwarden 官方无关。遇到问题应该在 NodeWarden 项目内反馈。

