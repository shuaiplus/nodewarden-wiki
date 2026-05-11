import { defineConfig, type DefaultTheme, type HeadConfig } from 'vitepress';

const SITE_URL = 'https://nodewarden.app';

const englishNav: DefaultTheme.NavItem[] = [
  { text: 'Quick Start', link: '/guide/quick-start' },
  { text: 'Backup Center', link: '/guide/backup/overview' },
  { text: 'Architecture', link: '/guide/architecture/overview' },
  { text: 'Demo', link: 'https://demo.nodewarden.app/' }
];

const chineseNav: DefaultTheme.NavItem[] = [
  { text: '快速开始', link: '/zh/guide/quick-start' },
  { text: '备份中心', link: '/zh/guide/backup/overview' },
  { text: '架构设计', link: '/zh/guide/architecture/overview' },
  { text: 'Demo', link: 'https://demo.nodewarden.app/' }
];

const englishSidebar: DefaultTheme.Sidebar = {
  '/guide/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Project Overview', link: '/guide/overview' },
        { text: 'Quick Start', link: '/guide/quick-start' },
        { text: 'Cloudflare Settings', link: '/guide/deployment/cloudflare' },
        { text: 'Configuration and Secrets', link: '/guide/deployment/configuration' },
        { text: 'Updates and Maintenance', link: '/guide/deployment/update' },
        { text: 'Client Connections', link: '/guide/core/clients' }
      ]
    },
    {
      text: 'Core Features',
      items: [
        { text: 'Vault and Sync', link: '/guide/core/vault-sync' },
        { text: 'Attachments and Storage', link: '/guide/core/attachments' },
        { text: 'Send and Public Access', link: '/guide/core/send' },
        { text: 'Import and Export', link: '/guide/core/import-export' },
        { text: 'API Reference', link: '/guide/core/api-reference' },
        { text: 'Domain Rules', link: '/guide/core/domain-rules' },
        { text: 'Website Icons', link: '/guide/core/website-icons' }
      ]
    },
    {
      text: 'Backup Center',
      items: [
        { text: 'Backup Overview', link: '/guide/backup/overview' },
        { text: 'Backup Scope', link: '/guide/backup/scope' },
        { text: 'Settings Encryption', link: '/guide/backup/settings-crypto' },
        { text: 'Remote Backup Flow', link: '/guide/backup/remote-flow' },
        { text: 'Restore and Validation', link: '/guide/backup/restore' }
      ]
    },
    {
      text: 'Security Design',
      items: [
        { text: 'Accounts and Master Passwords', link: '/guide/security/accounts' },
        { text: 'JWT and Sessions', link: '/guide/security/jwt-session' },
        { text: 'Two-Step Login and Devices', link: '/guide/security/two-factor-devices' },
        { text: 'Permissions, Rate Limits, and Audit', link: '/guide/security/rate-limit-audit' }
      ]
    },
    {
      text: 'Architecture and Development',
      items: [
        { text: 'Architecture Overview', link: '/guide/architecture/overview' },
        { text: 'Backend Routes and Services', link: '/guide/architecture/backend-routing-services' },
        { text: 'Frontend Architecture', link: '/guide/architecture/frontend' },
        { text: 'Storage Schema', link: '/guide/architecture/storage-schema' },
        { text: 'Compatibility Strategy', link: '/guide/architecture/compatibility' },
        { text: 'Realtime Notifications', link: '/guide/architecture/realtime-notifications' },
        { text: 'Change Map', link: '/guide/architecture/change-map' },
        { text: 'Development Conventions', link: '/guide/architecture/development' }
      ]
    },
    {
      text: 'Operations',
      items: [
        { text: 'FAQ', link: '/guide/operations/faq' },
        { text: 'Limits and Boundaries', link: '/guide/operations/limitations' },
        { text: 'Troubleshooting', link: '/guide/operations/troubleshooting' },
        { text: 'Backup Incidents', link: '/guide/operations/backup-incidents' }
      ]
    }
  ]
};

