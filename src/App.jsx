import { useState, useEffect } from 'react';
import ReportView    from './components/ReportView';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin     from './components/AdminLogin';
import './index.css';

export default function App() {
  const [view, setView] = useState('report'); // 'report' | 'admin'
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('campus_fault_admin') || sessionStorage.getItem('campus_fault_admin');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('campus_fault_admin');
    sessionStorage.removeItem('campus_fault_admin');
    setAdminUser(null);
  };

  const handleLoginSuccess = (user) => {
    setAdminUser(user);
  };

  return (
    <div className="min-h-screen">
      {/* ── Role switcher floating pill ── */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 p-1.5 glass rounded-full shadow-2xl border border-white/10">
        <button
          onClick={() => setView('report')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
            view === 'report'
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📱 Student
        </button>
        <button
          onClick={() => setView('admin')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
            view === 'admin'
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🖥 Admin</span>
          {adminUser ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Admin Logged In" />
          ) : (
            <span className="text-[10px] text-slate-400">🔒</span>
          )}
        </button>
      </div>

      {/* ── View Router ── */}
      {view === 'report' && <ReportView />}

      {view === 'admin' && (
        adminUser ? (
          <AdminDashboard
            adminUser={adminUser}
            onLogout={handleLogout}
          />
        ) : (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setView('report')}
          />
        )
      )}
    </div>
  );
}
