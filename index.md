---
layout: home

hero:
  name: NodeWarden
  text: Cloudflare 上的轻量 Bitwarden 兼容服务端
  tagline: 自带网页密码库、附件、Send、导入导出、云端备份中心与官方客户端兼容能力。
  image:
    src: /nodewarden-logo.svg
    alt: NodeWarden
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 在线 Demo
      link: https://nodewarden-demo.pages.dev/

features:
  - title: 部署足够简单
    details: Fork 后接入 Cloudflare Workers，绑定 D1、R2 或 KV，再保存 JWT_SECRET 即可开始使用。
  - title: 备份不是摆设
    details: 支持 WebDAV 与 S3 兼容存储，配置密钥加密保存，远程上传后做校验，恢复前做结构验证。
  - title: 面向官方客户端兼容
    details: /api/sync、附件、Send、导入导出和设备会话都按 Bitwarden 客户端行为持续兼容。
---
