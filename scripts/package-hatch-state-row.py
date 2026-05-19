from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw


CELL_WIDTH = 192
CELL_HEIGHT = 208


def clean_transparency(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = []
    for red, green, blue, alpha in rgba.getdata():
        data.append((0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha))
    rgba.putdata(data)
    return rgba


def frame_paths(frames_dir: Path) -> list[Path]:
    return sorted(path for path in frames_dir.iterdir() if path.suffix.lower() in {".png", ".webp"})


def checkerboard(size: tuple[int, int]) -> Image.Image:
    width, height = size
    image = Image.new("RGBA", size, (245, 240, 230, 255))
    draw = ImageDraw.Draw(image)
    tile = 12
    for y in range(0, height, tile):
        for x in range(0, width, tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(232, 225, 211, 255))
    return image


def save_preview(frames: list[Image.Image], output: Path, durations_ms: list[int]) -> None:
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=durations_ms,
        loop=0,
        disposal=2,
        optimize=False,
    )


def save_animated_webp(frames: list[Image.Image], output: Path, durations_ms: list[int]) -> None:
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=durations_ms,
        loop=0,
        lossless=True,
        quality=100,
        method=6,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Package one Hatch state row into QA assets.")
    parser.add_argument("--state", required=True)
    parser.add_argument("--frames-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--source-strip")
    parser.add_argument("--alpha-strip")
    parser.add_argument("--fps", type=int, default=8)
    parser.add_argument(
        "--durations-ms",
        help="Comma-separated per-frame durations in milliseconds. Must match the 8 extracted frames.",
    )
    args = parser.parse_args()

    state = args.state
    frames_dir = Path(args.frames_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_frames_dir = output_dir / "frames"
    output_frames_dir.mkdir(parents=True, exist_ok=True)

    files = frame_paths(frames_dir)
    if len(files) != 8:
        raise SystemExit(f"{state} packaging expects 8 frames, found {len(files)} in {frames_dir}")

    frames: list[Image.Image] = []
    validation_frames = []
    for index, path in enumerate(files):
        with Image.open(path) as opened:
            frame = clean_transparency(opened.convert("RGBA"))
        if frame.size != (CELL_WIDTH, CELL_HEIGHT):
            raise SystemExit(f"{path} is {frame.width}x{frame.height}; expected {CELL_WIDTH}x{CELL_HEIGHT}")
        out_frame = output_frames_dir / f"{index:02d}.png"
        frame.save(out_frame)
        frames.append(frame)
        alpha = frame.getchannel("A")
        validation_frames.append(
            {
                "index": index,
                "path": str(out_frame),
                "size": list(frame.size),
                "alpha": list(alpha.getextrema()),
                "bbox": list(frame.getbbox()) if frame.getbbox() else None,
                "nontransparentPixels": sum(alpha.histogram()[1:]),
            }
        )

    durations_ms = (
        [int(value.strip()) for value in args.durations_ms.split(",") if value.strip()]
        if args.durations_ms
        else [round(1000 / args.fps)] * len(frames)
    )
    if len(durations_ms) != len(frames):
        raise SystemExit(f"--durations-ms must provide {len(frames)} values, got {len(durations_ms)}")

    strip = Image.new("RGBA", (CELL_WIDTH * len(frames), CELL_HEIGHT), (0, 0, 0, 0))
    contact = checkerboard(strip.size)
    for index, frame in enumerate(frames):
        position = (index * CELL_WIDTH, 0)
        strip.alpha_composite(frame, position)
        contact.alpha_composite(frame, position)
    strip = clean_transparency(strip)
    strip.save(output_dir / f"{state}-strip.png")
    strip.save(output_dir / f"{state}-strip.webp", lossless=True, quality=100, method=6)
    contact.convert("RGB").save(output_dir / "contact-sheet.png")
    save_preview(frames, output_dir / f"{state}.gif", durations_ms)
    save_animated_webp(frames, output_dir / f"{state}.webp", durations_ms)

    if args.source_strip:
        shutil.copy2(Path(args.source_strip), output_dir / "source-strip.png")
    if args.alpha_strip:
        shutil.copy2(Path(args.alpha_strip), output_dir / "source-strip-alpha.png")

    validation = {
        "ok": True,
        "state": state,
        "frames": len(frames),
        "cellWidth": CELL_WIDTH,
        "cellHeight": CELL_HEIGHT,
        "stripSize": list(strip.size),
        "hasAlpha": strip.getchannel("A").getextrema()[0] < 255,
        "durationsMs": durations_ms,
        "loopDurationMs": sum(durations_ms),
        "framesDetail": validation_frames,
    }
    (output_dir / "validation.json").write_text(json.dumps(validation, indent=2) + "\n")
    print(json.dumps(validation, indent=2))


if __name__ == "__main__":
    main()
