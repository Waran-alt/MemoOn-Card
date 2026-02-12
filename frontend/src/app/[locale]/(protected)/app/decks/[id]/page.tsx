'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'i18n';
import apiClient, { getApiErrorMessage, isRequestCancelled } from '@/lib/api';
import type { Deck, Card } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { VALIDATION_LIMITS } from '@memoon-card/shared';

const { CARD_CONTENT_MAX, CARD_COMMENT_MAX } = VALIDATION_LIMITS;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + '…';
}

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const { t: tc } = useTranslation('common', locale);
  const { t: ta } = useTranslation('app', locale);
  const id = typeof params.id === 'string' ? params.id : '';
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState('');
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [createRecto, setCreateRecto] = useState('');
  const [createVerso, setCreateVerso] = useState('');
  const [createComment, setCreateComment] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    setLoading(true);
    setError('');
    apiClient
      .get<{ success: boolean; data?: Deck }>(`/api/decks/${id}`, { signal: ac.signal })
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setDeck(res.data.data);
        } else {
          setError(ta('deckNotFound'));
        }
      })
      .catch((err) => {
        if (!isRequestCancelled(err)) setError(getApiErrorMessage(err, ta('failedLoadDeck')));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id || !deck) return;
    const ac = new AbortController();
    setCardsLoading(true);
    setCardsError('');
    apiClient
      .get<{ success: boolean; data?: Card[] }>(`/api/decks/${id}/cards`, { signal: ac.signal })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCards(res.data.data);
        }
      })
      .catch((err) => {
        if (!isRequestCancelled(err)) setCardsError(getApiErrorMessage(err, ta('failedLoadCards')));
      })
      .finally(() => setCardsLoading(false));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, deck]);

  function handleCreateCard(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    const recto = createRecto.trim();
    const verso = createVerso.trim();
    if (!recto || !verso) {
      setCreateError(ta('frontBackRequired'));
      return;
    }
    setCreating(true);
    apiClient
      .post<{ success: boolean; data?: Card }>(`/api/decks/${id}/cards`, {
        recto,
        verso,
        comment: createComment.trim() || undefined,
      })
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setCards((prev) => [res.data!.data!, ...prev]);
          setCreateRecto('');
          setCreateVerso('');
          setCreateComment('');
          setShowCreateCard(false);
        } else {
          setCreateError(tc('invalidResponse'));
        }
      })
      .catch((err) => setCreateError(getApiErrorMessage(err, ta('failedCreateCard'))))
      .finally(() => setCreating(false));
  }

  if (!id) {
    router.replace(`/${locale}/app`);
    return null;
  }

  if (loading) {
    return <p className="text-sm text-[var(--mc-text-secondary)]">{tc('loading')}</p>;
  }

  if (error || !deck) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--mc-accent-danger)]" role="alert">
          {error || ta('deckNotFound')}
        </p>
        <Link
          href={`/${locale}/app`}
          className="text-sm font-medium text-[var(--mc-text-secondary)] underline hover:no-underline"
        >
          {ta('backToDecks')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mc-study-page space-y-6">
      <div>
        <Link
          href={`/${locale}/app`}
          className="text-sm font-medium text-[var(--mc-text-secondary)] hover:text-[var(--mc-text-primary)]"
        >
          ← {ta('backToDecks')}
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-[var(--mc-text-primary)]">
          {deck.title}
        </h2>
        {deck.description && (
          <p className="mt-1 text-sm text-[var(--mc-text-secondary)]">
            {deck.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-[var(--mc-text-primary)]">{ta('cards')}</h3>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/${locale}/app/decks/${id}/study`}
            className="rounded border border-[var(--mc-border-subtle)] px-4 py-2 text-sm font-medium text-[var(--mc-text-primary)] hover:bg-[var(--mc-bg-card-back)] transition-colors duration-200"
          >
            {ta('study')}
          </Link>
          <button
            type="button"
            onClick={() => {
              setShowCreateCard(true);
              setCreateError('');
            }}
            className="rounded bg-[var(--mc-accent-success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            {ta('newCard')}
          </button>
        </div>
      </div>

      {cardsError && (
        <p className="text-sm text-[var(--mc-accent-danger)]" role="alert">
          {cardsError}
        </p>
      )}

      {showCreateCard && (
        <form
          onSubmit={handleCreateCard}
          className="mc-study-surface rounded-lg border p-4 shadow-sm"
        >
          <h4 className="mb-3 text-sm font-medium text-[var(--mc-text-primary)]">
            {ta('createCard')}
          </h4>
          <div className="space-y-3">
            <div>
              <label htmlFor="card-recto" className="mb-1 block text-sm font-medium text-[var(--mc-text-secondary)]">
                {ta('recto')}
              </label>
              <textarea
                id="card-recto"
                value={createRecto}
                onChange={(e) => setCreateRecto(e.target.value)}
                maxLength={CARD_CONTENT_MAX}
                placeholder={ta('rectoPlaceholder')}
                required
                rows={2}
                className="w-full rounded border border-[var(--mc-border-subtle)] bg-[var(--mc-bg-surface)] px-3 py-2 text-sm text-[var(--mc-text-primary)]"
              />
              <p className="mt-0.5 text-xs text-[var(--mc-text-secondary)]">
                {createRecto.length}/{CARD_CONTENT_MAX}
              </p>
            </div>
            <div>
              <label htmlFor="card-verso" className="mb-1 block text-sm font-medium text-[var(--mc-text-secondary)]">
                {ta('verso')}
              </label>
              <textarea
                id="card-verso"
                value={createVerso}
                onChange={(e) => setCreateVerso(e.target.value)}
                maxLength={CARD_CONTENT_MAX}
                placeholder={ta('versoPlaceholder')}
                required
                rows={2}
                className="w-full rounded border border-[var(--mc-border-subtle)] bg-[var(--mc-bg-surface)] px-3 py-2 text-sm text-[var(--mc-text-primary)]"
              />
              <p className="mt-0.5 text-xs text-[var(--mc-text-secondary)]">
                {createVerso.length}/{CARD_CONTENT_MAX}
              </p>
            </div>
            <div>
              <label htmlFor="card-comment" className="mb-1 block text-sm font-medium text-[var(--mc-text-secondary)]">
                {ta('commentOptional')}
              </label>
              <textarea
                id="card-comment"
                value={createComment}
                onChange={(e) => setCreateComment(e.target.value)}
                maxLength={CARD_COMMENT_MAX}
                placeholder={ta('commentPlaceholder')}
                rows={1}
                className="w-full rounded border border-[var(--mc-border-subtle)] bg-[var(--mc-bg-surface)] px-3 py-2 text-sm text-[var(--mc-text-primary)]"
              />
              <p className="mt-0.5 text-xs text-[var(--mc-text-secondary)]">
                {createComment.length}/{CARD_COMMENT_MAX}
              </p>
            </div>
            {createError && (
              <p className="text-sm text-[var(--mc-accent-danger)]" role="alert">
                {createError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !createRecto.trim() || !createVerso.trim()}
                className="rounded bg-[var(--mc-accent-success)] px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
              >
                {creating ? tc('creating') : tc('create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateCard(false);
                  setCreateRecto('');
                  setCreateVerso('');
                  setCreateComment('');
                  setCreateError('');
                }}
                className="rounded border border-[var(--mc-border-subtle)] px-3 py-1.5 text-sm font-medium text-[var(--mc-text-secondary)] hover:bg-[var(--mc-bg-card-back)]"
              >
                {tc('cancel')}
              </button>
            </div>
          </div>
        </form>
      )}

      {cardsLoading ? (
        <p className="text-sm text-[var(--mc-text-secondary)]">{ta('loadingCards')}</p>
      ) : !showCreateCard && cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--mc-border-subtle)] p-8 text-center">
          <p className="text-sm text-[var(--mc-text-secondary)]">
            {ta('noCardsYet')}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateCard(true)}
            className="mt-3 text-sm font-medium text-[var(--mc-text-secondary)] underline hover:no-underline"
          >
            {ta('newCard')}
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => (
            <li
              key={card.id}
              className="mc-study-surface rounded-lg border p-4 shadow-sm"
            >
              <p className="font-medium text-[var(--mc-text-primary)]">
                {truncate(card.recto, 80)}
              </p>
              <p className="mt-1 text-sm text-[var(--mc-text-secondary)]">
                {truncate(card.verso, 80)}
              </p>
              {card.comment && (
                <p className="mt-1 text-xs text-[var(--mc-text-secondary)]/80">
                  {truncate(card.comment, 60)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
