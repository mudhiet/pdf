---
phase: "1"
slug: foundation
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-15
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Renderer → Main (IPC) | Renderer process communicates with main process via typed IPC channels. Renderer has no direct filesystem access. | Base64-encoded PDF bytes, file paths, UI events |
| Main → Filesystem | Main process reads/writes files on behalf of the renderer. All file I/O is validated and sanitized. | Raw PDF bytes, file paths, window state JSON |
| Main → Windows Registry | Main process registers PDF file association in HKCU (user-level, no admin required). | Executable path, registry keys |
| App → Disk (userData) | Application state (window position/size) persisted to `%APPDATA%/pdf-editor/window-state.json`. | Window bounds JSON with SHA-256 integrity hash |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T1-001 | Tampering | `doc:save` IPC handler — renderer could specify arbitrary save path | mitigate | Path validation: resolves to absolute path, enforces `.pdf` extension, rejects filesystem root, verifies write permission to target directory. `src/main/ipc.ts:31-55` | closed |
| T1-002 | Information Disclosure | Error messages in `openPDF`/`savePDF` include raw filesystem paths | mitigate | `sanitizeError()` function strips Windows/Unix paths, OS error codes (ENOENT, EACCES, etc.), and path fragments from all error messages returned to renderer. `src/main/file-io.ts:11-24` | closed |
| T1-003 | DoS | Base64 IPC encoding increases memory ~33% for large PDFs | accept | Documented design decision D-15. ContextIsolation prevents ArrayBuffer transfer. Acceptable for Phase 1; revisit with streaming in Phase 2 when pdf.js rendering is in place. | closed |
| T1-004 | Privilege Escalation | `winreg` dynamically imported — supply-chain risk; registry writes to HKCU | accept | Version pinned to `^1.2.5` in package.json. Dynamically imported (not bundled at startup). Wrapped in try/catch — failure is non-blocking. HKCU scope (user-level, no system-wide impact). Acceptable for personal-use desktop app. | closed |
| T1-005 | Integrity | `window-state.json` in userData — tamperable by local processes | mitigate | SHA-256 integrity hash stored alongside state data. `getSavedState()` verifies hash before applying state; falls back to defaults on mismatch with console warning. `src/main/window-state.ts:18-21, 47-49, 59-62` | closed |
| T1-006 | Security Misconfiguration | CSP missing — renderer could load external resources | mitigate | CSP meta tag present in `src/renderer/index.html:5`: `default-src 'self'`. Blocks external resource loading. | closed |
| T1-007 | Security Misconfiguration | Electron sandbox not enforced | mitigate | `contextIsolation: true`, `nodeIntegration: false` set in BrowserWindow webPreferences. Preload script uses `contextBridge` — raw `ipcRenderer` not exposed. `src/main/index.ts:26-27`, `src/preload/index.ts:36,43,50,57` — channel allowlists on all wrapper methods. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-001 | T1-003 | Base64 IPC encoding is required by Electron's contextIsolation architecture. Memory overhead is acceptable for Phase 1 (no rendering yet). Will be revisited with streaming in Phase 2. | GSD secure-phase | 2026-05-15 |
| AR-002 | T1-004 | `winreg` is a small, single-purpose npm package for Windows registry access. Version is pinned. HKU scope limits impact. Personal-use app with no multi-tenant threat model. | GSD secure-phase | 2026-05-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-15 | 7 | 7 | 0 | GSD secure-phase (code audit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-15
