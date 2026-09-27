# Responsive Image Tool — User Acceptance Tests

These tests define the expected user-visible behavior.

A feature should not be considered complete until its relevant acceptance tests pass.

# 1. Application Startup

### UAT-001 — Application Loads

**Given:** The Node.js application is running.

**When:** The user opens the application.

**Then:**

- The application loads successfully.
- The React interface is displayed.
- No server error is shown.

### UAT-002 — Empty Initial State

**When:** The user opens the application without uploading anything.

**Then:**

- The upload area is visible.
- No processing results are displayed.
- The Process Images action is disabled or clearly unavailable.

# 2. Upload

### UAT-003 — Upload Single Image

**When:** The user selects one supported image.

**Then:**

- The image appears in the image queue.
- Filename is displayed.
- Dimensions are displayed.
- Original file size is displayed.

### UAT-004 — Upload Multiple Images

**When:** The user selects multiple supported images.

**Then:**

- All images appear in the queue.
- Each image has independent metadata.
- No image replaces another image.

### UAT-005 — Drag and Drop

**When:** The user drags supported images into the drop zone.

**Then:**

- The drop zone visually indicates the active drag state.
- Dropped images are added to the queue.

### UAT-006 — Remove Image

**When:** The user clicks Remove on an uploaded image.

**Then:**

- The image is removed from the queue.
- Other images remain unchanged.

### UAT-007 — Unsupported File

**When:** The user attempts to upload an unsupported file.

**Then:**

- The file is rejected.
- A clear error is displayed.
- Valid files remain available.

# 3. Responsive Sizes

### UAT-008 — Predefined Widths

**When:** The user selects 480, 768, 1024 and 1280.

**Then:**

- The processor generates those widths when possible.
- Aspect ratio is preserved.

### UAT-009 — No Upscaling

**Given:** The original image is 1000px wide.

**When:** The user selects 1920px and enables Don't Upscale.

**Then:**

- A 1920px image is not generated.
- The original image is not enlarged.

### UAT-010 — Custom Width

**When:** The user enters a valid custom width.

**Then:**

- The width is included in processing.
- The generated image has the requested width when technically possible.

### UAT-011 — Duplicate Widths

**When:** The user selects the same width more than once.

**Then:**

- Only one output for that width is generated.

# 4. Formats

### UAT-012 — WebP

**When:** WebP is selected.

**Then:**

- WebP files are generated.
- Generated filenames use the WebP extension.

### UAT-013 — AVIF

**When:** AVIF is selected.

**Then:**

- AVIF files are generated.
- Generated filenames use the AVIF extension.

### UAT-014 — Multiple Formats

**When:** WebP and AVIF are selected.

**Then:**

- Both formats are generated.
- Each format has the configured responsive widths.

# 5. Compression

### UAT-015 — Lossy Compression

**When:** The user selects Lossy and a quality value.

**Then:**

- The selected quality is passed to the image processor.
- The resulting files are generated successfully.

### UAT-016 — Lossless Compression

**When:** The user selects Lossless.

**Then:**

- Lossless processing is used where supported.
- The application does not apply the lossy quality setting incorrectly.

### UAT-017 — Size Reporting

**When:** Processing completes.

**Then:**

- Original size is displayed.
- Generated size is displayed.
- Reduction information is displayed where applicable.

# 6. Metadata

### UAT-018 — Strip Metadata

**When:** Strip Metadata is enabled.

**Then:**

- Output images are generated without unnecessary metadata.
- EXIF/GPS information is not retained where Sharp can remove it.

# 7. HTML Generation

### UAT-019 — IMG Output

**When:** The user selects `<img>` output.

**Then:**

- Valid `<img>` markup is generated.
- The markup references generated files.

### UAT-020 — Picture Output

**When:** The user selects `<picture>` output and multiple compatible formats are generated.

**Then:**

- A valid `<picture>` element is generated.
- Appropriate `<source>` elements are included.
- A fallback `<img>` element is included.

### UAT-021 — Srcset

**When:** Srcset generation is enabled.

**Then:**

- Every successfully generated responsive width appears in `srcset`.
- Width descriptors are correct.
- No nonexistent files are referenced.

### UAT-022 — Sizes

**When:** The user enters a `sizes` value.

**Then:**

- The value appears in generated markup.
- The value is not modified unexpectedly.

### UAT-023 — Empty Alt

**When:** The user leaves alt text blank.

