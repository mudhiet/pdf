# Technology Stack — PDF Editor

**Project:** PDF Editor (Windows desktop, Electron + JavaScript)
**Researched:** 2026-05-15
**Overall confidence:** HIGH

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Electron** | `^33.x` (latest stable) | Desktop shell | User preference; mature ecosystem; Windows-focused build tools (Squirrel.Windows via Forge); no cross-platform needed |
| **Node.js** | `^22.x` (LTS) | Runtime | Ships bundled with Electron v33; modern JS/TS support; native fs module for file I/O |

**Rationale:** Electron v33+ requires Windows 10+ (v23+ dropped Win7/8/8.1), which matches the target. Electron Forge v6 provides the most polished Windows packaging pipeline.

### PDF Rendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **pdfjs-dist** | `^3.11.x` (or `^4.x` if stable) | PDF page rendering + text extraction | Mozilla-maintained; renders PDFs to canvas; extracts text content for search/navigation; works in both browser (renderer) and Node.js (main) processes |
| **@napi-rs/canvas** | `^0.1.x` | Headless canvas for Node.js | Zero system dependencies (statically linked Skia); required by PDF.js for Node.js rendering; produces PNG/JPEG buffers from canvas |

**Rationale:** PDF.js is the only mature, actively-maintained PDF rendering library in JavaScript. In Electron, the renderer process uses PDF.js with the browser's native `<canvas>` -- no extra dependency. In the main process (for batch operations, page extraction), `@napi-rs/canvas` is needed because PDF.js's Node.js build requires a `createCanvas` implementation. `@napi-rs/canvas` is superior to the older `canvas` (Cairo-backed) because it has zero system dependencies, which simplifies Electron app distribution.

### PDF Manipulation (Form Filling, Page Manipulation)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **pdf-lib** | `^1.18.x` | PDF document creation, modification, form filling, page manipulation | Pure JavaScript (zero native deps); works in both Electron renderer and main process; excellent form field API (text, checkboxes, radio, dropdown, option list); page copy/insert/delete/rotate; embed fonts/images |

**Rationale:** pdf-lib is the de facto standard for PDF manipulation in JavaScript. It is the only library that provides comprehensive form field operations (fill, read, flatten, create) and page manipulation (insert, delete, rotate, reorder, copy between documents) in pure JS. Its zero native dependencies make it ideal for the Electron renderer process.

