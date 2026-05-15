# Architecture Patterns - PDF Editor

**Project:** PDF Editor (Windows desktop, Electron + JavaScript)
**Researched:** 2026-05-15
**Confidence:** HIGH (verified via Context7 docs for PDF.js, pdf-lib, and Electron)

---

## Recommended Architecture

`
+-------------------------------------------------------------------------+
|                        Electron App (Single Process)                     |
|                                                                          |
|  +-------------------------------------------------------------------+  |
|  |                    Main Process (Node.js)                         |  |
|  |                                                                   |  |
|  |  +--------------+  +--------------+  +------------------------+   |  |
|  |  | Document     |  | Page         |  | Signature              |   |  |
|  |  | Manager      |  | Manager      |  | Engine                 |   |  |
|  |  |              |  |              |  |                        |   |  |
|  |  | - Load PDF   |  | - Insert     |  | - Load PFX cert        |   |  |
|  |  | - Save PDF   |  | - Delete     |  | - RSA signing          |   |  |
|  |  | - Undo/Redo  |  | - Rotate     |  | - Widget creation      |   |  |
|  |  | - Command    |  | - Reorder    |  | - Flatten signature    |   |  |
|  |  |   stack      |  | - Merge      |  |                        |   |  |
|  |  |              |  | - Split      |  |                        |   |  |
|  |  +------+-------+  +------+-------+  +-----------+------------+   |  |
|  |         |                  |                      |               |  |
|  |  +------+------------------+----------------------+---------------+   |  |
|  |  |                    pdf-lib (PDF manipulation)                     |  |
|  |  |  PDFDocument, PDFForm, PDFPage operations                         |  |
|  |  +------------------------------------------------------------------+   |  |
|  |                                                                   |  |
|  |  +------------------------------------------------------------------+   |  |
|  |  |                    File I/O Layer                                 |  |
|  |  |  - fs.promises (read/write PDF bytes)                            |  |
|  |  |  - dialog.showOpenDialog / showSaveDialog                        |  |
|  |  |  - drag-and-drop file handler                                    |  |
|  |  +------------------------------------------------------------------+   |  |
|  |                                                                   |  |
|  |  +------------------------------------------------------------------+   |  |
|  |  |                    IPC Handlers                                   |  |
|  |  |  - ipcMain.handle() for all renderer->main requests              |  |
|  |  |  - ipcMain.send() for main->renderer notifications               |  |
|  |  +------------------------------------------------------------------+   |  |
|  +--------------------+--------------------------------------------------+  |
|                       |  IPC (invoke/handle, send/on)                     |
|  +--------------------v--------------------------------------------------+  |
|  |                  Renderer Process (Chromium)                           |  |
|  |                                                                        |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  |                    UI Layer                                       |  |  |
|  |  |                                                                   |  |  |
|  |  |  +----------+ +----------+ +----------+ +------------------+     |  |  |
|  |  |  | Menu Bar | | Toolbar  | | Sidebar  | | Page View        |     |  |  |
|  |  |  | (HTML)   | | (HTML)   | |          | |   (Canvas)       |     |  |  |
|  |  |  |          | |          | | Thumbnails| |                  |     |  |  |
|  |  |  | File     | | Open     | |          | | Canvas           |     |  |  |
|  |  |  | Edit     | | Save     | | Bookmarks| | Text Layer       |     |  |  |
|  |  |  | View     | | Print    | | Page List| |                  |     |  |  |
|  |  |  | Form     | | Zoom     | |          | | Form Controls    |     |  |  |
|  |  |  | Sign     | | Rotate   | |          | | (inputs)         |     |  |  |
|  |  |  | Help     | | Search   | |          | | Signature canvas |     |  |  |
|  |  |  +----------+ +----------+ +----------+ +------------------+     |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |                                                                        |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  |                    PDF.js (Rendering)                             |  |  |
|  |  |  - Display layer: page rendering, text extraction                 |  |  |
|  |  |  - Web Worker: core PDF parsing (off main thread)                 |  |  |
|  |  |  - TextLayer: selectable text overlay                             |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  |                                                                        |  |
|  |  +------------------------------------------------------------------+  |  |
|  |  |                    UI Logic Layer                                 |  |  |
|  |  |  - State management (current page, zoom, selection)               |  |  |
|  |  |  - Form field state (collected values)                            |  |  |
|  |  |  - Signature capture (signature_pad integration)                  |  |  |
|  |  |  - Search state (highlight matches across pages)                  |  |  |
|  |  +------------------------------------------------------------------+  |  |
|  +------------------------------------------------------------------------+  |
|                                                                          |
+--------------------------------------------------------------------------+
`

