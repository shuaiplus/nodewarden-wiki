# Import and Export

NodeWarden has two kinds of import and export:

- **Vault import and export**: User-level, for Bitwarden JSON, CSV, ZIP, and NodeWarden extended formats.
- **Instance backup import and export**: Administrator-level, for full-site recovery. See the backup center section.

Do not mix these concepts. Vault import and export handles only the current user's vault data. Instance backup import and export can affect site users, config, folders, ciphers, domain rules, and optional attachments.

## Supported export formats

The Web Vault currently lists:

- Bitwarden JSON
- Bitwarden encrypted JSON
- Bitwarden JSON ZIP
- Bitwarden encrypted JSON ZIP
- NodeWarden JSON
- NodeWarden encrypted JSON

Bitwarden ZIP packages `data.json` and attachments. NodeWarden JSON adds `nodewardenAttachments` or encrypted attachment payloads on top of Bitwarden data.

## Encrypted export

Encrypted JSON supports two models:

- Account-key mode: uses the user's vault key to generate verification fields.
- File-password mode: derives a key from the export password and encrypts the JSON content.

File-password mode uses the account KDF parameters, PBKDF2 or Argon2id, then derives separate enc and mac subkeys.

User-level export mostly happens in the frontend. The server provides authenticated vault data and attachment download URLs. The frontend decrypts, re-encrypts, or packages the export format. When maintaining export formats, check:

- `webapp/src/lib/export-formats.ts`
- `webapp/src/lib/download.ts`
- `webapp/src/lib/api/vault.ts`
- `src/handlers/ciphers.ts`
- `src/handlers/attachments.ts`

## Import limits

The server import endpoint `/api/ciphers/import` has this count limit:

```text
folders + ciphers <= 5000
```

This prevents one Worker request from processing too much JSON and too many D1 batch operations.

During Web Vault import, parsing and encryption conversion happen in the frontend, then the result is submitted to the server. Import requests include:

```text
X-NodeWarden-Import: 1
```

The server lets `/api/ciphers/import` and attachment uploads during import bypass the normal authenticated API rate limit. This prevents large imports from being interrupted by per-minute API quotas. The bypass only applies to explicit import paths; it is not a general no-rate-limit switch.

## Bitwarden ZIP attachments

When importing a ZIP with attachments, the frontend splits the work across server APIs:

1. Import folders and ciphers.
2. Build a source-cipher to new-cipher mapping.
3. Create attachment metadata.
4. Upload attachment bodies.

This is why attachment recovery must consider both D1 metadata and R2/KV objects.

Flow:

```text
ImportPage.tsx
  -> webapp/src/lib/import-formats*.ts parses the source format
  -> POST /api/ciphers/import writes folders/ciphers
  -> POST /api/ciphers/{id}/attachment/v2 creates attachment metadata
  -> PUT/POST short-token URL uploads attachment body
```

If attachment upload fails, ciphers may already have been imported while the attachment bodies are incomplete. Import UX should show partial success clearly instead of only saying “import completed”.

## Difference from instance backup

Vault import and export is for user vault migration. It does not include administrator config, backup targets, user status, schema status, or other instance-level data.

Instance backup is for full-site recovery. It exports users, ciphers, folders, domain rules, revision dates, selected config, and optional attachments. It does not export every runtime table.

If you are changing instance-level backup, do not start from this page's user import/export code. Check:

- `src/handlers/backup.ts`
- `src/services/backup-archive.ts`
- `src/services/backup-import.ts`
- `src/services/backup-settings-crypto.ts`
- `shared/backup-schema.ts`
- `webapp/src/components/BackupCenterPage.tsx`

Instance backup includes file-name hashes, manifests, shadow tables, fresh-instance protection, and replace-existing branches. Its risk level is much higher than user-level vault import and export.
