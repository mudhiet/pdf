import { ipcMain, BrowserWindow } from 'electron';
import { resolve, dirname, extname } from 'path';
import { access, constants } from 'fs/promises';
import {
  DOC_OPEN,
  DOC_SAVE,
  DOC_SAVE_AS,
  DOC_CLOSE,
  DIALOG_OPEN_FILE,
  DIALOG_SAVE_FILE,
  WIN_STATE_SAVE,
  WIN_STATE_RESTORE,
} from '../shared/channels.js';
import {
  openFile,
  saveFile,
  openPDF,
  savePDF,
  closeDocument,
} from './file-io.js';

/**
 * Validate a save path to prevent writes to arbitrary filesystem locations.
 * Returns { valid: true, path: string } or { valid: false, error: string }.
 */
async function validateSavePath(rawPath: string): Promise<{ valid: true; path: string } | { valid: false, error: string }> {
  if (!rawPath || typeof rawPath !== 'string') {
    return { valid: false, error: 'Invalid file path.' };
  }

  const normalized = resolve(rawPath);

  if (normalized.endsWith('.pdf') !== true) {
    return { valid: false, error: 'Only PDF files can be saved.' };
  }

  const dir = dirname(normalized);

  if (dir === normalized) {
    return { valid: false, error: 'Cannot save at filesystem root.' };
  }

  // Prevent writes to system directories
  const systemRoot = process.env.SystemRoot;
  if (systemRoot && normalized.toLowerCase().startsWith(systemRoot.toLowerCase())) {
    return { valid: false, error: 'Cannot save to system directories.' };
  }

  try {
    await access(dir, constants.W_OK);
  } catch {
    return { valid: false, error: 'Cannot write to the selected location. Check permissions.' };
  }

  return { valid: true, path: normalized };
}

  const normalized = resolve(rawPath);

  if (normalized.endsWith('.pdf') !== true) {
    return { valid: false, error: 'Only PDF files can be saved.' };
  }

  const dir = dirname(normalized);

  if (dir === normalized) {
    return { valid: false, error: 'Cannot save at filesystem root.' };
  }

  try {
    await access(dir, constants.W_OK);
  } catch {
    return { valid: false, error: 'Cannot write to the selected location. Check permissions.' };
  }

  return { valid: true, path: normalized };
}

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
    const validation = await validateSavePath(data.path);
    if (!validation.valid) {
      return { error: validation.error };
    }
    return savePDF(validation.path, data.bytes);
  });

  ipcMain.handle(DOC_SAVE_AS, async (): Promise<IpcResult> => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF As',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });
    if (result.canceled || !result.filePath) {
      return { success: false };
    }
    return { success: true, data: result.filePath };
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
}

export function registerIPCEvents(_mainWindow: BrowserWindow): void {
  // Main sends events (app:ready, app:error); renderer listens via ipcRenderer.on()
  // No send handlers needed in main — main is the sender, not receiver, for events
}
