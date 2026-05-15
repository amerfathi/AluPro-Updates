const { app, BrowserWindow, dialog } = require('electron')
const { spawn } = require('child_process')
const http = require('http')
const path = require('path')

let mainWindow = null
let serverProcess = null

const PORT = Number(process.env.ALUAPP_LICENSE_ADMIN_PORT || '4381') || 4381

const waitForServer = (url, timeoutMs = 25000) =>
  new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs

    const probe = () => {
      const request = http.get(url, (response) => {
        response.resume()
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve()
          return
        }

        if (Date.now() > deadline) {
          reject(new Error('timeout'))
          return
        }

        setTimeout(probe, 350)
      })

      request.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error('timeout'))
          return
        }

        setTimeout(probe, 350)
      })
    }

    probe()
  })

const resolveAdminServerScript = () =>
  app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'scripts', 'licensing', 'admin-server.mjs')
    : path.join(__dirname, '..', 'admin-server.mjs')

const createWindow = async () => {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '..', '..', '..', 'resources', 'icon.ico')

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1150,
    minHeight: 760,
    icon: iconPath,
    show: false,
    autoHideMenuBar: true,
    title: 'AluPro License Admin'
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  await mainWindow.loadURL(`http://localhost:${PORT}`)
}

const startLocalServer = async () => {
  const scriptPath = resolveAdminServerScript()
  const storePath = path.join(app.getPath('userData'), 'admin-store.json')

  serverProcess = spawn(process.execPath, [scriptPath, '--port', String(PORT), '--store', storePath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      ALUAPP_LICENSE_ADMIN_PORT: String(PORT),
      ALUAPP_LICENSE_STORE: storePath
    },
    stdio: 'ignore',
    windowsHide: true
  })

  serverProcess.unref()

  await waitForServer(`http://localhost:${PORT}/api/state`)
}

const stopLocalServer = () => {
  if (!serverProcess || serverProcess.killed) return

  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t'], {
        windowsHide: true,
        stdio: 'ignore'
      })
    } else {
      serverProcess.kill('SIGTERM')
    }
  } catch {
    // no-op
  }
}

app.whenReady().then(async () => {
  try {
    await startLocalServer()
    await createWindow()
  } catch (error) {
    dialog.showErrorBox(
      'License Admin Startup Failed',
      `تعذر تشغيل أداة التراخيص:\n${error instanceof Error ? error.message : 'unknown error'}`
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  stopLocalServer()
  app.quit()
})

app.on('before-quit', () => {
  stopLocalServer()
})
