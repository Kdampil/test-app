const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let addTimeZoneWindow;

function createWindow() {
  // Restore window position and size from saved state
  let windowState = {};
  try {
    windowState = JSON.parse(fs.readFileSync(path.join(__dirname, 'window-state.json'), 'utf8'));
  } catch (e) {
    windowState = { width: 800, height: 600 };
  }

  mainWindow = new BrowserWindow({
    width: windowState.width || 800,
    height: windowState.height || 600,
    x: windowState.x,
    y: windowState.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Save window position and size on close
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    fs.writeFileSync(
      path.join(__dirname, 'window-state.json'),
      JSON.stringify({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      })
    );
  });
}

// Open the "Add Time Zone" window
ipcMain.on('open-add-timezone-window', () => {
  if (addTimeZoneWindow) {
    addTimeZoneWindow.focus();
    return;
  }

  addTimeZoneWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addTimeZoneWindow.loadFile('add-timezone.html');

  addTimeZoneWindow.on('closed', () => {
    addTimeZoneWindow = null;
  });
});

// Handle adding a new time zone
ipcMain.on('add-timezone', (event, timeZone) => {
  mainWindow.webContents.send('add-timezone-to-main', timeZone);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});