#!/usr/bin/env python3
"""Run HackProduct autopsy image jobs through the OpenAI Images API concurrently.

Use this when Hatch reference images are required. Unlike the async Batch API,
this calls the multipart /v1/images/edits endpoint directly, which reliably
accepts the local Hatch reference image.
"""

from __future__ import annotations

import argparse
import base64
import concurrent.futures
import json
import os
import random
import re
import sys
import threading
import time
from pathlib import Path
from typing import Any

from openai import OpenAI


DEFAULT_REFERENCE = ".autopsy-image-batches/hatch-official-mascot-rgb-reference.png"
DEFAULT_MODEL = "gpt-image-2"
DEFAULT_QUALITY = "medium"
SIZE_MAP = {
    "2400x1350": "2400x1360",
    "1600x1600": "1600x1600",
    "1800x1200": "1792x1200",
    "1600x1000": "1600x1008",
}


class StartRateLimiter:
    def __init__(self, requests_per_minute: float) -> None:
        self.interval = 60.0 / requests_per_minute if requests_per_minute > 0 else 0.0
        self.lock = threading.Lock()
        self.next_start = 0.0

    def wait(self) -> None:
        if self.interval <= 0:
            return
        with self.lock:
            now = time.monotonic()
            sleep_for = max(0.0, self.next_start - now)
            self.next_start = max(now, self.next_start) + self.interval
        if sleep_for:
            time.sleep(sleep_for)


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


def mapped_size(size_px: dict[str, Any]) -> str:
    key = f"{size_px.get('width')}x{size_px.get('height')}"
    return SIZE_MAP.get(key, "auto")


def has_hatch(prompt: str) -> bool:
    if re.search(r"\bHatch\s+(?:absent|must not appear)\b", prompt, flags=re.I):
        return False
    return bool(re.search(r"\bHatch\b|official Hatch|canonical Hatch|official mascot", prompt, flags=re.I))


def prompt_for(request: dict[str, Any], hatch_present: bool) -> str:
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
        "If the prompt requires labels, keep them short and legible; otherwise prefer icon-only diagrams."
    )
    return prompt


def build_jobs(requests: list[dict[str, Any]], source_dir: Path, story_filter: set[str] | None) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    for request in requests:
        if request.get("derive"):
            continue
        story = str(request.get("story_slug", ""))
        role = str(request.get("role", ""))
        if not story or not role:
            continue
        if story_filter and story not in story_filter:
            continue
        output = source_dir / story / f"{role}.png"
        hatch_present = has_hatch(str(request.get("prompt", "")))
        jobs.append({
            "story": story,
            "role": role,
            "mode": "edit" if hatch_present else "generate",
            "prompt": prompt_for(request, hatch_present),
            "size": mapped_size(request.get("size_px") or {}),
            "output": output,
        })
    return jobs


def result_to_bytes(result: Any) -> bytes:
    data = getattr(result, "data", None)
    if not data:
        raise RuntimeError("Image response did not include data")
    b64 = getattr(data[0], "b64_json", None)
    if not b64 and isinstance(data[0], dict):
        b64 = data[0].get("b64_json")
    if not b64:
        raise RuntimeError("Image response did not include b64_json")
    return base64.b64decode(b64)


def retry_after_seconds(message: str) -> float | None:
    match = re.search(r"try again in\s+([0-9.]+)s", message, flags=re.I)
    if not match:
        return None
    try:
        return float(match.group(1))
    except ValueError:
        return None


def run_job(
    job: dict[str, Any],
    reference: Path,
    force: bool,
    max_attempts: int,
    rate_limiter: StartRateLimiter,
) -> dict[str, Any]:
    output = Path(job["output"])
    if output.exists() and not force:
        return {"status": "skipped", "story": job["story"], "role": job["role"], "output": str(output)}

    last_error = ""
    for attempt in range(1, max_attempts + 1):
        try:
            rate_limiter.wait()
            client = OpenAI()
            started = time.time()
            if job["mode"] == "edit":
                with reference.open("rb") as image_handle:
                    result = client.images.edit(
                        model=DEFAULT_MODEL,
                        image=image_handle,
                        prompt=job["prompt"],
                        n=1,
                        size=job["size"],
                        quality=DEFAULT_QUALITY,
                        output_format="png",
                    )
            else:
                result = client.images.generate(
                    model=DEFAULT_MODEL,
                    prompt=job["prompt"],
                    n=1,
                    size=job["size"],
                    quality=DEFAULT_QUALITY,
                    output_format="png",
                )
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(result_to_bytes(result))
            return {
                "status": "done",
                "story": job["story"],
                "role": job["role"],
                "mode": job["mode"],
                "seconds": round(time.time() - started, 1),
                "output": str(output),
            }
        except Exception as exc:  # noqa: BLE001 - operational retry wrapper
            last_error = str(exc)
            if attempt < max_attempts:
                retry_after = retry_after_seconds(last_error)
                sleep_for = retry_after if retry_after is not None else min(45, 4 * attempt + random.random() * 3)
                time.sleep(sleep_for)

    return {
        "status": "failed",
        "story": job["story"],
        "role": job["role"],
        "mode": job["mode"],
        "error": last_error,
        "output": str(output),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image-requests", required=True)
    parser.add_argument("--source-dir", required=True)
    parser.add_argument("--reference", default=DEFAULT_REFERENCE)
    parser.add_argument("--env-file", default="/Users/sandeep/Projects/myproductschool/.worktrees/dev/.env.local")
    parser.add_argument("--stories", help="Optional comma-separated story slug filter")
    parser.add_argument("--concurrency", type=int, default=6)
    parser.add_argument("--requests-per-minute", type=float, default=4.5)
    parser.add_argument("--max-attempts", type=int, default=3)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--summary", help="Path to write JSON summary")
    args = parser.parse_args()

    load_dotenv(Path(args.env_file) if args.env_file else None)
    if not os.environ.get("OPENAI_API_KEY"):
        print("OPENAI_API_KEY is not set.", file=sys.stderr)
        return 2

    reference = Path(args.reference)
    if not reference.exists():
        print(f"Reference image not found: {reference}", file=sys.stderr)
        return 2

    story_filter = set(args.stories.split(",")) if args.stories else None
    requests = load_jsonl(Path(args.image_requests))
    jobs = build_jobs(requests, Path(args.source_dir), story_filter)
    pending = [job for job in jobs if args.force or not Path(job["output"]).exists()]
    print(json.dumps({
        "total_jobs": len(jobs),
        "pending_jobs": len(pending),
        "concurrency": args.concurrency,
        "requests_per_minute": args.requests_per_minute,
        "source_dir": args.source_dir,
    }), flush=True)

    results: list[dict[str, Any]] = []
    rate_limiter = StartRateLimiter(args.requests_per_minute)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [
            executor.submit(run_job, job, reference, args.force, args.max_attempts, rate_limiter)
            for job in pending
        ]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            results.append(result)
            if result["status"] == "done":
                print(f"[done] {result['story']}/{result['role']} {result.get('seconds')}s", flush=True)
            else:
                print(f"[{result['status']}] {result['story']}/{result['role']} {result.get('error', '')}", flush=True)

    summary = {
        "done": sum(1 for item in results if item["status"] == "done"),
        "failed": [item for item in results if item["status"] == "failed"],
        "skipped": sum(1 for item in results if item["status"] == "skipped"),
        "results": results,
    }
    if args.summary:
        Path(args.summary).parent.mkdir(parents=True, exist_ok=True)
        Path(args.summary).write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"done": summary["done"], "failed": len(summary["failed"],), "skipped": summary["skipped"]}), flush=True)
    return 1 if summary["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
