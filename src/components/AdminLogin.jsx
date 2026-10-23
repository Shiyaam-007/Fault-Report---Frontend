import { useState } from 'react';
import { loginAdmin } from '../api';

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your admin username.');
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
              Admin Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                className="field field-icon-left"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="field field-icon-left field-icon-right"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer flex items-center"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-400 bg-slate-900 cursor-pointer"
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
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
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
