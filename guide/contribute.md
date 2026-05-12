# Contribute to NodeWarden

This path is for people who want to modify NodeWarden or review technical changes. If you only want to deploy an instance, start with [Start Here](/guide/start) instead.

## Architecture path

1. [Architecture Overview](/guide/architecture/overview) - see how the Worker, frontend assets, APIs, D1, R2, KV, cron, and Durable Object notifications fit together.
2. [Backend Routes and Services](/guide/architecture/backend-routing-services) - follow requests through routers, handlers, services, storage, rate limits, and backup boundaries.
3. [Frontend Architecture](/guide/architecture/frontend) - understand the Vite and Preact Web Vault, routing, sessions, React Query, i18n, and mobile UX.
4. [Storage Schema](/guide/architecture/storage-schema) - understand D1 migrations, runtime schema initialization, tables, indexes, and backup contracts.

## Compatibility path

1. [Compatibility Strategy](/guide/architecture/compatibility) - keep official Bitwarden clients working across upgrades.
2. [API Reference](/guide/core/api-reference) - inspect public, authenticated, vault, attachment, Send, device, domain, and administrator APIs.
3. [Realtime Notifications](/guide/architecture/realtime-notifications) - understand WebSocket and SignalR-compatible notification behavior.

## Change path

1. [Change Map](/guide/architecture/change-map) - find the right code area before making a change.
2. [Development Conventions](/guide/architecture/development) - follow validation commands, i18n rules, backup contracts, and cipher field rules.
