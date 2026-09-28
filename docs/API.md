# Image Tool API / MCP

## Authentication

Machine access uses a server-side API key configured as:

```env
IMAGE_TOOL_API_KEY=your-generated-key
```

Send it as:

```http
Authorization: Bearer YOUR_API_KEY
```

The key must never be exposed to frontend code or committed to Git.

## V1 Direction

The API uses the same Sharp/Tinify processing core as the web UI. It is intended for trusted internal scripts and AI agents.

Planned endpoints:

- `GET /api/v1` — API capabilities/version.
- `POST /api/v1/images/process` — upload and process an image in one request.
- `GET /api/v1/images/:jobId` — retrieve generated result metadata.
- `GET /api/v1/images/:jobId/files/:fileId` — download one result.
- `GET /api/v1/images/:jobId/download` — download results as ZIP.
- `POST /api/v1/images/:jobId/html` — generate `<img>` or `<picture>` markup.

## Processing

The processing order is:

`Upload → Sharp resize → optional TinyPNG → result`

Supported settings include responsive widths, output formats, quality/lossless settings, metadata handling, no-upscale, TinyPNG WebP/AVIF and HTML generation options.

## API Key Generation

Generate a key with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Configure the resulting value as `IMAGE_TOOL_API_KEY` on the server.

## MCP

The MCP layer will expose focused tools over the same capabilities, including `process_image`, `get_image_result`, `download_image`, `generate_img_tag` and `generate_picture_tag`. MCP must not duplicate image-processing logic.
