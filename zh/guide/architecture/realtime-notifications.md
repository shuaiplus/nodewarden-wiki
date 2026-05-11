# 实时通知

实时通知用于让网页端更快感知密码库、设备和备份长任务变化。它是体验优化，不是数据一致性的唯一来源；最终状态仍以 API 和 `/api/sync` 为准。

## 用户会看到什么

用户在一个窗口里修改密码项、上传附件、运行备份或删除设备时，其他网页会话可以更快刷新：

- 密码库修改后，其他会话收到 vault sync 通知并重新拉取数据。
- 设备删除或登出通知可以让目标设备退出或刷新设备列表。
- 备份导出、远程备份和还原会推送进度，让页面不用一直盲等。

如果 WebSocket 断开，用户仍然可以手动刷新，或等下一次 API 查询拿到最终状态。

## 路由和协议

公开路由在 `src/router-public.ts`：

```text
POST /notifications/hub/negotiate
GET  /notifications/hub
```

两条路都要求 access token。token 可以放在 `Authorization: Bearer ...`，也可以放在 query 参数 `access_token`，以兼容 SignalR 风格连接。

`handleNotificationsNegotiate()` 返回 WebSocket transport 信息。`handleNotificationsHub()` 校验 token 后，把请求转发到 `NotificationsHub` Durable Object。

Durable Object 每个用户一个实例：

```text
env.NOTIFICATIONS_HUB.idFromName(userId)
```

这保证同一用户的多个网页会话集中在同一个 DO 里，方便广播。

## WebSocket 连接怎么建立

入口文件：

- `src/handlers/notifications.ts`
- `src/durable/notifications-hub.ts`
- `webapp/src/App.tsx`
- `webapp/src/lib/app-support.ts`

连接流程：

1. 前端拿当前 access token 请求 `/notifications/hub/negotiate`。
2. 前端连接 `/notifications/hub?access_token=...`。
3. handler 校验 token，取出 `sub` 作为 userId，取出 `did` 作为 device identifier。
4. handler 把 `nw_uid` 和 `nw_did` 加到转发 URL，交给用户对应的 Durable Object。
5. Durable Object 接受 WebSocket，并等待 SignalR handshake。
6. 前端发送 JSON protocol handshake，服务端返回 SignalR handshake ack。

服务端支持 JSON 和 MessagePack 两种 SignalR hub protocol 输出。网页端当前发送 JSON handshake；DO 也能按客户端声明的 protocol 选择 JSON 或 MessagePack 编码。

## 通知类型

当前主要 update type 是：

| 类型 | 含义 | 触发场景 |
| --- | --- | --- |
| `5` | vault sync | 密码项、文件夹、附件、Send、导入等会影响 vault revision 的操作。 |
| `11` | log out | 删除设备、清理设备或撤销信任后，让目标设备退出。 |
| `12` | device status | WebSocket 上下线时广播设备在线状态变化。 |
| `13` | backup progress | 备份导出、远程备份、还原进度。 |

密码库类 handler 通常会先更新 revision date，再调用 `notifyUserVaultSync()`。前端收到 type 5 后不会相信 payload 里的数据本身，而是触发重新拉取和解密。

## 设备定向

access token 里如果有 `did`，通知连接会把它转成 DO 的 WebSocket tag：

```text
device:{deviceIdentifier}
```

这样服务端可以只通知某个设备，例如删除单个设备时只让那个设备退出。没有目标设备时，就广播给这个用户的所有在线 WebSocket。

`getOnlineUserDevices()` 会通过 DO 的 `/internal/online` 读取当前在线 device identifier，用于设备管理页展示在线状态。

## 备份进度怎么走

备份相关 handler 会调用：

- `notifyUserBackupProgress()`
- `notifyUserBackupRestoreProgress()`

这些进度事件走 update type 13，payload 里包含 operation、step、fileName、stageTitle、stageDetail、done、ok 和 error。前端再把这些事件转成本地进度状态和提示。

这个设计避免把远程备份、导出和还原做成一个长时间打开的 HTTP 请求。HTTP 请求负责启动或提交任务，进度靠 WebSocket 推送。

## 失败和边界

实时通知发送失败不会回滚业务操作。`notifyUserUpdate()` 内部会捕获错误并写日志，避免 Durable Object 或 WebSocket 异常影响密码项保存、附件上传或备份流程。

维护时要记住：

- WebSocket 是加速刷新，不是唯一一致性机制。
- 客户端收到通知后应重新拉取真实数据。
- 备份进度通知失败时，备份本身仍可能成功。
- 删除设备一类操作要考虑目标设备通知和 refresh token 清理是两件事。

修改通知协议时，要同时检查 `src/durable/notifications-hub.ts`、`src/handlers/notifications.ts`、`webapp/src/App.tsx` 和 `webapp/src/lib/app-support.ts`。
