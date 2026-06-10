# PWA Features

NodeWarden's web client is a Progressive Web App (PWA) that can be installed and used like a native application on your device.

## Features

### App Installation

When accessing NodeWarden in PWA-supported browsers (Chrome, Edge, Safari, etc.), you can install it to:

- **Desktop** - Runs as a standalone window without browser chrome
- **Home Screen** - Add to home screen on mobile devices, launches like a native app

### App Shortcuts

Installed NodeWarden provides quick launch shortcuts:

- **Open Vault** - Jump directly to the vault page
- **TOTP Codes** - Quick access to TOTP verification codes

Right-click the app icon on desktop to see these shortcuts.

### Offline Support

PWA provides offline capabilities through Service Worker:

- **App Shell Caching** - App interface loads even when offline
- **Static Resource Caching** - Icons, styles, scripts are automatically cached
- **API Response Caching** - Vault data cached locally
- **Offline Fallback Page** - Friendly message when network is unavailable

See [Offline Usage](./offline-usage.md) for details.

## How to Install

### Chrome / Edge (Desktop)

1. Visit NodeWarden URL
2. Install icon (⊕) appears in address bar
3. Click install icon and confirm
4. App window opens automatically after installation

### Safari (macOS)

1. Visit NodeWarden URL
2. Menu bar: `File` → `Add to Dock`
3. Confirm addition

### Safari (iOS)

1. Open NodeWarden in Safari
2. Tap the share button
3. Select `Add to Home Screen`
4. Confirm addition

### Android Chrome

1. Visit NodeWarden URL
2. Browser automatically prompts for installation
3. Or tap menu → `Install app`

## Display Modes

NodeWarden PWA supports the following display modes (in priority order):

1. **window-controls-overlay** - Borderless window on desktop with title bar integrated into app
2. **standalone** - Standalone app window without browser UI

## Browser Compatibility

| Browser | Install Support | Offline Support | App Shortcuts |
|---------|----------------|-----------------|---------------|
| Chrome (Desktop) | ✅ | ✅ | ✅ |
| Edge (Desktop) | ✅ | ✅ | ✅ |
| Safari (macOS) | ✅ | ✅ | ⚠️ Partial |
| Safari (iOS) | ✅ | ✅ | ❌ |
| Chrome (Android) | ✅ | ✅ | ✅ |
| Firefox | ⚠️ Limited | ✅ | ❌ |

## Comparison with Desktop Client

PWA version compared to official desktop clients:

**Advantages:**
- No download or installation required
- Automatic updates
- Consistent cross-platform experience
- Small storage footprint

**Limitations:**
- Browser security restrictions
- Limited system integration features
- Depends on browser environment

## Technical Details

NodeWarden PWA uses the following technologies:

- **Web App Manifest** - Defines app metadata, icons, shortcuts
- **Service Worker** - Provides offline caching and background sync
- **Cache API** - Manages static resources and API response caching
- **IndexedDB** - Stores vault data and offline unlock records

Related architecture docs: [Frontend Architecture](../../architecture/frontend.md)

## FAQ

### How to uninstall PWA?

**Chrome / Edge (Desktop):**
1. Open the app
2. Click menu (⋮) in top right
3. Select `Uninstall NodeWarden`

**Safari (macOS):**
- Drag icon out of dock to remove

**Mobile Devices:**
- Long press icon and delete like any regular app

### Does PWA auto-update?

Yes. Service Worker checks for updates on each launch. New versions download in the background and take effect on next launch.

### What are offline mode limitations?

Offline mode only accesses cached data. Cannot perform operations requiring server validation, such as creating new items, uploading attachments, or changing passwords. See [Offline Usage Limitations](./offline-usage.md#limitations).

### Where is PWA data stored?

PWA data is stored in browser local storage:
- **localStorage** - Offline unlock records
- **IndexedDB** - Vault data cache
- **Cache Storage** - Static resources and API responses

Clearing browser data will also clear these caches.
