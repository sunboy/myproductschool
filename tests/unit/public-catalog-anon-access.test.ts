import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const productionProjectRef = 'tikkhvxlclivixqqqjyb';
const expectedStagingProjectRef = 'fkqsjjiunvvclwtgjqyc';
const stagingEnvironment = {
  anonKey: process.env.SUPABASE_ANON_KEY,
  databaseUrl: process.env.POSTGRES_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
};
const hasStagingEnvironment = Object.values(stagingEnvironment).every(Boolean);
const stagingDescribe = hasStagingEnvironment ? describe : describe.skip;
const publishedChallengeSlugs = [
  'computing-refund-rate-per-seller-without-breaking-on-zero-orders',
  'counting-distinct-senders-behind-support-ticket-aliases',
  'model-a-ski-and-snowboard-rental-shop-schema',
] as const;
const publishedDomainIds = [
  'd0000001-0000-0000-0000-000000000007',
  'd0000001-0000-0000-0000-000000000008',
] as const;

function validateStagingTarget() {
  const projectRef = new URL(stagingEnvironment.supabaseUrl!).hostname.split('.')[0];
  const connection = new URL(stagingEnvironment.databaseUrl!);
  const databaseIdentity = `${connection.hostname}/${decodeURIComponent(connection.username)}`;

  expect(projectRef).toBe(expectedStagingProjectRef);
  expect(projectRef).not.toBe(productionProjectRef);
  expect(databaseIdentity).toContain(projectRef);
  return connection;
}

function redactDatabaseDetails(output: string, secrets: string[]) {
  return secrets
    .filter(Boolean)
    .reduce((sanitized, secret) => sanitized.replaceAll(secret, '[redacted]'), output)
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted-database-url]')
    .trim();
}

stagingDescribe('public catalog admin-policy migration', () => {
  it('is idempotent and preserves the published-read policies and helper boundary', () => {
    const connection = validateStagingTarget();
    const migration = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260906160000_scope_catalog_admin_policies.sql',
      ),
      'utf8',
    );
    const sql = `
BEGIN;
${migration}
${migration}
SELECT 'policy', tablename, policyname, array_to_string(roles, ',')
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'challenges_admin',
    'challenges_read',
    'Admins can manage domains',
    'Anyone can view published domains'
  )
ORDER BY tablename, policyname;
SELECT 'anon_is_admin_execute', has_function_privilege(
  'anon',
  'public.is_admin()',
  'EXECUTE'
);
ROLLBACK;
`;
    const result = spawnSync(
      'psql',
      ['-X', '-q', '-A', '-t', '-F', '|', '-v', 'ON_ERROR_STOP=1'],
      {
        encoding: 'utf8',
        input: sql,
        env: {
          NODE_ENV: 'test',
          PATH: process.env.PATH ?? '/opt/homebrew/bin:/usr/bin:/bin',
          PGCONNECT_TIMEOUT: '10',
          PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
          PGHOST: connection.hostname,
          PGPASSWORD: decodeURIComponent(connection.password),
          PGPORT: connection.port === '6543' ? '5432' : connection.port || '5432',
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
          stagingEnvironment.databaseUrl!,
          connection.password,
          decodeURIComponent(connection.password),
          connection.username,
          decodeURIComponent(connection.username),
          connection.hostname,
        ],
      );
      throw new Error(
        `Catalog policy regression failed with status ${result.status ?? 'unknown'}${
          details ? `: ${details}` : ''
        }`,
      );
    }

    const rows = result.stdout.trim().split('\n');
    expect(rows).toContain(
      'policy|challenges|challenges_admin|authenticated',
    );
    expect(rows).toContain('policy|challenges|challenges_read|public');
    expect(rows).toContain(
      'policy|domains|Admins can manage domains|authenticated',
    );
    expect(rows).toContain(
      'policy|domains|Anyone can view published domains|public',
    );
    expect(rows).toContain('anon_is_admin_execute|f');
  });
});

stagingDescribe('anonymous published catalog access', () => {
  it('shows published fixtures, hides unpublished rows, and grants no admin capability', async () => {
    validateStagingTarget();
    const clientOptions = {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    };
    const service = createClient(
      stagingEnvironment.supabaseUrl!,
      stagingEnvironment.serviceRoleKey!,
      clientOptions,
    );
    const anonymous = createClient(
      stagingEnvironment.supabaseUrl!,
      stagingEnvironment.anonKey!,
      clientOptions,
    );
    const syntheticId = randomUUID();
    const syntheticSlug = `_staging-unpublished-catalog-probe-${syntheticId}`;

    try {
      const inserted = await service.from('challenges').insert({
        id: syntheticId,
        title: 'Staging unpublished catalog probe',
        scenario_context: 'Synthetic unpublished row used only for an RLS regression.',
        slug: syntheticSlug,
        challenge_type: 'quick_take',
        difficulty: 'medium',
        is_published: false,
        domain_id: publishedDomainIds[0],
      });
      expect(inserted.error).toBeNull();

      const publishedChallenges = await anonymous
        .from('challenges')
        .select('id, slug, is_published, domain_id')
        .in('slug', [...publishedChallengeSlugs])
        .order('slug');
      expect(publishedChallenges.error).toBeNull();
      expect(publishedChallenges.data).toHaveLength(publishedChallengeSlugs.length);
      expect(publishedChallenges.data?.every(({ is_published }) => is_published)).toBe(true);
      expect(publishedChallenges.data?.map(({ slug }) => slug)).toEqual([
        ...publishedChallengeSlugs,
      ]);

      const publishedDomains = await anonymous
        .from('domains')
        .select('id, slug, is_published')
        .in('id', [...publishedDomainIds])
        .order('id');
      expect(publishedDomains.error).toBeNull();
      expect(publishedDomains.data).toHaveLength(publishedDomainIds.length);
      expect(publishedDomains.data?.every(({ is_published }) => is_published)).toBe(true);

      const unpublished = await anonymous
        .from('challenges')
        .select('id')
        .eq('id', syntheticId);
      expect(unpublished.error).toBeNull();
      expect(unpublished.data).toEqual([]);

      const adminProbe = await anonymous.rpc('is_admin');
      expect(adminProbe.data).toBeNull();
      expect(adminProbe.error?.code).toBe('42501');

      const profileProbe = await anonymous.from('profiles').select('id').limit(1);
      expect(profileProbe.data).toBeNull();
      expect(profileProbe.error?.code).toBe('42501');
    } finally {
      await service.from('challenges').delete().eq('id', syntheticId);
    }

    const cleanup = await service.from('challenges').select('id').eq('id', syntheticId);
    expect(cleanup.error).toBeNull();
    expect(cleanup.data).toEqual([]);
  });
});
