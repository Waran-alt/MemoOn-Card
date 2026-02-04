export default function AppPage() {
  return (
    <div className="space-y-6">
      <p className="text-neutral-600 dark:text-neutral-400">
        Your decks will appear here. Create a deck to start adding cards and studying.
      </p>
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          New deck — coming in the next step (Deck list + create)
        </p>
      </div>
    </div>
  );
}
