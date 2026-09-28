import { requireApiKey } from './api-auth.js';
import { handleApiV1Process, handleApiV1Result } from './api-v1.js';

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

const TOOLS = [
  {
    name: 'process_image',
    description: 'Upload an image and generate responsive sizes and formats. Optionally optimize resized variants with TinyPNG and generate HTML markup.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data.' },
        filename: { type: 'string' },
        widths: { type: 'array', items: { type: 'integer' } },
        formats: { type: 'array', items: { type: 'string', enum: ['webp', 'avif', 'jpeg', 'png'] } },
        quality: { type: 'integer', minimum: 1, maximum: 100 },
        lossless: { type: 'boolean' },
        noUpscale: { type: 'boolean' },
        tinyPng: { type: 'object', properties: { enabled: { type: 'boolean' }, format: { type: 'string', enum: ['webp', 'avif'] } } },
        htmlType: { type: 'string', enum: ['img', 'picture'] },
        alt: { type: 'string' }, sizes: { type: 'string' }, loading: { type: 'string' }, decoding: { type: 'string' },
      },
      required: ['image', 'filename'],
    },
  },
  {
    name: 'get_image_result',
    description: 'Get the generated image variants and metadata for a processing job.',
    inputSchema: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] },
  },
  {
    name: 'generate_img_tag',
    description: 'Generate responsive HTML img markup from generated image variants.',
    inputSchema: { type: 'object', properties: { jobId: { type: 'string' }, alt: { type: 'string' }, sizes: { type: 'string' }, loading: { type: 'string' }, decoding: { type: 'string' }, fetchpriority: { type: 'string' } }, required: ['jobId'] },
  },
  {
    name: 'generate_picture_tag',
    description: 'Generate responsive picture markup using available AVIF/WebP variants and a fallback.',
    inputSchema: { type: 'object', properties: { jobId: { type: 'string' }, alt: { type: 'string' }, sizes: { type: 'string' }, loading: { type: 'string' }, decoding: { type: 'string' }, sourceFormats: { type: 'array', items: { type: 'string', enum: ['avif', 'webp'] } } }, required: ['jobId'] },
  },
  {
    name: 'download_image',
    description: 'Return download URLs for generated image variants from a processing job.',
    inputSchema: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] },
  },
];

function requestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (chunk) => { size += chunk.length; if (size > 35 * 1024 * 1024) { reject(new Error('MCP request exceeds 35 MB.')); req.destroy(); return; } chunks.push(chunk); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('Invalid JSON request.')); } });
    req.on('error', reject);
  });
}

function mcpResult(result) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

export async function handleMcpRequest(req, res, context) {
  if (!requireApiKey(req, res)) return;
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method !== 'POST') { json(res, 405, { error: 'MCP endpoint requires POST.' }); return; }
  try {
    const body = await requestBody(req);
    if (body.method === 'initialize') {
      json(res, 200, { jsonrpc: '2.0', id: body.id ?? null, result: { protocolVersion: body.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'responsive-image-tool', version: '0.1.0' } } }); return;
    }
    if (body.method === 'tools/list') {
      json(res, 200, { jsonrpc: '2.0', id: body.id ?? null, result: { tools: TOOLS } }); return;
    }
    if (body.method !== 'tools/call') { json(res, 200, { jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: `Unsupported MCP method: ${body.method}` } }); return; }

    const name = body.params?.name; const args = body.params?.arguments || {};
    if (!TOOLS.some((tool) => tool.name === name)) { json(res, 200, { jsonrpc: '2.0', id: body.id ?? null, error: { code: -32602, message: `Unknown tool: ${name}` } }); return; }

    if (name === 'get_image_result' || name === 'download_image' || name === 'generate_img_tag' || name === 'generate_picture_tag') {
      const fakeReq = { ...req, headers: req.headers };
      if (name === 'get_image_result' || name === 'download_image') {
        const capture = { status: 200, body: null, headers: {} };
        const fakeRes = { writeHead(status, headers) { capture.status = status; capture.headers = headers; }, end(value) { capture.body = JSON.parse(value); } };
        await handleApiV1Result(fakeReq, fakeRes, context, args.jobId);
        if (capture.status !== 200) throw new Error(capture.body?.error || 'Job not found or expired.');
        if (name === 'download_image') { const files = capture.body.files || []; return json(res, 200, { jsonrpc: '2.0', id: body.id ?? null, result: mcpResult({ jobId: args.jobId, files: files.map((file) => ({ ...file, downloadUrl: file.downloadUrl || `/api/v1/images/${args.jobId}/files/${file.id}/${encodeURIComponent(file.filename)}` })) }) }); }
        return json(res, 200, { jsonrpc: '2.0', id: body.id ?? null, result: mcpResult(capture.body) });
      }
      throw new Error('HTML generation by jobId requires generated variant retrieval; use the HTTP HTML API until the MCP resource adapter is enabled.');
    }

    throw new Error('The process_image MCP tool uses multipart image transport; call the HTTP image-processing API for binary uploads until MCP binary resource transport is enabled.');
  } catch (error) {
    json(res, 200, { jsonrpc: '2.0', id: null, error: { code: -32000, message: error.message || 'MCP request failed.' } });
  }
}

export { TOOLS };
