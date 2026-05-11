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
      text: Quick Start
      link: /guide/quick-start
    - theme: alt
      text: Online Demo
      link: https://demo.nodewarden.app/

features:
  - title: Clear Cloudflare deployment
    details: Fork the repository, connect Cloudflare Workers, bind D1 plus R2 or KV, set JWT_SECRET, and let the Worker initialize the schema at runtime.
  - title: Built-in backup center
    details: Use WebDAV or S3-compatible storage, encrypted target credentials, upload verification, retention rules, remote browsing, and restore validation.
  - title: Designed for official clients
    details: NodeWarden keeps /api/sync, attachments, Send, import and export, device sessions, and Bitwarden-compatible response shapes in view.
---
