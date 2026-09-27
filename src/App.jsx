import { useRef, useState } from 'react';

const ACCEPT = '.jpg,.jpeg,.png,.webp,.avif';

function formatBytes(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export default function App() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(selected) {
    if (!selected.length || uploading) return;

    setError('');
    setUploading(true);

    const formData = new FormData();
    selected.forEach((file) => formData.append('images', file));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed.');
      }

      setFiles((current) => [...current, ...data.files]);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(event) {
    upload(Array.from(event.target.files || []));
    event.target.value = '';
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    upload(Array.from(event.dataTransfer.files || []));
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
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="text-base font-medium text-slate-900">
              {uploading ? 'Uploading…' : 'Drop images here'}
            </span>
            <span className="mt-1 text-sm text-slate-500">or click to browse · JPG, PNG, WebP, AVIF</span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={onInputChange}
          />

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">
                    {file.format?.toUpperCase() || 'IMG'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{file.originalName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {file.width} × {file.height} · {formatBytes(file.size)}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-600">Uploaded</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Processing Settings</h2>
          <p className="mt-1 text-sm text-slate-500">The processing controls will be added in the next implementation step.</p>
        </section>
      </div>
    </main>
  );
}