const chineseSidebar: DefaultTheme.Sidebar = {
  '/zh/guide/': [
    {
      text: '基础教程',
      items: [
        { text: '项目定位', link: '/zh/guide/overview' },
        { text: '快速开始', link: '/zh/guide/quick-start' },
        { text: 'Cloudflare 参数', link: '/zh/guide/deployment/cloudflare' },
        { text: '配置与密钥', link: '/zh/guide/deployment/configuration' },
        { text: '更新与维护', link: '/zh/guide/deployment/update' },
        { text: '客户端连接', link: '/zh/guide/core/clients' }
      ]
    },
    {
      text: '核心功能',
      items: [
        { text: '密码库与同步', link: '/zh/guide/core/vault-sync' },
        { text: '附件与文件存储', link: '/zh/guide/core/attachments' },
        { text: 'Send 与公开访问', link: '/zh/guide/core/send' },
        { text: '导入与导出', link: '/zh/guide/core/import-export' },
        { text: 'API 参考', link: '/zh/guide/core/api-reference' },
        { text: '域名规则', link: '/zh/guide/core/domain-rules' },
        { text: '网站图标', link: '/zh/guide/core/website-icons' }
      ]
    },
    {
      text: '备份中心',
      items: [
        { text: '备份能力总览', link: '/zh/guide/backup/overview' },
        { text: '备份内容边界', link: '/zh/guide/backup/scope' },
        { text: '配置加密设计', link: '/zh/guide/backup/settings-crypto' },
        { text: '远程备份流程', link: '/zh/guide/backup/remote-flow' },
        { text: '还原与校验', link: '/zh/guide/backup/restore' }
      ]
    },
    {
      text: '安全设计',
      items: [
        { text: '账号与主密码', link: '/zh/guide/security/accounts' },
        { text: 'JWT 与会话', link: '/zh/guide/security/jwt-session' },
        { text: '两步验证与设备', link: '/zh/guide/security/two-factor-devices' },
        { text: '权限、限流与审计', link: '/zh/guide/security/rate-limit-audit' }
      ]
    },
    {
      text: '架构与开发',
      items: [
        { text: '整体架构', link: '/zh/guide/architecture/overview' },
        { text: '后端路由与服务层', link: '/zh/guide/architecture/backend-routing-services' },
        { text: '前端架构', link: '/zh/guide/architecture/frontend' },
        { text: '数据模型与迁移', link: '/zh/guide/architecture/storage-schema' },
        { text: '兼容性策略', link: '/zh/guide/architecture/compatibility' },
        { text: '实时通知', link: '/zh/guide/architecture/realtime-notifications' },
        { text: '变更维护地图', link: '/zh/guide/architecture/change-map' },
        { text: '开发与代码约定', link: '/zh/guide/architecture/development' }
      ]
    },
    {
      text: '运维排错',
      items: [
        { text: '常见问题', link: '/zh/guide/operations/faq' },
        { text: '限制与边界', link: '/zh/guide/operations/limitations' },
        { text: '排错清单', link: '/zh/guide/operations/troubleshooting' },
        { text: '备份事故处理', link: '/zh/guide/operations/backup-incidents' }
      ]
    }
  ]
};

