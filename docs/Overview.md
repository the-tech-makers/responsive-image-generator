# Responsive Image Generator — Project Overview

## 1. Purpose

The Responsive Image Generator is an internal web application for The Tech Makers team.

Its primary purpose is to reduce the repetitive work involved in preparing website images for production.

The application should allow a user to:

1. Upload one or multiple images.
2. Inspect image dimensions and file sizes.
3. Generate responsive image sizes.
4. Convert images to modern formats such as WebP and AVIF.
5. Compress images using lossy or lossless processing.
6. Strip unnecessary metadata when requested.
7. Prevent unnecessary image upscaling.
8. Generate responsive `srcset` markup automatically.
9. Generate `<img>` or `<picture>` HTML.
10. Copy generated HTML directly to the clipboard.
11. Download processed images individually or as a ZIP.
12. Automatically remove temporary files after the session expires.

The application is intended to save development time and maintain a consistent image-optimization workflow across projects.

## 2. Target User

The primary users are:

- The Tech Makers development team.
- Designers/developers preparing website assets.
- Internal team members who need production-ready responsive images.

The application is currently intended as an internal developer utility rather than a public SaaS product.

Machine access is available through an authenticated REST API and MCP endpoint for trusted scripts and AI agents.

## 3. Core Workflow

Upload → Configure → Process → Review → Copy/Download

### Upload
The user uploads one or multiple supported image files.

### Configure
The user selects:

- Responsive widths.
- Output formats.
- Compression mode.
- Quality.
- Metadata handling.
- Optional TinyPNG/Tinify compression.
- TinyPNG preferred output format: WebP or AVIF.
- HTML generation options.

### Process
The server processes the images using Sharp.

If TinyPNG compression is enabled, processing follows a second optimization stage:

1. Generate the requested responsive dimensions locally with Sharp.
2. Send each resized image selected for TinyPNG optimization to the Tinify API.
3. Convert the optimized result to the user's preferred TinyPNG format: WebP or AVIF.
4. Store the optimized result in the temporary session output directory.
5. Present the TinyPNG result as the downloadable final variant.

The TinyPNG API key must remain server-side and must never be exposed to the browser. TinyPNG processing is optional and must not prevent the normal local Sharp workflow from being used when the option is disabled.

### Review
The interface displays:

- Generated dimensions.
- Output format.
- Output file size.
- Original file size.
- Compression/reduction information.

### Copy / Download
The user can:

- Copy generated HTML.
- Download individual files.
- Download all generated files as a ZIP.

## 4. Technology Stack

### Frontend

- React
- Tailwind CSS
- Vite
- Vanilla browser APIs where appropriate

### Backend

- Node.js 20
- Native Node.js `http` module
- Busboy or equivalent lightweight multipart parser for uploads
- Sharp/libvips for image processing
- Node.js filesystem APIs for temporary storage

### Storage

Temporary filesystem storage only.

No database is required.

## 5. Application Architecture

The application consists of two logical layers.

### Frontend

Responsible for:

- UI.
- User interaction.
- Application state.
- Upload selection.
- Configuration.
- Processing progress.
- Results presentation.
- HTML preview/copying.

### Backend

Responsible for:

- Receiving uploads.
- Session management.
- Image processing.
- File generation.
- ZIP generation.
- Temporary storage.
- Cleanup.
- Authenticated REST API access.
- MCP request handling.

The frontend must not perform server-side image processing.

## 6. Image Processing

Sharp is the primary image-processing engine.

The application should support:

- JPEG/JPG input.
- PNG input.
- WebP input.
- AVIF input.

Output formats include:

- WebP.
- AVIF.
- JPEG.
- PNG.

The system must preserve the original aspect ratio.

The system must not upscale an image by default. `noUpscale` defaults to `true` for API and MCP processing. Larger widths may be generated only when upscaling is explicitly requested.

## 7. TinyPNG / Tinify Integration

TinyPNG/Tinify is an optional final optimization stage.

### Processing order

The required order is:

**Upload → Resize with Sharp → TinyPNG compression/conversion → Review → Copy/Download**

TinyPNG must never replace the local responsive resizing stage.

### Preferred format

When TinyPNG compression is enabled, the user must choose one final format:

- WebP
- AVIF

Each resized image is submitted to the Tinify API and the returned optimized image is stored locally for download.

### API configuration

The API key is supplied through the server environment:

`TINIFY_API_KEY`

It must never be sent to the frontend or committed to Git.

### Failure behavior

A TinyPNG API failure should be reported clearly. The application must not silently present an unoptimized file as a TinyPNG-compressed result.

## 8. Responsive Image Generation

The application supports configurable output widths.

Initial suggested widths:

- 480px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

Users can also specify custom widths.

Widths larger than the source image are skipped when `noUpscale` is enabled.

## 9. HTML Generation

The application automatically generates production-ready markup.

Supported output:

- `<img>`
- `<picture>`

Generated markup may include:

- `src`
- `srcset`
- `sizes`
- `width`
- `height`
- `alt`
- `loading`
- `decoding`
- `fetchpriority`

If the user does not provide alt text, the generated markup must use `alt=""`.

The application must never automatically invent alt text.

## 10. Temporary File Lifecycle

Uploaded and generated files are temporary.

Each browser session receives its own storage area.

Example:

```
storage/sessions/<session-id>/
    uploads/
    output/
```

Temporary files should automatically expire.

Initial target:

**12 hours after inactivity.**

A scheduled cleanup process should periodically remove expired sessions.

The cleanup mechanism must not depend solely on the user closing their browser.

## 11. API and AI-Agent Integration

The Responsive Image Generator exposes the same processing engine through:

- Authenticated REST API under `/api/v1`.
- MCP endpoint at `/mcp`.

AI agents must preserve `noUpscale: true` unless the user explicitly requests enlargement/upscaling. A larger responsive breakpoint is not, by itself, permission to upscale.

API and MCP traffic is rate-limited, and image processing is bounded by a configurable concurrency limit.

## 12. Deployment

The application is intended to run on Node.js 20 hosting, including supported cPanel Node.js environments.

The application should use the port supplied by the hosting environment.

The main Node startup file is:

`app.js`

The production environment must configure the API key server-side. If ZIP downloads are enabled, the host must provide the `zip` command.

## 13. Long-Term Direction

The architecture should remain extensible enough to support future additions such as:

- Authentication expansion.
- Saved presets.
- Direct project output.
- More image formats.
- Additional optimization options.
- Advanced responsive-image strategies.

The existing API/MCP architecture should remain stable as new capabilities are added.
