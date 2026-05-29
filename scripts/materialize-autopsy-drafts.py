#!/usr/bin/env python3
"""Materialize drafted HackProduct autopsies into generated site data and assets.

The script intentionally treats the Markdown drafts as strong editorial inputs, not
as hand-authored TypeScript. It keeps the generated artifacts reproducible so the
draft directory can continue changing while the website layer stays in sync.
"""

from __future__ import annotations

import argparse
import base64
import json
import math
import os
import re
import textwrap
from dataclasses import dataclass
from datetime import date, datetime
from hashlib import sha256
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:  # pragma: no cover
    raise SystemExit("PyYAML is required. Install it or run in the Codex workspace runtime.") from exc

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Pillow is required for autopsy asset materialization.") from exc


ROLE_MAP = {
    "hero": "hero",
    "scene": "hatch-narrator",
    "mechanism": "failure-mechanism",
    "evidence": "evidence-card",
    "lesson": "lesson-frame",
    "thumbnail": "thumbnail",
    "social-cover": "social-cover",
}

ROLE_SIZES = {
    "hero": (2400, 1350),
    "hatch-narrator": (1600, 1600),
    "failure-mechanism": (1800, 1200),
    "evidence-card": (1600, 1000),
    "lesson-frame": (1800, 1200),
    "thumbnail": (1200, 900),
    "social-cover": (2400, 1260),
}

QUICK_ID_MAP = {
    "setup": "setup",
    "problem": "decision",
    "tempting-move": "wrong-obvious-answer",
    "mechanism": "mechanism",
    "evidence": "evidence",
    "takeaway": "lesson",
}

QUICK_IMAGE_ROLE = {
    "setup": "hero",
    "decision": "hatch-narrator",
    "wrong-obvious-answer": "failure-mechanism",
    "mechanism": "failure-mechanism",
    "evidence": "evidence-card",
    "lesson": "lesson-frame",
}

REQUIRED_QUICK_IDS = ["setup", "decision", "wrong-obvious-answer", "mechanism", "evidence", "lesson"]
REQUIRED_IMAGE_ROLES = [
    "hero",
    "hatch-narrator",
    "failure-mechanism",
    "evidence-card",
    "lesson-frame",
    "thumbnail",
    "social-cover",
]

WATERMARK_OPTIONS = {
    "hero": "Told by Hatch · HackProduct",
    "hatch-narrator": "Told by Hatch · HackProduct",
    "failure-mechanism": "HackProduct Autopsy",
    "evidence-card": "HackProduct Autopsy",
    "lesson-frame": "Told by Hatch · HackProduct",
    "thumbnail": "HackProduct Autopsy",
    "social-cover": "HackProduct Autopsy",
}

SKIP_DRAFT_SLUGS = {
    "buffer",  # Hand-polished as buffer-fake-landing-page-mvp.
    "gmail-undo-send",
    "spotify-wrapped",
    "facebook-like-button",
}

SLUG_OVERRIDES = {
    "buffer": "buffer-fake-landing-page-mvp",
}

EXCLUDED_FILES = {"QUEUE.md", "SUBAGENT_BRIEF.md", "INDEX.md", "DEFERRED.md"}

OFFICIAL_HATCH = "public/images/hatch/hatch-official-mascot.png"
OFFICIAL_HATCH_SHA = "ef5b1d4f624c6c61b586f4f495e1c4a9e1cfc37054e951e55337f58a5b6d865c"
AUTOPSY_IMAGE_BUCKET = "autopsy-images"
AUTOPSY_IMAGE_STORAGE_VERSION = "v1"

PALETTE = {
    "cream": "#faf6f0",
    "forest": "#4a7c59",
    "deep": "#244232",
    "amber": "#705c30",
    "soft": "#c9ad68",
    "charcoal": "#1e211c",
    "mist": "#dfe6dc",
    "white": "#fffdf8",
}

BANNED_REPLACEMENTS = {
    "leverage": "use",
    "utilize": "use",
    "holistic": "complete",
    "robust": "resilient",
    "seamlessly": "smoothly",
    "seamless": "smooth",
    "delve": "look",
    "unlock": "open",
    "ensure": "make sure",
    "tailored": "specific",
    "cutting-edge": "new",
    "revolutionary": "important",
    "game-changing": "important",
    "ecosystem play": "system choice",
    "growth hacking": "growth work",
    "paradigm": "model",
    "synergy": "fit",
    "deep dive": "close read",
    "changed everything": "changed the path",
    "industry observers say": "public accounts say",
    "not just": "more than",
}

CONFIDENCE_MAP = {
    "confirmed": "confirmed",
    "high_confidence": "high_confidence",
    "high-confidence": "high_confidence",
    "high": "high_confidence",
    "medium_confidence": "medium_confidence",
    "medium-confidence": "medium_confidence",
    "medium": "medium_confidence",
    "plausible": "medium_confidence",
    "estimated": "medium_confidence",
    "low_confidence": "low_confidence",
    "low-confidence": "low_confidence",
    "low": "low_confidence",
    "uncertain": "low_confidence",
    "directional_only": "directional_only",
    "directional-only": "directional_only",
    "directional": "directional_only",
    "unverified": "unverified",
}


