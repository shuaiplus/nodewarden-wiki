# Passkey Login

NodeWarden supports Passkey (WebAuthn/FIDO2) account login, providing a passwordless login experience.

## What is Passkey

Passkey is a modern authentication method based on FIDO2/WebAuthn standards:

- **Passwordless** - Uses biometrics (fingerprint, Face ID) or PIN
- **Phishing-resistant** - Keys bound to domain, cannot be stolen by phishing sites
- **Multi-device sync** - Supports cloud sync (iCloud, Google Password Manager, etc.)
- **User verification** - Built-in second factor

## Features

NodeWarden Passkey features:

- ✅ Create and manage multiple Passkey credentials
- ✅ Login with Passkey
- ✅ PRF (Pseudo-Random Function) vault key unlock
- ✅ Compatible with official Bitwarden browser extension (Chromium-based)
- ✅ Passkey counts as second factor (satisfies 2FA requirement)
- ⚠️ Maximum 5 Passkeys per account

## How to Use

### Create Passkey

1. Login to NodeWarden Web app
2. Go to `Settings` → `Security` → `Passkey Login`
3. Click `Add Passkey`
4. Enter master password for verification
5. Name your Passkey (e.g., "iPhone", "YubiKey")
6. Choose whether to enable for vault unlock
7. Follow browser prompts to complete Passkey creation

**Creation options:**

- **Login only** - Passkey only authenticates identity, still requires master password to unlock vault after login
- **Vault unlock** - Passkey can directly unlock vault without master password (recommended)

### Login with Passkey

**NodeWarden Web:**

1. Visit login page
2. Click `Login with Passkey`
3. Browser shows Passkey selector
4. Select Passkey and verify (fingerprint/Face ID/PIN)
5. Automatically enter vault

**Official Browser Extension (Chromium only):**

1. Open browser extension login page
2. Click `Login with passkey`
3. Complete Passkey verification
4. Automatically enter vault

### Manage Passkeys

**View Passkey list:**
- `Settings` → `Security` → `Passkey Login`

**Delete Passkey:**
1. Find item in Passkey list
2. Click delete button
3. Enter master password to confirm

**Enable vault unlock:**

If not enabled during creation, can enable later:

1. Find item in Passkey list
2. Click `Enable for unlock`
3. Enter master password for verification
4. Follow prompts to complete PRF key creation

## Browser Compatibility

### NodeWarden Web App

| Browser | Create Passkey | Login | Vault Unlock |
|---------|---------------|-------|--------------|
| Chrome (Desktop) | ✅ | ✅ | ✅ |
| Edge (Desktop) | ✅ | ✅ | ✅ |
| Safari (macOS) | ✅ | ✅ | ✅ |
| Safari (iOS) | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ⚠️ Limited PRF support |
| Chrome (Android) | ✅ | ✅ | ✅ |

### Official Bitwarden Clients

| Client | Passkey Login Support |
|--------|---------------------|
| Browser Extension (Chromium) | ✅ |
| Browser Extension (Firefox) | ❌ |
| Browser Extension (Safari) | ❌ |
| Desktop App | ❌ Current version |
| Mobile App | ❌ Current version |
| Web Vault | ✅ |

**Limitations:**

- Firefox/Safari extension environments cannot override RP ID as required by official implementation, so official extensions don't offer Passkey functionality
- Desktop and mobile client Passkey support depends on official Bitwarden updates

## Passkey Device Support

### Platform Authenticators

**Windows Hello:**
- Built into Windows 10/11
- Supports fingerprint, facial recognition, PIN

**Touch ID / Face ID:**
- macOS and iOS devices
- iCloud Keychain sync

**Android:**
- Built into Android 9+
- Google Password Manager sync

### Security Keys

Supports FIDO2 hardware security keys:

- YubiKey 5 series
- Google Titan Security Key
- Other FIDO2-compliant keys

## Security Considerations

### Passkey vs Master Password

| Feature | Passkey | Master Password |
|---------|---------|----------------|
| Phishing-resistant | ✅ Domain-bound | ❌ User vulnerable |
| Brute-force resistant | ✅ Hardware rate-limited | ⚠️ Depends on strength |
| Multi-device sync | ✅ Platform sync | ❌ Manual memorization |
| Offline capable | ✅ | ✅ |
| Server stores no secret | ✅ Public key only | ⚠️ Stores hash |

### PRF Key Mechanism

