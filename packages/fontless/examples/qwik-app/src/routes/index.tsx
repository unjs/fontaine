/// <reference types="vite/client" />
import type { DocumentHead } from '@qwik.dev/router'
import { component$, useStyles$ } from '@qwik.dev/core'
import styles from './index.css?inline'

export default component$(() => {
  useStyles$(styles)

  return (
    <div>
      <h1>Google</h1>
      <p class="google-poppins">Poppins</p>
      <p class="google-press-start">Press Start 2P</p>

      <h1>Bunny</h1>
      <p class="bunny-aclonica">Aclonica</p>
      <p class="bunny-allan">Allan</p>

      <h1>FontShare</h1>
      <p class="font-share-panchang">Panchang</p>

      <h1>FontSource</h1>
      <p class="font-source-luckiest">Luckiest</p>

      <h1>Local</h1>
      <p class="local">Local font</p>
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Welcome to Qwik',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description',
    },
  ],
}
