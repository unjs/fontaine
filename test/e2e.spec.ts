import { expect, it, describe } from 'vitest'
import { execaCommand } from 'execa'
import { readdir, readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { join } from 'pathe'

describe('fontaine', () => {
  it('e2e', async () => {
    const assetsDir = fileURLToPath(
      new URL('../playground/dist/assets', import.meta.url)
    )
    await $`pnpm vite build playground --config test/vite.config.mjs`
    const cssFile = await readdir(assetsDir).then(files =>
      files.find(f => f.endsWith('.css'))
    )
    // @ts-expect-error there must be a file or we _want_ a test failure
    const css = await readFile(join(assetsDir, cssFile), 'utf-8')
    expect(css.replace(/\.[\w]+\.woff2/g, '.woff2')).toMatchInlineSnapshot(`
      "@font-face{font-family:Poppins variant fallback;src:local("Segoe UI");size-adjust:114.4346%;ascent-override:91.7554%;descent-override:30.5851%;line-gap-override:8.7386%}@font-face{font-family:Poppins variant fallback;src:local("Arial");size-adjust:113.8478%;ascent-override:92.2284%;descent-override:30.7428%;line-gap-override:8.7837%}@font-face{font-family:Poppins variant;font-display:swap;src:url(/assets/font-CTKNfV9P.ttf) format("truetype")}@font-face{font-family:Roboto fallback;src:local("Segoe UI");size-adjust:101.4433%;ascent-override:91.4535%;descent-override:24.0667%;line-gap-override:0%}@font-face{font-family:Roboto fallback;src:local("Arial");size-adjust:100.9231%;ascent-override:91.9249%;descent-override:24.1908%;line-gap-override:0%}@font-face{font-family:Roboto;font-display:swap;src:url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu72xKKTU1Kvnz.woff2) format("woff2")}@font-face{font-family:Inter fallback;src:local("Segoe UI");size-adjust:108.1912%;ascent-override:89.5406%;descent-override:22.3195%;line-gap-override:0%}@font-face{font-family:Inter fallback;src:local("Arial");size-adjust:107.6364%;ascent-override:90.0021%;descent-override:22.4345%;line-gap-override:0%}@font-face{font-family:Inter;font-display:swap;src:url(https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2) format("woff2")}:root{--someFont: "Poppins variant", "Poppins variant fallback"}h1{font-family:Poppins variant,Poppins variant fallback,sans-serif}.roboto{font-family:Roboto,Roboto fallback,Arial,Helvetica,sans-serif}p{font-family:Poppins variant,Poppins variant fallback}div{font-family:var(--someFont)}.inter{font-family:Inter,Inter fallback}
      "
    `)
  })
})

// https://github.com/vitejs/vite-ecosystem-ci/blob/main/utils.ts#L24
async function $(literals: TemplateStringsArray, ...values: any[]) {
  const cmd = literals.reduce(
    (result, current, i) =>
      result + current + (values?.[i] != null ? `${values[i]}` : ''),
    ''
  )
  console.log(`${process.cwd()} $> ${cmd}`)
  const proc = execaCommand(cmd, {
    stdio: 'pipe',
  })
  proc.stdin && process.stdin.pipe(proc.stdin)
  proc.stdout && proc.stdout.pipe(process.stdout)
  proc.stderr && proc.stderr.pipe(process.stderr)
  const result = await proc
  return result.stdout
}