const descriptions: Record<string, string> = {
  'index.md': 'NodeWarden documentation for deploying, operating, backing up, and developing a Bitwarden-compatible server running on Cloudflare Workers.',
  'guide/overview.md': 'Understand what NodeWarden is, who it is for, which Bitwarden-compatible features it supports, and which enterprise features are intentionally out of scope.',
  'guide/quick-start.md': 'Deploy NodeWarden on Cloudflare Workers, choose R2 or KV storage, configure JWT_SECRET, register the first administrator, and run your first backup.',
  'guide/deployment/cloudflare.md': 'Cloudflare Workers, D1, R2, KV, Durable Object, assets, cron, and binding details required to run NodeWarden.',
  'guide/deployment/configuration.md': 'How NodeWarden stores deployment bindings, runtime config, JWT_SECRET, backup targets, and encrypted backup settings.',
  'guide/deployment/update.md': 'How to update a NodeWarden fork, keep D1 schema and JWT_SECRET stable, sync global domain rules, and prepare safe backups.',
  'guide/core/clients.md': 'How official Bitwarden clients connect to NodeWarden for prelogin, token login, sync, API keys, 2FA, devices, and sessions.',
  'guide/core/vault-sync.md': 'How NodeWarden stores folders, ciphers, attachments, user revisions, unknown fields, controlled fields, and /api/sync responses.',
  'guide/core/attachments.md': 'How NodeWarden stores attachment metadata in D1 and file bodies in R2 or KV, including upload, download, deletion, and size limits.',
  'guide/core/send.md': 'How NodeWarden implements text Send, file Send, public access tokens, access counts, deletion dates, and Send backup boundaries.',
  'guide/core/import-export.md': 'How user-level vault import and export differs from instance-level backup and restore in NodeWarden.',
  'guide/core/api-reference.md': 'A practical reference for NodeWarden public, authenticated, vault, attachment, Send, device, domain, and administrator APIs.',
  'guide/core/domain-rules.md': 'How NodeWarden supports Bitwarden equivalent domain rules, user custom rules, global rule sync, and domain settings backup.',
  'guide/core/website-icons.md': 'How NodeWarden proxies website icons, handles frontend lazy loading, upstream fallbacks, caching, and icon security boundaries.',
  'guide/backup/overview.md': 'NodeWarden Backup Center overview covering local exports, remote WebDAV and S3 backups, attachment reuse, upload verification, and run locks.',
  'guide/backup/scope.md': 'Which NodeWarden tables and fields are included in instance backups, which runtime data is excluded, and why the backup format uses allowlists.',
  'guide/backup/settings-crypto.md': 'How NodeWarden encrypts backup target credentials with runtime and portable envelopes for scheduled backups and cross-instance recovery.',
  'guide/backup/remote-flow.md': 'How scheduled and manual remote backups run through cron, locks, WebDAV or S3 upload, attachment indexes, verification, retention, and audit logs.',
  'guide/backup/restore.md': 'How NodeWarden validates backup ZIP files, checks hashes, restores through shadow tables, handles attachments, and protects existing instances.',
  'guide/security/accounts.md': 'How NodeWarden handles accounts, master password hashes, vault keys, password changes, securityStamp, KDF settings, and password hints.',
  'guide/security/jwt-session.md': 'How NodeWarden uses JWT_SECRET, access tokens, refresh tokens, device binding, attachment tokens, Send tokens, and HMAC key caching.',
  'guide/security/two-factor-devices.md': 'How NodeWarden supports user-level TOTP, login challenges, remembered devices, recovery codes, and device records.',
  'guide/security/rate-limit-audit.md': 'NodeWarden administrator permissions, rate limits, request size limits, and audit log coverage.',
  'guide/architecture/overview.md': 'A high-level map of NodeWarden as a single Cloudflare Worker application with frontend assets, APIs, D1, R2, KV, cron, and Durable Object notifications.',
  'guide/architecture/backend-routing-services.md': 'How NodeWarden backend requests flow through index, routers, handlers, services, storage, rate limits, and backup boundaries.',
  'guide/architecture/frontend.md': 'How the NodeWarden Vite and Preact Web Vault is structured, including routing, session handling, React Query, i18n, build strategy, and mobile UX.',
  'guide/architecture/storage-schema.md': 'How NodeWarden keeps D1 migrations, runtime schema initialization, schema versions, tables, indexes, and backup contracts in sync.',
  'guide/architecture/compatibility.md': 'NodeWarden compatibility strategy for common official Bitwarden clients, EncString validation, Android fields, unknown fields, and stale update protection.',
  'guide/architecture/realtime-notifications.md': 'How NodeWarden uses Durable Object WebSockets and SignalR-compatible messages for vault sync, device, and backup progress notifications.',
  'guide/architecture/change-map.md': 'A maintainer map for changing NodeWarden across requests, storage, sync, backup, frontend state, generated files, and validation commands.',
  'guide/architecture/development.md': 'Development conventions, validation commands, high-risk areas, i18n rules, backup contracts, and cipher field rules for NodeWarden contributors.',
  'guide/operations/faq.md': 'Short answers to common NodeWarden questions about JWT_SECRET, master password recovery, Send backups, remote attachment storage, SQL migrations, and project support.',
  'guide/operations/limitations.md': 'Known NodeWarden boundaries around Cloudflare platform limits, unsupported Bitwarden Enterprise features, partial features, and security assumptions.',
  'guide/operations/troubleshooting.md': 'Troubleshooting checks for NodeWarden deployment errors, registration failures, client login, sync issues, attachments, remote backups, and restores.',
  'guide/operations/backup-incidents.md': 'How to respond to damaged remote backups, backup setting repair prompts, partial attachment restores, deleted remote attachments, and changed JWT_SECRET.'
};

