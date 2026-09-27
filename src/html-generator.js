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

function assetUrl(basePath, filename) {
  const base = String(basePath ?? './').trim() || './';
  return base.replace(/\/+$/, '') + '/' + filename;
}

function srcset(items, basePath) {
  return [...items]
    .sort((a, b) => a.width - b.width)
    .map((item) => assetUrl(basePath, item.filename) + ' ' + item.width + 'w')
    .join(', ');
}

function fallbackItem(groups) {
  const preferred = ['webp', 'jpeg', 'jpg', 'png', 'avif'];
  for (const format of preferred) {
    if (groups[format]?.length) return [...groups[format]].sort((a, b) => a.width - b.width).at(-1);
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
  const basePath = options.basePath || './';
  const width = file.sourceWidth || '';
  const height = file.sourceHeight || '';
  const dimensions = width && height ? ' width="' + width + '" height="' + height + '"' : '';
  const fallback = fallbackItem(groups);
  if (!fallback) return '';
  const fallbackSrcset = srcset(groups[fallback.format] || [fallback], basePath);
  const fallbackSrc = assetUrl(basePath, fallback.filename);

  if (options.element === 'img') {
    return '<img\n' +
      '  src="' + escapeAttribute(fallbackSrc) + '"\n' +
      '  srcset="' + escapeAttribute(fallbackSrcset) + '"\n' +
      '  sizes="' + sizes + '"\n' +
      '  alt="' + alt + '"' + dimensions + '\n' +
      '  loading="' + loading + '"\n' +
      '  decoding="' + decoding + '"\n' +
      '  fetchpriority="' + fetchpriority + '"\n' +
      '>';
  }

  const preferredSources = ['avif', 'webp', 'jpeg', 'png'];
  const sources = preferredSources
    .filter((format) => groups[format]?.length)
    .map((format) => '  <source\n' +
      '    type="image/' + (format === 'jpeg' ? 'jpeg' : format) + '"\n' +
      '    srcset="' + escapeAttribute(srcset(groups[format], basePath)) + '"\n' +
      '    sizes="' + sizes + '"\n' +
      '  >')
    .join('\n');

  return '<picture>\n' + sources + '\n' +
    '  <img\n' +
    '    src="' + escapeAttribute(fallbackSrc) + '"\n' +
    '    srcset="' + escapeAttribute(fallbackSrcset) + '"\n' +
    '    sizes="' + sizes + '"\n' +
    '    alt="' + alt + '"' + dimensions + '\n' +
    '    loading="' + loading + '"\n' +
    '    decoding="' + decoding + '"\n' +
    '    fetchpriority="' + fetchpriority + '"\n' +
    '  >\n' +
    '</picture>';
}