---

## Component Boundaries

### 1. UI Shell (Renderer Process)

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Menu Bar** | File/Edit/View/Form/Sign/Help menus | Electron Menu API, Renderer IPC |
| **Toolbar** | Action buttons (open, save, print, zoom, rotate, delete page) | Renderer IPC, UI State |
| **Sidebar** | Page thumbnails, bookmarks tree, page list | Renderer IPC (thumbnail rendering), PDF.js |
| **Page View** | Main PDF display area, canvas rendering | PDF.js (Display layer), TextLayer |
| **Form Controls** | Interactive form field inputs (text, checkbox, dropdown) | Renderer IPC (send values to main), UI State |
| **Signature Canvas** | Hand-drawn signature capture area | signature_pad library, Renderer IPC |
| **Search Bar** | Text search input + result navigation | PDF.js (text extraction), UI State |

### 2. PDF Processing Layer (Main Process)

| Component | Responsibility | Communicates With | Library |
|-----------|---------------|-------------------|---------|
| **Document Manager** | PDF lifecycle: open, save, save-as, undo/redo, dirty tracking | File I/O, Page Manager, Form Engine, Signature Engine | pdf-lib |
| **Page Manager** | Page-level operations: insert, delete, rotate, reorder, merge, split | Document Manager | pdf-lib |
| **Form Engine** | Read form fields, fill field values, flatten forms | Document Manager | pdf-lib |
| **Signature Engine** | Create signature widgets, cryptographic signing, certificate loading | Document Manager | pdf-lib, signpdf, node-forge |

### 3. Rendering Layer (Renderer Process)

| Component | Responsibility | Communicates With | Library |
|-----------|---------------|-------------------|---------|
| **PDF.js Display** | Page rendering to canvas, viewport management | Page View, UI Shell | pdfjs-dist |
| **PDF.js Worker** | Core PDF parsing (off main thread) | PDF.js Display | pdfjs-dist |
| **TextLayer** | Selectable text overlay on rendered pages | Page View | pdfjs-dist |
| **Text Extraction** | Extract text content per page for search | Search Bar, PDF.js Display | pdfjs-dist |

### 4. File I/O Layer (Main Process)

| Component | Responsibility | Communicates With | API |
|-----------|---------------|-------------------|-----|
| **File Open** | Dialog selection, drag-and-drop, file reading | Document Manager | Electron dialog + fs |
| **File Save** | Save, save-as, dirty flag persistence | Document Manager | Electron dialog + fs |
| **File Print** | Print current page or all pages | Electron | webContents.print() |

### 5. IPC Bridge (Both Processes)

| Direction | Channel Pattern | Purpose |
|-----------|----------------|---------|
| Renderer to Main | ipcRenderer.invoke() / ipcMain.handle() | Request-response for PDF operations |
| Renderer to Main | ipcRenderer.send() / ipcMain.on() | One-way notifications |
| Main to Renderer | BrowserWindow.webContents.send() | Progress updates, errors, document loaded |

---

## Data Flow

### Open PDF Document

