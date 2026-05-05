// lib/judge0/harness.ts — server-side only
// Wraps user-submitted solution code in language-appropriate I/O glue
// so each language reads JSON args from stdin, calls solution(), and
// prints the JSON result to stdout.
//
// Structured input support (trees, linked lists, graphs):
// - When stdin is { "args": [...], "input_types": [...], "output_type": "..." }
//   the harness deserializes each arg per its type before calling solution().
// - When stdin is bare [...] (legacy shape), behavior is unchanged.
import type { SupportedJudge0Language } from './languageMap'

// ---------------------------------------------------------------------------
// Python deserializer prologue
// ---------------------------------------------------------------------------
// Exported so tests can assert its presence in wrapped output.

export const PYTHON_DESERIALIZER_PROLOGUE = `\
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
    """Build a TreeNode from a level-order array (LeetCode convention).
    None entries in arr represent missing nodes."""
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
    """Serialize a TreeNode back to level-order array, trimming trailing nulls."""
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
    # Trim trailing nulls
    while result and result[-1] is None:
        result.pop()
    return result

def _build_list(arr):
    """Build a ListNode chain from a plain array."""
    if not arr:
        return None
    head = ListNode(arr[0])
    cur = head
    for val in arr[1:]:
        cur.next = ListNode(val)
        cur = cur.next
    return head

def _serialize_list(head):
    """Serialize a ListNode chain back to a plain array."""
    result = []
    cur = head
    visited = set()
    while cur and id(cur) not in visited:
        visited.add(id(cur))
        result.append(cur.val)
        cur = cur.next
    return result

def _build_graph(adj):
    """Build GraphNodes from a 1-indexed adjacency list (LeetCode 133 convention).
    adj[i] is the list of neighbor indices (1-based) for node i+1.
    Returns the node with val=1, or None for empty input."""
    if not adj:
        return None
    nodes = [GraphNode(i + 1) for i in range(len(adj))]
    for i, neighbors in enumerate(adj):
        nodes[i].neighbors = [nodes[n - 1] for n in neighbors]
    return nodes[0] if nodes else None

def _serialize_graph(node):
    """Serialize a graph (starting from node) to 1-indexed adjacency list."""
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
    # Build adjacency list (1-indexed) sorted by node val
    max_val = max(n.val for n in order)
    adj = [[] for _ in range(max_val)]
    for n in order:
        adj[n.val - 1] = [nb.val for nb in n.neighbors]
    return adj

def _deserialize_arg(value, typ):
    """Deserialize a single argument by its type label."""
    if typ == 'tree':
        return _build_tree(value)
    if typ == 'linked_list':
        return _build_list(value)
    if typ == 'graph':
        return _build_graph(value)
    # 'matrix', 'int', 'string', 'array', None → pass through
    return value

def _serialize_result(result, typ):
    """Serialize a result value by its type label."""
    if typ == 'tree':
        return _serialize_tree(result)
    if typ == 'linked_list':
        return _serialize_list(result)
    if typ == 'graph':
        return _serialize_graph(result)
    return result

`

// ---------------------------------------------------------------------------
// JavaScript deserializer prologue
// ---------------------------------------------------------------------------

