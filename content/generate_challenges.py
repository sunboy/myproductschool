#!/usr/bin/env python3
"""
HackProduct Challenge Generator
================================
Reusable pipeline for generating product thinking challenges at scale.

Usage:
  # 1. Generate briefs (challenge specs, no content yet)
  python generate_challenges.py briefs \
    --roles SWE,MLE,DE \
    --count 2 \
    --modules 1,2,3 \
    --paradigms TRAD,AI-ASSIST \
    --formats HP-SCENARIO,INT-TRADE \
    --out briefs_batch2.json

  # 2. Run generation (calls claude CLI in parallel)
  python generate_challenges.py run \
    --briefs briefs_batch2.json \
    --out challenges_batch2.json \
    --parallel 5 \
    --model claude-haiku-4-5-20251001

  # 3. Merge a completed batch into the master file
  python generate_challenges.py merge \
    --batch challenges_batch2.json \
    --master challenges_all.json
"""

import argparse
import asyncio
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# ─── Constants ────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
SPEC_FILE = SCRIPT_DIR / "CHALLENGE_SPEC.md"
CONTENT_PLANNING_FILE = SCRIPT_DIR / "CONTENT_PLANNING.md"

VALID_ROLES = ["SWE", "DE", "MLE", "DEVOPS", "EM", "FE", "TL", "PM", "DES", "DS"]
VALID_FORMATS = [
    "INT-DESIGN", "INT-IMPROVE", "INT-METRIC", "INT-STRATEGY",
    "INT-GROWTH", "INT-TRADE", "INT-DIAG", "INT-FAV",
    "HP-SCENARIO", "HP-TEARDOWN", "HP-DEBATE", "HP-BRIEF", "HP-POSTMORTEM",
]
VALID_PARADIGMS = ["TRAD", "AI-ASSIST", "AGENTIC", "AI-NATIVE"]
VALID_COMPANY_TYPES = ["REAL", "FICT-B2C", "FICT-B2B", "INTERNAL"]

DEFAULT_PARADIGM_FOR_FORMAT = {
    "INT-DESIGN": "TRAD",
    "INT-IMPROVE": "TRAD",
    "INT-METRIC": "TRAD",
    "INT-STRATEGY": "AI-NATIVE",
    "INT-GROWTH": "TRAD",
    "INT-TRADE": "AI-ASSIST",
    "INT-DIAG": "AI-ASSIST",
    "INT-FAV": "TRAD",
    "HP-SCENARIO": "TRAD",
    "HP-TEARDOWN": "TRAD",
    "HP-DEBATE": "TRAD",
    "HP-BRIEF": "AI-ASSIST",
    "HP-POSTMORTEM": "TRAD",
}

DEFAULT_COMPANY_TYPE_FOR_FORMAT = {
    "INT-DESIGN": "FICT-B2C",
    "INT-IMPROVE": "REAL",
    "INT-METRIC": "REAL",
    "INT-STRATEGY": "REAL",
    "INT-GROWTH": "REAL",
    "INT-TRADE": "REAL",
    "INT-DIAG": "REAL",
    "INT-FAV": "REAL",
    "HP-SCENARIO": "FICT-B2C",
    "HP-TEARDOWN": "REAL",
    "HP-DEBATE": "INTERNAL",
    "HP-BRIEF": "FICT-B2B",
    "HP-POSTMORTEM": "REAL",
}

