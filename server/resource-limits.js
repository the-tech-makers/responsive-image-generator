const DEFAULT_MAX_CONCURRENT = 2;
const DEFAULT_RATE_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;

const maxConcurrent = Math.max(1, Number(process.env.IMAGE_TOOL_MAX_CONCURRENT || DEFAULT_MAX_CONCURRENT));
const rateLimit = Math.max(1, Number(process.env.IMAGE_TOOL_RATE_LIMIT || DEFAULT_RATE_LIMIT));
const windowMs = Math.max(1_000, Number(process.env.IMAGE_TOOL_RATE_WINDOW_MS || DEFAULT_WINDOW_MS));

let active = 0;
const waiters = [];
const buckets = new Map();

function drain() {
  while (active < maxConcurrent && waiters.length) {
    active += 1;
    waiters.shift()();
  }
}

export async function withProcessingSlot(task) {
  if (active >= maxConcurrent) {
    await new Promise((resolve) => waiters.push(resolve));
    active -= 1;
  } else {
    active += 1;
  }

  try {
    return await task();
  } finally {
    active -= 1;
    drain();
  }
}

function rateKey(req) {
  return req.headers.authorization || req.socket?.remoteAddress || 'anonymous';
}

export function checkRateLimit(req, res) {
  const now = Date.now();
  const key = rateKey(req);
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.startedAt >= windowMs) {
    bucket = { startedAt: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count <= rateLimit) return true;

  const retryAfter = Math.max(1, Math.ceil((bucket.startedAt + windowMs - now) / 1000));
  res.writeHead(429, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Retry-After': String(retryAfter),
  });
  res.end(JSON.stringify({ error: 'Rate limit exceeded. Please retry later.' }));
  return false;
}

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - windowMs * 2;
  for (const [key, bucket] of buckets) {
    if (bucket.startedAt < cutoff) buckets.delete(key);
  }
}, windowMs * 2);

cleanupTimer.unref();
