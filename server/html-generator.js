function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cleanPath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+/, '/');
}

function normalizeOptions(options = {}) {
  return {
    alt: options.alt ?? '',
    sizes: options.sizes || '100vw',
    loading: options.loading || 'lazy',
    decoding: options.decoding || 'async',
    fetchpriority: options.fetchpriority || '',
    width: options.width ? Number(options.width) : null,
    height: options.height ? Number(options.height) : null,
  };
}

function srcset(results, format, baseUrl = '') {
  return results
    .filter((item) => item.format === format)
    .sort((a, b) => a.width - b.width)
    .map((item) => `${cleanPath(`${baseUrl}/${item.filename}`)} ${item.width}w`)
    .join(',\n          ');
}

function largest(results, format) {
  return results
    .filter((item) => item.format === format)
    .sort((a, b) => b.width - a.width)[0];
}

export function generateImgTag(results, options = {}, baseUrl = '') {
  const settings = normalizeOptions(options);
  const formats = [...new Set(results.map((item) => item.format))];
  const fallbackFormat = options.fallbackFormat || formats.find((format) => ['jpeg', 'png'].includes(format)) || formats[0];
  const fallback = largest(results, fallbackFormat);
  if (!fallback) throw new Error('No generated image variants are available.');

  const attrs = [
    `src="${escapeAttr(cleanPath(`${baseUrl}/${fallback.filename}`))}"`,
    `srcset="${escapeAttr(srcset(results, fallback.format, baseUrl))}"`,
    `sizes="${escapeAttr(settings.sizes)}"`,
    `width="${fallback.width}"`,
    `height="${fallback.height}"`,
    `loading="${escapeAttr(settings.loading)}"`,
    `decoding="${escapeAttr(settings.decoding)}"`,
    `alt="${escapeAttr(settings.alt)}"`,
  ];
  if (settings.fetchpriority) attrs.push(`fetchpriority="${escapeAttr(settings.fetchpriority)}"`);
  return `<img\n  ${attrs.join('\n  ')}\n>`;
}

export function generatePictureTag(results, options = {}, baseUrl = '') {
  const settings = normalizeOptions(options);
  const requestedSources = options.sourceFormats || ['avif', 'webp'];
  const sourceFormats = requestedSources.filter((format) => results.some((item) => item.format === format));
  const allFormats = [...new Set(results.map((item) => item.format))];
  const fallbackFormat = options.fallbackFormat || allFormats.find((format) => ['jpeg', 'png'].includes(format)) || allFormats.find((format) => !sourceFormats.includes(format));
  const fallback = largest(results, fallbackFormat);
  if (!fallback) throw new Error('No fallback image variant is available.');

  const sources = sourceFormats.map((format) => `  <source\n    type="image/${escapeAttr(format)}"\n    srcset="${escapeAttr(srcset(results, format, baseUrl))}"\n    sizes="${escapeAttr(settings.sizes)}"\n  >`).join('\n');
  const img = generateImgTag(results.filter((item) => item.format === fallbackFormat), settings, baseUrl);
  return `<picture>\n${sources ? `${sources}\n` : ''}${img}\n</picture>`;
}
