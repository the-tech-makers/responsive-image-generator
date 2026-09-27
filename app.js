import http from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './server/api.js';
import { cleanupSessions } from './server/session.js';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const storageDir = join(rootDir, 'storage');

if (!existsSync(storageDir)) {
  mkdirSync(storageDir, { recursive: true });
}

const port = Number(process.env.PORT) || 3000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

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

async function runCleanup() {
  try {
    const removed = await cleanupSessions(storageDir);
    if (removed) console.log(`Session cleanup removed ${removed} expired session(s).`);
  } catch (error) {
    console.error('Session cleanup failed:', error);
  }
}

server.listen(port, () => {
  console.log(`Responsive Image Tool API listening on port ${port}`);
  runCleanup();
});

const cleanupTimer = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();
