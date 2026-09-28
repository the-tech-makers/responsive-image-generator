# Responsive Image Tool — Development Tasks

Tasks are ordered by dependency and priority.

> **Current verification status (2026-09-28):** Core implementation is in place. The owner has confirmed the site is working in their local environment. Remaining `[~]` items require explicit UAT/deployment verification and are intentionally not marked complete by code review alone.

Status values:

- [ ] Not started
- [~] In progress
- [x] Completed and tested

# Phase 1 — Project Foundation

## 1. Project Setup

- [x] Create Node.js 20 project.
- [x] Create package configuration.
- [x] Configure React + Vite.
- [x] Configure Tailwind CSS.
- [x] Create frontend/backend directory structure.
- [x] Create `app.js` startup entry.
- [~] Verify Node server starts using `process.env.PORT`.

## 2. HTTP Server

- [x] Create native Node HTTP server.
- [x] Implement basic request routing.
- [ ] Implement static frontend file serving.
- [x] Implement JSON response helper.
- [x] Implement JSON request parsing.
- [x] Implement basic 404 handling.
- [x] Implement centralized server error handling.

## 3. Temporary Storage

- [x] Create session storage directory.
- [x] Implement session ID generation.
- [x] Create session directory structure.
- [x] Track session creation time.
- [x] Track last activity time.
- [x] Implement session expiration calculation.

# Phase 2 — Upload System

## 4. Upload UI

- [x] Build drag-and-drop area.
- [x] Add file picker.
- [x] Support multiple image selection.
- [x] Display selected images.
- [x] Add remove-image action.
- [x] Show filename.
- [x] Show dimensions.
- [x] Show original file size.

## 5. Upload Backend

- [x] Implement multipart upload parsing.
- [x] Validate file extensions/types.
- [x] Validate file size.
- [x] Sanitize filenames.
- [x] Store uploaded files inside the session directory.
- [x] Return uploaded-image metadata.
- [x] Prevent arbitrary filesystem paths.

# Phase 3 — Image Processing

## 6. Sharp Integration

- [x] Integrate Sharp.
- [x] Read source image metadata.
- [x] Detect original dimensions.
- [x] Preserve aspect ratio.
- [x] Implement no-upscale behavior.

## 7. Responsive Width Generation

- [x] Implement predefined widths.
- [x] Implement custom widths.
- [x] Remove duplicate widths.
- [x] Sort widths numerically.
- [x] Skip widths larger than source when no-upscale is enabled.
- [x] Generate predictable filenames.

## 8. Output Formats

- [x] Implement WebP output.
- [x] Implement AVIF output.
- [x] Implement JPEG output.
- [x] Implement PNG output.
- [ ] Validate unsupported format combinations.

## 9. Compression

- [x] Implement lossy mode.
- [x] Implement lossless mode.
- [x] Implement quality configuration.
- [x] Apply format-specific Sharp settings.
- [x] Record output file sizes.
- [x] Calculate size reduction.

### 9.1 TinyPNG / Tinify Integration

- [~] Add TinyPNG/Tinify API configuration via `TINIFY_API_KEY`.
- [~] Keep the API key server-side and out of frontend responses.
- [~] Add optional TinyPNG compression setting.
- [~] Add preferred TinyPNG output format selector: WebP / AVIF.
- [~] Ensure TinyPNG processing occurs only after Sharp responsive resizing.
- [~] Send each required resized variant to Tinify without duplicate requests.
- [~] Save Tinify-optimized results in the session output directory.
- [~] Record TinyPNG output dimensions and file sizes.
- [~] Calculate TinyPNG size reduction against the resized source variant.
- [~] Handle Tinify account/API-limit errors clearly.
- [~] Handle Tinify client, server, and connection errors clearly.
- [~] Do not present failed Tinify results as successfully optimized.
- [~] Verify transparency behavior for WebP and AVIF outputs.
- [~] Verify TinyPNG compression count against expected API operations.

## 10. Metadata

- [x] Implement metadata stripping.
- [x] Ensure EXIF/GPS information is removed when requested.
- [x] Preserve metadata when stripping is disabled where technically appropriate.

# Phase 4 — Processing UI

## 11. Output Settings

- [x] Build width selector.
- [x] Build custom-width input.
- [x] Build format selector.
- [x] Build compression selector.
- [x] Build quality control.
- [x] Build metadata option.
- [x] Build no-upscale option.
- [~] Build TinyPNG compression toggle.
- [~] Build TinyPNG preferred-format selector.
- [~] Explain that TinyPNG runs after resizing.

## 12. Processing Action