When vault unlock is enabled, NodeWarden uses PRF (Pseudo-Random Function):

1. During Passkey verification, authenticator generates pseudo-random output
2. Output derives symmetric key (PRF Key)
3. PRF Key decrypts encapsulated vault key (User Key)
4. **PRF output never transmitted to server**

This ensures:
- Server cannot decrypt vault
- Vault remains secure even if server compromised
- Lost Passkey can be recovered with master password

### Best Practices

1. **Register multiple Passkeys** - Avoid single point of failure
   - Primary device Passkey (e.g., iPhone)
   - Backup device Passkey (e.g., iPad)
   - Hardware security key as ultimate backup

2. **Keep master password** - Passkey is supplement, not replacement
   - Master password for key rotation
   - Recovery method if all Passkeys lost

3. **Safeguard security keys**
   - Store hardware keys separately
   - Record recovery codes (if any)

4. **Regular audits**
   - Delete Passkeys for unused devices
   - Update Passkey names to reflect current devices

## Troubleshooting

### Passkey Creation Fails

**Possible causes:**
- Browser doesn't support WebAuthn
- Authenticator doesn't support PRF extension
- Reached 5 Passkey limit

**Solutions:**
- Update browser to latest version
- Delete unused old Passkeys
- Use different authenticator

### Passkey Login Fails

**Possible causes:**
- Passkey was deleted
- Network connection issue
- Credential ID mismatch

**Solutions:**
- Try master password login
- Check network connection
- Contact admin to check account status

### Vault Unlock Fails

**Symptoms:**
- Passkey verification succeeds but vault remains locked
- Prompts "Master password required"

**Possible causes:**
- Passkey not enabled for vault unlock
- PRF key generation failed
- Browser doesn't support PRF extension

**Solutions:**
- Delete Passkey and recreate, ensure "vault unlock" checked
- Use PRF-capable browser (Chrome, Edge, Safari)
- Login with master password instead

### Official Extension Doesn't Show Passkey Option

**Possible causes:**
- Using Firefox or Safari extension
- Extension version too old
- Server configuration issue

**Solutions:**
- Use in Chromium-based browser (Chrome, Edge, Brave)
- Update extension to latest version
- Use Passkey in NodeWarden Web app

## Technical Details

### WebAuthn Parameters

**Registration:**
- `residentKey: required` - Discoverable credential
- `userVerification: required` - User verification required
- `attestation: none` - No device attestation needed

**Authentication:**
- `allowCredentials: []` - Empty list, discoverable mode
- `userVerification: required` - User verification required

### PRF Extension

**Salt:**
```
SHA-256("passwordless-login")
```

**Key Derivation:**
```
PRF output (32 bytes)
  ↓ HKDF-Expand
  ├─ enc key (32 bytes)
  └─ mac key (32 bytes)
```

### Database Schema

Passkey credentials stored in `webauthn_credentials` table:

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | UUID |
| user_id | TEXT | Owner user |
| name | TEXT | User-defined name |
| credential_id | TEXT | Base64url encoded |
| public_key | TEXT | COSE format public key |
| counter | INTEGER | Signature counter |
| supports_prf | INTEGER | PRF support flag |
| encrypted_user_key | TEXT | PRF-encrypted User Key |
| encrypted_public_key | TEXT | For key rotation |
| encrypted_private_key | TEXT | For key rotation |

### API Endpoints

**Public:**
- `GET /identity/accounts/webauthn/assertion-options` - Get authentication options
- `POST /identity/connect/token` - `grant_type=webauthn`

**Authenticated:**
- `GET /api/webauthn` - List Passkeys
- `POST /api/webauthn/attestation-options` - Get registration options
- `POST /api/webauthn` - Save new Passkey
- `POST /api/webauthn/:id/delete` - Delete Passkey
- `PUT /api/webauthn` - Update PRF keyset

See [API Reference](../core/api-reference.md) for details.

## Related Documentation

- [Account Security](../security/accounts.md)
- [Two-Factor Authentication](../security/two-factor-devices.md)
- [Offline Usage](../client/offline-usage.md#passkey-prf-unlock)
- [Frontend Architecture](../architecture/frontend.md)

## References

- [WebAuthn Standard](https://www.w3.org/TR/webauthn-3/)
- [FIDO2 Specification](https://fidoalliance.org/fido2/)
- [Passkeys.dev](https://passkeys.dev/)
