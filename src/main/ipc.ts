import { ipcMain, BrowserWindow } from 'electron';
import {
  DOC_OPEN,
  DOC_SAVE,
  DOC_SAVE_AS,
  DOC_CLOSE,
  DIALOG_OPEN_FILE,
  DIALOG_SAVE_FILE,
  WIN_STATE_SAVE,
  WIN_STATE_RESTORE,
  DOC_OPEN_RESPONSE,
  DOC_SAVE_RESPONSE,
  DOC_SAVE_AS_RESPONSE,
  DOC_CLOSE_RESPONSE,
  WIN_STATE_RESTORE_RESPONSE,
} from '../shared/channels.js';
import {
  openFile,
  saveFile,
  openPDF,
  savePDF,
  closeDocument,
} from './file-io.js';

interface IpcResult {
  success?: boolean;
  error?: string;
  data?: unknown;
}

interface OpenDocResult {
  bytes?: string;
  path?: string;
  error?: string;
}

export function registerIPCHandlers(mainWindow: BrowserWindow): void {
  // Document lifecycle — invoke channels (renderer requests, main responds)
  ipcMain.handle(DOC_OPEN, async (_event, filePath: string): Promise<OpenDocResult> => {
    if (!filePath) {
      return { error: 'No file path provided' };
    }
    return openPDF(filePath);
  });

  ipcMain.handle(DOC_SAVE, async (_event, data: { bytes: string; path: string }): Promise<IpcResult> => {
    if (!data?.bytes || !data?.path) {
      return { error: 'Missing bytes or path' };
    }
    return savePDF(data.path, data.bytes);
  });

  ipcMain.handle(DOC_SAVE_AS, async (): Promise<IpcResult> => {
    // Placeholder: will open save dialog and save in Plan 01-03 Task 1
    return { success: true };
  });

  ipcMain.handle(DOC_CLOSE, async (): Promise<IpcResult> => {
    return closeDocument();
  });

  // File dialog channels
  ipcMain.handle(DIALOG_OPEN_FILE, async (): Promise<string | null> => {
    return openFile(mainWindow);
  });

  ipcMain.handle(DIALOG_SAVE_FILE, async (): Promise<string | null> => {
    return saveFile(mainWindow);
  });

  // Window state channels
  ipcMain.handle(WIN_STATE_SAVE, async (): Promise<IpcResult> => {
    return {};
  });

  ipcMain.handle(WIN_STATE_RESTORE, async (): Promise<IpcResult> => {
    return {};
  });

  // Legacy response channels (for backward compatibility with preload)
  ipcMain.handle(DOC_OPEN_RESPONSE, async (): Promise<IpcResult> => {
    return { error: 'Not implemented' };
  });

  ipcMain.handle(DOC_SAVE_RESPONSE, async (): Promise<IpcResult> => {
    return { success: true };
  });

  ipcMain.handle(DOC_SAVE_AS_RESPONSE, async (): Promise<IpcResult> => {
    return { success: true };
  });

  ipcMain.handle(DOC_CLOSE_RESPONSE, async (): Promise<IpcResult> => {
    return { success: true };
  });

  ipcMain.handle(WIN_STATE_RESTORE_RESPONSE, async (): Promise<IpcResult> => {
    return {};
  });
}

export function registerIPCEvents(_mainWindow: BrowserWindow): void {
  // Main sends events (app:ready, app:error); renderer listens via ipcRenderer.on()
  // No send handlers needed in main — main is the sender, not receiver, for events
}
