<script lang="ts" setup>
import type { FamilyTab } from './components/FamilyDetails.vue'
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import AppNavbar from './components/AppNavbar.vue'
import AppSplitPane from './components/AppSplitPane.vue'
import FamilyCard from './components/FamilyCard.vue'
import FamilyDetails from './components/FamilyDetails.vue'
import IssuesPanel from './components/IssuesPanel.vue'
import { DEFAULT_DOCS_URL, useFontless } from './composables'

type Filter = 'all' | 'preloaded' | 'global' | 'subset' | 'unused'

const { state, status, openInEditor } = useFontless()
const fonts = computed(() => state.value?.families ?? [])
const reportsUsage = computed(() => !!state.value?.reportsUsage)
const isUnused = (family: (typeof fonts.value)[number]) => reportsUsage.value && !family.usages.length && !family.global
const issueCount = computed(() => (state.value?.unresolved.filter(family => !family.system).length ?? 0) + (state.value?.warnings.length ?? 0))

const search = ref('')
const filter = ref<Filter>('all')
const filters = computed(() => [
  { id: 'all', label: 'All', icon: 'i-carbon-text-font', count: fonts.value.length },
  { id: 'preloaded', label: 'Preloaded', icon: 'i-carbon-flash', count: fonts.value.filter(family => family.preloads.length).length },
  { id: 'global', label: 'Global', icon: 'i-carbon-earth', count: fonts.value.filter(family => family.global).length },
  { id: 'subset', label: 'Subsetted', icon: 'i-carbon-cut', count: fonts.value.filter(family => family.glyphs).length },
  { id: 'unused', label: 'Unused', icon: 'i-carbon-unlink', count: fonts.value.filter(isUnused).length },
] satisfies Array<{ id: Filter, label: string, icon: string, count: number }>)
const filtered = computed(() => fonts.value.filter(family =>
  family.fontFamily.toLowerCase().includes(search.value.toLowerCase())
  && (filter.value === 'all'
    || (filter.value === 'preloaded' && family.preloads.length)
    || (filter.value === 'global' && family.global)
    || (filter.value === 'subset' && family.glyphs)
    || (filter.value === 'unused' && isUnused(family))),
))

const view = ref<{ kind: 'family', id: number } | { kind: 'issues' }>()
const selected = computed(() => view.value?.kind === 'family' ? fonts.value.find(font => font.id === (view.value as { id: number }).id) : undefined)

const tab = ref<FamilyTab>(persisted('fontless-devtools:tab', 'overview'))
const sampleText = ref(persisted('fontless-devtools:sample-text', 'The quick brown fox jumps over the lazy dog'))
watch(tab, value => localStorage.setItem('fontless-devtools:tab', value))
watch(sampleText, value => localStorage.setItem('fontless-devtools:sample-text', value))

function persisted<T extends string>(key: string, fallback: T): T {
  return (localStorage.getItem(key) as T | null) || fallback
}

onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  document.documentElement.classList.toggle('dark', media.matches)
  media.addEventListener('change', event => document.documentElement.classList.toggle('dark', event.matches))
})

const fontFaces = document.head.appendChild(document.createElement('style'))
watchEffect(() => {
  fontFaces.textContent = fonts.value.map(family => `${family.css}\n${family.fallbackCSS}`).join('\n')
})
</script>

<template>
  <AppSplitPane
    storage-key="devtools:fonts"
    class="h-screen!"
    :min-size="30"
  >
    <template #left>
      <AppNavbar v-model:search="search">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <button
            v-for="item of filters"
            v-show="item.id === 'all' || item.count"
            :key="item.id"
            class="chip"
            :class="{ 'chip-active': filter === item.id }"
            @click="filter = item.id"
          >
            <div :class="item.icon" />
            {{ item.label }}
            <span class="op-60">{{ item.count }}</span>
          </button>
          <button
            v-if="issueCount"
            class="chip text-orange border-orange/40!"
            :class="{ 'chip-active': view?.kind === 'issues' }"
            title="Families that could not be resolved, and warnings"
            @click="view = { kind: 'issues' }"
          >
            <div class="i-carbon-warning-alt" />
            Issues
            <span class="op-75">{{ issueCount }}</span>
          </button>
          <a
            class="ml-auto flex items-center gap-1 op-60 hover:(op-100 text-primary)"
            :href="state?.ui.docsURL || DEFAULT_DOCS_URL"
            target="_blank"
            rel="noopener"
            title="Documentation"
          >
            <div class="i-carbon-help" />
            Docs
          </a>
        </div>
      </AppNavbar>

      <div
        v-if="status !== 'connected'"
        class="p-8 text-center hint"
      >
        <template v-if="status === 'connecting'">
          Connecting…
        </template>
        <template v-else-if="status === 'unauthorized'">
          Not authorised. Open the panel from your DevTools, or from the link printed by your dev server.
        </template>
        <template v-else>
          Disconnected from the dev server. Reload to reconnect.
        </template>
      </div>
      <div
        v-else-if="!fonts.length"
        class="p-8 text-center hint"
      >
        <div class="i-carbon-text-font text-4xl op-50 mb-2" />
        <p>No fonts resolved yet.</p>
        <p>Fonts are resolved as your stylesheets are requested, so load a page of your app.</p>
      </div>
      <template v-else>
        <p
          v-if="!view"
          class="hint px-4 pt-4"
        >
          Select a family to see its faces, fallbacks and where it's used.
        </p>
        <div
          class="grid p-4 gap-4"
          :class="view ? 'grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]'"
        >
          <FamilyCard
            v-for="family of filtered"
            :key="family.id"
            :family="family"
            :active="selected?.id === family.id"
            :reports-usage="reportsUsage"
            @click="view = { kind: 'family', id: family.id }"
          />
        </div>
        <p
          v-if="!filtered.length"
          class="hint px-4"
        >
          No families match.
        </p>
      </template>
    </template>
    <template
      v-if="selected || view?.kind === 'issues'"
      #right
    >
      <FamilyDetails
        v-if="selected"
        v-model:tab="tab"
        v-model:sample-text="sampleText"
        :family="selected"
        :root="state?.root"
        :reports-usage="reportsUsage"
        :families-option="state?.ui.familiesOption"
        @close="view = undefined"
        @open="openInEditor"
      />
      <IssuesPanel
        v-else-if="state"
        :state="state"
        @close="view = undefined"
        @open="openInEditor"
      />
    </template>
  </AppSplitPane>
</template>

<style>
pre:has(code) {
  padding: 10px;
  border-radius: 10px;
}

.specimen {
  field-sizing: content;
}

.hint code {
  font-size: 0.85em;
  padding: 0 0.25em;
  border-radius: 0.25em;
  background: rgb(156 163 175 / 0.15);
}
</style>
