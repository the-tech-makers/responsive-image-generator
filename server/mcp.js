import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile, readdir } from 'node:fs/promises';
import { extname, basename, join } from 'node:path';
import sharp from 'sharp';
import { processImage } from './image-processor.js';
import { createSession, touchSession, writeSessionManifest, readSession, readSessionManifest } from './session.js';
import { requireApiKey } from './api-auth.js';
import { generateImgTag, generatePictureTag } from './html-generator.js';

const MCP_PROTOCOL_VERSION = '2025-06-18';
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_REQUEST_BYTES = 35 * 1024 * 1024;
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const DEFAULT_WIDTHS = [480, 768, 1024, 1280, 1440, 1920];
const DEFAULT_FORMATS = ['webp'];

function json(res, status, payload, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function safeFilename(name) {
  const ext = extname(name).toLowerCase();
  if (!ALLOWED.has(ext)) throw new Error('Unsupported image type. Use JPG, PNG, WebP or AVIF.');
  const stem = basename(name, ext).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80) || 'image';
  return `${stem}-${randomUUID().slice(0, 8)}${ext}`;
}

function parseImage(value) {
  const encoded = String(value || '').replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  const buffer = Buffer.from(encoded, 'base64');
  if (!buffer.length) throw new Error('Image data is invalid.');
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error('Image exceeds 25 MB.');
  return buffer;
}

function resultPayload(processed, jobId, imageId) {
  return processed.results.map((item) => ({
    ...item,
    downloadUrl: `/api/v1/images/${jobId}/files/${imageId}/${encodeURIComponent(item.filename)}`,
  }));
}

const TOOLS = [
  {
    name: 'process_image',
    description: 'Process a base64 image into responsive sizes and formats, optionally using TinyPNG.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string' },
        filename: { type: 'string' },
        widths: { type: 'array', items: { type: 'integer', minimum: 1 } },
        formats: { type: 'array', items: { type: 'string', enum: ['webp', 'avif', 'jpeg', 'png'] } },
        quality: { type: 'integer', minimum: 1, maximum: 100 },
        lossless: { type: 'boolean' },
        noUpscale: { type: 'boolean' },
        stripMetadata: { type: 'boolean' },
        tinyPng: { type: 'object' },
        htmlType: { type: 'string', enum: ['img', 'picture'] },
        alt: { type: 'string' },
        sizes: { type: 'string' },
        loading: { type: 'string' },
        decoding: { type: 'string' },
        fetchpriority: { type: 'string' },
        sourceFormats: { type: 'array' },
        baseUrl: { type: 'string' },
      },
      required: ['image', 'filename'],
    },
  },
  {
    name: 'get_image_result',
    description: 'Get generated responsive image variants and metadata for a completed job.',
    inputSchema: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] },
  },
  {
    name: 'generate_img_tag',
    description: 'Generate responsive img markup from a completed job.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' }, alt: { type: 'string' }, sizes: { type: 'string' },
        loading: { type: 'string' }, decoding: { type: 'string' }, fetchpriority: { type: 'string' }, baseUrl: { type: 'string' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'generate_picture_tag',
    description: 'Generate responsive picture markup from a completed job.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' }, alt: { type: 'string' }, sizes: { type: 'string' },
        loading: { type: 'string' }, decoding: { type: 'string' }, sourceFormats: { type: 'array' }, baseUrl: { type: 'string' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'download_image',
    description: 'Return download URLs for all generated responsive image variants.',
    inputSchema: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] },
  },
];

