# Durable Objects Architecture

NodeWarden uses Cloudflare Durable Objects to implement long-running tasks and real-time notifications.

## What are Durable Objects

Durable Objects are Cloudflare Workers' stateful computing service:

- **Persistent storage** - Each DO instance has independent storage
- **Strong consistency** - Requests to the same object are serialized
- **Distributed coordination** - Suitable for distributed locks, task queues
- **WebSocket support** - Native WebSocket connection management

## Durable Objects in NodeWarden

NodeWarden uses two Durable Objects:

### 1. NotificationsHub

**Purpose:** Real-time notification push

**Location:** `src/durable/notifications-hub.ts`

**Features:**
- WebSocket connection management
- SignalR protocol support (JSON and MessagePack)
- Real-time vault sync notifications
- Device online status management
- Backup progress push

**Notification types:**
- `SYNC_VAULT` (5) - Vault synchronization
- `LOG_OUT` (11) - Logout notification
- `DEVICE_STATUS` (12) - Device status change
- `BACKUP_RESTORE_PROGRESS` (13) - Backup/restore progress

**Capabilities:**
- Device identifier filtering (targetDeviceIdentifier)
- SignalR heartbeat auto-response
- Multi-protocol encoding (JSON/MessagePack)

---

### 2. BackupTransferRunner

**Purpose:** Backup task coordination and execution

**Location:** `src/durable/backup-transfer-runner.ts`

**Features:**
- Backup task mutex lock (prevents concurrent backups)
- Scheduled backup dispatch
- Remote backup upload
- Remote backup restore
- Attachment batch download

**Internal Endpoints:**
- `/internal/run-configured-backup` - Execute configured backup
- `/internal/run-scheduled-backups` - Execute scheduled backups
- `/internal/restore-remote-backup` - Restore remote backup
- `/internal/upload-attachment-chunk` - Upload attachment chunk
- `/internal/download-remote-attachment` - Download single remote attachment
- `/internal/download-remote-attachment-batch` - Batch download attachments

**Task lease mechanism:**
- Lease duration: 10 minutes
- Heartbeat interval: 30 seconds
- Prevents duplicate task execution
- Auto-renewal

---

## Why Use Durable Objects

### Why NotificationsHub Needs DO

**Problem:** Workers are stateless, cannot maintain WebSocket connection state

**Solution:**
- One DO instance per user (routed by userId)
- DO maintains all WebSocket connections for that user's devices
- When vault changes, notifications push to correct DO instance

**Benefits:**
- Connection state isolation
- User-level state management
- Device-level targeted push support

### Why BackupTransferRunner Needs DO

**Problem:** Backup tasks may take a long time (several minutes to tens of minutes)

**Solution:**
- Global singleton DO (fixed idFromName)
- Mutex via lease mechanism prevents concurrent backups
- Long-running tasks not affected by Worker CPU limits

**Benefits:**
- Task mutual exclusion guarantee (only one backup at a time)
- Long-running support (exceeds Worker 30s CPU limit)
- Task heartbeat renewal
- Reliable scheduled trigger execution

---

## Configuration

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

### Instance Routing

**NotificationsHub:**
```typescript
const id = env.NOTIFICATIONS_HUB.idFromName(userId);
const stub = env.NOTIFICATIONS_HUB.get(id);
await stub.fetch('https://notifications/internal/notify', ...);
```

**BackupTransferRunner:**
```typescript
const id = env.BACKUP_TRANSFER_RUNNER.idFromName('singleton');
const stub = env.BACKUP_TRANSFER_RUNNER.get(id);
await stub.fetch('https://backup/internal/run-configured-backup', ...);
```

---

## Usage Examples

### Push Real-time Notification

```typescript
import { notifyUserVaultSync } from './durable/notifications-hub';

// Notify user after vault change
notifyUserVaultSync(env, userId, new Date().toISOString(), contextId);
```

### Execute Backup Task

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

## Performance and Cost

### Pricing Model

- **Request fee** - $0.15 per million requests
- **Duration fee** - $12.50 per million GB-seconds
- **Free tier** - 1 million requests per month

### Optimization Suggestions

**NotificationsHub:**
- Route by user ID, ensure same user connections in same instance
- Use `setWebSocketAutoResponse` for auto ping/pong response
- Lazy cleanup of disconnected connections

**BackupTransferRunner:**
- Global singleton, reduce instance count
- Heartbeat renewal avoids frequent re-acquiring locks
- Batch upload attachments (chunks) reduces request count

---

## Limitations

### Workers Limits

- **CPU time** - Calling DO from Worker doesn't consume Worker CPU time
- **Concurrent connections** - NotificationsHub has no explicit connection limit per instance

### Durable Objects Limits

- **Storage limit** - 128 KB per DO instance (NotificationsHub only stores in-memory state, not constrained)
- **Concurrency** - Requests to same DO instance are serialized
- **WebSocket** - Max 10,000 concurrent connections per DO

### NodeWarden Design Constraints

**NotificationsHub:**
- User isolation, single user typically has < 10 devices
- Won't hit connection limits

**BackupTransferRunner:**
- Global singleton + mutex lock
- Only one backup task runs at a time
- Avoids concurrent conflicts

---

## Troubleshooting

### NotificationsHub Connection Fails

**Symptoms:**
- Real-time notifications not working
- WebSocket handshake fails

**Possible causes:**
- DO binding not configured
- Migrations not executed
- userId routing error

**Solutions:**
- Check `durable_objects.bindings` in `wrangler.toml`
- Confirm migrations deployed
- Check `nw_uid` parameter in WebSocket URL

### BackupTransferRunner Task Stuck

**Symptoms:**
- Backup task unresponsive
- New backup shows "another task in progress"

**Possible causes:**
- Task lease not released
- DO instance exception

**Solutions:**
- Wait for lease expiration (10 minutes)
- Check backup task logs
- Redeploy Worker (reset DO state)

### Backup Heartbeat Timeout

**Symptoms:**
- Long backup fails mid-way

**Possible causes:**
- Slow network transfer
- Heartbeat not renewing properly

**Solutions:**
- Reduce attachments per backup
- Increase `BACKUP_JOB_LEASE_MS` duration
- Use faster backup destination

---

## Related Documentation

- [Backup Overview](../../guide/backup/overview.md)
- [Remote Backup Flow](../../guide/backup/remote-flow.md)
- [Real-time Notifications](./realtime-notifications.md)
- [Backend Routing and Services](./backend-routing-services.md)
