import { defineConfig, presetAttributify, presetIcons, presetWind3, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      prefix: ['i-', ''],
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [
    transformerVariantGroup(),
  ],
  theme: {
    colors: {
      primary: 'color-mix(in srgb, var(--fontless-primary) calc(%alpha * 100%), transparent)',
    },
  },
  shortcuts: {
    'chip': 'inline-flex items-center gap-1 border border-base rounded-full px-2.5 py-1 op-80 hover:(op-100 bg-active) transition-all duration-200',
    'chip-active': 'op-100 bg-primary/10 border-primary/50 text-primary',
    'tab': 'inline-flex items-center gap-1.5 px-3 py-2 border-b-2 border-transparent op-60 hover:op-100 whitespace-nowrap transition-all duration-200',
    'tab-active': 'op-100 border-primary text-primary',
    'link': 'text-primary hover:underline',
    'hint': 'text-sm op-60 leading-relaxed max-w-prose',
    'label': 'text-[0.68rem] uppercase tracking-wider font-medium op-50',
    'tag': 'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.25',
    'bg-base': 'bg-white dark:bg-[#151515]',
    'text-base': 'text-[#151515] dark:text-white',
    'bg-active': 'bg-gray:5',
    'bg-hover': 'bg-gray:3',
    'border-base': 'border-gray/20',
    'glass-effect': 'backdrop-blur-6 bg-white/80 dark:bg-[#151515]/90',
    'navbar-glass': 'sticky z-10 top-0 glass-effect',
    'card-base': 'border border-base rounded bg-base shadow-sm',
    'badge-base': 'rounded whitespace-nowrap select-none mx-0.5 px-1.5 py-0.5 text-xs bg-gray/10',
    'button-base': 'border border-base rounded shadow-sm px-1em py-0.25em inline-flex items-center gap-1 op80 outline-none! transition-all duration-200 hover:op100',
    'icon-button': 'aspect-1/1 w-1.6em h-1.6em flex items-center justify-center rounded op50 hover:(op100 bg-active) transition-all duration-200',
  },
})
