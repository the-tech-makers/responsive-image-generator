import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { touchSession } from './session.js';

function validSessionId(value) {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value);
}

function safePart(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}

function safeFilename(value) {
  return typeof value === 'string'
    && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}$/.test(value)
    && !value.includes('..');
}

export async function handleDownload(req, res, { storageDir }) {
  const url = new URL(req.url || '/', 'http://localhost');
  const sessionId = url.searchParams.get('sessionId');
  const fileId = url.searchParams.get('fileId');
  const filename = url.searchParams.get('filename');

  if (!validSessionId(sessionId) || !safePart(fileId) || !safeFilename(filename)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Invalid download request.');
    return;
  }

  const filePath = join(storageDir, 'sessions', sessionId, 'output', fileId, filename);

  try {
    const fileStat = await stat(filePath);
    await touchSession(storageDir, sessionId);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileStat.size,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('File not found.');
  }
}
