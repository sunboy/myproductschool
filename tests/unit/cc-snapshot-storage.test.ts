import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const productionProjectRef = 'tikkhvxlclivixqqqjyb';
const stagingEnvironment = {
  anonKey: process.env.SUPABASE_ANON_KEY,
  databaseUrl: process.env.POSTGRES_URL,
  email: process.env.STAGING_TEST_EMAIL,
  password: process.env.STAGING_TEST_PASSWORD,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
};
const hasStagingEnvironment = Object.values(stagingEnvironment).every(Boolean);
const stagingDescribe = hasStagingEnvironment ? describe : describe.skip;
const buckets = ['cc-sessions', 'cc-user-state'] as const;

function validateStagingTarget() {
  const projectRef = new URL(stagingEnvironment.supabaseUrl!).hostname.split('.')[0];
  const connection = new URL(stagingEnvironment.databaseUrl!);
  const databaseIdentity = `${connection.hostname}/${decodeURIComponent(connection.username)}`;

  expect(projectRef).not.toBe(productionProjectRef);
  expect(databaseIdentity).toContain(projectRef);
  return connection;
}

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

stagingDescribe('Claude Code snapshot bucket migration', () => {
  it('is idempotent and repairs existing public buckets', () => {
    const connection = validateStagingTarget();
    const migration = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260906150000_create_private_cc_snapshot_buckets.sql',
      ),
      'utf8',
    );
    const sql = `
BEGIN;
INSERT INTO storage.buckets (id, name, public)
VALUES ('cc-sessions', 'cc-sessions', true), ('cc-user-state', 'cc-user-state', true)
ON CONFLICT (id) DO UPDATE SET public = true;
${migration}
${migration}
SELECT 'bucket', id, public FROM storage.buckets
WHERE id IN ('cc-sessions', 'cc-user-state') ORDER BY id;
SELECT 'policy', policyname, permissive, array_to_string(roles, ',')
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname = 'cc_snapshot_buckets_deny_client_access';
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
        `Snapshot bucket migration regression failed with status ${result.status ?? 'unknown'}${
          details ? `: ${details}` : ''
        }`,
      );
    }

    const rows = result.stdout.trim().split('\n');
    expect(rows).toContain('bucket|cc-sessions|f');
    expect(rows).toContain('bucket|cc-user-state|f');
    expect(rows).toContain(
      'policy|cc_snapshot_buckets_deny_client_access|RESTRICTIVE|anon,authenticated',
    );
  });
});

stagingDescribe('Claude Code snapshot Storage API contract', () => {
  it(
    'keeps both buckets private through upload, signed download, overwrite, retention, and delete',
    async () => {
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
      const authenticated = createClient(
        stagingEnvironment.supabaseUrl!,
        stagingEnvironment.anonKey!,
        clientOptions,
      );
      const login = await authenticated.auth.signInWithPassword({
        email: stagingEnvironment.email!,
        password: stagingEnvironment.password!,
      });
      expect(login.error).toBeNull();

      for (const bucket of buckets) {
        const prefix = `_staging_contract_probe/${randomUUID()}`;
        const objectName = `${prefix}/snapshot.tar.gz`;
        const first = gzipSync(`first:${bucket}`);
        const second = gzipSync(`second:${bucket}`);

        try {
          const initialUpload = await service.storage
            .from(bucket)
            .upload(objectName, first, { contentType: 'application/gzip' });
          expect(initialUpload.error).toBeNull();

          const anonymousRead = await anonymous.storage.from(bucket).download(objectName);
          expect(anonymousRead.data).toBeNull();
          expect(anonymousRead.error).not.toBeNull();

          const authenticatedRead = await authenticated.storage
            .from(bucket)
            .download(objectName);
          expect(authenticatedRead.data).toBeNull();
          expect(authenticatedRead.error).not.toBeNull();

          const publicUrl = service.storage.from(bucket).getPublicUrl(objectName).data.publicUrl;
          const publicResponse = await fetch(publicUrl, {
            signal: AbortSignal.timeout(10_000),
          });
          expect(publicResponse.ok).toBe(false);

          const firstSigned = await service.storage
            .from(bucket)
            .createSignedUrl(objectName, 60);
          expect(firstSigned.error).toBeNull();
          const firstResponse = await fetch(firstSigned.data!.signedUrl, {
            signal: AbortSignal.timeout(10_000),
          });
          expect(firstResponse.status).toBe(200);
          expect(Buffer.from(await firstResponse.arrayBuffer())).toEqual(first);

          const overwrite = await service.storage
            .from(bucket)
            .upload(objectName, second, {
              contentType: 'application/gzip',
              upsert: true,
            });
          expect(overwrite.error).toBeNull();

          const retained = await service.storage.from(bucket).list(prefix);
          expect(retained.error).toBeNull();
          expect(retained.data?.map(({ name }) => name)).toContain('snapshot.tar.gz');

          const secondSigned = await service.storage
            .from(bucket)
            .createSignedUrl(objectName, 60);
          expect(secondSigned.error).toBeNull();
          const secondResponse = await fetch(secondSigned.data!.signedUrl, {
            signal: AbortSignal.timeout(10_000),
          });
          expect(secondResponse.status).toBe(200);
          expect(Buffer.from(await secondResponse.arrayBuffer())).toEqual(second);

          const deleted = await service.storage.from(bucket).remove([objectName]);
          expect(deleted.error).toBeNull();
          const afterDelete = await service.storage.from(bucket).list(prefix);
          expect(afterDelete.error).toBeNull();
          expect(afterDelete.data?.map(({ name }) => name)).not.toContain('snapshot.tar.gz');
        } finally {
          await service.storage.from(bucket).remove([objectName]);
        }
      }

      await authenticated.auth.signOut();
    },
    30_000,
  );
});