export const JS_DESERIALIZER_PROLOGUE = `\
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

class ListNode {
  constructor(val = 0, next = null) {
    this.val = val; this.next = next;
  }
}

class GraphNode {
  constructor(val = 0, neighbors = []) {
    this.val = val; this.neighbors = neighbors;
  }
}

function _buildTree(arr) {
  if (!arr || arr.length === 0) return null;
  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;
  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift();
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
      node.left = new TreeNode(arr[i]);
      queue.push(node.left);
    }
    i++;
    if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
      node.right = new TreeNode(arr[i]);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}

function _serializeTree(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === null || node === undefined) {
      result.push(null);
    } else {
      result.push(node.val);
      queue.push(node.left ?? null);
      queue.push(node.right ?? null);
    }
  }
  // Trim trailing nulls
  while (result.length > 0 && result[result.length - 1] === null) result.pop();
  return result;
}

function _buildList(arr) {
  if (!arr || arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let cur = head;
  for (let i = 1; i < arr.length; i++) {
    cur.next = new ListNode(arr[i]);
    cur = cur.next;
  }
  return head;
}

function _serializeList(head) {
  const result = [];
  const visited = new Set();
  let cur = head;
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    result.push(cur.val);
    cur = cur.next;
  }
  return result;
}

function _buildGraph(adj) {
  if (!adj || adj.length === 0) return null;
  const nodes = adj.map((_, i) => new GraphNode(i + 1));
  adj.forEach((neighbors, i) => {
    nodes[i].neighbors = neighbors.map(n => nodes[n - 1]);
  });
  return nodes[0] ?? null;
}

function _serializeGraph(startNode) {
  if (!startNode) return [];
  const visited = new Map();
  const queue = [startNode];
  while (queue.length > 0) {
    const n = queue.shift();
    if (visited.has(n.val)) continue;
    visited.set(n.val, n);
    for (const nb of n.neighbors) {
      if (!visited.has(nb.val)) queue.push(nb);
    }
  }
  const maxVal = Math.max(...visited.keys());
  const adj = Array.from({ length: maxVal }, () => []);
  for (const [val, n] of visited) {
    adj[val - 1] = n.neighbors.map(nb => nb.val);
  }
  return adj;
}

function _deserializeArg(value, typ) {
  if (typ === 'tree') return _buildTree(value);
  if (typ === 'linked_list') return _buildList(value);
  if (typ === 'graph') return _buildGraph(value);
  return value;
}

function _serializeResult(result, typ) {
  if (typ === 'tree') return _serializeTree(result);
  if (typ === 'linked_list') return _serializeList(result);
  if (typ === 'graph') return _serializeGraph(result);
  return result;
}

`

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Wraps user code with a stdin→solution()→stdout harness.
 *
 * Stdin format (two shapes are supported):
 *   - Legacy:     JSON array   e.g. [[1,2,3], 5]
 *   - Structured: JSON object  e.g. { "args": [[1,null,2]], "input_types": ["tree"], "output_type": "tree" }
 *
 * When the structured shape is present, the harness deserializes each arg
 * according to its input_types entry (tree / linked_list / graph / passthrough).
 * The return value is serialized according to output_type before JSON printing.
 */