**Then:**

The generated markup contains:

```html
alt=""
```

### UAT-024 — Manual Alt

**When:** The user enters alt text.

**Then:**

- The entered text appears in the generated `alt` attribute.
- The value is correctly escaped.

### UAT-025 — Loading

**When:** The user selects lazy loading.

**Then:**

The generated markup contains:

```html
loading="lazy"
```

### UAT-026 — Decoding

**When:** The user selects async decoding.

**Then:**

The generated markup contains:

```html
decoding="async"
```

### UAT-027 — Fetch Priority

**When:** The user selects a fetch priority.

**Then:**

- The selected value appears in the generated markup.

### UAT-028 — Dimensions

**When:** Width/height generation is enabled.

**Then:**

- The generated `<img>` contains width and height.
- Values correspond to the source image dimensions where applicable.

# 8. Copying and Downloads

### UAT-029 — Copy HTML

**When:** The user clicks Copy HTML.

**Then:**

- Generated markup is copied to the clipboard.
- The UI provides clear success feedback.

### UAT-030 — Download Individual Image

**When:** The user clicks Download on a generated file.

**Then:**

- The correct generated file is downloaded.
- The filename is correct.

### UAT-031 — Download ZIP

**When:** The user clicks Download ZIP.

**Then:**

- A ZIP is generated.
- The ZIP contains the expected generated files.
- Temporary unrelated session files are excluded.

# 9. Processing

### UAT-032 — Processing State

**When:** Image processing starts.

**Then:**

- The UI clearly indicates that processing is underway.
- The Process button cannot accidentally trigger duplicate processing.

### UAT-033 — Processing Completion

**When:** Processing finishes successfully.

**Then:**

- Progress reaches completion.
- Results are displayed.
- Generated files are available.

### UAT-034 — Processing Error

**When:** An image cannot be processed.

**Then:**

- The failed image is identified.
- A useful error is shown.
- The application remains operational.

# 10. Sessions

### UAT-035 — Session Isolation

**Given:** Two independent browser sessions exist.

**When:** Each session uploads different images.

**Then:**

- Session A cannot access Session B's files.
- Session B cannot access Session A's files.

### UAT-036 — Session Expiration

**Given:** A session has exceeded the configured inactivity period.

**When:** Cleanup runs.

**Then:**

- The expired session directory is deleted.
- Its uploaded files are deleted.
- Its generated files are deleted.

### UAT-037 — Active Session Preservation

**Given:** A session is still active.

**When:** Cleanup runs.

**Then:**

- The active session is not deleted.

# 11. Security

### UAT-038 — Path Traversal

**When:** A malicious filename attempts directory traversal.

**Then:**

- The filename is sanitized.
- The application does not write outside the session directory.

### UAT-039 — Arbitrary Filesystem Path

**When:** A request attempts to specify an arbitrary server filesystem path.

**Then:**

- The request is rejected.
- No arbitrary path is accessed.

### UAT-040 — Invalid Processing Request

**When:** The frontend sends invalid processing parameters.

**Then:**

- The server rejects the invalid request.
- The application remains operational.

# 12. Responsive UI

### UAT-041 — Laptop Layout

**When:** The application is opened at approximately 1366px width.

**Then:**

- No important content is clipped.
- Settings remain readable.
- Long filenames do not break the layout.
- Main actions remain visible.

### UAT-042 — Smaller Screen

**When:** The application is opened on a narrow viewport.

**Then:**

- Layout adapts.
- Columns stack appropriately.
- Controls remain usable.
- Horizontal page scrolling is not required.

# 13. Performance

### UAT-043 — Batch Processing

**When:** The user uploads a reasonable batch of images.

**Then:**

- Images are processed without uncontrolled simultaneous resource consumption.
- The UI remains responsive.
- Processing completes successfully.

### UAT-044 — Large Image

**When:** The user uploads a large supported image.

**Then:**

- The application processes it without crashing.
- Memory usage remains controlled.
- The resulting variants are correct.

# 14. Deployment

### UAT-045 — cPanel Startup

**Given:** The application is deployed to supported cPanel hosting.

**When:** The Node.js application is started by cPanel.

**Then:**

- The application starts successfully.
- It uses the assigned environment port.

### UAT-046 — Production Build

**When:** The production React build is deployed.

**Then:**

- The frontend loads.
- API requests reach the Node server.
- Image processing works.
- Generated files can be downloaded.
