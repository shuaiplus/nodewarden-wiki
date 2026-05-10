# 备份内容边界

备份系统使用白名单导出和白名单导入。这样做的目的不是省事，而是避免把旧字段、敏感运行态数据、临时锁或不该迁移的 token 带到新实例。

## 会备份的内容

实例备份会导出这些表或字段：

| 表 | 内容 |
| --- | --- |
| `config` | 普通配置行，以及便携化后的 `backup.settings.v1`。 |
| `users` | 用户、主密码验证 hash、加密用户 key、加密私钥、公钥、KDF、角色、状态、TOTP 信息等。 |
| `domain_settings` | 用户等效域名、自定义域名规则、排除的全局域名规则。 |
| `user_revisions` | 每个用户的同步 revision date。 |
| `folders` | 文件夹。 |
| `ciphers` | 密码项主体、加密字段、归档/删除状态、未知兼容字段。 |
| `attachments` | 附件元数据。 |
| 附件正文 | 仅在选择包含附件时导出或远程引用。 |

## 不会备份的内容

这些数据不会进入实例备份：

| 内容 | 不备份原因 |
| --- | --- |
| `backup.runner.lock.v1` | 运行锁，只代表当前是否有任务正在执行。 |
| `users.api_key` | 旧敏感字段明确不导出，避免恢复旧密钥。 |
| `refresh_tokens` | 登录会话不应该跨实例恢复。 |
| `trusted_two_factor_device_tokens` | 记住设备 token 属于当前设备信任状态。 |
| `devices` | 设备会话和受信任设备状态不随备份迁移。 |
| `invites` | 邀请码是管理操作，不是密码库数据。 |
| `audit_logs` | 审计日志不进入当前备份格式。 |
| `login_attempts_ip` | 限流和锁定状态属于运行态。 |
| `used_attachment_download_tokens` | 一次性附件下载 token 消费记录。 |
| `sends` | 当前实例级备份不导出 Send。 |
| Send 文件正文 | 当前实例级备份不导出 Send 文件。 |

如果你依赖 Send 做长期分享，要单独处理。实例备份主要保护账号、密码库、文件夹、附件和备份配置。

## 附件是否备份

附件由两部分组成：

- D1 `attachments` 表：附件 ID、cipher_id、加密文件名、大小、加密 key。
- R2/KV blob：真正的二进制文件。

如果不勾选“包含附件”，备份会把 `attachments` 行清空导出，避免恢复后留下指向不存在文件的脏记录。

如果勾选“包含附件”，备份会记录附件元数据和 blob 引用。还原时如果某个附件文件缺失或无法写入目标存储，该附件会被跳过，并且对应附件行会从恢复后的 shadow 表里删除，不会留下坏记录。

## config 的特殊处理

`config` 表不是原样全导出。导出前会过滤：

- 跳过空 key。
- 跳过 `backup.runner.lock.v1`。
- 对 `backup.settings.v1` 只导出 portable 部分，不导出当前实例 runtime 密文。

这是备份配置能跨实例恢复的关键。

## 修改代码时的同步要求

如果未来新增持久表或字段，需要同时检查：

- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `webapp/src/lib/api/backup.ts`
- `migrations/0001_init.sql`
- `src/services/storage-schema.ts`

只改数据库 schema 不改备份，会导致新数据永远无法从备份恢复。

