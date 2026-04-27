import { app, BrowserWindow } from 'electron';
import { join } from 'path';

const isDev = process.env['NODE_ENV'] === 'development';
if (isDev) {
  try {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: false // Vite handles renderer hot reload
    });
  } catch (err) {
    console.error('Error loading electron-reloader:', err);
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

import { setupPrinterHandlers } from './ipc/printer';

app.whenReady().then(() => {
  setupPrinterHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