const zhDescriptions: Record<string, string> = {
  'zh/index.md': 'NodeWarden 中文文档，介绍 Cloudflare Workers 上的 Bitwarden 兼容服务端部署、备份、安全、架构和维护方式。',
  'zh/guide/overview.md': '了解 NodeWarden 的项目定位、适用人群、支持能力、设计原则，以及和 Vaultwarden 的差异。',
  'zh/guide/quick-start.md': '快速部署 NodeWarden，选择 R2 或 KV 存储，配置 JWT_SECRET，完成首次管理员注册和备份准备。',
  'zh/guide/deployment/cloudflare.md': 'NodeWarden 在 Cloudflare Workers、D1、R2、KV、Durable Object、静态资源和 cron 上的部署参数。',
  'zh/guide/deployment/configuration.md': 'NodeWarden 的部署绑定、运行时配置、JWT_SECRET、备份目标和加密配置保存方式。',
  'zh/guide/deployment/update.md': '如何更新 NodeWarden fork，保持 D1 schema、JWT_SECRET、全局域名规则和备份流程稳定。',
  'zh/guide/core/clients.md': '官方 Bitwarden 客户端连接 NodeWarden 时的预登录、登录、同步、API Key、2FA、设备和会话流程。',
  'zh/guide/core/vault-sync.md': 'NodeWarden 密码库、文件夹、附件、修订时间、未知字段保留和 /api/sync 响应机制。',
  'zh/guide/core/attachments.md': 'NodeWarden 如何把附件元数据保存在 D1，并把文件正文保存到 R2 或 KV。',
  'zh/guide/core/send.md': 'NodeWarden 的文本 Send、文件 Send、公开访问 token、访问次数、删除日期和备份边界。',
  'zh/guide/core/import-export.md': 'NodeWarden 用户级密码库导入导出和管理员实例级备份还原的区别。',
  'zh/guide/core/api-reference.md': 'NodeWarden 公开、认证、密码库、附件、Send、设备、域名和管理员接口参考。',
  'zh/guide/core/domain-rules.md': 'NodeWarden 等效域名规则、自定义域名规则、全局规则同步和域名设置备份方式。',
  'zh/guide/core/website-icons.md': 'NodeWarden 网站图标代理、前端懒加载、上游 fallback、缓存和安全边界。',
  'zh/guide/backup/overview.md': 'NodeWarden 备份中心能力总览，包括本地导出、WebDAV/S3 远程备份、附件复用、上传校验和运行锁。',
  'zh/guide/backup/scope.md': 'NodeWarden 实例备份会导出哪些表和字段，哪些运行态数据不会备份，以及白名单策略原因。',
  'zh/guide/backup/settings-crypto.md': 'NodeWarden 如何使用 runtime 和 portable 双层信封加密备份目标密钥。',
  'zh/guide/backup/remote-flow.md': 'NodeWarden 定时和手动远程备份的 cron、锁、WebDAV/S3、附件索引、校验、保留和审计流程。',
  'zh/guide/backup/restore.md': 'NodeWarden 备份 ZIP 校验、hash 检查、shadow 表还原、附件恢复和 fresh instance 保护。',
  'zh/guide/security/accounts.md': 'NodeWarden 账号、主密码 hash、vault key、密码变更、securityStamp、KDF 和密码提示安全边界。',
  'zh/guide/security/jwt-session.md': 'NodeWarden 的 JWT_SECRET、access token、refresh token、设备绑定、附件和 Send 短 token 设计。',
  'zh/guide/security/two-factor-devices.md': 'NodeWarden 用户级 TOTP、登录挑战、记住设备、恢复码和设备记录。',
  'zh/guide/security/rate-limit-audit.md': 'NodeWarden 管理员权限、限流、请求体限制和审计日志覆盖范围。',
  'zh/guide/architecture/overview.md': 'NodeWarden 作为单 Worker 应用的整体架构，涵盖前端、API、D1、R2、KV、cron 和通知层。',
  'zh/guide/architecture/backend-routing-services.md': 'NodeWarden 后端请求如何经过 index、router、handler、service、存储、限流和备份边界。',
  'zh/guide/architecture/frontend.md': 'NodeWarden Vite + Preact 网页密码库的路由、会话、React Query、i18n、构建和移动端结构。',
  'zh/guide/architecture/storage-schema.md': 'NodeWarden D1 迁移、运行时 schema 初始化、版本、表、索引和备份契约同步方式。',
  'zh/guide/architecture/compatibility.md': 'NodeWarden 对官方 Bitwarden 客户端的兼容策略、EncString 校验、Android 字段和未知字段保留。',
  'zh/guide/architecture/realtime-notifications.md': 'NodeWarden 使用 Durable Object WebSocket 和 SignalR 风格消息实现同步、设备和备份进度通知。',
  'zh/guide/architecture/change-map.md': 'NodeWarden 维护者改动地图，覆盖请求、存储、同步、备份、前端状态、自动化和验证命令。',
  'zh/guide/architecture/development.md': 'NodeWarden 开发约定、检查命令、高风险区域、i18n 规则、备份契约和密码项字段原则。',
  'zh/guide/operations/faq.md': 'NodeWarden 常见问题，涵盖 JWT_SECRET、主密码恢复、Send 备份、附件存储、SQL 迁移和项目反馈。',
  'zh/guide/operations/limitations.md': 'NodeWarden 的 Cloudflare 平台边界、未实现的 Bitwarden Enterprise 能力、部分支持能力和安全边界。',
  'zh/guide/operations/troubleshooting.md': 'NodeWarden 部署、注册、客户端登录、同步、附件、远程备份和还原的排错清单。',
  'zh/guide/operations/backup-incidents.md': 'NodeWarden 远程备份损坏、备份设置修复、附件部分恢复、误删附件目录和误换 JWT_SECRET 的处理方式。'
};

