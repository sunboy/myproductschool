#!/usr/bin/env python3
"""
One-time repair of the algo-code-* algorithm series (36 published challenges).

Defects fixed (found by scripts/audit/validate-challenge-content.py):
  1. No starter_code: users got an empty editor with no way to know the harness
     calls `solution(*args)`. -> python + javascript stubs with correct params.
  2. reference_solution lacks the `solution` entrypoint (class Solution methods,
     named-approach functions, or ops-driver classes). -> append an explicit
     entrypoint so the reference passes its own grader and documents the
     convention for the AI grader.
  3. Tree/linked-list challenges missing input_types: the harness passed raw
     arrays where the problem semantics are nodes. -> set input_types/output_type.
  4. Blanket compare_mode 'set' on every test: order-insensitive grading on
     ordered outputs (e.g. Right Side View accepts reversed answers). -> correct
     per-challenge mode ('exact' default, 'sorted_each' for 3Sum).
  5. All-null expected (Sort Colors, Reorder List, Sudoku Solver): any no-op
     passed. -> return-value semantics; expected recomputed by executing the
     patched reference through the harness replica.

Backs up each row's previous test_cases/reference under metadata._legacy_grader.
Dry-run by default; --write to apply via Supabase REST.

Usage:
  python3 scripts/audit/fix-algo-code-series.py [--write]
  (requires /tmp/coding-content.json from export-coding-content.ts and
   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env or .env.local)
"""

import copy
import json
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from importlib import import_module

vmod = import_module('validate-challenge-content'.replace('-', '_')) if False else None

# Reuse the harness replica from the validator by exec'ing it as a module-ish.
VALIDATOR = os.path.join(os.path.dirname(__file__), 'validate-challenge-content.py')
_ns: dict = {}
with open(VALIDATOR) as f:
    src = f.read()
# strip the trailing main() invocation
src = src.replace("if __name__ == '__main__':\n    main()", '')
exec(compile(src, VALIDATOR, 'exec'), _ns)
HARNESS_PROLOGUE = _ns['HARNESS_PROLOGUE']
HARNESS_DRIVER = _ns['HARNESS_DRIVER']
compare_outputs = _ns['compare_outputs']

import subprocess
import tempfile

WRITE = '--write' in sys.argv

OPS_DRIVER = '''

# Harness entrypoint: replay an operations array against the class above.
def solution(ops, args):
    cls = globals()[ops[0]]
    inst = cls(*args[0])
    out = [None]
    for op, a in zip(ops[1:], args[1:]):
        out.append(getattr(inst, op)(*a))
    return out
'''

