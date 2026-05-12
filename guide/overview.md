# Project Overview

NodeWarden is a Bitwarden-compatible server running on Cloudflare Workers. It is not a full clone of the official Bitwarden server. Instead, it puts a personal vault, an original Web Vault, attachments, Send, import and export, a backup center, and administration features into a lightweight deployment model.

You can think of it in three layers:

- **Server compatibility layer**: Provides the official-client APIs needed for `/identity/*`, `/api/sync`, `/api/ciphers/*`, attachments, Send, prelogin, token refresh, and related flows.
- **Web Vault**: The `webapp/` directory is an original frontend. It does not depend on the official Bitwarden Web Vault, and it supports vault management, import and export, the backup center, administrator pages, and more.
- **Cloudflare runtime layer**: The Worker handles APIs and static assets, D1 stores structured data, R2 or KV stores attachments and Send files, and a Durable Object powers realtime notifications.

## Who it is for

NodeWarden is for people who want a self-hosted vault, low operating cost, and a deployment model built around Cloudflare Workers. It is especially suitable for personal, family, and small-team instances.

It is not for scenarios that require enterprise organizations, collection permissions, SSO, SCIM, directory sync, or official commercial support. NodeWarden does not currently implement Bitwarden's organization and collection permission model, so it should not be treated as a replacement for Bitwarden Enterprise.

## Difference from Vaultwarden

Vaultwarden is a mature Rust server designed for traditional servers, Docker, databases, and self-managed reverse proxies. NodeWarden takes a different route: it prioritizes Cloudflare Workers, keeps deployment lighter, reduces the operations surface, and builds the backup center, Web Vault, and Cloudflare storage support directly into the project.

## Current feature overview

| Feature | Status | Notes |
| --- | --- | --- |
| Official client login | Supported | Password login, refresh tokens, and API key login are implemented. |
| `/api/sync` | Supported | Returns the profile, folders, ciphers, domains, sends, and decryption options expected by clients. |
| Web Vault | Supported | `webapp/` provides an original Web Vault. |
| Attachments | Supported | R2 is preferred, KV is optional, and KV objects are limited by Cloudflare's 25 MiB object limit. |
| Send | Supported | Text Send, file Send, public access tokens, and access-count control. |
| Import and export | Supported | Supports Bitwarden JSON, CSV, ZIP, and NodeWarden extended formats. |
| Cloud backup center | Supported | WebDAV and S3-compatible storage, schedules, retention, remote browsing, and restore. |
| Multi-user | Supported | The first user becomes administrator automatically; later users usually register by invitation. |
| Organizations and collections | Not supported | `collections` currently returns an empty array and no organization permission model is implemented. |

## Design principles

NodeWarden follows several long-term principles:

- **Compatibility first**: Official clients may submit fields the server does not yet understand. Cipher data tries to preserve unknown fields so client upgrades do not cause the server to erase data.
- **Layered secret handling**: `JWT_SECRET`, backup target passwords, S3 secrets, and similar values are not treated as ordinary plaintext settings.
- **Backup allowlists**: Instance backups export only explicitly allowed tables and fields. Runtime locks, temporary tokens, audit logs, and other live-state data are not carried into backups.
- **Explainable failures**: Restore failures, attachment recovery, missing `JWT_SECRET`, KV large-file limits, and similar cases try to produce clear errors.

## Reading path

If you only want to deploy and use NodeWarden, start with:

- [Start Here](/guide/start)

If you already run an instance and need maintenance material, use:

- [Operate NodeWarden](/guide/operate)

If you plan to change code, review technical behavior, or contribute patches, use:

- [Contribute to NodeWarden](/guide/contribute)
