# Updates and Maintenance

NodeWarden updates focus on keeping code, the D1 schema, frontend assets, and `JWT_SECRET` stable.

User-visible changes by version are documented in [`RELEASE_NOTES.md`](https://github.com/shuaiplus/NodeWarden/blob/main/RELEASE_NOTES.md) on GitHub only (not duplicated in this wiki).

## What fork users should do

If you forked the repository, click this on GitHub:

```text
Sync fork -> Update branch
```

Then wait for Cloudflare to redeploy. After deployment, the first Worker request checks the D1 schema version. If the version changed, runtime schema initialization runs automatically.

Users usually do not need to run SQL manually. The real checks are:

- Cloudflare bindings still exist, such as `DB`, `JWT_SECRET`, `NOTIFICATIONS_HUB`, `ATTACHMENTS`, or `ATTACHMENTS_KV`.
- `JWT_SECRET` was not regenerated.
- Deployment logs do not show D1 initialization failures.
- A verifiable backup exists before a major update.

## GitHub Actions in the repository

The main NodeWarden repo ships **three** workflows under `.github/workflows/`. None of them replace **Sync fork → Update branch** on GitHub; that is still how most fork owners pull new releases.

| Workflow file | Name in Actions UI | Trigger | What it does |
| --- | --- | --- | --- |
| `codeql.yml` | CodeQL Advanced | Push to any branch | GitHub CodeQL for Actions + JavaScript/TypeScript (`security-extended`, `security-and-quality`). |
| `security-extra.yml` | Extra Security Scan | Push to any branch | Gitleaks secret scan (summary + artifact) and OSV dependency scan (SARIF upload, fails on reported vulns). |
| `sync-global-domains.yml` | Sync Bitwarden global domains | Weekly cron (Mondays) or manual | Runs `npm run domains:sync`, updates only `global_domains.bitwarden.json` + `.meta.json`, verifies `global_domains.custom.json` unchanged, opens a PR. Manual run accepts optional `bitwarden_ref` (validated before sync). |

Older docs mentioned **Sync upstream** (`sync-upstream.yml`). That workflow is **not** in the current tree. Fork maintainers sync from [shuaiplus/NodeWarden](https://github.com/shuaiplus/NodeWarden) with GitHub’s fork sync or their own git workflow.

### Global domain rule sync (maintainers)

See [Domain Rules](/guide/core/domain-rules). Local equivalent:

```powershell
npm run domains:sync
npm run domains:sync -- --ref main
```

`deploy:kv` runs `node scripts/ensure-kv.cjs` before `wrangler deploy` so the KV namespace binding exists.

## Updates do not require manual migrations

The D1 schema initializer is idempotent and runs at runtime. `src/services/storage.ts` contains `STORAGE_SCHEMA_VERSION`. When that version changes, the Worker reruns SQL from `src/services/storage-schema.ts`.

You need to watch for:

- Database initialization failures in deployment logs.
- New bindings required by the new version.
- Whether the original `JWT_SECRET` is still present.

If you are contributing schema changes, update all of these together:

- `migrations/0001_init.sql`
- `src/services/storage-schema.ts`
- `STORAGE_SCHEMA_VERSION` in `src/services/storage.ts`

If the new data is persistent, also check `backup-archive.ts`, `backup-import.ts`, and frontend backup types. Otherwise the data may be writable but not restorable from backups.

## Back up before updating

Before updating, run a manual instance export in the backup center. Vault data is more valuable than the deployment itself, so make sure you have a verifiable restore point.

If remote scheduled backups are enabled, it is still wise to run one manually and confirm success. Remote backups record the last success time, file name, size, path, and error details.

## What not to do

- Do not delete the D1 database and redeploy unless you are ready to restore from backup.
- Do not reset `JWT_SECRET`.
- Do not edit `backup.settings.v1` as plain JSON. It may be an encrypted envelope.
- Do not manually clean the remote `attachments/` directory unless you have confirmed that no backup ZIP references those blobs.
- Do not submit long-term rule changes by editing generated files such as `src/static/global_domains.bitwarden.json`.
