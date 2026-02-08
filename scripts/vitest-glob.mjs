import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const args = process.argv.slice(2)
const rewrittenArgs = []

let skipNext = false
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i]

  if (skipNext) {
    rewrittenArgs.push(arg)
    skipNext = false
    continue
  }

  if (arg === '--config' || arg === '-c') {
    rewrittenArgs.push(arg)
    skipNext = true
    continue
  }

  if (arg.startsWith('-')) {
    rewrittenArgs.push(arg)
    continue
  }

  if (arg.includes('*')) {
    const base = path.basename(arg).replace(/\*/g, '')
    const cleaned = base || arg.replace(/\*/g, '')
    if (cleaned) {
      rewrittenArgs.push(cleaned)
      continue
    }
  }

  rewrittenArgs.push(arg)
}

const vitestBin = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vitest.cmd' : 'vitest',
)

const child = spawn(vitestBin, rewrittenArgs, { stdio: 'inherit' })

child.on('exit', (code) => {
  process.exit(typeof code === 'number' ? code : 1)
})
