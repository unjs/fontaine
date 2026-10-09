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
  shortcuts: {
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
