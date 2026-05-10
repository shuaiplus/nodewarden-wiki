---
layout: home

hero:
  name: NodeWarden
  text: Cloudflare 上的轻量 Bitwarden 兼容服务端
  tagline: 自带网页密码库、附件、Send、导入导出、云端备份中心与官方客户端兼容能力。
  actions:
    - theme: brand
      text: 在线 Demo
      link: https://nodewarden-demo.pages.dev/
    - theme: alt
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 备份设计
      link: /guide/backup/overview

features:
  - title: 部署足够简单
    details: Fork 后接入 Cloudflare Workers，绑定 D1、R2 或 KV，再保存 JWT_SECRET 即可开始使用。
  - title: 备份不是摆设
    details: 支持 WebDAV 与 S3 兼容存储，配置密钥加密保存，远程上传后做校验，恢复前做结构验证。
  - title: 面向官方客户端兼容
    details: /api/sync、附件、Send、导入导出和设备会话都按 Bitwarden 客户端行为持续兼容。
---

<div class="nw-home">

  <section class="nw-snapshot">
    <div class="nw-panel nw-terminal">
      <div class="nw-terminal-bar"><span></span><span></span><span></span></div>
      <pre><code>git clone https://github.com/shuaiplus/NodeWarden.git
cd NodeWarden
npm install
npx wrangler login
npm run deploy
npx wrangler secret put JWT_SECRET</code></pre>
    </div>

    <div class="nw-metrics">
      <div class="nw-panel nw-metric">
        <strong>Workers + D1</strong>
        <span>无服务器运行，数据库自动初始化。</span>
      </div>
      <div class="nw-panel nw-metric">
        <strong>R2 / KV</strong>
        <span>附件和 Send 文件优先 R2，也可用 KV 低门槛部署。</span>
      </div>
      <div class="nw-panel nw-metric">
        <strong>WebDAV / S3</strong>
        <span>远程备份、定时任务、保留策略和还原校验。</span>
      </div>
    </div>
  </section>

  <section class="nw-section">
    <h2>为什么写这份 Wiki</h2>
    <div class="nw-grid">
      <div class="nw-panel nw-card">
        <h3>把部署讲到能落地</h3>
        <p>不是只列命令，而是说明 D1、R2、KV、JWT_SECRET、Pages Demo、自动更新和首次注册之间的关系。</p>
      </div>
      <div class="nw-panel nw-card">
        <h3>把后端设计讲出来</h3>
        <p>备份白名单、shadow 表还原、附件增量上传、运行锁、文件名 hash 校验这些平时看不到的逻辑都单独成章。</p>
      </div>
      <div class="nw-panel nw-card">
        <h3>把风险边界讲清楚</h3>
        <p>主密码不能靠改数据库恢复、JWT_SECRET 不能丢、哪些表不进备份、KV 有 25 MiB 限制，都写成明确判断。</p>
      </div>
    </div>
  </section>

  <section class="nw-section">
    <h2>推荐阅读路线</h2>
    <div class="nw-steps">
      <div class="nw-panel nw-step">
        <h3>先看 Demo</h3>
        <p>先打开在线 Demo 了解网页端交互，再决定是否部署自己的实例。</p>
      </div>
      <div class="nw-panel nw-step">
        <h3>完成部署</h3>
        <p>按快速开始绑定 Cloudflare 资源，并把 JWT_SECRET 保存成 Secret。</p>
      </div>
      <div class="nw-panel nw-step">
        <h3>配置备份</h3>
        <p>先做一次手动备份和还原演练，再打开定时远程备份。</p>
      </div>
      <div class="nw-panel nw-step">
        <h3>理解边界</h3>
        <p>阅读安全与架构章节，知道哪些行为是兼容设计，哪些是故意不支持。</p>
      </div>
    </div>
  </section>

</div>
