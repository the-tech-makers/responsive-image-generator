import http from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './server/api.js';
import { cleanupSessions } from './server/session.js';
import { serveStatic } from './server/static.js';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const storageDir = join(rootDir, 'storage');
const distDir = join(rootDir, 'dist');
const envPath = join(rootDir, '.env');

if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    console.warn('Notice: Could not load .env file:', err.message);
  }
}

if (!existsSync(storageDir)) {
  mkdirSync(storageDir, { recursive: true });
}

const port = process.env.PORT || 3000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

const server = http.createServer(async (req, res) => {
  try {
    const pathname = (req.url || '').split('?')[0];
    if (pathname.startsWith('/api/') || pathname === '/mcp' || pathname.startsWith('/mcp/')) {
      await handleApiRequest(req, res, { storageDir });
      return;
    }

    serveStatic(req, res, distDir);
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