# id -> fix spec
# starter: python params string
# entry: code appended to reference_solution to define solution()
# input_types / output_type: applied to every test case (None = leave absent)
# compare: compare_mode applied to every test case
# recompute: recompute expected by executing the patched reference
FIXES = {
    'algo-code-012': dict(
        starter='n, bad',
        entry='\n\ndef solution(n, bad):\n    global isBadVersion\n    def isBadVersion(v):\n        return v >= bad\n    import builtins\n    builtins.isBadVersion = isBadVersion\n    globals()["isBadVersion"] = isBadVersion\n    return Solution().firstBadVersion(n)\n',
        compare='exact'),
    'algo-code-016': dict(starter='s', entry='\n\nsolution = Solution().isValid\n', compare='exact'),
    'algo-code-017': dict(starter='ops, args', entry=OPS_DRIVER, compare='exact'),
    'algo-code-018': dict(starter='nums, target', entry='\n\nsolution = Solution().searchInsert\n', compare='exact'),
    'algo-code-020': dict(starter='s', entry='\n\nsolution = Solution().firstUniqChar\n', compare='exact'),
    'algo-code-021': dict(starter='root', entry='\n\nsolution = Solution().levelOrder\n', input_types=['tree'], compare='exact'),
    'algo-code-022': dict(starter='root', entry='\n\nsolution = Solution().isValidBST\n', input_types=['tree'], compare='exact'),
    'algo-code-023': dict(starter='root', entry='\n\nsolution = Solution().rightSideView\n', input_types=['tree'], compare='exact'),
    'algo-code-024': dict(starter='root, k', entry='\n\nsolution = Solution().kthSmallest\n', input_types=['tree', None], compare='exact'),
    'algo-code-025': dict(starter='s', entry='\n\nsolution = Solution().lengthOfLongestSubstring\n', compare='exact'),
    'algo-code-026': dict(starter='s, t', entry='\n\nsolution = Solution().minWindow\n', compare='exact'),
    'algo-code-027': dict(starter='s, k', entry='\n\nsolution = Solution().characterReplacement\n', compare='exact'),
    'algo-code-028': dict(starter='nums', entry='\n\nsolution = Solution().threeSum\n', compare='sorted_each'),
    'algo-code-029': dict(starter='height', entry='\n\nsolution = Solution().maxArea\n', compare='exact'),
    'algo-code-030': dict(
        starter='nums',
        entry='\n\ndef solution(nums):\n    Solution().sortColors(nums)\n    return nums\n',
        compare='exact', recompute=True),
    'algo-code-031': dict(
        starter='values, pos',
        entry=(
            '\n\ndef solution(values, pos):\n'
            '    if not values:\n        return None\n'
            '    nodes = [ListNode(v) for v in values]\n'
            '    for a, b in zip(nodes, nodes[1:]):\n        a.next = b\n'
            '    if pos >= 0:\n        nodes[-1].next = nodes[pos]\n'
            '    node = Solution().detectCycle(nodes[0])\n'
            '    return node.val if node else None\n'
        ),
        compare='exact'),
    'algo-code-032': dict(
        starter='head',
        entry='\n\n_reorder_impl = Solution().reorderList\n\ndef solution(head):\n    _reorder_impl(head)\n    return head\n',
        input_types=['linked_list'], output_type='linked_list',
        compare='exact', recompute=True),
    'algo-code-033': dict(starter='ops, args', entry=OPS_DRIVER, compare='exact'),
    'algo-code-034': dict(starter='intervals', entry='\n\nsolution = Solution().merge\n', compare='exact'),
    'algo-code-035': dict(starter='intervals', entry='\n\nsolution = Solution().eraseOverlapIntervals\n', compare='exact'),
    # recompute: empty-tree case serializes to [] under output_type 'tree' (stored as null)
    'algo-code-036': dict(starter='root', entry='\n\nsolution = Solution().invertTree\n', input_types=['tree'], output_type='tree', compare='exact', recompute=True),
    'algo-code-037': dict(starter='root', entry='\n\nsolution = Solution().diameterOfBinaryTree\n', input_types=['tree'], compare='exact'),
    'algo-code-038': dict(
        starter='root, p, q',
        entry=(
            '\n\ndef solution(root, p, q):\n'
            '    def find(node, val):\n'
            '        while node:\n'
            '            if val < node.val:\n                node = node.left\n'
            '            elif val > node.val:\n                node = node.right\n'
            '            else:\n                return node\n'
            '        return None\n'
            '    res = Solution().lowestCommonAncestor(root, find(root, p), find(root, q))\n'
            '    return res.val if res else None\n'
        ),
        input_types=['tree', None, None], compare='exact'),
    'algo-code-039': dict(starter='s', entry='\n\nsolution = Solution().lengthOfLongestSubstring\n', compare='exact'),
    'algo-code-040': dict(starter='nums', entry='\n\nsolution = Solution().threeSum\n', compare='sorted_each'),
    'algo-code-041': dict(starter='coins, amount', entry='\n\nsolution = coin_change\n', compare='exact'),
    'algo-code-042': dict(starter='nums', entry='\n\nsolution = lis_dp\n', compare='exact'),
    'algo-code-043': dict(starter='s, wordDict', entry='\n\nsolution = word_break\n', compare='exact'),
    'algo-code-044': dict(starter='nums', entry='\n\nsolution = can_partition\n', compare='exact'),
    'algo-code-045': dict(starter='obstacleGrid', entry='\n\nsolution = unique_paths_with_obstacles\n', compare='exact'),
    'algo-code-073': dict(starter='beginWord, endWord, wordList', entry='\n\nsolution = ladderLength\n', compare='exact'),
    'algo-code-075': dict(starter='tickets', entry='\n\nsolution = findItinerary\n', compare='exact'),
    'algo-code-080': dict(
        starter='board',
        entry='\n\ndef solution(board):\n    solveSudoku(board)\n    return board\n',
        compare='exact', recompute=True),
    'algo-code-083': dict(starter='ops, args', entry=OPS_DRIVER, compare='exact'),
    'algo-code-085': dict(starter='tasks, n', entry='\n\nsolution = least_interval\n', compare='exact'),
    'algo-code-098': dict(starter='num', entry='\n\nsolution = Solution().numberToWords\n', compare='exact'),
}


