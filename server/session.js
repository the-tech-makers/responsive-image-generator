import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function sessionPath(storageDir, sessionId) {
  return join(storageDir, 'sessions', sessionId);
}

export async function createSession(storageDir, sessionId) {
  const root = sessionPath(storageDir, sessionId);
  await mkdir(root, { recursive: true });
  const now = new Date().toISOString();

  await writeFile(join(root, 'session.json'), JSON.stringify({
    sessionId,
    createdAt: now,
    lastActivityAt: now,
  }), 'utf8');
}

export async function touchSession(storageDir, sessionId) {
  const current = await readSession(storageDir, sessionId);
  if (!current) throw new Error('Session not found or expired.');

  const now = new Date().toISOString();
  await writeFile(join(sessionPath(storageDir, sessionId), 'session.json'), JSON.stringify({
    sessionId,
    createdAt: current.createdAt || now,
    lastActivityAt: now,
  }), 'utf8');
}

export async function readSession(storageDir, sessionId) {
  try {
    return JSON.parse(await readFile(join(sessionPath(storageDir, sessionId), 'session.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function writeSessionManifest(storageDir, sessionId, files) {
  if (!await readSession(storageDir, sessionId)) {
    throw new Error('Session not found or expired.');
  }

  await writeFile(
    join(sessionPath(storageDir, sessionId), 'manifest.json'),
    JSON.stringify({ files }, null, 2),
    'utf8',
  );
}

export async function readSessionManifest(storageDir, sessionId) {
  try {
    return JSON.parse(await readFile(
      join(sessionPath(storageDir, sessionId), 'manifest.json'),
      'utf8',
    ));
  } catch {
    return null;
  }
}

export async function cleanupSessions(storageDir) {
  const sessionsRoot = join(storageDir, 'sessions');
  await mkdir(sessionsRoot, { recursive: true });
  const entries = await readdir(sessionsRoot, { withFileTypes: true });
  const now = Date.now();
  let removed = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[0-9a-f-]{36}$/.test(entry.name)) continue;

    const root = join(sessionsRoot, entry.name);
    const session = await readSession(storageDir, entry.name);
    const parsedActivity = session?.lastActivityAt ? Date.parse(session.lastActivityAt) : NaN;
    const lastActivity = Number.isFinite(parsedActivity)
      ? parsedActivity
      : (await stat(root)).mtimeMs;

    if (now - lastActivity > SESSION_TTL_MS) {
      await rm(root, { recursive: true, force: true });
      removed += 1;
    }
  }

  return removed;
}
