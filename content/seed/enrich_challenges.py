#!/usr/bin/env python3
"""
HackProduct Challenge Enricher
==============================
Takes challenges_all.json and produces challenges_enriched.json by:
1. Splitting scenario.body into scenario_context / scenario_trigger / scenario_question
2. Generating 4 MCQ options (A-D) for each of the 12 FLOW questions
3. Mapping content JSON fields to DB schema fields

Uses claude CLI (claude --print) — no separate API key needed.

Usage:
  python3 enrich_challenges.py --out challenges_enriched.json
  python3 enrich_challenges.py --limit 2 --out test_enriched.json
"""

import argparse
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

CONTENT_DIR = Path(__file__).parent.parent
CHALLENGES_FILE = CONTENT_DIR / "challenges_all.json"
MODEL = "claude-haiku-4-5-20251001"

# ─── Field mappings ──────────────────────────────────────────────────────────

PARADIGM_MAP = {
    "TRAD": "traditional",
    "AI-ASSIST": "ai_assisted",
    "AGENTIC": "agentic",
    "AI-NATIVE": "ai_native",
}

DIFFICULTY_MAP = {
    "Beginner": "warmup",
    "Intermediate": "standard",
    "Advanced": "advanced",
    "Expert": "staff_plus",
}

ROLE_MAP = {
    "TL": "tech_lead",
    "EM": "em",
    "FE": "swe",
    "SWE": "swe",
    "DE": "data_eng",
    "DS": "data_scientist",
    "MLE": "ml_eng",
    "DEVOPS": "devops",
    "PM": "pm",
    "DES": "designer",
}

STEP_ORDER = {"frame": 0, "list": 1, "optimize": 2, "win": 3}

COMPETENCIES = [
    "motivation_theory",
    "cognitive_empathy",
    "taste",
    "strategic_thinking",
    "creative_execution",
    "domain_expertise",
]

STEP_COMPETENCY_HINTS = {
    "frame": ["cognitive_empathy", "strategic_thinking"],
    "list": ["cognitive_empathy", "creative_execution"],
    "optimize": ["strategic_thinking", "taste"],
    "win": ["strategic_thinking", "domain_expertise"],
}

# ─── Prompts ─────────────────────────────────────────────────────────────────

SCENARIO_SPLIT_PROMPT = """You are structuring a product thinking challenge for a database.

The challenge scenario is a single block of text. Split it into three fields:
- scenario_context: the background situation (who, what company, what the general problem is). Usually 2-4 sentences.
- scenario_trigger: the specific event, decision, or friction that forces action right now. Usually 1-2 sentences.
- scenario_question: the specific question or decision that must be answered. Usually 1 sentence, often ends with a period or implies a question.

Scenario body:
{scenario_body}

Return ONLY valid JSON, no markdown:
{{"scenario_context": "...", "scenario_trigger": "...", "scenario_question": "..."}}"""


OPTION_GENERATION_PROMPT = """You are generating multiple choice options for a product thinking challenge.

FLOW Step: {step}
FLOW step description:
- frame: distinguishing symptom from root cause, why-before-how, scoping the real problem
- list: expanding stakeholder map, generating structurally distinct options, second-order effects
- optimize: naming the optimization criterion, articulating the sacrifice, metric + guardrail
- win: making a specific defensible falsifiable call, naming a test + threshold + timeline

Challenge: {challenge_title}
Scenario: {scenario_body}

Question (Q{seq}): {question_text}

Generate exactly 4 MCQ options for this question.

Option quality levels:
- A (best, 3 points): Demonstrates the core reasoning move for {step}. Specific, shows the right mental model.
- B (good_but_incomplete, 2 points): Right direction but missing one key element. Partially applies the reasoning move.
- C (surface, 1 point): Addresses the visible symptom only, not the underlying issue. A junior answer.
- D (plausible_wrong, 0 points): Sounds reasonable but actually contradicts the right reasoning or optimizes for the wrong thing.

Available competencies: motivation_theory, cognitive_empathy, taste, strategic_thinking, creative_execution, domain_expertise

Return ONLY valid JSON, no markdown:
{{
  "options": [
    {{
      "option_label": "A",
      "option_text": "...",
      "quality": "best",
      "points": 3,
      "competencies": ["strategic_thinking"],
      "explanation": "..."
    }},
    {{
      "option_label": "B",
      "option_text": "...",
      "quality": "good_but_incomplete",
      "points": 2,
      "competencies": ["cognitive_empathy"],
      "explanation": "..."
    }},
    {{
      "option_label": "C",
      "option_text": "...",
      "quality": "surface",
      "points": 1,
      "competencies": [],
      "explanation": "..."
    }},
    {{
      "option_label": "D",
      "option_text": "...",
      "quality": "plausible_wrong",
      "points": 0,
      "competencies": [],
      "explanation": "..."
    }}
  ]
}}"""


