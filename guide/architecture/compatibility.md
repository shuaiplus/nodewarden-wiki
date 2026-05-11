# Compatibility Strategy

NodeWarden's compatibility goal is that common official Bitwarden clients can log in, sync, read and write vault data, upload attachments, and use Send.

## Not a full enterprise protocol

NodeWarden explicitly does not implement:

- Organizations
- Collections
- Member permissions
- SSO
- SCIM
- Enterprise policies

Therefore empty `collections` and `policies` in sync responses are expected.

## EncString validation

Encrypted cipher fields must match Bitwarden EncString shape. The server validates key fields so bad data does not enter sync responses.

Examples:

- Cipher `name` must be a valid EncString before sync returns it.
- Login username, password, TOTP, and URI are normalized.
- Field names and values are normalized.
- Attachment `fileName` must be valid, or the attachment is not emitted.

## Android compatibility points

The code intentionally keeps several fields needed by Android clients:

- Token payload `email_verified` and `amr`.
- `UserDecryptionOptions` and camelCase `userDecryption`.
- SSH key `keyFingerprint`.
- Non-empty attachment `url`.
- 2FA recovery-code provider compatibility across historical values.

## Unknown field passthrough

Cipher save preserves unknown fields, and responses pass them through. If clients add fields that do not conflict with server-controlled fields, NodeWarden should not eat them.

The server primarily overwrites identity, ownership, timestamps, permissions, attachments, deletion state, and archive state.

## Stale update protection

When a client update includes `lastKnownRevisionDate`, the server checks whether the client copy is too old. If the current server `updatedAt` is newer than the client-known time beyond the threshold, the update is rejected so an old copy does not overwrite newer data.

## Debugging compatibility issues

Start with:

- Client version.
- Last `/api/sync` response before failure.
- Whether the failing cipher has invalid EncString data.
- Whether the issue involves SSH keys, FIDO2, attachments, or UserDecryption fields.
- Whether only one platform fails.
