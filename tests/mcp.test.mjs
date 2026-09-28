import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleMcpRequest } from '../server/mcp.js';

const ONE_PIXEL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function request(body, { authorization = 'Bearer test-key', protocolVersion = '' } = {}) {
  return rawRequest(JSON.stringify(body), { authorization, protocolVersion });
}

function rawRequest(payload, { authorization = 'Bearer test-key', protocolVersion = '' } = {}) {
  const req = new EventEmitter();
  req.method = 'POST';
  req.url = '/mcp';
  req.headers = {
    authorization,
    ...(protocolVersion ? { 'mcp-protocol-version': protocolVersion } : {}),
  };

  process.nextTick(() => {
    req.emit('data', Buffer.from(payload));
    req.emit('end');
  });

  return req;
}

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = headers;
    },
    end(value = '') {
      this.body += value.toString();
    },
  };
}

async function call(body, options = {}) {
  const storageDir = await mkdtemp(join(tmpdir(), 'image-tool-mcp-'));
  process.env.IMAGE_TOOL_API_KEY = 'test-key';
  const res = response();
  try {
    await handleMcpRequest(request(body, options), res, { storageDir });
    return { res, payload: res.body ? JSON.parse(res.body) : null };
  } finally {
    await rm(storageDir, { recursive: true, force: true });
  }
}

test('MCP initialize negotiates the supported handshake version', async () => {
  const { res, payload } = await call({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['MCP-Protocol-Version'], '2025-06-18');
  assert.equal(payload.result.protocolVersion, '2025-06-18');
});

test('MCP tools/list returns the five image tools', async () => {
  const { res, payload } = await call({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, { protocolVersion: '2025-06-18' });
  assert.equal(res.statusCode, 200);
  assert.equal(payload.result.tools.length, 5);
  assert.deepEqual(
    payload.result.tools.map((tool) => tool.name),
    ['process_image', 'get_image_result', 'generate_img_tag', 'generate_picture_tag', 'download_image'],
  );
});

test('MCP initialized notification returns HTTP 202 without a JSON-RPC response', async () => {
  const { res, payload } = await call({ jsonrpc: '2.0', method: 'notifications/initialized' }, { protocolVersion: '2025-06-18' });
  assert.equal(res.statusCode, 202);
  assert.equal(payload, null);
});

test('MCP rejects an invalid API key', async () => {
  const { res, payload } = await call({ jsonrpc: '2.0', id: 3, method: 'tools/list' }, { authorization: 'Bearer wrong-key' });
  assert.equal(res.statusCode, 401);
  assert.equal(payload.error, 'Unauthorized.');
});

test('MCP rejects an unsupported negotiated protocol header', async () => {
  const { res, payload } = await call({ jsonrpc: '2.0', id: 4, method: 'tools/list' }, { protocolVersion: '2025-11-25' });
  assert.equal(res.statusCode, 400);
  assert.equal(payload.error.code, -32600);
});

test('MCP returns a JSON-RPC error for malformed JSON without throwing', async () => {
  const storageDir = await mkdtemp(join(tmpdir(), 'image-tool-mcp-error-'));
  process.env.IMAGE_TOOL_API_KEY = 'test-key';
  const res = response();
  try {
    await handleMcpRequest(rawRequest('{not-json'), res, { storageDir });
    const payload = JSON.parse(res.body);
    assert.equal(res.statusCode, 200);
    assert.equal(payload.id, null);
    assert.equal(payload.error.code, -32000);
    assert.equal(payload.error.message, 'Invalid JSON request.');
  } finally {
    await rm(storageDir, { recursive: true, force: true });
  }
});

test('MCP process_image defaults to no-upscale', async () => {
  const { res, payload } = await call({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'process_image',
      arguments: {
        image: ONE_PIXEL_PNG,
        filename: 'pixel.png',
        widths: [1, 2],
        formats: ['webp'],
      },
    },
  }, { protocolVersion: '2025-06-18' });

  assert.equal(res.statusCode, 200);
  const result = JSON.parse(payload.result.content[0].text);
  assert.deepEqual(result.results.map((item) => item.width), [1]);
});

test('MCP process_image allows explicit upscaling only when requested', async () => {
  const { res, payload } = await call({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'process_image',
      arguments: {
        image: ONE_PIXEL_PNG,
        filename: 'pixel.png',
        widths: [1, 2],
        formats: ['webp'],
        noUpscale: false,
      },
    },
  }, { protocolVersion: '2025-06-18' });

  assert.equal(res.statusCode, 200);
  const result = JSON.parse(payload.result.content[0].text);
  assert.deepEqual(result.results.map((item) => item.width), [1, 2]);
});

test('MCP process_image creates a job and usable variant download URLs', async () => {
  const { res, payload } = await call({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'process_image',
      arguments: {
        image: ONE_PIXEL_PNG,
        filename: 'pixel.png',
        widths: [1],
        formats: ['webp'],
      },
    },
  }, { protocolVersion: '2025-06-18' });

  assert.equal(res.statusCode, 200);
  assert.equal(payload.result.content[0].type, 'text');
  const result = JSON.parse(payload.result.content[0].text);
  assert.match(result.jobId, /^[0-9a-f-]{36}$/);
  assert.equal(result.results.length, 1);
  assert.match(result.results[0].downloadUrl, /\/api\/v1\/images\/.*\/files\/.*\/.*\.webp$/);
});
