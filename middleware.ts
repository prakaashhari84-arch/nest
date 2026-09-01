/**
 * Next.js Edge Middleware for Role-Based Access Control (RBAC)
 * Handles redirection for unauthorized, unauthenticated, and cross-role requests.
 */

export interface MiddlewareRequestLike {
  pathname: string;
  userRole?: 'CHILD' | 'PARENT' | 'CLINICIAN' | null;
  isAuthenticated: boolean;
}

export interface MiddlewareDecision {
  allowed: boolean;
  redirectUrl?: string;
  reason?: string;
}

/**
 * Pure evaluation function for Next.js middleware / client router simulation
 */
export function evaluateRouteAccess(req: MiddlewareRequestLike): MiddlewareDecision {
  const { pathname, userRole, isAuthenticated } = req;

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname === '/';
  const isChildRoute = pathname.startsWith('/child') || pathname.startsWith('/(child)');
  const isParentRoute = pathname.startsWith('/parent') || pathname.startsWith('/(parent)');
  const isClinicianRoute = pathname.startsWith('/clinician') || pathname.startsWith('/(clinician)');
  const isProtectedRoute = isChildRoute || isParentRoute || isClinicianRoute;

  // 1. Unauthenticated users trying to hit protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return {
      allowed: false,
      redirectUrl: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
      reason: 'Authentication required. Please sign in.',
    };
  }

  // 2. Authenticated users hitting auth pages (login/signup) -> redirect to their home
  if (isAuthRoute && isAuthenticated && userRole) {
    const target = userRole === 'CHILD' ? '/child' : userRole === 'PARENT' ? '/parent' : '/clinician';
    if (pathname !== target) {
      return {
        allowed: false,
        redirectUrl: target,
        reason: `Already signed in as ${userRole}. Redirecting to dashboard.`,
      };
    }
  }

  // 3. Cross-role enforcement for authenticated users
  if (isAuthenticated && userRole) {
    if (isChildRoute && userRole !== 'CHILD') {
      const target = userRole === 'PARENT' ? '/parent' : '/clinician';
      return {
        allowed: false,
        redirectUrl: target,
        reason: `Access Denied: ${userRole} accounts cannot access the Child area. Redirected to ${target}.`,
      };
    }

    if (isParentRoute && userRole !== 'PARENT') {
      const target = userRole === 'CHILD' ? '/child' : '/clinician';
      return {
        allowed: false,
        redirectUrl: target,
        reason: `Access Denied: ${userRole} accounts cannot access the Parent dashboard. Redirected to ${target}.`,
      };
    }

    if (isClinicianRoute && userRole !== 'CLINICIAN') {
      const target = userRole === 'CHILD' ? '/child' : '/parent';
      return {
        allowed: false,
        redirectUrl: target,
        reason: `Access Denied: ${userRole} accounts cannot access the Clinician workspace. Redirected to ${target}.`,
      };
    }
  }

  return { allowed: true };
}

// Next.js standard middleware export
export async function middleware(request: any) {
  // In Next.js Edge runtime, getToken({ req: request }) reads the JWT
  // const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  // const decision = evaluateRouteAccess({
  //   pathname: request.nextUrl.pathname,
  //   userRole: token?.role as any,
  //   isAuthenticated: !!token,
  // });
  // if (!decision.allowed && decision.redirectUrl) {
  //   return NextResponse.redirect(new URL(decision.redirectUrl, request.url));
  // }
  // return NextResponse.next();
}

export const config = {
  matcher: [
    '/child/:path*',
    '/parent/:path*',
    '/clinician/:path*',
    '/login',
    '/signup',
    '/',
  ],
};
