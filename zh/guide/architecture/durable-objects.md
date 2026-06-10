# Durable Objects 架构

NodeWarden 使用 Cloudflare Durable Objects 来实现长期运行任务和实时通知。

## 什么是 Durable Objects

Durable Objects 是 Cloudflare Workers 提供的有状态计算服务：

- **持久化存储** - 每个 DO 实例有独立的存储空间
- **强一致性** - 同一对象的请求序列化处理
- **分布式协调** - 适合实现分布式锁、任务队列
- **WebSocket 支持** - 原生支持 WebSocket 连接管理

## NodeWarden 中的 Durable Objects

NodeWarden 使用两个 Durable Objects：

### 1. NotificationsHub

**用途：** 实时通知推送

**位置：** `src/durable/notifications-hub.ts`

**功能：**
- WebSocket 连接管理
- SignalR 协议支持（JSON 和 MessagePack）
- 实时推送保险库同步通知
- 设备在线状态管理
- 备份进度推送

**通知类型：**
- `SYNC_VAULT` (5) - 保险库同步
- `LOG_OUT` (11) - 登出通知
- `DEVICE_STATUS` (12) - 设备状态变更
- `BACKUP_RESTORE_PROGRESS` (13) - 备份/恢复进度

**特性：**
- 支持设备标识过滤（targetDeviceIdentifier）
- SignalR 心跳自动响应
- 多协议编码（JSON/MessagePack）

---

### 2. BackupTransferRunner

**用途：** 备份任务协调和执行

**位置：** `src/durable/backup-transfer-runner.ts`

**功能：**
- 备份任务互斥锁（防止并发备份）
- 定时备份调度
- 远程备份上传
- 远程备份还原
- 附件批量下载

**内部 Endpoints：**
- `/internal/run-configured-backup` - 执行配置的备份
- `/internal/run-scheduled-backups` - 执行定时备份
- `/internal/restore-remote-backup` - 还原远程备份
- `/internal/upload-attachment-chunk` - 上传附件分片
- `/internal/download-remote-attachment` - 下载单个远程附件
- `/internal/download-remote-attachment-batch` - 批量下载附件

**任务租约机制：**
- 租约时长：10 分钟
- 心跳间隔：30 秒
- 防止任务重复执行
- 自动续租

---

## 为什么使用 Durable Objects

### NotificationsHub 为什么需要 DO

**问题：** Workers 是无状态的，无法维持 WebSocket 连接状态

**解决：**
- 每个用户一个 DO 实例（通过 userId 路由）
- DO 维持该用户所有设备的 WebSocket 连接
- 当保险库变更时，通知推送到正确的 DO 实例

**好处：**
- 连接状态隔离
- 用户粒度的状态管理
- 支持设备级定向推送

### BackupTransferRunner 为什么需要 DO

**问题：** 备份任务可能耗时很长（几分钟到十几分钟）

**解决：**
- 全局单例 DO（idFromName 固定）
- 通过租约机制防止并发备份
- 长时间任务不受 Worker CPU 限制影响

**好处：**
- 任务互斥保证（同时只有一个备份任务）
- 支持长时间运行（超过 Worker 30秒 CPU 限制）
- 任务心跳续租
- 定时触发器可靠执行

---

## 配置

### wrangler.toml

```toml
[[durable_objects.bindings]]
name = "NOTIFICATIONS_HUB"
class_name = "NotificationsHub"

[[durable_objects.bindings]]
name = "BACKUP_TRANSFER_RUNNER"
class_name = "BackupTransferRunner"

[[migrations]]
tag = "v1-notifications-hub"
new_sqlite_classes = [ "NotificationsHub" ]

[[migrations]]
tag = "v2-backup-transfer-runner"
new_sqlite_classes = [ "BackupTransferRunner" ]
```

### 实例路由

**NotificationsHub：**
```typescript
const id = env.NOTIFICATIONS_HUB.idFromName(userId);
const stub = env.NOTIFICATIONS_HUB.get(id);
await stub.fetch('https://notifications/internal/notify', ...);
```

**BackupTransferRunner：**
```typescript
const id = env.BACKUP_TRANSFER_RUNNER.idFromName('singleton');
const stub = env.BACKUP_TRANSFER_RUNNER.get(id);
await stub.fetch('https://backup/internal/run-configured-backup', ...);
```

---

## 调用示例

### 推送实时通知

```typescript
import { notifyUserVaultSync } from './durable/notifications-hub';

// 保险库变更后通知用户
notifyUserVaultSync(env, userId, new Date().toISOString(), contextId);
```

### 执行备份任务

```typescript
const id = env.BACKUP_TRANSFER_RUNNER.idFromName('singleton');
const stub = env.BACKUP_TRANSFER_RUNNER.get(id);

const response = await stub.fetch('https://backup/internal/run-configured-backup', {
  method: 'POST',
  body: JSON.stringify({
    actorUserId: userId,
    trigger: 'manual',
    destinationId: 'destination-id',
  }),
});
```

---

## 性能和成本

### 定价模型

- **请求费用** - 每百万请求 $0.15
- **持续时间费用** - 每百万 GB-秒 $12.50
- **免费额度** - 每月 100 万请求

### 优化建议

**NotificationsHub：**
- 按用户 ID 路由，确保同一用户连接在同一实例
- 使用 `setWebSocketAutoResponse` 自动响应 ping/pong
- 惰性清理断开的连接

**BackupTransferRunner：**
- 全局单例，减少实例数量
- 心跳续租避免频繁重新获取锁
- 批量上传附件（chunk）减少请求次数

---

## 限制

### Workers 限制

- **CPU 时间** - Worker 中调用 DO 不消耗 Worker CPU 时间
- **并发连接** - NotificationsHub 每个实例无明确连接数限制

### Durable Objects 限制

- **存储上限** - 每个 DO 实例 128 KB（NotificationsHub 仅存内存状态，不受限）
- **并发性** - 同一 DO 实例请求串行化处理
- **WebSocket** - 每个 DO 最多 10,000 个并发连接

### NodeWarden 设计约束

**NotificationsHub：**
- 按用户隔离，单用户设备数量通常 < 10
- 不会触及连接数限制

**BackupTransferRunner：**
- 全局单例 + 互斥锁
- 同时只有一个备份任务运行
- 避免并发冲突

---

## 故障排除

### NotificationsHub 连接失败

**症状：**
- 实时通知不工作
- WebSocket 握手失败

**可能原因：**
- DO binding 未配置
- migrations 未执行
- userId 路由错误

**解决方法：**
- 检查 `wrangler.toml` 中 `durable_objects.bindings`
- 确认 migrations 已部署
- 检查 WebSocket URL 中的 `nw_uid` 参数

### BackupTransferRunner 任务卡住

**症状：**
- 备份任务无响应
- 新备份提示"已有任务进行中"

**可能原因：**
- 任务租约未释放
- DO 实例异常

**解决方法：**
- 等待租约过期（10 分钟）
- 检查备份任务日志
- 重新部署 Worker（重置 DO 状态）

### 备份心跳超时

**症状：**
- 长时间备份中途失败

**可能原因：**
- 网络传输缓慢
- 心跳未正常续租

**解决方法：**
- 减少单次备份附件数量
- 增加 `BACKUP_JOB_LEASE_MS` 时长
- 使用更快的备份目标

---

## 相关文档

- [备份概览](../../guide/backup/overview.md)
- [远程备份流程](../../guide/backup/remote-flow.md)
- [实时通知](./realtime-notifications.md)
- [后端路由和服务](./backend-routing-services.md)
