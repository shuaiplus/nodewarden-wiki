# Start Here

This path is for people who want to deploy and use NodeWarden. You do not need to read the architecture or contributor pages first.

## Read in this order

1. [Project Overview](/guide/overview) - confirm whether NodeWarden fits your use case.
2. [Quick Start](/guide/quick-start) - deploy the Worker, set storage, add `JWT_SECRET`, and register the first administrator.
3. [Cloudflare Deployment](/guide/deployment/cloudflare) - check Workers, D1, R2, KV, assets, cron, and Durable Object bindings.
4. [Configuration and Secrets](/guide/deployment/configuration) - understand runtime config, secrets, and backup target settings.
5. [Client Connections](/guide/core/clients) - connect official Bitwarden clients and understand login, sync, API key, 2FA, and device behavior.

## If something breaks

- [FAQ](/guide/operations/faq) answers the common questions first.
- [Troubleshooting](/guide/operations/troubleshooting) gives step-by-step checks for deployment, registration, login, sync, attachments, backups, and restores.
- [Limits and Boundaries](/guide/operations/limitations) explains Cloudflare limits and unsupported Bitwarden Enterprise features.

## What to skip for now

Architecture, storage schema, API reference, and development conventions are contributor material. You can ignore them until you plan to modify NodeWarden itself.
