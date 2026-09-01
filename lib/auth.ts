import { z } from 'zod';
import type { Role } from '@prisma/client';

export type UserRole = 'CHILD' | 'PARENT' | 'CLINICIAN';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  profileId?: string;
}

// Zod Validation Schemas
export const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CHILD', 'PARENT', 'CLINICIAN'] as const),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;

/**
 * Seed / Dummy accounts for testing all three roles
 */
export const DUMMY_USERS: AppUser[] = [
  {
    id: 'user_child_01',
    name: 'Leo Martinez',
    email: 'child@nest.app',
    role: 'CHILD',
    avatar: '🧒',
    profileId: 'cp_child_01',
  },
  {
    id: 'user_parent_01',
    name: 'Sarah Martinez',
    email: 'parent@nest.app',
    role: 'PARENT',
    avatar: '👩',
    profileId: 'pp_parent_01',
  },
  {
    id: 'user_clinician_01',
    name: 'Dr. Marcus Vance, MD',
    email: 'clinician@nest.app',
    role: 'CLINICIAN',
    avatar: '🩺',
    profileId: 'clp_clinician_01',
  },
];

/**
 * Helper to compute destination path based on role
 */
export function getRoleDashboardPath(role: UserRole | string): string {
  switch (role) {
    case 'CHILD':
      return '/child';
    case 'PARENT':
      return '/parent';
    case 'CLINICIAN':
      return '/clinician';
    default:
      return '/login';
  }
}

/**
 * Helper to get role label and meta
 */
export function getRoleMeta(role: UserRole | string) {
  switch (role) {
    case 'CHILD':
      return {
        label: 'Child Portal',
        tagline: 'Interactive, safe, engaging space tailored for children',
        color: 'amber',
        allowedRoutePrefix: '/child',
      };
    case 'PARENT':
      return {
        label: 'Parent Dashboard',
        tagline: 'Monitor progress, manage routines, and coordinate care',
        color: 'emerald',
        allowedRoutePrefix: '/parent',
      };
    case 'CLINICIAN':
      return {
        label: 'Clinician Workspace',
        tagline: 'Clinical insights, patient caseload, and treatment plans',
        color: 'sky',
        allowedRoutePrefix: '/clinician',
      };
    default:
      return {
        label: 'User',
        tagline: 'Standard access',
        color: 'stone',
        allowedRoutePrefix: '/login',
      };
  }
}

/**
 * NextAuth AuthOptions configuration scaffold
 */
export const authConfig = {
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    newUser: '/signup',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: Record<string, any>; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: Record<string, any>; token: Record<string, any> }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
};
