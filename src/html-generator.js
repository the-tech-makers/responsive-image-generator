function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function groupByFormat(results) {
  return results.reduce((groups, item) => {
    if (!groups[item.format]) groups[item.format] = [];
    groups[item.format].push(item);
    return groups;
  }, {});
}

function srcset(items) {
  return [...items]
    .sort((a, b) => a.width - b.width)
    .map((item) => `${item.downloadUrl} ${item.width}w`)
    .join(', ');
}

function fallbackItem(groups) {
  const preferred = ['webp', 'jpeg', 'jpg', 'png', 'avif'];
  for (const format of preferred) {
    if (groups[format]?.length) {
      return [...groups[format]].sort((a, b) => a.width - b.width).at(-1);
    }
  }
  return Object.values(groups).flat().sort((a, b) => a.width - b.width).at(-1);
}

export function generateImageHtml(file, options) {
  const groups = groupByFormat(file.results || []);
  const alt = escapeAttribute(options.alt || '');
  const sizes = escapeAttribute(options.sizes || '100vw');
  const loading = escapeAttribute(options.loading || 'lazy');
  const decoding = escapeAttribute(options.decoding || 'async');
  const fetchpriority = escapeAttribute(options.fetchpriority || 'auto');
  const width = file.sourceWidth || '';
  const height = file.sourceHeight || '';
  const dimensions = width && height ? ` width="${width}" height="${height}"` : '';
  const fallback = fallbackItem(groups);

  if (!fallback) return '';

  const fallbackSrcset = srcset(groups[fallback.format] || [fallback]);
  const fallbackSrc = fallback.downloadUrl;

  if (options.element === 'img') {
    return `<img
  src="${escapeAttribute(fallbackSrc)}"
  srcset="${escapeAttribute(fallbackSrcset)}"
  sizes="${sizes}"
  alt="${alt}"${dimensions}
  loading="${loading}"
  decoding="${decoding}"
  fetchpriority="${fetchpriority}"
>`;
  }

  const preferredSources = ['avif', 'webp', 'jpeg', 'png'];
  const sources = preferredSources
    .filter((format) => groups[format]?.length)
    .map((format) => `  <source
    type="image/${format === 'jpeg' ? 'jpeg' : format}"
    srcset="${escapeAttribute(srcset(groups[format]))}"
    sizes="${sizes}"
  >`)
    .join('\n');

  return `<picture>
${sources}
  <img
    src="${escapeAttribute(fallbackSrc)}"
    srcset="${escapeAttribute(fallbackSrcset)}"
    sizes="${sizes}"
    alt="${alt}"${dimensions}
    loading="${loading}"
    decoding="${decoding}"
    fetchpriority="${fetchpriority}"
  >
</picture>`;
}
