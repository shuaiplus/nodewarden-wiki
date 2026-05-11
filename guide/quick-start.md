# Quick Start

If you want to see the interface first, open the [NodeWarden online demo](https://nodewarden-demo.pages.dev/).

- The demo is only for trying the Web Vault experience. Do not store real data in it.

## Visual deployment

1. Fork the NodeWarden repository to your GitHub account.
2. Open [Cloudflare Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create).
3. Choose **Continue with GitHub** and select your repository.
4. Set the build command to `npm run build` and the deploy command to `npm run deploy`.
   - If you plan to use KV mode, change the deploy command to `npm run deploy:kv`.
5. After deployment finishes, open the generated Workers domain.

Workers default domains are not reachable from every network. If you need a custom domain, add it in [Workers settings](https://dash.cloudflare.com/?to=/:account/workers/services/view/nodewarden/production/settings).

If the page says `JWT_SECRET` is missing, add it as a Worker Secret. Production instances should use a random string of at least 32 characters. Do not use temporary values or examples.

In this flow, Cloudflare builds and deploys the repository. `wrangler.toml` or `wrangler.kv.toml` decides the binding names. The Worker automatically initializes the D1 schema the first time it handles a request, so users do not need to upload SQL manually.

## CLI deployment

```powershell
git clone https://github.com/shuaiplus/NodeWarden.git
cd NodeWarden

npm install
npx wrangler login

# Default R2 mode
npm run deploy

# Optional KV mode
npm run deploy:kv
```

After deployment, set `JWT_SECRET`:

```powershell
npx wrangler secret put JWT_SECRET
```

Use a random `JWT_SECRET` of at least 32 characters. Do not put it in `wrangler.toml`, `.dev.vars`, GitHub logs, or the repository.

## R2 mode and KV mode

| Storage | Card required | Attachment / Send file limit | Free quota |
| --- | --- | --- | --- |
| R2 | Yes | 100 MB by default, configurable soft limit | 10 GB |
| KV | No | 25 MiB, Cloudflare limit | 1 GB |

If both R2 and KV are bound, NodeWarden prefers R2.

Choosing a storage mode decides where `src/services/blob-store.ts` writes attachment and Send file bodies:

| Mode | Config file | Binding | Behavior |
| --- | --- | --- | --- |
| R2 | `wrangler.toml` | `ATTACHMENTS` | Writes to R2 first, recommended for production attachments and file Send. |
| KV | `wrangler.kv.toml` | `ATTACHMENTS_KV` | Does not require R2, but each object is limited to 25 MiB. |

D1 stores only attachment and Send file metadata. The binary content is not stored in D1 tables.

## First registration

When the site is opened for the first time, the first registered user becomes the administrator. The registration API checks:

- Whether `JWT_SECRET` exists, is still the example value, or is too short.
- Whether email, master password hash, user key, public key, and private key are complete.
- Whether KDF parameters meet the minimum requirements.

After the first user registers, the server writes `registered=true` and records a `user.register.first_admin` audit event.

Later registrations normally require an invite. Administrators create invites in the Web Vault. The server stores them in the `invites` table and marks each invite as used after registration succeeds.

## What happens on first page load

When the browser opens the Worker domain, the Worker first tries to return frontend assets from `dist/`. After the frontend starts, it requests:

```text
GET /api/web-bootstrap
```

That endpoint returns:

- The current default KDF iteration count.
- Whether `JWT_SECRET` is missing, too short, or still the example value.
- Whether registration currently requires an invite.

If `JWT_SECRET` is unsafe, the Web Vault displays a configuration warning, and authentication APIs are blocked by the server. This prevents users from registering a real vault on a weak-secret instance.

## What to do after first login

Use this order:

1. Check whether the master password hint is safe. Do not put the real password in it.
2. Enable TOTP and save the recovery code.
3. Add a WebDAV or S3-compatible target in the backup center.
4. Run one manual remote backup.
5. Download one backup file and confirm the file name includes a hash suffix.
6. Rehearse a restore on a test instance and confirm both ciphers and attachments are recoverable.

## Where to look first when something fails

See the [Troubleshooting](/guide/operations/troubleshooting) checklist.
