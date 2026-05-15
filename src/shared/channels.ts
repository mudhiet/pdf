// IPC Channel definitions shared between main and renderer processes.
// All channel names follow dot-notation convention: <domain>:<action>

// Document lifecycle channels (invoke/handle request-response)
export const DOC_OPEN = 'doc:open';
export const DOC_SAVE = 'doc:save';
export const DOC_SAVE_AS = 'doc:saveAs';
export const DOC_CLOSE = 'doc:close';

// File dialog channels (invoke, no response channel needed)
export const DIALOG_OPEN_FILE = 'dialog:openFile';
export const DIALOG_SAVE_FILE = 'dialog:saveFile';

// Window state channels (invoke/handle request-response)
export const WIN_STATE_SAVE = 'win:state:save';
export const WIN_STATE_RESTORE = 'win:state:restore';

// Event broadcast channels (send/on, fire-and-forget)
export const APP_ERROR = 'app:error';
export const APP_READY = 'app:ready';

// Union type of all channel names for type safety
export type ChannelNames =
  | typeof DOC_OPEN
  | typeof DOC_SAVE
  | typeof DOC_SAVE_AS
  | typeof DOC_CLOSE
  | typeof DIALOG_OPEN_FILE
  | typeof DIALOG_SAVE_FILE
  | typeof WIN_STATE_SAVE
  | typeof WIN_STATE_RESTORE
  | typeof APP_ERROR
  | typeof APP_READY;
