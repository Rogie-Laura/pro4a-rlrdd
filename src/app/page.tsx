import { redirect } from 'next/navigation';
import { canAccessRlrdd } from '@/lib/auth/roles';
import { getSessionUser } from '@/lib/auth/session';

export default async function HomePage() {
  const session = await getSessionUser();

  if (session.userId && canAccessRlrdd(session.user?.role)) {
    redirect('/dashboard');
  }

  redirect('/login');
}
