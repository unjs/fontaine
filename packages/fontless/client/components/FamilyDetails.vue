<script lang="ts" setup>
import type { FontFaceData } from 'unifont'
import type { FontlessDevframeFamily } from '../../src/devtools'
import { computed, ref, watch } from 'vue'
import { displayPath, formatBytes, getFontFileSize, isLocalFontAvailable } from '../composables'
import { cssWeight, styleName, subsetName } from '../typography'
import AppCodeBlock from './AppCodeBlock.vue'
import FallbackPreview from './FallbackPreview.vue'
import FontFileSize from './FontFileSize.vue'

export type FamilyTab = 'overview' | 'faces' | 'fallbacks' | 'usage' | 'css'

const props = defineProps<{
  family: FontlessDevframeFamily
  root?: string
  /** Whether every stylesheet's usage is reported, so a family without usages is unused. */
  reportsUsage?: boolean
  /** How the `families` option is written in the host's config. */
  familiesOption?: string
}>()

const emit = defineEmits<{
  close: []
  open: [path: string]
}>()

const tab = defineModel<FamilyTab>('tab', { default: 'overview' })
const sampleText = defineModel<string>('sampleText', { default: 'The quick brown fox jumps over the lazy dog' })

const familiesOption = computed(() => props.familiesOption || 'families')
const showsUsage = computed(() => props.reportsUsage || props.family.usages.length > 0 || props.family.global)
const fontFamily = computed(() => `'${props.family.fontFamily}'`)

const tabs = computed(() => ([
  { id: 'overview', label: 'Overview' },
  { id: 'faces', label: 'Faces', count: props.family.fonts.length },
  { id: 'fallbacks', label: 'Fallbacks', count: props.family.fallbacks.length },
  { id: 'usage', label: 'Usage', count: props.family.usages.length + (props.family.global ? 1 : 0) },
  { id: 'css', label: 'CSS' },
] satisfies Array<{ id: FamilyTab, label: string, count?: number }>).filter(item => item.id !== 'usage' || showsUsage.value))

watch(showsUsage, (shows) => {
  if (!shows && tab.value === 'usage') {
    tab.value = 'overview'
  }
}, { immediate: true })

const source = computed(() => {
  if (props.family.type === 'manual') {
    return 'Local files'
  }
  return props.family.type === 'override' ? `Pinned to ${props.family.provider}` : `From ${props.family.provider}`
})

const specimens = computed(() => {
  const seen = new Map<string, { name: string, weight: string, style: string }>()
  for (const font of props.family.fonts) {
    const weight = cssWeight(font)
    const style = font.style || 'normal'
    seen.set(`${weight} ${style}`, { name: styleName(font), weight, style })
  }
  return [...seen.values()].sort((a, b) => Number.parseInt(a.weight) - Number.parseInt(b.weight) || Number(a.style !== 'normal') - Number(b.style !== 'normal'))
})

const totalSize = ref<number>()
watch(() => props.family, async (family) => {
  totalSize.value = undefined
  const urls = family.fonts.map(font => font.src.find(src => 'url' in src)?.url).filter(url => url !== undefined)
  const sizes = await Promise.all(urls.map(getFontFileSize))
  if (family === props.family && sizes.length && sizes.every(size => size.size !== undefined)) {
    totalSize.value = sizes.reduce((total, size) => total + size.size!, 0)
  }
}, { immediate: true })

const stats = computed(() => [
  { label: props.family.fonts.length === 1 ? 'face' : 'faces', value: String(props.family.fonts.length), tab: 'faces' },
  { label: 'in total', value: totalSize.value === undefined ? '…' : formatBytes(totalSize.value), tab: 'faces' },
  { label: props.family.fallbacks.length === 1 ? 'fallback' : 'fallbacks', value: String(props.family.fallbacks.length), tab: 'fallbacks' },
  ...showsUsage.value ? [{ label: props.family.usages.length === 1 ? 'stylesheet' : 'stylesheets', value: String(props.family.usages.length), tab: 'usage' as const }] : [],
] satisfies Array<{ label: string, value: string, tab: FamilyTab }>)

function formatAxis(values: unknown[] | undefined) {
  return values?.map(value => Array.isArray(value)
    ? value.join('–')
    : typeof value === 'object' && value
      ? `${(value as { min: unknown }).min}–${(value as { max: unknown }).max}`
      : String(value)).join(', ')
}

