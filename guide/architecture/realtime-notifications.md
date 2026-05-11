# Realtime Notifications

Realtime notifications let the Web Vault learn about vault, device, and long-running backup task changes sooner. They are an experience optimization, not the only source of data consistency. Final state still comes from APIs and `/api/sync`.

## What users see

When a user modifies a cipher, uploads an attachment, runs a backup, or deletes a device in one window, other Web Vault sessions can refresh sooner:

- Vault changes trigger vault sync notifications and refetches.
- Device delete or logout notifications can log out target devices or refresh device lists.
- Backup export, remote backup, and restore push progress events so the page does not blindly wait.

If WebSocket disconnects, users can still refresh manually or wait for the next API query to fetch final state.

## Routes and protocol

Public routes in `src/router-public.ts`:

```text
POST /notifications/hub/negotiate
GET  /notifications/hub
```

Both require an access token. The token can be in `Authorization: Bearer ...` or in query parameter `access_token` for SignalR-style compatibility.

`handleNotificationsNegotiate()` returns WebSocket transport information. `handleNotificationsHub()` verifies the token and forwards the request to the `NotificationsHub` Durable Object.

Each user has one Durable Object instance:

```text
env.NOTIFICATIONS_HUB.idFromName(userId)
```

This gathers all Web Vault sessions for a user in one DO for broadcasting.

## WebSocket connection flow

Entry files:

- `src/handlers/notifications.ts`
- `src/durable/notifications-hub.ts`
- `webapp/src/App.tsx`
- `webapp/src/lib/app-support.ts`

Flow:

1. Frontend requests `/notifications/hub/negotiate` with the current access token.
2. Frontend connects to `/notifications/hub?access_token=...`.
3. Handler verifies the token, extracts `sub` as userId and `did` as device identifier.
4. Handler adds `nw_uid` and `nw_did` to the forwarded URL and passes it to the user's Durable Object.
5. Durable Object accepts the WebSocket and waits for the SignalR handshake.
6. Frontend sends JSON protocol handshake; server returns SignalR handshake ack.

The server supports JSON and MessagePack SignalR hub protocol output. The Web Vault currently sends JSON handshake; the DO can encode JSON or MessagePack according to the client-declared protocol.

## Notification types

Current main update types:

| Type | Meaning | Trigger |
| --- | --- | --- |
| `5` | Vault sync | Cipher, folder, attachment, Send, import, and other revision-affecting operations. |
| `11` | Log out | Delete device, clear device, or revoke trust so the target device exits. |
| `12` | Device status | WebSocket online/offline state changes. |
| `13` | Backup progress | Backup export, remote backup, and restore progress. |

Vault handlers usually update revision date first, then call `notifyUserVaultSync()`. After receiving type 5, the frontend does not trust payload data directly; it refetches and decrypts real data.

## Device targeting

If the access token contains `did`, the notification connection converts it into a Durable Object WebSocket tag:

```text
device:{deviceIdentifier}
```

The server can then notify only one device, such as forcing that device to log out after deletion. Without a target device, it broadcasts to all online sockets for the user.

`getOnlineUserDevices()` reads the DO `/internal/online` state for the device management page.

## Backup progress

Backup handlers call:

- `notifyUserBackupProgress()`
- `notifyUserBackupRestoreProgress()`

These events use update type 13. Payload includes operation, step, fileName, stageTitle, stageDetail, done, ok, and error. The frontend converts them into local progress state and messages.

This keeps remote backup, export, and restore from being modeled as one long open HTTP request. The HTTP request starts or submits work; WebSocket events carry progress.

## Failures and boundaries

Notification failure does not roll back business work. `notifyUserUpdate()` catches errors and logs them so Durable Object or WebSocket issues do not break cipher saves, attachment uploads, or backups.

Remember:

- WebSocket accelerates refresh; it is not the sole consistency mechanism.
- Clients should refetch real data after notification.
- Backup progress notification failure does not mean the backup failed.
- Device deletion has both target-device notification and refresh-token cleanup concerns.

When changing the notification protocol, check `src/durable/notifications-hub.ts`, `src/handlers/notifications.ts`, `webapp/src/App.tsx`, and `webapp/src/lib/app-support.ts`.
