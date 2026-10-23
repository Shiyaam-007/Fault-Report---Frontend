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
  const fileRef                     = useRef(null);



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

        {/* Photo Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Photo *
          </label>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          {preview ? (
            <div className="glass p-4 rounded-xl">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-56 object-cover rounded-lg shadow-lg mb-3"
              />
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg glass text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  🔄 Change Photo
                </button>
                <button
                  type="button"
                  className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  onClick={() => {
                    setPreview(null);
                    setImageFile(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="glass p-6 flex flex-col items-center justify-center gap-3 border border-dashed border-white/15 hover:border-indigo-400 transition-all rounded-xl cursor-pointer group"
            >
              <div className="text-3xl group-hover:scale-110 transition-transform">📸</div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  Tap to choose or take a photo
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supports camera, gallery, and file upload
                </p>
              </div>
              <span className="mt-1 py-1.5 px-3.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold text-xs transition-all pointer-events-none group-hover:bg-indigo-500/30">
                Select Photo
              </span>
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
