#!/usr/bin/env python3
"""
Validate published coding/SQL challenge content by EXECUTING each challenge's
reference solution against its own test cases, replicating the production
grading harness:

  - algorithm: src/lib/judge0/harness.ts (solution(*args), tree/linked_list/graph
    deserialization, output_type serialization) + src/lib/coding/compare.ts
    compare modes (exact | set | sorted | sorted_each).
  - sql: public/workers/sql-worker.js semantics (fresh db per test, setup_script,
    rows as column dicts) via Python sqlite3 (same engine family as sql.js)
    with match modes (exact | exact_unordered | contains).

A failure means the challenge's own reference solution cannot pass its own
grader tests, i.e. the content is not production ready.

Input:  /tmp/coding-content.json (from scripts/audit/export-coding-content.ts)
Output: per-challenge results; non-zero exit if any challenge fails.

Usage:
  npx tsx --env-file=.env.local scripts/audit/export-coding-content.ts
  python3 scripts/audit/validate-challenge-content.py [--type algorithm|sql] [--id <id>]
"""

import json
import re
import sqlite3
import subprocess
import sys
import tempfile
import os

HARNESS_PROLOGUE = r'''
import sys, json

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class GraphNode:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

def _build_tree(arr):
    if not arr:
        return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def _serialize_tree(root):
    if root is None:
        return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node is None:
            result.append(None)
        else:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
    while result and result[-1] is None:
        result.pop()
    return result

def _build_list(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    cur = head
    for val in arr[1:]:
        cur.next = ListNode(val)
        cur = cur.next
    return head

def _serialize_list(head):
    result = []
    cur = head
    visited = set()
    while cur and id(cur) not in visited:
        visited.add(id(cur))
        result.append(cur.val)
        cur = cur.next
    return result

def _build_graph(adj):
    if not adj:
        return None
    nodes = [GraphNode(i + 1) for i in range(len(adj))]
    for i, neighbors in enumerate(adj):
        nodes[i].neighbors = [nodes[n - 1] for n in neighbors]
    return nodes[0] if nodes else None

def _serialize_graph(node):
    if node is None:
        return []
    visited = {}
    order = []
    queue = [node]
    while queue:
        n = queue.pop(0)
        if n.val in visited:
            continue
        visited[n.val] = n
        order.append(n)
        for nb in n.neighbors:
            if nb.val not in visited:
                queue.append(nb)
    max_val = max(n.val for n in order)
    adj = [[] for _ in range(max_val)]
    for n in order:
        adj[n.val - 1] = [nb.val for nb in n.neighbors]
    return adj

def _deserialize_arg(value, typ):
    if typ == 'tree':
        return _build_tree(value)
    if typ == 'linked_list':
        return _build_list(value)
    if typ == 'graph':
        return _build_graph(value)
    return value

def _serialize_result(result, typ):
    if typ == 'tree':
        return _serialize_tree(result)
    if typ == 'linked_list':
        return _serialize_list(result)
    if typ == 'graph':
        return _serialize_graph(result)
    return result
'''

# Runs ALL test cases for one challenge in a single subprocess; emits one
# JSON line per test: {"i": idx, "ok": bool, "out": ..., "err": "..."}
HARNESS_DRIVER = r'''
import copy

_payloads = json.loads(sys.stdin.read())
for _i, _p in enumerate(_payloads):
    try:
        _args = _p.get('args', [])
        _input_types = _p.get('input_types', []) or []
        _output_type = _p.get('output_type', None)
        _deserialized = [
            _deserialize_arg(copy.deepcopy(_args[_j]), _input_types[_j] if _j < len(_input_types) else None)
            for _j in range(len(_args))
        ]
        _result = solution(*_deserialized)
        _result = _serialize_result(_result, _output_type)
        print(json.dumps({"i": _i, "ok": True, "out": _result}))
    except Exception as _e:
        print(json.dumps({"i": _i, "ok": False, "err": str(_e)[:300]}))
'''


