import { useState, useRef } from 'react';
import { createTicket } from '../api';

export default function ReportView() {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview]       = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');
  const cameraRef                   = useRef(null);
  const galleryRef                  = useRef(null);


  /* ── Image capture ───────────────────────────────────── */

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ── Submit ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!imageFile) { setError('Please take or choose a photo.'); return; }

    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', description);
    fd.append('image', imageFile);

    setSubmitting(true);
    try {
      await createTicket(fd);
      setSuccess(true);
      setTitle(''); setDescription('');
      setPreview(null); setImageFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 fade-up">
        <div className="glass p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold gradient-text mb-2">Report Submitted!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Campus maintenance has been notified. Thank you for helping keep our campus safe.
          </p>
          <button className="btn-primary w-full" onClick={() => setSuccess(false)}>
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto fade-up">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="live-dot" />
          <span className="text-xs text-cyan-400 font-semibold tracking-widest uppercase">
            Campus Reporter
          </span>
        </div>
        <h1 className="text-3xl font-extrabold gradient-text leading-tight">
          Report an Issue
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Help us fix campus infrastructure problems fast.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Title *
          </label>
          <input
            className="field"
            placeholder="e.g. Broken light in Block C stairwell"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            className="field resize-none"
            rows={3}
            placeholder="Describe the problem in detail…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Camera / Gallery */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Photo *
          </label>

          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
          />

          {preview ? (
            <div className="glass p-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-56 object-cover rounded-lg shadow-lg mb-3"
              />
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="px-2.5 py-1 rounded glass text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    📷 Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="px-2.5 py-1 rounded glass text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    🖼️ Gallery
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  onClick={() => {
                    setPreview(null);
                    setImageFile(null);
                    if (cameraRef.current) cameraRef.current.value = '';
                    if (galleryRef.current) galleryRef.current.value = '';
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="glass p-5 flex flex-col items-center justify-center gap-3 border border-dashed border-white/15">
              <div className="text-center">
                <div className="text-3xl mb-1">📸</div>
                <p className="text-sm font-semibold text-slate-200">
                  Select a photo
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Take a photo or choose from device gallery
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 w-full max-w-xs mt-1">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📷</span>
                  <span>Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🖼️</span>
                  <span>Gallery</span>
                </button>
              </div>
            </div>
          )}
        </div>



        {/* Error */}
        {error && (
          <div className="glass p-3 border-rose-500/40 text-rose-400 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={submitting} className="btn-primary w-full text-base py-4">
          {submitting
            ? <><span className="spinner" /> Submitting…</>
            : '🚀 Submit Report'}
        </button>
      </form>
    </div>
  );
}