`
Renderer                              Main Process
  |                                       |
  |  ipcRenderer.invoke('open-file', opts) |
  |--------------------------------------->|
  |                                       |  dialog.showOpenDialog()
  |                                       |  fs.readFile(filePath)
  |                                       |  pdf-lib: PDFDocument.load(bytes)
  |  { bytes: ArrayBuffer, metadata }      |
  |<---------------------------------------|
  |                                       |
  |  PDF.js: getDocument(bytes)            |
  |  PDF.js Worker: parse PDF structure    |
  |  Render first page to canvas           |
  |  Extract text for search index         |
  |  Extract bookmarks for sidebar         |
  |  Render page thumbnails               |
  |                                       |
  |  webContents.send('document-loaded', info)
  |<---------------------------------------|
`

### Fill Form Fields

`
Renderer                              Main Process
  |                                       |
  |  ipcRenderer.invoke('get-form-fields')  |
  |--------------------------------------->|
  |                                       |  pdf-lib: PDFDocument.load()
  |                                       |  pdf-lib: getForm().getFields()
  |  { fields: [{ name, type, value }] }   |
  |<---------------------------------------|
  |                                       |
  |  [User fills form in UI]               |
  |                                       |
  |  ipcRenderer.invoke('fill-form', data)  |
  |--------------------------------------->|
  |                                       |  pdf-lib: PDFDocument.load()
  |                                       |  pdf-lib: getForm().setText/check/select()
  |  { success: true, bytes: ArrayBuffer }  |
  |<---------------------------------------|
  |                                       |
  |  PDF.js: re-render with filled values  |
  |  [User sees filled form]               |
`

### Page Manipulation (e.g., Delete Page)

`
Renderer                              Main Process
  |                                       |
  |  ipcRenderer.invoke('delete-page', n)  |
  |--------------------------------------->|
  |                                       |  pdf-lib: PDFDocument.load()
  |                                       |  pdf-lib: removePage(n)
  |  { bytes: ArrayBuffer }               |
  |<---------------------------------------|
  |                                       |
  |  PDF.js: re-render document            |
  |  Update sidebar thumbnails             |
  |  Update page count                     |
`

### Digital Signature

`
Renderer                              Main Process
  |                                       |
  |  [User draws signature on canvas]      |
  |  signature_pad.toDataURL()             |
  |                                       |
  |  ipcRenderer.invoke('load-certificate', path)
  |--------------------------------------->|
  |                                       |  fs.readFileSync(pfxPath)
  |                                       |  node-forge: pki.pfxFromPkcs12()
  |  { certInfo: { issuer, subject, valid } }
  |<---------------------------------------|
  |                                       |
  |  [User confirms signing]               |
  |                                       |
  |  ipcRenderer.invoke('apply-signature', { imageData, certPath })
  |--------------------------------------->|
  |                                       |  pdf-lib: PDFDocument.load()
  |                                       |  pdf-lib: create signature widget
  |                                       |  pdf-lib: embed signature image
  |                                       |  node-forge: RSA sign with cert
  |                                       |  signpdf: bridge crypto to pdf-lib
  |  { bytes: ArrayBuffer }               |
  |<---------------------------------------|
  |                                       |
  |  PDF.js: re-render with signature      |
`

### Save Document

`
Renderer                              Main Process
  |                                       |
  |  ipcRenderer.invoke('save-document')   |
  |--------------------------------------->|
  |                                       |  pdf-lib: document.save()
  |                                       |  fs.writeFile(filePath, bytes)
  |  { success: true }                    |
  |<---------------------------------------|
  |                                       |
  |  Clear dirty flag                      |
`

---

## IPC Channel Registry

All IPC channels are registered in the preload script and handled in the main process.

### Renderer to Main (invoke/handle)

