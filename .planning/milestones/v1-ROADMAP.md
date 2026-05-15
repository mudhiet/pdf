# Milestone Archive: v1 — Foundation & Document Lifecycle

**Version:** v1
**Date:** 2026-05-15
**Status:** Shipped
**Audit:** PASSED (v1-MILESTONE-AUDIT.md)

---

## Summary

Shipped the Electron application shell, IPC communication bridge, and file I/O layer. Users can open PDF files (via dialog, drag-and-drop, or Windows file association), save them (Save and Save As), and the application registers itself for Windows PDF file associations. 10/10 UAT tests passed, 7/7 security threats closed.

## Statistics

| Metric | Value |
|--------|-------|
| Phases completed | 1 |
| Plans executed | 3 |
| Commits | 20 |
| Files changed | 28 |
| Lines added | 1,940 |
| Duration | 2026-05-15 14:41 → 19:14 (≈4.5 hours) |
| UAT tests | 10/10 passed |
| Security threats | 7/7 closed |

## Accomplishments

1. **Electron shell scaffolded** — Project initialized with Electron Forge, Squirrel.Windows packaging, TypeScript build system for main/renderer processes, contextIsolation + preload bridge security pattern.

2. **IPC bridge established** — 13 typed IPC channels defined with `ChannelNames` union type, 8 `ipcMain.handle()` registrations, typed `window.electron` API exposed via `contextBridge`, raw `ipcRenderer` never directly exposed.

3. **File I/O layer complete** — PDF open/save via file dialog with `%PDF-` magic byte validation, drag-and-drop support in renderer, Windows file association registered under HKEY_CURRENT_USER, window state persistence with SHA-256 integrity hash, single-instance behavior via `second-instance` event.

4. **Security audit passed** — 7 threats identified and resolved: path validation on save, error message sanitization, CSP meta tag, contextIsolation enforcement, window-state integrity hashing, supply-chain risk acceptance for `winreg`, documented base64 IPC memory overhead.

5. **End-to-end flows verified** — All 5 critical user flows tested and passing: open via menu, save to disk, drag-and-drop, Windows Explorer double-click, quit and window state restore.

## Phases

### Phase 1: Foundation & Document Lifecycle

**Goal:** Users can open, save, and manage PDF documents with the application integrated into Windows

**Depends on:** Nothing (first phase)
**Requirements:** GEN-01, GEN-03

**Success Criteria:**
1. User can open a PDF file via File → Open dialog, drag-and-drop, or double-click from Windows Explorer
2. User can save a PDF (Save) and save a copy (Save As) to a chosen location on disk
3. Double-clicking a PDF file in Windows Explorer opens it in the application

**Plans (3/3 complete):**
- [x] 01-01: Electron shell setup — scaffold project with Electron Forge, Squirrel.Windows packaging, preload script with contextIsolation, main/renderer process structure
- [x] 01-02: IPC bridge — establish invoke/handle and send/on channels between main and renderer processes; define channel contract for document lifecycle operations
- [x] 01-03: File I/O layer — implement file dialog (open/save/saveAs), drag-and-drop handling, Windows file association registration, document open/save flow with raw byte management in main process

## Key Files Created

| File | Purpose |
|------|---------|
| `src/main/index.ts` | Main process entry, window creation, menu, IPC registration |
| `src/main/ipc.ts` | IPC handler registration (8 handles, 4 events) |
| `src/main/file-io.ts` | File dialog, open/save PDF, magic byte validation |
| `src/main/window-state.ts` | Window position/size persistence with integrity hash |
| `src/preload/index.ts` | Preload script, contextBridge whitelist, typed IPC API |
| `src/renderer/index.ts` | Renderer entry, drag-drop handling, IPC client |
| `src/renderer/index.html` | HTML shell with CSP meta tag |
| `src/renderer/styles.css` | Reset styles |
| `src/shared/channels.ts` | 13 IPC channel constants + ChannelNames type |
| `package.json` | Project config, dependencies, npm scripts |
| `forge.config.cjs` | Electron Forge configuration |
| `electron-builder.json` | Squirrel.Windows installer metadata |
| `tsconfig.json` + `tsconfig.*.json` | TypeScript configuration |

## Requirements Outcome

| Requirement | Status |
|-------------|--------|
| GEN-01: User can save PDFs (Save and Save As) | ✅ Complete — implemented in file-io.ts, verified by UAT |
| GEN-03: Windows file associations | ✅ Complete — registry registration + second-instance handling, verified by UAT |

## Tech Debt / Deferred Items

| Item | Severity | Description |
|------|----------|-------------|
| Base64 IPC memory overhead | Low | ~33% memory increase for large PDFs; acceptable for Phase 1, revisit with streaming in Phase 2 |
| `winreg` supply-chain risk | Low | Version-pinned, HKCU scope, non-blocking failure; accepted for personal-use app |

## Next Phase

**Phase 2: Core Viewer** — PDF.js rendering, zoom/pan, page navigation, thumbnail sidebar. Depends on Phase 1 IPC bridge and file I/O being stable.

---

*Archive created: 2026-05-15*