def extract_python_ref(ref):
    """reference_solution may be a string (python) or {python, javascript}."""
    if isinstance(ref, str):
        return ref
    if isinstance(ref, dict):
        return ref.get('python') or ref.get('py')
    return None


def adapt_class_solution(code):
    """The harness calls solution(*args). If the reference defines `class Solution`
    with public methods instead, bind the first public method as `solution`."""
    if re.search(r'^def solution\(', code, re.M) or re.search(r'\ndef solution\(', code):
        return code
    m = re.search(r'class Solution\b', code)
    if not m:
        return code  # hope it defines solution() some other way
    methods = re.findall(r'\n    def (\w+)\(self', code)
    public = [name for name in methods if not name.startswith('_')]
    if not public:
        return code
    return code + f"\n\n_sol_instance = Solution()\nsolution = _sol_instance.{public[0]}\n"


def to_sort_key(v):
    return json.dumps(v, sort_keys=True, default=str)


def norm_num(v):
    """Normalize ints expressed as floats (json 5.0 vs 5) for comparison."""
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, list):
        return [norm_num(x) for x in v]
    if isinstance(v, dict):
        return {k: norm_num(x) for k, x in v.items()}
    return v


def compare_outputs(actual, expected, mode):
    actual, expected = norm_num(actual), norm_num(expected)
    if actual is None:
        return expected is None
    if mode == 'set':
        if not isinstance(actual, list) or not isinstance(expected, list):
            return to_sort_key(actual) == to_sort_key(expected)
        if len(actual) != len(expected):
            return False
        return sorted(map(to_sort_key, actual)) == sorted(map(to_sort_key, expected))
    if mode == 'sorted':
        if not isinstance(actual, list) or not isinstance(expected, list):
            return to_sort_key(actual) == to_sort_key(expected)
        if len(actual) != len(expected):
            return False
        try:
            return sorted(actual, key=float) == sorted(expected, key=float)
        except (TypeError, ValueError):
            return sorted(map(to_sort_key, actual)) == sorted(map(to_sort_key, expected))
    if mode == 'sorted_each':
        if not isinstance(actual, list) or not isinstance(expected, list):
            return to_sort_key(actual) == to_sort_key(expected)
        if len(actual) != len(expected):
            return False

        def norm(arr):
            rows = [to_sort_key(sorted(map(to_sort_key, r)) if isinstance(r, list) else r) for r in arr]
            return sorted(rows)
        return norm(actual) == norm(expected)
    # exact / unknown
    return to_sort_key(actual) == to_sort_key(expected)


def validate_algorithm(ch):
    md = ch.get('metadata') or {}
    tests = md.get('test_cases') or []
    issues = []
    if not tests:
        return ['no test cases']

    ref = extract_python_ref(md.get('reference_solution'))
    if not ref:
        return ['no python reference solution; cannot execute-validate']

    code = HARNESS_PROLOGUE + '\n' + adapt_class_solution(ref) + '\n' + HARNESS_DRIVER
    payloads = []
    for tc in tests:
        if 'args' not in tc or 'expected' not in tc:
            issues.append(f"test {tc.get('id', '?')}: missing args/expected keys")
        payloads.append({
            'args': tc.get('args', []),
            'input_types': tc.get('input_types') or [],
            'output_type': tc.get('output_type'),
        })
    if issues:
        return issues

    with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False) as f:
        f.write(code)
        path = f.name
    try:
        proc = subprocess.run(
            [sys.executable, path],
            input=json.dumps(payloads),
            capture_output=True, text=True, timeout=30,
        )
    except subprocess.TimeoutExpired:
        os.unlink(path)
        return ['reference solution timed out (30s for all tests)']
    os.unlink(path)

    if proc.returncode != 0:
        return [f'reference solution crashed: {proc.stderr.strip()[:300]}']

    results = {}
    for line in proc.stdout.splitlines():
        line = line.strip()
        if not line.startswith('{'):
            continue
        try:
            r = json.loads(line)
            if isinstance(r, dict) and 'i' in r:
                results[r['i']] = r
        except json.JSONDecodeError:
            continue

    for i, tc in enumerate(tests):
        r = results.get(i)
        label = tc.get('id') or tc.get('label', f'#{i}')
        if r is None:
            issues.append(f'test {label}: no result emitted')
            continue
        if not r.get('ok'):
            issues.append(f"test {label}: reference raised: {r.get('err')}")
            continue
        mode = tc.get('compare_mode') or tc.get('match_mode') or 'exact'
        if not compare_outputs(r.get('out'), tc.get('expected'), mode):
            issues.append(
                f"test {label}: MISMATCH mode={mode} got={json.dumps(r.get('out'))[:120]} expected={json.dumps(tc.get('expected'))[:120]}"
            )
    return issues


