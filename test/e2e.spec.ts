import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execaCommand } from 'execa'
import { join } from 'pathe'
import { describe, expect, it } from 'vitest'

describe('fontaine', () => {
  it('e2e', async () => {
    const assetsDir = fileURLToPath(
      new URL('../playground/dist/assets', import.meta.url),
    )
    await $`pnpm vite build playground --config test/vite.config.mjs`
    const cssFile = await readdir(assetsDir).then(files =>
      files.find(f => f.endsWith('.css')),
    )
    // @ts-expect-error there must be a file or we _want_ a test failure
    const css = await readFile(join(assetsDir, cssFile), 'utf-8')
    expect(css.replace(/\.\w+\.woff2/g, '.woff2')).toMatchInlineSnapshot(`
      "@font-face{font-family:Poppins variant fallback;src:local("Segoe UI");size-adjust:112.7753%;ascent-override:93.1055%;descent-override:31.0352%;line-gap-override:8.8672%}@font-face{font-family:Poppins variant fallback;src:local("Arial");size-adjust:112.1577%;ascent-override:93.6182%;descent-override:31.2061%;line-gap-override:8.916%}@font-face{font-family:Poppins variant;font-display:swap;src:url(/assets/font-CTKNfV9P.ttf) format("truetype")}@font-face{font-family:Roboto fallback;src:local("Segoe UI");size-adjust:100.3304%;ascent-override:92.4679%;descent-override:24.3337%;line-gap-override:0%}@font-face{font-family:Roboto fallback;src:local("Arial");size-adjust:99.7809%;ascent-override:92.9771%;descent-override:24.4677%;line-gap-override:0%}@font-face{font-family:Roboto;font-display:swap;src:url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu72xKKTU1Kvnz.woff2) format("woff2")}@font-face{font-family:Inter fallback;src:local("Segoe UI");size-adjust:107.7093%;ascent-override:89.9412%;descent-override:22.3946%;line-gap-override:0%}@font-face{font-family:Inter fallback;src:local("Arial");size-adjust:107.1194%;ascent-override:90.4365%;descent-override:22.518%;line-gap-override:0%}@font-face{font-family:Inter;font-display:swap;src:url(https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2) format("woff2")}:root{--someFont: "Poppins variant", "Poppins variant fallback"}h1{font-family:Poppins variant,Poppins variant fallback,sans-serif}.roboto{font-family:Roboto,Roboto fallback,Arial,Helvetica,sans-serif}p{font-family:Poppins variant,Poppins variant fallback}div{font-family:var(--someFont)}.inter{font-family:Inter,Inter fallback}
      "
    `)
  })
})

// https://github.com/vitejs/vite-ecosystem-ci/blob/main/utils.ts#L24
async function $(literals: TemplateStringsArray, ...values: any[]) {
  const cmd = literals.reduce(
    (result, current, i) =>
      result + current + (values?.[i] != null ? `${values[i]}` : ''),
    '',
  )
  // eslint-disable-next-line no-console
  console.log(`${process.cwd()} $> ${cmd}`)
  const proc = execaCommand(cmd, {
    stdio: 'pipe',
  })
  if (proc.stdin) {
    process.stdin.pipe(proc.stdin)
  }
  if (proc.stdout) {
    proc.stdout.pipe(process.stdout)
  }
  if (proc.stderr) {
    proc.stderr.pipe(process.stderr)
  }
  const result = await proc
  return result.stdout
}
