import { handleUpload } from './upload.js';
import { handleProcess } from './process.js';
import { handleDownload } from './download.js';
import { handleZip, handleApiV1Zip } from './zip.js';
import { handleApiV1Info, handleApiV1Process, handleApiV1Result } from './api-v1.js';
import { handleMcpRequest } from './mcp.js';
import { requireApiKey } from './api-auth.js';
import { checkRateLimit } from './resource-limits.js';

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

export async function handleApiRequest(req, res, context) {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;
  if (path === '/mcp' || path.startsWith('/mcp/')) {
    if (!checkRateLimit(req, res)) return;
    await handleMcpRequest(req, res, context);
    return;
  }
  if (req.method === 'GET' && path === '/api/health') { sendJson(res, 200, { ok: true }); return; }
  if (path === '/api/v1') {
    if (!checkRateLimit(req, res)) return;
    if (req.method === 'GET') await handleApiV1Info(req, res); else sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }
  if (path.startsWith('/api/v1/')) {
    if (!checkRateLimit(req, res)) return;
    if (req.method === 'POST' && path === '/api/v1/images/process') { await handleApiV1Process(req, res, context); return; }
    const resultMatch = path.match(/^\/api\/v1\/images\/([0-9a-f-]{36})$/);
    if (req.method === 'GET' && resultMatch) { await handleApiV1Result(req, res, context, resultMatch[1]); return; }
    const zipMatch = path.match(/^\/api\/v1\/images\/([0-9a-f-]{36})\/zip$/);
    if (req.method === 'GET' && zipMatch) { await handleApiV1Zip(req, res, context, zipMatch[1]); return; }
    const fileMatch = path.match(/^\/api\/v1\/images\/([0-9a-f-]{36})\/files\/([a-zA-Z0-9-]{36})\/(.+)$/);
    if (req.method === 'GET' && fileMatch) { await handleApiV1File(req, res, context, fileMatch[1], fileMatch[2], decodeURIComponent(fileMatch[3])); return; }
    sendJson(res, 404, { error: 'API route not found' });
    return;
  }

  if (req.method === 'POST' && path === '/api/upload') { await handleUpload(req, res, context); return; }
  if (req.method === 'POST' && path === '/api/process') { await handleProcess(req, res, context); return; }
  if (req.method === 'GET' && path === '/api/download') { await handleDownload(req, res, context); return; }
  if (req.method === 'GET' && path === '/api/download-all') { await handleZip(req, res, context); return; }
  sendJson(res, 404, { error: 'API route not found' });
}

async function handleApiV1File(req, res, { storageDir }, jobId, imageId, filename) {
  if (!requireApiKey(req, res)) return;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}$/.test(filename) || filename.includes('..')) { sendJson(res, 400, { error: 'Invalid filename.' }); return; }
  const { stat } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { createReadStream } = await import('node:fs');
  const { touchSession, readSessionManifest } = await import('./session.js');
  const manifest = await readSessionManifest(storageDir, jobId);
  if (!manifest) { sendJson(res, 404, { error: 'Job not found or expired.' }); return; }
  if (!manifest?.files?.some((file) => file.id === imageId)) { sendJson(res, 404, { error: 'File not found.' }); return; }
  const filePath = join(storageDir, 'sessions', jobId, 'output', imageId, filename);
  try {
    const fileStat = await stat(filePath);
    await touchSession(storageDir, jobId);
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': fileStat.size, 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    createReadStream(filePath).pipe(res);
  } catch { sendJson(res, 404, { error: 'File not found.' }); }
}
