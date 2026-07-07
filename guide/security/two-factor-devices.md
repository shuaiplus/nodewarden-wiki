# Two-Step Login and Devices

NodeWarden implements **user-level** two-step login for personal instances: TOTP, YubiKey OTP, passkey 2FA, recovery codes, and remembered devices. It is not a full Bitwarden Enterprise 2FA provider matrix.

Device management and trusted-device removal live in the Web Vault under **Settings → Security**.

## Supported providers

| Provider | Purpose |
| --- | --- |
| Authenticator (TOTP) | Time-based codes for login 2FA and optional cipher TOTP fields (`steam://` supported in vault URIs). |
| YubiKey OTP | Hardware OTP as a managed 2FA provider. |
| Passkey | WebAuthn-based second factor at login (distinct from passkey **account login**; see [Passkey Login](/guide/security/passkey-login)). |
| Recovery code | One-time code to disable 2FA and rotate secrets. |
| Remember device | Skips 2FA on the same device until the trust token expires. |

Enabling or disabling a provider updates `securityStamp` and clears refresh tokens where required so clients must re-authenticate.

## Enabling TOTP

Enabling TOTP requires:

- TOTP secret (manual entry or QR upload in the Web Vault; QR uses camera or file upload with `jsQR` fallback when `BarcodeDetector` is incomplete)
- Current verification code

The server normalizes the secret and verifies the current token. If verification succeeds, it stores `totp_secret` and generates `totp_recovery_code`.

After enabling or disabling TOTP, the server deletes the user's refresh tokens and requires clients to log in again.

## Login challenge

If 2FA is required, after password verification succeeds the server returns a challenge official clients can recognize:

- `TwoFactorProviders`
- `TwoFactorProviders2`
- `SsoEmail2faSessionToken`
- `MasterPasswordPolicy`
- OAuth-style error fields

Android clients are sensitive to provider values, so the code keeps compatibility with historical recovery-code provider values.

A **wrong password** on the first login step does not clear an existing remembered-device token for a subsequent attempt on the same device.

## Remembered devices

If the user chooses to remember a device, the server creates a trusted two factor token and binds it to the device identifier.

On the next login with the remember provider, the server checks:

- The token exists.
- The token is bound to the current device identifier.
- The token belongs to the current user.
- The token has not expired.

## Recovery code

A recovery code can disable 2FA. After successful recovery:

- Active 2FA secrets/providers are cleared according to the recovery path.
- The recovery code is rotated.
- `securityStamp` is updated.
- All refresh tokens are deleted.

Recovery codes should be stored offline. Do not put them in the master password hint.

## Device list

The devices table stores:

- Device identifier
- Name
- Type
- Session stamp
- Device encryption key
- Disabled state
- Last access time

The Web Vault can **select and remove** individual trusted devices. Device operations affect token verification. After deleting a device, tokens bound to that device are invalid.

Official clients register devices through Bitwarden-compatible **device registration** routes added in v1.7.x. See [Client Connections](/guide/core/clients) and [Login Requests](/guide/core/login-requests).