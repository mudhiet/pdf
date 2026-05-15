# Feature Landscape — PDF Editor

**Project:** PDF Editor (Windows desktop, Electron + JavaScript)
**Researched:** 2026-05-15
**Domain:** Free desktop PDF viewer and editor
**Confidence:** MEDIUM (primary sources: Wikipedia PDF software list, Adobe Acrobat docs, pdf-lib GitHub README; no live competitor analysis possible due to paywalls)

---

## Table Stakes

Features users expect from any PDF editor. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|-------------|------------|-------|
| **PDF rendering with smooth navigation** | Every PDF tool must display documents | Low | PDF.js renders PDFs to canvas; Electron Chromium provides native canvas |
| **Zoom (fit page / fit width / fit selection)** | Users need to read small text and inspect details | Low | PDF.js supports zoom levels natively |
| **Page navigation (thumbnails + scroll)** | Users expect to jump between pages | Low-Med | PDF.js provides page extraction; thumbnails rendered to small canvases |
| **Bookmarks / outline navigation** | Standard PDF documents include document outlines | Low-Med | PDF.js extracts bookmarks from PDF structure; build a sidebar tree view |
| **Print PDF pages** | Users need to print documents | Low | Electron webContents.print(); PDF.js provides page rendering |
| **Form filling (interactive fields)** | One of the three core v1 capabilities | Med | pdf-lib fills text fields, checkboxes, radio buttons, dropdowns, option lists |
| **Text search within document** | Users expect Ctrl+F in any document viewer | Med | PDF.js extracts text content per page; build a search index across visible pages |
| **Digital signature widget creation** | One of the three core v1 capabilities | High-Med | pdf-lib creates signature field annotations; signpdf + node-forge performs cryptographic signing |
| **Page manipulation: insert/delete/rotate** | One of the three core v1 capabilities | Med | pdf-lib supports insertPage(), removePage(), rotate() |
| **Page manipulation: reorder** | Users expect to rearrange pages | Med | pdf-lib supports copyPages() + insertPage() for reordering |
| **Merge multiple PDFs** | Users expect to combine documents | Med | pdf-lib supports copyPages() from multiple documents into one |
| **Split PDF (extract pages to new file)** | Users expect to pull pages out | Med | pdf-lib supports copyPages() into a new document |
| **File open (drag-and-drop + file dialog)** | Standard desktop app pattern | Low | Electron dialog.showOpenDialog() + drag-and-drop on window |
| **Save / Save As** | Users need to persist changes | Low | Electron dialog.showSaveDialog() + fs.writeFile() |
| **Undo/Redo for edits** | Standard desktop app expectation | Med | Implement command pattern for edit operations |

---

## Differentiators

Features that set this product apart. Not expected, but highly valued by users who choose a free tool over Adobe.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Text editing in existing PDFs** | The killer differentiator -- almost every free viewer is read-only. This is the core reason users switch. | High | pdf-lib supports drawText() but does NOT support modifying existing text glyphs. True text editing requires understanding PDF text streams, font embedding, and character replacement. May need PDF.js text extraction + overlay approach for v1, with true edit in v2 |
| **Digital signatures (cryptographically valid)** | Most free tools only allow image-based signatures. Cryptographic signing with PFX certificates is a premium feature in Adobe | High-Med | signpdf + node-forge + pdf-lib chain; self-signed PFX for personal use |
| **No watermark, no ads, no subscription** | The free alternatives (PDF24, CutePDF) bundle adware. This product is clean | Low | Architectural decision: no ad network, no telemetry, no upsell dialogs |
| **Traditional desktop UI (menus + toolbars)** | Adobe ribbon UI alienates traditional Windows users. Familiar toolbar paradigm is a UX differentiator | Med | Electron + native-looking toolbar (could use Electron Forge menu system + custom toolbar HTML) |
| **Local files only (no cloud)** | Privacy-conscious users prefer no data leaving their machine | Low | Architectural decision: all operations on local filesystem, no network calls for document processing |
| **Fast startup** | Electron apps are known to be slow. Optimizing startup time is a quality signal | Med | Code splitting, lazy loading of PDF.js worker, preload essential modules |

---

## Anti-Features

Features to explicitly NOT build. These are out of scope for v1 and potentially forever.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Conversion to/from Word, Excel, etc.** | Requires OCR + layout analysis engine; massive scope creep; not a priority for user | Users can use Microsoft Office built-in Save as PDF or LibreOffice PDF export |
| **OCR / scanning** | Project explicitly out of scope; requires heavy ML models or external services | Not needed for current use cases per PROJECT.md |
| **Cloud storage integration** | Project explicitly out of scope; personal use, local files only | No network calls for document processing |
| **Collaboration / sharing features** | Project explicitly out of scope; single-user tool | No user accounts, no sharing, no version history |
| **Web capture / URL to PDF** | Requires headless browser + web rendering; scope creep | Users can use browser Print to PDF instead |
| **Redaction** | Requires irreversible content removal + security audit; niche feature | Not a personal-use requirement |
| **Form creation (building forms from scratch)** | pdf-lib supports it, but user needs form filling, not form creation | Defer to v2 if user requests it |
| **Multi-page text editing (reflow across pages)** | Extremely complex; changes to one page shift all subsequent pages; PDF is not a reflowable format | Edit on current page only in v1; note limitation in UI |
| **Image editing within PDFs** | Requires image manipulation (resize, crop, rotate embedded images); niche | Not a priority for personal use |
| **Cross-platform (macOS/Linux)** | User specified Windows desktop only | Focus quality on Windows |
| **Mobile app** | User specified Windows desktop only | No mobile target |
| **Auto-save / background sync** | Cloud feature; contradicts local-only design | Manual save; warn before closing unsaved documents |
| **Adware / telemetry / analytics** | Violates the clean, free value proposition | Zero network calls; no tracking |

