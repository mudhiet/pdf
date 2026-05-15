import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    const validChannels = [
      'doc:open',
      'doc:save',
      'doc:saveAs',
      'doc:close',
      'dialog:openFile',
      'dialog:saveFile',
      'win:state:save',
      'win:state:restore',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },
  handle: (channel: string, listener: (...args: unknown[]) => void): void => {
    const validChannels = [
      'doc:open:response',
      'doc:save:response',
      'doc:saveAs:response',
      'doc:close:response',
      'win:state:restore:response',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, listener);
    }
  },
  send: (channel: string, ...args: unknown[]): void => {
    const validChannels = [
      'app:error',
      'app:ready',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel: string, listener: (...args: unknown[]) => void): void => {
    const validChannels = [
      'app:error',
      'app:ready',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, listener);
    }
  },
});
