# Client Connections

NodeWarden aims to support common official Bitwarden client workflows, including desktop, browser extension, mobile, and the Web Vault.

## Server URL

In an official client, choose a self-hosted server and enter your Worker domain:

```text
https://your-nodewarden.example.com
```

Do not append `/api` or `/identity`. The client appends protocol paths itself.

## Login flow

Official clients usually call:

1. `/identity/accounts/prelogin`: fetch KDF parameters.
2. `/identity/connect/token`: log in with the master password hash.
3. `/api/sync`: sync profile, folders, ciphers, domains, sends, and related data.

NodeWarden returns fields required by current clients, including `email_verified`, `amr`, `premium`, `UserDecryptionOptions`, and `userDecryption`.

The approximate server path is:

```text
/identity/accounts/prelogin -> src/handlers/identity.ts
/identity/connect/token     -> src/handlers/identity.ts + src/services/auth.ts
/api/sync                   -> src/handlers/sync.ts
```

After a successful password login, the server:

1. Verifies the submitted master password hash.
2. Returns a client-compatible 2FA challenge if TOTP is enabled.
3. Records or updates device information.
4. Signs an access token.
5. Generates a refresh token, then either returns it to the client or stores it in an HttpOnly cookie for the Web Vault.
6. Returns the user key, private key, KDF parameters, and decryption options.

The main difference between the Web Vault and official clients is refresh-token storage. Web login sends `X-NodeWarden-Web-Session: 1`, so the server stores the refresh token in the `nodewarden_web_refresh` HttpOnly cookie. Official clients still receive and store refresh tokens according to the Bitwarden protocol.

## API key login

Client credentials mode uses:

- `client_id = user.<userId>`
- `client_secret = API Key`
- `scope = api`

The API key can be created or rotated in the Web Vault account security area. Rotating it updates `securityStamp` and clears the user's refresh tokens so old sessions are invalidated.

API key login authenticates the client, but it does not unlock the vault. The client still needs local key material or a key derived from the master password to decrypt vault data. When maintaining API key behavior, check:

- `src/handlers/accounts.ts`: view or rotate API key.
- `src/handlers/identity.ts`: `client_credentials` grant.
- `src/services/auth.ts`: access and refresh tokens.
- `webapp/src/hooks/useAccountSecurityActions.ts`: Web Vault actions and messages.

## 2FA

NodeWarden currently supports user-level TOTP:

- If TOTP is enabled, login returns a 2FA challenge official clients can understand.
- Remembered device tokens are supported.
- Recovery codes can disable TOTP and are rotated after use.

Organization-level, email, WebAuthn, and the full Bitwarden 2FA provider set are not currently supported.

Using a recovery code to disable TOTP updates `securityStamp`, clears refresh tokens, and rotates a new recovery code. A remembered-device token is bound to a device identifier; it is not a global 2FA bypass token.

## Devices and sessions

Official clients submit a device identifier, device name, device type, and related data. NodeWarden writes devices to the `devices` table and includes `did` and `dstamp` in access tokens.

When a token is later verified, the server checks whether the device record exists and whether the token's device session stamp matches the current record. Therefore:

- Deleting a device invalidates old access tokens from that device.
- Updating a device session stamp can force one device to log in again.
- Clearing refresh tokens breaks old refresh flows, while existing access tokens still need `securityStamp` or device stamp checks.

## Compatibility boundary

NodeWarden does not currently implement organizations, collections, member permissions, or enterprise policies. `collections` and `policies` in sync responses stay as empty structures so personal vault client flows can continue.

If an official client can sync but fails to open the vault after an update, check:

- The shape of cipher fields in `/api/sync`.
- Whether `EncString` values are valid.
- Whether `UserDecryptionOptions` is complete.
- Whether SSH key, FIDO2, or attachment fields gained new client expectations.

Do not debug compatibility only by HTTP status. Many official clients receive a 200 from `/api/sync` and then fail locally because a response field shape is wrong. Save the failing sync response and compare it against `cipherToResponse()` in `src/handlers/ciphers.ts` and the filtering logic in `src/handlers/sync.ts`.