- [x] Build Process Images button.
- [x] Disable duplicate processing requests.
- [x] Display processing state.
- [ ] Display overall progress.
- [ ] Display current image.
- [ ] Display TinyPNG processing state when enabled.
- [x] Handle processing errors.
- [x] Allow successful results to remain visible.

## 13. Processing Concurrency

- [x] Implement controlled processing concurrency.
- [x] Prevent uncontrolled simultaneous Sharp jobs.
- [ ] Verify memory usage with batch processing.

# Phase 5 — HTML Generation

## 14. HTML Generator

- [x] Create HTML generator module.
- [x] Generate `<img>` markup.
- [x] Generate `<picture>` markup.
- [x] Generate `srcset`.
- [x] Generate `sizes`.
- [x] Generate width/height.
- [x] Generate alt attribute.
- [x] Generate loading attribute.
- [x] Generate decoding attribute.
- [x] Generate fetchpriority attribute.

## 15. HTML Settings UI

- [x] Build `<img>` / `<picture>` selector.
- [x] Build alt text input.
- [x] Build sizes input.
- [x] Build loading selector.
- [x] Build decoding selector.
- [x] Build fetchpriority selector.
- [ ] Build width/height option.
- [ ] Build srcset option.
- [ ] Build sizes option.

## 16. HTML Preview

- [x] Display generated HTML.
- [x] Add copy-to-clipboard action.
- [ ] Display copy-success feedback.
- [x] Ensure generated markup references only existing files.

# Phase 6 — Results

## 17. Results UI

- [x] Build results section.
- [x] Display generated variants.
- [x] Display dimensions.
- [x] Display file sizes.
- [x] Display reduction.
- [x] Add individual download action.
- [x] Add HTML copy action.

## 18. ZIP Download

- [x] Implement server-side ZIP generation.
- [x] Include generated files.
- [x] Use predictable ZIP naming.
- [x] Prevent unrelated session files from entering ZIP.
- [x] Add Download ZIP action.

# Phase 7 — Session Cleanup

## 19. Cleanup

- [x] Implement expired-session detection.
- [x] Implement recursive session deletion.
- [x] Handle missing files safely.
- [x] Handle cleanup errors without crashing server.
- [x] Add scheduled cleanup.
- [~] Verify 12-hour inactivity behavior.

# Phase 8 — Security and Hardening

## 20. Upload Security

- [x] Validate MIME/type.
- [x] Validate extension.
- [x] Enforce maximum upload size.
- [x] Sanitize filenames.
- [x] Prevent path traversal.
- [x] Prevent arbitrary output paths.

## 21. API Hardening

- [x] Validate API request payloads.
- [x] Reject malformed processing requests.
- [x] Ensure session ownership of files.
- [~] Prevent access to another session's files.
- [x] Ensure temporary directories are not publicly exposed.

# Phase 9 — Responsive UI

## 22. Desktop

- [~] Verify laptop layout.
- [~] Verify 1366px-width layout.
- [~] Verify larger desktop layout.
- [~] Verify long filenames.
- [~] Verify large image lists.

## 23. Smaller Screens

- [~] Verify tablet layout.
- [~] Verify mobile layout.
- [~] Verify settings stacking.
- [~] Verify no unwanted horizontal scrolling.
- [~] Verify touch-friendly controls.

# Phase 10 — Quality

## 24. Error Handling

- [~] Test invalid images.
- [~] Test corrupted images.
- [~] Test oversized uploads.
- [~] Test unsupported formats.
- [~] Test interrupted processing.
- [~] Test missing session directories.

## 25. Performance

- [~] Test one large image.
- [~] Test multiple large images.
- [~] Test multiple output widths.
- [~] Test multiple output formats.
- [~] Test batch processing.
- [ ] Test TinyPNG-enabled processing.
- [ ] Test TinyPNG WebP output.
- [ ] Test TinyPNG AVIF output.
- [ ] Test TinyPNG API failure handling.
- [ ] Verify no duplicate Tinify requests for the same resized variant.
- [~] Confirm controlled CPU/memory usage.

## 26. Deployment

- [~] Test production build.
- [~] Test cPanel Node.js environment.
- [x] Configure startup file.
- [~] Verify generated React assets are served.
- [~] Verify API routes work.
- [~] Verify Sharp works on production hosting.
- [~] Verify temporary storage permissions.
- [~] Verify cleanup process.

# Phase 11 — Final Verification

## 27. End-to-End Workflow

- [~] Upload image.
- [~] Configure sizes.
- [~] Configure formats.
- [~] Configure compression.
- [~] Process image.
- [~] Review generated files.
- [~] Generate HTML.
- [~] Copy HTML.
- [~] Download files.
- [~] Download ZIP.
- [~] Verify temporary cleanup.

A feature may only move to `Completed.md` after implementation and testing have both passed.
