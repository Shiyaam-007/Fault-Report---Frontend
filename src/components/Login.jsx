import { useState } from 'react';
import { loginUser, registerStudent } from '../api';

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const handleFillDemo = (type) => {


    setError('');
    setRegSuccess('');
    if (type === 'student') {
      setUsername('student');
      setPassword('student123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        const newUser = await registerStudent({
          name: name.trim(),
          username: username.trim(),
          password: password.trim(),
        });

        const sessionData = {
          ...newUser,
          savedAt: Date.now(),
        };

        if (rememberMe) {
          localStorage.setItem('campus_fault_user', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('campus_fault_user', JSON.stringify(sessionData));
        }

        setUsername('');
        setPassword('');
        setName('');
        onLoginSuccess(sessionData);
      } else {
        const userData = await loginUser({ username, password });

        const sessionData = {
          ...userData,
          savedAt: Date.now(),
        };

        if (rememberMe) {
          localStorage.setItem('campus_fault_user', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('campus_fault_user', JSON.stringify(sessionData));
        }

        setUsername('');
        setPassword('');
        onLoginSuccess(sessionData);
      }
    } catch (err) {

      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3.5 py-6 sm:py-12 fade-up relative overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="glass p-5 sm:p-8 md:p-10 max-w-md w-full relative z-10 shadow-2xl border border-white/10 rounded-2xl">
        {/* Brand header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 border border-white/10 mb-3 sm:mb-4 shadow-xl text-2xl sm:text-3xl">
            🏛️
          </div>
          <div className="inline-flex items-center gap-2 justify-center mb-1 w-full">
            <span className="live-dot" />
            <span className="text-[11px] sm:text-xs text-cyan-400 font-bold tracking-widest uppercase">
              Campus Fault Portal
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold gradient-text tracking-tight">
            {mode === 'login' ? 'Single Sign-In' : 'Create Student Account'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {mode === 'login'
              ? 'Log in to report campus faults or manage infrastructure operations'
              : 'Register to report issues and track your ticket status in real-time'}
          </p>
        </div>


        {/* Tab switcher: Login / Register */}
        <div className="flex rounded-xl bg-slate-900/70 p-1 mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setRegSuccess(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setRegSuccess(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Student
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 glass p-3.5 border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {regSuccess && (
          <div className="mb-5 glass p-3.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
            <span className="text-base shrink-0">✓</span>
            <span>{regSuccess}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name *
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
                  placeholder="e.g. Alice Walker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  required={mode === 'register'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Username *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <input
                type="text"
                className="field field-icon-left"
                placeholder={mode === 'register' ? 'Choose a unique username' : 'Enter username (e.g. student or admin)'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password *
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
              <span>Remember session</span>
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
            ) : mode === 'login' ? (
              'Sign In to Dashboard'
            ) : (
              'Create Account & Enter'
            )}
          </button>
        </form>

        {/* Demo Fast-Login Pills */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Quick Demo Sign-In
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('student')}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold glass border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🎓</span>
              <span className="truncate">Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold glass border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🛡️</span>
              <span className="truncate">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