| Channel | Renderer Args | Main Returns | Purpose |
|---------|--------------|--------------|---------|
| open-file | { filters?: FileFilter[] } | { bytes: ArrayBuffer, metadata: PDFMeta } | Open dialog + load PDF |
| save-file | { bytes: ArrayBuffer } | { path: string } | Save dialog + write |
| save-file-as | { bytes: ArrayBuffer } | { path: string } | Save As dialog + write |
| get-form-fields | (none) | { fields: FormField[] } | Extract form field metadata |
| ill-form | { values: Record<string, any> } | { bytes: ArrayBuffer } | Fill fields + return modified PDF |
| latten-form | (none) | { bytes: ArrayBuffer } | Flatten form + return modified PDF |
| delete-page | { pageIndex: number } | { bytes: ArrayBuffer } | Delete page + return modified PDF |
| insert-page | { pageIndex: number, fromFile?: string } | { bytes: ArrayBuffer } | Insert page + return modified PDF |
| otate-page | { pageIndex: number, degrees: number } | { bytes: ArrayBuffer } | Rotate page + return modified PDF |
| eorder-pages | { order: number[] } | { bytes: ArrayBuffer } | Reorder pages + return modified PDF |
| merge-pdf | { paths: string[] } | { bytes: ArrayBuffer } | Merge PDFs + return merged PDF |
| split-pdf | { paths: string[], pages: number[] } | { bytes: ArrayBuffer } | Extract pages to new PDF |
| load-certificate | { path: string } | { certInfo: CertInfo } | Load PFX certificate |
| pply-signature | { imageData: string, certPath: string, pageIndex: number } | { bytes: ArrayBuffer } | Apply digital signature |
| get-page-thumbnails | { pageIndices: number[] } | { thumbnails: string[] } | Render pages to thumbnail images |
| get-page-text | { pageIndex: number } | { text: string } | Extract text from page |
| search-text | { query: string } | { matches: MatchInfo[] } | Search across all pages |

### Renderer to Main (send/on, one-way)

| Channel | Purpose |
|---------|---------|
| document-dirty | Notify main that document has unsaved changes |
| page-changed | Notify main when user navigates to different page |
| zoom-changed | Notify main of zoom level change |

### Main to Renderer (send)

| Channel | Payload | Purpose |
|---------|---------|---------|
| document-loaded | { pageCount, title, metadata } | Notify UI that document is ready |
| operation-complete | { operation, success, message } | Notify UI of operation result |
| operation-progress | { operation, progress } | Notify UI of long operation progress |
| error | { operation, message } | Notify UI of error |

---

## State Management

### Renderer-Side State

`	ypescript
interface AppState {
  // Document state
  document: PDFDocumentProxy | null;       // PDF.js document proxy
  currentPage: number;                     // 1-indexed current page
  totalPages: number;
  zoom: number;                            // Scale factor (0.5 - 5.0)
  isDirty: boolean;                        // Unsaved changes flag

  // Form state
  formFields: FormField[];                 // Extracted form field metadata
  formValues: Record<string, any>;         // User-entered form values

  // View state
  viewMode: 'single' | 'continuous';       // Single page or continuous scroll
  rotation: number;                        // Overall document rotation
  sidebarOpen: boolean;                    // Sidebar visibility

  // Search state
  searchText: string;
  searchMatches: MatchInfo[];              // { page, x, y, width, height, text }
  searchHighlightPage: number;

  // Signature state
  signatureImageData: string | null;       // Base64 image of drawn signature
  certificateInfo: CertInfo | null;        // Loaded certificate info
}
`

### Main-Side State

`	ypescript
interface MainState {
  // Current document
  pdfDoc: PDFDocument | null;              // pdf-lib document (for manipulation)
  pdfBytes: Uint8Array | null;             // Raw bytes (source of truth)
  filePath: string | null;                 // Current file path (null = new/untitled)
  isDirty: boolean;

  // Undo/redo stack
  commandStack: Command[];                 // Stack of past commands
  redoStack: Command[];                    // Stack of undone commands

  // Certificate cache
  loadedCertificate: p12.P12 | null;       // node-forge P12 object
}
`

---

## Command Pattern (Undo/Redo)

All PDF manipulation operations are wrapped in a Command pattern for undo/redo support.

