import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { handleApiV1Zip } from '../server/zip.js';

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: Buffer.alloc(0),
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = headers;
    },
    end(value = '') {
      const chunk = Buffer.from(value);
      this.body = Buffer.concat([this.body, chunk]);
    },
  };
}

function request(authorization = 'Bearer test-key') {
  const req = new EventEmitter();
  req.method = 'GET';
  req.url = '/api/v1/images/test/zip';
  req.headers = { authorization };
  return req;
}

test('V1 ZIP endpoint requires authentication', async () => {
  process.env.IMAGE_TOOL_API_KEY = 'test-key';
  const storageDir = await mkdtemp(join(tmpdir(), 'image-tool-zip-'));
  const res = response();
  try {
    await handleApiV1Zip(request('Bearer wrong-key'), res, { storageDir }, randomUUID());
    assert.equal(res.statusCode, 401);
  } finally {
    await rm(storageDir, { recursive: true, force: true });
  }
});

test('V1 ZIP endpoint packages a job output directory', async () => {
  process.env.IMAGE_TOOL_API_KEY = 'test-key';
  const storageDir = await mkdtemp(join(tmpdir(), 'image-tool-zip-'));
  const jobId = randomUUID();
  const imageId = randomUUID();
  const outputDir = join(storageDir, 'sessions', jobId, 'output', imageId);
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, 'hero.webp'), Buffer.from('test-image'));

  const res = response();
  try {
    await handleApiV1Zip(request(), res, { storageDir }, jobId);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Content-Type'], 'application/zip');
    assert.match(res.headers['Content-Disposition'], /responsive-images\.zip/);
    assert.ok(res.headers['Content-Length'] > 0);
  } finally {
    await rm(storageDir, { recursive: true, force: true });
  }
});
