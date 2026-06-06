-- Lifecycle email preference: covers re-engagement / nudge / conversion emails
-- (resume-a-challenge, upgrade nudge, resume-an-article, paid insights).
-- Default true: lifecycle emails are transactional-ish, opt-out via one-click
-- unsubscribe. Pure promotions still use the opt-in `marketing` flag instead.

ALTER TABLE notification_prefs
  ADD COLUMN IF NOT EXISTS lifecycle boolean NOT NULL DEFAULT true;
