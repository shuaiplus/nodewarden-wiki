---
layout: home

hero:
  name: NodeWarden
  text: Bitwarden-compatible server running on Cloudflare Workers
  tagline: Includes a Web Vault, attachments, Send, import and export, cloud backups, and compatibility paths for official clients.
  image:
    src: /nodewarden-logo.svg
    alt: NodeWarden
  actions:
    - theme: brand
      text: Start Here
      link: /guide/start
    - theme: alt
      text: Online Demo
      link: https://demo.nodewarden.app/
    - theme: alt
      text: Contributors
      link: /guide/contribute

features:
  - title: Clear Cloudflare deployment
    details: Fork the repository, connect Cloudflare Workers, bind D1 plus R2 or KV, set JWT_SECRET, and let the Worker initialize the schema at runtime.
  - title: Built-in backup center
    details: Use WebDAV or S3-compatible storage, encrypted target credentials, upload verification, retention rules, remote browsing, and restore validation.
  - title: Designed for official clients
    details: NodeWarden keeps /api/sync, attachments, Send, import and export, device sessions, and Bitwarden-compatible response shapes in view.
  - title: Deploy NodeWarden
    details: Follow the beginner path for Cloudflare Workers, D1, R2 or KV storage, JWT_SECRET, first administrator registration, and client connection.
    link: /guide/start
    linkText: Start the deployment path
  - title: Operate an instance
    details: Keep an existing instance healthy with updates, backup scope, remote backup flow, restore validation, incidents, and platform limits.
    link: /guide/operate
    linkText: Open the operations path
  - title: Contribute to the project
    details: Skip straight to architecture, routing, storage schema, API behavior, compatibility rules, frontend structure, and development conventions.
    link: /guide/contribute
    linkText: Read contributor docs
---
