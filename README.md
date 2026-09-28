# Responsive Image Tool

A responsive-image processing service and web application from The Tech Makers. It can generate responsive image variants, convert formats, optimize output, and expose the same processing capabilities through a versioned REST API and MCP server for AI agents and developer tooling.

## What it does

- Upload and process images into responsive widths.
- Generate WebP, AVIF, JPEG, and PNG variants.
- Control quality, lossless output, and metadata stripping.
- Optionally optimize generated WebP/AVIF files through TinyPNG.
- Generate production-ready `<img>` and `<picture>` markup.
- Download individual generated files or all variants as a ZIP.
- Process images through the REST API.
- Expose image processing and HTML-generation tools through MCP.
- Apply request rate limiting and controlled processing concurrency.
- Automatically clean up expired processing sessions.

### Upscaling policy

Responsive variants **do not upscale by default**.

For both the REST API and MCP, `noUpscale` defaults to `true`. Requested widths larger than the source image are skipped. An AI agent must **not enable upscaling merely because a requested responsive width is larger than the source**. Set `noUpscale: false` only when the user explicitly asks for enlargement/upscaling.

Upscaled output cannot contain additional source detail and should not be represented as if the original image had that resolution.

## Architecture

The project contains:

- **React + Vite + Tailwind CSS** frontend
- **Native Node.js HTTP server** for the application and APIs
- **Sharp/libvips** for image processing
- **Busboy** for multipart uploads
- **Tinify** for optional TinyPNG optimization
- **MCP endpoint** at `/mcp`
- **Versioned REST API** under `/api/v1`

The production startup entry point is `app.js`.

## API

The versioned API requires a Bearer API key configured through:

```text
IMAGE_TOOL_API_KEY=your-secret-key
```

Do not commit the API key or expose it to frontend code.

### API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1` | API capabilities and version information |
| POST | `/api/v1/images/process` | Upload/process an image and create a job |
| GET | `/api/v1/images/:jobId` | Retrieve job/result metadata |
| GET | `/api/v1/images/:jobId/files/:fileId/:filename` | Download an individual generated file |
| GET | `/api/v1/images/:jobId/zip` | Download all generated variants as a ZIP |

The API returns a job ID and generated-file metadata so clients can retrieve results individually or as a ZIP.

## MCP Server

The MCP endpoint is:

```text
POST /mcp
```

It uses the same Bearer API key:

```http
Authorization: Bearer YOUR_API_KEY
```

Available MCP tools:

- `process_image` — process an image and create responsive variants.
- `get_image_result` — retrieve generated variants and metadata.
- `download_image` — retrieve downloadable generated-file information.
- `generate_img_tag` — generate an `<img>` tag.
- `generate_picture_tag` — generate a responsive `<picture>` element.

The server currently negotiates MCP protocol version `2025-06-18`.

Example MCP client configuration:

```json
{
  "servers": {
    "responsive-images": {
      "url": "https://your-domain.example/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### AI-agent guidance

When an AI agent uses this server:

1. Preserve `noUpscale: true` unless the user explicitly requests upscaling.
2. Do not upscale just to satisfy a larger responsive breakpoint.
3. Use `process_image` to generate the requested widths and formats.
4. Use `generate_img_tag` or `generate_picture_tag` when the user needs implementation-ready HTML.
5. Treat generated larger-than-source variants as upscaled output when upscaling has explicitly been requested.

## Resource protection

The API and MCP endpoints are rate-limited by default:

- **60 requests per 60 seconds** per authorization credential.
- Configure with `IMAGE_TOOL_RATE_LIMIT` and `IMAGE_TOOL_RATE_WINDOW_MS`.

Image processing is limited to **2 concurrent jobs** by default.

Configure with:

```text
IMAGE_TOOL_MAX_CONCURRENT=2
```

Rate limiting returns HTTP `429` with a `Retry-After` header when the limit is exceeded. Processing requests wait for an available processing slot rather than running without a concurrency bound.

## TinyPNG

TinyPNG optimization is optional. When enabled, the application first creates the requested responsive sizes locally and then sends those resized images to Tinify for WebP or AVIF optimization.

Configure the API key only on the server:

```text
TINIFY_API_KEY=your-api-key
```

TinyPNG processing consumes the account's compression allowance.

## ZIP downloads

Versioned ZIP downloads use the host system's `zip` command. Verify that the production host provides `zip` before enabling the ZIP feature.

The legacy web route remains:

```text
GET /api/download-all?sessionId=...
```

The authenticated versioned API route is:

```text
GET /api/v1/images/:jobId/zip
```

## Development

Install dependencies:

```bash
npm install
```

Run the development environment:

```bash
npm run dev
```

The Vite development server provides the frontend and proxies API requests to the Node server.

Build the frontend:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Testing

Run the automated test suite:

```bash
npm test
```

The repository includes MCP protocol tests, API/ZIP tests, error-handling regression tests, and no-upscale behavior tests.

GitHub Actions runs the test suite on pushes to `main` and on pull requests.

## Environment variables

| Variable | Default | Purpose |
|---|---:|---|
| `IMAGE_TOOL_API_KEY` | — | Bearer authentication for REST API and MCP |
| `TINIFY_API_KEY` | — | Optional TinyPNG optimization |
| `IMAGE_TOOL_MAX_CONCURRENT` | `2` | Maximum concurrent image-processing jobs |
| `IMAGE_TOOL_RATE_LIMIT` | `60` | Requests allowed per rate-limit window |
| `IMAGE_TOOL_RATE_WINDOW_MS` | `60000` | Rate-limit window in milliseconds |

Never commit secrets to Git or expose server-only environment variables to frontend code.

## Project documentation

The detailed project source of truth is in `docs/`:

- `docs/Overview.md` — project overview and architecture
- `docs/Rules.md` — processing and product rules
- `docs/Design.md` — design and implementation decisions
- `docs/API.md` — REST API and MCP documentation
- `docs/Tasks.md` — implementation status and remaining work
- `docs/Tests.md` — UAT and test coverage
- `docs/Completed.md` — completed implementation history

## Deployment

The application is designed for Node.js 20 hosting, including supported cPanel Node.js environments.

Before production deployment:

1. Configure `IMAGE_TOOL_API_KEY`.
2. Configure `TINIFY_API_KEY` only if TinyPNG optimization is required.
3. Ensure the host provides the `zip` command if ZIP downloads are enabled.
4. Run `npm run build`.
5. Run `npm test`.
6. Start the production server with `npm start`.
7. Verify the REST API and MCP endpoint from an actual client.
8. Monitor resource usage and adjust concurrency/rate-limit settings for the hosting environment.

## Current scope

The current version is intentionally focused on responsive image processing and developer/AI-agent integration. It does not require a database, project presets, or cloud object storage.

The API key, TinyPNG key, processing limits, and other server configuration remain server-side concerns.
