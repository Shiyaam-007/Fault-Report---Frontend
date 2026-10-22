import { useState, useRef } from 'react';
import { createTicket } from '../api';

const REPORTER_ID = 1; // Hard-coded for MVP (no auth)

export default function ReportView() {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview]       = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');
  const fileRef = useRef(null);


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
    fd.append('reporterId', REPORTER_ID);
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

        {/* Camera */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Photo *
          </label>
          <div
            className="glass p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-48 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <>
                <div className="text-4xl">📷</div>
                <p className="text-slate-400 text-sm">Tap to take a photo or choose from gallery</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"   /* opens rear camera on mobile */
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          {preview && (
            <button
              type="button"
              className="text-xs text-slate-500 mt-1 underline"
              onClick={() => { setPreview(null); setImageFile(null); }}
            >
              Remove photo
            </button>
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