`	ypescript
interface Command {
  name: string;                    // Human-readable name ("Delete Page 3")
  execute: () => Promise<Uint8Array>;  // Returns modified bytes
  undo: (previousBytes: Uint8Array) => Promise<Uint8Array>;
  bytesBefore: Uint8Array;         // Snapshot of bytes before operation
  bytesAfter: Uint8Array;          // Snapshot of bytes after operation
}
`

**Implementation:**
- On each operation: push current bytes to commandStack, execute operation, push result
- On undo: pop from commandStack, restore ytesBefore, push to edoStack
- On redo: pop from edoStack, restore ytesAfter, push to commandStack
- On new operation after undo: clear edoStack (standard undo behavior)

---

## Build Order (Component Dependencies)

`
Phase 1: Foundation + Viewer
+-- Electron Shell (main.js, preload.js, index.html)
+-- IPC Bridge (channel registration)
+-- File I/O (open dialog, save dialog, drag-and-drop)
+-- PDF.js Rendering (page display, text layer, zoom)
+-- Page Navigation (next/prev, jump to page)
+-- Sidebar (page thumbnails, bookmarks)
+-- Text Search (extract text, highlight matches)
+-- Print (webContents.print)

Phase 2: Form Filling
+-- Form Field Extraction (pdf-lib getForm)
+-- Form UI Controls (render fields in sidebar or overlay)
+-- Form Filling (pdf-lib set values)
+-- Form Flattening (pdf-lib flatten)

Phase 3: Page Manipulation + Signatures
+-- Undo/Redo (Command pattern)
+-- Page Operations (insert, delete, rotate, reorder)
+-- Merge/Split PDFs
+-- Signature UI (signature_pad canvas)
+-- Certificate Loading (node-forge PFX)
+-- Digital Signature (signpdf + pdf-lib)
+-- Save/Save-As (persist modifications)

Phase 4: Text Editing + Polish
+-- Text Overlay Editing (drawText on top of existing)
+-- Performance Optimization (lazy thumbnail generation, page caching)
+-- Keyboard Shortcuts
+-- Window Management (minimize, restore, fullscreen)
`

**Dependency chain:** Each phase depends on all previous phases. Phase 1 establishes the viewer foundation that all subsequent phases build upon. Phase 4 is deferred because text editing (overlay or true stream modification) is the most complex feature and the project scope prioritizes form filling and page manipulation first.

---

## Process Separation Rationale

### Why PDF.js in Renderer, pdf-lib in Main?

| Concern | PDF.js (Renderer) | pdf-lib (Main) |
|---------|-------------------|----------------|
| **Canvas access** | Native <canvas> in Chromium | No canvas needed |
| **Node.js fs** | Not available | Available (read/write PDF bytes) |
| **Memory** | Page-by-page rendering (low memory) | Full document in memory (acceptable for personal use) |
| **Worker support** | PDF.js Web Worker runs in renderer | Not needed (pdf-lib is pure JS, fast enough) |
| **Large file handling** | PDF.js streams pages efficiently | pdf-lib loads entire document; acceptable for typical use |

**Key trade-off:** pdf-lib loads the entire document into memory in the main process. For personal use with typical documents (under 50MB), this is acceptable. If documents exceed available memory, the UI will show a warning and refuse to load.

### Why Single Electron Process?

The app uses a single BrowserWindow (one renderer process). This simplifies:
- State management (no cross-window IPC)
- Document lifecycle (one document open at a time, or multiple tabs in one window)
- IPC design (fewer channels, simpler routing)

Multiple document tabs could be added later using Electron's <webview> or multiple BrowserWindows, but this adds significant complexity and is not needed for personal use.

---

## File Structure

