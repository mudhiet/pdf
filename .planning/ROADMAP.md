# Roadmap: PDF Editor

## Overview

Build a free, desktop PDF viewer and editor for Windows using Electron and JavaScript. The journey starts with a working PDF viewer foundation (rendering, navigation, search, print, multi-tab), then adds interactive form filling, page manipulation (insert, delete, rotate, reorder, split, merge), cryptographically valid digital signatures, and finally text editing via the overlay approach. Each phase delivers a coherent, verifiable capability that builds on everything before it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Document Lifecycle** - Electron shell, IPC bridge, file I/O, save/restore, Windows file associations
- [ ] **Phase 2: Core Viewer** - PDF.js rendering, zoom/pan, page navigation, thumbnail sidebar
- [ ] **Phase 3: Search, Print & Keyboard** - Text search with CMap, print via Electron, keyboard shortcuts
- [ ] **Phase 4: Multi-tab Interface** - Tab bar, multiple document management, tab switching
- [ ] **Phase 5: Form Filling** - AcroForm field extraction, fill all field types, save filled forms
- [ ] **Phase 6: Page Manipulation** - Insert, delete, rotate, reorder, split, merge pages with undo/redo
- [ ] **Phase 7: Digital Signatures** - Visual signature capture, cryptographic signing with PFX certificates
- [ ] **Phase 8: Text Editing** - Text selection, overlay approach (cross-out old text, draw new)

## Phase Details

### Phase 1: Foundation & Document Lifecycle
**Goal**: Users can open, save, and manage PDF documents with the application integrated into Windows
**Depends on**: Nothing (first phase)
**Requirements**: GEN-01, GEN-03
**Success Criteria** (what must be TRUE):
  1. User can open a PDF file via File → Open dialog, drag-and-drop, or double-click from Windows Explorer
  2. User can save a PDF (Save) and save a copy (Save As) to a chosen location on disk
  3. Double-clicking a PDF file in Windows Explorer opens it in the application
**Plans**: 3 plans

Plans:
- [ ] 01-01: Electron shell setup — scaffold project with Electron Forge, Squirrel.Windows packaging, preload script with contextIsolation, main/renderer process structure
- [ ] 01-02: IPC bridge — establish invoke/handle and send/on channels between main and renderer processes; define channel contract for document lifecycle operations
- [ ] 01-03: File I/O layer — implement file dialog (open/save/saveAs), drag-and-drop handling, Windows file association registration, document open/save flow with raw byte management in main process

### Phase 2: Core Viewer
**Goal**: Users can open and view PDF documents with smooth rendering, zoom, and page navigation
**Depends on**: Phase 1
**Requirements**: VIEW-01, VIEW-02
**Success Criteria** (what must be TRUE):
  1. User can open a PDF and see all pages rendered with correct layout and text
  2. User can zoom in/out and pan around pages with smooth scrolling
  3. User can navigate to any page by entering a page number or using scroll/arrow controls
  4. User can switch between pages quickly using a thumbnail sidebar
**UI hint**: yes
**Plans**: 4 plans

Plans:
- [ ] 02-01: PDF.js renderer setup — integrate pdfjs-dist in renderer process, configure @napi-rs/canvas for HiDPI outputScale, set up web worker for PDF parsing, handle EncryptedPDFError gracefully
- [ ] 02-02: Page rendering pipeline — render pages to canvas with correct viewport, implement continuous/single-page scroll modes, handle page loading states and error recovery
- [ ] 02-03: Zoom and pan controls — implement zoom in/out buttons, mouse wheel zoom, fit-to-page/fit-width/fit-height, smooth pan with mouse drag
- [ ] 02-04: Navigation sidebar — build thumbnail sidebar with lazy-loaded page images, page number input, scroll-to-page, and document outline/bookmarks panel

### Phase 3: Search, Print & Keyboard
**Goal**: Users can find content, print documents, and use keyboard shortcuts for efficient navigation
**Depends on**: Phase 2
**Requirements**: VIEW-03, VIEW-04, VIEW-05
**Success Criteria** (what must be TRUE):
  1. User can search for text within the document and see highlighted matches on each page
  2. User can navigate between search results (next/previous) and see match count
  3. User can print the current PDF or selected pages via the print dialog
  4. User can use keyboard shortcuts (Ctrl+O, Ctrl+S, Ctrl+F, arrow keys, page up/down) for common actions
**UI hint**: yes
**Plans**: 3 plans

Plans:
- [ ] 03-01: Text search with CMap — integrate PDF.js text extraction per page, build search index for visible pages, render text layer overlay with highlight matching, ship and configure CMap files for non-Latin text support
- [ ] 03-02: Print support — implement Electron webContents.print() for current document, support print range selection (all pages or custom range), handle print dialog and paper size selection
- [ ] 03-03: Keyboard shortcuts — define shortcut map (Ctrl+O open, Ctrl+S save, Ctrl+F search, Ctrl+= zoom in, Ctrl+- zoom out, arrow keys navigate pages, Page Up/Down scroll), wire shortcuts to viewer actions, display shortcut hints in UI

### Phase 4: Multi-tab Interface
**Goal**: Users can work with multiple PDF documents simultaneously in separate tabs
**Depends on**: Phase 2
**Requirements**: VIEW-06
**Success Criteria** (what must be TRUE):
  1. User can open multiple PDFs and see each in its own tab
  2. User can switch between tabs by clicking on them
  3. User can close individual tabs; closing the last tab leaves the app with a blank canvas
  4. Opening a new PDF while others are open creates a new tab automatically
**UI hint**: yes
**Plans**: 3 plans

