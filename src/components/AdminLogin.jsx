import { useState } from 'react';
import { loginAdmin } from '../api';

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your admin username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const userData = await loginAdmin({ username, password });
      
      const sessionData = {
        ...userData,
        savedAt: Date.now(),
      };

      if (rememberMe) {
        localStorage.setItem('campus_fault_admin', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('campus_fault_admin', JSON.stringify(sessionData));
      }

      onLoginSuccess(sessionData);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 fade-up">
      <div className="glass p-8 sm:p-10 max-w-md w-full relative overflow-hidden shadow-2xl border border-white/10">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-white/10 mb-4 shadow-lg text-2xl">
            🛡️
          </div>
          <div className="inline-flex items-center gap-2 justify-center mb-1 w-full">
            <span className="live-dot" />
            <span className="text-xs text-cyan-400 font-semibold tracking-widest uppercase">
              Restricted Area
            </span>
          </div>
          <h2 className="text-2xl font-bold gradient-text tracking-tight">
            Admin Portal Login
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Authenticate to review, manage, and update reported campus faults.
          </p>
        </div>

        {/* Demo credentials hint pill */}
        <div className="mb-6 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
          <div>
            <span className="text-indigo-300 font-semibold">Demo credentials:</span>
            <div className="text-slate-400 font-mono text-[11px] mt-0.5">
              admin / admin123
            </div>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium transition-colors"
          >
            Auto Fill
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 glass p-3.5 border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Admin Username or Email
            </label>
            <div className="relative">
              <input
                type="text"
                className="field pl-10"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                👤
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="field pl-10 pr-10"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                🔒
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-medium focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-400 bg-slate-900"
              />
              <span>Remember this session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 mt-2 text-sm font-bold shadow-lg"
          >
            {loading ? (
              <>
                <span className="spinner" /> Authenticating…
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Back button */}
        {onCancel && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <span>←</span>
              <span>Back to Student Reporter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
