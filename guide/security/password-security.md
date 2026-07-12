# Password Security Check

The Web Vault includes a **Password Security** feature that checks login passwords already unlocked in the browser for three kinds of risk:

1. **Exposed** — whether the password appears in known public breach corpora (Have I Been Pwned Pwned Passwords).
2. **Reused** — whether the same password is used on more than one login item in your vault.
3. **Weak** — whether the password fails local strength heuristics (length, character classes, common lists, simple sequences).

This page documents how to use the feature, what leaves the device, and what does **not**. It is a Web Vault–only capability. Official Bitwarden mobile/desktop clients do not use this NodeWarden page.

## Where to find it

| Entry | Path / UI |
| --- | --- |
| Full vault scan | Sidebar **Password Security** (route `/security/password-health`) |
| Single login item | Vault item detail → **Check breach** (when a decrypted login password is available) |

The page is available only after unlock. Deleted login items and non-login cipher types are not scanned.

## What a full scan does

A full scan is **manual**. Nothing is sent to any breach database until you click **Start check** (or **Recheck**).

While scanning, the Web Vault:

1. Collects eligible login ciphers that have a decrypted password in the current unlocked session.
2. Computes a SHA-1 digest of each password **in the browser** (`crypto.subtle.digest`).
3. Groups identical digests so the same password is only checked once against the network.
4. For each unique digest, requests a **k-anonymity range** from Have I Been Pwned (see below).
5. Runs reuse and weakness checks **entirely offline** in the browser.
6. Shows summary metrics and a filtered list of items that need attention.

Results stay on that page session only. They are not written to D1, R2, localStorage, or instance backups.

## Single-item breach check

On a vault item detail view you can check one password without running a full vault report. The privacy model is the same: only a SHA-1 **prefix** is requested from the public range API. Reuse and weak scoring for the whole vault still require the Password Security page.

## Privacy model (k-anonymity)

