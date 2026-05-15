# PDF Editor

## What This Is

A free, desktop PDF viewer and editor for Windows built with Electron and JavaScript. It provides core PDF editing capabilities — form filling with digital signatures, text editing in existing PDFs, and page manipulation — as a personal tool with no subscription costs.

## Core Value

Users can edit PDF documents (text, forms, pages) without paying for a subscription.

## Current State

**Shipped:** v1 — Foundation & Document Lifecycle (2026-05-15)
- Electron shell with contextIsolation + Squirrel.Windows packaging
- IPC bridge with 13 typed channels
- File I/O layer: open/save PDF, drag-and-drop, Windows file association
- 10/10 UAT tests passed, 7/7 security threats closed
- 20 commits, 28 files, 1,940 lines added

**Next:** Phase 2 — Core Viewer (PDF.js rendering, zoom/pan, page navigation, thumbnail sidebar)

## Requirements

### Validated

- GEN-01: User can save PDFs (Save and Save As) — Phase 1, 2026-05-15
- GEN-03: Application respects Windows file associations — Phase 1, 2026-05-15

### Active

- [ ] User can open and display PDF files with smooth rendering (VIEW-01, Phase 2)
- [ ] User can zoom in/out and navigate pages (VIEW-02, Phase 2)
- [ ] User can search text within PDFs (VIEW-03, Phase 3)
- [ ] User can print PDFs (VIEW-04, Phase 3)
- [ ] User can use keyboard shortcuts (VIEW-05, Phase 3)
- [ ] User can open multiple tabs for different PDFs (VIEW-06, Phase 4)
- [ ] User can fill interactive form fields (FORM-01, Phase 5)
- [ ] User can save filled forms back to disk (FORM-02, Phase 5)
- [ ] User can insert/delete/rotate/reorder pages (PAGE-01 to PAGE-04, Phase 6)
- [ ] User can split/merge PDFs (PAGE-05, PAGE-06, Phase 6)
- [ ] User can undo/redo all editing operations (GEN-02, Phase 6)
- [ ] User can add visual and cryptographic signatures (SIGN-01, SIGN-02, Phase 7)
- [ ] User can edit text in existing PDFs (TEXT-01, Phase 8)

### Out of Scope

- Mobile apps (Windows desktop only) — user preference
- Cloud storage integration — personal use, local files only
- OCR / scanning — not needed for current use cases
- Collaboration / sharing features — single-user tool
- Conversion to/from Word, Excel, etc. — not a priority for user

## Context

- Built for personal use only
- No budget — must be free and open source
- Windows 10/11 target
- Traditional desktop UI (menus + toolbars, no ribbons)
- Electron + JavaScript stack

## Constraints

- **Platform**: Windows desktop only — no cross-platform target
- **Tech Stack**: Electron + JavaScript — user preference
- **Cost**: Free tools/libraries only — no paid dependencies
- **UI Style**: Traditional desktop app — familiar to users accustomed to Adobe Acrobat

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Electron + JavaScript | User preference, good PDF library ecosystem | ✅ Implemented |
| Windows desktop only | User's target platform | ✅ Implemented |
| Traditional desktop UI | User preference, familiar paradigm | ✅ Implemented |
| Free/open-source only | Personal use, no budget | ✅ Implemented |
| contextIsolation + preload | Security boundary | ✅ Implemented |
| Squirrel.Windows packaging | Native Windows installer | ✅ Configured |
| IPC bytes in main process | Avoid renderer payload limits | ✅ Implemented |
| CMap for non-Latin search | Unicode text search support | ✅ Planned Phase 3 |
| Command pattern for undo/redo | Structured operation history | ✅ Planned Phase 6 |
| Signature chain: pdf-lib + signpdf + node-forge | Cryptographic signing | ✅ Planned Phase 7 |
| Text editing via overlay | Not true stream editing | ✅ Planned Phase 8 |

---
*Last updated: 2026-05-15 after v1 milestone archive*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via /gsd-transition):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. `What This Is` still accurate? → Update if drifted

**After each milestone** (via /gsd-complete-milestone):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state (users, feedback, metrics)
