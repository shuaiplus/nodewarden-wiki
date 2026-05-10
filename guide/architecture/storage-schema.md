# 数据模型与迁移

NodeWarden 的 D1 schema 有两份来源：

- `migrations/0001_init.sql`：初始迁移文件。
- `src/services/storage-schema.ts`：运行时自动初始化和补齐 schema。

两者必须保持同步。

## schema 版本

`src/services/storage.ts` 里有：

```ts
const STORAGE_SCHEMA_VERSION_KEY = 'schema.version';
const STORAGE_SCHEMA_VERSION = '...';
```

Worker 初始化时会读取 `config.schema.version`。如果不同，就执行 `ensureStorageSchema()`，然后写回新版本。

新增表、列、索引时必须 bump `STORAGE_SCHEMA_VERSION`。否则旧实例不会自动重跑 schema 初始化。

## 主要表

| 表 | 作用 |
| --- | --- |
| `config` | 运行配置、schema 版本、备份配置、运行锁。 |
| `users` | 用户、主密码验证 hash、加密 key、角色、状态、TOTP、API key。 |
| `domain_settings` | 用户域名匹配规则。 |
| `user_revisions` | 每个用户的 vault revision date。 |
| `folders` | 文件夹。 |
| `ciphers` | 密码项主体和加密 JSON。 |
| `attachments` | 附件元数据。 |
| `sends` | Send 主体。 |
| `refresh_tokens` | refresh token hash 和设备绑定。 |
| `invites` | 邀请码。 |
| `audit_logs` | 审计日志。 |
| `devices` | 设备、session stamp、设备加密 key。 |
| `trusted_two_factor_device_tokens` | 记住设备 token hash。 |
| `login_attempts_ip` | 登录失败和临时锁定。 |
| `used_attachment_download_tokens` | 一次性附件下载 token 消费记录。 |

## 外键与索引

密码库核心表按用户隔离，并有常用索引：

- `idx_ciphers_user_updated`
- `idx_ciphers_user_archived`
- `idx_ciphers_user_deleted`
- `idx_ciphers_user_deleted_updated`
- `idx_ciphers_user_folder`
- `idx_folders_user_updated`
- `idx_attachments_cipher`
- `idx_sends_user_updated`
- `idx_sends_user_deletion`

这些索引直接影响 `/api/sync`、分页列表、回收站、归档和批量操作性能。

## D1 bind 细节

D1 `.bind()` 不接受 `undefined`。`StorageService.safeBind()` 会把 `undefined` 转成 `null`，避免客户端传来的未知字段或缺省字段导致运行时错误。

## 新增持久数据的 checklist

新增表或字段时检查：

1. 改 `migrations/0001_init.sql`。
2. 改 `src/services/storage-schema.ts`。
3. bump `STORAGE_SCHEMA_VERSION`。
4. 判断是否进入实例备份。
5. 如果进入备份，改 `backup-archive.ts`、`backup-import.ts` 和前端备份类型。
6. 判断是否影响 `/api/sync`。
7. 判断是否需要更新审计日志或限流。