Plans:
- [ ] 04-01: Tab bar component — build tab bar UI with document title, close button per tab, active tab highlight, new tab behavior, drag-to-reorder support
- [ ] 04-02: Multi-document state management — implement TabManager in main process to track open documents, coordinate tab lifecycle (open/close/switch), maintain separate document state per tab
- [ ] 04-03: Tab-content isolation — ensure each tab renders its own PDF document independently, handle document switching without state leakage, manage memory for inactive tabs (unload off-screen pages)

### Phase 5: Form Filling
**Goal**: Users can fill interactive PDF forms and save their filled content
**Depends on**: Phase 2
**Requirements**: FORM-01, FORM-02
**Success Criteria** (what must be TRUE):
  1. User can open a PDF with interactive form fields and see them highlighted or visually distinct
  2. User can click on text fields to type, check checkboxes, select radio buttons, and choose from dropdowns
  3. User can save a filled form back to disk, preserving all entered values
**UI hint**: yes
**Plans**: 3 plans

Plans:
- [ ] 05-01: Form field extraction — integrate pdf-lib getForm() in main process, extract all AcroForm field types (text, checkbox, radio, dropdown, option list), map fields to renderer via IPC with field metadata (type, value, position, appearance)
- [ ] 05-02: Form fill UI — render form fields as interactive HTML overlays on top of PDF canvas, implement field-specific input controls (text input, checkbox toggle, radio group, dropdown), handle field focus and tab navigation, register @pdf-lib/fontkit for Unicode font embedding
- [ ] 05-03: Save filled forms — implement pdf-lib form field value setting (setText, check, select), call updateFieldAppearances() for proper rendering, save modified document via existing save flow, handle XFA form detection with user warning

### Phase 6: Page Manipulation
**Goal**: Users can rearrange, insert, delete, and split PDF pages with full undo/redo support
**Depends on**: Phase 2
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06
**Success Criteria** (what must be TRUE):
  1. User can insert pages from another PDF at a specific position
  2. User can delete pages from the current document
  3. User can rotate individual pages (90° increments)
  4. User can reorder pages via drag-and-drop in the thumbnail sidebar
  5. User can split a PDF into separate files by page range
  6. User can undo and redo any page manipulation operation
**UI hint**: yes
**Plans**: 4 plans

Plans:
- [ ] 06-01: Undo/redo infrastructure — implement Command pattern with operation stack in main process, support undo/redo for all page operations, cap stack size to prevent memory growth, compress snapshots for large documents
- [ ] 06-02: Core page operations — implement page insert (copyPages from source PDF at position), page delete (removePage), page rotate (rotate with 90/180/270 options), offload to Node.js worker threads to prevent main process freeze
- [ ] 06-03: Page reorder via drag-and-drop — extend thumbnail sidebar with drag-and-drop reordering, implement reorder command that updates page sequence, sync visual reorder with document state
- [ ] 06-04: Split and merge — implement split (copyPages to new PDFDocument for selected page range, saveAs), implement merge (copyPages from multiple source PDFs into single document), both with file dialog for output location

### Phase 7: Digital Signatures
**Goal**: Users can add visual and cryptographically valid digital signatures to PDFs
**Depends on**: Phase 2
**Requirements**: SIGN-01, SIGN-02
**Success Criteria** (what must be TRUE):
  1. User can draw a hand-written signature on a canvas and place it on a form field or page location
  2. User can load a PFX certificate, apply a cryptographic signature to the document, and verify it
  3. User is warned before overwriting a signed PDF (pdf-lib invalidates existing signatures on save)
**UI hint**: yes
**Plans**: 3 plans

Plans:
- [ ] 07-01: Visual signature capture — integrate signature_pad for hand-drawn signature input on canvas, export as PNG, implement signature placement UI (click to place on form field or page), render signature image overlay on PDF page via pdf-lib drawImage
- [ ] 07-02: Cryptographic signing — implement PFX certificate loading via node-forge, bridge to pdf-lib signature field API via signpdf, create signature widget annotation, apply RSA cryptographic signature, validate signature after creation with test PFX certificate
- [ ] 07-03: Signature warning and persistence — detect existing signatures before save, show warning dialog explaining that saving will invalidate signatures and offer Save As, pin exact versions of pdf-lib + signpdf + node-forge and test integration

### Phase 8: Text Editing
**Goal**: Users can edit text in existing PDFs using the overlay approach
**Depends on**: Phase 2
**Requirements**: TEXT-01
**Success Criteria** (what must be TRUE):
  1. User can select text on a page (via text layer from PDF.js) and see a selection highlight
  2. User can type replacement text and see it rendered over the selected area with the old text crossed out
**UI hint**: yes
**Plans**: 2 plans

Plans:
- [ ] 08-01: Text selection UI — extract text content per page via PDF.js text layer, implement click-and-drag text selection on the text layer overlay, calculate selection bounding box in PDF coordinates, render selection highlight
- [ ] 08-02: Overlay text edit — implement overlay rendering: draw white rectangle to cover selected text (cross-out effect), draw replacement text on top via pdf-lib drawText with matching font/size, persist changes via document save, set clear user expectations about overlay limitation (not true stream editing)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Document Lifecycle | 0/3 | Not started | - |
| 2. Core Viewer | 0/4 | Not started | - |
| 3. Search, Print & Keyboard | 0/3 | Not started | - |
| 4. Multi-tab Interface | 0/3 | Not started | - |
| 5. Form Filling | 0/3 | Not started | - |
| 6. Page Manipulation | 0/4 | Not started | - |
| 7. Digital Signatures | 0/3 | Not started | - |
| 8. Text Editing | 0/2 | Not started | - |
