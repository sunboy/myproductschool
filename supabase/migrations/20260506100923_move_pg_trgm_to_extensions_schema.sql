-- Keep extension-owned objects out of the exposed public schema.
-- pg_trgm is relocatable, and app code does not call its functions/operators directly.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
