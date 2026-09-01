import React, { useState } from 'react';
import {
  AppUser,
  UserRole,
  getRoleDashboardPath,
  SignupInput,
} from '@/lib/auth';
import LoginPage from '@/app/(auth)/login/page';
import SignupPage from '@/app/(auth)/signup/page';
import ChildPage from '@/app/(child)/page';
import ParentPage from '@/app/(parent)/page';
import ClinicianPage from '@/app/(clinician)/page';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App() {
  // Current active user session (null = logged out)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  // Current auth mode when logged out: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  /**
   * Handle user login
   */
  const handleLogin = (email: string, requestedRole?: string) => {
    const role = (requestedRole as UserRole) || 'CHILD';
    const newUser: AppUser = {
      id: `user_${role.toLowerCase()}_${Date.now()}`,
      name: email.split('@')[0],
      email,
      role,
      avatar: role === 'CHILD' ? '🧒' : role === 'PARENT' ? '👩' : '🩺',
      profileId: `profile_${Date.now()}`,
    };

    setCurrentUser(newUser);
  };

  /**
   * Handle user registration
   */
  const handleSignup = (data: SignupInput) => {
    const newUser: AppUser = {
      id: `user_${data.role.toLowerCase()}_${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.role === 'CHILD' ? '🧒' : data.role === 'PARENT' ? '👩' : '🩺',
      profileId: `profile_${Date.now()}`,
    };
    setCurrentUser(newUser);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
  };

  return (
    <div
      id="app-root"
      className="min-h-screen min-h-[100dvh] bg-stone-50 text-stone-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] w-full"
    >
      {/* Production Application Header (Shown when user is authenticated) */}
      {currentUser && (
        <header
          id="main-header"
          className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 shadow-xs w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                🪺
              </span>
              <span className="text-xl font-bold tracking-tight text-stone-900 font-['Space_Grotesk',sans-serif]">
                nest
              </span>
            </div>

            {/* User Session & Sign Out */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-2xl">
                <span className="text-lg">{currentUser.avatar}</span>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-stone-900 capitalize">{currentUser.name}</div>
                  <div className="text-[10px] text-stone-500 font-medium capitalize">{currentUser.role.toLowerCase()}</div>
                </div>
              </div>

              <button
                id="header-logout-btn"
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all cursor-pointer min-h-[40px] flex items-center justify-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 w-full flex flex-col items-center justify-start">
        {!currentUser ? (
          authMode === 'login' ? (
            <LoginPage
              onLogin={handleLogin}
              onNavigateToSignup={() => setAuthMode('signup')}
            />
          ) : (
            <SignupPage
              onSignup={handleSignup}
              onNavigateToLogin={() => setAuthMode('login')}
            />
          )
        ) : (
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
            <ErrorBoundary fallbackTitle="Error loading role dashboard">
              {currentUser.role === 'CHILD' && (
                <ChildPage user={currentUser} onLogout={handleLogout} />
              )}
              {currentUser.role === 'PARENT' && (
                <ParentPage user={currentUser} onLogout={handleLogout} />
              )}
              {currentUser.role === 'CLINICIAN' && (
                <ClinicianPage user={currentUser} onLogout={handleLogout} />
              )}
            </ErrorBoundary>
          </div>
        )}
      </main>
    </div>
  );
}
