# Login Requests and Fill-Assist

NodeWarden supports Bitwarden-style **login requests** (passwordless login approval on another device) and **fill-assist** (inline credential hints for clients). These flows keep official desktop and mobile clients working without Bitwarden Cloud.

## Login requests

When a client starts passwordless or cross-device login, it creates an **auth request**. Another signed-in device (or the Web Vault) can approve or deny it. The notification hub pushes updates; clients still treat `/api/sync` and token responses as the source of truth.

Typical paths:

- Authenticated management: `src/handlers/auth-requests.ts`, `webapp/src/lib/api/auth-requests.ts`
- Web Vault UI: pending requests panel and approval dialog
- Realtime: [Realtime Notifications](/guide/architecture/realtime-notifications)

**User expectations:**

- Approval requires an already unlocked trusted device or an active Web Vault session with vault access.
- Denied or expired requests do not issue tokens.
- Admin-facing compatibility endpoints exist so some enterprise-style client probes receive expected shapes; NodeWarden still does not implement full organizations.

## Cross-device unlock

Related client flows (unlock requests) share the same auth-request storage and notification patterns. Maintain them together with device records and `securityStamp` changes.

## Fill-assist

Official clients may call:

```text
POST /fill-assist
```

The handler in `src/handlers/fill-assist.ts` returns Bitwarden-compatible credential assist payloads for the requesting device. Device responses include fields clients expect for fill-assist after v1.7.2.

Fill-assist does **not** bypass master-password or 2FA requirements for full vault unlock. It only assists autofill-related client steps.

## Device registration and verification settings

v1.7.x added routes for **device registration** and **device verification settings** so mobile and desktop clients can complete setup wizards. Unsupported flows (for example server-sent email verification or server-driven KDF enrollment) return explicit unsupported responses instead of ambiguous errors.

## Push relay installation

Some clients register a push relay installation during setup. NodeWarden returns compatible responses so installation does not block login; actual push delivery still goes through the Durable Object notification hub where configured.

## Debugging

If login requests stall:

1. Confirm both devices use the same server URL and are on recent client versions.
2. Check WebSocket / SignalR handshake to the notifications hub ([Troubleshooting](/guide/operations/troubleshooting)).
3. Verify the approving account has 2FA satisfied and vault unlocked.
4. Review audit logs for auth-request approve/deny events ([Permissions, Rate Limits, and Audit](/guide/security/rate-limit-audit)).

See also [Client Connections](/guide/core/clients) and [API Reference](/guide/core/api-reference).