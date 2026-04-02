#!/usr/bin/env python3
"""
HackProduct Database Seeder
============================
Seeds challenges, flow_steps, step_questions, flow_options, study_plans,
plan_weeks, and plan_challenges from enriched challenge JSON.

Usage:
  # Dry-run (print what would be inserted)
  python3 seed_database.py --input challenges_enriched.json --dry-run

  # Full seed
  python3 seed_database.py --input challenges_enriched.json

  # Seed specific challenges only
  python3 seed_database.py --input challenges_enriched.json --ids HP-DEBATE-INTERNAL-TRAD-MOD5-TL-001

Env:
  SUPABASE_URL              — from CLAUDE.md / .env
  SUPABASE_SERVICE_ROLE_KEY — from CLAUDE.md / .env
"""

import argparse
import json
import os
import sys
import uuid
from pathlib import Path

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase-py not installed. Run: pip3 install supabase", file=sys.stderr)
    sys.exit(1)


# ─── Supabase connection ──────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL",
    "https://tikkhvxlclivixqqqjyb.supabase.co"
)
SUPABASE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM"
)


def get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ─── Study plan definitions ───────────────────────────────────────────────────
# Mapped to real challenge IDs from challenges_all.json (20 challenges total)
# Challenges are grouped thematically; each plan uses 3-6 challenges

CHALLENGE_IDS = {
    # TL challenges
    "tl_mod5": "HP-DEBATE-INTERNAL-TRAD-MOD5-TL-001",
    "tl_mod4": "HP-SCENARIO-REAL-AI-ASSIST-MOD4-TL-002",
    # DES challenges
    "des_mod6": "HP-SCENARIO-FICT-B2C-TRAD-MOD6-DES-001",
    "des_mod5": "INT-TRADE-REAL-AI-ASSIST-MOD5-DES-002",
    # EM challenges
    "em_mod5": "HP-BRIEF-INTERNAL-TRAD-MOD5-EM-001",
    "em_mod7": "HP-POSTMORTEM-REAL-AI-ASSIST-MOD7-EM-002",
    # DE challenges
    "de_mod3": "HP-SCENARIO-FICT-B2B-TRAD-MOD3-DE-001",
    "de_mod2": "INT-DIAG-REAL-AI-ASSIST-MOD2-DE-002",
    # DS challenges
    "ds_mod3": "INT-METRIC-REAL-TRAD-MOD3-DS-001",
    "ds_mod2": "HP-SCENARIO-FICT-B2B-AI-NATIVE-MOD2-DS-002",
    # FE challenges
    "fe_mod1": "HP-SCENARIO-FICT-B2C-TRAD-MOD1-FE-001",
    "fe_mod7": "INT-STRATEGY-FICT-B2B-AI-NATIVE-MOD7-FE-002",
    # SWE challenges
    "swe_mod2": "HP-SCENARIO-FICT-B2C-TRAD-MOD2-SWE-001",
    "swe_mod5": "INT-TRADE-REAL-AI-ASSIST-MOD5-SWE-002",
    # PM challenges
    "pm_mod4": "INT-IMPROVE-REAL-TRAD-MOD4-PM-001",
    "pm_mod1": "INT-DESIGN-FICT-B2C-AI-NATIVE-MOD1-PM-002",
    # MLE challenges
    "mle_mod5": "INT-TRADE-REAL-AI-NATIVE-MOD5-MLE-001",
    "mle_mod7": "HP-SCENARIO-FICT-B2C-AGENTIC-MOD7-MLE-002",
    # DEVOPS challenges
    "devops_mod6": "HP-BRIEF-FICT-B2B-TRAD-MOD6-DEVOPS-001",
    "devops_mod4": "INT-IMPROVE-REAL-AI-ASSIST-MOD4-DEVOPS-002",
}