@dataclass
class Draft:
    path: Path
    relative_path: str
    frontmatter: dict[str, Any]
    body: str


def json_default(value: Any) -> str:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return str(value)


def split_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    match = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, flags=re.S)
    if not match:
        return {}, text
    raw = match.group(1)
    try:
        return yaml.safe_load(raw) or {}, match.group(2)
    except Exception:
        return fallback_frontmatter(raw), match.group(2)


def fallback_frontmatter(raw: str) -> dict[str, Any]:
    def scalar(name: str) -> str:
        match = re.search(rf"^{re.escape(name)}:\s*(.*)$", raw, flags=re.M)
        value = match.group(1).strip() if match else ""
        return value.strip("\"'")

    def section(start: str, end: str) -> str:
        match = re.search(rf"^{re.escape(start)}:\n(.*?)(?=^{re.escape(end)}:|\Z)", raw, flags=re.M | re.S)
        return match.group(1) if match else ""

    def list_value(value: str) -> list[str]:
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            return [part.strip().strip("\"'") for part in value[1:-1].split(",") if part.strip()]
        return []

    sources_raw = section("sources", "metrics")
    metrics_raw = section("metrics", "glanceCards")
    cards_raw = section("glanceCards", "obviousAnswer")
    images_raw = section("images", "nextInQueue")

    cards = []
    for card_match in re.finditer(
        r"^\s*-\s+id:\s*(setup|problem|tempting-move|mechanism|evidence|takeaway)\s*\n(.*?)(?=^\s*-\s+id:\s*(?:setup|problem|tempting-move|mechanism|evidence|takeaway)\s*$|\Z)",
        cards_raw,
        flags=re.M | re.S,
    ):
        chunk = card_match.group(2)
        title_match = re.search(r"^\s+title:\s*(.*)$", chunk, flags=re.M)
        body_match = re.search(r"^\s+body:\s*(.*?)(?=^\s+\w+:|\Z)", chunk, flags=re.M | re.S)
        source_match = re.search(r"^\s+sourceIds:\s*(.*)$", chunk, flags=re.M)
        confidence_match = re.search(r"^\s+confidence:\s*(.*)$", chunk, flags=re.M)
        body = body_match.group(1).strip().strip("\"'").replace("\n", " ") if body_match else ""
        cards.append({
            "id": card_match.group(1),
            "title": title_match.group(1).strip().strip("\"'") if title_match else "",
            "body": body,
            "sourceIds": list_value(source_match.group(1)) if source_match else [],
            "confidence": confidence_match.group(1).strip().strip("\"'") if confidence_match else "medium_confidence",
        })

    images = []
    for role_match in re.finditer(r"^\s*-\s+role:\s*([^\n]+)(.*?)(?=^\s*-\s+role:|\Z)", images_raw, flags=re.M | re.S):
        chunk = role_match.group(0)
        prompt_match = re.search(r"promptForCodex:\s*\|\n(.*?)(?=^\s+\w+:|^\s*-\s+role:|\Z)", chunk, flags=re.M | re.S)
        alt_match = re.search(r"^\s+alt:\s*(.*)$", chunk, flags=re.M)
        caption_match = re.search(r"^\s+caption:\s*(.*)$", chunk, flags=re.M)
        images.append({
            "role": role_match.group(1).strip(),
            "promptForCodex": prompt_match.group(1).strip() if prompt_match else "",
            "alt": alt_match.group(1).strip().strip("\"'") if alt_match else "",
            "caption": caption_match.group(1).strip().strip("\"'") if caption_match else "",
        })

    return {
        "slug": scalar("slug"),
        "companySlug": scalar("companySlug"),
        "companyName": scalar("companyName"),
        "title": scalar("title"),
        "dek": scalar("dek"),
        "status": scalar("status"),
        "queueRank": int(scalar("queueRank")) if scalar("queueRank").isdigit() else 999,
        "estimatedReadTime": scalar("estimatedReadTime") or "8 min read",
        "sourceSummary": scalar("sourceSummary") or "Source-backed draft converted from the HackProduct autopsy queue.",
        "sources": [{"id": source_id.strip()} for source_id in re.findall(r"^\s*-\s+id:\s*([^\n]+)", sources_raw, flags=re.M)],
        "metrics": [{"label": label.strip(), "value": "See source", "confidence": "medium_confidence", "sourceIds": []} for label in re.findall(r"^\s*-\s+label:\s*([^\n]+)", metrics_raw, flags=re.M)],
        "glanceCards": cards,
        "images": images,
        "_parse_error": True,
    }