function pageUrl(relativePath: string): string {
  const clean = relativePath
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '');
  return `/${clean}`.replace(/\/+/g, '/');
}

function withSite(path: string): string {
  return new URL(path, SITE_URL).toString();
}

function alternatePaths(relativePath: string) {
  if (relativePath.startsWith('zh/')) {
    const englishPath = relativePath.slice(3);
    return {
      current: pageUrl(relativePath),
      en: pageUrl(englishPath),
      zh: pageUrl(relativePath)
    };
  }

  return {
    current: pageUrl(relativePath),
    en: pageUrl(relativePath),
    zh: pageUrl(`zh/${relativePath}`)
  };
}

function seoHead(relativePath: string, title: string, description: string): HeadConfig[] {
  const paths = alternatePaths(relativePath);
  const canonical = withSite(paths.current);
  const image = withSite('/og-image.png');

  return [
    ['link', { rel: 'canonical', href: canonical }],
    ['link', { rel: 'alternate', hreflang: 'en', href: withSite(paths.en) }],
    ['link', { rel: 'alternate', hreflang: 'zh-CN', href: withSite(paths.zh) }],
    ['link', { rel: 'alternate', hreflang: 'x-default', href: withSite(paths.en) }],
    ['meta', { property: 'og:type', content: relativePath.endsWith('index.md') ? 'website' : 'article' }],
    ['meta', { property: 'og:url', content: canonical }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: image }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: image }]
  ];
}

export default defineConfig({
  title: 'NodeWarden',
  titleTemplate: ':title | NodeWarden Wiki',
  description: descriptions['index.md'],
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: SITE_URL
  },
  head: [
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['meta', { property: 'og:site_name', content: 'NodeWarden Wiki' }],
    ['link', { rel: 'icon', href: '/nodewarden-logo.svg', type: 'image/svg+xml' }]
  ],
  transformPageData(pageData) {
    const description = descriptions[pageData.relativePath] ?? zhDescriptions[pageData.relativePath];
    if (description) {
      pageData.description = description;
    }
  },
  transformHead({ pageData, title, description }) {
    return seoHead(pageData.relativePath, title, description);
  },
  themeConfig: {
    logo: '/nodewarden-logo.svg',
    nav: englishNav,
    sidebar: englishSidebar,
    outline: {
      label: 'On this page'
    },
    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },
    lastUpdated: {
      text: 'Last updated'
    },
    langMenuLabel: 'Change language',
    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/shuaiplus/NodeWarden' }
    ],
    footer: {
      message: 'Released under the LGPL-3.0 License.',
      copyright: 'Copyright © 2026 NodeWarden'
    }
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      link: '/'
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: 'NodeWarden',
      titleTemplate: ':title | NodeWarden 中文文档',
      description: zhDescriptions['zh/index.md'],
      themeConfig: {
        nav: chineseNav,
        sidebar: chineseSidebar,
        outline: {
          label: '本页内容'
        },
        docFooter: {
          prev: '上一页',
          next: '下一页'
        },
        lastUpdated: {
          text: '最后更新'
        },
        langMenuLabel: '切换语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '外观',
        footer: {
          message: 'Released under the LGPL-3.0 License.',
          copyright: 'Copyright © 2026 NodeWarden'
        }
      }
    }
  }
});
