#!/usr/bin/env python3
"""
Generic Python execution tracer for coding-challenge reference solutions.

Given a reference_solution (python) plus ONE test case (args + input_types +
output_type), this executes the solution under sys.settrace and records an
execution timeline: one frame per executed line of the solution's OWN code,
each frame carrying the source line number and a shallow snapshot of local vars.

This is the CEILING-FREE fallback walkthrough source: any algorithm whose
reference is runnable can produce a trace, regardless of pattern. It intentionally
reuses the EXACT prelude/harness helpers from
  scripts/audit/validate-challenge-content.py
so tree/list/graph arguments deserialize identically to production grading.

Design notes / safety:
  - line events are scoped to the solution's OWN code object (compiled from a
    known filename). Frames inside CPython library internals are ignored, so a
    solution that calls sorted()/heapq/collections does not flood the trace.
  - shallow serialization: primitives as-is; lists/tuples/dicts capped at
    _MAX_ELEMS then elided; TreeNode/ListNode/GraphNode via the existing
    serializers to a compact form; functions/modules/large/opaque objects
    are skipped.
  - hard caps: _MAX_FRAMES total frames and _WALL_BUDGET_S wall-time. A
    pathological reference (huge input, deep recursion) cannot hang or blow
    memory: once a cap trips the tracer detaches and we still emit what we have.
  - no network, no file writes. Intended to be spawned in a subprocess with a
    timeout (see genericTrace.ts / validate-challenge-content.py pattern).

Input  (stdin, JSON): { "code": <python str>, "test": { "args", "input_types", "output_type" } }
Output (stdout, JSON): {
    "ok": bool,
    "answer": <serialized result> | None,
    "frames": [ { "line": int, "locals": { name: value } }, ... ],
    "source_lines": [ str, ... ],   # solution source, 1 entry per line (line N => index N-1)
    "err": <str>                    # present only when ok is False
}
"""

import sys
import json
import re
import time
import subprocess
import tempfile
import os

# ---------------------------------------------------------------------------
# EXACT prelude from scripts/audit/validate-challenge-content.py (HARNESS_PROLOGUE).
# Kept verbatim so tree/list/graph args deserialize identically to grading.
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# EXACT helper logic from validate-challenge-content.py:
#   extract_python_ref + adapt_class_solution
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# The tracer driver. This runs INSIDE the spawned subprocess (its source is
# assembled as HARNESS_PROLOGUE + solution code + this driver). It sets a line
# tracer scoped to the solution filename, runs solution(*deserialized), and
# prints the final JSON payload. The solution source is compiled from a known
# filename so we can distinguish its code objects from library internals.
# ---------------------------------------------------------------------------
TRACER_DRIVER = r'''
import copy, time, types

_MAX_FRAMES = 400
_MAX_ELEMS = 24          # per collection before eliding
_MAX_STR = 200           # chars per string value
_MAX_DICT_KEYS = 24
_WALL_BUDGET_S = 3.0
_SOLUTION_FILE = "<solution>"   # filename the solution was compiled under

_frames = []
_start = time.time()
_capped = {"frames": False, "time": False}


def _is_node(v):
    return isinstance(v, (TreeNode, ListNode, GraphNode))


def _shallow(v, _depth=0):
    """Shallow-serialize a local value for the timeline snapshot."""
    # primitives
    if v is None or isinstance(v, (bool, int, float)):
        return v
    if isinstance(v, str):
        return v if len(v) <= _MAX_STR else v[:_MAX_STR] + "...<+%d>" % (len(v) - _MAX_STR)
    # domain node types -> compact serialized form via existing serializers
    if isinstance(v, TreeNode):
        try:
            return {"__node__": "tree", "val": _shallow(v.val), "repr": _serialize_tree(v)}
        except Exception:
            return {"__node__": "tree", "val": _shallow(getattr(v, "val", None))}
    if isinstance(v, ListNode):
        try:
            return {"__node__": "list", "repr": _serialize_list(v)}
        except Exception:
            return {"__node__": "list", "val": _shallow(getattr(v, "val", None))}
    if isinstance(v, GraphNode):
        try:
            return {"__node__": "graph", "val": _shallow(getattr(v, "val", None)), "repr": _serialize_graph(v)}
        except Exception:
            return {"__node__": "graph", "val": _shallow(getattr(v, "val", None))}
    # containers (one level deep; nested items shallow-serialized but not recursively deep)
    if _depth >= 2:
        return "<...>"
    if isinstance(v, (list, tuple)):
        out = [_shallow(x, _depth + 1) for x in list(v)[:_MAX_ELEMS]]
        if len(v) > _MAX_ELEMS:
            out.append("...<+%d>" % (len(v) - _MAX_ELEMS))
        return out
    if isinstance(v, set):
        items = list(v)
        out = [_shallow(x, _depth + 1) for x in items[:_MAX_ELEMS]]
        if len(items) > _MAX_ELEMS:
            out.append("...<+%d>" % (len(items) - _MAX_ELEMS))
        return {"__set__": out}
    if isinstance(v, dict):
        out = {}
        for i, (k, val) in enumerate(v.items()):
            if i >= _MAX_DICT_KEYS:
                out["...<+%d>" % (len(v) - _MAX_DICT_KEYS)] = None
                break
            kk = k if isinstance(k, (str, int, float, bool)) or k is None else str(k)
            out[str(kk)] = _shallow(val, _depth + 1)
        return out
    # skip functions / modules / classes / large opaque objects
    if isinstance(v, (types.FunctionType, types.BuiltinFunctionType, types.ModuleType, type)):
        return None
    # last resort: short repr, elided
    try:
        r = repr(v)
    except Exception:
        return None
    return ("<obj %s>" % (r[:_MAX_STR])) if r else None


def _snapshot_locals(frame_locals):
    snap = {}
    for name, val in list(frame_locals.items()):
        # skip our own harness/deserialize temporaries, dunders, and the bound
        # `self` receiver (its repr carries a non-deterministic memory address
        # and it is never meaningful in a walkthrough).
        if name.startswith("__") or name.startswith("_deserial") or name in ("solution", "self"):
            continue
        try:
            s = _shallow(val)
        except Exception:
            continue
        if s is None and val is not None:
            # value existed but was un-serializable (function/module) -> skip
            continue
        snap[name] = s
    return snap


def _tracer(frame, event, arg):
    # only line events, only inside the solution's own source file
    if _capped["frames"] or _capped["time"]:
        return None
    if frame.f_code.co_filename != _SOLUTION_FILE:
        return _tracer if event == "call" else None
    if event == "call":
        return _tracer
    if event != "line":
        return _tracer
    if time.time() - _start > _WALL_BUDGET_S:
        _capped["time"] = True
        sys.settrace(None)
        return None
    if len(_frames) >= _MAX_FRAMES:
        _capped["frames"] = True
        sys.settrace(None)
        return None
    _frames.append({"line": frame.f_lineno, "locals": _snapshot_locals(frame.f_locals)})
    return _tracer


def _run():
    _payload = json.loads(sys.stdin.read())
    _tc = _payload.get("test", {}) or {}
    _args = _tc.get("args", []) or []
    _input_types = _tc.get("input_types", []) or []
    _output_type = _tc.get("output_type", None)
    _deserialized = [
        _deserialize_arg(copy.deepcopy(_args[_j]), _input_types[_j] if _j < len(_input_types) else None)
        for _j in range(len(_args))
    ]
    sys.settrace(_tracer)
    try:
        _result = solution(*_deserialized)
    finally:
        sys.settrace(None)
    _answer = _serialize_result(_result, _output_type)
    return _answer


try:
    _answer = _run()
    print(json.dumps({
        "ok": True,
        "answer": _answer,
        "frames": _frames,
        "source_lines": _SOURCE_LINES,
        "capped": _capped,
    }, default=str))
except Exception as _e:
    sys.settrace(None)
    print(json.dumps({
        "ok": False,
        "answer": None,
        "frames": _frames,
        "source_lines": _SOURCE_LINES,
        "err": (type(_e).__name__ + ": " + str(_e))[:400],
        "capped": _capped,
    }, default=str))
'''