STUDY_PLANS = [
    {
        "slug": "staff-engineer-path",
        "title": "Staff Engineer Path",
        "subtitle": "Product thinking for technical leaders",
        "description": "For tech leads and senior engineers stepping into product leadership. Covers trade-off decisions, stakeholder alignment, and strategy—the decisions that define your scope at staff level.",
        "move_tag": "win",
        "role_tags": ["tech_lead", "em", "swe"],
        "estimated_hours": 2.5,
        "duration_weeks": 2,
        "primary_role": "tech_lead",
        "paradigm_focus": "traditional",
        "difficulty_arc": "standard-to-advanced",
        "target_persona": "Senior engineers moving into staff roles",
        "is_published": True,
        "weeks": [
            {
                "week_number": 1,
                "title": "Trade-off Decisions",
                "narrative": "The decisions that define technical leadership: when to rebuild vs. fix, what to optimize for, and how to make a call with incomplete information.",
                "competency_focus": ["strategic_thinking", "taste"],
                "challenges": ["tl_mod5", "em_mod5", "swe_mod5"],
            },
            {
                "week_number": 2,
                "title": "Strategy and Long-term Thinking",
                "narrative": "How do technical leaders think about competitive positioning, moats, and the decisions that compound over time?",
                "competency_focus": ["strategic_thinking", "domain_expertise"],
                "challenges": ["em_mod7", "tl_mod4"],
            },
        ],
    },
    {
        "slug": "7-day-interview-prep",
        "title": "7-Day Interview Prep",
        "subtitle": "Essential product sense questions",
        "description": "The highest-signal interview questions distilled into one week. INT-format challenges that mirror real product sense rounds at top companies.",
        "move_tag": None,
        "role_tags": ["swe", "tech_lead", "pm"],
        "estimated_hours": 3.0,
        "duration_weeks": 2,
        "primary_role": "swe",
        "paradigm_focus": "traditional",
        "difficulty_arc": "warmup-to-standard",
        "target_persona": "Engineers preparing for PM interviews",
        "is_published": True,
        "weeks": [
            {
                "week_number": 1,
                "title": "Metrics and Diagnosis",
                "narrative": "Metric design and root-cause diagnosis—the two most common interview question types.",
                "competency_focus": ["strategic_thinking", "cognitive_empathy"],
                "challenges": ["ds_mod3", "de_mod2", "swe_mod2"],
            },
            {
                "week_number": 2,
                "title": "Trade-offs and Improvement",
                "narrative": "Trade-off decisions and product improvement questions—how to make a recommendation that's specific and defensible.",
                "competency_focus": ["strategic_thinking", "taste"],
                "challenges": ["swe_mod5", "des_mod5", "pm_mod4"],
            },
        ],
    },
    {
        "slug": "ai-product-fluency",
        "title": "AI Product Fluency",
        "subtitle": "Product decisions for AI-assisted and AI-native products",
        "description": "For engineers building AI features and AI-native products. How does product thinking change when your system learns, makes decisions, and degrades in surprising ways?",
        "move_tag": "optimize",
        "role_tags": ["ml_eng", "swe", "data_scientist"],
        "estimated_hours": 2.5,
        "duration_weeks": 2,
        "primary_role": "ml_eng",
        "paradigm_focus": "ai_native",
        "difficulty_arc": "standard-to-advanced",
        "target_persona": "Engineers working on AI/ML products",
        "is_published": True,
        "weeks": [
            {
                "week_number": 1,
                "title": "AI-Assisted Decision Making",
                "narrative": "When AI assists human decisions, the product questions shift: when does automation hurt, and what does trust mean in practice?",
                "competency_focus": ["strategic_thinking", "cognitive_empathy"],
                "challenges": ["tl_mod4", "de_mod2", "devops_mod4"],
            },
            {
                "week_number": 2,
                "title": "AI-Native Product Strategy",
                "narrative": "Fully AI-native products have different moats, different failure modes, and different success metrics.",
                "competency_focus": ["strategic_thinking", "domain_expertise"],
                "challenges": ["mle_mod5", "mle_mod7", "fe_mod7"],
            },
        ],
    },
    {
        "slug": "data-eng-to-product",
        "title": "Data Eng → Product",
        "subtitle": "From data pipelines to product decisions",
        "description": "For data engineers who want to influence the products their data powers. Covers metrics design, problem identification, and how to speak the same language as PMs.",
        "move_tag": "frame",
        "role_tags": ["data_eng", "data_scientist"],
        "estimated_hours": 2.0,
        "duration_weeks": 2,
        "primary_role": "data_eng",
        "paradigm_focus": "traditional",
        "difficulty_arc": "warmup-to-standard",
        "target_persona": "Data engineers moving toward product roles",
        "is_published": True,
        "weeks": [
            {
                "week_number": 1,
                "title": "Metrics That Matter",
                "narrative": "How do you design metrics that measure real user value—not just data volume or system health?",
                "competency_focus": ["strategic_thinking", "cognitive_empathy"],
                "challenges": ["ds_mod3", "de_mod3", "ds_mod2"],
            },
            {
                "week_number": 2,
                "title": "Root Cause and Diagnosis",
                "narrative": "Data engineers see anomalies before anyone else. But anomaly detection and root-cause diagnosis are different skills.",
                "competency_focus": ["strategic_thinking", "domain_expertise"],
                "challenges": ["de_mod2", "swe_mod2"],
            },
        ],
    },
    {
        "slug": "em-product-leadership",
        "title": "EM Product Leadership",
        "subtitle": "Engineering management meets product strategy",
        "description": "For engineering managers navigating the boundary between technical delivery and product direction. How do EMs make decisions that affect product outcomes?",
        "move_tag": "win",
        "role_tags": ["em", "tech_lead"],
        "estimated_hours": 2.0,
        "duration_weeks": 2,
        "primary_role": "em",
        "paradigm_focus": "traditional",
        "difficulty_arc": "standard",
        "target_persona": "Engineering managers with product ownership",
        "is_published": True,
        "weeks": [
            {
                "week_number": 1,
                "title": "Team and Prioritization Decisions",
                "narrative": "EMs face trade-off decisions that affect the whole team: when to say no to scope, when to absorb tech debt, when to push back on the PM.",
                "competency_focus": ["strategic_thinking", "taste"],
                "challenges": ["em_mod5", "tl_mod5"],
            },
            {
                "week_number": 2,
                "title": "Strategy and Velocity",
                "narrative": "The EM's version of strategy: how do technical decisions compound into competitive advantage or technical debt?",
                "competency_focus": ["strategic_thinking", "domain_expertise"],
                "challenges": ["em_mod7", "tl_mod4"],
            },
        ],
    },
    {
        "slug": "founding-engineer",
        "title": "Founding Engineer",
        "subtitle": "Product ownership at the zero-to-one stage",
        "description": "For founding engineers and early team members who wear product hats. Covers user segmentation, moat-building, and the trade-offs that define a startup's early product direction.",
        "move_tag": "frame",
        "role_tags": ["swe", "tech_lead"],
        "estimated_hours": 2.0,
        "duration_weeks": 2,
        "primary_role": "swe",
        "paradigm_focus": "ai_native",
        "difficulty_arc": "standard-to-advanced",
        "target_persona": "Founding engineers and early startup engineers",
        "is_published": True,
        "weeks": [
            {
                "week_number": 1,
                "title": "Who to Build For",
                "narrative": "The founding engineer's most consequential product decision: which users to serve first, and how to know when you've found product-market fit.",
                "competency_focus": ["cognitive_empathy", "strategic_thinking"],
                "challenges": ["fe_mod1", "pm_mod1"],
            },
            {
                "week_number": 2,
                "title": "Moat and Strategy",
                "narrative": "How do early product decisions create (or destroy) competitive defensibility?",
                "competency_focus": ["strategic_thinking", "domain_expertise"],
                "challenges": ["fe_mod7", "mle_mod7"],
            },
        ],
    },
    {
        "slug": "devops-to-product-impact",
        "title": "DevOps → Product Impact",
        "subtitle": "When reliability decisions become product decisions",
        "description": "For DevOps engineers and SREs who want to frame infrastructure decisions as product decisions. Covers reliability as a product feature, AI-assisted operations, and what engineers give up when they automate.",
        "move_tag": "optimize",
        "role_tags": ["devops"],
        "estimated_hours": 1.5,
        "duration_weeks": 1,
        "primary_role": "devops",
        "paradigm_focus": "ai_assisted",
        "difficulty_arc": "standard",
        "target_persona": "DevOps engineers and SREs",
        "is_published": True,
        "weeks": [
            {
                "week_number": 1,
                "title": "Reliability as Product",
                "narrative": "What users experience as reliability, what engineers experience as uptime—these are different things. How do you bridge them?",
                "competency_focus": ["cognitive_empathy", "strategic_thinking"],
                "challenges": ["devops_mod6", "devops_mod4", "em_mod5"],
            },
        ],
    },
]


