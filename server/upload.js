import Busboy from 'busboy';
import { createWriteStream, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

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

  if (!contentType.startsWith('multipart/form-data')) {
    json(res, 415, { error: 'Multipart form data is required.' });
    return;
  }

  const sessionId = randomUUID();
  const sessionDir = join(storageDir, 'sessions', sessionId);
  const uploadDir = join(sessionDir, 'uploads');

  mkdirSync(uploadDir, { recursive: true });

  const files = [];
  const pending = [];
  let totalBytes = 0;
  let rejected = null;

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      files: 50,
      fileSize: MAX_FILE_SIZE,
    },
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

    const writePromise = new Promise((resolve, reject) => {
      const output = createWriteStream(path);

      file.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_FILE_SIZE * 50) {
          file.destroy(new Error('Request is too large.'));
        }
      });

      file.on('limit', () => {
        reject(new Error(`File exceeds 25 MB: ${info.filename}`));
      });

      file.on('error', reject);
      output.on('error', reject);
      output.on('finish', resolve);

      file.pipe(output);
    }).then(async () => {
      const metadata = await sharp(path).metadata();

      files.push({
        id: randomUUID(),
        originalName: info.filename,
        filename,
        path,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: totalBytes,
        format: metadata.format || null,
      });
    });

    pending.push(writePromise);
  });

  busboy.on('error', (error) => {
    rejected = error.message;
  });

  busboy.on('finish', async () => {
    try {
      await Promise.all(pending);

      if (rejected) {
        json(res, 400, { error: rejected });
        return;
      }

      json(res, 201, {
        sessionId,
        files,
      });
    } catch (error) {
      console.error(error);
      json(res, 400, { error: error.message || 'Upload failed.' });
    }
  });

  req.pipe(busboy);
}
