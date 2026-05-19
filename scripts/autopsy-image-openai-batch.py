#!/usr/bin/env python3
"""Submit and collect OpenAI Batch API image jobs for HackProduct autopsies.

This runner is intentionally separate from the synchronous image fallback CLI:

- Batch API jobs are cheaper and higher-throughput, but can take up to 24 hours.
- Hatch-containing images use /v1/images/edits with an uploaded Hatch reference.
- Hatch-absent images use /v1/images/generations.
- Thumbnail and social-cover assets should remain derived during finalization.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from openai import OpenAI


DEFAULT_MODEL = "gpt-image-2"
DEFAULT_QUALITY = "medium"
DEFAULT_OUTPUT_FORMAT = "png"
DEFAULT_REFERENCE = ".autopsy-image-batches/hatch-official-mascot-rgb-reference.png"
SIZE_MAP = {
    "2400x1350": "2400x1360",
    "1600x1600": "1600x1600",
    "1800x1200": "1792x1200",
    "1600x1000": "1600x1008",
    "1200x900": "1200x912",
    "2400x1260": "2400x1264",
}


def load_dotenv(path: Path | None) -> None:
    if not path or not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def mapped_size(size_px: dict[str, Any]) -> str:
    key = f"{size_px.get('width')}x{size_px.get('height')}"
    return SIZE_MAP.get(key, "auto")


def has_hatch(prompt: str) -> bool:
    if re.search(r"\bHatch\s+(?:absent|must not appear)\b", prompt, flags=re.I):
        return False
    return bool(re.search(r"\bHatch\b|official Hatch|canonical Hatch|official mascot", prompt, flags=re.I))


def augmented_prompt(request: dict[str, Any], *, hatch_present: bool) -> str:
    prompt = str(request.get("prompt", "")).strip()
    if hatch_present:
        prompt += (
            "\nCritical QA: Use the provided official mascot image as the visual reference for Hatch. "
            "Preserve the rounded green head frame, cream face and body, graduation cap, growth arrow, "
            "H chest mark, bright eyes, mitten hands, and friendly coach expression. Do not invent a "
            "different mascot."
        )
    else:
        prompt += "\nCritical QA: Hatch must not appear in this image. Do not include mascot-like characters."
    prompt += (
        "\nDo not render random words, unreadable pseudo-text, fake brand UI, company logos, or real people. "
        "Only use short labels if the prompt explicitly asks for them."
    )
    return prompt


def batch_line(
    *,
    custom_id: str,
    url: str,
    body: dict[str, Any],
) -> dict[str, Any]:
    return {
        "custom_id": custom_id,
        "method": "POST",
        "url": url,
        "body": body,
    }


def build_rows(
    requests: list[dict[str, Any]],
    *,
    reference_file_id: str | None,
    edit_image_param: str,
    stories: set[str] | None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    edits: list[dict[str, Any]] = []
    generations: list[dict[str, Any]] = []
    manifest: list[dict[str, Any]] = []

    for request in requests:
        story_slug = str(request.get("story_slug", ""))
        role = str(request.get("role", ""))
        if not story_slug or not role:
            continue
        if stories and story_slug not in stories:
            continue
        if request.get("derive"):
            continue

        hatch_present = has_hatch(str(request.get("prompt", "")))
        custom_id = f"{story_slug}__{role}"
        body = {
            "model": DEFAULT_MODEL,
            "prompt": augmented_prompt(request, hatch_present=hatch_present),
            "n": 1,
            "size": mapped_size(request.get("size_px") or {}),
            "quality": DEFAULT_QUALITY,
            "output_format": DEFAULT_OUTPUT_FORMAT,
        }

        if hatch_present:
            if not reference_file_id:
                raise RuntimeError("reference_file_id is required for Hatch edit rows")
            if edit_image_param == "object":
                body["images"] = [{"type": "file_id", "file_id": reference_file_id}]
            else:
                body["images"] = [reference_file_id]
            edits.append(batch_line(custom_id=custom_id, url="/v1/images/edits", body=body))
            mode = "edit"
        else:
            generations.append(batch_line(custom_id=custom_id, url="/v1/images/generations", body=body))
            mode = "generation"

        manifest.append({
            "custom_id": custom_id,
            "story_slug": story_slug,
            "role": role,
            "mode": mode,
            "size": body["size"],
            "output_format": DEFAULT_OUTPUT_FORMAT,
        })

    return edits, generations, manifest


def upload_batch_file(client: OpenAI, path: Path) -> str:
    with path.open("rb") as handle:
        created = client.files.create(file=handle, purpose="batch")
    return created.id


def submit(args: argparse.Namespace) -> int:
    load_dotenv(Path(args.env_file) if args.env_file else None)
    client = OpenAI()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    requests = load_jsonl(Path(args.image_requests))
    stories = set(args.stories.split(",")) if args.stories else None

    reference_path = Path(args.reference)
    if not reference_path.exists():
        raise FileNotFoundError(reference_path)
    with reference_path.open("rb") as handle:
        reference_file = client.files.create(file=handle, purpose="user_data")

    edits, generations, manifest = build_rows(
        requests,
        reference_file_id=reference_file.id,
        edit_image_param=args.edit_image_param,
        stories=stories,
    )

    edit_input_file_id = generation_input_file_id = None
    edit_batch_id = generation_batch_id = None
    if edits:
        edit_path = out_dir / "openai-image-edits.jsonl"
        write_jsonl(edit_path, edits)
        edit_input_file_id = upload_batch_file(client, edit_path)
        edit_batch = client.batches.create(
            input_file_id=edit_input_file_id,
            endpoint="/v1/images/edits",
            completion_window="24h",
            metadata={"kind": "hackproduct-autopsy-images", "mode": "edits"},
        )
        edit_batch_id = edit_batch.id

    if generations:
        generation_path = out_dir / "openai-image-generations.jsonl"
        write_jsonl(generation_path, generations)
        generation_input_file_id = upload_batch_file(client, generation_path)
        generation_batch = client.batches.create(
            input_file_id=generation_input_file_id,
            endpoint="/v1/images/generations",
            completion_window="24h",
            metadata={"kind": "hackproduct-autopsy-images", "mode": "generations"},
        )
        generation_batch_id = generation_batch.id

    state = {
        "schema_version": "1.0",
        "image_requests": str(Path(args.image_requests)),
        "source_dir": args.source_dir,
        "reference_file_id": reference_file.id,
        "reference_asset": str(reference_path),
        "edit_image_param": args.edit_image_param,
        "batches": {
            "edits": {"batch_id": edit_batch_id, "input_file_id": edit_input_file_id, "count": len(edits)},
            "generations": {
                "batch_id": generation_batch_id,
                "input_file_id": generation_input_file_id,
                "count": len(generations),
            },
        },
        "manifest": manifest,
    }
    (out_dir / "openai-batch-state.json").write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "state": str(out_dir / "openai-batch-state.json"),
        "edit_batch_id": edit_batch_id,
        "generation_batch_id": generation_batch_id,
        "edit_count": len(edits),
        "generation_count": len(generations),
    }, indent=2))
    return 0


def poll(args: argparse.Namespace) -> int:
    load_dotenv(Path(args.env_file) if args.env_file else None)
    client = OpenAI()
    state_path = Path(args.state)
    state = json.loads(state_path.read_text(encoding="utf-8"))
    summaries: list[dict[str, Any]] = []
    for mode, info in state.get("batches", {}).items():
        batch_id = info.get("batch_id")
        if not batch_id:
            continue
        batch = client.batches.retrieve(batch_id)
        summaries.append({
            "mode": mode,
            "batch_id": batch.id,
            "status": batch.status,
            "request_counts": batch.request_counts.model_dump() if batch.request_counts else None,
            "output_file_id": batch.output_file_id,
            "error_file_id": batch.error_file_id,
            "errors": batch.errors.model_dump() if batch.errors else None,
        })
    print(json.dumps(summaries, indent=2, default=str))
    return 0


def extract_b64(body: dict[str, Any]) -> str | None:
    data = body.get("data")
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, dict):
            return first.get("b64_json")
    return None


def collect(args: argparse.Namespace) -> int:
    load_dotenv(Path(args.env_file) if args.env_file else None)
    client = OpenAI()
    state_path = Path(args.state)
    state = json.loads(state_path.read_text(encoding="utf-8"))
    out_dir = state_path.parent
    source_dir = Path(args.source_dir or state.get("source_dir") or ".autopsy-image-batches/generated-sources")
    by_custom_id = {item["custom_id"]: item for item in state.get("manifest", [])}
    written = 0
    failures: list[dict[str, Any]] = []

    for mode, info in state.get("batches", {}).items():
        batch_id = info.get("batch_id")
        if not batch_id:
            continue
        batch = client.batches.retrieve(batch_id)
        if batch.status != "completed":
            print(f"{mode}: batch {batch_id} is {batch.status}; skipping collect")
            continue
        if batch.output_file_id:
            response_text = client.files.content(batch.output_file_id).text
            output_path = out_dir / f"{mode}-output.jsonl"
            output_path.write_text(response_text, encoding="utf-8")
            for line in response_text.splitlines():
                row = json.loads(line)
                custom_id = row.get("custom_id")
                meta = by_custom_id.get(custom_id, {})
                response = row.get("response") or {}
                body = response.get("body") or {}
                b64 = extract_b64(body)
                if not b64:
                    failures.append({"custom_id": custom_id, "row": row})
                    continue
                target = source_dir / str(meta.get("story_slug")) / f"{meta.get('role')}.png"
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(base64.b64decode(b64))
                written += 1
        if batch.error_file_id:
            error_text = client.files.content(batch.error_file_id).text
            (out_dir / f"{mode}-errors.jsonl").write_text(error_text, encoding="utf-8")
            for line in error_text.splitlines():
                if line.strip():
                    failures.append({"mode": mode, "error": json.loads(line)})

    (out_dir / "collect-summary.json").write_text(
        json.dumps({"written": written, "failures": failures}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"written": written, "failures": len(failures)}, indent=2))
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", default="/Users/sandeep/Projects/myproductschool/.worktrees/dev/.env.local")
    subparsers = parser.add_subparsers(dest="command", required=True)

    submit_parser = subparsers.add_parser("submit")
    submit_parser.add_argument("--image-requests", required=True)
    submit_parser.add_argument("--out-dir", required=True)
    submit_parser.add_argument("--source-dir", required=True)
    submit_parser.add_argument("--reference", default=DEFAULT_REFERENCE)
    submit_parser.add_argument("--stories", help="Optional comma-separated story slug filter")
    submit_parser.add_argument("--edit-image-param", choices=["string", "object"], default="string")
    submit_parser.set_defaults(func=submit)

    poll_parser = subparsers.add_parser("poll")
    poll_parser.add_argument("--state", required=True)
    poll_parser.set_defaults(func=poll)

    collect_parser = subparsers.add_parser("collect")
    collect_parser.add_argument("--state", required=True)
    collect_parser.add_argument("--source-dir")
    collect_parser.set_defaults(func=collect)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
