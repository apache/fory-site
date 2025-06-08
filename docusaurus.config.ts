import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Apache Fory (incubating)',
  tagline: 'A blazing-fast cross-language serialization framework powered by just-in-time compilation and zero-copy',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://fory.apache.org/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    path: 'i18n',
    localeConfigs: {
      'en-US': {
        path: "en-US",
        label: 'English',
        htmlLang: 'en-US',
      },
      'zh-CN': {
        path: "zh-CN",
        label: '简体中文',
        htmlLang: 'zh-CN',
      },
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarCollapsible: false,
          lastVersion: 'current',
          versions: {
            current: {
              label: 'dev',
            },
          },
          sidebarPath: './sidebars.ts',
          editUrl: ({ locale, version, docPath }) => {
            var editUrl = "";
            if (locale === "en-US") {
              editUrl = `https://github.com/apache/fory-site/tree/main/docs/${docPath}`;
            } else if (locale === "zh-CN") {
              version = version === "current" ? "current" : "version-" + version
              editUrl = `https://github.com/apache/fory-site/tree/main/i18n/${locale}/docusaurus-plugin-content-docs/${version}/${docPath}`;
            } else {
              editUrl = `https://github.com/apache/fory-site/tree/main`
            }
            return editUrl;
          },
        },
        blog: {
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All our posts',
          showReadingTime: true,
          editUrl: ({ blogPath, locale }) => {
            var editUrl = "";
            if (locale === "en-US") {
              editUrl = `https://github.com/apache/fory-site/tree/main/blog/${blogPath}`;
            } else if (locale === "zh-CN") {
              editUrl = `https://github.com/apache/fory-site/tree/main/i18n/${locale}/docusaurus-plugin-content-blog/${blogPath}`;
            } else {
              editUrl = `https://github.com/apache/fory-site/tree/main`
            }
            return editUrl;
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    require.resolve('docusaurus-lunr-search'),
    require.resolve('./src/plugin/redirect')
  ],

  themeConfig: {
    metadata: [
      { 'http-equiv': 'Content-Security-Policy', content: "frame-src 'self' https://ghbtns.com/; img-src 'self' https://avatars.githubusercontent.com/ https://github.com/ data:;" },
    ],
    navbar: {
      title: '',
      logo: {
        alt: 'Fory Logo',
        src: 'img/navbar-logo.png',
      },
      items: [
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'tutorialSidebar',
        //   position: 'left',
        //   label: 'Tutorial',
        // },
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'right',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'specificationSidebar',
          position: 'right',
          label: 'Specification',
        },
        {
          type: 'docSidebar',
          sidebarId: 'communitySidebar',
          position: 'right',
          label: 'Community',
        },
        {
          to: '/user',
          label: 'Users',
          position: "right",
        },
        {
          position: 'right',
          to: '/download',
          label: 'Download',
        },
        { to: '/blog', label: 'Blog', position: 'right' },
        {
          type: 'dropdown',
          label: 'ASF',
          position: 'right',
          items: [
            {
              label: 'Foundation',
              to: 'https://www.apache.org/'
            },
            {
              label: 'License',
              to: 'https://www.apache.org/licenses/'
            },
            {
              label: 'Events',
              to: 'https://www.apache.org/events/current-event.html'
            },
            {
              label: 'Privacy',
              to: 'https://privacy.apache.org/policies/privacy-policy-public.html'
            },
            {
              label: 'Security',
              to: 'https://www.apache.org/security/'
            },
            {
              label: 'Sponsorship',
              to: 'https://www.apache.org/foundation/sponsorship.html'
            },
            {
              label: 'Thanks',
              to: 'https://www.apache.org/foundation/thanks.html'
            },
            {
              label: 'Code of Conduct',
              to: 'https://www.apache.org/foundation/policies/conduct.html'
            }
          ]
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://github.com/apache/fory',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Mailing list',
              href: 'https://lists.apache.org/list.html?dev@fory.apache.org',
            },
            {
              label: 'Slack',
              href: 'https://join.slack.com/t/fory-project/shared_invite/zt-1u8soj4qc-ieYEu7ciHOqA2mo47llS8A',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/ApacheFory',
            },
          ],
        },
        {
          title: 'Docs',
          items: [
            {
              label: 'Install',
              to: '/docs/docs/start/install',
            },
            {
              label: 'Usage',
              to: '/docs/docs/start/usage',
            },
            {
              label: 'Benchmark',
              to: '/docs/docs/introduction/benchmark',
            },
          ],
        },
        {
          title: 'Repositories',
          items: [
            {
              label: 'Fory',
              href: 'https://github.com/apache/fory',
            },
            {
              label: 'Website',
              href: 'https://github.com/apache/fory-site',
            },
          ],
        },
      ],
      logo: {
        width: 200,
        src: "/img/apache-incubator.svg",
        href: "https://incubator.apache.org/",
        alt: "Apache Incubator logo"
      },
      copyright: `<div>
      <p> Apache Fory is an effort undergoing incubation at The Apache Software Foundation (ASF), sponsored by the Apache Incubator. Incubation is required of all newly accepted projects until a further review indicates that the infrastructure, communications, and decision making process have stabilized in a manner consistent with other successful ASF projects. While incubation status is not necessarily a reflection of the completeness or stability of the code, it does indicate that the project has yet to be fully endorsed by the ASF. </p>
      <p>
        Copyright © ${new Date().getFullYear()} The Apache Software Foundation, Licensed under the Apache License, Version 2.0. <br/>
        Apache, the names of Apache projects, and the feather logo are either registered trademarks or trademarks of the Apache Software Foundation in the United States and/or other countries.
      </p>
      </div>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["java", "javascript", "rust", "cpp", "c", "bash", "scala", "python"]
    },
  } satisfies Preset.ThemeConfig,
};

export default config;


