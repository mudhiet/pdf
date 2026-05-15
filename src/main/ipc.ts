import { ipcMain, BrowserWindow } from 'electron';
import {
  DOC_OPEN_RESPONSE,
  DOC_SAVE_RESPONSE,
  DOC_SAVE_AS_RESPONSE,
  DOC_CLOSE_RESPONSE,
  DIALOG_OPEN_FILE,
  DIALOG_SAVE_FILE,
  WIN_STATE_SAVE,
  WIN_STATE_RESTORE,
} from '../shared/channels.js';

interface IpcResult {
  success?: boolean;
  error?: string;
  data?: unknown;
}

export function registerIPCHandlers(mainWindow: BrowserWindow): void {
  // Document lifecycle handlers
  ipcMain.handle(DOC_OPEN_RESPONSE, async (): Promise<IpcResult> => {
    // Placeholder: will return file bytes in Plan 01-03
    return { error: 'Not implemented' };
  });

  ipcMain.handle(DOC_SAVE_RESPONSE, async (): Promise<IpcResult> => {
    // Placeholder: will save file bytes in Plan 01-03
    return { success: true };
  });

  ipcMain.handle(DOC_SAVE_AS_RESPONSE, async (): Promise<IpcResult> => {
    // Placeholder: will save file bytes to new path in Plan 01-03
    return { success: true };
  });

  ipcMain.handle(DOC_CLOSE_RESPONSE, async (): Promise<IpcResult> => {
    // Placeholder: will close document in Plan 01-03
    return { success: true };
  });

  // File dialog handlers
  ipcMain.handle(DIALOG_OPEN_FILE, async (): Promise<string | null> => {
    // Placeholder: will open file dialog in Plan 01-03
    return null;
  });

  ipcMain.handle(DIALOG_SAVE_FILE, async (): Promise<string | null> => {
    // Placeholder: will open save dialog in Plan 01-03
    return null;
  });

  // Window state handlers
  ipcMain.handle(WIN_STATE_SAVE, async (): Promise<IpcResult> => {
    // Placeholder: will save window state in Plan 01-03
    return {};
  });

  ipcMain.handle(WIN_STATE_RESTORE, async (): Promise<IpcResult> => {
    // Placeholder: will restore window state in Plan 01-03
    return {};
  });
}

export function registerIPCEvents(_mainWindow: BrowserWindow): void {
  // Main sends events (app:ready, app:error); renderer listens via ipcRenderer.on()
  // No send handlers needed in main — main is the sender, not receiver, for events
}
