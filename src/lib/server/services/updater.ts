import { execFile } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = process.cwd()

interface ExecResult {
  stdout: string
  stderr: string
}

function run(cmd: string, args: string[]): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: PROJECT_ROOT, timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) reject(err)
      else resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
    })
  })
}

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  currentCommit: string
  remoteCommit: string
  behindCount: number
  commits: { hash: string; message: string; date: string }[]
}

export interface UpdateResult {
  success: boolean
  updatedFiles: string[]
  needsRestart: boolean
  message: string
}

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8'))
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function getPackageJsonContent(): string {
  try {
    return readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8')
  } catch {
    return ''
  }
}

/** Check if there are updates available on origin/main */
export async function checkForUpdates(): Promise<UpdateInfo> {
  const version = getVersion()

  const { stdout: localHead } = await run('git', ['rev-parse', 'HEAD'])

  // Fetch latest from origin
  await run('git', ['fetch', 'origin', 'main'])

  const { stdout: remoteHead } = await run('git', ['rev-parse', 'origin/main'])

  if (localHead === remoteHead) {
    return {
      hasUpdate: false,
      currentVersion: version,
      currentCommit: localHead.slice(0, 7),
      remoteCommit: remoteHead.slice(0, 7),
      behindCount: 0,
      commits: []
    }
  }

  const { stdout: countStr } = await run('git', [
    'rev-list', '--count', 'HEAD..origin/main'
  ])
  const behindCount = parseInt(countStr, 10) || 0

  const { stdout: logOutput } = await run('git', [
    'log', '--oneline', '--format=%h|%s|%ci', 'HEAD..origin/main'
  ])
  const commits = logOutput
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|')
      return {
        hash: parts[0] ?? '',
        message: parts[1] ?? '',
        date: parts[2]?.split(' ')[0] ?? ''
      }
    })

  return {
    hasUpdate: true,
    currentVersion: version,
    currentCommit: localHead.slice(0, 7),
    remoteCommit: remoteHead.slice(0, 7),
    behindCount,
    commits
  }
}

/** Apply the update: git pull + npm install if needed */
export async function applyUpdate(): Promise<UpdateResult> {
  const pkgBefore = getPackageJsonContent()

  const { stdout: pullOutput } = await run('git', ['pull', 'origin', 'main'])

  if (pullOutput.includes('Already up to date')) {
    return {
      success: true,
      updatedFiles: [],
      needsRestart: false,
      message: '已经是最新版本'
    }
  }

  // Parse updated files from pull output
  const updatedFiles = pullOutput
    .split('\n')
    .filter((line) => /^\s/.test(line) && line.includes('|'))
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean)

  // Check if package.json changed — if so, run npm install
  const pkgAfter = getPackageJsonContent()
  let needsRestart = false

  if (pkgBefore !== pkgAfter) {
    await run('npm', ['install'])
    needsRestart = true
  }

  const newVersion = getVersion()

  return {
    success: true,
    updatedFiles,
    needsRestart,
    message: needsRestart
      ? `已更新到 v${newVersion}，依赖有变化，请重启 npm run dev`
      : `已更新到 v${newVersion}，Vite 将自动热加载`
  }
}

/** Get current version + git commit */
export async function getVersionInfo(): Promise<{ version: string; commit: string }> {
  const version = getVersion()
  try {
    const { stdout } = await run('git', ['rev-parse', '--short', 'HEAD'])
    return { version, commit: stdout }
  } catch {
    return { version, commit: '' }
  }
}