const optimisations = computed(() => [
  {
    label: 'Preload',
    on: props.family.preloads.length > 0,
    detail: `${props.family.preloads.length} ${props.family.preloads.length === 1 ? 'face' : 'faces'}`,
    hint: 'preload: true',
    title: `Preloaded faces start downloading before the CSS is parsed. Set \`preload: true\` on the family in \`${familiesOption.value}\`.`,
  },
  {
    label: 'Metric fallbacks',
    on: props.family.fallbacks.length > 0,
    detail: `${props.family.fallbacks.length} adjusted`,
    hint: '',
    title: 'Fallback fonts adjusted to the same metrics, so text does not shift when the web font loads.',
    tab: 'fallbacks' as const,
  },
  {
    label: 'Subset',
    on: !!props.family.glyphs,
    detail: `${[...props.family.glyphs ?? ''].length} glyphs`,
    hint: 'glyphs',
    title: `Font files reduced to the characters you list. Set \`glyphs\` on the family in \`${familiesOption.value}\`.`,
  },
  {
    label: 'Global',
    on: props.family.global,
    detail: 'in <head>',
    hint: 'global: true',
    title: 'Injected into the HTML whether or not your CSS uses it.',
  },
  ...props.family.variableAxis
    ? [{
        label: 'Variable axes',
        on: true,
        detail: Object.entries(props.family.variableAxis).map(([axis, values]) => `${axis} ${formatAxis(values)}`).join(' · '),
        hint: '',
        title: 'Axis values requested with `variableAxis`.',
      }]
    : [],
])

const adjusted = ref(true)
const availableFallbacks = ref<Record<string, boolean>>({})
watch(() => props.family.fallbacks, async (fallbacks) => {
  const available = await Promise.all(fallbacks.map(isLocalFontAvailable))
  availableFallbacks.value = Object.fromEntries(fallbacks.map((fallback, index) => [fallback, available[index]!]))
}, { immediate: true })
const usedFallback = computed(() => props.family.fallbacks.find(fallback => availableFallbacks.value[fallback]))
const sortedFallbacks = computed(() => [...props.family.fallbacks].sort((a, b) => Number(b === usedFallback.value) - Number(a === usedFallback.value)))

function urlOf(font: FontFaceData) {
  const source = font.src.find(i => 'url' in i)
  if (source?.originalURL?.startsWith('file:')) {
    return displayPath(decodeURIComponent(new URL(source.originalURL).pathname), props.root)
  }
  return source && (source.originalURL || source.url)
}

function formatOf(font: FontFaceData) {
  const source = font.src.find(i => 'url' in i)
  return source?.format ?? source?.url.match(/\.(\w+)(?:\?|$)/)?.[1]
}

function isPreloaded(font: FontFaceData) {
  const url = font.src.find(i => 'url' in i)?.url
  return !!url && props.family.preloads.includes(url)
}
</script>

