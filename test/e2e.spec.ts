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
      "@font-face{font-family:Poppins variant fallback;src:local("Segoe UI");size-adjust:113.4764%;ascent-override:92.5303%;descent-override:30.8434%;line-gap-override:8.8124%}@font-face{font-family:Poppins variant fallback;src:local("Arial");size-adjust:113.7274%;ascent-override:92.326%;descent-override:30.7753%;line-gap-override:8.793%}@font-face{font-family:Poppins variant;font-display:swap;src:url(/assets/font-707fdc5c.ttf) format("truetype")}@font-face{font-family:Roboto fallback;src:local("Segoe UI");size-adjust:99.8896%;ascent-override:92.8759%;descent-override:24.441%;line-gap-override:0%}@font-face{font-family:Roboto fallback;src:local("Arial");size-adjust:100.1106%;ascent-override:92.6709%;descent-override:24.3871%;line-gap-override:0%}@font-face{font-family:Roboto;font-display:swap;src:url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu72xKKTU1Kvnz.woff2) format("woff2")}@font-face{font-family:Inter fallback;src:local("Segoe UI");size-adjust:107.1644%;ascent-override:90.3985%;descent-override:22.5334%;line-gap-override:0%}@font-face{font-family:Inter fallback;src:local("Arial");size-adjust:107.4014%;ascent-override:90.199%;descent-override:22.4836%;line-gap-override:0%}@font-face{font-family:Inter;font-display:swap;src:url(https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2) format("woff2")}:root{--someFont: "Poppins variant", "Poppins variant fallback"}h1{font-family:Poppins variant,Poppins variant fallback,sans-serif}.roboto{font-family:Roboto,Roboto fallback,Arial,Helvetica,sans-serif}p{font-family:Poppins variant,Poppins variant fallback}div{font-family:var(--someFont)}.inter{font-family:Inter,Inter fallback}
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
