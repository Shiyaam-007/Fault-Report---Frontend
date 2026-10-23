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
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileRef = useRef(null);

  // Load student tickets


  const loadMyTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Pass the student's ID so the backend returns tickets reported by this student
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

  // Handle Photo input
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Handle Ticket Submit
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!title.trim()) {
      setSubmitError('Please enter a title for the issue.');
      return;
    }
    if (!imageFile) {
      setSubmitError('Please take or choose a photo of the fault.');
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
      // Reload tickets and transition back to tickets tab
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
              onClick={() => setActiveTab('report')}
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
                onClick={() => setActiveTab('tickets')}
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
                onClick={() => setActiveTab('report')}
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
                  onClick={() => setActiveTab('report')}
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

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Fault Photo *
                    </label>

                    {/* Universal image input: supports camera, gallery, and file browsing automatically on mobile & desktop */}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />

                    {preview ? (
                      <div className="glass p-4 border border-indigo-500/30 rounded-xl">
                        <div className="relative w-full rounded-lg overflow-hidden mb-3">
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full max-h-64 object-cover rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg glass text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>🔄</span>
                            <span>Change Photo</span>
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
                            Remove photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="glass p-8 flex flex-col items-center justify-center gap-3 border border-dashed border-white/15 hover:border-indigo-400 transition-all rounded-xl cursor-pointer group"
                      >
                        <div className="text-4xl group-hover:scale-110 transition-transform">📸</div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            Tap to choose or take a photo
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Supports camera capture, photo gallery, and file upload
                          </p>
                        </div>
                        <span className="mt-2 py-2 px-4 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold text-xs transition-all pointer-events-none group-hover:bg-indigo-500/30">
                          Select Photo
                        </span>
                      </div>
                    )}
                  </div>



                  {/* Submit Button */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('tickets')}
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
          onClick={() => setActiveTab('report')}
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

