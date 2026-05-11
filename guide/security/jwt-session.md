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

When a token is refreshed, the old refresh token is shortened into a small overlap window. This absorbs races where a browser extension popup and background process refresh at the same time.

When the Web Vault logs in with `X-NodeWarden-Web-Session: 1`, the refresh token is stored in the `nodewarden_web_refresh` HttpOnly cookie. Web local storage should not contain plaintext refresh tokens. Official clients and browser extensions still store and submit refresh tokens according to their own protocol.

## Device binding

If a client submits a device identifier, the server creates or updates a device record and writes these fields into the access token:

- `did`
- `dstamp`

During token verification, the server checks whether the device exists and whether the token's device session stamp matches the current device record.

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
