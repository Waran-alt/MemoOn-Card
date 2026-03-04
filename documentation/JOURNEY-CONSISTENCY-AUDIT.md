# Audit : cohérence review_logs ↔ card_journey_events

## Bug corrigé (mars 2026)

**Problème** : Le chemin Short-FSRS (`reviewCardShortFSRS`) créait des `review_logs` mais ne créait pas les événements `rating_submitted` dans `card_journey_events`. Résultat : « Liens manquants » sur la page Sessions.

**Correction** : Ajout de `studyEventsService.logEvents` et `journeyService.appendEvents` dans le chemin Short-FSRS (aligné sur le chemin long-term).

**Backfill** : Migration `040-backfill-rating-journey-events` crée les événements manquants pour les `review_logs` existants sans lien.

## Chemins de review audités

| Chemin | review_logs | study_events | card_journey_events |
|--------|-------------|--------------|---------------------|
| Long-term FSRS (`reviewCardLongTerm`) | ✅ logReview | ✅ logEvents | ✅ appendEvents |
| Short-FSRS (`reviewCardShortFSRS`) | ✅ logReview | ✅ logEvents (corrigé) | ✅ appendEvents (corrigé) |
| Batch review | → reviewCard | → idem | → idem |

## Autres écritures vérifiées

- **Création de cartes** (decks bulk, import, cards POST) : `card_created` via appendEvent ✅
- **Mise à jour / suppression** : `card_updated`, `card_deleted` ✅
- **Importance** : `importance_toggled` ✅
- **resetCardStability** : pas de review_log → pas de lien requis ✅
- **applyManagementPenaltyToCard** : pas de review_log → pas de lien requis ✅

## Source unique pour review_logs

Seul `review.service.ts` insère dans `review_logs` (via `logReview`). Les deux chemins (long-term et short-term) appellent désormais la même séquence : logReview → logEvents → appendEvents.
