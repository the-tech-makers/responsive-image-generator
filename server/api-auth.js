export function requireApiKey(req, res) {
  const expected = process.env.IMAGE_TOOL_API_KEY?.trim();
  const header = req.headers.authorization || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!expected || !supplied || supplied !== expected) {
    res.writeHead(401, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'WWW-Authenticate': 'Bearer',
    });
    res.end(JSON.stringify({ error: 'Unauthorized.' }));
    return false;
  }

  return true;
}
