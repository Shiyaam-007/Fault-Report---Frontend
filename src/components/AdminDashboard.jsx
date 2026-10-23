import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTickets, updateStatus, photoUrl } from '../api';
import ImageModal from './ImageModal';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

const STATUS_CONFIG = {
  OPEN: {
    label: 'Open',
    dot: 'bg-indigo-400',
    btn: 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/35 text-indigo-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-amber-400',
    btn: 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-300',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-emerald-400',
    btn: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-300',
  },
};

function StatusDropdown({ status, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 210);
    }
    setOpen(!open);
  };

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;

  return (
    <div className="relative inline-block text-left" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`inline-flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm min-w-[130px] ${cfg.btn} ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <span className="flex items-center gap-2">
          {disabled ? (
            <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin inline-block" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          )}
          <span>{cfg.label}</span>
        </span>
        <span className={`text-[9px] text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-white' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div
          className={`absolute ${openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} right-0 w-44 rounded-xl border border-slate-700/80 shadow-2xl z-50 p-1.5 animate-fade-in`}
          style={{ backgroundColor: '#0f172a' }}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
            Update Status
          </div>
          {STATUSES.map((s) => {
            const isSelected = s === status;
            const itemCfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!isSelected) onChange(s);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${itemCfg.dot}`} />
                  <span>{itemCfg.label}</span>
                </span>
                {isSelected && <span className="text-cyan-400 font-bold text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="glass p-5 flex-1 min-w-[130px]">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard({ adminUser, onLogout }) {
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('ALL');
  const [search, setSearch]         = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const [sortOrder, setSortOrder]   = useState('asc');

  const load = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const data = await fetchTickets();
      setTickets(data);
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2000);
    } catch {
      setError('Could not load tickets. Is the backend running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      const updated = await updateStatus(ticketId, newStatus);
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
    } catch {
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Derived state ─────────────────────────────────────── */
  const counts = {
    OPEN:        tickets.filter(t => t.status === 'OPEN').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    RESOLVED:    tickets.filter(t => t.status === 'RESOLVED').length,
  };

  const visible = tickets
    .filter(t => {
      const matchFilter = filter === 'ALL' || t.status === filter;
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
      return matchFilter && matchSearch;
    })
    .sort((a, b) => (sortOrder === 'asc' ? a.id - b.id : b.id - a.id));


  const openEnlargedPhoto = (ticket) => {
    setSelectedImage({
      url: photoUrl(ticket.id),
      ticketId: ticket.id,
      title: ticket.title,
      date: ticket.createdAt,
    });
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen fade-up">
      {/* ── Topbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="live-dot" />
          <div>
            <h1 className="text-lg font-bold gradient-text tracking-tight leading-tight">
              Campus Fault Admin
            </h1>
            <p className="text-[10px] text-slate-400">Control Panel & Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span className="hidden sm:inline">{tickets.length} total tickets</span>
            <button
              onClick={load}
              disabled={refreshing}
              className={`px-3 py-1.5 glass rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${
                justRefreshed
                  ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:border-cyan-400/50'
              } ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
              title="Refresh tickets list"
            >
              <span className={`inline-block ${refreshing ? 'animate-spin' : ''}`}>↻</span>
              <span>{refreshing ? 'Refreshing…' : justRefreshed ? 'Updated!' : 'Refresh'}</span>
            </button>
          </div>


          {/* Admin User Badge & Logout */}
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200 leading-tight">
                {adminUser?.name || 'Bob Admin'}
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                Administrator
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Log out of Admin Panel"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Stat cards ──────────────────────────────── */}
        <div className="flex flex-wrap gap-4 mb-8">
          <StatCard label="Open"        value={counts.OPEN}        color="text-indigo-400" />
          <StatCard label="In Progress" value={counts.IN_PROGRESS} color="text-orange-400" />
          <StatCard label="Resolved"    value={counts.RESOLVED}    color="text-green-400"  />
        </div>

        {/* ── Filters ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            className="field max-w-xs"
            placeholder="🔍 Search tickets by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            {['ALL', ...STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filter === s
                    ? 'bg-indigo-500/30 border-indigo-400 text-indigo-300'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                {STATUS_CONFIG[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>

        {/* ── States ──────────────────────────────────── */}
        {loading && (
          <div className="flex items-center gap-3 text-slate-400 py-20 justify-center">
            <span className="spinner" /> Loading tickets…
          </div>
        )}
        {error && (
          <div className="glass p-4 border-rose-500/40 text-rose-300 text-sm mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={load}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Table ───────────────────────────────────── */}
        {!loading && !error && (
          <div className="glass overflow-visible no-scrollbar">
            <div className="overflow-visible no-scrollbar min-h-[140px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-xs text-slate-500 uppercase tracking-wider">
                    <th
                      className="text-left px-4 py-3 cursor-pointer select-none hover:text-slate-300 transition-colors"
                      onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                      title={`Sort by Ticket # (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>#</span>
                        <span className="text-[10px] text-cyan-400 font-bold">
                          {sortOrder === 'asc' ? '▲' : '▼'}
                        </span>
                      </span>
                    </th>
                    <th className="text-left px-4 py-3">Title</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Created</th>
                    <th className="text-left px-4 py-3">Photo</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-500 py-16">
                        No tickets match your filter.
                      </td>
                    </tr>
                  )}
                  {visible.map((ticket) => (
                    <tr key={`group-${ticket.id}`} className="contents">
                      <tr
                        key={ticket.id}
                        className={`border-b border-white/5 transition-colors hover:bg-white/3 cursor-pointer ${
                          expandedId === ticket.id ? 'bg-white/4' : ''
                        }`}
                        onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                      >
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                          #{ticket.id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-200 max-w-[280px] truncate">
                          {ticket.title}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          {ticket.hasPhoto ? (
                            <button
                              type="button"
                              onClick={() => openEnlargedPhoto(ticket)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/35 border border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer group"
                              title="Click to view photo enlarged"
                            >
                              <span className="text-xs group-hover:scale-110 transition-transform">🔍</span>
                              <span>View Photo</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <StatusDropdown
                            status={ticket.status}
                            disabled={updatingId === ticket.id}
                            onChange={(newStatus) => handleStatusChange(ticket.id, newStatus)}
                          />
                        </td>
                      </tr>

                      {/* ── Expanded row — photo + details ── */}
                      {expandedId === ticket.id && (
                        <tr key={`${ticket.id}-expand`} className="bg-white/3">
                          <td colSpan={5} className="px-6 py-5">

                            <div className="flex flex-wrap gap-6">
                              {/* Photo */}
                              {ticket.hasPhoto && (
                                <div className="shrink-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                      Attached Photo
                                    </p>
                                    <span className="text-[10px] text-cyan-400 font-medium">Click to enlarge 🔍</span>
                                  </div>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEnlargedPhoto(ticket);
                                    }}
                                    className="group relative cursor-zoom-in overflow-hidden rounded-xl shadow-lg border border-white/10 hover:border-cyan-400/60 transition-all duration-200"
                                    title="Click to view enlarged photo"
                                  >
                                    <img
                                      src={photoUrl(ticket.id)}
                                      alt={`Ticket #${ticket.id}`}
                                      className="w-72 h-48 sm:w-[440px] sm:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-semibold text-xs backdrop-blur-[2px]">
                                      <span className="text-base">🔍</span>
                                      <span>Click to Enlarge</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* Description + meta */}
                              <div className="flex-1 min-w-[200px]">
                                <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/5 inline-flex flex-wrap items-center gap-4 text-xs">
                                  <div>
                                    <span className="text-slate-400">Ticket ID: </span>
                                    <span className="font-mono text-cyan-400 font-bold">#{ticket.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Created: </span>
                                    <span className="text-slate-300">{new Date(ticket.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">
                                  Description
                                </p>
                                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                  {ticket.description || 'No description provided.'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Last Status Update: {new Date(ticket.updatedAt).toLocaleString()}
                                </p>
                              </div>

                            </div>

                          </td>
                        </tr>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Enlarged Image Lightbox Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
