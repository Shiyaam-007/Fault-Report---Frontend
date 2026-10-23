import { useEffect, useState } from 'react';

export default function ImageModal({ image, onClose }) {
  const [scale, setScale] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(prev + 0.3, 3));
      } else if (e.key === '-' || e.key === '_') {
        setScale((prev) => Math.max(prev - 0.3, 0.7));
      } else if (e.key === '0') {
        setScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!image) return null;

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setScale((prev) => Math.min(Number((prev + 0.3).toFixed(1)), 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setScale((prev) => Math.max(Number((prev - 0.3).toFixed(1)), 0.6));
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    setScale(1);
  };

  const toggleZoom = (e) => {
    e.stopPropagation();
    setScale((prev) => (prev > 1 ? 1 : 1.7));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-2 sm:p-4 md:p-6 bg-black/92 backdrop-blur-xl animate-fade-in select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-image-title"
    >
      {/* ── Top Header / Metadata Bar ── */}
      <div
        className="w-full max-w-[98vw] sm:max-w-[96vw] flex items-center justify-between glass px-2.5 sm:px-4 py-2 sm:py-3 border border-white/15 shadow-2xl z-20 shrink-0 rounded-xl sm:rounded-2xl gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
          <span className="badge badge-open text-[10px] sm:text-xs font-mono font-bold shrink-0 px-2 py-0.5">
            #{image.ticketId}
          </span>
          <div className="truncate min-w-0">
            <h3 id="modal-image-title" className="text-xs sm:text-base font-bold text-slate-100 truncate">
              {image.title}
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">
              {image.date ? `Submitted ${new Date(image.date).toLocaleDateString()}` : 'Campus Fault Photo'}
            </p>
          </div>
        </div>

        {/* Toolbar & Close */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              title="Zoom out (-)"
            >
              −
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 sm:px-2 h-7 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-mono font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset Zoom (0)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              title="Zoom in (+)"
            >
              +
            </button>
          </div>

          {/* Open full in new tab */}
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg glass text-slate-200 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all items-center gap-1.5"
            title="Open raw image file in new browser tab"
          >
            <span>↗ Original</span>
          </a>

          {/* Prominent Close button */}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-500/30 shadow-lg"
            title="Close enlarged image (Esc)"
          >
            <span className="text-sm sm:text-base leading-none">✕</span>
            <span className="hidden sm:inline">Close</span>
            <kbd className="hidden md:inline-block ml-1 px-1 py-0.5 text-[9px] bg-black/50 rounded text-slate-400 border border-white/10">
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* ── Main Enlarged Image Canvas ── */}
      <div
        className="w-full max-w-[96vw] flex-1 my-3 flex items-center justify-center overflow-auto rounded-2xl glass border border-white/10 p-2 sm:p-4 shadow-2xl relative"
        onClick={onClose}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
            <span className="spinner" />
            <span className="text-sm">Loading full resolution image…</span>
          </div>
        )}

        <div
          className="flex items-center justify-center min-h-full min-w-full transition-transform duration-200 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={image.url}
            alt={image.title || `Fault photo for ticket #${image.ticketId}`}
            onLoad={() => setImgLoaded(true)}
            onClick={toggleZoom}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
            className={`max-w-[92vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl transition-all duration-200 select-none cursor-pointer ${
              scale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
            } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            title="Click to zoom in / out"
          />
        </div>
      </div>

      {/* ── Bottom Info Bar ── */}
      <div
        className="w-full max-w-[96vw] flex items-center justify-between text-xs text-slate-400 px-3 py-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-slate-500">
          💡 Tip: Click image to toggle zoom • Use <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">+</kbd> / <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">−</kbd> to scale
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white underline cursor-pointer"
        >
          Click backdrop to dismiss
        </button>
      </div>
    </div>
  );
}