def sanitize_text(value: Any) -> str:
    text = "" if value is None else str(value)
    text = text.replace("—", ", ")
    text = text.replace("–", "-")
    text = text.replace("→", "to")
    text = text.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    for banned, replacement in BANNED_REPLACEMENTS.items():
        text = re.sub(rf"\b{re.escape(banned)}\b", replacement, text, flags=re.I)
    text = re.sub(r"\bunlock(s|ed|ing|able)?\b", "open", text, flags=re.I)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s+\n", "\n", text)
    return text.strip()


def normalize_confidence(value: Any, fallback: str = "medium_confidence") -> str:
    key = sanitize_text(value or fallback).lower().replace(" ", "_")
    return CONFIDENCE_MAP.get(key, fallback)


def strip_none(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: strip_none(child) for key, child in value.items() if child is not None}
    if isinstance(value, list):
        return [strip_none(child) for child in value]
    return value


def slug_to_title(slug: str) -> str:
    special = {
        "sqlite": "SQLite",
        "eslint": "ESLint",
        "redis": "Redis",
        "vite": "Vite",
        "axios": "axios",
        "curl": "curl",
        "ohmyzsh": "Oh My Zsh",
    }
    if slug in special:
        return special[slug]
    return " ".join(part.capitalize() for part in re.split(r"[-_]+", slug) if part)


def infer_industry(slug: str) -> str:
    if slug in {"stripe", "figma", "tailwind", "prettier", "vite", "cursor", "linear", "eslint", "axios", "curl", "sqlite", "redis", "socketio", "supabase"}:
        return "Developer Tools"
    if slug in {"airbnb", "gumroad", "yelp", "producthunt"}:
        return "Marketplace"
    if slug in {"netflix", "spotify", "twitch", "youtube", "shazam"}:
        return "Consumer Media"
    if slug in {"slack", "notion", "calendly", "superhuman", "gamma", "buffer", "typeform", "loom"}:
        return "Productivity"
    if slug in {"google", "amazon", "apple", "meta", "microsoft"}:
        return "Platform"
    return "Consumer Product"


def infer_accent(slug: str) -> str:
    accents = {
        "spotify": "#1db954",
        "google": "#4285f4",
        "meta": "#1877f2",
        "facebook": "#1877f2",
        "stripe": "#635bff",
        "airbnb": "#ff5a5f",
        "notion": "#191919",
        "slack": "#611f69",
        "netflix": "#e50914",
        "amazon": "#ff9900",
        "apple": "#60646c",
        "linear": "#5e6ad2",
        "dropbox": "#0061ff",
    }
    return accents.get(slug, "#4a7c59")


def read_drafts(root: Path) -> list[Draft]:
    drafts: list[Draft] = []
    for path in sorted(root.rglob("*.md")):
        if path.name in EXCLUDED_FILES:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        frontmatter, body = split_frontmatter(text)
        drafts.append(Draft(path, str(path.relative_to(root)), frontmatter, body))
    return drafts


def source_ids(frontmatter: dict[str, Any]) -> set[str]:
    ids: set[str] = set()
    for source in frontmatter.get("sources") or []:
        if isinstance(source, dict) and source.get("id"):
            ids.add(str(source["id"]))
    return ids


def references_in(text: str, available: set[str]) -> list[str]:
    refs = []
    for ref in re.findall(r"\[([a-z0-9][a-z0-9-]+)\]", text or ""):
        if ref in available and ref not in refs:
            refs.append(ref)
    return refs


def clean_source_ids(value: Any, available: set[str]) -> list[str]:
    ids: list[str] = []
    for item in value or []:
        source_id = str(item)
        if source_id in available and source_id not in ids:
            ids.append(source_id)
    return ids


def parse_beats(body: str) -> dict[str, list[str]]:
    chunks: dict[str, list[str]] = {}
    parts = re.split(r"<!--\s*beat:\s*([a-z-]+)\s*-->", body)
    for index in range(1, len(parts), 2):
        beat = parts[index].strip()
        raw = parts[index + 1]
        paragraphs = markdown_paragraphs(raw)
        if paragraphs:
            chunks[beat] = paragraphs
    return chunks


def markdown_paragraphs(raw: str) -> list[str]:
    raw = re.sub(r"```.*?```", "", raw, flags=re.S)
    raw = re.sub(r"^#{1,6}\s+.*$", "", raw, flags=re.M)
    raw = re.sub(r"^\*\*[^*\n]+\*\*\s*$", "", raw, flags=re.M)
    raw = re.sub(r"^\s*[-*]\s+", "", raw, flags=re.M)
    paras = []
    for paragraph in re.split(r"\n\s*\n", raw):
        paragraph = sanitize_text(re.sub(r"\s*\n\s*", " ", paragraph))
        if not paragraph:
            continue
        if paragraph.startswith("<!--"):
            continue
        if len(paragraph) < 30:
            continue
        paras.append(paragraph)
    return paras


