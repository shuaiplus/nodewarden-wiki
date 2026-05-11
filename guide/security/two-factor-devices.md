# Two-Step Login and Devices

NodeWarden currently implements user-level TOTP. It is not a full enterprise 2FA provider system.

## Enabling TOTP

Enabling TOTP requires:

- TOTP secret
- Current verification code

The server normalizes the secret and verifies the current token. If verification succeeds, it stores `totp_secret` and generates `totp_recovery_code`.

After enabling or disabling TOTP, the server deletes the user's refresh tokens and requires clients to log in again.

## Login challenge

If TOTP is enabled, after password verification succeeds the server returns a 2FA challenge official clients can recognize:

- `TwoFactorProviders`
- `TwoFactorProviders2`
- `SsoEmail2faSessionToken`
- `MasterPasswordPolicy`
- OAuth-style error fields

Android clients are sensitive to provider values, so the code keeps compatibility with historical recovery-code provider values.

## Remembered devices

If the user chooses to remember a device, the server creates a trusted two factor token and binds it to the device identifier.

On the next login with the remember provider, the server checks:

- The token exists.
- The token is bound to the current device identifier.
- The token belongs to the current user.
- The token has not expired.

## Recovery code

A recovery code can disable TOTP. After successful recovery:

- `totp_secret` is cleared.
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

Device operations affect token verification. After deleting a device, tokens bound to that device are invalid.