# ─── Claude caller ────────────────────────────────────────────────────────────

def call_claude(prompt: str, label: str) -> str | None:
    try:
        result = subprocess.run(
            ["claude", "--print", "--model", MODEL],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            print(f"  FAILED ({label}): exit {result.returncode}", file=sys.stderr)
            return None
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT ({label})", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  ERROR ({label}): {e}", file=sys.stderr)
        return None


def parse_json(raw: str, label: str) -> dict | None:
    if not raw:
        return None
    cleaned = re.sub(r"```json\s*", "", raw)
    cleaned = re.sub(r"```\s*", "", cleaned)
    cleaned = cleaned.strip()
    try:
        obj = json.loads(cleaned)
        return obj
    except json.JSONDecodeError:
        # Try to find a JSON object in the output
        match = re.search(r"(\{.+\})", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        print(f"  JSON parse failed ({label})", file=sys.stderr)
        return None


# ─── Core enrichment ─────────────────────────────────────────────────────────

def enrich_challenge(challenge: dict) -> dict | None:
    cid = challenge["id"]
    print(f"\n[{cid}]")

    # 1. Split scenario body
    scenario_body = challenge["scenario"]["body"]
    print(f"  Splitting scenario...")
    raw = call_claude(
        SCENARIO_SPLIT_PROMPT.format(scenario_body=scenario_body),
        f"{cid}/scenario-split"
    )
    split = parse_json(raw, f"{cid}/scenario-split")
    if not split:
        print(f"  ERROR: Could not split scenario for {cid}", file=sys.stderr)
        return None

    scenario_context = split.get("scenario_context", scenario_body[:300])
    scenario_trigger = split.get("scenario_trigger", "")
    scenario_question = split.get("scenario_question", "")

    # 2. Build flow steps with enriched questions
    enriched_flow = {}
    for step in ["frame", "list", "optimize", "win"]:
        step_data = challenge["flow"][step]
        questions_raw = step_data["questions"]
        enriched_questions = []

        for seq, q_text in enumerate(questions_raw, start=1):
            print(f"  Generating MCQ options for {step}/Q{seq}...")
            raw = call_claude(
                OPTION_GENERATION_PROMPT.format(
                    step=step,
                    challenge_title=challenge["title"],
                    scenario_body=scenario_body,
                    seq=seq,
                    question_text=q_text,
                ),
                f"{cid}/{step}/Q{seq}"
            )
            options_data = parse_json(raw, f"{cid}/{step}/Q{seq}")
            if not options_data or "options" not in options_data:
                print(f"  WARNING: Using fallback options for {cid}/{step}/Q{seq}", file=sys.stderr)
                options = _fallback_options(cid, step, seq)
            else:
                options = options_data["options"]
                # Ensure option IDs are set
                for opt in options:
                    opt["id"] = f"{cid}-{step}-Q{seq}-{opt['option_label']}"

            enriched_questions.append({
                "question_text": q_text,
                "response_type": "mcq_plus_elaboration",
                "sequence": seq,
                "grading_weight_within_step": round(1.0 / len(questions_raw), 2),
                "target_competencies": STEP_COMPETENCY_HINTS.get(step, []),
                "options": options,
            })

        enriched_flow[step] = {
            "step_nudge": step_data.get("concept", ""),
            "step_order": STEP_ORDER[step],
            "grading_weight": 0.25,
            "questions": enriched_questions,
        }

    # 3. Map to DB schema fields
    roles_raw = challenge.get("roles", [])
    relevant_roles = [ROLE_MAP.get(r, r.lower()) for r in roles_raw]

    tags = []
    tags.append(challenge.get("format", ""))
    tags.append(f"mod-{challenge.get('module', '')}")
    tags = [t for t in tags if t]

    return {
        "id": cid,
        "title": challenge["title"],
        "scenario_context": scenario_context,
        "scenario_trigger": scenario_trigger,
        "scenario_question": scenario_question,
        "engineer_standout": challenge.get("luma_coaching_hint", ""),
        "paradigm": PARADIGM_MAP.get(challenge.get("paradigm", ""), "traditional"),
        "industry": _infer_industry(challenge),
        "sub_vertical": None,
        "difficulty": DIFFICULTY_MAP.get(challenge.get("difficulty", "Intermediate"), "standard"),
        "estimated_minutes": challenge.get("estimated_minutes", 15),
        "primary_competencies": STEP_COMPETENCY_HINTS.get("frame", []),
        "secondary_competencies": STEP_COMPETENCY_HINTS.get("win", []),
        "frameworks": [],
        "relevant_roles": relevant_roles,
        "company_tags": [challenge.get("company_type", "")],
        "tags": tags,
        "is_published": True,
        "is_calibration": False,
        "is_premium": False,
        "flow": enriched_flow,
    }


def _infer_industry(challenge: dict) -> str:
    cid = challenge["id"]
    company_type = challenge.get("company_type", "")
    if company_type == "REAL":
        return "tech"
    if "B2C" in company_type:
        return "consumer"
    if "B2B" in company_type:
        return "enterprise"
    return "tech"


def _fallback_options(cid: str, step: str, seq: int) -> list[dict]:
    """Minimal fallback options if Haiku fails."""
    labels = [
        ("A", "best", 3, ["strategic_thinking"], "Demonstrates the correct reasoning move for this step."),
        ("B", "good_but_incomplete", 2, ["cognitive_empathy"], "Right direction but incomplete."),
        ("C", "surface", 1, [], "Addresses surface symptom only."),
        ("D", "plausible_wrong", 0, [], "Sounds reasonable but is wrong."),
    ]
    return [
        {
            "id": f"{cid}-{step}-Q{seq}-{label}",
            "option_label": label,
            "option_text": f"[Option {label} — needs content]",
            "quality": quality,
            "points": pts,
            "competencies": comps,
            "explanation": explanation,
        }
        for label, quality, pts, comps, explanation in labels
    ]


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Enrich HackProduct challenges with MCQ options")
    parser.add_argument("--input", default=str(CHALLENGES_FILE), help="challenges_all.json path")
    parser.add_argument("--out", required=True, help="output file path")
    parser.add_argument("--limit", type=int, default=None, help="limit to N challenges (for testing)")
    args = parser.parse_args()

    input_path = Path(args.input)
    out_path = Path(args.out)

    if not input_path.exists():
        print(f"ERROR: {input_path} not found", file=sys.stderr)
        sys.exit(1)

    data = json.loads(input_path.read_text())
    challenges = data["challenges"]
    if args.limit:
        challenges = challenges[: args.limit]

    print(f"Enriching {len(challenges)} challenges...")
    enriched = []
    errors = []

    for i, challenge in enumerate(challenges, start=1):
        print(f"\n--- [{i}/{len(challenges)}] {challenge['id']} ---")
        result = enrich_challenge(challenge)
        if result:
            enriched.append(result)
        else:
            errors.append(challenge["id"])

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(enriched, indent=2))
    print(f"\n✓ Wrote {len(enriched)} enriched challenges to {out_path}")

    if errors:
        print(f"\nWARNING: {len(errors)} challenges failed enrichment:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
