import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'NodeWarden',
  description: '运行在 Cloudflare Workers 上的 Bitwarden 兼容服务端。',
  lang: 'zh-CN',
  cleanUrls: true,
  head: [
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['meta', { property: 'og:title', content: 'NodeWarden Wiki' }],
    ['meta', { property: 'og:description', content: 'NodeWarden 部署、备份、安全与架构文档。' }]
  ],
  themeConfig: {
    logo: '/nodewarden-logo.svg',
    nav: [
      { text: '快速开始', link: '/guide/quick-start' },
      { text: '备份中心', link: '/guide/backup/overview' },
      { text: '架构设计', link: '/guide/architecture/overview' },
      { text: 'Demo', link: 'https://nodewarden-demo.pages.dev/' },
    ],
    sidebar: {
      '/guide/': [
      {
        text: '基础教程',
        items: [
          { text: '项目定位', link: '/guide/overview' },
          { text: '快速开始', link: '/guide/quick-start' },
          { text: 'Cloudflare 参数', link: '/guide/deployment/cloudflare' },
          { text: '配置与密钥', link: '/guide/deployment/configuration' },
          { text: '更新与维护', link: '/guide/deployment/update' },
          { text: '客户端连接', link: '/guide/core/clients' }
        ]
      },
      {
        text: '核心功能',
        items: [
          { text: '密码库与同步', link: '/guide/core/vault-sync' },
          { text: '附件与文件存储', link: '/guide/core/attachments' },
          { text: 'Send 与公开访问', link: '/guide/core/send' },
          { text: '导入与导出', link: '/guide/core/import-export' },
          { text: 'API 参考', link: '/guide/core/api-reference' },
          { text: '域名规则', link: '/guide/core/domain-rules' },
          { text: '网站图标', link: '/guide/core/website-icons' }
        ]
      },
      {
        text: '备份中心',
        items: [
          { text: '备份能力总览', link: '/guide/backup/overview' },
          { text: '备份内容边界', link: '/guide/backup/scope' },
          { text: '配置加密设计', link: '/guide/backup/settings-crypto' },
          { text: '远程备份流程', link: '/guide/backup/remote-flow' },
          { text: '还原与校验', link: '/guide/backup/restore' }
        ]
      },
      {
        text: '安全设计',
        items: [
          { text: '账号与主密码', link: '/guide/security/accounts' },
          { text: 'JWT 与会话', link: '/guide/security/jwt-session' },
          { text: '两步验证与设备', link: '/guide/security/two-factor-devices' },
          { text: '权限、限流与审计', link: '/guide/security/rate-limit-audit' }
        ]
      },
      {
        text: '架构与开发',
        items: [
          { text: '整体架构', link: '/guide/architecture/overview' },
          { text: '后端路由与服务层', link: '/guide/architecture/backend-routing-services' },
          { text: '前端架构', link: '/guide/architecture/frontend' },
          { text: '数据模型与迁移', link: '/guide/architecture/storage-schema' },
          { text: '兼容性策略', link: '/guide/architecture/compatibility' },
          { text: '实时通知', link: '/guide/architecture/realtime-notifications' },
          { text: '变更维护地图', link: '/guide/architecture/change-map' },
          { text: '开发与代码约定', link: '/guide/architecture/development' }
        ]
      },
      {
        text: '运维排错',
        items: [
          { text: '常见问题', link: '/guide/operations/faq' },
          { text: '限制与边界', link: '/guide/operations/limitations' },
          { text: '排错清单', link: '/guide/operations/troubleshooting' },
          { text: '备份事故处理', link: '/guide/operations/backup-incidents' }
        ]
      }
    ]
    },
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
  }
});