def sql_rows_to_dicts(cursor):
    cols = [d[0] for d in cursor.description] if cursor.description else []
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def compare_rows(actual, expected, mode):
    actual, expected = norm_num(actual), norm_num(expected)

    def key(o):
        return json.dumps({k: o[k] for k in sorted(o)}, default=str)
    if mode == 'exact':
        return json.dumps(actual, default=str) == json.dumps(expected, default=str)
    if mode == 'contains':
        actual_set = {key(r) for r in actual}
        return all(key(e) in actual_set for e in expected)
    # exact_unordered (default)
    return sorted(key(r) for r in actual) == sorted(key(r) for r in expected)


def extract_sql_ref(ref):
    if isinstance(ref, str):
        return ref
    if isinstance(ref, dict):
        return ref.get('sql')
    return None


def validate_sql(ch):
    md = ch.get('metadata') or {}
    schema = md.get('sql_schema') or {}
    # sql_schema is usually an object with setup_script; in some older rows it is
    # the DDL string itself.
    setup = schema.get('setup_script') if isinstance(schema, dict) else schema
    tests = md.get('test_cases') or []
    issues = []
    if not setup:
        return ['missing sql_schema.setup_script']
    if not tests:
        return ['no test cases']
    ref = extract_sql_ref(md.get('reference_solution'))
    if not ref:
        return ['no sql reference solution']

    for i, tc in enumerate(tests):
        label = tc.get('id') or tc.get('label', f'#{i}')
        expected = tc.get('expected_rows')
        if expected is None:
            issues.append(f'test {label}: missing expected_rows')
            continue
        try:
            db = sqlite3.connect(':memory:')
            # Per-test dataset support, mirroring public/workers/sql-worker.js
            db.executescript(tc.get('setup_override') or setup)
            cur = db.execute(ref)
            actual = sql_rows_to_dicts(cur)
            db.close()
        except sqlite3.Error as e:
            issues.append(f'test {label}: sql error: {str(e)[:200]}')
            continue
        mode = tc.get('match_mode') or 'exact_unordered'
        if not compare_rows(actual, expected, mode):
            issues.append(
                f"test {label}: MISMATCH mode={mode} got({len(actual)} rows)={json.dumps(actual, default=str)[:160]} expected({len(expected)})={json.dumps(expected, default=str)[:160]}"
            )
    return issues


def main():
    args = sys.argv[1:]
    type_filter = args[args.index('--type') + 1] if '--type' in args else None
    id_filter = args[args.index('--id') + 1] if '--id' in args else None

    with open('/tmp/coding-content.json') as f:
        challenges = json.load(f)

    failing = 0
    total = 0
    for ch in challenges:
        if type_filter and ch['challenge_type'] != type_filter:
            continue
        if id_filter and ch['id'] != id_filter:
            continue
        total += 1
        issues = validate_algorithm(ch) if ch['challenge_type'] == 'algorithm' else validate_sql(ch)
        if issues:
            failing += 1
            print(f"\n✗ [{ch['challenge_type']}] {ch['title']} ({ch['id']})")
            for issue in issues:
                print(f"    {issue}")
    print(f"\n{failing} failing / {total} validated")
    sys.exit(1 if failing else 0)


if __name__ == '__main__':
    main()
