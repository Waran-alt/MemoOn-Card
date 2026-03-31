/**
 * Client-side timing for GET /api/decks/:id/cards (initial load + post-mutation refetch).
 *
 * **Prometheus (serveur)** : histogramme `memoon_deck_cards_list_duration_seconds` sur la route
 * `GET /api/decks/:id/cards` — idéal pour Grafana (p50 / p95, charge après mutations).
 *
 * **Navigateur** : en développement, logs `console.debug` filtrables sur `[memoon] deck_cards_list_client_ms`.
 * Pour une vue réseau détaillée, onglet Network ou Performance (requête XHR/fetch).
 */
export function recordDeckCardsListClientTiming(reason: string, durationMs: number, ok: boolean): void {
  if (process.env.NODE_ENV === 'development' && typeof console !== 'undefined') {
    const safeReason = reason.replace(/[^a-z0-9_-]/gi, '_').slice(0, 48) || 'unknown';
    console.debug('[memoon] deck_cards_list_client_ms', {
      reason: safeReason,
      durationMs: Math.round(durationMs * 100) / 100,
      ok,
    });
  }
}
