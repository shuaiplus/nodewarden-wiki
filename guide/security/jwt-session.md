# JWT and Sessions

`JWT_SECRET` is one of NodeWarden's most important deployment secrets. It does more than sign login tokens; it also affects attachments, Send, and backup settings.

## Access token

After login succeeds, the server signs an HS256 JWT that is valid for 7200 seconds by default. The payload includes:

- `sub`: user ID
- `email`
- `name`
- `email_verified`
- `amr`
- `sstamp`
- `did`
- `dstamp`
- `iat`
- `exp`
- `iss`
- `premium`

Fields such as `email_verified`, `amr`, and `premium` are included for official-client compatibility.

## Refresh token

Refresh tokens are random 32-byte base64url strings. The database does not store plaintext tokens. It stores:

```text
sha256:<digest>
```

Refresh tokens follow the Bitwarden-compatible reusable model. A successful refresh returns the same opaque refresh token, issues a new short-lived access token, and extends the session's sliding idle expiry without a destructive token handoff. Web, browser, desktop, and CLI sessions use a 30-day sliding idle window; mobile sessions use 90 days. New sessions have a one-year absolute lifetime.

Only confirmed permanent conditions return `invalid_grant`, such as an expired or revoked session, an inactive user, a changed user security stamp, or an explicitly revoked device. Rate limits and temporary storage or Worker failures return retryable errors and do not invalidate the session.

When the Web Vault logs in with `X-NodeWarden-Web-Session: 1`, the refresh token is stored in the `nodewarden_web_refresh` HttpOnly cookie. Web local storage should not contain plaintext refresh tokens. Official clients and browser extensions still store and submit refresh tokens according to their own protocol.

## Device binding

If a client submits a device identifier, the server creates or updates a device record and writes these fields into the access token:

- `did`
- `dstamp`

During token verification, the server checks whether the device exists and whether the token's device session stamp matches the current device record. Historical sessions without a device binding remain user-security-stamp-bound until they naturally expire; a missing or explicitly mismatched device is never recreated automatically.

This means deleting a device or changing its session stamp can invalidate that device's old tokens.

## Attachment and Send short tokens

Attachment download tokens are valid for 5 minutes by default and include `jti`. The server records consumed `jti` values to prevent the same download link from being reused.

Attachment upload, Send file upload, and Send file download also use independent short tokens. Public Send V2 access first obtains a `send_access` token, then uses it to read file content. All of these tokens are signed with `JWT_SECRET`.

## Impact of changing `JWT_SECRET`

If `JWT_SECRET` changes:

- All access tokens fail verification.
- Attachment short tokens fail verification.
- Send short tokens fail verification.
- Backup settings runtime encryption cannot be decrypted.

Production instances must store `JWT_SECRET` as a Cloudflare Secret and keep it stable across deployments.

## HMAC key cache

`src/utils/jwt.ts` caches the HMAC `CryptoKey` imported from `JWT_SECRET` so signing and verification do not call `importKey` every time. The cache key is the secret string.
