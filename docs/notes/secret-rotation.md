# Secret Rotation

## Repo changes

- Removed hardcoded Supabase service-role JWTs from scripts.
- Scripts now require `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment.
- Added a Husky pre-commit hook. It runs `gitleaks protect --staged --redact` when `gitleaks` is installed, otherwise it falls back to `npm run secrets:scan:staged`.

## Required operator action

Rotate the Supabase service role key in the Supabase dashboard because the old key was committed in scripts.

1. Open the Supabase project dashboard.
2. Go to Project Settings, API.
3. Rotate or regenerate the service role secret.
4. Update `SUPABASE_SERVICE_ROLE_KEY` in local `.env.local`, Vercel environment variables, and any scheduled job environment.
5. Redeploy the app and rerun any script that depends on service-role access.

## Verification

Run:

```bash
npm run secrets:scan
rg -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+|SUPABASE_SERVICE_ROLE_KEY\\s*=\\s*['\\\"]" scripts src docs
```

Both commands should return no committed secret values.
