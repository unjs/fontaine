import type { FontlessDevframeState } from '../src/devtools'
import { connectDevframe } from 'devframe/client'
import { shallowRef } from 'vue'

export function useFonts() {
  const families = shallowRef<FontlessDevframeState['families']>([])

  function update(state?: FontlessDevframeState) {
    families.value = state?.families ?? []
  }

  connectDevframe().then(async (rpc) => {
    // No `initialValue`: hydrating from one writes the server snapshot back to the node side
    const state = await rpc.scope('fontless').rpc.sharedState('fonts')
    update(state.value() as FontlessDevframeState | undefined)
    state.on('updated', update)
  })

  return families
}