async function processMcpImage(args, storageDir) {
  const jobId = randomUUID();
  const imageId = randomUUID();
  const filename = safeFilename(args.filename);
  const buffer = parseImage(args.image);
  const root = join(storageDir, 'sessions', jobId);
  const sourceDir = join(root, 'uploads');
  const outputDir = join(root, 'output', imageId);

  await createSession(storageDir, jobId);
  await mkdir(sourceDir, { recursive: true });
  const sourcePath = join(sourceDir, filename);
  await writeFile(sourcePath, buffer);
  await writeSessionManifest(storageDir, jobId, [{
    id: imageId,
    originalName: args.filename,
    filename,
    size: buffer.length,
    sessionId: jobId,
  }]);

  try {
    const processed = await processImage({
      sourcePath,
      outputDir,
      widths: Array.isArray(args.widths) && args.widths.length ? args.widths : DEFAULT_WIDTHS,
      formats: Array.isArray(args.formats) && args.formats.length ? args.formats : DEFAULT_FORMATS,
      quality: args.quality,
      lossless: args.lossless,
      stripMetadata: args.stripMetadata !== false,
      noUpscale: args.noUpscale !== false,
      tinyPng: args.tinyPng || null,
    });

    const results = resultPayload(processed, jobId, imageId);
    const opts = {
      alt: args.alt || '',
      sizes: args.sizes || '100vw',
      loading: args.loading || 'lazy',
      decoding: args.decoding || 'async',
      fetchpriority: args.fetchpriority || '',
      sourceFormats: args.sourceFormats || ['avif', 'webp'],
      baseUrl: args.baseUrl || '',
    };

    let html = null;
    if (args.htmlType === 'img') html = generateImgTag(processed.results, opts, opts.baseUrl);
    if (args.htmlType === 'picture') html = generatePictureTag(processed.results, opts, opts.baseUrl);

    await touchSession(storageDir, jobId);
    return {
      jobId,
      imageId,
      originalName: args.filename,
      source: { width: processed.sourceWidth, height: processed.sourceHeight },
      results,
      html,
    };
  } catch (error) {
    await rm(root, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

async function getJob(storageDir, jobId) {
  if (!await readSession(storageDir, jobId)) throw new Error('Job not found or expired.');
  const manifest = await readSessionManifest(storageDir, jobId);
  if (!manifest) throw new Error('Job result is unavailable.');
  return manifest;
}

async function jobResults(storageDir, jobId) {
  const manifest = await getJob(storageDir, jobId);
  const results = [];

  for (const file of manifest.files || []) {
    let entries = [];
    try {
      entries = await readdir(join(storageDir, 'sessions', jobId, 'output', file.id));
    } catch {
      continue;
    }

    for (const filename of entries) {
      const match = filename.match(/-(\d+)w\.(webp|avif|jpeg|jpg|png)$/i);
      if (!match) continue;
      const path = join(storageDir, 'sessions', jobId, 'output', file.id, filename);
      const meta = await sharp(path).metadata();
      results.push({
        filename,
        width: Number(match[1]),
        height: meta.height || 0,
        format: match[2].toLowerCase() === 'jpg' ? 'jpeg' : match[2].toLowerCase(),
        fileId: file.id,
        downloadUrl: `/api/v1/images/${jobId}/files/${file.id}/${encodeURIComponent(filename)}`,
      });
    }
  }

  return { manifest, results };
}

function mcpResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function requestedProtocolVersion(req) {
  return req.headers['mcp-protocol-version'] || '';
}

export async function handleMcpRequest(req, res, { storageDir }) {
  if (!requireApiKey(req, res)) return;

  if (req.method !== 'POST') {
    res.writeHead(405, {
      Allow: 'POST',
      'Cache-Control': 'no-store',
      'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
    });
    res.end();
    return;
  }

  try {
    const body = await new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_REQUEST_BYTES) {
          reject(new Error('MCP request exceeds 35 MB.'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
        } catch {
          reject(new Error('Invalid JSON request.'));
        }
      });
      req.on('error', reject);
    });

    if (body.method === 'initialize') {
      json(res, 200, {
        jsonrpc: '2.0',
        id: body.id ?? null,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: 'responsive-image-tool', version: '0.1.0' },
        },
      });
      return;
    }

    const protocolVersion = requestedProtocolVersion(req);
    if (protocolVersion && protocolVersion !== MCP_PROTOCOL_VERSION) {
      json(res, 400, {
        jsonrpc: '2.0',
        id: body.id ?? null,
        error: { code: -32600, message: `Unsupported MCP protocol version: ${protocolVersion}` },
      });
      return;
    }

    // MCP notifications do not have an id and require no JSON-RPC response body.
    if (body.method === 'notifications/initialized') {
      res.writeHead(202, {
        'Cache-Control': 'no-store',
        'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
      });
      res.end();
      return;
    }

    if (body.method === 'tools/list') {
      json(res, 200, { jsonrpc: '2.0', id: body.id ?? null, result: { tools: TOOLS } });
      return;
    }

    if (body.method !== 'tools/call') {
      json(res, 200, {
        jsonrpc: '2.0',
        id: body.id ?? null,
        error: { code: -32601, message: `Unsupported MCP method: ${body.method}` },
      });
      return;
    }

    const name = body.params?.name;
    const args = body.params?.arguments || {};
    if (!TOOLS.some((tool) => tool.name === name)) {
      json(res, 200, {
        jsonrpc: '2.0',
        id: body.id ?? null,
        error: { code: -32602, message: `Unknown tool: ${name}` },
      });
      return;
    }

    let result;

    if (name === 'process_image') {
      result = await processMcpImage(args, storageDir);
    } else if (name === 'get_image_result' || name === 'download_image') {
      const { manifest, results } = await jobResults(storageDir, args.jobId);
      if (!results.length) throw new Error('No generated variants are available.');
      await touchSession(storageDir, args.jobId);

      if (name === 'download_image') {
        result = {
          jobId: args.jobId,
          originalFiles: manifest.files || [],
          files: results.map(({ filename, width, height, format, fileId, downloadUrl }) => ({
            filename, width, height, format, fileId, downloadUrl,
          })),
        };
      } else {
        result = {
          jobId: args.jobId,
          originalFiles: manifest.files || [],
          results,
        };
      }
    } else {
      const { manifest, results } = await jobResults(storageDir, args.jobId);
      if (!results.length) throw new Error('No generated variants are available.');
      await touchSession(storageDir, args.jobId);

      const opts = {
        alt: args.alt || '',
        sizes: args.sizes || '100vw',
        loading: args.loading || 'lazy',
        decoding: args.decoding || 'async',
        fetchpriority: args.fetchpriority || '',
        sourceFormats: args.sourceFormats || ['avif', 'webp'],
        baseUrl: args.baseUrl || '',
      };
      const html = name === 'generate_img_tag'
        ? generateImgTag(results, opts, opts.baseUrl)
        : generatePictureTag(results, opts, opts.baseUrl);
      result = { jobId: args.jobId, html, originalFiles: manifest.files || [] };
    }

    json(res, 200, {
      jsonrpc: '2.0',
      id: body.id ?? null,
      result: mcpResult(result),
    });
  } catch (error) {
    json(res, 200, {
      jsonrpc: '2.0',
      id: body?.id ?? null,
      error: { code: -32000, message: error.message || 'MCP request failed.' },
    });
  }
}

export { TOOLS };
