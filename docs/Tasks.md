# Responsive Image Tool — Development Tasks

Tasks are ordered by dependency and priority.

> **Current verification status (2026-09-28):** API/MCP implementation is substantially complete at repository level. The `/mcp` route is now wired into the Node dispatcher, MCP protocol handling has been hardened, and native protocol-focused acceptance tests have been added. Live deployment and verification with a real MCP client remain pending.

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
- [x] Implement ZIP download through versioned API.
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
- [~] Verify generated HTML against live API output — repository coverage is present; live deployment verification remains pending.

## 32. MCP Interface
- [x] Define MCP tools and input schemas.
- [x] Implement `process_image` with base64 image input and 25 MB image limit.
- [x] Implement MCP image processing using the shared Sharp/Tinify engine.
- [x] Implement `get_image_result`.
- [x] Implement `download_image` result URLs.
- [x] Implement job-backed `generate_img_tag`.
- [x] Implement job-backed `generate_picture_tag`.
- [x] Authenticate MCP requests using the same server-side API-key mechanism.
- [x] Ensure MCP does not duplicate image-processing logic.
- [~] Expose MCP endpoint at `/mcp` — route is wired through the Node dispatcher; live deployment verification remains pending.
- [~] Verify MCP response behavior with a real MCP client.

## 33. API Security and Resource Protection
- [x] Add API upload/body limits.
- [x] Add validation for API processing parameters.
- [x] Apply controlled processing concurrency to API jobs.
- [x] Add rate limiting before external/public use.
- [x] Ensure TinyPNG API keys are never exposed through API/MCP.
- [x] Add API/MCP acceptance tests — native Node MCP/API tests added and wired into GitHub Actions CI.

## 34. API/MCP Documentation
- [x] Document API authentication.
- [x] Document processing request schema.
- [x] Document default no-upscaling behavior and AI-agent upscaling policy.
- [x] Document result schema.
- [x] Document HTML generation options.
- [x] Document MCP tools and parameters.
- [x] Add API/MCP usage examples for AI agents.