# ─── Seeding functions ────────────────────────────────────────────────────────

def seed_challenge(supabase: Client, challenge: dict, dry_run: bool) -> bool:
    cid = challenge["id"]

    # Build the challenges row
    row = {
        "id": cid,
        "title": challenge["title"],
        "scenario_context": challenge["scenario_context"],
        "scenario_trigger": challenge["scenario_trigger"],
        "scenario_question": challenge["scenario_question"],
        "engineer_standout": challenge.get("engineer_standout"),
        "paradigm": challenge["paradigm"],
        "industry": challenge.get("industry"),
        "sub_vertical": challenge.get("sub_vertical"),
        "difficulty": challenge["difficulty"],
        "estimated_minutes": challenge["estimated_minutes"],
        "primary_competencies": challenge["primary_competencies"],
        "secondary_competencies": challenge["secondary_competencies"],
        "frameworks": challenge["frameworks"],
        "relevant_roles": challenge["relevant_roles"],
        "company_tags": challenge["company_tags"],
        "tags": challenge["tags"],
        "is_published": challenge["is_published"],
        "is_calibration": challenge["is_calibration"],
        "is_premium": challenge["is_premium"],
    }

    if dry_run:
        print(f"  [DRY] challenges: INSERT {cid}")
    else:
        supabase.table("challenges").upsert(row).execute()
        print(f"  ✓ challenges: {cid}")

    # Seed flow steps, questions, options
    flow = challenge.get("flow", {})
    for step_name, step_data in flow.items():
        step_id = str(uuid.uuid4())
        step_row = {
            "id": step_id,
            "challenge_id": cid,
            "step": step_name,
            "step_nudge": step_data.get("step_nudge"),
            "grading_weight": step_data.get("grading_weight", 0.25),
            "step_order": step_data.get("step_order", 0),
        }

        if dry_run:
            print(f"    [DRY] flow_steps: INSERT {cid}/{step_name}")
        else:
            result = supabase.table("flow_steps").upsert(step_row).execute()
            # Re-fetch the actual ID (upsert may update existing row)
            existing = supabase.table("flow_steps").select("id").eq("challenge_id", cid).eq("step", step_name).single().execute()
            step_id = existing.data["id"]

        for q in step_data.get("questions", []):
            q_id = str(uuid.uuid4())
            q_row = {
                "id": q_id,
                "flow_step_id": step_id,
                "question_text": q["question_text"],
                "question_nudge": q.get("question_nudge"),
                "response_type": q.get("response_type", "mcq_plus_elaboration"),
                "sequence": q["sequence"],
                "grading_weight_within_step": q.get("grading_weight_within_step", 0.33),
                "target_competencies": q.get("target_competencies", []),
            }

            if dry_run:
                print(f"      [DRY] step_questions: Q{q['sequence']}")
            else:
                q_result = supabase.table("step_questions").upsert(q_row).execute()
                existing_q = supabase.table("step_questions").select("id").eq("flow_step_id", step_id).eq("sequence", q["sequence"]).single().execute()
                q_id = existing_q.data["id"]

            for opt in q.get("options", []):
                opt_id = opt.get("id", f"{cid}-{step_name}-Q{q['sequence']}-{opt['option_label']}")
                opt_row = {
                    "id": opt_id,
                    "question_id": q_id,
                    "option_label": opt["option_label"],
                    "option_text": opt["option_text"],
                    "quality": opt["quality"],
                    "points": opt["points"],
                    "competencies": opt.get("competencies", []),
                    "explanation": opt.get("explanation", ""),
                }
                if dry_run:
                    print(f"        [DRY] flow_options: {opt['option_label']}")
                else:
                    supabase.table("flow_options").upsert(opt_row).execute()

    return True