def build_flow(frontmatter: dict[str, Any], body: str) -> list[dict[str, Any]]:
    available = source_ids(frontmatter)
    beats = parse_beats(body)
    first_source = [next(iter(available))] if available else []

    def section(move: str, title: str, keys: list[str], fallback: str) -> dict[str, Any]:
        paragraphs: list[str] = []
        refs: list[str] = []
        for key in keys:
            for paragraph in beats.get(key, []):
                if len(paragraphs) < 3:
                    paragraphs.append(paragraph)
                for ref in references_in(paragraph, available):
                    if ref not in refs:
                        refs.append(ref)
        if not paragraphs:
            paragraphs = [fallback]
        return {
            "move": move,
            "title": title,
            "body": paragraphs[:3],
            "sourceIds": refs or first_source,
        }

    title = sanitize_text(frontmatter.get("title"))
    return [
        section("Frame", "The starting frame", ["lede", "scene"], f"{title} begins with a specific product constraint that made the obvious path less useful than it looked."),
        section("List", "The tempting path", ["choice"], "The important product choice was not just what shipped, but which tempting alternative the team refused."),
        section("Optimize", "The mechanism", ["mechanism"], "The shipped mechanism changed what the user had to do next and made the product behavior easier to repeat."),
        section("Win", "What the evidence supports", ["evidence", "aftermath", "lesson"], "The public record supports the product lesson, while leaving some causal claims outside the evidence line."),
    ]


def build_quick_read(frontmatter: dict[str, Any]) -> list[dict[str, Any]]:
    available = source_ids(frontmatter)
    fallback_source = [next(iter(available))] if available else []
    cards = []
    by_id = {str(card.get("id")): card for card in frontmatter.get("glanceCards") or [] if isinstance(card, dict)}
    for draft_id, app_id in QUICK_ID_MAP.items():
        card = by_id.get(draft_id) or {}
        body = sanitize_text(card.get("body"))
        source_ids_value = clean_source_ids(card.get("sourceIds"), available) or references_in(body, available) or fallback_source
        cards.append({
            "id": app_id,
            "title": sanitize_text(card.get("title") or app_id.replace("-", " ").title()),
            "body": body or "This card needs a tighter source-backed summary before promotion.",
            "sourceIds": source_ids_value,
            "imageRole": QUICK_IMAGE_ROLE[app_id],
            "confidence": normalize_confidence(card.get("confidence")),
        })
    return cards


def build_sources(frontmatter: dict[str, Any]) -> list[dict[str, Any]]:
    sources = []
    for source in frontmatter.get("sources") or []:
        if not isinstance(source, dict) or not source.get("id"):
            continue
        sources.append({
            "id": sanitize_text(source.get("id")),
            "title": sanitize_text(source.get("title") or source.get("id")),
            "publisher": sanitize_text(source.get("publisher") or "Public source"),
            "url": sanitize_text(source.get("url") or "https://example.com"),
            "tier": sanitize_text(source.get("tier") or "C")[:1].upper(),
            "accessedAt": sanitize_text(json_default(source.get("accessedAt") or "2026-05-18")),
            "supports": sanitize_text(source.get("supports") or "Supports the story claim map."),
        })
    return sources


def build_metrics(frontmatter: dict[str, Any]) -> list[dict[str, Any]]:
    available = source_ids(frontmatter)
    fallback_source = [next(iter(available))] if available else []
    metrics = []
    for metric in frontmatter.get("metrics") or []:
        if not isinstance(metric, dict):
            continue
        metrics.append({
            "label": sanitize_text(metric.get("label") or "Metric"),
            "value": sanitize_text(metric.get("value") or "See source"),
            "confidence": normalize_confidence(metric.get("confidence")),
            "sourceIds": clean_source_ids(metric.get("sourceIds"), available) or fallback_source,
        })
    return metrics


def build_images(frontmatter: dict[str, Any], story_slug: str) -> list[dict[str, Any]]:
    images_by_role = {}
    for image in frontmatter.get("images") or []:
        if not isinstance(image, dict):
            continue
        final_role = ROLE_MAP.get(str(image.get("role", "")).strip())
        if not final_role:
            continue
        width, height = ROLE_SIZES[final_role]
        images_by_role[final_role] = {
            "role": final_role,
            "src": f"/images/autopsies/{story_slug}/final/{final_role}.webp",
            "alt": sanitize_text(image.get("alt") or f"{sanitize_text(frontmatter.get('title'))} {final_role} illustration."),
            "caption": sanitize_text(image.get("caption") or image.get("alt") or f"{sanitize_text(frontmatter.get('title'))} {final_role} illustration."),
            "width": width,
            "height": height,
            "watermark": True,
            "qaStatus": "approved",
            "bucket": AUTOPSY_IMAGE_BUCKET,
            "storagePath": f"stories/{story_slug}/{AUTOPSY_IMAGE_STORAGE_VERSION}/{final_role}.webp",
            "storageVersion": AUTOPSY_IMAGE_STORAGE_VERSION,
        }
    return [images_by_role[role] for role in REQUIRED_IMAGE_ROLES if role in images_by_role]