MODULE_SUMMARIES = {
    1: {
        "name": "User Segmentation",
        "concept": "Segment by behavior and motivation, not demographics. Designing for everyone is designing for no one.",
        "anti_patterns": [
            "Demographic segmentation (age, location, income)",
            "Designing for everyone = designing for no one",
            "Ignoring multi-sided markets (missing host OR guest)",
            "Vague personas without behavioral specificity",
        ],
        "difficulty": "Beginner",
    },
    2: {
        "name": "Problem Identification & Prioritization",
        "concept": "Diagnose root causes before proposing solutions. Symptoms and root causes are not the same thing.",
        "anti_patterns": [
            "Jumping to solutions before defining the problem",
            "Confusing symptoms with root causes",
            "Picking the loudest problem, not the most important one",
            "Ignoring problems users have stopped complaining about",
        ],
        "difficulty": "Intermediate",
    },
    3: {
        "name": "Defining Success Metrics",
        "concept": "Measure user outcomes, not feature outputs. Every North Star metric needs a guardrail.",
        "anti_patterns": [
            "Using technical metrics as product success proxies",
            "Measuring feature adoption instead of user outcomes",
            "Picking metrics that can be gamed",
            "No guardrail metric — leads to dark pattern optimization",
        ],
        "difficulty": "Intermediate",
    },
    4: {
        "name": "Product Improvement (Distribution vs. Novelty)",
        "concept": "Distribution and existing behavior beat originality. Improve what users are already doing before inventing something new.",
        "anti_patterns": [
            "Assuming novelty drives adoption",
            "Proposing a new feature when deepening existing behavior is more valuable",
            "Ignoring competitive context when framing an improvement",
            "Treating a feature copy as a failure rather than a strategic signal",
        ],
        "difficulty": "Intermediate",
    },
    5: {
        "name": "Trade-off Decisions",
        "concept": "'It depends' without reasoning is a red flag. Name what you're optimizing for and name the sacrifice explicitly.",
        "anti_patterns": [
            "'It depends' as an ending, not a starting point",
            "Treating all options as equally valid",
            "Optimizing for nothing (no stated goal or metric)",
            "Ignoring brand, regulatory, or trust constraints",
        ],
        "difficulty": "Advanced",
    },
    6: {
        "name": "Jobs to Be Done (User Empathy)",
        "concept": "Users hire products to get a job done: functional, emotional, and social. The job is not the feature.",
        "anti_patterns": [
            "Treating the feature as the job (not the outcome)",
            "Optimizing only for functional job, ignoring emotional and social dimensions",
            "Assuming all users hire the product for the same job",
            "Confusing what the product does with why users love it",
        ],
        "difficulty": "Beginner",
    },
    7: {
        "name": "Product Strategy & Competitive Moats",
        "concept": "Technical superiority without a moat is a feature, not a business. Identify which moat type applies.",
        "anti_patterns": [
            "Jumping to features without a moat strategy",
            "Treating distribution as product-market fit",
            "Assuming technical superiority creates a moat",
            "Solving for wrong user segment (acquisition vs. retention require opposite bets)",
        ],
        "difficulty": "Advanced",
    },
    8: {
        "name": "Engineer-to-PM Mindset Shift",
        "concept": "Engineers don't lack product intuition — they lack vocabulary and reps. Ask why before how.",
        "anti_patterns": [
            "Asking 'how' before 'why'",
            "Treating technical elegance as product success",
            "Fixing bugs without ROI analysis",
            "Building for abstract users instead of real ones",
        ],
        "difficulty": "Beginner",
    },
}

