import { app, BrowserWindow, Menu, dialog, MenuItem } from 'electron';
import { join } from 'path';
import { registerIPCHandlers, registerIPCEvents } from './ipc.js';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    title: 'PDF Editor',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu(): void {
  const template: (MenuItem | import('electron').MenuItemConstructorOptions)[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: (_menuItem: MenuItem, _event: unknown): void => {
            dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile'],
              filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
            }).then((result) => {
              if (!result.canceled && result.filePaths.length > 0) {
                // Will be wired to IPC in Plan 01-02
                console.log('Open file:', result.filePaths[0]);
              }
            }).catch((err) => {
              console.error('Failed to open file dialog:', err);
            });
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: (_menuItem: MenuItem, _event: unknown): void => {
            // Will be wired to IPC in Plan 01-02
            console.log('Save triggered');
          },
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (_menuItem: MenuItem, _event: unknown): void => {
            dialog.showSaveDialog(mainWindow!, {
              filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
            }).then((result) => {
              if (!result.canceled && result.filePath) {
                // Will be wired to IPC in Plan 01-02
                console.log('Save As path:', result.filePath);
              }
            }).catch((err) => {
              console.error('Failed to save file dialog:', err);
            });
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: (_menuItem: MenuItem, _event: unknown): void => {
            app.quit();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handle second-instance event (Windows single-instance behavior)
app.on('second-instance', (_event, commandLine) => {
  // Someone tried to run a second instance
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }

  // Open the first file from command line (e.g., double-clicked PDF)
  const filePath = commandLine[commandLine.length - 1];
  if (filePath && mainWindow) {
    console.log('Second instance open:', filePath);
  }
});

// Handle macOS open-file event
app.on('open-file', (_event, filePath) => {
  if (mainWindow) {
    console.log('Open file event:', filePath);
  }
});

app.whenReady().then(() => {
  createMenu();
  createWindow();

  // Register IPC handlers after window creation
  if (mainWindow) {
    registerIPCHandlers(mainWindow);
    registerIPCEvents(mainWindow);
    // Signal renderer that app is ready
    mainWindow.webContents.send('app:ready');
  }

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked and no windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
