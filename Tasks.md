# Responsive Image Tool — Development Tasks

Tasks are ordered by dependency and priority.

Status values:

- [ ] Not started
- [~] In progress
- [x] Completed and tested

# Phase 1 — Project Foundation

## 1. Project Setup

- [ ] Create Node.js 20 project.
- [ ] Create package configuration.
- [ ] Configure React + Vite.
- [ ] Configure Tailwind CSS.
- [ ] Create frontend/backend directory structure.
- [ ] Create `app.js` startup entry.
- [ ] Verify Node server starts using `process.env.PORT`.

## 2. HTTP Server

- [ ] Create native Node HTTP server.
- [ ] Implement basic request routing.
- [ ] Implement static frontend file serving.
- [ ] Implement JSON response helper.
- [ ] Implement JSON request parsing.
- [ ] Implement basic 404 handling.
- [ ] Implement centralized server error handling.

## 3. Temporary Storage

- [ ] Create session storage directory.
- [ ] Implement session ID generation.
- [ ] Create session directory structure.
- [ ] Track session creation time.
- [ ] Track last activity time.
- [ ] Implement session expiration calculation.

# Phase 2 — Upload System

## 4. Upload UI

- [ ] Build drag-and-drop area.
- [ ] Add file picker.
- [ ] Support multiple image selection.
- [ ] Display selected images.
- [ ] Add remove-image action.
- [ ] Show filename.
- [ ] Show dimensions.
- [ ] Show original file size.

## 5. Upload Backend

- [ ] Implement multipart upload parsing.
- [ ] Validate file extensions/types.
- [ ] Validate file size.
- [ ] Sanitize filenames.
- [ ] Store uploaded files inside the session directory.
- [ ] Return uploaded-image metadata.
- [ ] Prevent arbitrary filesystem paths.

# Phase 3 — Image Processing

## 6. Sharp Integration

- [ ] Integrate Sharp.
- [ ] Read source image metadata.
- [ ] Detect original dimensions.
- [ ] Preserve aspect ratio.
- [ ] Implement no-upscale behavior.

## 7. Responsive Width Generation

- [ ] Implement predefined widths.
- [ ] Implement custom widths.
- [ ] Remove duplicate widths.
- [ ] Sort widths numerically.
- [ ] Skip widths larger than source when no-upscale is enabled.
- [ ] Generate predictable filenames.

## 8. Output Formats

- [ ] Implement WebP output.
- [ ] Implement AVIF output.
- [ ] Implement JPEG output.
- [ ] Implement PNG output.
- [ ] Validate unsupported format combinations.

## 9. Compression

- [ ] Implement lossy mode.
- [ ] Implement lossless mode.
- [ ] Implement quality configuration.
- [ ] Apply format-specific Sharp settings.
- [ ] Record output file sizes.
- [ ] Calculate size reduction.

## 10. Metadata

- [ ] Implement metadata stripping.
- [ ] Ensure EXIF/GPS information is removed when requested.
- [ ] Preserve metadata when stripping is disabled where technically appropriate.

# Phase 4 — Processing UI

## 11. Output Settings

- [ ] Build width selector.
- [ ] Build custom-width input.
- [ ] Build format selector.
- [ ] Build compression selector.
- [ ] Build quality control.
- [ ] Build metadata option.
- [ ] Build no-upscale option.

## 12. Processing Action

- [ ] Build Process Images button.
- [ ] Disable duplicate processing requests.
- [ ] Display processing state.
- [ ] Display overall progress.
- [ ] Display current image.
- [ ] Handle processing errors.
- [ ] Allow successful results to remain visible.

## 13. Processing Concurrency

- [ ] Implement controlled processing concurrency.
- [ ] Prevent uncontrolled simultaneous Sharp jobs.
- [ ] Verify memory usage with batch processing.

# Phase 5 — HTML Generation

## 14. HTML Generator

