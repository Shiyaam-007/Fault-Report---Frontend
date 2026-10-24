import { useState, useRef, useEffect } from 'react';
import { createTicket } from '../api';

export default function ReportView() {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview]         = useState(null);
  const [imageFile, setImageFile]     = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');
  const [webcamError, setWebcamError] = useState('');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || '';
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 850);
    };
    setIsMobile(checkMobile());
  }, []);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    if (isWebcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isWebcamActive]);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsWebcamActive(false);
  };

  const startWebcam = async () => {
    setWebcamError('');
    setError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setWebcamError('Camera is not supported on this device/browser.');
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsWebcamActive(true);
    } catch (err) {
      stopWebcam();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setWebcamError('Camera permission was denied. Please allow camera access to report faults.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setWebcamError('No camera detected on this laptop/device. Please use a device with a working camera.');
      } else {
        setWebcamError('Could not start camera: ' + (err.message || 'Please check device permissions.'));
      }
    }
  };

  const captureFromWebcam = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `fault-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImageFile(file);
      setPreview(URL.createObjectURL(blob));
      stopWebcam();
    }, 'image/jpeg', 0.92);
  };

  const handleInitiateCapture = () => {
    setWebcamError('');
    if (isMobile) {
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
        cameraInputRef.current.click();
      }
    } else {
      startWebcam();
    }
  };

  const handleNativeCameraChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ── Submit ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!imageFile) { setError('Please take a live photo using the camera.'); return; }

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
      stopWebcam();
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
            placeholder="Provide any details to help technicians locate and assess the issue…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Photo Upload - Camera Only */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Photo (Camera Only) *</span>
            <span className="text-[10px] text-cyan-400 font-normal">📸 Live capture required</span>
          </label>

          {/* Native mobile camera input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeCameraChange}
          />

          {preview ? (
            <div className="glass p-4 rounded-xl">
              <img
                src={preview}
                alt="Captured fault"
                className="w-full max-h-56 object-cover rounded-lg shadow-lg mb-3"
              />
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleInitiateCapture}
                  className="px-2.5 py-1 rounded-lg glass text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  🔄 Retake Photo
                </button>
                <button
                  type="button"
                  className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  onClick={() => {
                    setPreview(null);
                    setImageFile(null);
                    if (cameraInputRef.current) cameraInputRef.current.value = '';
                    stopWebcam();
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : isWebcamActive ? (
            <div className="glass p-4 rounded-xl shadow-xl flex flex-col items-center">
              <div className="relative w-full rounded-xl overflow-hidden bg-black mb-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover rounded-xl"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>Live Camera</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={captureFromWebcam}
                  className="btn-primary py-2 px-5 text-xs font-bold"
                >
                  📸 Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopWebcam}
                  className="px-3 py-2 rounded-lg glass text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="glass p-6 flex flex-col items-center justify-center gap-3 border border-dashed border-white/15 rounded-xl">
              <div className="text-3xl">📸</div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">
                  Take a Live Photo of the Fault
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live camera only. Uploads from files or gallery are disabled.
                </p>
              </div>

              {webcamError && (
                <div className="w-full glass p-2.5 border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs rounded-lg mt-1">
                  ⚠️ {webcamError}
                </div>
              )}

              <button
                type="button"
                onClick={handleInitiateCapture}
                className="mt-1 py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                📸 {isMobile ? 'Open Phone Camera' : 'Take Picture with Camera'}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="glass p-3 border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3.5 text-xs font-bold"
        >
          {submitting ? (
            <>
              <span className="spinner" /> Submitting…
            </>
          ) : (
            'Submit Fault Report'
          )}
        </button>
      </form>
    </div>
  );
}
