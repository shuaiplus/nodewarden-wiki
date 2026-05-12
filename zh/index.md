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
      text: 从这里开始
      link: /zh/guide/start
    - theme: alt
      text: 在线 Demo
      link: https://demo.nodewarden.app/
    - theme: alt
      text: 贡献者文档
      link: /zh/guide/contribute

features:
  - title: 部署流程清晰
    details: Fork 仓库后一键部署在 Cloudflare Workers，无需手动绑定 D1、R2 或 KV，无需任何服务器。
  - title: 备份流程完整
    details: 支持 WebDAV 与 S3 兼容存储，配置密钥加密保存，远程上传后做校验，恢复前做结构验证。
  - title: 面向官方客户端兼容
    details: /api/sync、附件、Send、导入导出和设备会话都按 Bitwarden 客户端行为持续兼容。
  - title: 部署 NodeWarden
    details: 适合第一次来的用户，按顺序完成 Cloudflare Workers、D1、R2/KV、JWT_SECRET、首个管理员和客户端连接。
    link: /zh/guide/start
    linkText: 进入入门路线
  - title: 维护已有实例
    details: 适合已经部署好的人，集中查看更新、备份范围、远程备份、恢复校验、事故处理和平台限制。
    link: /zh/guide/operate
    linkText: 进入维护路线
  - title: 参与项目开发
    details: 适合要改代码的人，直接查看架构、路由、数据模型、API、兼容策略、前端结构和开发约定。
    link: /zh/guide/contribute
    linkText: 阅读贡献者文档
---
