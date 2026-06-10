# Backup Providers

NodeWarden supports remote backup to cloud storage services via WebDAV and S3 protocols.

## Supported Protocols

### WebDAV

WebDAV is supported by many cloud storage providers. NodeWarden connects via standard WebDAV client protocol.

### S3 (Amazon S3 Compatible)

NodeWarden supports any S3-compatible storage service, including AWS S3 and third-party implementations.

## Recommended Providers

### OneDrive (via Koofr)

**Why through Koofr:**
- Microsoft doesn't provide native WebDAV access to OneDrive
- Koofr offers free WebDAV bridge to OneDrive
- No actual storage used on Koofr, directly accesses your OneDrive

**Setup:**
1. Create Koofr account at [https://koofr.eu/](https://koofr.eu/)
2. Connect OneDrive in Koofr settings
3. Get WebDAV credentials
4. Configure in NodeWarden with URL: `https://app.koofr.net/dav/OneDrive`

**Free tier:** 5GB (OneDrive limit)

---

### Google Drive (via Koofr)

Similar to OneDrive, access Google Drive through Koofr.

**WebDAV URL:** `https://app.koofr.net/dav/GoogleDrive`  
**Free tier:** 15GB (shared with Gmail)

---

### Cloudflare R2 (S3 Compatible)

Natural choice if already using Cloudflare for NodeWarden deployment.

**Free tier:** 10GB storage per month, no egress fees  
**Pros:** Zero egress charges, fast global network

---

### Backblaze B2 (S3 Compatible)

Cost-effective S3-compatible storage.

**Pricing:** First 10GB free, $0.005/GB/month thereafter

---

## Comparison Table

| Provider | Protocol | Free Tier | Best For |
|----------|----------|-----------|----------|
| OneDrive (Koofr) | WebDAV | 5GB | Existing OneDrive users |
| Google Drive (Koofr) | WebDAV | 15GB | Existing Google users |
| Cloudflare R2 | S3 | 10GB/month | NodeWarden on Cloudflare |
| Backblaze B2 | S3 | 10GB | Cost-conscious users |

## Related Documentation

- [Backup Overview](./overview.md)
- [Remote Backup Flow](./remote-flow.md)
- [Restore Process](./restore.md)
- [Backup Encryption](./settings-crypto.md)
