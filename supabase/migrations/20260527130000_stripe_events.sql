-- Stripe webhook idempotency.
-- Stripe retries any non-2xx response and occasionally redelivers events even on 2xx.
-- Some webhook handlers do incremental writes (payment_failures counter,
-- affiliate commission processing on invoice.paid) that would double-count on
-- duplicate delivery. We insert the event id immediately after signature
-- verification and short-circuit on unique_violation (23505).

CREATE TABLE IF NOT EXISTS stripe_events (
  id          TEXT PRIMARY KEY,          -- Stripe event.id (evt_...)
  type        TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload     JSONB
);

CREATE INDEX IF NOT EXISTS stripe_events_received_at_idx ON stripe_events(received_at DESC);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT/UPDATE/DELETE policy declared — RLS denies all access to
-- authenticated/anon roles. Service role bypasses RLS so the webhook handler
-- can still read/write this table.
