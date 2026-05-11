# Backup Settings Encryption

Backup targets store sensitive values such as WebDAV passwords, S3 access keys, and S3 secret keys. NodeWarden does not store them as ordinary plaintext JSON in D1. It uses a v2 encrypted envelope.

Relevant code lives in `src/services/backup-settings-crypto.ts`.

## v2 envelope shape

```json
{
  "version": 2,
  "runtime": {
    "iv": "...",
    "ciphertext": "..."
  },
  "portable": {
    "iv": "...",
    "ciphertext": "...",
    "wraps": [
      {
        "userId": "...",
        "wrappedKey": "..."
      }
    ]
  }
}
```

The structure has two goals:

- Runtime: the current server can decrypt settings automatically and run scheduled backups.
- Portable: after backup restore or migration, an administrator can repair backup settings.

## Runtime encryption

The runtime part uses:

- HKDF-SHA256
- Input key: `JWT_SECRET`
- Salt: `nodewarden.backup-settings.runtime.v2`
- Info: `runtime`
- Derived key: 256-bit AES-GCM key
- Encryption: AES-GCM with a random 12-byte IV over the settings JSON

As long as `JWT_SECRET` is unchanged, the server can decrypt backup settings and run remote backups from cron.

If `JWT_SECRET` changes, runtime decryption fails, and the backup center asks an administrator to reactivate or repair settings.

## Portable encryption

The portable part uses a random DEK:

1. Generate a random 32-byte DEK.
2. Encrypt the same settings JSON with the DEK as an AES-GCM key.
3. Find all active admin users with a `publicKey`.
4. Wrap the DEK with each administrator public key using RSA-OAEP.
5. Store one `wrappedKey` for each administrator.

The exported backup does not contain runtime ciphertext that the current server can use directly. It keeps enough portable data for an administrator to recover.

Portable wrapping keeps the current Bitwarden/browser compatibility boundary and uses RSA-OAEP with SHA-1 hash parameters. This is not an entry point for inventing a new encryption protocol; changing it affects old backup restore and administrator key unwrap.

## Why two layers

Runtime alone is not enough: after restoring to a new instance with a different `JWT_SECRET`, backup settings would be unreadable.

Portable alone is also not enough: scheduled tasks cannot require an administrator private key every time they run.

The two-layer envelope separates the requirements:

- Daily operation uses runtime.
- Cross-instance recovery uses portable.

## Export behavior

When instance backup exports `backup.settings.v1`, it calls `exportPortableBackupSettingsEnvelope()`. The exported config keeps only portable data and clears runtime data.

After restore, `normalizeImportedBackupSettingsValue()` tries to regenerate a runtime envelope for the current instance. If the current `JWT_SECRET` cannot decrypt the imported data, portable data is kept until an administrator repairs it in the backup center.

## If no administrator public key exists

`encryptBackupSettingsEnvelope()` requires at least one active admin public key. On save, `saveBackupSettings()` checks for admin public keys first. If none are available, it falls back to plain JSON. This mainly covers early initialization or compatibility states. Normal registration requires a user public key and encrypted private key, so production instances usually use the encrypted envelope.

## Practical advice

- Do not edit `backup.settings.v1` manually.
- Do not lose `JWT_SECRET`.
- After restore, open the backup center immediately and check whether repair is required.
- Keep at least one active admin account with a valid `publicKey`.
