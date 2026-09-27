# Responsive Image Tool — Project Overview

## 1. Purpose

The Responsive Image Tool is an internal web application for The Tech Makers team.

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

The application is **not intended to be a public SaaS product**.

It does not need:

- Public user registration.
- Billing.
- Subscription management.
- Customer accounts.
- Public APIs.
- Multi-tenant project management.

Authentication may be added in the future if the application becomes accessible outside the trusted internal environment.

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
- HTML generation options.

### Process
The server processes the images using Sharp.

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

No database is required for V1.

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

The frontend must not perform server-side image processing.

## 6. Image Processing

Sharp is the primary image-processing engine.

The application should support:

- JPEG/JPG input.
- PNG input.
- WebP input.
- AVIF input.

Output formats should initially include:

- WebP.
- AVIF.
- JPEG.
- PNG.

Additional formats may be considered later.

The system must preserve the original aspect ratio.

The system must never upscale an image when "Don't upscale" is enabled.

## 7. Responsive Image Generation

The application should support configurable output widths.

Initial suggested widths:

- 480px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

Users should also be able to specify custom widths.

Widths larger than the source image should normally be skipped when "Don't upscale" is enabled.

## 8. HTML Generation

The application should automatically generate production-ready markup.

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

## 9. Temporary File Lifecycle

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

## 10. V1 Philosophy

V1 should remain intentionally simple.

The application should prioritize:

- Speed.
- Reliability.
- Clear UX.
- Small codebase.
- Easy deployment.
- Easy maintenance.
- Predictable image output.

Avoid premature infrastructure such as:

- Databases.
- Redis.
- Queues.
- Docker.
- Microservices.
- Cloud object storage.
- User accounts.
- Project management systems.

These may be introduced only when a real requirement exists.

## 11. Deployment

The application is intended to run on shared cPanel hosting supporting:

- Node.js 20.
- Sharp.
- Approximately 6 GB RAM.
- Approximately 6 CPU cores.

The application should use the port supplied by the hosting environment.

The main Node startup file will be:

`app.js`

The domain/subdomain can be connected after the application is operational.

## 12. Long-Term Direction

The architecture should remain extensible enough to support future additions such as:

- Authentication.
- Saved presets.
- Direct project output.
- More image formats.
- Additional optimization options.
- Advanced responsive-image strategies.

However, these features are outside V1 and must not complicate the initial implementation.
