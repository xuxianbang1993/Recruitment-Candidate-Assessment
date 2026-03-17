import { app, BrowserWindow } from 'electron'
import { fork } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEV = process.env.NODE_ENV === 'development'

let mainWindow = null
let serverProcess = null
const PORT = 39587

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '..', 'build', 'index.js')
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', ORIGIN: `http://127.0.0.1:${PORT}` },
      stdio: 'pipe'
    })
    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString()
      console.log('[server]', msg)
      if (msg.includes('listening')) resolve()
    })
    serverProcess.stderr.on('data', (data) => console.error('[server]', data.toString()))
    serverProcess.on('error', reject)
    // Fallback timeout
    setTimeout(resolve, 3000)
  })
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: '智聘评估 — 招聘需求智能评估系统',
    icon: path.join(__dirname, '..', 'static', 'favicon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  if (DEV) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    await startServer()
    mainWindow.loadURL(`http://127.0.0.1:${PORT}`)
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.on('ready', createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (!mainWindow) createWindow() })
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
})
