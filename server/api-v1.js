import Busboy from 'busboy';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { extname, join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createSession, touchSession, writeSessionManifest, readSession, readSessionManifest } from './session.js';
import { processImage } from './image-processor.js';
import { requireApiKey } from './api-auth.js';
import { generateImgTag, generatePictureTag } from './html-generator.js';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function safeName(name) {
  const ext = extname(name).toLowerCase();
  const stem = basename(name, ext).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80) || 'image';
  return `${stem}-${randomUUID().slice(0, 8)}${ext}`;
}

function parseOptions(fields) {
  const value = (key, fallback) => fields[key] === undefined ? fallback : fields[key];
  const widths = JSON.parse(value('widths', '[480,768,1024,1280,1440,1920]'));
  const formats = JSON.parse(value('formats', '["webp"]'));
  const tiny = value('tinyPng', null) ? JSON.parse(fields.tinyPng) : null;
  if (!Array.isArray(widths) || !Array.isArray(formats)) throw new Error('widths and formats must be JSON arrays.');
  return {
    widths: widths.map(Number), formats,
    quality: Math.min(100, Math.max(1, Number(value('quality', 80)) || 80)),
    lossless: value('lossless', 'false') === 'true',
    stripMetadata: value('stripMetadata', 'true') !== 'false',
    noUpscale: value('noUpscale', 'true') !== 'false', tinyPng: tiny,
  };
}

function htmlOptions(fields) {
  const value = (key, fallback = '') => fields[key] === undefined ? fallback : fields[key];
  return {
    type: value('htmlType', ''), alt: value('alt', ''), sizes: value('sizes', '100vw'),
    loading: value('loading', 'lazy'), decoding: value('decoding', 'async'),
    fetchpriority: value('fetchpriority', ''), width: value('htmlWidth', ''), height: value('htmlHeight', ''),
    sourceFormats: JSON.parse(value('sourceFormats', '["avif","webp"]')),
    fallbackFormat: value('fallbackFormat', ''), baseUrl: value('baseUrl', ''),
  };
}

function resultPayload(processed, sessionId, fileId) {
  return processed.results.map((item) => ({
    filename: item.filename, width: item.width, height: item.height, format: item.format,
    mime: item.mime, size: item.size, sourceSize: item.sourceSize,
    downloadUrl: `/api/v1/images/${sessionId}/files/${fileId}/${encodeURIComponent(item.filename)}`,
  }));
}

export async function handleApiV1Process(req, res, { storageDir }) {
  if (!requireApiKey(req, res)) return;
  const type = req.headers['content-type'] || '';
  if (!type.startsWith('multipart/form-data')) { json(res, 415, { error: 'Multipart form data is required.' }); return; }

  const sessionId = randomUUID();
  const root = join(storageDir, 'sessions', sessionId);
  const uploadDir = join(root, 'uploads');
  const outputDir = join(root, 'output');
  await createSession(storageDir, sessionId); await mkdir(uploadDir, { recursive: true });
  let originalName = '', uploadedPath = '', fileBytes = 0; const fields = {}; let streamError = null;
  const busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: MAX_FILE_SIZE, fields: 30 } });
  const complete = new Promise((resolve, reject) => {
    busboy.on('field', (name, value) => { fields[name] = value; });
    busboy.on('file', (name, file, info) => {
      if (name !== 'image') { file.resume(); return; }
      originalName = info.filename; const ext = extname(info.filename).toLowerCase();
      if (!ALLOWED.has(ext)) { streamError = new Error('Unsupported image type.'); file.resume(); return; }
      uploadedPath = join(uploadDir, safeName(info.filename)); const output = createWriteStream(uploadedPath);
      file.on('data', (chunk) => { fileBytes += chunk.length; }); file.on('limit', () => { streamError = new Error('Image exceeds 25 MB.'); });
      file.on('error', (error) => { streamError = error; }); output.on('error', (error) => { streamError = error; }); file.pipe(output);
    });
    busboy.on('error', reject); busboy.on('finish', resolve);
  });

  try {
    req.pipe(busboy); await complete;
    if (streamError) throw streamError; if (!uploadedPath || !fileBytes) throw new Error('No image was supplied.');
    const metadata = await sharp(uploadedPath).metadata(); if (!metadata.format) throw new Error('Invalid image.');
    const options = parseOptions(fields);
    if (options.tinyPng?.enabled && !['webp', 'avif'].includes(options.tinyPng.format)) throw new Error('TinyPNG format must be webp or avif.');
    await mkdir(outputDir, { recursive: true }); const fileId = randomUUID();
    await writeSessionManifest(storageDir, sessionId, [{ id: fileId, originalName, filename: basename(uploadedPath), width: metadata.width || 0, height: metadata.height || 0, size: fileBytes, format: metadata.format, sessionId }]);
    const processed = await processImage({ sourcePath: uploadedPath, outputDir: join(outputDir, fileId), ...options });
    const results = resultPayload(processed, sessionId, fileId);
    let html = null;
    if (fields.htmlType) {
      const h = htmlOptions(fields); html = h.type === 'picture' ? generatePictureTag(processed.results, h, h.baseUrl) : generateImgTag(processed.results, h, h.baseUrl);
    }
    await touchSession(storageDir, sessionId);
    json(res, 201, { jobId: sessionId, imageId: fileId, originalName, source: { width: processed.sourceWidth, height: processed.sourceHeight }, results, html });
  } catch (error) {
    await rm(root, { recursive: true, force: true }).catch(() => {}); console.error(error); json(res, 400, { error: error.message || 'Image processing failed.' });
  }
}

export async function handleApiV1Info(req, res) {
  if (!requireApiKey(req, res)) return;
  json(res, 200, { name: 'Responsive Image Tool API', version: '1', capabilities: ['process_image', 'get_image_result', 'generate_img_tag', 'generate_picture_tag', 'download_image', 'download_zip'], processing: ['responsive-resize', 'webp', 'avif', 'jpeg', 'png', 'tinypng'] });
}

export async function handleApiV1Result(req, res, { storageDir }, jobId) {
  if (!requireApiKey(req, res)) return;
  if (!await readSession(storageDir, jobId)) { json(res, 404, { error: 'Job not found or expired.' }); return; }
  const manifest = await readSessionManifest(storageDir, jobId);
  json(res, 200, { jobId, files: manifest?.files || [] });
}
