# Project Research Summary

**Project:** PDF Editor (Windows desktop, Electron + JavaScript)
**Domain:** Free desktop PDF viewer and editor for Windows
**Researched:** 2026-05-15
**Confidence:** HIGH

---

## Executive Summary

This project is a free, open-source desktop PDF editor for Windows built with Electron and JavaScript. The research confirms that the chosen stack (Electron v33 + PDF.js + pdf-lib + pdf-lib-based digital signatures) is well-suited for the target capabilities: form filling, digital signatures, text editing, and page manipulation. The architecture follows a clean separation: PDF.js handles rendering in the renderer process, pdf-lib handles document manipulation in the main process, with IPC bridging the two. This mirrors the pattern used by established tools like PDF.js itself and many Electron-based PDF applications.

The recommended approach is to build in four phases: (1) Core viewer with navigation, search, and print; (2) Form filling with AcroForm support; (3) Page manipulation and digital signatures; (4) Text editing (overlay approach in v1, true stream editing in v2). This ordering respects library dependencies -- every phase builds on the viewer foundation -- and defers the most complex feature (text editing) to avoid blocking earlier phases.

The key risks are: **pdf-lib silently invalidates existing digital signatures** on save (must warn users before overwriting), **pdf-lib cannot edit existing text** (only overlay, which must be set as user expectation), and **large PDF operations freeze the main process** (must use worker threads). Three additional moderate risks involve CMap loading for non-Latin text, form field Unicode font embedding, and the fragile three-library chain for digital signatures (pdf-lib + signpdf + node-forge). All are well-understood with documented mitigations.

---

## Key Findings

### Recommended Stack

The stack is mature, well-documented, and internally consistent. Every library is pure JavaScript (zero native dependencies except @napi-rs/canvas for Node.js canvas), which is critical for Electron distribution. The library boundaries are clear: PDF.js for rendering, pdf-lib for manipulation, no overlap, no conflict.

**Core technologies:**
- **Electron v33 + Node.js v22** -- Desktop shell; ships bundled; Windows 10+ required (matches target); Electron Forge v7 with Squirrel.Windows for packaging
- **PDF.js (pdfjs-dist) v3.11+ or v4.x** -- PDF page rendering and text extraction; renders to canvas in renderer process; web worker for parsing; CMap files required for non-Latin text
- **pdf-lib v1.18** -- PDF manipulation (form filling, page insert/delete/rotate/reorder, merge, split); pure JS; zero native deps; works in both Electron processes
- **@napi-rs/canvas v0.1** -- Headless canvas for Node.js; zero system dependencies (statically linked Skia); required by PDF.js in main process for batch rendering
- **node-forge v1 + signpdf v2** -- Digital signatures; node-forge loads PFX certificates and performs RSA signing; signpdf bridges to pdf-lib signature field API
- **signature_pad v4** -- Canvas-based hand-drawn signature capture; smooth bezier curves; exports as image for embedding
- **electron-forge v7 + maker-squirrel** -- Build pipeline and Windows installer; Squirrel.Windows for .exe installer with auto-update support

### Expected Features

The feature landscape was mapped against 50+ PDF tools (via Wikipedia) and the pdf-lib API. The research distinguishes clearly between table stakes, differentiators, and anti-features.

**Must have (table stakes):**
- PDF rendering with smooth navigation, zoom, page thumbnails -- PDF.js renders to canvas natively
- Bookmarks / outline sidebar -- PDF.js extracts document outlines
- Text search within document -- PDF.js extracts text per page; build search index across visible pages
- Print PDF pages -- Electron webContents.print()
- Form filling (text fields, checkboxes, radio buttons, dropdowns, option lists) -- pdf-lib getForm() + setText()/check()/select()
- File open (drag-and-drop + file dialog) and Save/Save As -- Electron dialog + fs
- Page manipulation: insert, delete, rotate, reorder -- pdf-lib insertPage(), removePage(), rotate(), copyPages()
- Merge multiple PDFs and Split PDF -- pdf-lib copyPages() across documents