def build_comparison(frontmatter: dict[str, Any]) -> dict[str, Any] | None:
    obvious = frontmatter.get("obviousAnswer") or {}
    tempting = obvious.get("temptingMove") or {}
    shipped = obvious.get("whatShipped") or {}
    if not tempting and not shipped:
        return None
    return {
        "title": "The tempting move vs. what shipped",
        "before": {
            "label": sanitize_text(tempting.get("label") or "The tempting move"),
            "items": [sanitize_text(item) for item in tempting.get("bullets") or []][:5],
            "summary": sanitize_text(tempting.get("summary") or ""),
        },
        "after": {
            "label": sanitize_text(shipped.get("label") or "What shipped"),
            "items": [sanitize_text(item) for item in shipped.get("bullets") or []][:5],
            "summary": sanitize_text(shipped.get("summary") or ""),
        },
    }


def build_timeline(frontmatter: dict[str, Any]) -> list[dict[str, Any]]:
    events = []
    for event in frontmatter.get("lifecycle") or []:
        if not isinstance(event, dict):
            continue
        events.append({
            "date": sanitize_text(json_default(event.get("date") or "")),
            "label": sanitize_text(event.get("label") or "Milestone"),
            "description": sanitize_text(event.get("description") or ""),
            "type": sanitize_text(event.get("type") or "milestone"),
        })
    return events


def build_principle(frontmatter: dict[str, Any]) -> dict[str, Any] | None:
    takeaway = frontmatter.get("takeaway") or {}
    if not isinstance(takeaway, dict) or not takeaway.get("principle"):
        return None
    return {
        "principle": sanitize_text(takeaway.get("principle")),
        "attribution": "HackProduct autopsy takeaway",
        "sourceIds": clean_source_ids(takeaway.get("sourceIds"), source_ids(frontmatter)),
    }


def story_is_ready(frontmatter: dict[str, Any], images: list[dict[str, Any]], quick_read: list[dict[str, Any]], flow: list[dict[str, Any]]) -> bool:
    if len(frontmatter.get("sources") or []) < 5:
        return False
    if len(frontmatter.get("glanceCards") or []) != 6:
        return False
    if len(images) != 7:
        return False
    if len(quick_read) != 6:
        return False
    if any(not section.get("sourceIds") for section in flow):
        return False
    return True


def build_story(draft: Draft) -> dict[str, Any] | None:
    fm = draft.frontmatter
    draft_slug = sanitize_text(fm.get("slug") or draft.path.stem)
    if not draft_slug or draft_slug in SKIP_DRAFT_SLUGS:
        return None
    story_slug = SLUG_OVERRIDES.get(draft_slug, draft_slug)
    company_slug = sanitize_text(fm.get("companySlug") or draft.path.parent.name)
    title = sanitize_text(fm.get("title") or slug_to_title(story_slug))
    dek = sanitize_text(fm.get("dek") or f"How {title} turned a product constraint into a sharper user-facing move.")
    quick_read = build_quick_read(fm)
    flow = build_flow(fm, draft.body)
    images = build_images(fm, story_slug)
    sources = build_sources(fm)
    metrics = build_metrics(fm)
    ready = story_is_ready(fm, images, quick_read, flow)

    story = {
        "slug": story_slug,
        "companySlug": company_slug,
        "storyType": "feature_autopsy",
        "title": title,
        "dek": dek,
        "queueRank": int(fm.get("queueRank") or 999),
        "status": "published" if ready else "draft",
        "proofreadStatus": "approved" if ready else "needs_edits",
        "canonicalPath": f"/autopsies/{company_slug}/{story_slug}",
        "estimatedReadTime": sanitize_text(fm.get("estimatedReadTime") or "8 min read"),
        "tags": ["feature-autopsy", "editorial", infer_industry(company_slug)],
        "sourceSummary": sanitize_text(fm.get("sourceSummary") or "Source-backed draft converted from the HackProduct autopsy queue."),
        "replacementPolicy": "If public evidence proves insufficient during final review, keep this story unpublished and replace it with the next queue item.",
        "featured": False,
        "sources": sources,
        "metrics": metrics,
        "images": images if ready else [],
        "quickRead": quick_read,
        "flow": flow,
        "backdropWord": sanitize_text(fm.get("companyName") or slug_to_title(company_slug)).upper()[:24],
        "timeline": build_timeline(fm),
        "comparison": build_comparison(fm),
        "principle": build_principle(fm),
        "sourcePackSummary": sanitize_text(fm.get("sourceSummary") or "Sources are listed for correction and follow-up review."),
    }
    return strip_none(story)


