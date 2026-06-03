-- Dedicated schema for the self-hosted LiteLLM gateway's bookkeeping tables
-- (LiteLLM_VerificationToken, LiteLLM_SpendLogs, etc.). Keeping LiteLLM's ~15
-- tables out of `public` avoids cluttering the app schema. The gateway connects
-- with DATABASE_URL ...?options=-csearch_path%3Dlitellm (or schema=litellm) so it
-- creates and uses its tables here.

CREATE SCHEMA IF NOT EXISTS litellm;