def build_program(solution_code, source_lines):
    """Assemble the full subprocess program:

      HARNESS_PROLOGUE
      <solution code, compiled/exec'd under filename "<solution>">
      TRACER_DRIVER

    The solution code is compiled from a string under a KNOWN filename so the
    line tracer can scope to it. We embed the solution source as a literal, then
    compile+exec it in the module globals, so `solution(...)` is defined and its
    code objects carry co_filename == "<solution>".
    """
    adapted = adapt_class_solution(solution_code)
    src_lines_literal = json.dumps(source_lines)
    solution_literal = json.dumps(adapted)
    program = (
        HARNESS_PROLOGUE
        + "\n"
        + "_SOURCE_LINES = " + src_lines_literal + "\n"
        + "_SOLUTION_SRC = " + solution_literal + "\n"
        + "_code_obj = compile(_SOLUTION_SRC, \"<solution>\", \"exec\")\n"
        + "exec(_code_obj, globals())\n"
        + "\n"
        + TRACER_DRIVER
    )
    return program


def run_trace(code, test, timeout=6):
    """Spawn a subprocess that traces `code` on `test`. Returns the parsed
    JSON dict, or a dict with ok=False + err on any failure. `code` may be a
    string or {python}. `test` = {args, input_types, output_type}."""
    ref = extract_python_ref(code)
    if not ref:
        return {"ok": False, "answer": None, "frames": [], "source_lines": [],
                "err": "no python reference solution"}

    adapted = adapt_class_solution(ref)
    source_lines = adapted.split("\n")
    program = build_program(ref, source_lines)

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(program)
        path = f.name
    try:
        proc = subprocess.run(
            [sys.executable, path],
            input=json.dumps({"test": test}),
            capture_output=True, text=True, timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return {"ok": False, "answer": None, "frames": [], "source_lines": source_lines,
                "err": "tracer subprocess timed out (%ss)" % timeout}
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    if proc.returncode != 0 and not proc.stdout.strip():
        return {"ok": False, "answer": None, "frames": [], "source_lines": source_lines,
                "err": "tracer crashed: " + (proc.stderr.strip()[:400] or "no output")}

    # find the last JSON object line on stdout
    parsed = None
    for line in proc.stdout.splitlines():
        line = line.strip()
        if line.startswith("{"):
            try:
                parsed = json.loads(line)
            except json.JSONDecodeError:
                continue
    if parsed is None:
        return {"ok": False, "answer": None, "frames": [], "source_lines": source_lines,
                "err": "tracer produced no parseable output; stderr=" + proc.stderr.strip()[:300]}
    return parsed


def main():
    """CLI: reads {code, test} from stdin, prints trace JSON to stdout.
    This is the wrapper entrypoint the TS shim shells out to; it internally
    spawns a second sandboxed subprocess to actually run the traced solution."""
    try:
        payload = json.loads(sys.stdin.read())
    except Exception as e:
        print(json.dumps({"ok": False, "answer": None, "frames": [], "source_lines": [],
                          "err": "bad input json: " + str(e)}))
        return
    code = payload.get("code")
    test = payload.get("test", {}) or {}
    timeout = payload.get("timeout", 6)
    result = run_trace(code, test, timeout=timeout)
    print(json.dumps(result, default=str))


if __name__ == "__main__":
    main()
