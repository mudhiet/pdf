import type { ChannelNames } from '../shared/channels.js';

// Typed IPC helper for invoke calls with generic return type
export function invoke<T>(channel: ChannelNames, ...args: unknown[]): Promise<T> {
  return window.electron.invoke(channel, ...args) as Promise<T>;
}

// Typed IPC helper for event listeners with generic data type
export function on<T>(channel: ChannelNames, listener: (data: T) => void): void {
  window.electron.on(channel, (_event: unknown, ...args: unknown[]) => {
    listener(args[0] as T);
  });
}

// Listen for app ready event from main process
on<string>('app:ready', (message: string) => {
  console.log('App is ready:', message);
});

// Prevent default browser behavior for drag events
document.body.addEventListener('dragover', (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
});

document.body.addEventListener('dragenter', (event: DragEvent) => {
  event.preventDefault();
});

document.body.addEventListener('drop', async (event: DragEvent) => {
  event.preventDefault();

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    return;
  }

  for (const file of Array.from(files)) {
    // Only process PDF files
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      continue;
    }

    const filePath = (file as unknown as { path?: string }).path;
    if (!filePath) {
      continue;
    }

    try {
      await invoke<unknown>('doc:open', filePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open file';
      console.error('Error opening dropped file:', message);
    }
  }
});
