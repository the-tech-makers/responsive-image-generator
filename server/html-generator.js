function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cleanPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function joinBaseUrl(baseUrl, filename) {
  const base = cleanPath(baseUrl).replace(/\/+$/, '');
  const file = cleanPath(filename).replace(/^\/+/, '');
  return base ? `${base}/${file}` : `/${file}`;
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
    .map((item) => `${joinBaseUrl(baseUrl, item.filename)} ${item.width}w`)
    .join(',\n          ');
}

function largest(results, format) {
  if (!format) return null;
  return results
    .filter((item) => item.format === format)
    .sort((a, b) => b.width - a.width)[0];
}

function selectFallbackFormat(results, sourceFormats = [], requestedFallback = '') {
  const formats = [...new Set(results.map((item) => item.format))];
  if (requestedFallback && formats.includes(requestedFallback)) return requestedFallback;

  // Prefer a conventional browser fallback when one exists.
  const preferred = formats.find((format) => ['jpeg', 'png'].includes(format));
  if (preferred) return preferred;

  // WebP is a practical fallback when the job only generated modern formats.
  if (formats.includes('webp')) return 'webp';

  return formats[0] || null;
}

export function generateImgTag(results, options = {}, baseUrl = '') {
  if (!Array.isArray(results) || !results.length) {
    throw new Error('No generated image variants are available.');
  }

  const settings = normalizeOptions(options);
  const fallbackFormat = selectFallbackFormat(results, [], options.fallbackFormat);
  const fallback = largest(results, fallbackFormat);
  if (!fallback) throw new Error('No generated image variants are available.');

  const attrs = [
    `src="${escapeAttr(joinBaseUrl(baseUrl, fallback.filename))}"`,
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
  if (!Array.isArray(results) || !results.length) {
    throw new Error('No generated image variants are available.');
  }

  const settings = normalizeOptions(options);
  const requestedSources = Array.isArray(options.sourceFormats) && options.sourceFormats.length
    ? options.sourceFormats
    : ['avif', 'webp'];
  const availableFormats = [...new Set(results.map((item) => item.format))];
  const fallbackFormat = selectFallbackFormat(results, requestedSources, options.fallbackFormat);
  const fallback = largest(results, fallbackFormat);
  if (!fallback) throw new Error('No fallback image variant is available.');

  // A fallback format must not also be emitted as a <source>, otherwise the
  // picture element would redundantly serve the same format twice. This also
  // makes a single-format WebP job valid: it simply produces a <picture>
  // containing the fallback <img>.
  const sourceFormats = requestedSources.filter((format, index) =>
    availableFormats.includes(format) &&
    format !== fallbackFormat &&
    requestedSources.indexOf(format) === index
  );

  const sources = sourceFormats.map((format) => `  <source\n    type="image/${escapeAttr(format)}"\n    srcset="${escapeAttr(srcset(results, format, baseUrl))}"\n    sizes="${escapeAttr(settings.sizes)}"\n  >`).join('\n');

  const img = generateImgTag(
    results.filter((item) => item.format === fallbackFormat),
    settings,
    baseUrl
  );

  return `<picture>\n${sources ? `${sources}\n` : ''}${img}\n</picture>`;
}
