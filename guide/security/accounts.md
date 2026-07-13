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

The correct password change flow must update the authentication credential and the wrapped vault key together:

- Store the new server-side master password authentication hash.
- Re-wrap the existing user key with the key derived from the new master password.
- Rotate `securityStamp`.
- Revoke existing refresh tokens.

A normal password change does not rotate the user key, re-encrypt vault items, or re-encrypt the private key. It also does not change KDF parameters. User-key rotation and KDF changes are separate cryptographic operations.

## Password change request compatibility

NodeWarden accepts both Bitwarden password-change request shapes during the upstream compatibility transition:

- Modern: `authenticationData` and `unlockData` must both be present. Their KDF settings and salt must agree with each other and with the account's current configuration. `unlockData.masterKeyWrappedUserKey` is required.
- Legacy: `newMasterPasswordHash` and `key` must both be present.

The built-in NodeWarden Web Vault sends only the modern request shape. Legacy support remains on the server for older Bitwarden desktop, browser, mobile, and CLI releases.

The server rejects incomplete or mixed cryptographic state before writing the user record. In particular, it never updates the authentication hash without also replacing the master-key-wrapped user key. Otherwise the new password could pass login verification while being unable to unlock the vault.

Request shape is a client protocol detail, not an account storage version. Existing accounts do not require migration, and changing a password with a legacy client does not permanently mark the account as legacy.

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
