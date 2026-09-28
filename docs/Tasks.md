# Responsive Image Tool — Development Tasks

Tasks are ordered by dependency and priority.

> **Current verification status (2026-09-28):** TinyPNG/Tinify code has been implemented and reviewed in the repository. API/MCP expansion is now underway. Live API/UAT verification remains pending until deployment testing is performed.

Status values:

- [ ] Not started
- [~] In progress / awaiting verification
- [x] Completed and tested

# Phase 12 — API / MCP Interface

## 28. API Foundation
- [x] Add versioned `/api/v1` routing.
- [x] Add `IMAGE_TOOL_API_KEY` server configuration.
- [x] Implement Bearer API-key authentication.
- [x] Reject missing/invalid API keys without leaking configuration details.
- [x] Add API capability/version endpoint.
- [x] Reuse the existing image-processing core; do not duplicate Sharp/Tinify logic.

## 29. Image Processing API
- [x] Implement `POST /api/v1/images/process` multipart upload endpoint.
- [x] Accept responsive widths and validate them through the processing pipeline.
- [x] Accept output format/compression settings.
- [x] Accept TinyPNG WebP/AVIF settings.
- [x] Accept HTML-generation settings.
- [x] Return a stable job/result identifier.
- [x] Return generated variants and download URLs.
- [x] Ensure API jobs use isolated temporary storage.
- [x] Ensure API jobs participate in existing 12-hour cleanup.

## 30. Result and Download API
- [x] Implement `GET /api/v1/images/:jobId`.
- [x] Implement individual generated-file download.
- [ ] Implement ZIP download through versioned API.
- [x] Reject expired/nonexistent jobs.
- [x] Prevent access to another job/session's files.
- [x] Never expose filesystem paths in API responses.

## 31. HTML API
- [x] Implement `<img>` generation through API.
- [x] Implement `<picture>` generation through API.
- [x] Generate `srcset` from actual generated files.
- [x] Support `sizes`, width, height, alt, loading, decoding and fetchpriority.
- [x] Keep alt text blank when not supplied.
- [x] Return HTML as structured JSON.
- [~] Verify generated HTML against live API output.

## 32. MCP Interface
- [ ] Define MCP tools around the existing API/core capabilities.
- [ ] Add `process_image` tool.
- [ ] Add `get_image_result` tool.
- [ ] Add `download_image` tool/resource.
- [ ] Add `generate_img_tag` tool.
- [ ] Add `generate_picture_tag` tool.
- [ ] Authenticate MCP requests using the same server-side API-key mechanism.
- [ ] Ensure MCP does not duplicate processing logic.

## 33. API Security and Resource Protection
- [x] Add API upload/body limits.
- [x] Add validation for API processing parameters.
- [ ] Apply controlled processing concurrency to API jobs.
- [ ] Add rate limiting before external/public use.
- [x] Ensure TinyPNG API keys are never exposed through API/MCP.
- [ ] Add API-specific acceptance tests.

## 34. API/MCP Documentation
- [x] Document API authentication.
- [x] Document processing request schema.
- [~] Document result schema.
- [x] Document HTML generation options.
- [ ] Document MCP tools and parameters.
- [ ] Add API usage examples for AI agents.
