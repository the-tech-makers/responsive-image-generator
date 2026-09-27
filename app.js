import http from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './server/api.js';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const storageDir = join(rootDir, 'storage');

if (!existsSync(storageDir)) {
  mkdirSync(storageDir, { recursive: true });
}

const port = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  try {
    if (req.url?.startsWith('/api/')) {
      await handleApiRequest(req, res, { storageDir });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(port, () => {
  console.log(`Responsive Image Tool API listening on port ${port}`);
});
