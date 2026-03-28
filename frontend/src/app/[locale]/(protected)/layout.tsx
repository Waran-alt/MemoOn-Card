/**
 * Gate for all `(protected)` routes: no session → redirect to login. Hydrates client auth from server user.
 */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { AuthHydrate } from '@/components/AuthHydrate';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (!session) redirect('/login');
  return (
    <AuthHydrate serverUser={session.user}>
      {children}
    </AuthHydrate>
  );
}
