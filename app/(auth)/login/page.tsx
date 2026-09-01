import React from 'react';
import { DUMMY_USERS, LoginInput, LoginSchema } from '@/lib/auth';

interface LoginPageProps {
  onLogin?: (email: string, role?: string) => void;
  errorMessage?: string | null;
}

export default function LoginPage({ onLogin, errorMessage }: LoginPageProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message || 'Invalid input');
      return;
    }

    if (onLogin) {
      onLogin(email);
    }
  };

  const handleQuickLogin = (userEmail: string, role: string) => {
    if (onLogin) {
      onLogin(userEmail, role);
    }
  };

  return (
    <div id="login-page-container" className="w-full max-w-md mx-auto p-6">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-2xl font-bold">
            🪺
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Sign in to nest</h1>
          <p className="text-sm text-stone-500">
            Select a dummy role below or log in with credentials
          </p>
        </div>

        {/* Middleware / Auth Error Banner */}
        {errorMessage && (
          <div id="auth-error-banner" className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
            <span className="text-base font-bold">⚠️</span>
            <div>
              <p className="font-semibold">Access Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {validationError}
          </div>
        )}

        {/* Quick Role Tester Accounts */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">
            Instant Role Login (Test Accounts)
          </label>
          <div className="grid grid-cols-1 gap-2">
            {DUMMY_USERS.map((user) => (
              <button
                key={user.id}
                id={`quick-login-${user.role.toLowerCase()}`}
                type="button"
                onClick={() => handleQuickLogin(user.email, user.role)}
                className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-white text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl p-1.5 rounded-lg bg-white shadow-xs border border-stone-200">
                    {user.avatar}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      {user.name}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        user.role === 'CHILD'
                          ? 'bg-amber-100 text-amber-800'
                          : user.role === 'PARENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">{user.email}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-stone-400 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-all">
                  Log in →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-stone-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider">
            or manual credentials
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Email Address</label>
            <input
              id="login-email-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Password</label>
            <input
              id="login-password-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              required
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors shadow-xs"
          >
            Sign in with Credentials
          </button>
        </form>
      </div>
    </div>
  );
}
