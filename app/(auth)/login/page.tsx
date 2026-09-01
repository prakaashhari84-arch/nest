import React, { useState } from 'react';
import { DUMMY_USERS, LoginSchema, UserRole } from '@/lib/auth';

interface LoginPageProps {
  onLogin?: (email: string, role?: string) => void;
  onNavigateToSignup?: () => void;
  errorMessage?: string | null;
}

export default function LoginPage({ onLogin, onNavigateToSignup, errorMessage }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('CHILD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDevAccounts, setShowDevAccounts] = useState(false);

  // In production, isDev is false
  const isDev = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.DEV);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message || 'Invalid input. Please check your credentials.');
      return;
    }

    if (onLogin) {
      onLogin(email, selectedRole);
    }
  };

  const handleQuickLogin = (userEmail: string, role: string) => {
    if (onLogin) {
      onLogin(userEmail, role);
    }
  };

  return (
    <div
      id="login-page-container"
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-stone-50"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 text-3xl font-bold shadow-xs">
            🪺
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-['Space_Grotesk',sans-serif]">
            Welcome to Nest
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Sign in to access your pediatric care and companion space
          </p>
        </div>

        {/* Error / Access Notice */}
        {errorMessage && (
          <div
            id="auth-error-banner"
            className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5"
          >
            <span className="text-base font-bold">⚠️</span>
            <div>
              <p className="font-semibold">Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {validationError}
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block text-center">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { role: 'CHILD', emoji: '🧒', label: 'Child' },
                { role: 'PARENT', emoji: '👩', label: 'Parent' },
                { role: 'CLINICIAN', emoji: '🩺', label: 'Clinician' },
              ] as const
            ).map((item) => (
              <button
                type="button"
                key={item.role}
                id={`role-tab-${item.role.toLowerCase()}`}
                onClick={() => setSelectedRole(item.role)}
                className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 min-h-[52px] cursor-pointer ${
                  selectedRole === item.role
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-stone-900/20'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">Email Address</label>
            <input
              id="login-email-input"
              type="email"
              placeholder={
                selectedRole === 'CHILD'
                  ? 'leo@nest-family.org'
                  : selectedRole === 'PARENT'
                  ? 'sarah.martinez@nest-family.org'
                  : 'dr.vance@nest-health.org'
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent min-h-[48px] transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">Password</label>
            <input
              id="login-password-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent min-h-[48px] transition-all"
              required
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm transition-all shadow-sm min-h-[48px] flex items-center justify-center cursor-pointer"
          >
            Sign In as {selectedRole === 'CHILD' ? 'Child' : selectedRole === 'PARENT' ? 'Parent' : 'Clinician'}
          </button>
        </form>

        {/* Toggle to Sign Up */}
        <div className="text-center pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onNavigateToSignup}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer py-1"
          >
            New to Nest? <span className="underline font-bold text-stone-900">Create an account</span>
          </button>
        </div>

        {/* Dev-Only QA Accounts (Completely excluded in production) */}
        {isDev && (
          <div className="pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowDevAccounts(!showDevAccounts)}
              className="text-[11px] font-mono text-stone-400 hover:text-stone-700 flex items-center justify-between w-full"
            >
              <span>[DEV ONLY] QA Dummy Accounts</span>
              <span>{showDevAccounts ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showDevAccounts && (
              <div className="mt-2 space-y-1.5">
                {DUMMY_USERS.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u.email, u.role)}
                    className="w-full p-2 text-left text-xs bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center justify-between"
                  >
                    <span>
                      {u.avatar} {u.name} ({u.role})
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