export function wrapWithHarness(userCode: string, language: SupportedJudge0Language): string {
  switch (language) {
    case 'python':
      return wrapPython(userCode)
    case 'javascript':
      return wrapJavaScript(userCode)
    case 'java':
      return wrapJava(userCode)
    case 'cpp':
      return wrapCpp(userCode)
    case 'go':
      return wrapGo(userCode)
    default: {
      const _exhaustive: never = language
      throw new Error(`Unsupported language for harness: ${_exhaustive}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Python
// ---------------------------------------------------------------------------

function wrapPython(userCode: string): string {
  return `${PYTHON_DESERIALIZER_PROLOGUE}
${userCode}

_raw = sys.stdin.read()
_payload = json.loads(_raw)

if isinstance(_payload, list):
    # Legacy shape: bare array of args
    _args = _payload
    _input_types = []
    _output_type = None
else:
    # Structured shape: { args, input_types, output_type }
    _args = _payload.get('args', [])
    _input_types = _payload.get('input_types', [])
    _output_type = _payload.get('output_type', None)

_deserialized = [
    _deserialize_arg(_args[i], _input_types[i] if i < len(_input_types) else None)
    for i in range(len(_args))
]

_result = solution(*_deserialized)
_result = _serialize_result(_result, _output_type)
print(json.dumps(_result))
`
}

// ---------------------------------------------------------------------------
// JavaScript (Node.js)
// ---------------------------------------------------------------------------

function wrapJavaScript(userCode: string): string {
  return `${JS_DESERIALIZER_PROLOGUE}
${userCode}

const _raw = require('fs').readFileSync('/dev/stdin', 'utf-8');
const _payload = JSON.parse(_raw);

let _args, _inputTypes, _outputType;
if (Array.isArray(_payload)) {
  // Legacy shape: bare array of args
  _args = _payload;
  _inputTypes = [];
  _outputType = null;
} else {
  // Structured shape: { args, input_types, output_type }
  _args = _payload.args ?? [];
  _inputTypes = _payload.input_types ?? [];
  _outputType = _payload.output_type ?? null;
}

const _deserialized = _args.map((v, i) => _deserializeArg(v, _inputTypes[i] ?? null));
let _result = solution(..._deserialized);
_result = _serializeResult(_result, _outputType);
console.log(JSON.stringify(_result));
`
}

// ---------------------------------------------------------------------------
// Java
// ---------------------------------------------------------------------------
// The user writes a Solution class with a public solution() method.
// We wrap it in a Main class that reads stdin, parses a flat JSON array
// using a minimal hand-rolled parser (no external deps available on Judge0
// CE without a build tool), invokes the method via reflection, and prints
// the JSON-serialized result.
//
// TODO: Java wrapper does not yet support structured input types (tree/linked_list/graph).
// Add TreeNode/ListNode deserialization to coerce() when needed.

function wrapJava(userCode: string): string {
  return `import java.util.*;
import java.io.*;

${userCode}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            sb.append(line);
        }
        String input = sb.toString().trim();

        // Parse top-level JSON array into a List<Object>
        List<Object> parsed = parseJsonArray(input);

        // Invoke solution via reflection — works for any signature
        Solution sol = new Solution();
        Class<?> cls = sol.getClass();
        java.lang.reflect.Method[] methods = cls.getDeclaredMethods();
        java.lang.reflect.Method solMethod = null;
        for (java.lang.reflect.Method m : methods) {
            if (m.getName().equals("solution")) {
                solMethod = m;
                break;
            }
        }
        if (solMethod == null) throw new RuntimeException("No solution() method found");

        // Coerce args to parameter types
        Class<?>[] paramTypes = solMethod.getParameterTypes();
        Object[] invokeArgs = new Object[paramTypes.length];
        for (int i = 0; i < paramTypes.length; i++) {
            invokeArgs[i] = coerce(parsed.get(i), paramTypes[i]);
        }

        Object result = solMethod.invoke(sol, invokeArgs);
        System.out.println(toJson(result));
    }

    @SuppressWarnings("unchecked")
    private static Object coerce(Object value, Class<?> target) {
        if (value == null) return null;
        if (target == int.class || target == Integer.class) return ((Number) value).intValue();
        if (target == long.class || target == Long.class) return ((Number) value).longValue();
        if (target == double.class || target == Double.class) return ((Number) value).doubleValue();
        if (target == boolean.class || target == Boolean.class) return (Boolean) value;
        if (target == String.class) return value.toString();
        if (target == int[].class) {
            List<Object> list = (List<Object>) value;
            int[] arr = new int[list.size()];
            for (int i = 0; i < list.size(); i++) arr[i] = ((Number) list.get(i)).intValue();
            return arr;
        }
        if (target == long[].class) {
            List<Object> list = (List<Object>) value;
            long[] arr = new long[list.size()];
            for (int i = 0; i < list.size(); i++) arr[i] = ((Number) list.get(i)).longValue();
            return arr;
        }
        if (target == String[].class) {
            List<Object> list = (List<Object>) value;
            return list.stream().map(Object::toString).toArray(String[]::new);
        }
        if (target == List.class) return value;
        return value;
    }

    private static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) {
            int[] arr = (int[]) obj;
            StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) s.append(","); s.append(arr[i]); }
            return s.append("]").toString();
        }
        if (obj instanceof long[]) {
            long[] arr = (long[]) obj;
            StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) s.append(","); s.append(arr[i]); }
            return s.append("]").toString();
        }
        if (obj instanceof Object[]) {
            Object[] arr = (Object[]) obj;
            StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) s.append(","); s.append(toJson(arr[i])); }
            return s.append("]").toString();
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder s = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) { if (i > 0) s.append(","); s.append(toJson(list.get(i))); }
            return s.append("]").toString();
        }
        if (obj instanceof String) return "\\"" + obj + "\\"";
        return obj.toString();
    }

    // Minimal recursive-descent JSON array parser
    private static List<Object> parseJsonArray(String json) {
        int[] pos = {0};
        skipWs(json, pos);
        if (json.charAt(pos[0]) != '[') throw new RuntimeException("Expected JSON array");
        pos[0]++;
        List<Object> result = new ArrayList<>();
        skipWs(json, pos);
        while (json.charAt(pos[0]) != ']') {
            result.add(parseValue(json, pos));
            skipWs(json, pos);
            if (json.charAt(pos[0]) == ',') pos[0]++;
            skipWs(json, pos);
        }
        return result;
    }

    private static Object parseValue(String json, int[] pos) {
        skipWs(json, pos);
        char c = json.charAt(pos[0]);
        if (c == '[') {
            pos[0]++;
            List<Object> list = new ArrayList<>();
            skipWs(json, pos);
            while (json.charAt(pos[0]) != ']') {
                list.add(parseValue(json, pos));
                skipWs(json, pos);
                if (json.charAt(pos[0]) == ',') pos[0]++;
                skipWs(json, pos);
            }
            pos[0]++;
            return list;
        }
        if (c == '"') {
            pos[0]++;
            StringBuilder sb = new StringBuilder();
            while (json.charAt(pos[0]) != '"') {
                if (json.charAt(pos[0]) == '\\\\') pos[0]++;
                sb.append(json.charAt(pos[0]++));
            }
            pos[0]++;
            return sb.toString();
        }
        if (c == 't') { pos[0] += 4; return Boolean.TRUE; }
        if (c == 'f') { pos[0] += 5; return Boolean.FALSE; }
        if (c == 'n') { pos[0] += 4; return null; }
        // number
        int start = pos[0];
        if (c == '-') pos[0]++;
        while (pos[0] < json.length() && (Character.isDigit(json.charAt(pos[0])) || json.charAt(pos[0]) == '.' || json.charAt(pos[0]) == 'e' || json.charAt(pos[0]) == 'E' || json.charAt(pos[0]) == '+' || json.charAt(pos[0]) == '-')) pos[0]++;
        String num = json.substring(start, pos[0]);
        if (num.contains(".") || num.contains("e") || num.contains("E")) return Double.parseDouble(num);
        return Long.parseLong(num);
    }

    private static void skipWs(String json, int[] pos) {
        while (pos[0] < json.length() && Character.isWhitespace(json.charAt(pos[0]))) pos[0]++;
    }
}
`
}

// ---------------------------------------------------------------------------
// C++ (GCC 9.2.0) — nlohmann/json bundled inline (single-header subset)
// ---------------------------------------------------------------------------
// We include a minimal nlohmann/json subset via a bundled header string
// for JSON parsing.  For simplicity, we use a runtime stdin read and
// a lightweight parse approach: since Judge0 CE does NOT have external
// packages, we do a minimal manual deserializer for the args array and
// use nlohmann/json for the output.
//
// Practical simplification: most interview problems use int/long/string/
// vector<int> args.  We provide a lightweight approach using stringstream.
//
// TODO: C++ wrapper does not yet support structured input types (tree/linked_list/graph).
// Add TreeNode/ListNode deserialization when needed.

function wrapCpp(userCode: string): string {
  return `#include <bits/stdc++.h>
