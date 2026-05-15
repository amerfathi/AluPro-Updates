const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // هنا مسار الأيقونة التي ستظهر في شريط المهام وزاوية البرنامج
    icon: path.join(__dirname, 'assets', 'icon.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // هذا السطر يربط Electron بمشروع React الخاص بك
  // في مرحلة التطوير يقرأ من الرابط، وفي مرحلة التغليف يقرأ من ملفات البناء
  const appURL = app.isPackaged 
    ? `file://${path.join(__dirname, 'build/index.html')}` 
    : 'http://localhost:3000';

  mainWindow.loadURL(appURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});