**Should have (competitive differentiators):**
- **Text editing in existing PDFs** -- The killer differentiator. pdf-lib only supports overlay (draw new text on top). True text stream editing deferred to v2.
- **Cryptographically valid digital signatures** -- Most free tools only allow image-based signatures. This uses the pdf-lib + signpdf + node-forge chain for real cryptographic signing.
- **No watermark, no ads, no subscription** -- Architectural decision: clean, free, local-only
- **Traditional desktop UI** -- Menus + toolbars, not Adobe's ribbon paradigm
- **Local files only (no cloud)** -- Privacy-first design

**Defer (v2+):**
- True text stream editing (replace existing text in content stream)
- Form creation (building forms from scratch)
- Multi-page text editing (reflow across pages) -- PDF is not reflowable

### Architecture Approach

The architecture follows a two-process Electron pattern with clear component boundaries. PDF.js renders in the renderer process (Chromium native canvas). pdf-lib manipulates in the main process (Node.js fs access). The IPC bridge uses invoke/handle for request-response and send/on for notifications.

**Major components:**
1. **Document Manager** (main) -- PDF lifecycle: open, save, undo/redo, dirty tracking; owns the PDFDocument instance and raw bytes
2. **Page Manager** (main) -- Page-level operations: insert, delete, rotate, reorder, merge, split; wraps pdf-lib page operations in Command pattern
3. **Form Engine** (main) -- Read form fields via pdf-lib getForm(), fill values, flatten forms; handles Unicode font embedding via fontkit
4. **Signature Engine** (main) -- Load PFX certificates (node-forge), create signature widgets (pdf-lib), cryptographic signing (signpdf + node-forge)
5. **PDF.js Display** (renderer) -- Page rendering to canvas, viewport management, text layer overlay
6. **UI Shell** (renderer) -- Menu bar, toolbar, sidebar (thumbnails/bookmarks), page view, form controls, signature canvas, search bar
7. **File I/O Layer** (main) -- Dialog selection, drag-and-drop, file read/write, print
8. **IPC Bridge** (both) -- 18+ registered channels; PDF bytes kept in main process to avoid IPC payload limits

### Critical Pitfalls

**Top 5 pitfalls that must be addressed in planning:**

1. **pdf-lib destroys incremental saves and invalidates existing digital signatures** -- pdf-lib re-serializes the entire document on every save. Must warn users before overwriting signed PDFs and offer Save As to preserve originals. *(Address in Phase 1)*

2. **pdf-lib cannot edit existing text -- only overlay** -- The project key differentiator (text editing) cannot be delivered by pdf-lib. Must implement overlay approach in v1 (white rectangle + new text) and set clear user expectations. True stream editing is v2. *(Address in Phase 4)*

3. **Electron main process freezes on large PDF operations** -- pdf-lib is synchronous CPU-bound; no Web Worker support. Must offload to Node.js worker threads, show progress indicators, and use objectsPerTick chunking. *(Address in Phase 2-3)*

4. **PDF.js CMap loading is mandatory for non-Latin text** -- Without CMap files, text extraction for CJK/Arabic returns empty or garbled results. Must ship CMap files with the app and configure PDF.js correctly. *(Address in Phase 1)*

5. **Digital signature chain is fragile across three libraries** -- pdf-lib + signpdf + node-forge must be version-pinned and tested together. Must validate signatures after creation with a real PFX certificate. *(Address in Phase 3)*

---

## Implications for Roadmap

Based on combined research, the suggested phase structure is:

### Phase 1: Core Viewer + Document Lifecycle
**Rationale:** Foundation for all subsequent phases. Every feature builds on the viewer. Research confirms PDF.js rendering + IPC bridge + file I/O is straightforward and well-documented.

**Delivers:** A functional PDF viewer that can open, display, navigate, search, and print documents.

