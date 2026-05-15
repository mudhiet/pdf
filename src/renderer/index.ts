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
