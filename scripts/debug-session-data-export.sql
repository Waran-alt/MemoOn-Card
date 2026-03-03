-- Données utiles pour débugger la page Session / cohérence parcours
-- Remplacer 54429f95-75d9-42c5-9e7e-b335331425ae par l'UUID de l'utilisateur (ex: 'a1b2c3d4-e5f6-...').
-- Colonnes réelles : review_logs utilise review_date (timestamp) et review_time (bigint, epoch ms),
-- pas "reviewed_at". cards a next_review, last_review, stability, difficulty.

-- 1) Derniers review_logs (colonnes réelles)
SELECT '=== 1) Derniers review_logs ===' AS section;
SELECT
  rl.id,
  rl.card_id,
  rl.rating,
  rl.review_time,
  rl.review_date,
  rl.review_state,
  rl.scheduled_days,
  rl.elapsed_days,
  rl.stability_before,
  rl.stability_after,
  rl.difficulty_before,
  rl.difficulty_after,
  rl.session_id
FROM review_logs rl
WHERE rl.user_id = '54429f95-75d9-42c5-9e7e-b335331425ae'
  AND rl.review_date >= NOW() - INTERVAL '30 days'
ORDER BY rl.review_time DESC
LIMIT 50;

-- 2) Cartes avec leur état actuel (pour comparer à review_logs)
SELECT '=== 2) Cartes (état actuel) ===' AS section;
SELECT
  c.id AS card_id,
  LEFT(c.recto, 40) AS recto_preview,
  c.stability,
  c.difficulty,
  c.last_review,
  c.next_review,
  c.short_stability_minutes,
  c.learning_review_count
FROM cards c
WHERE c.user_id = '54429f95-75d9-42c5-9e7e-b335331425ae'
  AND c.deleted_at IS NULL
ORDER BY c.updated_at DESC
LIMIT 50;

-- 3) Liens review_logs <-> card_journey_events (pour comprendre "liens manquants" / "problèmes d'ordre")
SELECT '=== 3) Liens review_logs <-> card_journey_events ===' AS section;
SELECT
  rl.id AS review_log_id,
  rl.card_id,
  rl.review_date,
  rl.rating,
  cje.id AS journey_event_id,
  cje.event_type,
  cje.event_time,
  cje.review_log_id AS cje_review_log_id
FROM review_logs rl
LEFT JOIN card_journey_events cje
  ON cje.review_log_id = rl.id AND cje.event_type = 'rating_submitted'
WHERE rl.user_id = '54429f95-75d9-42c5-9e7e-b335331425ae'
  AND rl.review_date >= NOW() - INTERVAL '30 days'
ORDER BY rl.review_time DESC
LIMIT 80;

-- 4) Liens manquants : review_logs sans rating_submitted dans card_journey_events
SELECT '=== 4) Liens manquants (0 = OK) ===' AS section;
SELECT
  rl.id AS review_log_id,
  rl.card_id,
  rl.review_date,
  rl.rating
FROM review_logs rl
LEFT JOIN card_journey_events cje
  ON cje.user_id = rl.user_id AND cje.review_log_id = rl.id AND cje.event_type = 'rating_submitted'
WHERE rl.user_id = '54429f95-75d9-42c5-9e7e-b335331425ae'
  AND rl.review_date >= NOW() - INTERVAL '30 days'
  AND cje.id IS NULL
ORDER BY rl.review_time DESC
LIMIT 50;

-- 5) Doublons : review_log_id avec plusieurs rating_submitted (explique écart logs vs événements)
SELECT '=== 5) Doublons (0 = OK) ===' AS section;
SELECT
  cje.review_log_id,
  COUNT(*) AS event_count,
  array_agg(cje.id ORDER BY cje.event_time) AS journey_event_ids
FROM card_journey_events cje
WHERE cje.user_id = '54429f95-75d9-42c5-9e7e-b335331425ae'
  AND cje.event_type = 'rating_submitted'
  AND cje.event_time >= (EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days')) * 1000)::bigint
  AND cje.review_log_id IS NOT NULL
GROUP BY cje.review_log_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 20;

-- 6) Problèmes d'ordre : rating_submitted ayant un answer_revealed après (même carte/session, fenêtre 5 min)
SELECT '=== 6) Problèmes ordre ===' AS section;
SELECT
  j.id AS journey_event_id,
  j.card_id,
  j.session_id,
  j.event_time AS rating_submitted_at,
  r.event_time AS answer_revealed_after_at,
  (r.event_time - j.event_time) AS delta_ms
FROM card_journey_events j
JOIN card_journey_events r
  ON r.user_id = j.user_id
  AND r.card_id = j.card_id
  AND (r.session_id IS NOT DISTINCT FROM j.session_id)
  AND r.event_type = 'answer_revealed'
  AND r.event_time > j.event_time
  AND r.event_time <= j.event_time + 300000
WHERE j.user_id = '54429f95-75d9-42c5-9e7e-b335331425ae'
  AND j.event_type = 'rating_submitted'
  AND j.event_time >= (EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days')) * 1000)::bigint
ORDER BY j.event_time DESC
LIMIT 20;
