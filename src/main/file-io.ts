import { dialog, BrowserWindow } from 'electron';
import { promises as fs } from 'fs';
import { extname, dirname, basename } from 'path';

const PDF_MAGIC_BYTES = Buffer.from('%PDF-');
const PDF_EXTENSION = '.pdf';

interface OpenResult {
  bytes?: string;
  path?: string;
  error?: string;
}

interface SaveResult {
  success?: boolean;
  error?: string;
}

/**
 * Open a file dialog filtered to PDF files.
 * Returns the selected file path or null if cancelled.
 */
export async function openFile(mainWindow: BrowserWindow): Promise<string | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Open PDF File',
    properties: ['openFile'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  return filePaths[0];
}

/**
 * Open a save dialog.
 * Returns the selected file path or null if cancelled.
 * Auto-appends .pdf extension if not provided.
 */
export async function saveFile(mainWindow: BrowserWindow, initialPath?: string): Promise<string | null> {
  const defaultPath = initialPath || undefined;

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save PDF File',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    defaultPath,
  });

  if (canceled || !filePath) {
    return null;
  }

  // Auto-append .pdf extension if not provided
  if (!extname(filePath).toLowerCase()) {
    return filePath + PDF_EXTENSION;
  }

  return filePath;
}

/**
 * Open and read a PDF file.
 * Validates %PDF- magic bytes and rejects non-PDF files.
 * Returns base64-encoded bytes and file path on success.
 */
export async function openPDF(filePath: string): Promise<OpenResult> {
  try {
    const bytes = await fs.readFile(filePath);

    // Validate PDF magic bytes
    for (let i = 0; i < PDF_MAGIC_BYTES.length; i++) {
      if (bytes[i] !== PDF_MAGIC_BYTES[i]) {
        return {
          error: `The selected file is not a valid PDF. Expected PDF magic bytes but found different content.`,
        };
      }
    }

    return {
      bytes: bytes.toString('base64'),
      path: filePath,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('ENOENT') || message.includes('no such file')) {
      return { error: 'The file could not be found. It may have been moved or deleted.' };
    }

    if (message.includes('EACCES') || message.includes('permission')) {
      return { error: 'Access denied. The file may be in use by another program or protected.' };
    }

    return { error: `Failed to open the file: ${message}` };
  }
}

/**
 * Save PDF bytes to disk.
 * Writes base64-decoded bytes to the specified path.
 */
export async function savePDF(filePath: string, base64Bytes: string): Promise<SaveResult> {
  try {
    const bytes = Buffer.from(base64Bytes, 'base64');
    await fs.writeFile(filePath, bytes);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('ENOENT') || message.includes('no such file')) {
      return { error: `The destination folder could not be found: ${dirname(filePath)}` };
    }

    if (message.includes('EACCES') || message.includes('permission')) {
      return { error: 'Access denied. The file may be read-only or in use by another program.' };
    }

    if (message.includes('disk full') || message.includes('ENOSPC')) {
      return { error: 'Insufficient disk space to save the file.' };
    }

    return { error: `Failed to save the file: ${message}` };
  }
}

/**
 * Close the current document (placeholder for future cleanup).
 */
export async function closeDocument(): Promise<SaveResult> {
  return { success: true };
}
