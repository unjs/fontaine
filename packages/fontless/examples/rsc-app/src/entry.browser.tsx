import { createFromReadableStream } from '@vitejs/plugin-rsc/browser'
import { hydrateRoot } from 'react-dom/client'

async function main() {
  const rscResponse = await fetch(`${window.location.href}.rsc`)
  const root = await createFromReadableStream<React.ReactNode>(rscResponse.body!)
  hydrateRoot(document, root)
}

main()