DIFFICULTY_MINUTES = {
    "Beginner": 15,
    "Intermediate": 15,
    "Advanced": 20,
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def load_spec() -> str:
    if not SPEC_FILE.exists():
        print(f"ERROR: CHALLENGE_SPEC.md not found at {SPEC_FILE}", file=sys.stderr)
        sys.exit(1)
    return SPEC_FILE.read_text()


def count_existing_for_role_module(existing_ids: list[str], role: str, module: int) -> int:
    """Count how many challenges already exist for a role+module combo."""
    pattern = f"MOD{module}-{role}-"
    return sum(1 for cid in existing_ids if pattern in cid)


def make_id(fmt: str, company_type: str, paradigm: str, module: int, role: str, seq: int) -> str:
    return f"{fmt}-{company_type}-{paradigm}-MOD{module}-{role}-{seq:03d}"


def load_existing_ids(master_path: Path) -> list[str]:
    if not master_path.exists():
        return []
    data = json.loads(master_path.read_text())
    return [c["id"] for c in data.get("challenges", [])]


# ─── Subcommand: briefs ────────────────────────────────────────────────────────

def cmd_briefs(args):
    roles = [r.strip().upper() for r in args.roles.split(",")]
    modules = [int(m) for m in args.modules.split(",")]
    paradigms = [p.strip().upper() for p in args.paradigms.split(",")]
    formats = [f.strip().upper() for f in args.formats.split(",")]
    count = args.count
    out_path = Path(args.out)

    # Validate
    for r in roles:
        if r not in VALID_ROLES:
            print(f"ERROR: Unknown role '{r}'. Valid: {', '.join(VALID_ROLES)}", file=sys.stderr)
            sys.exit(1)
    for m in modules:
        if m not in MODULE_SUMMARIES:
            print(f"ERROR: Unknown module {m}. Valid: 1-8", file=sys.stderr)
            sys.exit(1)

    # Load existing IDs to avoid duplication
    master_path = Path(args.master) if args.master else SCRIPT_DIR / "challenges_all.json"
    existing_ids = load_existing_ids(master_path)

    briefs = []
    for role in roles:
        for module in modules:
            mod = MODULE_SUMMARIES[module]
            existing_count = count_existing_for_role_module(existing_ids, role, module)

            for i in range(count):
                seq = existing_count + i + 1

                # Cycle through formats and paradigms
                fmt = formats[i % len(formats)]
                paradigm = paradigms[i % len(paradigms)]
                company_type = DEFAULT_COMPANY_TYPE_FOR_FORMAT[fmt]

                brief_id = make_id(fmt, company_type, paradigm, module, role, seq)

                briefs.append({
                    "id": brief_id,
                    "role": role,
                    "format": fmt,
                    "company_type": company_type,
                    "paradigm": paradigm,
                    "module": module,
                    "module_name": mod["name"],
                    "module_concept": mod["concept"],
                    "module_anti_patterns": mod["anti_patterns"],
                    "difficulty": mod["difficulty"],
                    "estimated_minutes": DIFFICULTY_MINUTES[mod["difficulty"]],
                })

    out_path.write_text(json.dumps({"briefs": briefs, "total": len(briefs)}, indent=2))
    print(f"Generated {len(briefs)} briefs -> {out_path}")
    for b in briefs:
        print(f"  {b['id']} | {b['module_name']} | {b['difficulty']}")


# ─── Subcommand: run ──────────────────────────────────────────────────────────

def build_prompt(spec: str, brief: dict) -> str:
    role_names = {
        "SWE": "Software Engineer",
        "DE": "Data Engineer",
        "MLE": "ML Engineer",
        "DEVOPS": "DevOps / Platform Engineer",
        "EM": "Engineering Manager",
        "FE": "Founding Engineer",
        "TL": "Tech Lead",
        "PM": "Product Manager",
        "DES": "Designer",
        "DS": "Data Scientist",
    }
    role_full = role_names.get(brief["role"], brief["role"])
    anti_patterns_str = "\n".join(f"- {ap}" for ap in brief["module_anti_patterns"])

    return f"""{spec}

---

## YOUR TASK

Generate exactly 1 challenge object as a JSON array (one element) following the schema above.

**Challenge parameters:**
- ID: {brief["id"]}
- Role: {brief["role"]} ({role_full})
- Format: {brief["format"]}
- Company type: {brief["company_type"]}
- Paradigm: {brief["paradigm"]}
- Module: {brief["module"]} — {brief["module_name"]}
- Module concept: {brief["module_concept"]}
- Module anti-patterns to embed in this challenge:
{anti_patterns_str}
- Difficulty: {brief["difficulty"]}
- Estimated minutes: {brief["estimated_minutes"]}

Write a scenario relevant to a {role_full}'s real day-to-day context. The scenario should feel like something they would actually encounter, not a generic PM case. The tension should be specific to how a {role_full} thinks about product decisions differently from a PM.

Return ONLY the JSON array. No markdown fences. No explanation.
"""


def run_claude(prompt: str, model: str, idx: int, total: int, brief_id: str) -> tuple[str, str | None]:
    """Run claude CLI with the prompt. Returns (brief_id, raw_output or None on error)."""
    try:
        result = subprocess.run(
            ["claude", "--print", "--model", model],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            print(f"  [{idx}/{total}] FAILED (exit {result.returncode}): {brief_id}", file=sys.stderr)
            return brief_id, None
        output = result.stdout.strip()
        print(f"  [{idx}/{total}] Generated: {brief_id}")
        return brief_id, output
    except subprocess.TimeoutExpired:
        print(f"  [{idx}/{total}] TIMEOUT: {brief_id}", file=sys.stderr)
        return brief_id, None
    except Exception as e:
        print(f"  [{idx}/{total}] ERROR: {brief_id}: {e}", file=sys.stderr)
        return brief_id, None


def parse_challenge_output(raw: str) -> list[dict] | None:
    """Extract JSON array from claude output."""
    # Strip markdown fences if present
    cleaned = re.sub(r"```json\s*", "", raw)
    cleaned = re.sub(r"```\s*", "", cleaned)
    cleaned = cleaned.strip()

    # Find the first [ ... ] block
    match = re.search(r"(\[.+?\])", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try parsing the whole thing
    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
        if isinstance(result, dict):
            return [result]
    except json.JSONDecodeError:
        pass

    return None


async def run_parallel(briefs: list[dict], spec: str, model: str, parallel: int) -> tuple[list[dict], list[dict]]:
    """Run generation with bounded concurrency. Returns (successes, errors)."""
    semaphore = asyncio.Semaphore(parallel)
    total = len(briefs)
    successes = []
    errors = []

    async def run_one(brief: dict, idx: int):
        async with semaphore:
            prompt = build_prompt(spec, brief)
            loop = asyncio.get_event_loop()
            brief_id, raw = await loop.run_in_executor(
                None, run_claude, prompt, model, idx, total, brief["id"]
            )

            if raw is None:
                errors.append({"brief": brief, "raw": None, "error": "generation_failed"})
                return

            challenges = parse_challenge_output(raw)
            if challenges is None:
                errors.append({"brief": brief, "raw": raw, "error": "parse_failed"})
                print(f"  PARSE ERROR for {brief_id} — saved to errors.json", file=sys.stderr)
                return

            # Normalize roles
            role_map = {
                "Data Engineer": "DE",
                "Data Scientist": "DS",
                "Founding Engineer": "FE",
                "Engineering Manager": "EM",
                "Tech Lead": "TL",
                "Machine Learning Engineer": "MLE",
                "ML Engineer": "MLE",
                "Software Engineer": "SWE",
                "Product Manager": "PM",
                "Designer": "DES",
                "DevOps": "DEVOPS",
                "Platform Engineer": "DEVOPS",
            }
            for c in challenges:
                c["roles"] = list(dict.fromkeys([
                    role_map.get(r, r) for r in c.get("roles", [])
                ]))

            successes.extend(challenges)

    tasks = [run_one(brief, i + 1) for i, brief in enumerate(briefs)]
    await asyncio.gather(*tasks)

    return successes, errors


def cmd_run(args):
    briefs_path = Path(args.briefs)
    out_path = Path(args.out)
    model = args.model
    parallel = args.parallel

    if not briefs_path.exists():
        print(f"ERROR: briefs file not found: {briefs_path}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(briefs_path.read_text())
    briefs = data.get("briefs", data) if isinstance(data, dict) else data
    total = len(briefs)
    print(f"Running {total} challenges with parallelism={parallel}, model={model}")

    spec = load_spec()
    successes, errors = asyncio.run(run_parallel(briefs, spec, model, parallel))

    # Write successes
    output = {
        "version": "1.0",
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "total": len(successes),
        "model": model,
        "source_briefs": str(briefs_path),
        "challenges": successes,
    }
    out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"\nDone: {len(successes)}/{total} succeeded -> {out_path}")

    # Write errors if any
    if errors:
        errors_path = out_path.with_stem(out_path.stem + "_errors")
        errors_path.write_text(json.dumps(errors, indent=2, ensure_ascii=False))
        print(f"{len(errors)} errors -> {errors_path}")


# ─── Subcommand: merge ────────────────────────────────────────────────────────

def cmd_merge(args):
    batch_path = Path(args.batch)
    master_path = Path(args.master)

    if not batch_path.exists():
        print(f"ERROR: batch file not found: {batch_path}", file=sys.stderr)
        sys.exit(1)

    batch_data = json.loads(batch_path.read_text())
    new_challenges = batch_data.get("challenges", batch_data) if isinstance(batch_data, dict) else batch_data

    if master_path.exists():
        master_data = json.loads(master_path.read_text())
        existing = master_data.get("challenges", [])
    else:
        master_data = {
            "version": "1.0",
            "description": "HackProduct master challenge library.",
        }
        existing = []

    # Deduplicate by ID
    existing_ids = {c["id"] for c in existing}
    added = [c for c in new_challenges if c["id"] not in existing_ids]
    skipped = [c for c in new_challenges if c["id"] in existing_ids]

    merged = existing + added
    master_data["challenges"] = merged
    master_data["total"] = len(merged)
    master_data["last_updated"] = datetime.now().strftime("%Y-%m-%d")

    master_path.write_text(json.dumps(master_data, indent=2, ensure_ascii=False))

    print(f"Merged: +{len(added)} added, {len(skipped)} skipped (duplicates)")
    print(f"Master total: {len(merged)} challenges -> {master_path}")
    if skipped:
        print(f"Skipped IDs: {[c['id'] for c in skipped]}")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="HackProduct challenge generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # briefs
    p_briefs = sub.add_parser("briefs", help="Generate challenge briefs (specs without content)")
    p_briefs.add_argument("--roles", required=True, help="Comma-separated role codes, e.g. SWE,MLE,DE")
    p_briefs.add_argument("--count", type=int, default=2, help="Challenges per role per module (default: 2)")
    p_briefs.add_argument("--modules", default="1,2,3,4,5,6,7,8", help="Comma-separated module numbers (default: all)")
    p_briefs.add_argument("--paradigms", default="TRAD,AI-ASSIST,AGENTIC,AI-NATIVE", help="Comma-separated paradigms")
    p_briefs.add_argument("--formats", default="HP-SCENARIO,INT-TRADE,INT-IMPROVE,HP-BRIEF", help="Comma-separated formats")
    p_briefs.add_argument("--out", default="briefs.json", help="Output file (default: briefs.json)")
    p_briefs.add_argument("--master", default=None, help="Master file to check existing IDs against (default: challenges_all.json)")

    # run
    p_run = sub.add_parser("run", help="Run challenge generation from briefs file")
    p_run.add_argument("--briefs", required=True, help="Briefs JSON file")
    p_run.add_argument("--out", required=True, help="Output JSON file")
    p_run.add_argument("--parallel", type=int, default=5, help="Max concurrent claude calls (default: 5)")
    p_run.add_argument("--model", default="claude-haiku-4-5-20251001", help="Claude model to use")

    # merge
    p_merge = sub.add_parser("merge", help="Merge a batch into the master challenges file")
    p_merge.add_argument("--batch", required=True, help="Batch JSON file to merge")
    p_merge.add_argument("--master", default="challenges_all.json", help="Master file (created if absent)")

    args = parser.parse_args()

    if args.command == "briefs":
        cmd_briefs(args)
    elif args.command == "run":
        cmd_run(args)
    elif args.command == "merge":
        cmd_merge(args)


if __name__ == "__main__":
    main()
