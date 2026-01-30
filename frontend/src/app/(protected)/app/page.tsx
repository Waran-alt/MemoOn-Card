import { SignOutButton } from '@/components/SignOutButton';

export default function AppPage() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <h1 className="text-xl font-bold">MemoOn Card</h1>
        <SignOutButton />
      </header>
      <div className="space-y-4">
        <p className="text-neutral-600 dark:text-neutral-400">
          You are signed in. Decks and cards will go here.
        </p>
      </div>
    </main>
  );
}
