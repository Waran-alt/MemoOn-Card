import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  if (session) redirect('/app');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="z-10 max-w-lg w-full text-center space-y-8">
        <h1 className="text-4xl font-bold">MemoOn Card</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Intelligent flashcard system with FSRS spaced repetition algorithm
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="rounded bg-neutral-900 px-6 py-3 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded border border-neutral-300 px-6 py-3 text-sm font-medium dark:border-neutral-600"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
