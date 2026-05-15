# Phase 1: Foundation & Document Lifecycle - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

## Phase Boundary

This phase delivers the Electron application shell, IPC communication bridge, and file I/O layer. Users can open PDF files (via dialog, drag-and-drop, or Windows file association), save them (Save and Save As), and the application registers itself for Windows PDF file associations. The UI is minimal — a blank window with a native File menu (Open, Save, Save As, Quit). No PDF rendering happens in this phase; that is Phase 2.

## Implementation Decisions

### Project Structure
- **D-01:** Source organized as `src/main/` (Electron main process), `src/renderer/` (HTML/CSS/JS), `src/preload/` (preload script), `src/shared/` (IPC channel definitions, constants shared between processes)
- **D-02:** Single `package.json` at project root with all dependencies and Electron scripts
- **D-03:** `src/shared/` for IPC channel names, event names, and shared type definitions used by both main and renderer processes

### UI Shell
- **D-04:** Phase 1 UI is a minimal Electron window with a blank canvas — no PDF rendering. The renderer shows nothing until a file is opened.
- **D-05:** Native Electron Menu module for the menu bar (not custom HTML) — integrates with Windows window chrome
- **D-06:** Phase 1 menu contains only the File menu with: Open (Ctrl+O), Save (Ctrl+S), Save As, Quit

### Error Handling
- **D-07:** Modal dialog with user-friendly error message when a PDF cannot be opened (corrupted, unreadable, permission denied)
- **D-08:** Encrypted (password-protected) PDFs are rejected with a message — password entry deferred to a later phase
- **D-09:** Technical error details (stack traces, error codes) logged to the dev console but not shown to the user

### Window State Persistence
- **D-10:** Window position, size, and maximized state are saved on close and restored on launch
- **D-11:** Last-opened file path is saved and restored — if the file still exists on disk, it is auto-opened on launch
- **D-12:** State stored in `app.getPath('userData')` (Windows: `%APPDATA%/pdf-editor/`) as a JSON file

### Carried Forward from STATE.md (Prior Architectural Decisions)
- **D-13:** Electron Forge + Squirrel.Windows for packaging and auto-updates
- **D-14:** contextIsolation enabled; all IPC goes through a preload script using `contextBridge`
- **D-15:** PDF bytes managed in the main process to avoid IPC payload size limits; renderer receives rendered output, not raw PDF data

### Agent's Discretion
- Exact folder nesting depth within `src/main/` and `src/renderer/`
- Specific Electron Forge configuration options (icons, metadata, installer behavior)
- File dialog filters and default directories
- Naming conventions for IPC channel strings (e.g., `doc:open` vs `document.open`)

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` — Phase 1 goal, 3 plans (01-01 Electron shell, 01-02 IPC bridge, 01-03 File I/O layer), success criteria
- `.planning/REQUIREMENTS.md` — GEN-01 (save PDFs), GEN-03 (Windows file associations) mapped to Phase 1
- `.planning/PROJECT.md` — Project context: personal use, Windows 10/11, Electron + JavaScript, free/open-source only, traditional desktop UI

### Existing State
- `.planning/STATE.md` — Prior architectural decisions carried forward (D-13 through D-15)

### No external ADRs or additional specs exist yet.

## Existing Code Insights

### Greenfield Project
No existing source code. This is the first phase — all code will be created from scratch.

### Codebase Context
- No codebase maps exist (`.planning/codebase/` is empty)
- No prior phases to reference for patterns or reusable assets
- Agent should establish conventions in Phase 1 that persist through all subsequent phases

## Specific Ideas

No specific UI references, libraries, or "I want it like X" moments from discussion. Open to standard Electron desktop app conventions.

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 1-Foundation & Document Lifecycle*
*Context gathered: 2026-05-15*
