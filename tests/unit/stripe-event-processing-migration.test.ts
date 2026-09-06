import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const productionProjectRef = 'tikkhvxlclivixqqqjyb';
const databaseUrl = process.env.POSTGRES_URL;
const databaseDescribe = databaseUrl ? describe : describe.skip;

const protectedFunctions = [
  {
    name: 'claim_stripe_event',
    signature: 'public.claim_stripe_event(text,text,jsonb,integer)',
  },
  {
    name: 'complete_stripe_event',
    signature: 'public.complete_stripe_event(text,uuid)',
  },
  {
    name: 'release_stripe_event',
    signature: 'public.release_stripe_event(text,uuid,text)',
  },
  {
    name: 'record_stripe_payment_failure',
    signature:
      'public.record_stripe_payment_failure(text,uuid,uuid,timestamp with time zone)',
  },
] as const;

function redactDatabaseDetails(output: string, secrets: string[]) {
  return secrets
    .filter(Boolean)
    .reduce(
      (sanitized, secret) => sanitized.replaceAll(secret, '[redacted]'),
      output,
    )
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted-database-url]')
    .trim();
}

databaseDescribe('Stripe event processing migration ACLs', () => {
  it('revokes explicit client grants and preserves service-role execution', () => {
    const connection = new URL(databaseUrl!);
    const supabaseUrl = process.env.SUPABASE_URL;

    expect(
      supabaseUrl,
      'SUPABASE_URL must accompany POSTGRES_URL for staging target validation',
    ).toBeTruthy();

    const projectRef = new URL(supabaseUrl!).hostname.split('.')[0];
    const databaseIdentity = `${connection.hostname}/${decodeURIComponent(connection.username)}`;

    expect(projectRef).not.toBe(productionProjectRef);
    expect(databaseIdentity).toContain(projectRef);

    const migration = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260906130000_restrict_stripe_event_processing_rpc_access.sql',
      ),
      'utf8',
    );
    const grants = protectedFunctions
      .map(
        ({ signature }) =>
          `GRANT EXECUTE ON FUNCTION ${signature} TO anon, authenticated;`,
      )
      .join('\n');
    const functionRows = protectedFunctions
      .map(({ name, signature }) => `('${name}', '${signature}')`)
      .join(',\n    ');
    const sql = `
BEGIN;
${grants}
${migration}

WITH protected_function(function_name, signature) AS (
  VALUES
    ${functionRows}
), checked_role(role_name) AS (
  VALUES ('anon'), ('authenticated'), ('service_role')
)
SELECT
  function_name,
  role_name,
  has_function_privilege(role_name, signature, 'EXECUTE')
FROM protected_function
CROSS JOIN checked_role
ORDER BY function_name, role_name;
ROLLBACK;
`;

    const result = spawnSync(
      'psql',
      ['-X', '-q', '-A', '-t', '-F', '|', '-v', 'ON_ERROR_STOP=1'],
      {
        encoding: 'utf8',
        input: sql,
        env: {
          PATH: process.env.PATH ?? '/opt/homebrew/bin:/usr/bin:/bin',
          PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
          PGHOST: connection.hostname,
          PGPASSWORD: decodeURIComponent(connection.password),
          PGPORT: connection.port === '6543' ? '5432' : connection.port || '5432',
          PGCONNECT_TIMEOUT: '10',
          PGSSLMODE: 'require',
          PGUSER: decodeURIComponent(connection.username),
        },
        timeout: 20_000,
      },
    );

    if (result.status !== 0) {
      const details = redactDatabaseDetails(
        result.stderr || result.error?.message || '',
        [
          databaseUrl!,
          connection.password,
          decodeURIComponent(connection.password),
          connection.username,
          decodeURIComponent(connection.username),
          connection.hostname,
        ],
      );
      throw new Error(
        `PostgreSQL ACL regression failed with status ${result.status ?? 'unknown'}${
          details ? `: ${details}` : ''
        }`,
      );
    }

    const privileges = new Map(
      result.stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((row) => {
          const [functionName, roleName, allowed] = row.split('|');
          return [`${functionName}:${roleName}`, allowed === 't'] as const;
        }),
    );

    expect(privileges).toHaveLength(protectedFunctions.length * 3);
    for (const { name } of protectedFunctions) {
      expect(privileges.get(`${name}:anon`)).toBe(false);
      expect(privileges.get(`${name}:authenticated`)).toBe(false);
      expect(privileges.get(`${name}:service_role`)).toBe(true);
    }
  });
});
