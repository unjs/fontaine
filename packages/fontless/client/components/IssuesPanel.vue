<script lang="ts" setup>
import type { FontlessDevframeState } from '../../src/devtools'
import { computed } from 'vue'
import { displayPath } from '../composables'

const props = defineProps<{
  state: FontlessDevframeState
}>()

const emit = defineEmits<{
  close: []
  open: [path: string]
}>()

const unresolved = computed(() => props.state.unresolved.filter(family => !family.system))
const system = computed(() => props.state.unresolved.filter(family => family.system))
</script>

<template>
  <div class="flex flex-col min-h-full">
    <div class="navbar-glass border-b border-base flex items-center justify-between gap-2 px-6 py-5">
      <h2 class="text-3xl leading-tight">
        Issues
      </h2>
      <button
        class="icon-button"
        title="Close"
        @click="emit('close')"
      >
        <div class="i-carbon-close-large" />
      </button>
    </div>

    <div class="px-6 py-6 flex flex-col gap-10">
      <section
        v-if="!unresolved.length && !state.warnings.length"
        class="hint"
      >
        No issues. Every font family your stylesheets use was resolved.
      </section>

      <section
        v-if="unresolved.length"
        class="flex flex-col gap-3"
      >
        <h3 class="flex items-center gap-2 label op-100! text-orange">
          <div class="i-carbon-warning-alt" />
          Unresolved families
        </h3>
        <p class="hint">
          Your CSS uses these families, but no provider returned them, so no <code>@font-face</code> was generated. Check the spelling, or point the family at a provider or a file in <code>{{ state.ui.familiesOption || 'families' }}</code>.
        </p>
        <div
          v-for="family of unresolved"
          :key="family.fontFamily"
          class="flex flex-col gap-1 py-2 border-b border-base last:border-0"
        >
          <span class="text-lg">{{ family.fontFamily }}</span>
          <template
            v-for="usage of family.usages"
            :key="usage.id"
          >
            <button
              v-if="usage.file"
              class="flex items-center gap-2 text-left text-xs font-mono op-60 hover:op-100 group"
              title="Open in editor"
              @click="emit('open', usage.id)"
            >
              <div class="i-carbon-document" />
              <span class="group-hover:text-primary">{{ displayPath(usage.id, state.root) }}</span>
              <div class="i-carbon-launch op-0 group-hover:op-60" />
            </button>
            <div
              v-else
              class="flex items-center gap-2 text-xs font-mono op-60"
              title="Virtual module"
            >
              <div class="i-carbon-code" />
              <span>{{ displayPath(usage.id, state.root) }}</span>
            </div>
          </template>
        </div>
      </section>

      <section
        v-if="state.warnings.length"
        class="flex flex-col gap-3"
      >
        <h3 class="flex items-center gap-2 label op-100! text-orange">
          <div class="i-carbon-warning" />
          Warnings
        </h3>
        <p class="hint">
          Logged while resolving fonts. They also appear in your dev server's terminal.
        </p>
        <div
          v-for="warning of state.warnings"
          :key="warning"
          class="font-mono text-xs border-l-2 border-orange/50 pl-2"
        >
          {{ warning }}
        </div>
      </section>

      <section
        v-if="system.length"
        class="flex flex-col gap-3"
      >
        <h3 class="flex items-center gap-2 label">
          <div class="i-carbon-laptop" />
          System fonts
        </h3>
        <p class="hint">
          Provided by the operating system, so fontless leaves them alone.
        </p>
        <div class="font-mono text-xs op-75">
          {{ system.map(family => family.fontFamily).join(', ') }}
        </div>
      </section>
    </div>
  </div>
</template>
