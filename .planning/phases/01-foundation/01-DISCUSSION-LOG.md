# Phase 1: Foundation & Document Lifecycle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 1-Foundation & Document Lifecycle
**Areas discussed:** Project structure & folder layout, UI shell in Phase 1, Error handling strategy, Window behavior & state persistence

---

## Project Structure & Folder Layout

| Option | Description | Selected |
|--------|-------------|----------|
| src/ + main/ renderer/ preload/ | Clean separation of Electron process layers | ✓ |
| Flat root structure | Simpler but harder to scale | |
| packages/ monorepo style | Dependency isolation, overkill for this project | |

| Option | Description | Selected |
|--------|-------------|----------|
| src/shared/ | IPC channel definitions, constants shared between processes | ✓ |
| src/utils/ + src/types/ | Split utilities and types | |
| You decide | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Single package.json at root | Simpler for a small project | ✓ |
| Separate package.json per directory | More complex | |
| You decide | | |

**User's choice:** All areas — recommended options selected throughout
**Notes:** User consistently chose the recommended option, indicating trust in agent judgment for structural decisions.

---

## UI Shell in Phase 1

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal window + menu bar only | Blank canvas, File menu only. Keeps Phase 1 focused on IPC + file I/O | ✓ |
| Menu bar + empty viewer canvas | Shows 'Drop a PDF here' prompt | |
| Full basic viewer | Blurs phase boundaries | |

| Option | Description | Selected |
|--------|-------------|----------|
| Native Electron Menu | Proper Windows app feel, minimal code | ✓ |
| Custom HTML menu bar | More flexible but extra work | |
| You decide | | |

| Option | Description | Selected |
|--------|-------------|----------|
| File menu only | Open, Save, Save As, Quit | ✓ |
| File + minimal Edit | Undo, Cut, Copy, Paste | |
| You decide | | |

**User's choice:** Minimal window + native menu + File menu only
**Notes:** User wants Phase 1 strictly focused on infrastructure — no rendering.

---

## Error Handling Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog with specific error message | Familiar desktop app pattern | ✓ |
| Status bar notification only | Less disruptive, easy to miss | |
| Toast notification + status bar | More polished, more UI work | |

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt for password | Requires IPC for password passing | |
| Reject with message (defer password entry) | Simplest for Phase 1 | ✓ |
| You decide | | |

| Option | Description | Selected |
|--------|-------------|----------|
| User-friendly messages, technical details in console | Best for mixed audience | ✓ |
| Show technical error details to the user | Confusing for non-technical users | |
| You decide | | |

**User's choice:** Modal dialogs, reject encrypted PDFs, user-friendly messages
**Notes:** Password entry for encrypted PDFs deferred to a later phase.

---

## Window Behavior & State Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — save/restore position, size, maximized state | Users expect this | ✓ |
| No — let Windows place the window | Simpler | |
| You decide | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — restore last-opened file path | Common desktop app behavior | ✓ |
| No — start with blank canvas each time | Simpler | |
| You decide | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Electron app.getPath('userData') | OS-standard config folder | ✓ |
| Local app directory | Ties state to installation | |
| You decide | | |

**User's choice:** Full state persistence including last-opened file
**Notes:** State stored in `%APPDATA%/pdf-editor/` as JSON.

---

## Agent's Discretion

- Exact folder nesting depth within `src/main/` and `src/renderer/`
- Specific Electron Forge configuration options
- File dialog filters and default directories
- IPC channel string naming conventions

## Deferred Ideas

None — discussion stayed within phase scope.
