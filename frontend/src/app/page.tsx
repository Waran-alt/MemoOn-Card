export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">MemoOn Card</h1>
        <p className="text-lg mb-8">
          Intelligent flashcard system with FSRS spaced repetition algorithm
        </p>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This is the frontend application for MemoOn Card. The backend API is running
              and ready to use. Start building your flashcard interface here!
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">API Endpoints</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>GET /api/decks - List all decks</li>
              <li>POST /api/decks - Create a deck</li>
              <li>GET /api/decks/:id/cards - Get cards in a deck</li>
              <li>POST /api/cards/:id/review - Review a card</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
