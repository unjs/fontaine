import { renderToReadableStream } from '@vitejs/plugin-rsc/rsc/server'
import { Counter } from './counter'
import './server.css'

function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>fontless rsc demo</title>
        {import.meta.viteRsc.loadCss()}
      </head>
      <body>
        <p className="server-poppins">Rendered on the server</p>
        <Counter />
      </body>
    </html>
  )
}

export default async function handler(request: Request): Promise<Response> {
  const rscStream = renderToReadableStream(<Root />)

  if (request.url.endsWith('.rsc')) {
    return new Response(rscStream, {
      headers: { 'Content-type': 'text/x-component;charset=utf-8' },
    })
  }

  const ssrEntry = await import.meta.viteRsc.loadModule<typeof import('./entry.ssr.tsx')>('ssr', 'index')
  return new Response(await ssrEntry.handleSsr(rscStream), {
    headers: { 'Content-type': 'text/html' },
  })
}