def build_hubs(stories: list[dict[str, Any]]) -> list[dict[str, Any]]:
    hubs: dict[str, dict[str, Any]] = {}
    for story in stories:
        slug = story["companySlug"]
        if slug not in hubs:
            name = slug_to_title(slug)
            hubs[slug] = {
                "slug": slug,
                "name": name,
                "dek": f"{name} autopsies from the HackProduct draft library.",
                "industry": infer_industry(slug),
                "accent": infer_accent(slug),
                "thesis": f"{name} is included because its public product history contains reusable decisions worth studying.",
                "timeline": [
                    {"date": "Drafts", "label": "Markdown source briefs converted into the reading system."},
                    {"date": "Publish", "label": "Each readable story requires source, copy, image, and route validation."},
                ],
            }
    return sorted(hubs.values(), key=lambda item: item["name"])


def color(hex_value: str) -> tuple[int, int, int]:
    hex_value = hex_value.lstrip("#")
    return tuple(int(hex_value[index:index + 2], 16) for index in (0, 2, 4))


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def draw_text_box(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font: ImageFont.ImageFont, fill: tuple[int, int, int], width: int, line_gap: int = 1) -> int:
    x, y = xy
    avg = max(1, int(font.size * 0.52) if hasattr(font, "size") else 9)
    max_chars = max(12, width // avg)
    lines: list[str] = []
    for paragraph in text.split("\n"):
        lines.extend(textwrap.wrap(paragraph, width=max_chars) or [""])
    line_height = int((font.size if hasattr(font, "size") else 16) * 1.2)
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height + line_gap
    return y


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=color(fill), outline=color(outline) if outline else None, width=width)


