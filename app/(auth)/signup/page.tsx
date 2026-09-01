import React from 'react';
import { SignupSchema, UserRole } from '@/lib/auth';

interface SignupPageProps {
  onSignup?: (data: { name: string; email: string; role: UserRole }) => void;
  onNavigateToLogin?: () => void;
}

export default function SignupPage({ onSignup, onNavigateToLogin }: SignupPageProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('CHILD');
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = SignupSchema.safeParse({ name, email, password, role });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message || 'Validation error');
      return;
    }

    if (onSignup) {
      onSignup({ name, email, role });
    }
  };

  return (
    <div id="signup-page-container" className="w-full max-w-md mx-auto p-6">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-2xl font-bold">
            🪺
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Create a nest account</h1>
          <p className="text-sm text-stone-500">
            Sign up and select your designated role
          </p>
        </div>

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Full Name</label>
            <input
              id="signup-name-input"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Email Address</label>
            <input
              id="signup-email-input"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Password</label>
            <input
              id="signup-password-input"
              type="password"
              placeholder="•••••••• (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Account Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['CHILD', 'PARENT', 'CLINICIAN'] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  id={`signup-role-btn-${r.toLowerCase()}`}
                  onClick={() => setRole(r)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    role === r
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {r === 'CHILD' ? '🧒 Child' : r === 'PARENT' ? '👩 Parent' : '🩺 Clinician'}
                </button>
              ))}
            </div>
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors shadow-xs"
          >
            Create Account
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            Already have an account? <span className="underline font-semibold">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
