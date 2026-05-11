# Attachments and Storage

NodeWarden stores attachment metadata separately from file bodies.

## Storage locations

| Data | Location |
| --- | --- |
| Attachment ID, `cipher_id`, encrypted file name, size, encrypted key | D1 `attachments` table |
| Attachment binary body | R2 `ATTACHMENTS` or KV `ATTACHMENTS_KV` |
| Send file body | R2/KV with the `sends/` key prefix |

Attachment object keys use:

```text
<cipherId>/<attachmentId>
```

Send file object keys use:

```text
sends/<sendId>/<fileId>
```

## R2 first

`src/services/blob-store.ts` chooses storage in this order:

1. If `ATTACHMENTS` is bound, use R2.
2. Otherwise, if `ATTACHMENTS_KV` is bound, use KV.
3. If neither is bound, uploads fail with “Attachment storage is not configured”.

## Size limits

NodeWarden's default attachment limit is 100 MB, but KV mode is capped at 25 MiB because of Cloudflare KV object limits.

For stable attachment and Send file support, use R2.

## Upload flow

Official clients usually upload attachments in two steps:

1. `POST /api/ciphers/{cipherId}/attachment/v2` creates attachment metadata.
2. The client receives an upload URL with a short token, then uploads the binary body.

The upload token is a short-lived JWT containing:

- `userId`
- `cipherId`
- `attachmentId`
- `exp`

The server verifies the token, cipher ownership, and attachment ownership before writing the file to R2 or KV.

## Download flow

Downloads also use short-lived tokens:

1. An authenticated user requests attachment information.
2. The server generates a download token valid for 5 minutes.
3. The client opens `/api/attachments/{cipherId}/{attachmentId}?token=...`.
4. The server verifies the token, checks that the attachment exists, and reads R2 or KV.

Download tokens include `jti`. The server records consumed `jti` values in `used_attachment_download_tokens`, so the same download token can only be used once.

## Delete flow

When deleting a cipher or attachment, the server deletes the R2/KV object first, then deletes D1 metadata. Bulk attachment deletion uses small concurrency so one Worker request does not overload storage operations.
