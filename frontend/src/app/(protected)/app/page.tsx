'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient, { getApiErrorMessage } from '@/lib/api';
import type { Deck } from '@/types';

const DECK_TITLE_MAX = 200;
const DECK_DESCRIPTION_MAX = 1000;

export default function AppPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  function loadDecks() {
    setLoading(true);
    setError('');
    apiClient
      .get<{ success: boolean; data?: Deck[] }>('/api/decks')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setDecks(res.data.data);
        }
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load decks')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    queueMicrotask(() => loadDecks());
  }, []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    const title = createTitle.trim();
    if (!title) {
      setCreateError('Title is required');
      return;
    }
    setCreating(true);
    apiClient
      .post<{ success: boolean; data?: Deck }>('/api/decks', {
        title,
        description: createDescription.trim() || undefined,
      })
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setDecks((prev) => [res.data!.data!, ...prev]);
          setCreateTitle('');
          setCreateDescription('');
          setShowCreate(false);
        } else {
          setCreateError('Invalid response');
        }
      })
      .catch((err) => setCreateError(getApiErrorMessage(err, 'Failed to create deck')))
      .finally(() => setCreating(false));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-neutral-600 dark:text-neutral-400">
          Your decks. Create a deck to start adding cards and studying.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setCreateError('');
          }}
          className="shrink-0 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          New deck
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading decks…</p>
      ) : showCreate ? (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
        >
          <h2 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Create deck
          </h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="deck-title" className="block text-sm font-medium mb-1 text-neutral-600 dark:text-neutral-400">
                Title
              </label>
              <input
                id="deck-title"
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                maxLength={DECK_TITLE_MAX}
                placeholder="e.g. Spanish verbs"
                required
                autoFocus
                className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
              />
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {createTitle.length}/{DECK_TITLE_MAX}
              </p>
            </div>
            <div>
              <label htmlFor="deck-description" className="block text-sm font-medium mb-1 text-neutral-600 dark:text-neutral-400">
                Description (optional)
              </label>
              <textarea
                id="deck-description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                maxLength={DECK_DESCRIPTION_MAX}
                placeholder="What this deck is about"
                rows={2}
                className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
              />
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {createDescription.length}/{DECK_DESCRIPTION_MAX}
              </p>
            </div>
            {createError && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {createError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !createTitle.trim()}
                className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setCreateTitle('');
                  setCreateDescription('');
                  setCreateError('');
                }}
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {!loading && !showCreate && decks.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No decks yet. Create your first deck to get started.
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-3 text-sm font-medium text-neutral-700 underline hover:no-underline dark:text-neutral-300"
          >
            New deck
          </button>
        </div>
      )}

      {!loading && decks.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <li key={deck.id}>
              <Link
                href={`/app/decks/${deck.id}`}
                className="block rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-600"
              >
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                  {deck.title}
                </h3>
                {deck.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {deck.description}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                    No description
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
