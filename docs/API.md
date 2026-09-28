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

## V1 API

The API uses the same Sharp/Tinify processing core as the web UI. It is intended for trusted internal scripts and AI agents.

Current endpoints:

- `GET /api/v1` — API capabilities/version.
- `POST /api/v1/images/process` — upload and process an image in one request.
- `GET /api/v1/images/:jobId` — retrieve job/result metadata.
- `GET /api/v1/images/:jobId/files/:fileId/:filename` — download one generated result.
- `GET /api/v1/images/:jobId/zip` — download all generated variants as a ZIP.

The versioned ZIP endpoint uses the same job/session storage as the web application and requires the API Bearer key.

## Resource protection

Versioned API and MCP traffic is rate-limited in-process. Defaults are 60 requests per 60 seconds per Bearer credential, configurable with `IMAGE_TOOL_RATE_LIMIT` and `IMAGE_TOOL_RATE_WINDOW_MS`. Image processing is also limited to 2 concurrent jobs by default, configurable with `IMAGE_TOOL_MAX_CONCURRENT`.

When the rate limit is exceeded, the API returns HTTP 429 with `Retry-After`. Processing jobs wait for an available processing slot rather than running without a concurrency bound.

## Processing

The processing order is:

`Upload → Sharp resize → optional TinyPNG → result`

Supported settings include responsive widths, output formats, quality/lossless settings, metadata handling, no-upscale, TinyPNG WebP/AVIF and HTML generation options.

### Upscaling policy

`noUpscale` defaults to `true`.

AI agents **must not enable upscaling unless the user explicitly asks for it**. In particular, an agent should not set `noUpscale: false` merely because a requested responsive width is larger than the source image.

When `noUpscale` is `true`, widths larger than the source image width are skipped. If none of the requested widths fit, the source width is used as the output width.

When `noUpscale` is explicitly set to `false`, the server is allowed to generate output widths larger than the original image. These are genuine server-generated files produced from the supplied source image, but they cannot contain additional source detail and should not be represented as if the original image had that resolution.

**AI-agent rule:** preserve `noUpscale: true` unless the user specifically requests enlargement/upscaling. If the user asks for responsive variants but does not mention upscaling, do not upscale.

## API Key Generation

Generate a key with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Configure the resulting value as `IMAGE_TOOL_API_KEY` on the server.

## MCP over Streamable HTTP

The MCP endpoint is:

```text
POST /mcp
```

The current implementation supports the `2025-06-18` handshake-era protocol. It uses the same Bearer API key as the REST API and is stateless at the transport layer; generated image jobs remain available through the existing 12-hour session cleanup system.

Supported MCP methods:

- `initialize`
- `tools/list`
- `tools/call`
- `notifications/initialized`

Supported tools:

- `process_image` — accepts a base64 image and generates responsive variants.
- `get_image_result` — returns generated variants and metadata for a completed job.
- `download_image` — returns download URLs for generated variants.
- `generate_img_tag` — generates responsive `<img>` markup from a completed job.
- `generate_picture_tag` — generates responsive `<picture>` markup from a completed job.

### Example MCP initialize request

```http
POST /mcp
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Accept: application/json, text/event-stream
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": {
      "name": "example-agent",
      "version": "1.0.0"
    }
  }
}
```

The server negotiates `2025-06-18` and returns it in both the initialize result and `MCP-Protocol-Version` response header.

### Example tools/list request

After initialization, clients should send the negotiated protocol version in the `MCP-Protocol-Version` header:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

### Example process_image request

The image can be supplied as raw base64 or a data URL. The MCP image payload is limited to 25 MB after base64 decoding.

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "process_image",
    "arguments": {
      "image": "BASE64_IMAGE_DATA",
      "filename": "hero.jpg",
      "widths": [480, 768, 1024, 1280, 1440, 1920],
      "formats": ["webp", "avif"],
      "quality": 80,
      "noUpscale": true,
      "stripMetadata": true,
      "htmlType": "picture",
      "alt": "Example hero image",
      "sizes": "100vw"
    }
  }
}
```

The result contains a `jobId`, generated variants, actual generated dimensions, download URLs and optional HTML markup.

## Verification status

Repository-level MCP implementation and protocol-focused acceptance tests are present. API/MCP tests run in GitHub Actions on pushes and pull requests. Live verification with an actual MCP client against the running deployment remains required before marking MCP integration fully tested.
