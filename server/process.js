import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { processImage } from './image-processor.js';

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

export async function handleProcess(req, res, { storageDir }) {
  try {
    const payload = await readJson(req);
    const { sessionId, files, widths = DEFAULT_WIDTHS, formats = DEFAULT_FORMATS } = payload;

    if (!validSessionId(sessionId) || !Array.isArray(files) || !files.length) {
      send(res, 400, { error: 'A valid session and at least one image are required.' });
      return;
    }

    const safeFormats = formats.filter((format) => ['webp', 'avif', 'jpeg', 'png'].includes(format));
    if (!safeFormats.length) {
      send(res, 400, { error: 'Select at least one valid output format.' });
      return;
    }

    const outputRoot = join(storageDir, 'sessions', sessionId, 'output');
    const sessionRoot = join(storageDir, 'sessions', sessionId);
    const results = [];

    for (const file of files) {
      if (typeof file.filename !== 'string' || file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
        send(res, 400, { error: 'Invalid source file.' });
        return;
      }

      const sourcePath = join(sessionRoot, 'uploads', file.filename);
      const outputDir = join(outputRoot, file.id || file.filename.replace(/[^a-zA-Z0-9_-]/g, '-'));
      await mkdir(outputDir, { recursive: true });

      const processed = await processImage({
        sourcePath,
        outputDir,
        widths,
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
        results: processed.results,
      });
    }

    send(res, 200, { sessionId, results });
  } catch (error) {
    console.error(error);
    send(res, 400, { error: error.message || 'Processing failed.' });
  }
}
