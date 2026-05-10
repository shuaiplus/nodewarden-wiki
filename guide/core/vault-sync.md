# 密码库与同步

密码库核心由 folders、ciphers、attachments、user_revisions 组成。官方客户端最重要的接口是 `/api/sync`。

## 数据写入

密码项写入主要经过 `src/handlers/ciphers.ts`：

- 创建密码项：`handleCreateCipher()`
- 更新密码项：`handleUpdateCipher()`
- 软删除：`handleDeleteCipher()`
- 永久删除：`handlePermanentDeleteCipher()`
- 批量移动、归档、恢复、删除：对应 bulk handler

每次影响密码库内容的操作都会更新用户 revision date，并通过 Durable Object 通知网页端或其他会话刷新。

## 未知字段保留

官方 Bitwarden 客户端可能在新版本里新增字段。NodeWarden 的密码项策略是：

1. 保存时尽量保留客户端传来的未知字段。
2. 输出时先展开存储字段，再覆盖服务端控制字段。
3. 只有明确无效或服务端拥有的字段才会被改写。

这就是 `cipherToResponse()` 里“opaque passthrough”的意义。它能减少客户端升级后字段丢失的风险。

## 服务端控制字段

这些字段不信任客户端输入，由服务端控制：

- `id`
- `userId`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `archivedAt`
- `revisionDate`
- `permissions`
- `attachments`

更新时如果客户端提交旧的 `lastKnownRevisionDate`，服务端会和现有 `updatedAt` 比较。太旧的更新会被拒绝，避免旧客户端覆盖新数据。

## `/api/sync` 响应

`src/handlers/sync.ts` 会读取：

- 用户 profile
- folders
- ciphers
- sends
- attachmentsByCipher
- domain settings

然后组装：

- `profile`
- `folders`
- `collections: []`
- `ciphers`
- `domains`
- `policies: []`
- `sends`
- `UserDecryption`
- `UserDecryptionOptions`
- `userDecryption`

同步响应会按用户 revision date 建立缓存 key。只要 revision date 不变，短时间内重复同步可以复用缓存。

## 兼容性过滤

同步时会跳过明显不兼容的 cipher 响应。例如 `name` 必须是有效的 Bitwarden EncString。这样可以避免某条坏数据导致官方客户端在 HTTP 200 后崩掉或整库无法打开。

## 分页接口

普通 `/api/ciphers` 支持分页参数。分页主要服务网页端和大库场景，避免一次性构建过多 cipher response。