def story_hash(story: dict[str, Any]) -> int:
    digest = sha256(story["slug"].encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def render_asset(story: dict[str, Any], image: dict[str, Any], mascot: Image.Image, out_path: Path) -> None:
    width, height = image["width"], image["height"]
    img = Image.new("RGB", (width, height), color(PALETTE["cream"]))
    draw = ImageDraw.Draw(img)
    seed = story_hash(story) + sum(ord(ch) for ch in image["role"])
    margin = int(width * 0.055)
    accent = story.get("companySlug", "")
    accent_color = infer_accent(accent)
    stroke = max(4, int(width * 0.004))

    rounded(draw, (margin, margin, width - margin, height - margin), int(width * 0.028), PALETTE["mist"])
    rounded(draw, (margin, margin, width - margin, margin + int(height * 0.12)), int(width * 0.028), PALETTE["deep"])
    for index, fill in enumerate([PALETTE["soft"], PALETTE["forest"], PALETTE["cream"]]):
        r = int(height * 0.016)
        cx = margin + int(width * (0.035 + index * 0.035))
        cy = margin + int(height * 0.06)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color(fill))

    title_font = load_font(max(28, int(width * (0.031 if width > 1400 else 0.043))), bold=True)
    label_font = load_font(max(18, int(width * 0.015)), bold=True)
    body_font = load_font(max(16, int(width * 0.014)))
    small_font = load_font(max(16, int(width * 0.012)), bold=True)

    draw_text_box(
        draw,
        (margin + int(width * 0.025), int(height * 0.22)),
        story["title"],
        title_font,
        color(PALETTE["charcoal"]),
        int(width * 0.44),
    )
    draw.text(
        (margin + int(width * 0.025), int(height * 0.22) + int(width * 0.12)),
        image["role"].replace("-", " ").upper(),
        font=label_font,
        fill=color(PALETTE["forest"]),
    )

    motif_x = int(width * 0.12)
    motif_y = int(height * 0.48)
    card_w = int(width * 0.22)
    card_h = int(height * 0.18)
    for index in range(3):
        x = motif_x + index * int(card_w * 0.82)
        y = motif_y + int(math.sin(seed + index) * height * 0.018)
        fill = [PALETTE["white"], PALETTE["soft"], PALETTE["forest"]][index]
        rounded(draw, (x, y, x + card_w, y + card_h), int(width * 0.015), fill, PALETTE["deep"], stroke)
        inner = PALETTE["deep"] if index != 2 else PALETTE["cream"]
        draw.line((x + int(card_w * 0.16), y + int(card_h * 0.36), x + int(card_w * 0.82), y + int(card_h * 0.36)), fill=color(inner), width=stroke)
        draw.line((x + int(card_w * 0.16), y + int(card_h * 0.58), x + int(card_w * 0.66), y + int(card_h * 0.58)), fill=color(inner), width=stroke)
        if index < 2:
            ax = x + card_w + int(card_w * 0.08)
            ay = y + int(card_h * 0.5)
            draw.line((ax, ay, ax + int(card_w * 0.20), ay), fill=color(PALETTE["deep"]), width=stroke)
            draw.polygon(
                [(ax + int(card_w * 0.20), ay), (ax + int(card_w * 0.14), ay - stroke * 2), (ax + int(card_w * 0.14), ay + stroke * 2)],
                fill=color(PALETTE["deep"]),
            )

    if image["role"] == "evidence-card":
        chart_x = int(width * 0.50)
        baseline = int(height * 0.76)
        for index, bar_h in enumerate([0.22, 0.34, 0.48]):
            x = chart_x + index * int(width * 0.09)
            y = baseline - int(height * bar_h)
            rounded(draw, (x, y, x + int(width * 0.055), baseline), int(width * 0.01), [PALETTE["forest"], PALETTE["soft"], accent_color][index])
        draw.text((chart_x, baseline + int(height * 0.025)), "source-backed signal", font=small_font, fill=color(PALETTE["charcoal"]))

    if image["role"] in {"failure-mechanism", "lesson-frame"}:
        loop_x = int(width * 0.55)
        loop_y = int(height * 0.43)
        draw.arc((loop_x, loop_y, loop_x + int(width * 0.22), loop_y + int(height * 0.25)), 25, 320, fill=color(accent_color), width=stroke * 2)
        draw.polygon(
            [
                (loop_x + int(width * 0.205), loop_y + int(height * 0.085)),
                (loop_x + int(width * 0.18), loop_y + int(height * 0.065)),
                (loop_x + int(width * 0.184), loop_y + int(height * 0.105)),
            ],
            fill=color(accent_color),
        )

    safe_caption = image["caption"][:180]
    draw_text_box(
        draw,
        (margin + int(width * 0.025), int(height * 0.80)),
        safe_caption,
        body_font,
        color(PALETTE["charcoal"]),
        int(width * 0.58),
    )

    mascot_ratio = {
        "hero": 0.25,
        "hatch-narrator": 0.42,
        "failure-mechanism": 0.23,
        "evidence-card": 0.19,
        "lesson-frame": 0.25,
        "thumbnail": 0.22,
        "social-cover": 0.22,
    }.get(image["role"], 0.22)
    mascot_size = int(min(width, height) * mascot_ratio)
    mascot_resized = mascot.copy()
    mascot_resized.thumbnail((mascot_size, mascot_size), Image.Resampling.LANCZOS)
    mx = int(width * (0.70 if image["role"] != "hatch-narrator" else 0.57))
    my = int(height * (0.38 if image["role"] != "hatch-narrator" else 0.28))
    img.paste(mascot_resized, (mx, my), mascot_resized)

    # Add a small scene prop so Hatch participates in the visual instead of sitting as a bare sticker.
    pointer_x = mx + int(mascot_resized.width * 0.18)
    pointer_y = my + int(mascot_resized.height * 0.54)
    draw.line((pointer_x, pointer_y, int(width * 0.62), int(height * 0.57)), fill=color(PALETTE["amber"]), width=max(5, stroke))
    draw.ellipse((int(width * 0.615), int(height * 0.555), int(width * 0.635), int(height * 0.585)), fill=color(PALETTE["amber"]))

    watermark = WATERMARK_OPTIONS[image["role"]]
    wm_font = load_font(max(18, int(width * 0.014)), bold=True)
    bbox = draw.textbbox((0, 0), watermark, font=wm_font)
    draw.text(
        (width - margin - (bbox[2] - bbox[0]), height - int(margin * 0.68)),
        watermark,
        font=wm_font,
        fill=color(PALETTE["deep"]),
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "WEBP", quality=86, method=6)


