# Accounts and Master Passwords

NodeWarden follows the basic boundary of Bitwarden-like vaults: the server-side login verification hash is not the key that decrypts the vault.

## What registration stores

During registration, the client submits:

- email
- name
- masterPasswordHash
- encrypted user key
- encrypted private key
- public key
- KDF parameters
- master password hint

The server applies another PBKDF2-SHA256 layer to `masterPasswordHash`:

```text
serverHash = PBKDF2-SHA256(clientHash, email, 100000)
```

It stores the result with an `$s$` prefix. If the database leaks, the stored hash cannot be submitted directly as the client login value.

## You cannot recover by editing the database

`users.master_password_hash` is only for server-side login verification. Decrypting the vault requires the user's encrypted key, encrypted private key, and the key derived from the master password.

If the master password is forgotten, editing `master_password_hash` in D1 can at most pass the server login check. It cannot decrypt the existing vault key or vault data.

The correct password change flow must update:

- New server-side master password hash
- Re-encrypted user key
- Re-encrypted private key
- Optional KDF parameters
- `securityStamp`
- Refresh token cleanup

That flow is handled by the password change API in `src/handlers/accounts.ts`.

## `securityStamp`

Access tokens contain `sstamp`. Each token verification compares it with the user's current `securityStamp`.

When high-risk operations such as password change, API key rotation, or 2FA recovery update `securityStamp`, old access tokens become invalid.

## Password hints

A password hint is only a reminder, not a recovery key. It is returned by the password hint endpoint, so do not put:

- Master password
- Recovery code
- API key
- Private key
- Information that directly reveals the master password

The server can enforce length and basic format, but it cannot know whether hint content leaks the password. That responsibility belongs to the user.

## KDF parameters

Current supported Bitwarden-style KDF parameters:

- PBKDF2-SHA256: at least 100000 iterations.
- Argon2id: at least 2 iterations, 16 MiB memory, and parallelism of 1.

The prelogin endpoint returns the real user's KDF parameters. If the user does not exist, it returns default parameters to reduce account enumeration signals.
