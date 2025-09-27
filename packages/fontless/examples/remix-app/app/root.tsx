import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react'

import './index.css'

import { preloads } from 'fontless/runtime'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {preloads.map((href: string) => (
          <link
            key={href}
            rel="preload"
            as="font"
            href={href}
            crossOrigin=""
          />
        ))}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}
