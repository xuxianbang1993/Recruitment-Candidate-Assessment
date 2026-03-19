import { app, BrowserWindow, Menu, session, dialog } from 'electron'
import { fork } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEV = process.env.NODE_ENV === 'development'

let mainWindow = null
let serverProcess = null
let intentionalQuit = false
const PORT = 39587

// P1-4: Single instance lock — must be before app.ready
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function startServer() {
  return new Promise((resolve, reject) => {
    // P1-2: ASAR-safe path
    const serverDir = __dirname.replace('app.asar', 'app.asar.unpacked')
    const serverPath = path.join(serverDir, '..', 'build', 'index.js')

    // P3-2: Log file in userData
    const logPath = path.join(app.getPath('userData'), 'server.log')
    const logStream = fs.createWriteStream(logPath, { flags: 'a' })

    // P3-6: Whitelist env vars; P1-1: DB_PATH in prod
    const env = {
      PATH: process.env.PATH,
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: String(PORT),
      HOST: '127.0.0.1',
      ORIGIN: `http://127.0.0.1:${PORT}`,
      DB_PATH: path.join(app.getPath('userData'), 'recruitment.db'),
    }

    // P2-2: Try/catch for port conflict
    try {
      serverProcess = fork(serverPath, [], {
        env,
        stdio: 'pipe',
      })
    } catch (err) {
      dialog.showErrorBox('启动失败', `服务器进程启动失败：${err.message}`)
      app.quit()
      return
    }

    let resolved = false
    // Store timeout ID so we can clear it when resolved via listening
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve()
      }
    }, 3000)

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString()
      logStream.write(`[stdout] ${msg}`)
      // P1-3: Case-insensitive listening check
      if (!resolved && msg.toLowerCase().includes('listening')) {
        resolved = true
        clearTimeout(fallbackTimer)
        resolve()
      }
    })

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString()
      logStream.write(`[stderr] ${msg}`)
      // P2-2: Detect port conflict
      if (msg.includes('EADDRINUSE')) {
        resolved = true
        clearTimeout(fallbackTimer)
        dialog.showErrorBox('端口冲突', `端口 ${PORT} 已被占用，请关闭占用该端口的程序后重试。`)
        app.quit()
        reject(new Error('EADDRINUSE'))
      }
    })

    serverProcess.on('error', (err) => {
      clearTimeout(fallbackTimer)
      reject(err)
    })

    // P2-1: Crash recovery — set up after promise resolves
    serverProcess.once('exit', (code) => {
      logStream.write(`[exit] Server exited with code ${code}\n`)
      if (code !== 0 && !intentionalQuit) {
        dialog.showErrorBox('服务崩溃', `后台服务意外退出（code ${code}），应用即将关闭。`)
        app.quit()
      }
    })
  })
}

async function createWindow() {
  // P1-7: Remove default application menu
  Menu.setApplicationMenu(null)

  // P1-6: Block all permission requests
  session.defaultSession.setPermissionRequestHandler((_, __, cb) => cb(false))

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    // P3-4: Shorter title
    title: '智聘评估',
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

  // P1-5: Navigation guard — block non-localhost navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${PORT}`) && !url.startsWith('http://localhost:')) {
      event.preventDefault()
    }
  })

  // P1-5: Block new window opens
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

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
  intentionalQuit = true
  if (serverProcess) {
    // P2-3: Graceful shutdown with SIGINT
    serverProcess.kill('SIGINT')
    serverProcess = null
  }
})
