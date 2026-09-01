import React, { useState } from 'react';
import { SignupSchema, UserRole } from '@/lib/auth';

interface SignupPageProps {
  onSignup?: (data: { name: string; email: string; role: UserRole }) => void;
  onNavigateToLogin?: () => void;
}

export default function SignupPage({ onSignup, onNavigateToLogin }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CHILD');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = SignupSchema.safeParse({ name, email, password, role });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message || 'Validation error. Please check your inputs.');
      return;
    }

    if (onSignup) {
      onSignup({ name, email, role });
    }
  };

  return (
    <div
      id="signup-page-container"
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-stone-50"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/80 shadow-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 text-3xl font-bold shadow-xs">
            🪺
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 font-['Space_Grotesk',sans-serif]">
            Create a Nest Account
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Join the care ecosystem as a child, parent, or clinician
          </p>
        </div>

        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">Full Name / Nickname</label>
            <input
              id="signup-name-input"
              type="text"
              placeholder="e.g. Leo Martinez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent min-h-[48px] transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">Email Address</label>
            <input
              id="signup-email-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent min-h-[48px] transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">Password</label>
            <input
              id="signup-password-input"
              type="password"
              placeholder="•••••••• (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent min-h-[48px] transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Designated Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { role: 'CHILD' as const, emoji: '🧒', label: 'Child' },
                  { role: 'PARENT' as const, emoji: '👩', label: 'Parent' },
                  { role: 'CLINICIAN' as const, emoji: '🩺', label: 'Clinician' },
                ] as const
              ).map((item) => (
                <button
                  type="button"
                  key={item.role}
                  id={`signup-role-btn-${item.role.toLowerCase()}`}
                  onClick={() => setRole(item.role)}
                  className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 min-h-[52px] cursor-pointer ${
                    role === item.role
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

          <button
            id="signup-submit-btn"
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm transition-all shadow-sm min-h-[48px] flex items-center justify-center cursor-pointer"
          >
            Create {role === 'CHILD' ? 'Child' : role === 'PARENT' ? 'Parent' : 'Clinician'} Account
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer py-1"
          >
            Already have an account? <span className="underline font-bold text-stone-900">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
