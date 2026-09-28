import tinify from 'tinify';

const SUPPORTED_FORMATS = new Set(['webp', 'avif']);

function getApiKey() {
  const key = process.env.TINIFY_API_KEY?.trim();
  if (!key) {
    throw new Error('TinyPNG compression is enabled, but TINIFY_API_KEY is not configured on the server.');
  }
  return key;
}

function runToBuffer(source) {
  return new Promise((resolve, reject) => {
    source.toBuffer((error, buffer) => {
      if (error) reject(error);
      else resolve(buffer);
    });
  });
}

function describeTinifyError(error) {
  if (error instanceof tinify.AccountError) return `TinyPNG account error: ${error.message}`;
  if (error instanceof tinify.ClientError) return `TinyPNG request error: ${error.message}`;
  if (error instanceof tinify.ServerError) return `TinyPNG service error: ${error.message}`;
  if (error instanceof tinify.ConnectionError) return `Unable to connect to TinyPNG: ${error.message}`;
  return `TinyPNG compression failed: ${error?.message || 'Unknown error.'}`;
}

export async function compressWithTinyPng(buffer, format) {
  const apiKey = getApiKey();
  if (!SUPPORTED_FORMATS.has(format)) {
    throw new Error('TinyPNG preferred format must be WebP or AVIF.');
  }

  tinify.key = apiKey;

  try {
    const source = tinify.fromBuffer(buffer);
    const converted = source.convert({ type: `image/${format}` });
    return await runToBuffer(converted);
  } catch (error) {
    throw new Error(describeTinifyError(error));
  }
}