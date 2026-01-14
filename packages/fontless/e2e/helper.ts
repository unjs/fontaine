import type { ChildProcess, SpawnOptions } from 'node:child_process'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { stripVTControlCharacters, styleText } from 'node:util'
import { x } from 'tinyexec'

// based on https://github.com/vitejs/vite-plugin-react/blob/80df894c78169d63d9f1f49d35dd548b6aa53601/packages/plugin-rsc/e2e/fixture.ts#L9-L10

// workaround for module resolution issue with node:events
type ChildProcessWithEvents = ChildProcess & {
  on: (event: string, listener: (...args: any[]) => void) => ChildProcessWithEvents
}

interface RunCliReturn {
  proc: ChildProcess
  done: Promise<void>
  findPort: () => Promise<number>
  kill: () => void
  stdout: () => string
  stderr: () => string
}

export function runCli(options: { command: string, label?: string } & SpawnOptions): RunCliReturn {
  const [name, ...args] = options.command.split(' ')
  const child = x(name!, args, { nodeOptions: options }).process! as ChildProcessWithEvents
  const label = `[${options.label ?? 'cli'}]`
  let stdout = ''
  let stderr = ''
  child.stdout!.on('data', (data) => {
    stdout += stripVTControlCharacters(String(data))
    if (process.env.TEST_DEBUG) {
      // eslint-disable-next-line no-console
      console.log(styleText('cyan', label), data.toString())
    }
  })
  child.stderr!.on('data', (data) => {
    stderr += stripVTControlCharacters(String(data))
    // eslint-disable-next-line no-console
    console.log(styleText('magenta', label), data.toString())
  })
  const done = new Promise<void>((resolve) => {
    child.on('exit', (code) => {
      if (code !== 0 && code !== 143 && process.platform !== 'win32') {
        // eslint-disable-next-line no-console
        console.log(styleText('magenta', `${label}`), `exit code ${code}`)
      }
      resolve()
    })
  })

  async function findPort(): Promise<number> {
    let stdout = ''
    return new Promise((resolve) => {
      child.stdout!.on('data', (data) => {
        stdout += stripVTControlCharacters(String(data))
        const match = stdout.match(/http:\/\/localhost:(\d+)/)
        if (match) {
          resolve(Number(match[1]))
        }
      })
    })
  }

  function kill(): void {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'])
    }
    else {
      child.kill()
    }
  }

  return {
    proc: child,
    done,
    findPort,
    kill,
    stdout: () => stdout,
    stderr: () => stderr,
  }
}
