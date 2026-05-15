# Requirements: PDF Editor

**Defined:** 2026-05-15
**Core Value:** Users can edit PDF documents (text, forms, pages) without paying for a subscription.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Viewer

- [ ] **VIEW-01**: User can open and display PDF files with smooth rendering
- [ ] **VIEW-02**: User can zoom in/out and navigate pages (thumbnails, page numbers)
- [ ] **VIEW-03**: User can search text within PDFs
- [ ] **VIEW-04**: User can print PDFs
- [ ] **VIEW-05**: User can use keyboard shortcuts (Ctrl+O, Ctrl+S, Ctrl+Z, etc.)
- [ ] **VIEW-06**: User can open multiple tabs for different PDFs

### Form Filling

- [ ] **FORM-01**: User can fill interactive form fields (text, checkboxes, radio buttons, dropdowns)
- [ ] **FORM-02**: User can save filled forms back to disk

### Page Manipulation

- [ ] **PAGE-01**: User can insert pages from another PDF
- [ ] **PAGE-02**: User can delete pages from a PDF
- [ ] **PAGE-03**: User can rotate pages
- [ ] **PAGE-04**: User can reorder pages via drag-and-drop
- [ ] **PAGE-05**: User can split a PDF into separate files
- [ ] **PAGE-06**: User can merge multiple PDFs into one

### Digital Signatures

- [ ] **SIGN-01**: User can add a visual signature to a form field
- [ ] **SIGN-02**: User can load a PFX certificate and apply cryptographic signature

### Text Editing

- [ ] **TEXT-01**: User can edit text in existing PDFs (overlay approach: cross-out old text, draw new)

### General

- [ ] **GEN-01**: User can save PDFs (Save and Save As)
- [ ] **GEN-02**: User can undo/redo all editing operations
- [ ] **GEN-03**: Application respects Windows file associations (double-click PDF to open)

## v2 Requirements

### Advanced Features

- **OCR-01**: User can scan documents and extract searchable text
- **OCR-02**: User can perform OCR on scanned PDFs

### Document Tools

- **TOOL-01**: User can permanently redact sensitive content from PDFs
- **TOOL-02**: User can crop page margins
- **TOOL-03**: User can batch process multiple PDF files

### Cloud

- **CLOUD-01**: User can open and save files from cloud storage (OneDrive, Google Drive)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Conversion to/from Word, Excel, etc. | Not a priority for user |
| OCR / scanning | Not needed for current use cases |
| Collaboration / sharing features | Single-user tool |
| Cloud storage integration | Personal use, local files only |
| Mobile apps | Windows desktop only |
| Form creation | Only form filling is needed |
| Cross-platform support | Windows desktop only |
| Adware / telemetry | Free personal tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GEN-01 | Phase 1 | Pending |
| GEN-03 | Phase 1 | Pending |
| VIEW-01 | Phase 2 | Pending |
| VIEW-02 | Phase 2 | Pending |
| VIEW-03 | Phase 3 | Pending |
| VIEW-04 | Phase 3 | Pending |
| VIEW-05 | Phase 3 | Pending |
| VIEW-06 | Phase 4 | Pending |
| FORM-01 | Phase 5 | Pending |
| FORM-02 | Phase 5 | Pending |
| PAGE-01 | Phase 6 | Pending |
| PAGE-02 | Phase 6 | Pending |
| PAGE-03 | Phase 6 | Pending |
| PAGE-04 | Phase 6 | Pending |
| PAGE-05 | Phase 6 | Pending |
| PAGE-06 | Phase 6 | Pending |
| SIGN-01 | Phase 7 | Pending |
| SIGN-02 | Phase 7 | Pending |
| TEXT-01 | Phase 8 | Pending |
| GEN-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after roadmap creation*