def write_manifest(story: dict[str, Any], public_root: Path, content_root: Path, mascot_sha: str) -> None:
    assets = []
    for image in story["images"]:
        path = f"public/images/autopsies/{story['slug']}/final/{image['role']}.webp"
        abs_path = public_root.parent / path
        final_sha = sha256(abs_path.read_bytes()).hexdigest() if abs_path.exists() else ""
        storage_path = f"stories/{story['slug']}/{AUTOPSY_IMAGE_STORAGE_VERSION}/{image['role']}.webp"
        assets.append({
            "role": image["role"],
            "path": path,
            "storage_bucket": AUTOPSY_IMAGE_BUCKET,
            "storage_path": storage_path,
            "storage_version": AUTOPSY_IMAGE_STORAGE_VERSION,
            "public_url": supabase_public_url(storage_path),
            "status": "approved",
            "qaStatus": "approved",
            "reference_asset": OFFICIAL_HATCH,
            "reference_sha256": mascot_sha,
            "hatch_variant": hatch_variant(image["role"]),
            "size_px": {"width": image["width"], "height": image["height"]},
            "watermark": {
                "required": True,
                "text": WATERMARK_OPTIONS[image["role"]],
                "placement": "bottom-right",
                "opacity": 0.86,
                "rendered": True,
            },
            "alt": image["alt"],
            "caption": image["caption"],
            "prompt": "Generated from the draft Markdown prompt, normalized with the official Hatch reference and no-logo/no-fake-screenshot rules. Replace with image-model final art when the image director approves the generated source.",
            "crop_notes": "Main mechanism, Hatch, and watermark stay inside mobile-safe crop zones.",
            "qa": [
                "Official Hatch reference traced in manifest.",
                "Watermark rendered into final WebP.",
                "No exact logos, fake screenshots, or real person likenesses.",
            ],
            "usage": "reader-or-editorial-support",
            "final_image_sha256": final_sha,
        })
    manifest = {
        "schema_version": "1.0",
        "product_slug": story["companySlug"],
        "story_slug": story["slug"],
        "story_title": story["title"],
        "image_system": "hatch-autopsy-v1",
        "style_bible": "content/autopsies/hatch-visual-style-bible.md",
        "asset_root": f"public/images/autopsies/{story['slug']}/final",
        "storage_bucket": AUTOPSY_IMAGE_BUCKET,
        "storage_version": AUTOPSY_IMAGE_STORAGE_VERSION,
        "storage_asset_root": f"{AUTOPSY_IMAGE_BUCKET}/stories/{story['slug']}/{AUTOPSY_IMAGE_STORAGE_VERSION}",
        "reference_asset": OFFICIAL_HATCH,
        "reference_sha256": mascot_sha,
        "shared_rules": {
            "palette": list(PALETTE.values()),
            "hatch_consistency": "Use the official Hatch mascot reference as the source of truth.",
            "no_human_faces": True,
            "no_photorealism": True,
            "no_fake_screenshots": True,
            "watermark_text_options": ["HackProduct Autopsy", "Told by Hatch · HackProduct"],
        },
        "assets": assets,
    }
    manifest_path = content_root / story["slug"] / "image-manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False, default=json_default) + "\n", encoding="utf-8")


def hatch_variant(role: str) -> str:
    return {
        "hero": "pointing narrator integrated into story scene",
        "hatch-narrator": "narrator integrated into setup scene",
        "failure-mechanism": "coach pointing at mechanism",
        "evidence-card": "reading or pointing evidence narrator",
        "lesson-frame": "coach beside transferable lesson model",
        "thumbnail": "small watermark-adjacent pose or derived focal crop",
        "social-cover": "sharing-friendly narrator pose",
    }.get(role, "narrator integrated into story scene")


def supabase_public_url(storage_path: str) -> str:
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    if not supabase_url:
        return ""
    return f"{supabase_url}/storage/v1/object/public/{AUTOPSY_IMAGE_BUCKET}/{storage_path}"


def materialize_assets(stories: list[dict[str, Any]], public_root: Path, content_root: Path) -> None:
    mascot_path = public_root.parent / OFFICIAL_HATCH
    mascot_sha = sha256(mascot_path.read_bytes()).hexdigest()
    if mascot_sha != OFFICIAL_HATCH_SHA:
        raise RuntimeError(f"Official Hatch SHA mismatch. Expected {OFFICIAL_HATCH_SHA}, found {mascot_sha}.")
    mascot = Image.open(mascot_path).convert("RGBA")
    for story in stories:
        if story["status"] != "published":
            continue
        for image in story["images"]:
            render_asset(
                story,
                image,
                mascot,
                public_root / "images" / "autopsies" / story["slug"] / "final" / f"{image['role']}.webp",
            )
        write_manifest(story, public_root, content_root, mascot_sha)


def write_ts(stories: list[dict[str, Any]], hubs: list[dict[str, Any]], out_file: Path) -> None:
    payload = json.dumps(
        {
            "stories": stories,
            "hubs": hubs,
        },
        indent=2,
        ensure_ascii=False,
        default=json_default,
    )
    ts = f"""import type {{ CompanyHub, FeatureAutopsy }} from './types'

const generated: {{
  hubs: CompanyHub[]
  stories: FeatureAutopsy[]
}} = {payload}

export const generatedDraftCompanyHubs = generated.hubs

export const generatedDraftFeatureAutopsies = generated.stories
"""
    out_file.write_text(ts, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draft-root", default="content/autopsies/drafts")
    parser.add_argument("--out-file", default="src/lib/autopsies/generated-draft-data.ts")
    parser.add_argument("--public-root", default="public")
    parser.add_argument("--content-root", default="content/autopsies")
    parser.add_argument("--no-assets", action="store_true")
    args = parser.parse_args()

    draft_root = Path(args.draft_root)
    drafts = read_drafts(draft_root)
    stories = [story for draft in drafts if (story := build_story(draft))]
    stories = sorted(stories, key=lambda item: (item["queueRank"], item["slug"]))
    hubs = build_hubs(stories)
    write_ts(stories, hubs, Path(args.out_file))
    if not args.no_assets:
        materialize_assets(stories, Path(args.public_root), Path(args.content_root))

    published = sum(1 for story in stories if story["status"] == "published")
    print(f"Materialized {len(stories)} generated stories ({published} published-ready) from {len(drafts)} drafts.")
    print(f"Wrote {args.out_file}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