using namespace std;

// ---- begin user solution ----
${userCode}
// ---- end user solution ----

// Minimal JSON serializer for common return types
string toJson(int v) { return to_string(v); }
string toJson(long long v) { return to_string(v); }
string toJson(double v) { ostringstream s; s << v; return s.str(); }
string toJson(bool v) { return v ? "true" : "false"; }
string toJson(const string& v) { return "\\"" + v + "\\""; }
template<typename T>
string toJson(const vector<T>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); ++i) { if (i) s += ","; s += toJson(v[i]); }
    return s + "]";
}

// Minimal stdin JSON array parser
struct JsonParser {
    const string& s;
    size_t pos = 0;
    void ws() { while (pos < s.size() && isspace(s[pos])) ++pos; }
    long long parseInt() {
        bool neg = false;
        if (s[pos] == '-') { neg = true; ++pos; }
        long long v = 0;
        while (pos < s.size() && isdigit(s[pos])) v = v * 10 + (s[pos++] - '0');
        return neg ? -v : v;
    }
    double parseDouble() {
        size_t start = pos;
        if (s[pos] == '-') ++pos;
        while (pos < s.size() && (isdigit(s[pos]) || s[pos] == '.' || s[pos] == 'e' || s[pos] == 'E' || s[pos] == '+' || s[pos] == '-')) ++pos;
        return stod(s.substr(start, pos - start));
    }
    string parseString() {
        ++pos; // skip "
        string r;
        while (s[pos] != '"') { if (s[pos] == '\\\\') ++pos; r += s[pos++]; }
        ++pos;
        return r;
    }
    vector<long long> parseIntArray() {
        ++pos; // [
        vector<long long> v;
        ws();
        while (s[pos] != ']') {
            v.push_back(parseInt());
            ws(); if (s[pos] == ',') ++pos; ws();
        }
        ++pos;
        return v;
    }
};

