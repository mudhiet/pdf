import { app, BrowserWindow, Menu, dialog, MenuItem } from 'electron';
import { join } from 'path';
import { registerIPCHandlers, registerIPCEvents } from './ipc.js';
import { getSavedState, saveState, registerFileAssociation } from './window-state.js';

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  // Load saved window state
  const savedState = await getSavedState();

  mainWindow = new BrowserWindow({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height,
    minWidth: 800,
    minHeight: 600,
    title: 'PDF Editor',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Restore maximized state
  if (savedState.maximized) {
    mainWindow.maximize();
  }

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

  // Save window state on resize and close
  mainWindow.on('resize', () => {
    saveState(mainWindow!);
  });

  mainWindow.on('close', () => {
    saveState(mainWindow!);
  });

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
app.on('second-instance', async (_event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }

  // Open the first file from command line (e.g., double-clicked PDF)
  const filePath = commandLine[commandLine.length - 1];
  if (filePath && mainWindow) {
    console.log('Second instance open:', filePath);
    // Will be wired to IPC in Plan 01-03
  }
});

// Handle macOS open-file event
app.on('open-file', async (_event, filePath) => {
  if (mainWindow) {
    console.log('Open file event:', filePath);
    // Will be wired to IPC in Plan 01-03
  }
});

app.whenReady().then(async () => {
  // Register file association (non-blocking)
  registerFileAssociation();

  createMenu();
  await createWindow();

  // Register IPC handlers after window creation
  if (mainWindow) {
    registerIPCHandlers(mainWindow);
    registerIPCEvents(mainWindow);
    // Signal renderer that app is ready
    mainWindow.webContents.send('app:ready');
  }

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
