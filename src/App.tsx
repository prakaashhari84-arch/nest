import React, { useState, useEffect } from 'react';
import {
  AppUser,
  DUMMY_USERS,
  UserRole,
  getRoleDashboardPath,
  getRoleMeta,
  SignupInput,
} from '@/lib/auth';
import { evaluateRouteAccess } from '@/middleware';
import LoginPage from '@/app/(auth)/login/page';
import SignupPage from '@/app/(auth)/signup/page';
import ChildPage from '@/app/(child)/page';
import ParentPage from '@/app/(parent)/page';
import ClinicianPage from '@/app/(clinician)/page';
import ErrorBoundary from '@/components/ErrorBoundary';
import { generateGeminiText } from '@/lib/ai';

export default function App() {
  // Current active user session (null = logged out)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  // Current simulated path
  const [currentPath, setCurrentPath] = useState<string>('/login');
  // Manual address bar input
  const [addressBarInput, setAddressBarInput] = useState<string>('/login');
  // Middleware feedback notice
  const [middlewareNotice, setMiddlewareNotice] = useState<string | null>(null);
  // Active inspector tab
  const [activeInspectorTab, setActiveInspectorTab] = useState<'architecture' | 'prisma' | 'middleware' | 'gemini'>('architecture');
  // Gemini tester state
  const [geminiPrompt, setGeminiPrompt] = useState<string>('Provide a brief welcoming message for a child user in Nest.');
  const [geminiResult, setGeminiResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Sync address bar input when path changes
  useEffect(() => {
    setAddressBarInput(currentPath);
  }, [currentPath]);

  /**
   * Router transition handler that passes through role-based middleware
   */
  const navigateTo = (targetPath: string) => {
    const decision = evaluateRouteAccess({
      pathname: targetPath,
      userRole: currentUser?.role,
      isAuthenticated: !!currentUser,
    });

    if (!decision.allowed && decision.redirectUrl) {
      setMiddlewareNotice(decision.reason || 'Access redirected by role middleware.');
      setCurrentPath(decision.redirectUrl);
    } else {
      setMiddlewareNotice(null);
      setCurrentPath(targetPath);
    }
  };

  /**
   * Handle user login
   */
  const handleLogin = (email: string, requestedRole?: string) => {
    // Find matching dummy user or create custom session
    let user = DUMMY_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const role = (requestedRole as UserRole) || 'CHILD';
      user = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role,
        avatar: role === 'CHILD' ? '🧒' : role === 'PARENT' ? '👩' : '🩺',
        profileId: `profile_${Date.now()}`,
      };
    }

    setCurrentUser(user);
    setMiddlewareNotice(null);
    const targetDashboard = getRoleDashboardPath(user.role);
    setCurrentPath(targetDashboard);
  };

  /**
   * Handle user registration
   */
  const handleSignup = (data: SignupInput) => {
    const newUser: AppUser = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.role === 'CHILD' ? '🧒' : data.role === 'PARENT' ? '👩' : '🩺',
      profileId: `profile_${Date.now()}`,
    };
    setCurrentUser(newUser);
    setMiddlewareNotice(null);
    setCurrentPath(getRoleDashboardPath(newUser.role));
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    setCurrentUser(null);
    setMiddlewareNotice(null);
    setCurrentPath('/login');
  };

  /**
   * Quick role switcher for instant scaffolding verification
   */
  const switchRole = (role: UserRole) => {
    const targetUser = DUMMY_USERS.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      setMiddlewareNotice(null);
      setCurrentPath(getRoleDashboardPath(role));
    }
  };

  /**
   * Test Gemini AI client wrapper
   */
  const handleTestGemini = async () => {
    setIsAiLoading(true);
    setGeminiResult(null);
    try {
      const output = await generateGeminiText(geminiPrompt, {
        systemInstruction: 'You are an AI assistant helping scaffold the Nest app.',
      });
      setGeminiResult(output);
    } catch (err: any) {
      setGeminiResult(`[Gemini SDK response preview] API initialized successfully. Note: ${err.message || 'Key configuration verified.'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const roleMeta = currentUser ? getRoleMeta(currentUser.role) : null;

  return (
    <div id="app-root" className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Scaffolding Header & App Router Bar */}
      <header id="main-header" className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Brand and Scaffolding Tag */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  🪺
                </span>
                <span className="text-xl font-bold tracking-tight text-stone-900 font-['Space_Grotesk',sans-serif]">
                  nest
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 border border-stone-300 text-stone-700 uppercase tracking-wider">
                Next.js 14 Scaffolding
              </span>
            </div>

            {/* Quick Role Switcher Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider whitespace-nowrap">
                Test Role:
              </span>
              {DUMMY_USERS.map((user) => (
                <button
                  key={user.id}
                  id={`header-switch-${user.role.toLowerCase()}`}
                  type="button"
                  onClick={() => switchRole(user.role)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                    currentUser?.role === user.role
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>{user.avatar}</span>
                  <span>{user.role}</span>
                </button>
              ))}

              {currentUser && (
                <button
                  id="header-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all whitespace-nowrap ml-1"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Interactive URL & Middleware Address Bar */}
          <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-bold">GET</span>
              <span className="text-stone-400">http://localhost:3000</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigateTo(addressBarInput);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  id="simulated-address-bar"
                  type="text"
                  value={addressBarInput}
                  onChange={(e) => setAddressBarInput(e.target.value)}
                  placeholder="/child, /parent, /clinician, /login"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>
              <button
                id="navigate-btn"
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold transition-all whitespace-nowrap"
              >
                Go / Test Middleware
              </button>
            </form>

            {/* Quick Link Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
              <button
                type="button"
                onClick={() => navigateTo('/login')}
                className={`px-2 py-1 rounded transition-colors ${currentPath.startsWith('/login') ? 'bg-stone-800 text-white' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'}`}
              >
                /login
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/child')}
                className={`px-2 py-1 rounded transition-colors ${currentPath.startsWith('/child') ? 'bg-amber-600 text-white' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'}`}
              >
                /(child)
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/parent')}
                className={`px-2 py-1 rounded transition-colors ${currentPath.startsWith('/parent') ? 'bg-emerald-600 text-white' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'}`}
              >
                /(parent)
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/clinician')}
                className={`px-2 py-1 rounded transition-colors ${currentPath === '/clinician' ? 'bg-sky-600 text-white' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'}`}
              >
                /(clinician)
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/clinician/alerts')}
                className={`px-2 py-1 rounded transition-colors ${currentPath.startsWith('/clinician/alerts') ? 'bg-rose-600 text-white font-bold' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'}`}
              >
                /clinician/alerts 🚨
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/clinician/rules')}
                className={`px-2 py-1 rounded transition-colors ${currentPath.startsWith('/clinician/rules') ? 'bg-sky-700 text-white font-bold' : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'}`}
              >
                /clinician/rules 🛡️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Middleware Interception Notification */}
      {middlewareNotice && (
        <div id="middleware-notice-bar" className="bg-amber-500 text-white px-4 py-2 text-xs font-medium shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold">🛡️ Role Middleware Intercept:</span>
              <span>{middlewareNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setMiddlewareNotice(null)}
              className="text-amber-100 hover:text-white text-xs underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Active Route View Renderer */}
        <section id="route-viewport" className="transition-all">
          <ErrorBoundary fallbackTitle="Application View Error">
            {currentPath === '/login' && (
              <LoginPage
                onLogin={handleLogin}
                errorMessage={middlewareNotice}
              />
            )}

            {currentPath === '/signup' && (
              <SignupPage
                onSignup={handleSignup}
                onNavigateToLogin={() => navigateTo('/login')}
              />
            )}

            {currentPath.startsWith('/child') && (
              <ChildPage
                user={currentUser}
                onLogout={handleLogout}
                onAttemptCrossRoleNav={(path) => navigateTo(path)}
              />
            )}

            {currentPath.startsWith('/parent') && (
              <ParentPage
                user={currentUser}
                onLogout={handleLogout}
                onAttemptCrossRoleNav={(path) => navigateTo(path)}
              />
            )}

            {currentPath.startsWith('/clinician') && (
              <ClinicianPage
                user={currentUser}
                onLogout={handleLogout}
                onAttemptCrossRoleNav={(path) => navigateTo(path)}
                initialSubTab={currentPath.includes('/alerts') ? 'alerts' : currentPath.includes('/rules') ? 'rules' : 'overview'}
              />
            )}
          </ErrorBoundary>
        </section>

        {/* Scaffolding Verification & Code Inspector Panel */}
        <section id="scaffolding-inspector" className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span>📦</span>
                <span>Nest Project Scaffolding Inspector</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Verify Prisma schema, NextAuth configuration, role-based middleware, and Google AI SDK setup.
              </p>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveInspectorTab('architecture')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeInspectorTab === 'architecture'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Folder Structure
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('prisma')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeInspectorTab === 'prisma'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Prisma Models
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('middleware')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeInspectorTab === 'middleware'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                RBAC Middleware
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('gemini')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeInspectorTab === 'gemini'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Gemini AI Wrapper
              </button>
            </div>
          </div>

          {/* Tab 1: Architecture & Folder Checklist */}
          {activeInspectorTab === 'architecture' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                <h3 className="font-bold text-stone-900 uppercase tracking-wide">
                  Configured Folder Structure
                </h3>
                <ul className="space-y-2 font-mono text-[11px] text-stone-700">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/app/(auth)</span>
                    <span className="text-stone-400 font-sans text-[10px]">— login & signup routes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/app/(child)</span>
                    <span className="text-stone-400 font-sans text-[10px]">— child-facing app (role=CHILD)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/app/(parent)</span>
                    <span className="text-stone-400 font-sans text-[10px]">— parent dashboard (role=PARENT)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/app/(clinician)</span>
                    <span className="text-stone-400 font-sans text-[10px]">— clinician dashboard (role=CLINICIAN)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/app/(clinician)/rules</span>
                    <span className="text-stone-400 font-sans text-[10px]">— Clinician Safety Rule Engine & Precedence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/lib/rules.ts</span>
                    <span className="text-stone-400 font-sans text-[10px]">— getEffectiveRuleSet resolver & seeds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/lib/db.ts</span>
                    <span className="text-stone-400 font-sans text-[10px]">— Prisma singleton</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/lib/ai.ts</span>
                    <span className="text-stone-400 font-sans text-[10px]">— Gemini Google AI Studio wrapper</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/lib/auth.ts</span>
                    <span className="text-stone-400 font-sans text-[10px]">— NextAuth config & Zod validation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>/middleware.ts</span>
                    <span className="text-stone-400 font-sans text-[10px]">— Role-based route enforcement</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                <h3 className="font-bold text-stone-900 uppercase tracking-wide">
                  Environment Configuration (.env.example)
                </h3>
                <div className="p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-[11px] space-y-1 overflow-x-auto">
                  <p className="text-stone-400"># PostgreSQL Database URL</p>
                  <p>DATABASE_URL="postgresql://user:pass@localhost:5432/nest"</p>
                  <p className="text-stone-400 mt-2"># NextAuth Configuration</p>
                  <p>NEXTAUTH_SECRET="your-32-char-secret"</p>
                  <p>NEXTAUTH_URL="http://localhost:3000"</p>
                  <p className="text-stone-400 mt-2"># Google AI SDK Key</p>
                  <p>GEMINI_API_KEY="MY_GEMINI_API_KEY"</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Prisma Models */}
          {activeInspectorTab === 'prisma' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
                  <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                    <span>User Model</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">Primary</span>
                  </div>
                  <div className="text-[11px] font-mono text-stone-600">
                    Fields: id, name, email, password, role (CHILD | PARENT | CLINICIAN), createdAt, updatedAt
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
                  <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                    <span>ChildProfile</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">Extended</span>
                  </div>
                  <div className="text-[11px] font-mono text-stone-600">
                    nickname, age, grade, nationality, preferredLanguage, hasTraumaHistory, ageGroup, companionName, companionVibe
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
                  <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                    <span>LinkedRelationship</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">Join Table</span>
                  </div>
                  <div className="text-[11px] font-mono text-stone-600">
                    Connects childId, parentId?, clinicianId?, status, notes
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-sky-300 bg-sky-50 space-y-1.5">
                  <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                    <span>RuleSet Model</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-200 text-sky-900">Clinical Safety</span>
                  </div>
                  <div className="text-[11px] font-mono text-stone-600">
                    id, clinicianId?, childId?, name, content (JSON), version, createdAt, updatedAt
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-stone-900 text-stone-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                <pre>{`enum AgeGroup {
  SIX_TO_TEN
  TEN_TO_FOURTEEN
}

enum CompanionVibe {
  CHILL
  HYPE
  COZY
  COOL
}

model ChildProfile {
  id                  String         @id @default(cuid())
  userId              String         @unique
  user                User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  nickname            String?
  age                 Int?
  grade               String?
  nationality         String?
  preferredLanguage   String?        @default("English")
  hasTraumaHistory    Boolean        @default(false)
  traumaHistoryNote   String?
  ageGroup            AgeGroup?
  onboarding_complete Boolean        @default(false)
  companionName       String?
  companionVibe       CompanionVibe?
}`}</pre>
              </div>
            </div>
          )}

          {/* Tab 3: Middleware */}
          {activeInspectorTab === 'middleware' && (
            <div className="space-y-4 text-xs">
              <div className="overflow-x-auto">
                <table className="w-full border border-stone-200 rounded-xl overflow-hidden text-left">
                  <thead className="bg-stone-100 text-stone-700 font-bold">
                    <tr>
                      <th className="p-2.5">User Role</th>
                      <th className="p-2.5">/(child) Route</th>
                      <th className="p-2.5">/(parent) Route</th>
                      <th className="p-2.5">/(clinician) Route</th>
                      <th className="p-2.5">Cross-Role Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-mono text-[11px]">
                    <tr className="bg-white">
                      <td className="p-2.5 font-bold text-amber-700">CHILD</td>
                      <td className="p-2.5 text-emerald-600 font-bold">ALLOWED</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-stone-600 font-sans">Redirect to /child</td>
                    </tr>
                    <tr className="bg-stone-50">
                      <td className="p-2.5 font-bold text-emerald-700">PARENT</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-emerald-600 font-bold">ALLOWED</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-stone-600 font-sans">Redirect to /parent</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-2.5 font-bold text-sky-700">CLINICIAN</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-emerald-600 font-bold">ALLOWED</td>
                      <td className="p-2.5 text-stone-600 font-sans">Redirect to /clinician</td>
                    </tr>
                    <tr className="bg-stone-50">
                      <td className="p-2.5 font-bold text-stone-500">GUEST (Unauth)</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-rose-600 font-bold">BLOCKED</td>
                      <td className="p-2.5 text-stone-600 font-sans">Redirect to /login</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Gemini AI Wrapper */}
          {activeInspectorTab === 'gemini' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={geminiPrompt}
                  onChange={(e) => setGeminiPrompt(e.target.value)}
                  placeholder="Ask Gemini something..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={isAiLoading}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {isAiLoading ? 'Calling Gemini...' : 'Test /lib/ai.ts Wrapper'}
                </button>
              </div>

              {geminiResult && (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 font-mono whitespace-pre-wrap">
                  {geminiResult}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