**Features from FEATURES.md:**
- PDF rendering with smooth navigation, zoom, page thumbnails
- Bookmarks / outline sidebar
- Text search within document (with CMap files)
- Print PDF pages
- File open (drag-and-drop + file dialog)
- Save / Save As (with signature warning)
- HiDPI display support (outputScale transform)

**Stack elements:** Electron shell, PDF.js (renderer), pdf-lib (main, for save), IPC bridge, File I/O layer

**Avoids pitfalls:** Pitfall 2 (encrypted PDFs -- catch EncryptedPDFError), Pitfall 3 (CMap loading -- ship CMap files), Pitfall 7 (IPC payload size -- keep bytes in main process), Pitfall 9 (page index sync -- single source of truth), Pitfall 12 (HiDPI text layer -- apply outputScale)

### Phase 2: Form Filling
**Rationale:** Builds on Phase 1 document lifecycle. Form field extraction and filling is a distinct workflow that requires pdf-lib form API and fontkit for Unicode support.

**Delivers:** Interactive form filling for AcroForm fields (text, checkboxes, radio, dropdown, option lists) with Unicode support.

**Features from FEATURES.md:**
- Form field extraction and display
- Form filling (all AcroForm field types)
- Form flattening
- Unicode font embedding (fontkit + Noto Sans)

**Stack elements:** pdf-lib (getForm(), setText(), check(), select(), updateFieldAppearances()), @pdf-lib/fontkit

**Avoids pitfalls:** Pitfall 4 (non-Latin fonts -- register fontkit, call updateFieldAppearances()), Pitfall 8 (XFA forms -- detect and warn)

### Phase 3: Page Manipulation + Digital Signatures
**Rationale:** Page operations and signatures are the most complex feature group. They require the Command pattern for undo/redo, worker threads for performance, and the three-library signature chain. This phase delivers the core editing capabilities.

**Delivers:** Full page manipulation (insert, delete, rotate, reorder, merge, split) and cryptographically valid digital signatures.

**Features from FEATURES.md:**
- Page manipulation: insert, delete, rotate, reorder
- Merge multiple PDFs
- Split PDF (extract pages to new file)
- Digital signature: widget creation + hand-drawn capture (signature_pad)
- Digital signature: cryptographic signing (node-forge + signpdf + pdf-lib)
- Save / Save As (persist all modifications)
- Undo/Redo (Command pattern)

**Stack elements:** pdf-lib (page operations), signature_pad, node-forge, signpdf, Command pattern, worker threads

**Avoids pitfalls:** Pitfall 1 (signature invalidation -- warn before overwrite), Pitfall 6 (main process freeze -- worker threads, objectsPerTick), Pitfall 10 (signature library compatibility -- pin versions, test with real PFX), Pitfall 11 (undo memory growth -- cap stack, compress snapshots)

### Phase 4: Text Editing + Polish
**Rationale:** Deferred because text editing is the most complex feature and pdf-lib cannot deliver true text stream editing. The overlay approach is implementable but requires careful UX. All other features are complete by Phase 3.

**Delivers:** Text editing via overlay approach (cross-out + insert) and performance polish.

**Features from FEATURES.md:**
- Text overlay editing (drawText + drawRectangle for cross-out)
- Performance optimization (lazy thumbnail generation, page caching)
- Keyboard shortcuts
- Window management (minimize, restore, fullscreen)

**Stack elements:** pdf-lib (drawText(), drawRectangle()), PDF.js (text extraction for selection)

