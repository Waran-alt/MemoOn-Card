# ADR-0001: Event Model Separation

- Status: Accepted (superseded in part — see note)
- Date: 2026-02-09

## Context

The system captures:

- immutable card journey history (including study-relevant events),
- and operational auth/API telemetry.

Each stream serves a different consumer and has different retention and query patterns.

## Decision

Keep these streams as separate models/tables:

- `card_journey_events` for immutable, user-facing timeline and consistency checks.
- `user_operational_events` for service health/latency/auth telemetry.

Cross-stream analysis happens in read-model services (`study-health-dashboard`, consistency reports), not by collapsing the source-of-truth schemas.

**Evolution (2026-03):** The dedicated `study_events` table and session-centric ingestion path were removed (migration `043-remove-sessions-simplify-reviews`). Client study actions are reflected in `card_journey_events` and `review_logs` without a separate raw-ingest table.

## Consequences

- Clear ownership and schema evolution by concern.
- Better performance tuning per workload.
- Slightly higher complexity in aggregation services.

## Alternatives considered

- Single unified event log:
  - rejected due to mixed cardinality/query needs and fragile coupling across consumers.
