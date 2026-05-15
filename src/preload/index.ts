import { contextBridge, ipcRenderer } from 'electron';
import { ChannelNames } from '../shared/channels.js';

// Invoke channels: renderer sends request, main responds
const INVOKE_CHANNELS: ChannelNames[] = [
  'doc:open',
  'doc:save',
  'doc:saveAs',
  'doc:close',
  'dialog:openFile',
  'dialog:saveFile',
  'win:state:save',
  'win:state:restore',
];

// Response channels: main sends responses to renderer invoke calls
// These are handled automatically by ipcRenderer.invoke() — no separate registration needed.

// Send/On channels: fire-and-forget events from main to renderer
const EVENT_CHANNELS: ChannelNames[] = [
  'app:error',
  'app:ready',
];

// Expose protected methods that allow the renderer process to use
// the IPC without exposing the entire ipcRenderer object.
// Raw ipcRenderer is NOT exposed — all communication goes through these wrappers.
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: ChannelNames, ...args: unknown[]): Promise<unknown> => {
    if (!INVOKE_CHANNELS.includes(channel)) {
      throw new Error(`Invalid invoke channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  on: (channel: ChannelNames, listener: (...args: unknown[]) => void): void => {
    if (!EVENT_CHANNELS.includes(channel)) {
      throw new Error(`Invalid on channel: ${channel}`);
    }
    ipcRenderer.on(channel, listener);
  },
});