- [ ] Create HTML generator module.
- [ ] Generate `<img>` markup.
- [ ] Generate `<picture>` markup.
- [ ] Generate `srcset`.
- [ ] Generate `sizes`.
- [ ] Generate width/height.
- [ ] Generate alt attribute.
- [ ] Generate loading attribute.
- [ ] Generate decoding attribute.
- [ ] Generate fetchpriority attribute.

## 15. HTML Settings UI

- [ ] Build `<img>` / `<picture>` selector.
- [ ] Build alt text input.
- [ ] Build sizes input.
- [ ] Build loading selector.
- [ ] Build decoding selector.
- [ ] Build fetchpriority selector.
- [ ] Build width/height option.
- [ ] Build srcset option.
- [ ] Build sizes option.

## 16. HTML Preview

- [ ] Display generated HTML.
- [ ] Add copy-to-clipboard action.
- [ ] Display copy-success feedback.
- [ ] Ensure generated markup references only existing files.

# Phase 6 — Results

## 17. Results UI

- [ ] Build results section.
- [ ] Display generated variants.
- [ ] Display dimensions.
- [ ] Display file sizes.
- [ ] Display reduction.
- [ ] Add individual download action.
- [ ] Add HTML copy action.

## 18. ZIP Download

- [ ] Implement server-side ZIP generation.
- [ ] Include generated files.
- [ ] Use predictable ZIP naming.
- [ ] Prevent unrelated session files from entering ZIP.
- [ ] Add Download ZIP action.

# Phase 7 — Session Cleanup

## 19. Cleanup

- [ ] Implement expired-session detection.
- [ ] Implement recursive session deletion.
- [ ] Handle missing files safely.
- [ ] Handle cleanup errors without crashing server.
- [ ] Add scheduled cleanup.
- [ ] Verify 12-hour inactivity behavior.

# Phase 8 — Security and Hardening

## 20. Upload Security

- [ ] Validate MIME/type.
- [ ] Validate extension.
- [ ] Enforce maximum upload size.
- [ ] Sanitize filenames.
- [ ] Prevent path traversal.
- [ ] Prevent arbitrary output paths.

## 21. API Hardening

- [ ] Validate API request payloads.
- [ ] Reject malformed processing requests.
- [ ] Ensure session ownership of files.
- [ ] Prevent access to another session's files.
- [ ] Ensure temporary directories are not publicly exposed.

# Phase 9 — Responsive UI

## 22. Desktop

- [ ] Verify laptop layout.
- [ ] Verify 1366px-width layout.
- [ ] Verify larger desktop layout.
- [ ] Verify long filenames.
- [ ] Verify large image lists.

## 23. Smaller Screens

- [ ] Verify tablet layout.
- [ ] Verify mobile layout.
- [ ] Verify settings stacking.
- [ ] Verify no unwanted horizontal scrolling.
- [ ] Verify touch-friendly controls.

# Phase 10 — Quality

## 24. Error Handling

- [ ] Test invalid images.
- [ ] Test corrupted images.
- [ ] Test oversized uploads.
- [ ] Test unsupported formats.
- [ ] Test interrupted processing.
- [ ] Test missing session directories.

## 25. Performance

- [ ] Test one large image.
- [ ] Test multiple large images.
- [ ] Test multiple output widths.
- [ ] Test multiple output formats.
- [ ] Test batch processing.
- [ ] Confirm controlled CPU/memory usage.

## 26. Deployment

- [ ] Test production build.
- [ ] Test cPanel Node.js environment.
- [ ] Configure startup file.
- [ ] Verify generated React assets are served.
- [ ] Verify API routes work.
- [ ] Verify Sharp works on production hosting.
- [ ] Verify temporary storage permissions.
- [ ] Verify cleanup process.

# Phase 11 — Final Verification

## 27. End-to-End Workflow

- [ ] Upload image.
- [ ] Configure sizes.
- [ ] Configure formats.
- [ ] Configure compression.
- [ ] Process image.
- [ ] Review generated files.
- [ ] Generate HTML.
- [ ] Copy HTML.
- [ ] Download files.
- [ ] Download ZIP.
- [ ] Verify temporary cleanup.

A feature may only move to `Completed.md` after implementation and testing have both passed.
