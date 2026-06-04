import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized: boolean;
}

interface WindowStateFile {
  state: WindowState;
  hash: string;
}

const HASH_ALGORITHM = 'sha256';

const DEFAULT_STATE: WindowState = {
  width: 1024,
  height: 768,
  maximized: false,
};

const STATE_FILE = 'window-state.json';

function getStatePath(): string {
  return join(app.getPath('userData'), STATE_FILE);
}

function computeHash(state: WindowState): string {
  const stateStr = JSON.stringify(state, null, 2);
  return createHash(HASH_ALGORITHM).update(stateStr).digest('hex');
}

function verifyHash(state: WindowState, hash: string): boolean {
  return computeHash(state) === hash;
}

export async function getSavedState(): Promise<WindowState> {
  try {
    const statePath = getStatePath();
    const data = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(data) as WindowStateFile;

    if (parsed.state && parsed.state.width && parsed.state.height) {
      if (!verifyHash(parsed.state, parsed.hash)) {
        console.warn('[window-state] Integrity check failed — state file may be tampered. Using defaults.');
        return { ...DEFAULT_STATE };
      }
      return {
        x: parsed.state.x,
        y: parsed.state.y,
        width: parsed.state.width,
        height: parsed.state.height,
        maximized: parsed.state.maximized || false,
      };
    }
  } catch {
    // File doesn't exist or is invalid — use defaults
  }

  return { ...DEFAULT_STATE };
}

export async function saveState(window: BrowserWindow): Promise<void> {
  try {
    const bounds = window.getBounds();
    const maximized = window.isMaximized();

    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized,
    };

    const stateFile: WindowStateFile = {
      state,
      hash: computeHash(state),
    };

    const statePath = getStatePath();
    await fs.writeFile(statePath, JSON.stringify(stateFile, null, 2), 'utf-8');
  } catch {
    // Silently ignore write errors (disk full, permissions, etc.)
  }
}

export async function registerFileAssociation(): Promise<void> {
  try {
    const winreg = await import('winreg');
    const Winreg = winreg.default;
    const { HKCU, REG_SZ } = winreg;

    const PdfClassKey = new Winreg({
      hive: HKCU,
      key: '\\Software\\Classes\\.pdf',
    });

    const existing = await new Promise<string>((resolve, reject) => {
      PdfClassKey.get('(Default)', (err, result) => {
        if (err) reject(err);
        else resolve((result?.value as string) || '');
      });
    }).catch(() => '');

    if (existing === 'PDFEditor') {
      return;
    }

    await registrySet(PdfClassKey, '(Default)', 'PDFEditor', REG_SZ);
    await registrySet(PdfClassKey, 'Content Type', 'application/pdf', REG_SZ);

    const handlerKey = new Winreg({
      hive: HKCU,
      key: '\\Software\\Classes\\PDFEditor',
    });
    await registrySet(handlerKey, '(Default)', 'PDF Editor Document', REG_SZ);

    const commandKey = new Winreg({
      hive: HKCU,
      key: '\\Software\\Classes\\PDFEditor\\shell\\open\\command',
    });

    const executablePath = process.execPath;
    await registrySet(commandKey, '(Default)', `"${executablePath}" "%1"`, REG_SZ);

  } catch {
    // File association registration failure is non-blocking
  }
}

function registrySet(key: { set: (n: string, t: string, v: string, cb: (e: Error | null) => void) => void }, name: string, value: string, type: string): Promise<void> {
  return new Promise((resolve, reject) => {
    key.set(name, type, value, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
