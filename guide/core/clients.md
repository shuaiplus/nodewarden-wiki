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
2. `/identity/connect/token`: log in with the master password hash (or passkey / API key / remembered 2FA).
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
2. Returns a client-compatible 2FA challenge if two-step login is enabled (TOTP, YubiKey OTP, passkey 2FA, etc.).
3. Records or updates device information (including registration routes used by newer clients).
4. Signs an access token.
5. Generates a refresh token, then either returns it to the client or stores it in an HttpOnly cookie for the Web Vault.
6. Returns the user key, private key, KDF parameters, and decryption options.

The main difference between the Web Vault and official clients is refresh-token storage. Web login sends `X-NodeWarden-Web-Session: 1`, so the server stores the refresh token in the `nodewarden_web_refresh` HttpOnly cookie. Official clients still receive and store refresh tokens according to the Bitwarden protocol.

## Passkey login

Account-level passkey login uses WebAuthn/FIDO2. See [Passkey Login](/guide/security/passkey-login). Passkeys can satisfy 2FA when configured as a second factor.

## API key login

Client credentials mode uses:

- `client_id = user.<userId>`
- `client_secret = API Key`
- `scope = api`

The API key can be created or rotated in the Web Vault account security area. The server stores API key material as a **hash**. Rotating updates `securityStamp` and clears the user's refresh tokens so old sessions are invalidated.

API key login authenticates the client, but it does not unlock the vault. The client still needs local key material or a key derived from the master password to decrypt vault data.

## Two-step login

NodeWarden supports user-level **TOTP**, **YubiKey OTP**, **passkey 2FA**, remembered devices, and recovery codes. See [Two-Step Login and Devices](/guide/security/two-factor-devices).

Organization-level email 2FA, SSO, and the full Bitwarden enterprise provider set are not implemented. Server routes that imply unsupported email verification or server-driven KDF enrollment return explicit unsupported responses.

## Login requests and fill-assist

Passwordless approval and cross-device unlock use auth requests. Clients may call `POST /fill-assist` for credential assist. See [Login Requests and Fill-Assist](/guide/core/login-requests).

## Devices and sessions

Official clients submit a device identifier, device name, device type, and related data. NodeWarden writes devices to the `devices` table and includes `did` and `dstamp` in access tokens.

When a token is later verified, the server checks whether the device record exists and whether the token's device session stamp matches the current record. Therefore:

- Deleting a device invalidates old access tokens from that device.
- Updating a device session stamp can force one device to log in again.

Manage devices in the Web Vault under **Settings → Security**.

## Cipher types and TOTP

Sync includes extended cipher types (bank account, driver's license, passport, SSH, etc.) when present. Login TOTP fields follow Bitwarden EncString rules; `steam://` URIs are supported for authenticator entries.