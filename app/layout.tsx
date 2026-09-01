import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'nest',
  description: 'Scaffolding for Nest: Next.js App Router with Prisma, NextAuth, role-based routing (Child, Parent, Clinician), Gemini AI, and Zod validation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased font-sans">
        <main className="min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}