def make_starters(params):
    return {
        'python': f'def solution({params}):\n    pass\n',
        'javascript': f'function solution({params}) {{\n  \n}}\n',
    }


def run_reference(ref_code, tests):
    """Execute patched reference against tests; returns list of outputs (or raises)."""
    code = HARNESS_PROLOGUE + '\n' + ref_code + '\n' + HARNESS_DRIVER
    payloads = [
        {'args': tc.get('args', []), 'input_types': tc.get('input_types') or [], 'output_type': tc.get('output_type')}
        for tc in tests
    ]
    with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False) as f:
        f.write(code)
        path = f.name
    proc = subprocess.run([sys.executable, path], input=json.dumps(payloads),
                          capture_output=True, text=True, timeout=60)
    os.unlink(path)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip()[:400])
    results = {}
    for line in proc.stdout.splitlines():
        line = line.strip()
        if line.startswith('{'):
            try:
                r = json.loads(line)
                if isinstance(r, dict) and 'i' in r:
                    results[r['i']] = r
            except json.JSONDecodeError:
                pass
    outs = []
    for i in range(len(tests)):
        r = results.get(i)
        if r is None or not r.get('ok'):
            raise RuntimeError(f"test {i}: {r.get('err') if r else 'no result'}")
        outs.append(r['out'])
    return outs


def load_env():
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not (url and key):
        with open('.env.local') as f:
            env = f.read()
        url = url or re.search(r'NEXT_PUBLIC_SUPABASE_URL=(\S+)', env).group(1)
        key = key or re.search(r'SUPABASE_SERVICE_ROLE_KEY=(\S+)', env).group(1)
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

    ok, failed = 0, 0
    for cid, fix in sorted(FIXES.items()):
        ch = chs.get(cid)
        if not ch:
            print(f'✗ {cid}: not in export')
            failed += 1
            continue
        md = copy.deepcopy(ch['metadata'])
        ref = md['reference_solution']
        if not isinstance(ref, str):
            print(f'✗ {cid}: non-string reference, skip')
            failed += 1
            continue

        legacy = {
            'test_cases': md.get('test_cases'),
            'fixed_at': '2026-06-10',
            'reason': 'algo-code series grader repair (starter/entrypoint/input_types/compare_mode)',
        }

        new_ref = ref.rstrip() + fix['entry']
        tests = copy.deepcopy(md.get('test_cases') or [])
        for tc in tests:
            tc['compare_mode'] = fix['compare']
            if 'input_types' in fix:
                tc['input_types'] = fix['input_types']
            else:
                tc.pop('input_types', None)
            if 'output_type' in fix:
                tc['output_type'] = fix['output_type']
            else:
                tc.pop('output_type', None)

        # Execute patched reference; recompute expected where requested, else verify.
        try:
            outs = run_reference(new_ref, tests)
        except (RuntimeError, subprocess.TimeoutExpired) as e:
            print(f'✗ {cid}: patched reference failed: {e}')
            failed += 1
            continue

        mismatches = []
        for i, tc in enumerate(tests):
            if fix.get('recompute'):
                tc['expected'] = outs[i]
            elif not compare_outputs(outs[i], tc.get('expected'), fix['compare']):
                mismatches.append(
                    f"  test {tc.get('id', i)}: got={json.dumps(outs[i])[:100]} expected={json.dumps(tc.get('expected'))[:100]}")
        if mismatches:
            print(f'✗ {cid}: reference disagrees with stored expected:')
            print('\n'.join(mismatches))
            failed += 1
            continue

        md['test_cases'] = tests
        md['reference_solution'] = new_ref
        md['starter_code'] = make_starters(fix['starter'])
        md['_legacy_grader'] = legacy

        if WRITE:
            patch_row(url, key, cid, md)
            print(f"✓ {cid} {ch['title'][:40]}{' (expected recomputed)' if fix.get('recompute') else ''}")
        else:
            print(f"[dry] ✓ {cid} {ch['title'][:40]}{' (would recompute expected)' if fix.get('recompute') else ''}")
        ok += 1

    print(f'\n{ok} fixed, {failed} failed{"" if WRITE else "  (dry run; --write to apply)"}')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
