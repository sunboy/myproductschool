/**
 * build-trigger-sql.ts
 *
 * Reads CHALLENGE_TYPE_POLICY and emits the SQL CASE block used inside the
 * enforce_tags_for_published_challenge trigger function.
 *
 * Usage:
 *   tsx scripts/build-trigger-sql.ts
 *
 * Output: PL/pgSQL CASE block intended to sit inside:
 *   IF NEW.is_published = true THEN
 *     CASE NEW.challenge_type
 *       ... (this script's output)
 *     END CASE;
 *   END IF;
 */

import { CHALLENGE_TYPE_POLICY, type TagAxis } from '../src/lib/practice/policy'

function isPopulatedCondition(col: string): string {
  return `(${col} IS NULL OR cardinality(${col}) = 0)`
}

function isNotEmptyCondition(col: string): string {
  return `(${col} IS NOT NULL AND cardinality(${col}) > 0)`
}

const COL: Record<TagAxis, string> = {
  topic:     'NEW.topic_tags',
  technique: 'NEW.technique_tags',
  move:      'NEW.move_tags',
}

const lines: string[] = []

lines.push('CASE NEW.challenge_type')

for (const [type, policy] of Object.entries(CHALLENGE_TYPE_POLICY)) {
  lines.push(`  WHEN '${type}' THEN`)

  let hasBody = false

  // --- required axes ---
  for (const axis of (['topic', 'technique', 'move'] as TagAxis[])) {
    if (policy[axis] === 'required') {
      const col = COL[axis]
      lines.push(
        `    IF ${isPopulatedCondition(col)} THEN`,
        `      RAISE NOTICE 'challenge %: type=${type} requires ${axis}_tags', NEW.id;`,
        `    END IF;`
      )
      hasBody = true
    }
  }

  // --- conditional XOR: exactly one of the listed axes must be set ---
  if (policy.conditional?.oneOf) {
    const axes = policy.conditional.oneOf
    const cols = axes.map(a => COL[a])

    // RAISE NOTICE when NONE of the axes is populated
    const nonePopulated = cols.map(c => isPopulatedCondition(c)).join('\n       AND ')
    lines.push(
      `    IF ${nonePopulated} THEN`,
      `      RAISE NOTICE 'challenge %: type=${type} requires exactly one of [${axes.join(', ')}] but none are set', NEW.id;`,
      `    END IF;`
    )

    // RAISE NOTICE when MORE THAN ONE axis is populated (XOR violation)
    // Build: (col1 NOT empty) AND (col2 NOT empty)  [for each pair]
    // Generalised: count populated > 1
    // We check all combinations: for N axes, emit N*(N-1)/2 AND-pairs.
    for (let i = 0; i < axes.length; i++) {
      for (let j = i + 1; j < axes.length; j++) {
        lines.push(
          `    IF ${isNotEmptyCondition(cols[i])} AND ${isNotEmptyCondition(cols[j])} THEN`,
          `      RAISE NOTICE 'challenge %: type=${type} requires exactly one of [${axes.join(', ')}] but multiple are set (${axes[i]} and ${axes[j]})', NEW.id;`,
          `    END IF;`
        )
      }
    }
    hasBody = true
  }

  // Types with all 'none' or only 'optional' and no conditional — no-op block
  if (!hasBody) {
    lines.push(`    NULL; -- no tag requirements for type=${type}`)
  }
}

// ELSE branch: catches any challenge_type value not in the policy (forward-compat guard)
lines.push(
  `  ELSE`,
  `    RAISE NOTICE 'challenge %: unknown challenge_type=%', NEW.id, NEW.challenge_type;`,
  `END CASE;`
)

console.log(lines.join('\n'))