<template>
  <div class="flex flex-col min-h-full">
    <header class="navbar-glass border-b border-base">
      <div class="flex items-start justify-between gap-2 px-6 pt-5">
        <div class="min-w-0">
          <h2
            class="text-3xl leading-tight truncate"
            :style="{ fontFamily }"
          >
            {{ family.fontFamily }}
          </h2>
          <p class="label mt-1">
            {{ source }}
          </p>
        </div>
        <button
          class="icon-button shrink-0"
          title="Close"
          @click="emit('close')"
        >
          <div class="i-carbon-close-large" />
        </button>
      </div>
      <nav class="flex gap-1 px-4 mt-3 text-sm overflow-x-auto">
        <button
          v-for="item of tabs"
          :key="item.id"
          class="tab"
          :class="{ 'tab-active': tab === item.id }"
          @click="tab = item.id"
        >
          {{ item.label }}
          <span
            v-if="item.count !== undefined"
            class="tabular-nums text-xs op-50"
          >{{ item.count }}</span>
        </button>
      </nav>
    </header>

    <div class="px-6 py-6 flex flex-col gap-8">
      <template v-if="tab === 'overview'">
        <section class="group relative -mb-2">
          <textarea
            v-model="sampleText"
            rows="1"
            class="specimen w-full resize-none bg-transparent text-4xl leading-tight outline-none! border-b border-transparent group-hover:border-base focus:border-primary/50 transition-colors pb-2"
            :style="{ fontFamily }"
            placeholder="Type something…"
            aria-label="Preview text"
            spellcheck="false"
          />
          <span class="label absolute right-0 -bottom-5 flex items-center gap-1 op-0! group-hover:op-50! transition-opacity">
            <span class="i-carbon-edit" />
            editable
          </span>
        </section>

        <section class="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-px rounded-lg overflow-hidden border border-base bg-gray/15">
          <button
            v-for="stat of stats"
            :key="stat.label"
            class="flex flex-col items-start gap-0.5 bg-base px-4 py-3 text-left hover:bg-active transition-colors"
            @click="tab = stat.tab"
          >
            <span class="text-2xl font-light tabular-nums">{{ stat.value }}</span>
            <span class="label">{{ stat.label }}</span>
          </button>
        </section>

        <section>
          <h3 class="label mb-2">
            Optimisations
          </h3>
          <ul class="flex flex-col">
            <li
              v-for="item of optimisations"
              :key="item.label"
              class="flex items-center gap-3 py-2 border-b border-base last:border-0"
              :title="item.title"
            >
              <span
                class="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[0.6rem]"
                :class="item.on ? 'bg-primary text-white' : 'border border-gray/40'"
              >
                <span
                  v-if="item.on"
                  class="i-carbon-checkmark"
                />
              </span>
              <span
                class="text-sm"
                :class="{ 'op-50': !item.on }"
              >{{ item.label }}</span>
              <button
                v-if="item.on && item.tab"
                class="ml-auto text-sm op-60 hover:(op-100 text-primary)"
                @click="tab = item.tab"
              >
                {{ item.detail }} →
              </button>
              <span
                v-else-if="item.on"
                class="ml-auto text-sm op-60 truncate"
              >{{ item.detail }}</span>
              <code
                v-else-if="item.hint"
                class="ml-auto text-[0.7rem] op-50 font-mono"
              >{{ item.hint }}</code>
              <span
                v-else
                class="ml-auto text-sm op-40"
              >none yet</span>
            </li>
          </ul>
        </section>

        <section>
          <h3 class="label mb-2">
            Styles
          </h3>
          <div class="flex flex-col">
            <div
              v-for="specimen of specimens"
              :key="`${specimen.weight} ${specimen.style}`"
              class="flex items-baseline gap-4 py-2 border-b border-base last:border-0 min-w-0"
            >
              <span class="label w-28 shrink-0">{{ specimen.name }}</span>
              <span
                class="text-xl truncate"
                :style="{ fontFamily, fontWeight: specimen.weight, fontStyle: specimen.style }"
              >{{ sampleText || family.fontFamily }}</span>
            </div>
          </div>
        </section>
      </template>

      <template v-else-if="tab === 'faces'">
        <p class="hint">
          Each face is a separate file. Browsers download only the faces a page needs, based on weight, style and the characters it uses.
        </p>
        <div class="flex flex-col">
          <div
            v-for="font, index of family.fonts"
            :key="`${family.fontFamily}-${index}`"
            class="flex items-center gap-4 py-3 border-b border-base last:border-0"
          >
            <span
              class="text-3xl w-12 text-center shrink-0"
              :style="{ fontFamily, fontWeight: cssWeight(font), fontStyle: font.style }"
            >Aa</span>
            <div class="flex flex-col min-w-0 flex-1 gap-0.5">
              <span class="text-sm">
                {{ styleName(font) }}
                <span
                  v-if="font.unicodeRange"
                  class="op-50"
                  :title="font.unicodeRange.join(', ')"
                > · {{ subsetName(font.unicodeRange) }}</span>
              </span>
              <span
                class="text-xs op-40 font-mono truncate"
                :title="urlOf(font)"
              >{{ formatOf(font) }} · {{ urlOf(font) }}</span>
            </div>
            <span
              v-if="isPreloaded(font)"
              class="tag bg-blue/10 text-blue text-[0.65rem] shrink-0"
              title="Preloaded with <link rel=&quot;preload&quot;>"
            >
              <span class="i-carbon-flash" />preloaded
            </span>
            <Suspense>
              <FontFileSize :font="font" />
            </Suspense>
            <a
              class="icon-button shrink-0"
              title="Download"
              download
              target="_blank"
              :href="font.src.find((i) => 'url' in i)?.url"
            >
              <div class="i-carbon-download" />
            </a>
          </div>
        </div>
      </template>

      <template v-else-if="tab === 'fallbacks'">
        <p class="hint">
          Until {{ family.fontFamily }} loads, the browser renders the first installed fallback. fontless adjusts each fallback's size and line metrics to match, so text doesn't jump when the web font arrives.
        </p>
        <div
          v-if="!family.fallbacks.length"
          class="hint"
        >
          No fallbacks generated yet. They are added where a stylesheet uses the family.
        </div>
        <template v-else>
          <div class="flex flex-col gap-3">
            <input
              v-model="sampleText"
              class="w-full bg-transparent text-sm border-b border-base pb-1 outline-none! focus:border-primary/50"
              placeholder="Type to preview your own text"
              aria-label="Preview text"
            >
            <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div class="flex gap-4">
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-sky-500" />{{ family.fontFamily }}</span>
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-rose-500/70" />fallback{{ adjusted ? ', adjusted' : ', unadjusted' }}</span>
              </div>
              <label
                class="flex items-center gap-1.5 cursor-pointer select-none"
                title="Turn the metric overrides off to see the layout shift they prevent"
              >
                <input
                  v-model="adjusted"
                  type="checkbox"
                  class="accent-[var(--fontless-primary)]"
                >
                metric overrides
              </label>
            </div>
          </div>
          <div
            v-if="!usedFallback && family.fallbacks.every(fallback => fallback in availableFallbacks)"
            class="hint"
          >
            None of these fallbacks are installed on this machine, so the rest of the font stack is used until the font loads.
          </div>
          <div class="flex flex-col gap-5">
            <FallbackPreview
              v-for="fallback of sortedFallbacks"
              :key="fallback"
              :family="family.fontFamily"
              :fallback="fallback"
              :text="sampleText"
              :adjusted="adjusted"
              :available="availableFallbacks[fallback]"
              :used="fallback === usedFallback"
            />
          </div>
          <details class="text-xs">
            <summary class="label cursor-pointer select-none hover:op-100">
              Generated fallback CSS
            </summary>
            <AppCodeBlock
              v-if="family.fallbackCSS"
              :code="family.fallbackCSS"
              lang="css"
              class="mt-2 overflow-x-auto border border-base rounded-lg"
            />
          </details>
        </template>
      </template>

      <template v-else-if="tab === 'usage'">
        <p class="hint">
          Stylesheets that use {{ family.fontFamily }}. Click a file to open it in your editor.
        </p>
        <div class="flex flex-col">
          <div
            v-if="family.global"
            class="flex items-center gap-3 py-2 border-b border-base last:border-0 text-sm"
          >
            <div class="i-carbon-earth op-50" />
            <span>HTML <code class="font-mono text-xs">&lt;head&gt;</code></span>
            <span class="ml-auto label">global</span>
          </div>
          <template
            v-for="usage of family.usages"
            :key="usage.id"
          >
            <button
              v-if="usage.file"
              class="flex items-center gap-3 py-2 border-b border-base last:border-0 text-left text-sm group"
              title="Open in editor"
              @click="emit('open', usage.id)"
            >
              <div class="i-carbon-document op-50" />
              <span class="font-mono text-xs truncate group-hover:text-primary">{{ displayPath(usage.id, root) }}</span>
              <div class="i-carbon-launch ml-auto op-0 group-hover:op-60" />
            </button>
            <div
              v-else
              class="flex items-center gap-3 py-2 border-b border-base last:border-0 text-sm"
            >
              <div class="i-carbon-code op-50" />
              <span class="font-mono text-xs truncate">{{ displayPath(usage.id, root) }}</span>
              <span class="ml-auto label">virtual</span>
            </div>
          </template>
          <div
            v-if="!family.global && !family.usages.length"
            class="hint"
          >
            No stylesheet uses this family any more.
          </div>
        </div>
      </template>

      <template v-else>
        <p class="hint">
          The <code>@font-face</code> declarations fontless injects for this family.
        </p>
        <AppCodeBlock
          :code="family.css"
          lang="css"
          class="overflow-x-auto border border-base rounded-lg text-xs"
        />
      </template>
    </div>
  </div>
</template>
