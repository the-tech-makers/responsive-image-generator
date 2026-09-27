import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { processImage } from './image-processor.js';
import { touchSession } from './session.js';

const DEFAULT_WIDTHS = [480, 768, 1024, 1280, 1440, 1920];
const DEFAULT_FORMATS = ['webp'];

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024) throw new Error('Request body is too large.');
  }
  return JSON.parse(body || '{}');
}

function validSessionId(value) {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value);
}

function safeId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}

function normalizeWidths(widths) {
  if (!Array.isArray(widths)) return DEFAULT_WIDTHS;
  return [...new Set(widths.map(Number).filter((width) => Number.isInteger(width) && width > 0 && width <= 10000))]
    .sort((a, b) => a - b);
}

export async function handleProcess(req, res, { storageDir }) {
  try {
    const payload = await readJson(req);
    const { sessionId, files, formats = DEFAULT_FORMATS } = payload;

    if (!validSessionId(sessionId) || !Array.isArray(files) || !files.length) {
      send(res, 400, { error: 'A valid session and at least one image are required.' });
      return;
    }

    const safeFormats = formats.filter((format) => ['webp', 'avif', 'jpeg', 'png'].includes(format));
    const safeWidths = normalizeWidths(payload.widths);

    if (!safeFormats.length || !safeWidths.length) {
      send(res, 400, { error: 'Select at least one valid width and output format.' });
      return;
    }

    const sessionRoot = join(storageDir, 'sessions', sessionId);
    const outputRoot = join(sessionRoot, 'output');
    const results = [];

    for (const file of files) {
      if (
        typeof file.filename !== 'string' ||
        file.filename.includes('..') ||
        file.filename.includes('/') ||
        file.filename.includes('\\') ||
        !safeId(file.id)
      ) {
        send(res, 400, { error: 'Invalid source file.' });
        return;
      }

      const sourcePath = join(sessionRoot, 'uploads', file.filename);
      const outputDir = join(outputRoot, file.id);
      await mkdir(outputDir, { recursive: true });

      const processed = await processImage({
        sourcePath,
        outputDir,
        widths: safeWidths,
        formats: safeFormats,
        quality: Math.min(100, Math.max(1, Number(payload.quality) || 80)),
        lossless: Boolean(payload.lossless),
        stripMetadata: payload.stripMetadata !== false,
        noUpscale: payload.noUpscale !== false,
      });

      results.push({
        id: file.id,
        originalName: file.originalName,
        sourceWidth: processed.sourceWidth,
        sourceHeight: processed.sourceHeight,
        results: processed.results.map((item) => ({
          filename: item.filename,
          width: item.width,
          height: item.height,
          format: item.format,
          mime: item.mime,
          size: item.size,
          sourceSize: item.sourceSize,
          downloadUrl: `/api/download?sessionId=${encodeURIComponent(sessionId)}&fileId=${encodeURIComponent(file.id)}&filename=${encodeURIComponent(item.filename)}`,
        })),
      });
    }

    await touchSession(storageDir, sessionId);
    send(res, 200, { sessionId, results });
  } catch (error) {
    console.error(error);
    send(res, 400, { error: error.message || 'Processing failed.' });
  }
}