**Avoids pitfalls:** Pitfall 5 (pdf-lib can't edit text -- overlay approach, set user expectations)

### Phase Ordering Rationale

- **Phase 1 first** because every subsequent phase depends on the document lifecycle (open, render, save). The IPC bridge and File I/O layer are prerequisites.
- **Phase 2 second** because form filling is a self-contained workflow that only requires the document from Phase 1. It builds on pdf-lib form API without needing page manipulation.
- **Phase 3 third** because page manipulation and signatures are the most complex feature group. They require the Command pattern (undo/redo), worker threads (performance), and the three-library signature chain. These are heavy but build on Phase 1 document lifecycle.
- **Phase 4 last** because text editing is the most complex feature and pdf-lib fundamentally cannot deliver true text stream editing. Deferring it avoids blocking the core features.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Digital Signatures):** The three-library chain (pdf-lib + signpdf + node-forge) has version compatibility risks. signpdf was not in Context7 verification -- needs live npm verification and testing with real PFX certificates.
- **Phase 3 (Worker Threads):** Offloading pdf-lib to Node.js worker threads is a new integration for this project. Needs architecture review for IPC between worker and main process.
- **Phase 4 (Text Editing):** The overlay approach needs UX research -- how to let users select text, position replacement text, and visualize the cross-out effect.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Core Viewer):** Well-documented patterns; PDF.js + Electron + IPC bridge are well-established
- **Phase 2 (Form Filling):** pdf-lib form API is straightforward with clear examples; fontkit registration is standard

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | All libraries verified via Context7 docs; version compatibility matrix documented; zero native deps (except @napi-rs/canvas) |
| **Features** | MEDIUM | Feature matrix based on Wikipedia + pdf-lib README + Adobe docs; no live competitor analysis possible due to paywalls; differentiator claims are reasonable but unvalidated |
| **Architecture** | HIGH | Component boundaries verified via Context7 docs for PDF.js, pdf-lib, and Electron IPC; data flow patterns documented with code examples |
| **Pitfalls** | HIGH | 15 pitfalls identified with prevention strategies; verified via Context7 docs, pdf-lib GitHub issues, PDF.js FAQs; phase-specific mapping provided |

**Overall confidence:** HIGH

### Gaps to Address

- **signpdf version compatibility:** signpdf was not in Context7 verification -- needs live npm package inspection and testing with the exact pinned versions of pdf-lib and node-forge
- **Worker thread integration for pdf-lib:** No precedent in this project; needs architecture review for IPC between worker thread and main process
- **Text editing UX for overlay approach:** How users select text, position replacement, and visualize cross-out needs UX design research (low priority, Phase 4)
- **Real-world PDF testing:** All mitigations assume typical PDFs; edge cases (encrypted PDFs with unusual encryption, XFA forms, non-sequential page numbers, embedded thumbnails) need testing with actual documents
- **Performance benchmarks:** No data on typical document sizes and operation times; needs profiling on real documents to validate worker thread thresholds

---

## Sources

### Primary (HIGH confidence)
- Context7: /hopding/pdf-lib -- pdf-lib API, form operations, page manipulation, save options, font embedding, limitations
- Context7: /mozilla/pdf.js -- PDF.js architecture, worker communication, text extraction, CMap requirements, performance
- Context7: /electron/electron -- Electron IPC (invoke/handle, send/on), preload script security, contextIsolation
- Context7: /electron-forge/electron-forge-docs -- Electron Forge configuration, Squirrel.Windows maker, packaging
- Context7: /brooooooklyn/canvas -- @napi-rs/canvas, zero system dependencies, Node.js canvas
- Context7: /digitalbazaar/forge -- node-forge PKI, PFX/P12 loading, RSA signing
- Context7: /szimek/signature_pad -- signature_pad, canvas-based signature capture

### Secondary (MEDIUM confidence)
- Wikipedia: List of PDF software -- Feature matrix of 50+ PDF tools
- Wikipedia: Adobe Acrobat -- Adobe feature set and product family
- pdf-lib GitHub README -- Complete feature list, usage examples, limitations
- PDF.js GitHub AGENTS.md -- Worker architecture details
- pdf2pic -- PDF page to image conversion
- electron-updater -- Auto-update mechanism

### Tertiary (LOW confidence)
- signpdf v2 -- Not in Context7; verified via npm search; version compatibility with pdf-lib + node-forge needs validation
- PROJECT.md -- Project constraints and scope (internal document)

---
*Research completed: 2026-05-15*
*Ready for roadmap: yes*
