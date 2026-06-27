import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Krypton Docs',
  tagline: 'Documentação oficial do jogo multiplayer Krypton P2P',
  favicon: 'img/favicon.ico',

  url: 'https://docs.krypton.local',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // Serve docs at root URL
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'], // local search index languages
        docsRouteBasePath: '/',
        indexBlog: false,
        indexPages: true,
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Krypton Docs',
      logo: {
        alt: 'Krypton Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'kryptonSidebar',
          position: 'left',
          label: 'Documentação',
        },
        {
          href: 'https://github.com/ikidoncc/krypton',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentação',
          items: [
            {
              label: 'Introdução',
              to: '/',
            },
            {
              label: 'Começando',
              to: '/getting-started/installation',
            },
          ],
        },
        {
          title: 'Arquitetura',
          items: [
            {
              label: 'Visão Geral',
              to: '/architecture/overview',
            },
            {
              label: 'Fluxo de Dados',
              to: '/architecture/data-flow',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Krypton Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
