import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productionProjectRef = "tikkhvxlclivixqqqjyb";
const databaseUrl =
  process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
const databaseDescribe = databaseUrl ? describe : describe.skip;
const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260906140000_profiles_subscription_status.sql",
);

function redactDatabaseDetails(output: string, secrets: string[]) {
  return secrets
    .filter(Boolean)
    .reduce(
      (sanitized, secret) => sanitized.replaceAll(secret, "[redacted]"),
      output,
    )
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-database-url]")
    .trim();
}

describe("profiles dunning schema migration source", () => {
  it("adds nullable text subscription status without narrowing Stripe states", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toMatch(
      /ADD COLUMN IF NOT EXISTS subscription_status TEXT;/i,
    );
    expect(migration).not.toMatch(/subscription_status[^;]*(DEFAULT|CHECK)/i);
  });
});

databaseDescribe("profiles dunning schema contract", () => {
  it("provides every field selected by profile reads and written by billing webhooks", () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    expect(supabaseUrl).toBeTruthy();

    const projectRef = new URL(supabaseUrl!).hostname.split(".")[0];
    expect(projectRef).not.toBe(productionProjectRef);

    const connection = new URL(databaseUrl!);
    const databaseIdentity = `${connection.hostname}/${decodeURIComponent(connection.username)}`;
    expect(databaseIdentity).toContain(projectRef);

    const migration = readFileSync(migrationPath, "utf8");
    const sql = `
BEGIN;
${migration}
SELECT
  column_name,
  data_type,
  is_nullable,
  COALESCE(column_default, '<null>')
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'subscription_status',
    'payment_failures',
    'past_due_since',
    'pro_access'
  )
ORDER BY column_name;
ROLLBACK;
`;

    const result = spawnSync(
      "psql",
      ["-X", "-q", "-A", "-t", "-F", "|", "-v", "ON_ERROR_STOP=1"],
      {
        encoding: "utf8",
        input: sql,
        env: {
          NODE_ENV: "test",
          PATH: process.env.PATH ?? "/opt/homebrew/bin:/usr/bin:/bin",
          PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
          PGHOST: connection.hostname,
          PGPASSWORD: decodeURIComponent(connection.password),
          PGPORT: connection.port || "5432",
          PGCONNECT_TIMEOUT: "10",
          PGSSLMODE: "require",
          PGUSER: decodeURIComponent(connection.username),
        },
        timeout: 20_000,
      },
    );

    if (result.status !== 0) {
      const details = redactDatabaseDetails(
        result.stderr || result.error?.message || "",
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
        `Profiles dunning schema regression failed with status ${result.status ?? "unknown"}${
          details ? `: ${details}` : ""
        }`,
      );
    }

    const columns = new Map(
      result.stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((row) => {
          const [name, type, nullable, defaultValue] = row.split("|");
          return [name, { type, nullable, defaultValue }] as const;
        }),
    );

    expect(columns).toEqual(
      new Map([
        [
          "past_due_since",
          {
            type: "timestamp with time zone",
            nullable: "YES",
            defaultValue: "<null>",
          },
        ],
        [
          "payment_failures",
          { type: "integer", nullable: "NO", defaultValue: "0" },
        ],
        [
          "pro_access",
          { type: "boolean", nullable: "NO", defaultValue: "false" },
        ],
        [
          "subscription_status",
          { type: "text", nullable: "YES", defaultValue: "<null>" },
        ],
      ]),
    );
  });
});
