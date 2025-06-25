export default defineAppConfig({
  shadcnDocs: {
    site: {
      name: 'Fontless',
      description: 'Magical plug-and-play font optimization for modern web applications.',
    },
    theme: {
      customizable: false,
      color: 'zinc',
      radius: 0.5,
    },
    header: {
      title: 'fontless',
      showTitle: true,
      darkModeToggle: true,
      languageSwitcher: {
        enable: false,
        triggerType: 'icon',
        dropdownType: 'select',
      },
      logo: {
        light: '/logo.svg',
        dark: '/logo-dark.svg',
      },
      nav: [],
      links: [{
        icon: 'lucide:github',
        to: 'https://github.com/unjs/fontaine/blob/main/packages/fontless',
        target: '_blank',
      }],
    },
    aside: {
      useLevel: true,
      collapse: false,
    },
    main: {
      breadCrumb: true,
      showTitle: true,
    },
    footer: {
      credits: 'Copyright © 2025',
      links: [{
        icon: 'lucide:github',
        to: 'https://github.com/unjs/fontaine/blob/main/packages/fontless',
        target: '_blank',
      }],
    },
    toc: {
      enable: false,
      links: [{
        title: 'Star on GitHub',
        icon: 'lucide:star',
        to: 'https://github.com/unjs/fontaine/blob/main/packages/fontless',
        target: '_blank',
      }, {
        title: 'Create Issues',
        icon: 'lucide:circle-dot',
        to: 'https://github.com/unjs/fontaine/issues',
        target: '_blank',
      }],
    },
    search: {
      enable: false,
      inAside: false,
    },
  },
})
