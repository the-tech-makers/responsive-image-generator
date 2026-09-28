import { useMemo, useRef, useState } from 'react';
import { generateImageHtml } from './html-generator.js';

const DEFAULT_WIDTHS = [480, 768, 1024, 1280, 1440, 1920];
const FORMATS = [
  ['webp', 'WebP'],
  ['avif', 'AVIF'],
  ['jpeg', 'JPEG'],
  ['png', 'PNG'],
];

function formatBytes(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export default function App() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [widths, setWidths] = useState(DEFAULT_WIDTHS);
  const [formats, setFormats] = useState(['webp']);
  const [quality, setQuality] = useState(80);
  const [lossless, setLossless] = useState(false);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [noUpscale, setNoUpscale] = useState(true);
  const [tinyPng, setTinyPng] = useState({ enabled: false, format: 'webp' });
  const [customWidth, setCustomWidth] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [alts, setAlts] = useState({});
  const [htmlOptions, setHtmlOptions] = useState({
    element: 'picture',
    sizes: '100vw',
    loading: 'lazy',
    decoding: 'async',
    fetchpriority: 'auto',
    basePath: './',
  });
  const [copied, setCopied] = useState('');
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState('');

  async function upload(selected) {
    if (!selected.length || uploading || processing) return;
    setError('');
    setUploading(true);

    const formData = new FormData();
    selected.forEach((file) => formData.append('images', file));

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed.');

      setSessionId(data.sessionId);
      setFiles((current) => [...current, ...data.files]);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function processImages() {
    if (!sessionId || !files.length || !formats.length || processing) return;
    setError('');
    setProcessing(true);
    setResults([]);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId, files, widths, formats, quality, lossless, stripMetadata, noUpscale, tinyPng,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Processing failed.');
      setResults(data.results);
    } catch (processError) {
      setError(processError.message);
    } finally {
      setProcessing(false);
    }
  }

  function toggleWidth(width) {
    setWidths((current) => current.includes(width)
      ? current.filter((value) => value !== width)
      : [...current, width].sort((a, b) => a - b));
  }

  function addCustomWidth() {
    const width = Number(customWidth);
    if (!Number.isInteger(width) || width < 1 || width > 10000) return;
    setWidths((current) => [...new Set([...current, width])].sort((a, b) => a - b));
    setCustomWidth('');
  }

  function toggleFormat(format) {
    setFormats((current) => current.includes(format)
      ? current.filter((value) => value !== format)
      : [...current, format]);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    upload(Array.from(event.dataTransfer.files || []));
  }

  const generatedHtml = useMemo(
    () => results.map((file) => ({
      ...file,
      html: generateImageHtml(file, { ...htmlOptions, alt: alts[file.id] || '' }),
    })),
    [results, htmlOptions, alts],
  );

  async function copyHtml(file) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(file.html);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = file.html;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopied(file.id);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setError('Could not copy HTML to the clipboard.');
    }
  }

  function removeFile(fileId) {
    if (processing || uploading) return;
    setFiles((current) => current.filter((file) => file.id !== fileId));
    setResults((current) => current.filter((file) => file.id !== fileId));
    setAlts((current) => {
      const next = { ...current };
      delete next[fileId];
      return next;
    });
  }

  async function downloadAll() {
    if (!sessionId || zipping) return;
    setZipping(true);
    try {
      const response = await fetch(`/api/download-all?sessionId=${encodeURIComponent(sessionId)}`);
      if (!response.ok) throw new Error('ZIP download is unavailable.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'responsive-images.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (zipError) {
      setError(zipError.message);
    } finally {
      setZipping(false);
    }
  }

  function updateHtmlOption(name, value) {
    setHtmlOptions((current) => ({ ...current, [name]: value }));
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">The Tech Makers</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Responsive Image Tool</h1>
          <p className="mt-1 text-sm text-slate-500">Resize · Compress · Convert · Generate HTML</p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <button
            type="button"
            className={`flex min-h-44 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 text-center transition ${dragging ? 'border-primary bg-primary-soft' : 'border-slate-300 hover:border-primary'}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="text-base font-medium text-slate-900">{uploading ? 'Uploading…' : 'Drop images here'}</span>
            <span className="mt-1 text-sm text-slate-500">or click to browse · JPG, PNG, WebP, AVIF</span>
          </button>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.avif" multiple className="hidden" onChange={(event) => { upload(Array.from(event.target.files || [])); event.target.value = ''; }} />
          {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </section>

        {files.length > 0 && (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Image Queue</h2>
              <p className="mt-1 text-xs text-slate-500">{files.length} image{files.length === 1 ? '' : 's'} uploaded</p>
            </div>
            <div className="divide-y divide-slate-100">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">{file.format?.toUpperCase() || 'IMG'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{file.originalName}</p>
                    <p className="mt-1 text-xs text-slate-500">{file.width} × {file.height} · {formatBytes(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeFile(file.id)} disabled={processing || uploading} className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Remove</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {files.length > 0 && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Processing Settings</h2>
              <p className="mt-1 text-xs text-slate-500">Choose responsive widths and output formats.</p>

              <div className="mt-5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Widths</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DEFAULT_WIDTHS.map((width) => (
                    <button key={width} type="button" onClick={() => toggleWidth(width)} className={`rounded-md border px-3 py-2 text-xs font-medium ${widths.includes(width) ? 'border-primary bg-primary-soft text-primary' : 'border-slate-200 text-slate-600'}`}>{width}</button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addCustomWidth()} type="number" min="1" max="10000" placeholder="Custom width" className="w-36 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary" />
                  <button type="button" onClick={addCustomWidth} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Add</button>
                </div>
              </div>

              <div className="mt-5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formats</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FORMATS.map(([value, label]) => (
                    <label key={value} className={`flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm ${tinyPng.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input type="checkbox" checked={formats.includes(value)} onChange={() => toggleFormat(value)} disabled={tinyPng.enabled} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={tinyPng.enabled}
                    onChange={(event) => setTinyPng((current) => ({ ...current, enabled: event.target.checked }))}
                    className="mt-0.5"
                  />
                  <span>
                    Compress with TinyPNG
                    <span className="mt-1 block text-xs font-normal text-slate-500">Resize locally first, then optimize the resized images with TinyPNG.</span>
                  </span>
                </label>

                {tinyPng.enabled && (
                  <label className="mt-4 block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred format</span>
                    <select
                      value={tinyPng.format}
                      onChange={(event) => setTinyPng((current) => ({ ...current, format: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="webp">WebP</option>
                      <option value="avif">AVIF</option>
                    </select>
                  </label>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className={`flex items-center gap-2 text-sm ${tinyPng.enabled ? 'opacity-50' : ''}`}><input type="checkbox" checked={lossless} onChange={(event) => setLossless(event.target.checked)} disabled={tinyPng.enabled} /> Lossless</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stripMetadata} onChange={(event) => setStripMetadata(event.target.checked)} /> Strip metadata</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={noUpscale} onChange={(event) => setNoUpscale(event.target.checked)} /> Don't upscale</label>
              </div>

              {!lossless && (
                <label className={`mt-5 block text-sm ${tinyPng.enabled ? 'opacity-50' : ''}`}>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quality: {quality}</span>
                  <input className="mt-2 w-full accent-blue-600" type="range" min="1" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} disabled={tinyPng.enabled} />
                </label>
              )}

              <button type="button" disabled={processing || !formats.length || !widths.length} onClick={processImages} className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                {processing ? 'Processing…' : 'Process Images'}
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Results</h2>
                  <p className="mt-1 text-xs text-slate-500">Download generated variants individually or as one ZIP.</p>
                </div>
                {results.length > 0 && <button type="button" onClick={downloadAll} disabled={zipping} className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{zipping ? 'Preparing…' : 'Download ZIP'}</button>}
              </div>
              {!results.length ? (
                <p className="mt-2 text-sm text-slate-500">Processed variants will appear here.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {results.map((file) => (
                    <div key={file.id}>
                      <p className="text-sm font-medium text-slate-900">{file.originalName}</p>
                      <div className="mt-2 space-y-2">
                        {file.results.map((item) => (
                          <div key={item.filename} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-xs">
                            <span>{item.width}w · {item.format.toUpperCase()} · {formatBytes(item.size)}{item.sourceSize ? ` · ${Math.max(0, Math.round((1 - item.size / item.sourceSize) * 100))}% smaller` : ''}</span>
                            <a href={item.downloadUrl} className="font-medium text-primary hover:text-primary-hover" download>Download · {formatBytes(item.size)}</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {results.length > 0 && (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-sm font-semibold text-slate-900">HTML Generator</h2>
              <p className="mt-1 text-xs text-slate-500">Generate production-ready responsive markup from the variants that were actually created.</p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Element</span>
                <select value={htmlOptions.element} onChange={(event) => updateHtmlOption('element', event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="picture">&lt;picture&gt;</option>
                  <option value="img">&lt;img&gt;</option>
                </select>
              </label>
              <label className="text-sm lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sizes</span>
                <input value={htmlOptions.sizes} onChange={(event) => updateHtmlOption('sizes', event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Asset path</span>
                <input value={htmlOptions.basePath} onChange={(event) => updateHtmlOption('basePath', event.target.value)} placeholder="./images/" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loading</span>
                <select value={htmlOptions.loading} onChange={(event) => updateHtmlOption('loading', event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="lazy">lazy</option>
                  <option value="eager">eager</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fetch priority</span>
                <select value={htmlOptions.fetchpriority} onChange={(event) => updateHtmlOption('fetchpriority', event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="auto">auto</option>
                  <option value="high">high</option>
                  <option value="low">low</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decoding</span>
              <select value={htmlOptions.decoding} onChange={(event) => updateHtmlOption('decoding', event.target.value)} className="mt-2 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="async">async</option>
                <option value="sync">sync</option>
                <option value="auto">auto</option>
              </select>
            </label>

            <div className="mt-6 space-y-5">
              {generatedHtml.map((file) => (
                <div key={file.id} className="rounded-md border border-slate-200">
                  <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{file.originalName}</p>
                      <p className="text-xs text-slate-500">{file.results.length} generated variant{file.results.length === 1 ? '' : 's'}</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      Alt
                      <input
                        value={alts[file.id] || ''}
                        onChange={(event) => setAlts((current) => ({ ...current, [file.id]: event.target.value }))}
                        placeholder="Describe the image"
                        className="w-full min-w-48 rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <div className="p-4">
                    <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100"><code>{file.html}</code></pre>
                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={() => copyHtml(file)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        {copied === file.id ? 'Copied' : 'Copy HTML'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
