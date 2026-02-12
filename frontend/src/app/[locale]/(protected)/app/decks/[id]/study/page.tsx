'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'i18n';
import apiClient, { getApiErrorMessage, isRequestCancelled } from '@/lib/api';
import type { Deck, Card } from '@/types';
import type { Rating } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

const SESSION_NEW_LIMIT = 20;
const SESSION_MAX = 50; // cap a single session so it’s not endless

const RATING_VALUES: Rating[] = [1, 2, 3, 4];

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const { t: tc } = useTranslation('common', locale);
  const { t: ta } = useTranslation('app', locale);
  const id = typeof params.id === 'string' ? params.id : '';
  const [deck, setDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    const signal = ac.signal;
    setLoading(true);
    setError('');
    Promise.all([
      apiClient.get<{ success: boolean; data?: Deck }>(`/api/decks/${id}`, { signal }),
      apiClient.get<{ success: boolean; data?: Card[] }>(`/api/decks/${id}/cards/due`, { signal }),
      apiClient.get<{ success: boolean; data?: Card[] }>(`/api/decks/${id}/cards/new?limit=${SESSION_NEW_LIMIT}`, { signal }),
    ])
      .then(([deckRes, dueRes, newRes]) => {
        if (!deckRes.data?.success || !deckRes.data.data) {
          setError(ta('deckNotFound'));
          return;
        }
        setDeck(deckRes.data.data);
        const due = dueRes.data?.success && Array.isArray(dueRes.data.data) ? dueRes.data.data : [];
        const newCards = newRes.data?.success && Array.isArray(newRes.data.data) ? newRes.data.data : [];
        const seen = new Set(due.map((c) => c.id));
        const extraNew = newCards.filter((c) => !seen.has(c.id));
        const combined = [...due, ...extraNew].slice(0, SESSION_MAX);
        setQueue(combined);
      })
      .catch((err) => {
        if (!isRequestCancelled(err)) setError(getApiErrorMessage(err, ta('failedLoadCards')));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleRate(rating: Rating) {
    const card = queue[0];
    if (!card || submitting) return;
    setSubmitting(true);
    setReviewError('');
    apiClient
      .post<{ success: boolean }>(`/api/cards/${card.id}/review`, { rating })
      .then(() => {
        setQueue((prev) => prev.slice(1));
        setShowAnswer(false);
        setReviewedCount((n) => n + 1);
      })
      .catch(() => {
        setReviewError(ta('failedSaveReview'));
      })
      .finally(() => setSubmitting(false));
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

  const card = queue[0];
  const sessionDone = queue.length === 0 && reviewedCount > 0;
  const noCards = queue.length === 0 && reviewedCount === 0;

  if (noCards) {
    return (
      <div className="space-y-4">
        <Link
          href={`/${locale}/app/decks/${id}`}
          className="text-sm font-medium text-[var(--mc-text-secondary)] hover:text-[var(--mc-text-primary)]"
        >
          ← {ta('backToDeck')}
        </Link>
        <div className="mc-study-surface rounded-xl border p-8 text-center shadow-sm">
          <p className="text-[var(--mc-text-primary)]">{ta('noCardsToStudy')}</p>
          <p className="mt-1 text-sm text-[var(--mc-text-secondary)]">
            Add cards to this deck or come back later for due reviews.
          </p>
          <Link
            href={`/${locale}/app/decks/${id}`}
            className="mt-4 inline-block rounded bg-[var(--mc-accent-success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {ta('backToDeck')}
          </Link>
        </div>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="space-y-4">
        <Link
          href={`/${locale}/app/decks/${id}`}
          className="text-sm font-medium text-[var(--mc-text-secondary)] hover:text-[var(--mc-text-primary)]"
        >
          ← {ta('backToDeck')}
        </Link>
        <div className="mc-study-surface rounded-xl border p-8 text-center shadow-sm">
          <p className="font-medium text-[var(--mc-text-primary)]">{ta('sessionComplete')}</p>
          <p className="mt-1 text-sm text-[var(--mc-text-secondary)]">
            {ta('reviewedCount', { count: reviewedCount })}
          </p>
          <Link
            href={`/${locale}/app/decks/${id}`}
            className="mt-4 inline-block rounded bg-[var(--mc-accent-success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {ta('backToDeck')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-study-page mx-auto max-w-2xl space-y-6">
      {/* Focus anchor: peripheral elements are visually de-emphasized while studying */}
      <div className="flex items-center justify-between opacity-70 transition-opacity duration-200">
        <Link
          href={`/${locale}/app/decks/${id}`}
          className="text-sm font-medium text-[var(--mc-text-secondary)] hover:text-[var(--mc-text-primary)]"
        >
          ← {ta('exitStudy')}
        </Link>
        <span className="text-sm text-[var(--mc-text-secondary)]">
          {ta('leftReviewed', {
            vars: {
              left: queue.length,
              reviewed: reviewedCount,
              leftLabel: ta('cardsLeft', { count: queue.length }),
              reviewedLabel: ta('cardsReviewed', { count: reviewedCount }),
            },
          })}
        </span>
      </div>

      <div
        className={`min-h-[280px] rounded-xl border p-8 shadow-sm transition-all duration-200 flex flex-col justify-center ${
          showAnswer ? 'mc-study-card-back' : 'mc-study-card-front'
        }`}
      >
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-[var(--mc-text-primary)]">
          {showAnswer ? card.verso : card.recto}
        </p>
        {card.comment && showAnswer && (
          <p className="mt-3 text-sm text-[var(--mc-text-secondary)]">{card.comment}</p>
        )}
      </div>

      {reviewError && (
        <p className="text-sm text-[var(--mc-accent-danger)]" role="alert">
          {reviewError}
        </p>
      )}
      <div className="flex flex-col gap-3">
        {!showAnswer ? (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="w-full rounded-lg border-2 border-[var(--mc-border-subtle)] py-3 text-sm font-medium text-[var(--mc-text-primary)] hover:bg-[var(--mc-bg-card-back)] transition-colors duration-200"
          >
            {ta('showAnswer')}
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {RATING_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                disabled={submitting}
                onClick={() => handleRate(value as Rating)}
                className={`rounded-lg border py-3 text-sm font-medium transition-colors duration-200 ${
                  value === 1
                    ? 'border-[var(--mc-accent-danger)]/50 bg-[var(--mc-accent-danger)]/10 text-[var(--mc-accent-danger)] hover:bg-[var(--mc-accent-danger)]/20'
                    : value === 2
                      ? 'border-[var(--mc-accent-warning)]/50 bg-[var(--mc-accent-warning)]/10 text-[var(--mc-accent-warning)] hover:bg-[var(--mc-accent-warning)]/20'
                      : value === 4
                        ? 'border-[var(--mc-accent-success)]/50 bg-[var(--mc-accent-success)]/10 text-[var(--mc-accent-success)] hover:bg-[var(--mc-accent-success)]/20'
                        : 'border-[var(--mc-border-subtle)] bg-[var(--mc-bg-surface)] text-[var(--mc-text-primary)] hover:bg-[var(--mc-bg-card-back)]'
                } disabled:opacity-50`}
              >
                {value === 1
                  ? ta('again')
                  : value === 2
                    ? ta('hard')
                    : value === 3
                      ? ta('good')
                      : ta('easy')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