NodeWarden uses the [Have I Been Pwned Pwned Passwords range API](https://haveibeenpwned.com/API/v3#PwnedPasswords) (the same family of design used widely in password managers).

### What is sent

| Sent | Not sent |
| --- | --- |
| First **5 hex characters** of the password’s SHA-1 | Password plaintext |
| HTTPS `GET` to `https://api.pwnedpasswords.com/range/{prefix}` | Full 40-character SHA-1 |
| Optional `Add-Padding: true` request header | Your NodeWarden session cookie / JWT |
| | Cipher names, usernames, URIs, or account email as part of the breach request |

Matching the remaining **35** hex characters happens **only in the browser** against the returned list of suffixes. A typical range response contains on the order of ~2,000 already-leaked hash suffixes for that prefix. A network observer who sees only the prefix does **not** learn which suffix matched (if any).

### Request hardening in the Web Vault

The client uses:

- `credentials: 'omit'` — no cookies or authorization headers on the HIBP request
- `referrerPolicy: 'no-referrer'` — your vault origin is not sent as `Referer`
- `cache: 'no-store'`
- `mode: 'cors'`
- `Add-Padding: true` — reduces response-size side channels
- A ~12s abort timeout; user cancel / page leave aborts in-flight work

Content-Security-Policy in `webapp/index.html` limits script network access with:

```text
connect-src 'self' https://api.pwnedpasswords.com;
```

So the browser is not allowed (by CSP) to open arbitrary third-party APIs from the Web Vault for this purpose—only your NodeWarden origin and the HIBP range host.

### What never goes through NodeWarden

Breach range queries go **browser → api.pwnedpasswords.com**. They do **not** pass through the Worker, D1, admin APIs, or audit logs. Self-hosted operators and administrators cannot harvest vault passwords from this feature.

Reuse and weak checks never leave the device at all.

## What “exposed / reused / weak” mean

| Label | How it is decided | Network? |
| --- | --- | --- |
| **Exposed** | Full SHA-1 computed locally; only prefix queried; suffix match yields a breach **count** from HIBP | Yes (prefix only) |
| **Reused** | Two or more eligible logins share the same full SHA-1 in this unlock session | No |
| **Weak** | Local rules: common passwords, short length, repeated characters, simple sequences, username substring, low character-class diversity | No |

An item can appear for more than one reason. Items with no risk are omitted from the attention list so the report stays actionable.

### Network failures

If the range API is unreachable, times out, or returns a non-success status for a hash, that password is counted as **unavailable** (not marked safe). The UI warns that those checks did not complete. Reuse and weak results for other passwords still apply.

## Result storage and lifecycle

| Concern | Behavior |
| --- | --- |
| Storage | In-memory module state only (`password-security-cache`) |
| Persistence | Not saved to disk or server |
| Lock vault | Cache cleared |
| Log out | Cache cleared |
| Leave authenticated app phase | Cache cleared |
| Vault data changes (fingerprint) | Fresh scan state for the new vault snapshot |

Revealing a password on the report page only toggles UI visibility of data already decrypted for the unlocked vault. It does not send the plaintext anywhere.

## Requirements and limits

- **Unlocked Web Vault session** with decrypted login passwords in memory.
- **Outbound HTTPS** from the user’s browser to `api.pwnedpasswords.com` (for the exposed check only). Offline or blocked networks can still run reuse/weak checks if a scan were limited to those—but the current full scan reports unavailable for breach rows that fail to reach HIBP.
- **Eligible ciphers**: login type (`type === 1`), not deleted, with a non-empty decrypted password.
- **Concurrency**: up to five range requests in flight to avoid flooding the public API.
- **Not a substitute for** master-password strength at account registration, 2FA, device hygiene, or official-client health reports.

## Threat model summary

| Attacker / situation | Can they learn your vault passwords from this feature? |
| --- | --- |
| Passive network observer (normal HTTPS) | No (encrypted traffic only) |
| TLS-inspecting proxy that sees HTTP path | Sees only 5-hex prefixes, not plaintext or full hash |
| Have I Been Pwned operators | Receive only prefixes (by design of the range API) |
| NodeWarden server / instance admin | No path through this feature |
| Forged HIBP responses (hostile MITM with trusted fake CA) | Can lie about breach counts; still cannot extract passwords from the protocol |
| Malware or malicious browser extension with page access while unlocked | Yes — same as any unlocked password manager UI; not unique to this check |
| XSS that fully controls the unlocked Web Vault | Yes — general frontend compromise; not introduced by k-anonymity itself |

**Bottom line:** the check is designed so that **plaintext passwords and full password hashes are never uploaded**. Network participants learn at most anonymous hash prefixes. The feature cannot be used as a remote password-exfiltration channel to NodeWarden or HIBP under its intended protocol.

## Implementation map (contributors)

| Piece | Location |
| --- | --- |
| Range client, SHA-1, weak heuristics, vault report | `webapp/src/lib/password-security.ts` |
| In-memory scan state and progress | `webapp/src/lib/password-security-cache.ts` |
| Full report UI | `webapp/src/components/PasswordSecurityPage.tsx` |
| Per-item breach button | `webapp/src/components/vault/VaultDetailView.tsx` |
| Route `/security/password-health` | `webapp/src/components/AppMainRoutes.tsx` |
| Nav link | `webapp/src/components/AppAuthenticatedShell.tsx` |
| Cache clear on lock/logout | `webapp/src/App.tsx` |
| CSP `connect-src` | `webapp/index.html` |

There is **no** corresponding Worker handler for breach lookup. Do not add a server proxy that accepts full hashes or plaintext without an explicit security review.

## Related pages

- [Accounts and Master Passwords](/guide/security/accounts)
- [Two-Step Login and Devices](/guide/security/two-factor-devices)
- [Frontend Architecture](/guide/architecture/frontend)
- [Offline Usage](/guide/client/offline-usage)
- [FAQ](/guide/operations/faq)