### Digital Signatures

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **pdf-lib** | `^1.18.x` | Signature widget creation (visual placeholder) | Supports creating signature field annotations on PDF pages |
| **node-forge** | `^1.x` | Cryptographic operations (RSA signing, PKCS#12/PFX loading) | Pure JavaScript PKI library; loads PFX/P12 certificates; performs RSA signing needed for PDF signature creation |
| **signpdf** | `^2.x` | Bridges pdf-lib + node-forge to create valid PDF signatures | Adapters pattern -- `SIGN_ADAPTER_PDF_LIB` plugs node-forge signing into pdf-lib's signature field |

**Rationale:** PDF.js does not modify PDFs. pdf-lib creates the signature widget but does not perform cryptographic signing. The `signpdf` library fills this gap by providing adapters that combine pdf-lib (PDF structure) with node-forge (crypto). This is the standard JavaScript approach for digital signatures. Note: for personal use, a self-signed certificate (PFX) is sufficient -- no CA required.

### Signature Capture (UI)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **signature_pad** | `^4.x` | Canvas-based smooth signature drawing | Zero dependencies; cross-browser; produces SVG/path data; perfect for capturing hand-drawn signatures before embedding them into PDF form fields |

**Rationale:** signature_pad is the standard signature capture library. It draws smooth bezier-curve signatures on `<canvas>` and can export as image (for embedding in PDF) or as path data (for signature field widgets).

### Build and Packaging

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **electron-forge** | `^7.x` (v6 is latest stable) | Build pipeline, packaging, auto-update | Officially recommended by Electron; unified dev/build workflow; Squirrel.Windows maker for `.exe` installer; MSIX maker as alternative; built-in code signing support |
| **@electron-forge/maker-squirrel** | (bundled) | Windows installer (`.exe` + auto-update) | Squirrel.Windows is the most battle-tested Windows installer for Electron apps; provides automatic updates via RELEASES file |

**Rationale:** Electron Forge is the current recommended packaging tool (replacing the older electron-builder/electron-packager for most use cases). It provides the most integrated experience with code signing, installer generation, and auto-update support. For a Windows-only app, Squirrel.Windows is the simplest and most reliable option.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **pdf2pic** | `^2.x` | PDF page to image conversion | When you need to export a PDF page as PNG/JPEG (e.g., thumbnail generation, print preview) |
| **electron-updater** | `^6.x` | Auto-update mechanism | If you want built-in auto-update (alternative to Squirrel's built-in); works with S3/GitHub releases |

### What Not to Use (and Why)

| Technology | Why Not |
|------------|---------|
| **pdf.js (browser build) in main process** | Requires `@napi-rs/canvas` for Node.js rendering; do not use PDF.js main-process rendering unless you need it -- pdf-lib handles manipulation without rendering |
| **pdf-lib for rendering** | pdf-lib does NOT render PDFs -- it only modifies structure. Use PDF.js for rendering. |
| **pdf.js for form filling** | PDF.js is read-only for forms (it renders and extracts, but does not write). Use pdf-lib for form operations. |
| **electron-winstaller directly** | Electron Forge wraps this; use Forge for a unified pipeline |
| **@napi-rs/canvas for rendering PDFs to files** | Overkill -- PDF.js + `@napi-rs/canvas` is the rendering combo; `@napi-rs/canvas` also has a `PDFDocument` for creating PDFs from scratch, but pdf-lib is better for modifying existing PDFs |
| **node-canvas (Cairo-backed)** | Requires Cairo system dependencies -- adds complexity to Electron app distribution |
| **react-pdf (wojtekmaj)** | React-specific viewer wrapper; adds unnecessary abstraction when you can use PDF.js directly |

---

## Architecture: How Libraries Work Together

```
+----------------------------------------------------------+
|                    Electron App                          |
|                                                          |
|  +-------------------+    +----------------------------+ |
|  |  Main Process     |    |   Renderer Process (UI)    | |
|  |  (Node.js)        |    |   (Chromium)               | |
|  |                   |    |                            | |
|  |  pdf-lib          |    |  PDF.js (pdfjs-dist)       | |
|  |  (manipulation)   |<--->|  (rendering + text extract)| |
|  |                   |    |                            | |
|  |  signpdf          |    |  signature_pad             | |
|  |  + node-forge     |    |  (signature capture)       | |
|  |  (digital sig)    |    |                            | |
|  |                   |    |  electron-updater          | |
|  |  pdf2pic          |    |  (auto-update)             | |
|  |  (page to img)    |    |                            | |
|  +-------------------+    +----------------------------+ |
|           | IPC +               | IPC -                  |
+-----------+---------------------+------------------------+
            |                     |
            v                     |
      File System (local)         |
      PDF files, certs (.pfx)     |
```

**Key principle:** PDF.js renders in the renderer process (browser context). pdf-lib manipulates in the main process (Node.js context). IPC bridges the two. Digital signatures are computed in the main process where crypto operations are more natural.

---

## Installation

```bash
# Core
npm install electron
npm install pdfjs-dist
npm install pdf-lib
npm install @napi-rs/canvas
npm install node-forge
npm install signpdf
npm install signature_pad

# Build / Packaging
npm install --save-dev electron-forge
npm install --save-dev @electron-forge/cli
npm install --save-dev @electron-forge/maker-squirrel
npm install --save-dev @electron-forge/maker-zip

# Optional
npm install pdf2pic        # PDF page to image conversion
npm install electron-updater  # Auto-update (alternative to Squirrel)
```

---

## Version Compatibility Notes

| Component | Compatibility |
|-----------|--------------|
| Electron v33 + PDF.js v4.x | Compatible -- PDF.js v4.x works in Electron renderer |
| PDF.js v3.x + @napi-rs/canvas | Compatible -- use `pdfjs-dist/legacy/build/` for Node.js |
| pdf-lib v1.18 + signpdf v2 | Compatible -- signpdf has `SIGN_ADAPTER_PDF_LIB` |
| electron-forge v7 + Squirrel | Compatible -- maker-squirrel works out of the box |

---

## Confidence Assessment

| Component | Confidence | Reason |
|-----------|------------|--------|
| Electron | HIGH | Officially recommended; docs verified via Context7 |
| PDF.js | HIGH | Mozilla-maintained; Context7 docs verified; Node.js rendering confirmed |
| pdf-lib | HIGH | Context7 docs verified; extensive code examples; zero native deps |
| @napi-rs/canvas | HIGH | Zero system dependencies confirmed; PDF.js Node.js requirement verified |
| Digital signatures (signpdf + node-forge) | MEDIUM | signpdf not in Context7 -- verified via npm search; node-forge PKI verified |
| signature_pad | HIGH | Well-established library; Context7 docs verified |
| Electron Forge | HIGH | Official docs verified; Squirrel.Windows maker confirmed |

---

## Sources

- [pdf-lib Documentation (GitHub)](https://github.com/hopding/pdf-lib) -- Context7: `/hopding/pdf-lib`
- [PDF.js Documentation (GitHub)](https://github.com/mozilla/pdf.js) -- Context7: `/mozilla/pdf.js`
- [Electron Documentation](https://www.electronjs.org/docs) -- Context7: `/electron/electron`
- [Electron Forge Documentation](https://www.electronforge.io/) -- Context7: `/electron-forge/electron-forge-docs`
- [@napi-rs/canvas Documentation](https://github.com/brooooooklyn/canvas) -- Context7: `/brooooooklyn/canvas`
- [node-forge Documentation](https://github.com/digitalbazaar/forge) -- Context7: `/digitalbazaar/forge`
- [signature_pad Documentation](https://github.com/szimek/signature_pad) -- Context7: `/szimek/signature_pad`
- [electron-updater Documentation](https://www.electron.build/auto-update.html) -- Electron Forge ecosystem
