import { expect, test } from '@playwright/test'
import { runCli } from './helper'

test.describe('dev vanilla', () => {
  let cli: ReturnType<typeof runCli>
  let baseURL: string

  test.beforeAll(async () => {
    cli = runCli({ command: 'pnpm dev', cwd: 'examples/vanilla-app' })
    const port = await cli.findPort()
    baseURL = `http://localhost:${port}`
  })

  test.afterAll(async () => {
    if (!cli)
      return
    cli.kill()
    await cli.done
  })

  test('basic', async ({ page }) => {
    await page.goto(baseURL)
    await expect(page.locator('.google-poppins')).toBeVisible()
    const fonts = await page.evaluate(async () => {
      // TODO: dom types
      const fonts = await (globalThis as any).document.fonts.ready
      return [...fonts].map((f: any) => ({ family: f.family, status: f.status }))
    })
    expect(fonts).toEqual(
      expect.arrayContaining([
        { family: 'Poppins', status: 'loaded' },
        { family: 'Press Start 2P', status: 'loaded' },
        { family: 'Aclonica', status: 'loaded' },
        { family: 'Allan', status: 'loaded' },
        { family: 'Panchang', status: 'loaded' },
        { family: 'Luckiest Guy', status: 'loaded' },
      ]),
    )
  })
})
