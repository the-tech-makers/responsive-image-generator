import Busboy from 'busboy';
import { createWriteStream, mkdirSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { extname, basename, join } from 'node:path';
import { rm } from 'node:fs/promises';
import sharp from 'sharp';
import { touchSession } from './session.js';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_REQUEST_SIZE = 250 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const MIME_BY_FORMAT = new Set(['jpeg', 'png', 'webp', 'avif']);

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function safeName(filename) {
  const extension = extname(filename).toLowerCase();
  const stem = basename(filename, extname(filename))
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'image';
  return `${stem}-${randomUUID().slice(0, 8)}${extension}`;
}

export async function handleUpload(req, res, { storageDir }) {
  const contentType = req.headers['content-type'] || '';
  const declaredLength = Number(req.headers['content-length'] || 0);

  if (!contentType.startsWith('multipart/form-data')) {
    json(res, 415, { error: 'Multipart form data is required.' });
    return;
  }
  if (declaredLength > MAX_REQUEST_SIZE) {
    json(res, 413, { error: 'Upload request is too large.' });
    return;
  }

  const sessionId = randomUUID();
  const sessionRoot = join(storageDir, 'sessions', sessionId);
  const uploadDir = join(sessionRoot, 'uploads');
  mkdirSync(uploadDir, { recursive: true });

  const files = [];
  const pending = [];
  let requestBytes = 0;
  let rejected = null;

  const busboy = Busboy({
    headers: req.headers,
    limits: { files: 50, fileSize: MAX_FILE_SIZE, parts: 60 },
  });

  busboy.on('file', (fieldName, file, info) => {
    if (fieldName !== 'images') {
      file.resume();
      return;
    }

    const extension = extname(info.filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      rejected = `Unsupported file type: ${info.filename}`;
      file.resume();
      return;
    }

    const filename = safeName(info.filename);
    const path = join(uploadDir, filename);

    const pendingFile = new Promise((resolve, reject) => {
      const output = createWriteStream(path);
      let fileBytes = 0;
      let settled = false;

      const fail = (error) => {
        if (settled) return;
        settled = true;
        output.destroy();
        reject(error);
      };

      file.on('data', (chunk) => {
        fileBytes += chunk.length;
        requestBytes += chunk.length;
        if (requestBytes > MAX_REQUEST_SIZE) {
          rejected = 'Upload request is too large.';
          file.destroy(new Error(rejected));
        }
      });

      file.on('limit', () => fail(new Error(`File exceeds 25 MB: ${info.filename}`)));
      file.on('error', fail);
      output.on('error', fail);

      output.on('finish', async () => {
        if (settled) return;
        try {
          if (!fileBytes) throw new Error(`Empty file: ${info.filename}`);
          const metadata = await sharp(path).metadata();

          if (!metadata.format || !MIME_BY_FORMAT.has(metadata.format)) {
            throw new Error(`Invalid or unsupported image: ${info.filename}`);
          }

          files.push({
            id: randomUUID(),
            originalName: info.filename,
            filename,
            width: metadata.width || 0,
            height: metadata.height || 0,
            size: statSync(path).size,
            format: metadata.format,
            sessionId,
          });

          settled = true;
          resolve();
        } catch (error) {
          fail(error);
        }
      });

      file.pipe(output);
    });

    pending.push(pendingFile);
  });

  busboy.on('error', (error) => { rejected = error.message; });

  busboy.on('finish', async () => {
    try {
      await Promise.all(pending);

      if (rejected) {
        await rm(sessionRoot, { recursive: true, force: true });
        json(res, 400, { error: rejected });
        return;
      }

      if (!files.length) {
        await rm(sessionRoot, { recursive: true, force: true });
        json(res, 400, { error: 'No valid images were uploaded.' });
        return;
      }

      await touchSession(storageDir, sessionId);
      json(res, 201, { sessionId, files });
    } catch (error) {
      console.error(error);
      await rm(sessionRoot, { recursive: true, force: true });
      json(res, 400, { error: error.message || 'Upload failed.' });
    }
  });

  req.on('aborted', () => { rejected = 'Upload request was aborted.'; });
  req.pipe(busboy);
}
