# Permissions, Rate Limits, and Audit

## Administrator permissions

The first registered user automatically becomes an administrator. Later users are regular users by default and usually need an invite to register.

The backup center, user management, invites, and similar administrator features check:

```text
role === "admin" && status === "active"
```

Disabled users are rejected after authentication even if their token has not expired.

## Rate limits

Rate limits are controlled by `src/services/ratelimit.ts` and `src/config/limits.ts`.

| Scenario | Default |
| --- | --- |
| Public APIs | 60 requests/minute/IP |
| Public read-only APIs | 120 requests/minute/IP |
| Sensitive public or authenticated APIs | 30 requests/minute/IP |
| Authenticated API | 200 requests/minute/user |
| Registration | 5 requests/minute/IP |
| Refresh token | 30 requests/minute/IP |
| Password hint | 1 request/minute/IP and 3 requests/hour/IP |
| Login failure lockout | Lock for 2 minutes after 10 failures |

Login failure records are stored in `login_attempts_ip`, and expired records are cleaned at low frequency.

## Large request limits

Regular JSON APIs default to a 25 MiB maximum body size. File upload paths are exceptions, such as:

- Attachment upload
- Send file upload
- Backup import

File sizes are controlled separately by attachment and Send limits.

## Audit logs

Audit logs are stored in the `audit_logs` table. Current logs include:

- First administrator registration
- Invite registration
- Password changes
- Backup setting updates
- Manual or scheduled remote backup success and failure
- Instance backup export
- Instance backup import
- Remote backup deletion

Current instance backups do not export audit logs. Audit logs are runtime trace data, not core vault data.
