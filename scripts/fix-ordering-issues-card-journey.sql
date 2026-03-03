-- Fix "problèmes d'ordre" : rating_submitted dont un answer_revealed est enregistré après (même carte/session, fenêtre 5 min).
-- On corrige en mettant event_time du rating_submitted à (min answer_revealed après lui) + 1 ms pour rétablir l'ordre.
--
-- Usage en prod :
--   1. Exécuter tout le script (BEGIN + SELECT + UPDATE). Vérifier le résultat du SELECT (dry-run).
--   2. Si tout est cohérent : COMMIT; sinon : ROLLBACK;
--
-- Option : restreindre à un utilisateur en ajoutant dans les CTE :
--   AND j.user_id = 'uuid-utilisateur'
-- et dans la jointure r : AND r.user_id = j.user_id (déjà présent).

BEGIN;

-- 1) Aperçu des lignes qui seront modifiées (dry-run)
WITH problematic AS (
  SELECT
    j.id AS rating_event_id,
    j.user_id,
    j.card_id,
    j.session_id,
    j.event_time AS current_event_time,
    MIN(r.event_time) AS min_answer_revealed_after,
    MIN(r.event_time) + 1 AS new_event_time
  FROM card_journey_events j
  JOIN card_journey_events r
    ON r.user_id = j.user_id
    AND r.card_id = j.card_id
    AND (r.session_id IS NOT DISTINCT FROM j.session_id)
    AND r.event_type = 'answer_revealed'
    AND r.event_time > j.event_time
    AND r.event_time <= j.event_time + 300000
  WHERE j.event_type = 'rating_submitted'
  GROUP BY j.id, j.user_id, j.card_id, j.session_id, j.event_time
)
SELECT
  rating_event_id,
  user_id,
  card_id,
  session_id,
  current_event_time,
  min_answer_revealed_after,
  new_event_time,
  (new_event_time - current_event_time) AS delta_ms
FROM problematic
ORDER BY current_event_time DESC;

-- 2) Mise à jour : on place le rating_submitted juste après le answer_revealed qui le suivait à tort
WITH problematic AS (
  SELECT
    j.id AS rating_event_id,
    MIN(r.event_time) + 1 AS new_event_time
  FROM card_journey_events j
  JOIN card_journey_events r
    ON r.user_id = j.user_id
    AND r.card_id = j.card_id
    AND (r.session_id IS NOT DISTINCT FROM j.session_id)
    AND r.event_type = 'answer_revealed'
    AND r.event_time > j.event_time
    AND r.event_time <= j.event_time + 300000
  WHERE j.event_type = 'rating_submitted'
  GROUP BY j.id
)
UPDATE card_journey_events c
SET event_time = p.new_event_time
FROM problematic p
WHERE c.id = p.rating_event_id;

-- Vérifier le nombre de lignes mises à jour (afficher dans le client)
-- Puis : COMMIT;   ou   ROLLBACK;
