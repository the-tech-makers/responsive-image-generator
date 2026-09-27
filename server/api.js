import { handleUpload } from './upload.js';

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

  if (req.method === 'POST' && path === '/api/upload') {
    await handleUpload(req, res, context);
    return;
  }

  sendJson(res, 404, { error: 'API route not found' });
}
