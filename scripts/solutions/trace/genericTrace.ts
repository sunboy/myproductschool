/**
 * Thin TS wrapper over scripts/solutions/trace/generic_tracer.py.
 *
 * Shells out to the Python generic execution tracer, which runs a challenge's
 * REAL reference_solution under sys.settrace on ONE test case and returns an
 * execution timeline (one frame per executed solution line + shallow locals).
 *
 * This is the ceiling-free walkthrough FALLBACK: any algorithm with a runnable
 * python reference can produce a trace, regardless of pattern. Callers should
 * treat a null return as "no generic trace available" and fall back to whatever
 * they had before (or omit the walkthrough).
 *
 * Fail-soft by contract: ANY failure (bad python, tracer crash, timeout, unparseable
 * output, no python reference) returns null rather than throwing.
 *
 * NOTE: engine + capture only. This does NOT fit the trace into the stepped-diagram
 * schema (src/lib/solutions/schema.ts) and does NOT touch graft/UI — that is a later
 * phase after the render decision.
 */

import { spawn } from 'node:child_process'
import path from 'node:path'

/** A reference solution as stored in metadata.reference_solution. */
export type ReferenceSolution = string | { python?: string; py?: string; [k: string]: unknown }

/** One test case, shaped like metadata.test_cases[i] (only the fields the tracer uses). */
export interface TraceTestCase {
  args: unknown[]
  /** per-arg shape hints: 'tree' | 'linked_list' | 'graph' | anything else (passthrough). */
  input_types?: string[]
  /** result shape hint for serialization: 'tree' | 'linked_list' | 'graph' | anything else. */
  output_type?: string | null
}

/** One recorded execution frame. */
export interface TraceFrame {
  /** 1-based source line number within `sourceLines` (line N => sourceLines[N-1]). */
  line: number
  /** shallow snapshot of local variables visible after this line executed. */
  locals: Record<string, unknown>
}

/** Parsed result of a successful generic trace. */
export interface GenericTrace {
  /** serialized return value of the reference (tree/list/graph serialized to compact arrays). */
  answer: unknown
  /** ordered execution timeline. */
  frames: TraceFrame[]
  /** the (class-adapted) solution source, one entry per line. */
  sourceLines: string[]
  /** which safety caps tripped, if any. */
  capped?: { frames: boolean; time: boolean }
}

const TRACER_PY = path.join(__dirname, 'generic_tracer.py')

interface RunOptions {
  /** wall-clock budget for the whole python process, ms. Default 8000. */
  timeoutMs?: number
  /** python executable. Default 'python3'. */
  python?: string
}

/**
 * Run the generic execution tracer on a reference solution + one test case.
 * Returns the parsed trace, or null on ANY failure (fail-soft).
 */
export async function runGenericTrace(
  reference: ReferenceSolution,
  test: TraceTestCase,
  opts: RunOptions = {},
): Promise<GenericTrace | null> {
  const timeoutMs = opts.timeoutMs ?? 8000
  const python = opts.python ?? 'python3'

  // The python tracer itself spawns a second sandboxed subprocess with its own
  // shorter internal timeout; give the outer process a slightly larger budget.
  const innerTimeoutSec = Math.max(1, Math.floor((timeoutMs - 1500) / 1000))
  const payload = JSON.stringify({ code: reference, test, timeout: innerTimeoutSec })

  const stdout = await new Promise<string | null>((resolve) => {
    let out = ''
    let settled = false
    const done = (v: string | null) => {
      if (settled) return
      settled = true
      resolve(v)
    }

    let child: ReturnType<typeof spawn>
    try {
      child = spawn(python, [TRACER_PY], { stdio: ['pipe', 'pipe', 'pipe'] })
    } catch {
      return done(null)
    }

    const killTimer = setTimeout(() => {
      try {
        child.kill('SIGKILL')
      } catch {
        /* ignore */
      }
      done(null)
    }, timeoutMs)

    child.stdout?.on('data', (d) => {
      out += d.toString()
    })
    child.on('error', () => {
      clearTimeout(killTimer)
      done(null)
    })
    child.on('close', (code) => {
      clearTimeout(killTimer)
      // Even on a non-zero exit the python wrapper emits a JSON line to stdout,
      // so prefer whatever we captured; only null out if there is nothing.
      done(out.trim() ? out : code === 0 ? out : null)
    })

    try {
      child.stdin?.write(payload)
      child.stdin?.end()
    } catch {
      clearTimeout(killTimer)
      try {
        child.kill('SIGKILL')
      } catch {
        /* ignore */
      }
      done(null)
    }
  })

  if (!stdout) return null

  // The wrapper prints one JSON object; take the last JSON line to be safe.
  let parsed: unknown = null
  for (const line of stdout.split('\n')) {
    const t = line.trim()
    if (t.startsWith('{')) {
      try {
        parsed = JSON.parse(t)
      } catch {
        /* keep scanning */
      }
    }
  }
  if (!parsed || typeof parsed !== 'object') return null

  const obj = parsed as Record<string, unknown>
  if (obj.ok !== true) return null
  if (!Array.isArray(obj.frames) || !Array.isArray(obj.source_lines)) return null

  const frames: TraceFrame[] = (obj.frames as unknown[])
    .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
    .map((f) => ({
      line: typeof f.line === 'number' ? f.line : 0,
      locals:
        f.locals && typeof f.locals === 'object'
          ? (f.locals as Record<string, unknown>)
          : {},
    }))

  return {
    answer: obj.answer ?? null,
    frames,
    sourceLines: (obj.source_lines as unknown[]).map((s) => String(s)),
    capped:
      obj.capped && typeof obj.capped === 'object'
        ? {
            frames: !!(obj.capped as Record<string, unknown>).frames,
            time: !!(obj.capped as Record<string, unknown>).time,
          }
        : undefined,
  }
}
