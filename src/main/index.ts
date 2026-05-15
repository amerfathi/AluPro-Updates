import { autoUpdater } from 'electron-updater'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { appendFileSync, existsSync, readFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getStableDeviceId } from './device'
import { OfflineLicenseService } from './license-service'
// السطر التالي يستدعي الأيقونة من مجلد resources
import icon from '../../resources/icon.ico?asset'

// ==========================================================
// حماية البرنامج: القفل الأحادي لمنع فتح أكثر من نسخة في نفس الوقت
// ==========================================================
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // إذا كان البرنامج مفتوحاً مسبقاً، أغلق هذه المحاولة الجديدة فوراً
  app.quit()
} else {
  // إذا حاول المستخدم فتح البرنامج وهو مفتوح، نركز على النافذة الأصلية
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
// ==========================================================

// تم تعريف النافذة في الخارج لكي يستطيع نظام التحديثات التحدث معها
let mainWindow: BrowserWindow
let licenseService: OfflineLicenseService | null = null
let licenseBootstrapError: string | null = null
let licenseDebugLogPath: string | null = null

const writeLicenseDebugLog = (line: string): void => {
  if (!licenseDebugLogPath) return
  try {
    appendFileSync(licenseDebugLogPath, `[${new Date().toISOString()}] ${line}\n`, 'utf8')
  } catch {
    // no-op
  }
}

const resolveLicensePublicKeyPem = (): string => {
  const overridePath = process.env['ALUAPP_LICENSE_PUBLIC_KEY_PATH']
  const candidates = [
    overridePath,
    join(process.resourcesPath, 'license-public-key.pem'),
    join(app.getAppPath(), 'resources', 'license-public-key.pem')
  ].filter((entry): entry is string => Boolean(entry))

  for (const candidatePath of candidates) {
    if (existsSync(candidatePath)) {
      const pem = readFileSync(candidatePath, 'utf8')
      if (pem.trim()) {
        return pem
      }
    }
  }

  throw new Error('License public key file was not found.')
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200, // تم تكبير العرض الافتراضي ليناسب برنامجك
    height: 800,
    show: false,
    title: 'Amer',
    autoHideMenuBar: true,
    // التعديل السحري هنا: إجبار ظهور الأيقونة على ويندوز وكل الأنظمة
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  // تغيير المعرف ليتناسب مع اسم برنامجك
  electronApp.setAppUserModelId('com.alumanager.app')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('get_device_id', () => getStableDeviceId())

  try {
    licenseService = new OfflineLicenseService({
      stateFilePath: join(app.getPath('userData'), 'license-state.json'),
      publicKeyPem: resolveLicensePublicKeyPem(),
      resolveHardwareId: () => getStableDeviceId()
    })
  } catch (error) {
    licenseBootstrapError = error instanceof Error ? error.message : 'license_bootstrap_failed'
  }

  licenseDebugLogPath = join(app.getPath('userData'), 'license-debug.log')
  writeLicenseDebugLog(
    `license bootstrap: ${licenseBootstrapError ? `failed (${licenseBootstrapError})` : 'ok'}`
  )

  ipcMain.handle('license:get_status', () => {
    const hwid = getStableDeviceId()

    if (licenseBootstrapError || !licenseService) {
      writeLicenseDebugLog('activate rejected: public_key_unavailable')
      return {
        isActivated: false,
        expiryDate: null,
        hwid,
        reason: 'public_key_unavailable'
      }
    }

    return licenseService.getStatus()
  })

  ipcMain.handle('license:activate', (_event, rawToken) => {
    const hwid = getStableDeviceId()
    const tokenText = typeof rawToken === 'string' ? rawToken : ''
    const tokenPreview =
      typeof rawToken === 'string' ? `${tokenText.slice(0, 12)}...${tokenText.slice(-12)}` : 'n/a'
    writeLicenseDebugLog(
      `activate requested | hwid=${hwid} | tokenType=${typeof rawToken} | tokenLen=${tokenText.length} | tokenPreview=${tokenPreview}`
    )

    if (licenseBootstrapError || !licenseService) {
      return {
        ok: false,
        message: 'تعذر تشغيل محرك الترخيص: المفتاح العام غير متاح.',
        status: {
          isActivated: false,
          expiryDate: null,
          hwid,
          reason: 'public_key_unavailable'
        }
      }
    }

    if (typeof rawToken !== 'string') {
      writeLicenseDebugLog('activate rejected: invalid_token_format (non-string token)')
      return {
        ok: false,
        message: 'صيغة كود التفعيل غير صحيحة.',
        status: {
          isActivated: false,
          expiryDate: null,
          hwid,
          reason: 'invalid_token_format'
        }
      }
    }

    try {
      const result = licenseService.activateToken(rawToken)
      writeLicenseDebugLog(
        `activate result | ok=${String(result?.ok)} | reason=${String(result?.status?.reason || '')}`
      )
      return result
    } catch (error) {
      writeLicenseDebugLog(
        `activate exception | ${error instanceof Error ? error.stack || error.message : String(error)}`
      )
      return {
        ok: false,
        message: 'حدث خطأ داخلي أثناء معالجة التفعيل. يرجى إعادة المحاولة.',
        status: {
          isActivated: false,
          expiryDate: null,
          hwid,
          reason: error instanceof Error ? error.message : 'activation_internal_error'
        }
      }
    }
  })

  createWindow()

  // ==========================================================
  // نظام التحديثات التلقائية عبر GitHub (Auto Updater) 🚀
  // ==========================================================

  autoUpdater.autoDownload = false // التحميل فقط عند موافقة العميل
  autoUpdater.checkForUpdatesAndNotify()

  // صائد أخطاء التحديثات
  autoUpdater.on('error', (error) => {
    const errorMsg = error == null ? 'خطأ غير معروف' : (error.stack || error).toString()
    if (mainWindow) mainWindow.webContents.send('update_error', errorMsg)
  })

  // إشعار الواجهة بوجود تحديث
  autoUpdater.on('update-available', () => {
    if (mainWindow) mainWindow.webContents.send('update_available')
  })

  // إرسال نسبة التحميل لشريط التقدم
  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow)
      mainWindow.webContents.send('download_progress', Math.round(progressObj.percent))
  })

  // إشعار الواجهة بانتهاء التحميل وجاهزية التثبيت
  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update_downloaded')
  })

  // استقبال أمر بدء التحميل من زر العميل
  ipcMain.on('start_download', () => {
    autoUpdater.downloadUpdate()
  })

  // استقبال أمر إغلاق البرنامج وتثبيت التحديث
  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall()
  })

  // ==========================================================

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
