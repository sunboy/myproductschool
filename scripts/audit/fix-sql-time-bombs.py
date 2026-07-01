#!/usr/bin/env python3
"""
One-time repair of 5 broken SQL challenges (found by validate-challenge-content.py).

- 4 challenges used date('now', ...) against fixed (or relative) seed data, so the
  frozen expected_rows drifted and the challenges became unpassable. Fix: pin the
  window to an anchor date consistent with the data, in both the setup (Slack) and
  the reference solution, then recompute expected_rows by executing the reference.
- sql-sql-041 test cases used is_hidden (worker reads hidden), had no match_mode
  (worker returns false for unknown modes), and rely on per-test setup_override
  (worker support added in public/workers/sql-worker.js). Fix: normalize keys and
  verify each test's expected against its own dataset.

Backs up prior test_cases/reference under metadata._legacy_grader.
Dry-run by default; --write to apply.
"""

import copy
import json
import os
import re
import sqlite3
import sys
import urllib.request

WRITE = '--write' in sys.argv

FIXES = {
    '13aa3607-551b-49f3-b9c0-5ca4f1d5bf2f': {  # Spotify weekly trend (data 2026-04-14..27)
        'ref_sub': [
            ("date('now', '-14 days')", "'2026-04-14'"),
            ("strftime('%Y-%W', 'now')", "strftime('%Y-%W', '2026-04-27')"),
        ],
    },
    '3525ccfa-8d3d-4ac0-bf01-19ed9e9908eb': {  # Twilio hourly (data 2026-04-22)
        'ref_sub': [("DATE('now', '-7 days')", "'2026-04-22'")],
    },
    '4c77b0b9-0c05-4533-abc0-48f2f324e8b6': {  # Instacart departments (data 2026-04-22..28)
        'ref_sub': [("date('now', '-7 days')", "'2026-04-22'")],
    },
    '8be89795-6429-4a08-bcb1-14327a5045ee': {  # Slack DAU (setup generated relative to now)
        'setup_sub': [("date('now',", "date('2026-06-10',")],
        'ref_sub': [("date('now', '-30 days')", "date('2026-06-10', '-30 days')")],
    },
}


def rows_for(setup, query):
    db = sqlite3.connect(':memory:')
    db.executescript(setup)
    cur = db.execute(query)
    cols = [d[0] for d in cur.description] if cur.description else []
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    db.close()
    return rows


def load_env():
    env = open('.env.local').read()
    url = re.search(r'NEXT_PUBLIC_SUPABASE_URL=(\S+)', env).group(1)
    key = re.search(r'SUPABASE_SERVICE_ROLE_KEY=(\S+)', env).group(1)
    return url, key


def patch_row(url, key, cid, metadata):
    req = urllib.request.Request(
        f'{url}/rest/v1/challenges?id=eq.{cid}',
        data=json.dumps({'metadata': metadata}).encode(),
        headers={'apikey': key, 'Authorization': f'Bearer {key}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='PATCH')
    urllib.request.urlopen(req)


def main():
    with open('/tmp/coding-content.json') as f:
        chs = {c['id']: c for c in json.load(f)}
    url, key = load_env()
    failed = 0

    # --- the 4 time-pinned challenges -------------------------------------
    for cid, fix in FIXES.items():
        ch = chs[cid]
        md = copy.deepcopy(ch['metadata'])
        schema = md['sql_schema']
        setup = schema['setup_script'] if isinstance(schema, dict) else schema
        ref = md['reference_solution']
        ref = ref if isinstance(ref, str) else ref.get('sql')

        legacy = {'test_cases': md.get('test_cases'), 'fixed_at': '2026-06-10',
                  'reason': "pin date('now') window to seed-data anchor; recompute expected_rows"}

        for old, new in fix.get('setup_sub', []):
            if old not in setup:
                print(f'✗ {cid}: setup pattern not found: {old}')
                failed += 1
                break
            setup = setup.replace(old, new)
        for old, new in fix.get('ref_sub', []):
            if old not in ref:
                print(f'✗ {cid}: ref pattern not found: {old}')
                failed += 1
                break
            ref = ref.replace(old, new)
        if "'now'" in ref or "'now'" in setup:
            print(f"✗ {cid}: still contains 'now' after substitution")
            failed += 1
            continue

        try:
            rows = rows_for(setup, ref)
        except sqlite3.Error as e:
            print(f'✗ {cid}: pinned reference errored: {e}')
            failed += 1
            continue
        if not rows:
            print(f'✗ {cid}: pinned reference returns 0 rows; anchor wrong')
            failed += 1
            continue

        tests = copy.deepcopy(md.get('test_cases') or [])
        for tc in tests:
            tc['expected_rows'] = rows
        md['test_cases'] = tests
        md['reference_solution'] = ref
        if isinstance(schema, dict):
            schema['setup_script'] = setup
            md['sql_schema'] = schema
        else:
            md['sql_schema'] = setup
        md['_legacy_grader'] = legacy

        if WRITE:
            patch_row(url, key, cid, md)
        print(f"{'✓' if WRITE else '[dry] ✓'} {ch['title'][:50]} ({len(rows)} expected rows)")

    # --- sql-sql-041: normalize tc keys + verify per-test setup_override ---
    ch = chs['sql-sql-041']
    md = copy.deepcopy(ch['metadata'])
    schema = md['sql_schema']
    base_setup = schema['setup_script'] if isinstance(schema, dict) else schema
    ref = md['reference_solution']
    ref = ref if isinstance(ref, str) else ref.get('sql')
    legacy = {'test_cases': md.get('test_cases'), 'fixed_at': '2026-06-10',
              'reason': 'normalize is_hidden->hidden, add match_mode, verify per-test setup_override'}

    tests = copy.deepcopy(md.get('test_cases') or [])
    ok41 = True
    for tc in tests:
        tc['hidden'] = bool(tc.pop('is_hidden', tc.get('hidden', False)))
        tc.setdefault('match_mode', 'exact_unordered')
        setup = tc.get('setup_override') or base_setup
        try:
            rows = rows_for(setup, ref)
        except sqlite3.Error as e:
            print(f"✗ sql-sql-041 {tc.get('id')}: {e}")
            ok41 = False
            continue

        def norm(o):
            return json.dumps({k: o[k] for k in sorted(o)}, default=str)
        if sorted(map(norm, rows)) != sorted(map(norm, tc.get('expected_rows') or [])):
            # Re-anchor expected to what the reference actually produces on this dataset
            print(f"  sql-sql-041 {tc.get('id')}: expected recomputed ({len(tc.get('expected_rows') or [])} -> {len(rows)} rows)")
            tc['expected_rows'] = rows

    if ok41:
        md['test_cases'] = tests
        md['_legacy_grader'] = legacy
        if WRITE:
            patch_row(url, key, 'sql-sql-041', md)
        print(f"{'✓' if WRITE else '[dry] ✓'} Top-Selling Product Per Category (per-test datasets verified)")
    else:
        failed += 1

    print(f"\n{'applied' if WRITE else 'dry run'}; {failed} failed")
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
