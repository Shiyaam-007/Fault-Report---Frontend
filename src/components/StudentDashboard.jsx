import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTickets, createTicket, photoUrl } from '../api';
import ImageModal from './ImageModal';

const STATUS_CONFIG = {
  OPEN: {
    label: 'Open',
    dot: 'bg-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Submitted & awaiting campus maintenance inspection',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Technician dispatched — repairs currently underway',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Issue inspected, repaired, and closed',
  },
};

function StatCard({ label, value, color, icon }) {
  return (
    <div className="glass p-3.5 sm:p-5 flex-1 min-w-0 relative overflow-hidden">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate mr-1">{label}</p>
        <span className="text-base sm:text-lg opacity-70 shrink-0">{icon}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}

export default function StudentDashboard({ studentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'report'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // Report Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Camera & Photo State
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Detect mobile vs laptop/desktop
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || '';
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 850);
    };
    setIsMobile(checkMobile());
  }, []);

  // Cleanup webcam stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Attach active webcam stream to the video element
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
    setSubmitError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setWebcamError('Camera is not supported on this browser or connection. Fault reports require a camera capture.');
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
        setWebcamError('Camera permission was denied. Please allow camera access in your browser settings to report faults.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setWebcamError('No camera detected on this laptop/device. Live camera capture is required to report campus faults. Please use a device with a camera (e.g. mobile phone).');
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

  // Initiate camera capture based on device:
  // - Mobile: Uses native camera via capture="environment" (directly opens camera, never files/gallery)
  // - Laptop / PC: Directly starts in-browser webcam stream (NEVER opens OS file dialog box)
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

  // Native mobile camera handler (capture="environment")
  const handleNativeCameraChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Safe tab switcher that turns off webcam when leaving report view
  const handleTabSwitch = (tab) => {
    if (tab !== 'report') {
      stopWebcam();
    }
    setActiveTab(tab);
  };

  // Load student tickets
  const loadMyTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTickets(studentUser?.id);
      setTickets(data);
    } catch {
      setError('Unable to load your reported tickets. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [studentUser?.id]);

  useEffect(() => {
    loadMyTickets();
  }, [loadMyTickets]);

  // Handle Ticket Submit
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!title.trim()) {
      setSubmitError('Please enter a title for the issue.');
      return;
    }
    if (!imageFile) {
      setSubmitError('Please take a live photo of the fault using your camera.');
      return;
    }

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('image', imageFile);
    if (studentUser?.id) {
      fd.append('reporterId', studentUser.id);
    }

    setSubmitting(true);
    try {
      await createTicket(fd);
      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      setPreview(null);
      setImageFile(null);
      stopWebcam();
      await loadMyTickets();
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('tickets');
      }, 1500);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Derived statistics
  const counts = {
    TOTAL: tickets.length,
    OPEN: tickets.filter(t => t.status === 'OPEN').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
  };

  const filteredTickets = tickets
    .filter(t => {
      const matchFilter = filter === 'ALL' || t.status === filter;
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
      return matchFilter && matchSearch;
    })
    .sort((a, b) => b.id - a.id);

  const openEnlargedPhoto = (ticket) => {
    setSelectedImage({
      url: photoUrl(ticket.id),
      ticketId: ticket.id,
      title: ticket.title,
      date: ticket.createdAt,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen fade-up pb-16">
      {/* ── Topbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 topbar-glass px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-base sm:text-xl shadow-lg shadow-indigo-500/20 shrink-0">
            🏛️
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="live-dot shrink-0" />
              <h1 className="text-xs sm:text-base font-bold gradient-text tracking-tight leading-tight truncate">
                Campus Fault Reporter
              </h1>
            </div>
            <p className="text-[9px] sm:text-[11px] text-slate-400 truncate hidden xs:block">Student Portal & Issue Tracker</p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:block">
            <button
              onClick={() => handleTabSwitch('report')}
              className="btn-primary py-2 px-3.5 text-xs font-bold"
            >
              <span>➕</span>
              <span>Report Fault</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-white/10">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200 leading-tight max-w-[80px] sm:max-w-none truncate">
                {studentUser?.name || 'Student'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                🎓 Student
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Log out"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main container ─────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-8">
        {/* Welcome Banner */}
        <div className="glass p-5 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden border border-white/10 rounded-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-0.5 sm:mb-1 inline-block">
                Welcome back
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white">
                Hi, {studentUser?.name || 'Student'} 👋
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Track your reported campus infrastructure issues or report a new fault to help keep our facilities safe and functional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleTabSwitch('tickets')}
                className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeTab === 'tickets'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'glass text-slate-300 hover:text-white'
                }`}
              >
                <span>📋</span>
                <span className="truncate">My Tickets ({counts.TOTAL})</span>
              </button>
              <button
                onClick={() => handleTabSwitch('report')}
                className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeTab === 'report'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg'
                    : 'glass text-slate-300 hover:text-white'
                }`}
              >
                <span>📷</span>
                <span className="truncate">New Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Summary ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <StatCard label="Total Reported" value={counts.TOTAL} color="text-indigo-400" icon="📑" />
          <StatCard label="Pending / Open" value={counts.OPEN} color="text-indigo-300" icon="⏳" />
          <StatCard label="In Progress" value={counts.IN_PROGRESS} color="text-amber-400" icon="🔧" />
          <StatCard label="Resolved" value={counts.RESOLVED} color="text-emerald-400" icon="✅" />
        </div>

        {/* ── TAB 1: My Reported Tickets ────────────────────── */}
        {activeTab === 'tickets' && (
          <div>
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-scroll pb-1 sm:pb-0">
                {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                      filter === s
                        ? 'bg-indigo-500/30 border-indigo-400 text-indigo-300'
                        : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {s === 'ALL' ? 'All Tickets' : STATUS_CONFIG[s]?.label || s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  className="field flex-1 sm:max-w-xs text-xs"
                  placeholder="🔍 Search my tickets…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  onClick={loadMyTickets}
                  className="px-3 py-2 glass rounded-lg text-slate-400 hover:text-white transition-colors text-xs font-semibold cursor-pointer shrink-0"
                  title="Refresh tickets"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {/* Loading / Error States */}
            {loading && (
              <div className="glass p-12 text-center">
                <div className="spinner mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Fetching your reported tickets…</p>
              </div>
            )}

            {error && (
              <div className="glass p-5 border-rose-500/40 text-rose-300 text-sm flex items-center justify-between mb-6">
                <span>⚠️ {error}</span>
                <button onClick={loadMyTickets} className="underline text-xs cursor-pointer">
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredTickets.length === 0 && (
              <div className="glass p-12 text-center max-w-md mx-auto">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {search || filter !== 'ALL' ? 'No matching tickets found' : 'No tickets reported yet'}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-6">
                  {search || filter !== 'ALL'
                    ? 'Try adjusting your filters or search keywords.'
                    : 'Report broken lights, damaged benches, water leakage or any campus issue.'}
                </p>
                <button
                  onClick={() => handleTabSwitch('report')}
                  className="btn-primary py-2.5 px-5 text-xs font-bold"
                >
                  ➕ Report Your First Issue
                </button>
              </div>
            )}

            {/* Tickets Grid */}
            {!loading && filteredTickets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTickets.map((t) => {
                  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
                  return (
                    <div
                      key={t.id}
                      className="glass p-5 flex flex-col justify-between border border-white/10 hover:border-indigo-500/40 transition-all rounded-xl relative overflow-hidden group shadow-md"
                    >
                      <div>
                        {/* Top info */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            Ticket #{t.id}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            <span>{cfg.label}</span>
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-1.5">
                          {t.title}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                          {t.description || 'No additional description provided.'}
                        </p>

                        {/* Photo preview if available */}
                        {t.hasPhoto && (
                          <div className="mb-4">
                            <div
                              onClick={() => openEnlargedPhoto(t)}
                              className="relative cursor-pointer overflow-hidden rounded-xl border border-white/10 group/img w-full sm:w-fit"
                            >
                              <img
                                src={photoUrl(t.id)}
                                alt={t.title}
                                className="w-full sm:w-36 h-40 sm:h-24 object-cover rounded-xl group-hover/img:scale-105 transition-transform"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <span className="text-[10px] text-white font-bold bg-slate-900/80 px-2 py-0.5 rounded">
                                  🔍 View Photo
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer & Status update description */}
                      <div className="pt-3 border-t border-white/5 flex flex-col gap-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Reported: {formatDate(t.createdAt)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 italic">
                          ℹ️ {cfg.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Report an Issue ────────────────────────── */}
        {activeTab === 'report' && (
          <div className="max-w-xl mx-auto">
            {submitSuccess ? (
              <div className="glass p-10 text-center fade-up border border-emerald-500/40">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-xl font-bold gradient-text mb-2">Report Submitted Successfully!</h3>
                <p className="text-slate-300 text-xs sm:text-sm mb-4">
                  Campus maintenance has received your report and ticket has been added to your dashboard.
                </p>
                <div className="spinner mx-auto" />
                <p className="text-[11px] text-slate-400 mt-2">Returning to your tickets...</p>
              </div>
            ) : (
              <div className="glass p-6 sm:p-8 border border-white/10 shadow-2xl">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="live-dot" />
                    <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                      New Fault Report
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Report a Campus Issue</h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    Please provide clear details and a photo so maintenance can quickly diagnose and fix the problem.
                  </p>
                </div>

                {submitError && (
                  <div className="glass p-3.5 mb-5 border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleReportSubmit} className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Issue Title *
                    </label>
                    <input
                      className="field"
                      placeholder="e.g. Broken water tap in Block B 2nd floor restroom"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Description & Location Details
                    </label>
                    <textarea
                      className="field resize-none"
                      rows={3}
                      placeholder="Explain the issue in detail, precise room number, urgency, etc…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Photo Upload - Camera Only */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Fault Photo (Camera Only) *</span>
                      <span className="text-[10px] text-cyan-400 font-normal">📸 Live capture required</span>
                    </label>

                    {/* Native mobile camera input: capture="environment" opens rear camera directly on phones; NEVER triggered on laptops */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleNativeCameraChange}
                    />

                    {/* 1. Preview of Captured Photo */}
                    {preview ? (
                      <div className="glass p-4 border border-indigo-500/30 rounded-xl">
                        <div className="relative w-full rounded-lg overflow-hidden mb-3 bg-black/40">
                          <img
                            src={preview}
                            alt="Captured fault"
                            className="w-full max-h-72 object-contain rounded-lg shadow-lg"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-emerald-500/90 text-white font-bold text-[10px] shadow flex items-center gap-1.5">
                            <span>✓</span> Photo Captured
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={handleInitiateCapture}
                            className="px-3.5 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>🔄</span>
                            <span>Retake Photo</span>
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
                            Remove photo
                          </button>
                        </div>
                      </div>
                    ) : isWebcamActive ? (
                      /* 2. Live in-browser Webcam Viewfinder (Laptops/PCs) */
                      <div className="glass p-4 border border-indigo-500/40 rounded-xl shadow-xl flex flex-col items-center">
                        <div className="relative w-full rounded-xl overflow-hidden bg-black mb-3">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 sm:h-80 object-cover rounded-xl"
                          />
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[11px] font-bold flex items-center gap-1.5 shadow">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span>Live Camera</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 w-full">
                          <button
                            type="button"
                            onClick={captureFromWebcam}
                            className="btn-primary py-2.5 px-6 text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer"
                          >
                            <span>📸</span>
                            <span>Capture Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopWebcam}
                            className="px-4 py-2.5 rounded-xl glass text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 3. Camera Capture Initiation */
                      <div className="glass p-6 sm:p-8 flex flex-col items-center justify-center gap-3 border border-dashed border-white/15 rounded-xl">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-3xl mb-1 shadow-inner">
                          📷
                        </div>

                        <div className="text-center max-w-sm">
                          <p className="text-sm font-bold text-slate-100">
                            Take a Live Photo of the Fault
                          </p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Live camera picture only. Files and gallery uploads are disabled to ensure genuine on-site reports.
                          </p>
                        </div>

                        {webcamError && (
                          <div className="w-full glass p-3 border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs rounded-xl flex items-start gap-2 mt-1">
                            <span className="text-base leading-none shrink-0">⚠️</span>
                            <span>{webcamError}</span>
                          </div>
                        )}

                        <div className="mt-2 flex flex-col items-center gap-2 w-full max-w-xs">
                          <button
                            type="button"
                            onClick={handleInitiateCapture}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                          >
                            <span>📸</span>
                            <span>{isMobile ? 'Open Phone Camera' : 'Take Picture with Camera'}</span>
                          </button>

                          {/* Fallback option on mobile to use in-browser viewfinder if preferred */}
                          {isMobile && (
                            <button
                              type="button"
                              onClick={startWebcam}
                              className="text-[11px] text-cyan-400 hover:underline cursor-pointer pt-1"
                            >
                              Or open in-browser camera viewfinder
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('tickets')}
                      className="flex-1 py-3.5 glass text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-2 btn-primary py-3.5 text-xs font-bold shadow-lg"
                    >
                      {submitting ? (
                        <>
                          <span className="spinner" /> Submitting Report…
                        </>
                      ) : (
                        '🚀 Submit Fault Report'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Mobile Floating Action Button ──────────────────── */}
      {activeTab === 'tickets' && (
        <button
          onClick={() => handleTabSwitch('report')}
          className="sm:hidden fixed bottom-6 right-5 z-30 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-2xl shadow-indigo-600/50 flex items-center gap-2 font-bold text-xs cursor-pointer border border-white/20 active:scale-95 transition-transform"
          aria-label="Report new fault"
        >
          <span className="text-base">➕</span>
          <span>Report Fault</span>
        </button>
      )}

      {/* ── Image Modal ───────────────────────────────────── */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

