# Vault and Sync

The vault core consists of folders, ciphers, attachments, and user revisions. The most important official-client endpoint is `/api/sync`.

## Data writes

Cipher writes mainly go through `src/handlers/ciphers.ts`:

- Create cipher: `handleCreateCipher()`
- Update cipher: `handleUpdateCipher()`
- Soft delete: `handleDeleteCipher()`
- Permanent delete: `handlePermanentDeleteCipher()`
- Bulk move, archive, restore, and delete: corresponding bulk handlers

Any operation that changes vault content updates the user's revision date and notifies the Web Vault or other sessions through the Durable Object notification hub.

## Unknown field passthrough

Official Bitwarden clients may add fields in new versions. NodeWarden's cipher policy is:

1. Preserve unknown fields submitted by the client whenever possible.
2. Expand stored fields when responding, then override server-controlled fields.
3. Rewrite only clearly invalid fields or fields owned by the server.

This is the reason for the opaque passthrough behavior in `cipherToResponse()`. It reduces the risk of losing client-added fields after a client upgrade.

## Server-controlled fields

These fields are not trusted from client input and are controlled by the server:

- `id`
- `userId`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `archivedAt`
- `revisionDate`
- `permissions`
- `attachments`

When a client submits an old `lastKnownRevisionDate`, the server compares it with the current `updatedAt`. Stale updates can be rejected to prevent an old client copy from overwriting newer data.

## `/api/sync` response

`src/handlers/sync.ts` reads:

- User profile
- Folders
- Ciphers
- Sends
- Attachments grouped by cipher
- Domain settings

It then builds:

- `profile`
- `folders`
- `collections: []`
- `ciphers`
- `domains`
- `policies: []`
- `sends`
- `UserDecryption`
- `UserDecryptionOptions`
- `userDecryption`

The sync response uses the user's revision date as part of its cache key. If the revision date does not change, repeated syncs in a short window can reuse cached output.

## Compatibility filtering

During sync, NodeWarden skips clearly incompatible cipher responses. For example, `name` must be a valid Bitwarden EncString. This avoids one bad row causing an official client to crash or fail to open the entire vault after an HTTP 200.

## Pagination

Regular `/api/ciphers` supports pagination parameters. Pagination mainly serves the Web Vault and large-vault scenarios so the frontend does not need to build too many cipher responses at once.
