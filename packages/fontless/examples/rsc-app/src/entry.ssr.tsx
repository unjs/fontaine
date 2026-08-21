import { createFromReadableStream, getClientEntryUrl } from '@vitejs/plugin-rsc/ssr'
import { renderToReadableStream } from 'react-dom/server.edge'

export async function handleSsr(rscStream: ReadableStream) {
  const root = await createFromReadableStream<React.ReactNode>(rscStream)
  return renderToReadableStream(root, {
    bootstrapModules: [getClientEntryUrl()],
  })
}
