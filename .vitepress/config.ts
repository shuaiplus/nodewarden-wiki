import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'NodeWarden',
  description: 'Official NodeWarden documentation and wiki.',
  lang: 'en-US',
  cleanUrls: true,
  themeConfig: {
    logo: '/nodewarden.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'GitHub', link: 'https://github.com/shuaiplus/NodeWarden' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' }
        ]
      }
    ],
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
