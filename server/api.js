import { handleUpload } from './upload.js';
import { handleProcess } from './process.js';
import { handleDownload } from './download.js';
import { handleZip } from './zip.js';
import { handleApiV1Info, handleApiV1Process, handleApiV1Result } from './api-v1.js';

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export async function handleApiRequest(req, res, context) {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (path === '/api/v1') {
    if (req.method === 'GET') await handleApiV1Info(req, res);
    else sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  if (req.method === 'POST' && path === '/api/v1/images/process') {
    await handleApiV1Process(req, res, context);
    return;
  }

  const resultMatch = path.match(/^\/api\/v1\/images\/([0-9a-f-]{36})$/);
  if (req.method === 'GET' && resultMatch) {
    await handleApiV1Result(req, res, context, resultMatch[1]);
    return;
  }

  if (req.method === 'POST' && path === '/api/upload') {
    await handleUpload(req, res, context);
    return;
  }

  if (req.method === 'POST' && path === '/api/process') {
    await handleProcess(req, res, context);
    return;
  }

  if (req.method === 'GET' && path === '/api/download') {
    await handleDownload(req, res, context);
    return;
  }

  if (req.method === 'GET' && path === '/api/download-all') {
    await handleZip(req, res, context);
    return;
  }

  sendJson(res, 404, { error: 'API route not found' });
}
