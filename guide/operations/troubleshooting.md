# Troubleshooting

## API 500 after deployment

Check:

- D1 is bound as `DB`.
- `JWT_SECRET` exists and has at least 32 characters.
- `JWT_SECRET` is not the example value.
- Worker logs do not show database initialization errors.
- `NOTIFICATIONS_HUB` Durable Object migration and binding succeeded.

## Registration fails

Common causes:

- Weak or missing `JWT_SECRET`.
- Invalid email format.
- Frontend did not submit `publicKey` or `encryptedPrivateKey`.
- KDF parameters are below minimum requirements.
- Later user registration has no invite.

## Official client login fails

Check:

- Server URL does not include `/api`.
- Client can access `/identity/accounts/prelogin`.
- Password is correct.
- TOTP is required or not.
- Account is not disabled.
- Login failures did not trigger temporary lockout.

## Sync succeeds but the client cannot open the vault

Focus on:

- Whether a cipher `name` is not a valid EncString.
- Whether an attachment `fileName` is not a valid EncString.
- Whether an SSH key is missing `keyFingerprint`.
- Whether `UserDecryptionOptions` was broken.
- Whether abnormal data was recently imported.

## Attachment download returns 401

Possible causes:

- Download token expired.
- Token was already used once.
- `JWT_SECRET` changed.
- `cipherId` or `attachmentId` does not match.

## Remote backup fails

Check:

- WebDAV URL starts with `http://` or `https://`.
- WebDAV username and password are correct.
- S3 endpoint, bucket, access key, and secret key are complete.
- Remote path allows directory creation.
- Worker can reach the target storage.
- Another backup or restore task is holding the run lock.

## Restore fails

Check:

- ZIP came from a NodeWarden instance backup.
- File name hash matches.
- Target instance already has vault or Send data and may need replace-existing.
- Attachment storage is bound.
- KV mode did not hit a large attachment.
