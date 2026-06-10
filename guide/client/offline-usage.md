# Offline Usage

NodeWarden supports offline vault access, allowing you to view and use cached passwords even when the network is unavailable.

## How It Works

### Caching Strategy

NodeWarden uses a multi-layer caching strategy:

1. **Service Worker Cache**
   - App shell (HTML, CSS, JS)
   - Static resources (icons, fonts)
   - Pre-cached API responses

2. **IndexedDB Cache**
   - Vault data (ciphers, folders, sends)
   - Complete sync response snapshots
   - Attachment metadata

3. **localStorage Cache**
   - Offline unlock records
   - User preferences

### Offline Unlock

After a successful online login, NodeWarden automatically saves an offline unlock record containing:

- User email
- Encrypted Profile Key
- KDF iteration count
- Profile snapshot (username, premium status, etc.)

Next time you're offline, enter your master password to unlock the locally cached vault.

**Supported offline unlock methods:**
- ✅ Master password unlock
- ✅ Passkey PRF key unlock (if enabled)
- ❌ Biometric unlock (requires online validation)

## Network Status Detection

NodeWarden actively detects network connection status:

- **Detection timeout** - 3.5 seconds
- **Result caching** - 5 seconds
- **Detection method** - Lightweight request to server

The UI displays current connection status (online/offline) in real-time.

## Feature Availability

### Available Offline

| Feature | Offline | Notes |
|---------|---------|-------|
| View passwords | ✅ | Cached items only |
| Search items | ✅ | Local search |
| Copy passwords | ✅ | |
| TOTP generation | ✅ | Generated locally |
| View attachment list | ✅ | Metadata only |
| View Sends | ✅ | Cached only |
| View folders | ✅ | |
| Offline unlock | ✅ | Master password or Passkey PRF |

### Unavailable Offline

| Feature | Offline | Notes |
|---------|---------|-------|
| Create new items | ❌ | Requires server ID assignment |
| Edit items | ❌ | Requires server sync |
| Delete items | ❌ | Requires server confirmation |
| Upload attachments | ❌ | Requires network transfer |
| Download attachments | ❌ | Uncached attachments |
| Create Send | ❌ | Requires server URL generation |
| Change master password | ❌ | Requires server validation |
| Sync vault | ❌ | Requires network connection |
| Register account | ❌ | Requires server processing |

## Limitations

### Data Freshness

Offline cached data is a snapshot from the last successful sync. If you:

- Modified vault on another device
- Another user shared new items
- Items were deleted on server

These changes will **not** be reflected locally when offline. They'll update after next online sync.

### Storage Space

Browsers impose quota limits on PWA local storage:

- **Chrome / Edge** - Typically 60% of available space
- **Safari** - Around 1GB
- **Firefox** - Around 10% of available space, max 2GB

If cached data exceeds quota, browser may:
- Refuse to cache new data
- Clear old cache
- Prompt user for more space

Large vaults (thousands of items + extensive attachment metadata) may approach limits.

### Attachment Preview

In offline mode:
- Attachment **metadata** (filename, size) is viewable
- Attachment **content** cannot be downloaded (unless pre-cached)

Future versions may support attachment pre-caching.

### Security Considerations

Offline unlock records are stored in browser local storage:

- ✅ Profile Key encrypted with master password-derived key
- ✅ Does not contain plaintext master password
- ⚠️ Vulnerable to brute-force if device is physically accessed
- ⚠️ Clearing browser data removes offline unlock capability

**Recommendations:**
- Clear browser data after using shared devices
- Use strong master password
- Enable device encryption (BitLocker / FileVault)

## Clearing Offline Data

### Method 1: In-App Clear

1. Open NodeWarden
2. Go to `Settings` → `Security`
3. Click `Clear offline unlock records`

### Method 2: Browser Clear

**Chrome / Edge:**
1. `Settings` → `Privacy and security` → `Clear browsing data`
2. Select `Cached images and files`, `Cookies and other site data`
3. Click `Clear data`

**Safari:**
1. `Safari` → `Settings` → `Privacy`
2. Click `Manage Website Data`
3. Search for NodeWarden site and delete

**Firefox:**
1. `Settings` → `Privacy & Security`
2. `Cookies and Site Data` → `Manage Data`
3. Search for NodeWarden site and delete

## Web Worker Background Decryption

NodeWarden uses Web Workers to process vault decryption in background threads:

**Benefits:**
- Does not block UI rendering
- Interface remains responsive during large vault decryption
- Fully utilizes multi-core CPUs

**Workflow:**
1. Main thread sends encrypted data and keys to Worker
2. Worker performs key derivation and decryption
3. Worker returns decrypted vault data
4. Main thread updates UI

See [Frontend Architecture - Web Worker](../architecture/frontend.md#web-worker) for details.

## Troubleshooting

### Offline Unlock Fails

**Possible causes:**
- Never successfully logged in online on this device
- Master password was changed, offline record not updated
- Browser data was cleared

**Solution:**
- Restore network connection and login again
- Offline record auto-updates after successful login

### Incomplete Cached Data

**Possible causes:**
- Network interrupted during last sync
- Browser storage quota insufficient

**Solution:**
- Restore network connection
- Go to vault, manually trigger sync
- Clear browser cache and login again

### Service Worker Not Registered

**Symptoms:**
- App completely unavailable offline
- No offline fallback page

**Solution:**
- Check if browser supports Service Worker
- Confirm accessing HTTPS site (localhost excluded)
- Clear browser cache and refresh page

### IndexedDB Operation Failed

**Possible causes:**
- Browser private/incognito mode
- Browser settings disallow local storage

**Solution:**
- Use normal browser mode
- Check browser settings, allow site data storage

## Technical Details

### Cache Update Strategy

**Static resources:**
- Strategy: Cache First
- Background update check, takes effect on next launch

**API responses:**
- Strategy: Network First
- Return cache on network failure
- Successful responses auto-update cache

**Vault data:**
- Complete update after each successful sync
- Transaction ensures atomicity

### Offline Detection Logic

```
1. Check navigator.onLine (rough estimate)
2. Send HEAD request to /alive endpoint
3. 3.5s timeout considered offline
4. Result cached 5s to avoid frequent requests
```

### Related Files

- `webapp/src/lib/offline-auth.ts` - Offline unlock record management
- `webapp/src/lib/network-status.ts` - Network status detection
- `webapp/src/lib/vault-cache.ts` - IndexedDB vault cache
- `webapp/src/workers/vault-decrypt.worker.ts` - Web Worker decryption
- `webapp/vite.config.ts` - Service Worker generation config
