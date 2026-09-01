import { redirect } from 'next/navigation';

export default function HomePage() {
  // In Next.js App Router, default root redirects to login or auth check
  redirect('/login');
}
