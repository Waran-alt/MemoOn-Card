'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient, { getApiErrorMessage } from '@/lib/api';
import type { Deck } from '@/types';

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    apiClient
      .get<{ success: boolean; data?: Deck }>(`/api/decks/${id}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setDeck(res.data.data);
        } else {
          setError('Deck not found');
        }
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load deck')))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    router.replace('/app');
    return null;
  }

  if (loading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>;
  }

  if (error || !deck) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error || 'Deck not found'}
        </p>
        <Link
          href="/app"
          className="text-sm font-medium text-neutral-700 underline hover:no-underline dark:text-neutral-300"
        >
          Back to decks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back to decks
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {deck.title}
        </h2>
        {deck.description && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {deck.description}
          </p>
        )}
      </div>
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Cards and study — coming next. Add and review cards here.
        </p>
      </div>
    </div>
  );
}
