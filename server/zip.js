import { createReadStream } from 'node:fs';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

function validSessionId(value) {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value);
}

function safePart(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}

function runZip(output, sourceDir) {
  return new Promise((resolve, reject) => {
    const child = spawn('zip', ['-r', '-q', output, '.'], { cwd: sourceDir });
    let error = '';
    child.stderr.on('data', (chunk) => { error += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(error || 'ZIP creation failed.')));
  });
}

export async function handleZip(req, res, { storageDir }) {
  const url = new URL(req.url || '/', 'http://localhost');
  const sessionId = url.searchParams.get('sessionId');

  if (!validSessionId(sessionId)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Invalid session.');
    return;
  }

  const outputDir = join(storageDir, 'sessions', sessionId, 'output');

  try {
    const entries = (await readdir(outputDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && safePart(entry.name));

    if (!entries.length) throw new Error('No processed files available.');

    const zipDir = join(storageDir, 'sessions', sessionId, 'downloads');
    await mkdir(zipDir, { recursive: true });
    const zipPath = join(zipDir, 'responsive-images.zip');

    await runZip(zipPath, outputDir);
    const fileStat = await stat(zipPath);

    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Length': fileStat.size,
      'Content-Disposition': 'attachment; filename="responsive-images.zip"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    createReadStream(zipPath).pipe(res);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(error.message || 'ZIP unavailable.');
  }
}
