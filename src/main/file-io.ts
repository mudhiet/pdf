import { dialog, BrowserWindow } from 'electron';
import { promises as fs } from 'fs';
import { extname, dirname, basename } from 'path';

const PDF_MAGIC_BYTES = Buffer.from('%PDF-');
const PDF_EXTENSION = '.pdf';

/**
 * Sanitize error messages to prevent filesystem path leakage.
 * Replaces raw OS paths with generic descriptions.
 */
function sanitizeError(message: string): string {
  // Remove Windows-style paths (C:\..., \\...\...)
  let sanitized = message.replace(/[A-Za-z]:\\(?:[^\\]*\\)*/g, '[path]');
  // Remove Unix-style paths (/home/..., /Users/..., /var/...)
  sanitized = sanitized.replace(/\/(?:home|Users|var|etc|tmp|opt|root)(?:\/[^\/\s]*)+/g, '[path]');
  // Remove "ENOENT", "EACCES", "ENOSPC" and similar OS error codes
  sanitized = sanitized.replace(/\b(ENOENT|EACCES|ENOSPC|EPERM|EEXIST|EBUSY|EINTR)\b/g, '[error-code]');
  // Remove "no such file or directory", "permission denied" style messages with paths
  sanitized = sanitized.replace(/no such file(?: or directory)?(?:\s*:\s*\[path\])?/gi, 'file not found');
  sanitized = sanitized.replace(/permission denied(?:\s*:\s*\[path\])?/gi, 'access denied');
  // Remove trailing path fragments after colons
  sanitized = sanitized.replace(/:\s*[/\\][^\s,;)]+/g, '');
  return sanitized.trim();
}

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

    if (bytes.length === 0) {
      return { error: 'The selected file is empty.' };
    }

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
    const rawMessage = err instanceof Error ? err.message : 'Unknown error';

    if (rawMessage.includes('ENOENT') || rawMessage.includes('no such file')) {
      return { error: 'The file could not be found. It may have been moved or deleted.' };
    }

    if (rawMessage.includes('EACCES') || rawMessage.includes('permission')) {
      return { error: 'Access denied. The file may be in use by another program or protected.' };
    }

    return { error: `Failed to open the file. ${sanitizeError(rawMessage)}` };
  }
}

/**
 * Save PDF bytes to disk.
 * Writes base64-decoded bytes to the specified path.
 */
export async function savePDF(filePath: string, base64Bytes: string): Promise<SaveResult> {
  try {
    // Validate base64 before decoding — malformed input would produce corrupted output
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Bytes)) {
      return { error: 'The document data is corrupted and cannot be saved.' };
    }
    const bytes = Buffer.from(base64Bytes, 'base64');
    await fs.writeFile(filePath, bytes);
    return { success: true };
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Unknown error';

    if (rawMessage.includes('ENOENT') || rawMessage.includes('no such file')) {
      return { error: 'The destination folder could not be found.' };
    }

    if (rawMessage.includes('EACCES') || rawMessage.includes('permission')) {
      return { error: 'Access denied. The file may be read-only or in use by another program.' };
    }

    if (rawMessage.includes('disk full') || rawMessage.includes('ENOSPC')) {
      return { error: 'Insufficient disk space to save the file.' };
    }

    return { error: `Failed to save the file. ${sanitizeError(rawMessage)}` };
  }
}

/**
 * Close the current document (placeholder for future cleanup).
 */
export async function closeDocument(): Promise<SaveResult> {
  return { success: true };
}