`
pdf/
+-- package.json
+-- electron-forge.config.js
+-- src/
|   +-- main/
|   |   +-- index.js              # Main process entry (app lifecycle, window creation)
|   |   +-- ipc-channels.js       # All ipcMain.handle() registrations
|   |   +-- document-manager.js   # PDF lifecycle: open, save, undo/redo
|   |   +-- page-manager.js       # Page operations: insert, delete, rotate, reorder
|   |   +-- form-engine.js        # Form field operations: read, fill, flatten
|   |   +-- signature-engine.js   # Digital signature: cert load, sign, embed
|   |   +-- file-io.js            # File open, save, drag-and-drop handlers
|   +-- preload/
|   |   +-- index.js              # Preload script (contextBridge + contextIsolation)
|   +-- renderer/
|   |   +-- index.html            # Main window HTML
|   |   +-- style.css             # Global styles
|   |   +-- app.js                # Renderer entry (state, IPC invoke wrappers)
|   |   +-- components/
|   |   |   +-- menu-bar.js       # Menu bar logic
|   |   |   +-- toolbar.js        # Toolbar button handlers
|   |   |   +-- sidebar.js        # Sidebar (thumbnails, bookmarks, page list)
|   |   |   +-- page-view.js      # Canvas rendering, zoom, navigation
|   |   |   +-- text-layer.js     # PDF.js TextLayer integration
|   |   |   +-- form-controls.js  # Form field rendering and input
|   |   |   +-- signature-canvas.js # signature_pad integration
|   |   |   +-- search-bar.js     # Text search UI
|   |   |   +-- status-bar.js     # Page counter, zoom level, dirty flag
|   |   +-- utils/
|   |       +-- pdf-renderer.js   # PDF.js Display layer wrapper
|   |       +-- text-extractor.js # PDF.js text extraction
|   |       +-- thumbnail-gen.js  # Page thumbnail generation
|   +-- shared/
|       +-- commands.js           # Command pattern for undo/redo
|       +-- constants.js          # Shared constants (zoom levels, etc.)
+-- assets/
|   +-- icons/                    # App icons
+-- dist/                         # Build output (generated by electron-forge)
`

---

## Security Architecture

| Concern | Approach |
|---------|----------|
| **contextIsolation** | Enabled in preload; renderer has no direct Node.js access |
| **contextBridge** | Only specific IPC invoke channels exposed to renderer |
| **file access** | Files only opened via dialog or drag-and-drop (user-initiated) |
| **network** | No network calls for document processing; auto-update is the only network activity |
| **certificate loading** | PFX files loaded via dialog; contents used only for signing, never transmitted |
| **sandbox** | Electron's built-in sandbox enabled for renderer process |

---

## Performance Considerations

| Concern | Approach |
|---------|----------|
| **PDF.js worker** | Lazy-loaded after app startup; loaded when first PDF is opened |
| **Page thumbnails** | Generated lazily (on sidebar open or scroll-into-view), not all at once |
| **Text extraction** | Extracted per-page on demand, not for entire document upfront |
| **Large documents** | PDF.js renders pages on-demand (not all at once); pdf-lib handles entire doc in memory |
| **Save operations** | pdf-lib.save() is synchronous in memory; fs.writeFile() is async in main process |
| **UI responsiveness** | All PDF operations run in main process (not renderer); renderer only handles display |

---

## Sources

- [PDF.js Architecture (Context7)](https://context7.com/mozilla/pdf.js) -- Core/Display/Viewer layer architecture, worker communication, text extraction APIs
- [pdf-lib API Documentation (Context7)](https://context7.com/hopding/pdf-lib) -- Form field operations, page manipulation, page copying between documents
- [Electron IPC Documentation (Context7)](https://context7.com/electron/electron) -- invoke/handle pattern, send/on pattern, preload script security
- [PDF.js GitHub AGENTS.md](https://github.com/mozilla/pdf.js/blob/master/AGENTS.md) -- Worker architecture details
- [pdf-lib GitHub README](https://github.com/Hopding/pdf-lib) -- Page manipulation examples, form operations
- [STACK.md](./STACK.md) -- Technology stack decisions that inform component library choices
- [FEATURES.md](./FEATURES.md) -- Feature dependencies that inform build order