def seed_study_plans(supabase: Client, available_ids: set[str], dry_run: bool):
    print(f"\n--- Seeding {len(STUDY_PLANS)} study plans ---")
    for plan_def in STUDY_PLANS:
        plan_id = str(uuid.uuid4())

        plan_row = {
            "id": plan_id,
            "slug": plan_def["slug"],
            "title": plan_def["title"],
            "description": plan_def["description"],
            "move_tag": plan_def.get("move_tag"),
            "role_tags": plan_def.get("role_tags", []),
            "estimated_hours": plan_def["estimated_hours"],
            "is_published": plan_def["is_published"],
            # v2 extended columns
            "subtitle": plan_def.get("subtitle"),
            "duration_weeks": plan_def.get("duration_weeks"),
            "primary_role": plan_def.get("primary_role"),
            "paradigm_focus": plan_def.get("paradigm_focus"),
            "difficulty_arc": plan_def.get("difficulty_arc"),
            "target_persona": plan_def.get("target_persona"),
        }

        if dry_run:
            print(f"  [DRY] study_plans: INSERT {plan_def['slug']}")
        else:
            # Upsert by slug — safe to re-run
            existing = supabase.table("study_plans").select("id").eq("slug", plan_def["slug"]).execute()
            if existing.data:
                plan_id = existing.data[0]["id"]
                supabase.table("study_plans").update(plan_row).eq("id", plan_id).execute()
                print(f"  ↑ study_plans: updated {plan_def['slug']} (id={plan_id})")
            else:
                supabase.table("study_plans").insert(plan_row).execute()
                fresh = supabase.table("study_plans").select("id").eq("slug", plan_def["slug"]).single().execute()
                plan_id = fresh.data["id"]
                print(f"  ✓ study_plans: {plan_def['slug']} (id={plan_id})")

        for week_def in plan_def.get("weeks", []):
            week_id = str(uuid.uuid4())
            week_row = {
                "id": week_id,
                "plan_id": plan_id,
                "week_number": week_def["week_number"],
                "title": week_def["title"],
                "narrative": week_def.get("narrative"),
                "competency_focus": week_def.get("competency_focus", []),
            }

            if dry_run:
                print(f"    [DRY] plan_weeks: week {week_def['week_number']}")
            else:
                supabase.table("plan_weeks").upsert(week_row).execute()

            for seq, challenge_key in enumerate(week_def.get("challenges", []), start=1):
                challenge_id = CHALLENGE_IDS.get(challenge_key)
                if not challenge_id:
                    print(f"    WARNING: unknown challenge key '{challenge_key}'", file=sys.stderr)
                    continue
                if challenge_id not in available_ids:
                    print(f"    WARNING: challenge {challenge_id} not in enriched data, skipping", file=sys.stderr)
                    continue

                plan_challenge_row = {
                    "plan_id": plan_id,
                    "week_number": week_def["week_number"],
                    "sequence_in_week": seq,
                    "challenge_id": challenge_id,
                }
                if dry_run:
                    print(f"      [DRY] plan_challenges: week {week_def['week_number']}, seq {seq} → {challenge_id}")
                else:
                    supabase.table("plan_challenges").upsert(plan_challenge_row).execute()

    if not dry_run:
        print(f"\n✓ Study plans seeded")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed HackProduct challenges and study plans into Supabase")
    parser.add_argument("--input", required=True, help="challenges_enriched.json path")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be inserted without executing")
    parser.add_argument("--ids", default=None, help="Comma-separated challenge IDs to seed (default: all)")
    parser.add_argument("--skip-plans", action="store_true", help="Skip study plan seeding")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"ERROR: {input_path} not found", file=sys.stderr)
        sys.exit(1)

    challenges = json.loads(input_path.read_text())
    if args.ids:
        target_ids = set(i.strip() for i in args.ids.split(","))
        challenges = [c for c in challenges if c["id"] in target_ids]
        print(f"Filtering to {len(challenges)} challenge(s): {', '.join(c['id'] for c in challenges)}")

    available_ids = {c["id"] for c in challenges}

    supabase = None if args.dry_run else get_client()

    print(f"\n--- Seeding {len(challenges)} challenges {'(DRY RUN)' if args.dry_run else ''} ---")
    successes, failures = 0, []
    for i, challenge in enumerate(challenges, start=1):
        print(f"\n[{i}/{len(challenges)}] {challenge['id']}")
        try:
            seed_challenge(supabase, challenge, args.dry_run)
            successes += 1
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            failures.append(challenge["id"])

    print(f"\n{'─'*50}")
    print(f"Challenges: {successes} seeded, {len(failures)} failed")
    if failures:
        print(f"Failed: {', '.join(failures)}")

    if not args.skip_plans:
        try:
            seed_study_plans(supabase, available_ids, args.dry_run)
        except Exception as e:
            print(f"ERROR seeding study plans: {e}", file=sys.stderr)

    if not args.dry_run and not failures:
        print(f"\n✓ All done. Visit /challenges and /prep/study-plans to verify.")


if __name__ == "__main__":
    main()