---

## Feature Dependencies

```
PDF Rendering (PDF.js) -> Text Search (requires extracted text from PDF.js)
PDF Rendering (PDF.js) -> Page Thumbnails (requires rendering pages to images)
PDF Rendering (PDF.js) -> Print (requires page rendering)
PDF.js + pdf-lib IPC -> Form Filling (read form fields via PDF.js, fill via pdf-lib)
pdf-lib -> Page Manipulation (insert/delete/rotate/reorder/merge/split)
pdf-lib -> Digital Signature Widget (create field annotation)
node-forge + signpdf -> Digital Signature (cryptographic signing, depends on pdf-lib widget)
signature_pad -> Digital Signature UI (capture hand-drawn signature)
File Dialog + fs -> Save / Save As (persist pdf-lib modifications)
Command Pattern -> Undo/Redo (wrap all edit operations)
```

---

## MVP Recommendation

**Prioritize (Phase 1 -- Core Viewer + Form Filling):**
1. PDF rendering with smooth navigation, zoom, and page thumbnails
2. Bookmarks / outline sidebar
3. Text search within document
4. Print PDF pages
5. Form filling (text fields, checkboxes, radio buttons, dropdowns)
6. File open (drag-and-drop + file dialog)
7. Save / Save As

**Prioritize (Phase 2 -- Page Manipulation + Signatures):**
8. Page manipulation: insert, delete, rotate, reorder
9. Merge multiple PDFs
10. Split PDF (extract pages to new file)
11. Digital signature: widget creation + hand-drawn capture
12. Digital signature: cryptographic signing with PFX certificate

**Defer (Phase 3+ -- Text Editing):**
- **Text editing in existing PDFs**: Defer to Phase 3. This is the most complex feature and requires a different approach than pdf-lib provides (true text stream modification vs. overlay rendering). Start with text overlay (draw new text on top of existing) in v1, investigate true text editing in v2.

**Defer (Out of Scope):**
- Conversion, OCR, cloud, collaboration, mobile -- per PROJECT.md constraints

---

## Implementation Notes by Feature

### Text Editing in Existing PDFs -- The Hard One

pdf-lib does NOT support modifying existing text content. It can only draw new text on top of existing content (effectively an overlay). True text editing -- replacing "teh" with "the" in the PDFs text stream -- requires:

1. **PDF.js text extraction** to identify existing text positions
2. **pdf-lib font embedding** to ensure the replacement text uses the same font
3. **PDF content stream manipulation** to replace text operators (Tj/TJ)
4. **Handling font encoding** -- PDFs use custom CMaps, not standard character codes

For v1, the approach should be:
- **Overlay mode**: Draw replacement text boxes on top of existing text (simple, works for most cases)
- **Crossed-out + new text**: Visually strike through the old text and draw the correction (clear but verbose)

True text stream editing can be added in v2 when time permits.

### Digital Signatures -- Two-Part Feature

1. **Visual signature**: User draws signature with signature_pad -> rendered as image in pdf-lib annotation widget
2. **Cryptographic signature**: User loads PFX certificate -> node-forge performs RSA signing -> signpdf bridges to pdf-lib -> cryptographically valid signature embedded in PDF

These are separate concerns. The visual signature is what the user sees; the cryptographic signature is what makes it legally meaningful.

### Form Filling -- Cross-Library Collaboration

- **Reading form fields**: PDF.js renders form fields but does not expose field metadata. pdf-lib getForm() reads field names, types, and current values.
- **Filling form fields**: pdf-lib API is used to set field values (setText(), check(), select()).
- **Rendering filled forms**: After filling, re-render the PDF with PDF.js to show the filled values.

---

## Sources

- Wikipedia: [List of PDF software](https://en.wikipedia.org/wiki/List_of_PDF_software) -- comprehensive feature matrix of 50+ PDF tools
- Wikipedia: [Adobe Acrobat](https://en.wikipedia.org/wiki/Adobe_Acrobat) -- Adobe feature set and product family
- [pdf-lib GitHub README](https://github.com/hopding/pdf-lib) -- complete feature list and usage examples (8.4k stars)
- [PDF.js](https://mozilla.github.io/pdf.js/) -- Mozilla PDF rendering library
- [PROJECT.md](../PROJECT.md) -- project constraints and scope
- [STACK.md](./STACK.md) -- technology stack decisions that constrain feature implementation