int main() {
    string input, line;
    while (getline(cin, line)) input += line;
    // Parse top-level args array: [arg0, arg1, ...]
    // For simplicity, pass the entire stdin JSON string to solution via
    // a custom entry point if the solution accepts a string, otherwise
    // the challenge author must ensure args match the solution signature.
    // Most coding challenges: first call solution with parsed int arrays.
    JsonParser p{input};
    p.ws(); p.pos++; // skip '['

    // Read first arg (array of ints) and second arg (int) for typical two-sum style
    // Generic: read up to 4 args and call overloaded solution.
    // For full generality, challenges should use Python or JS; C++ is for advanced users.
    p.ws();
    // Try to call solution — user must define solution() with matching signature
    // We pass the raw JSON string as a fallback if no matching overload exists.
    // Minimal shim: parse as vector<long long>, long long pairs
    vector<long long> arg0;
    long long arg1 = 0;
    bool hasArg1 = false;

    if (p.pos < input.size() && input[p.pos] == '[') {
        arg0 = p.parseIntArray();
        p.ws(); if (p.pos < input.size() && input[p.pos] == ',') p.pos++;
        p.ws();
        if (p.pos < input.size() && input[p.pos] != ']') {
            arg1 = p.parseInt();
            hasArg1 = true;
        }
    } else if (p.pos < input.size() && input[p.pos] != ']') {
        arg1 = p.parseInt();
        hasArg1 = true;
    }

    auto result = hasArg1 ? solution(arg0, (int)arg1) : solution(arg0);
    cout << toJson(result) << endl;
    return 0;
}
`
}

// ---------------------------------------------------------------------------
// Go (1.13.5) — encoding/json
// ---------------------------------------------------------------------------
// TODO: Go wrapper does not yet support structured input types (tree/linked_list/graph).
// Add TreeNode/ListNode deserialization when needed.

function wrapGo(userCode: string): string {
  return `package main

import (
	"encoding/json"
	"fmt"
	"os"
)

// ---- begin user solution ----
${userCode}
// ---- end user solution ----

func main() {
	// Read all stdin
	var raw []json.RawMessage
	decoder := json.NewDecoder(os.Stdin)
	if err := decoder.Decode(&raw); err != nil {
		fmt.Fprintf(os.Stderr, "failed to decode stdin: %v\\n", err)
		os.Exit(1)
	}

	// Unmarshal args — for a generic solution(a, b int) style challenge
	// we decode positional args from the raw messages.
	// solution() is defined by the user above.
	var args []interface{}
	for _, r := range raw {
		var v interface{}
		if err := json.Unmarshal(r, &v); err != nil {
			fmt.Fprintf(os.Stderr, "arg unmarshal error: %v\\n", err)
			os.Exit(1)
		}
		args = append(args, v)
	}

	result := callSolution(args)

	out, err := json.Marshal(result)
	if err != nil {
		fmt.Fprintf(os.Stderr, "marshal error: %v\\n", err)
		os.Exit(1)
	}
	fmt.Println(string(out))
}

// callSolution dispatches to the user's solution function.
// For typical 2-arg int challenges: solution(nums []int, target int)
// This shim handles the most common interview signatures.
func callSolution(args []interface{}) interface{} {
	if len(args) == 2 {
		nums := toIntSlice(args[0])
		target := toInt(args[1])
		return solution(nums, target)
	}
	if len(args) == 1 {
		nums := toIntSlice(args[0])
		return solution(nums)
	}
	// Fallback: pass args directly — user solution must accept []interface{}
	return solution(args)
}

func toIntSlice(v interface{}) []int {
	switch val := v.(type) {
	case []interface{}:
		result := make([]int, len(val))
		for i, n := range val {
			result[i] = toInt(n)
		}
		return result
	}
	return nil
}

func toInt(v interface{}) int {
	switch val := v.(type) {
	case float64:
		return int(val)
	case int:
		return val
	}
	return 0
}
`
}
