# Audit : cohérence review_logs ↔ card_journey_events

## État actuel (FSRS v6 uniquement)

Toutes les révisions passent par un seul chemin dans `review.service.ts` : `logReview` écrit `review_logs` et appelle `cardJourneyService.appendEvents` pour les événements journey (`rating_submitted`, etc.). Il n'y a plus de table ni de service `study_events` (supprimés en migration 043).

## Historique

Un ancien chemin « apprentissage court » pouvait autrefois omettre des événements journey ; cela a été corrigé puis le chemin a été **retiré**. La migration `040-backfill-rating-journey-events` a backfillé les liens manquants pour l'historique. Les anciennes lignes journey avec `source = 'study_events'` sont remappées vers `ui` en migration `044-card-journey-drop-study-events-source`.

## Autres écritures vérifiées

- **Création de cartes** : `card_created` via appendEvent
- **Mise à jour / suppression** : `card_updated`, `card_deleted`
- **Importance** : `importance_toggled`
- **resetCardStability** : pas de review_log → pas de lien requis

## Source unique pour review_logs

Seul `review.service.ts` insère dans `review_logs` (via `logReview`).
