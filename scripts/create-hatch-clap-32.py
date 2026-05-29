from __future__ import annotations

from math import cos, pi
from pathlib import Path
import importlib.util

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "images" / "hatch-mascot.png"
OUT_DIR = ROOT / "public" / "videos" / "hatch"
FRAME_DIR = ROOT / "tmp" / "hatch-clap-32-frames"

FRAME_COUNT = 32
OUTPUT_SIZE = 512
FRAME_DURATION_MS = 42


def load_sprite_helpers():
    helper_path = Path(__file__).with_name("create-hatch-clap-sprite.py")
    spec = importlib.util.spec_from_file_location("hatch_clap_sprite", helper_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to import sprite helpers from {helper_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.compose_frame, module.crop_hand, module.erase_regions


def pulse(t: float, center: float, radius: float) -> float:
    distance = min(abs(t - center), abs(t - center - 1), abs(t - center + 1))
    if distance >= radius:
        return 0
    return 0.5 + 0.5 * cos(pi * distance / radius)


def pose_for_frame(index: int) -> tuple[float, float]:
    t = index / FRAME_COUNT
    close = max(pulse(t, 0.24, 0.19), pulse(t, 0.68, 0.18))
    rebound = 0.12 * pulse(t, 0.45, 0.11)
    idle_motion = 0.025 * (0.5 + 0.5 * cos(2 * pi * t))
    phase = max(0.0, min(1.0, close + rebound + idle_motion))
    clap_strength = phase**3
    return phase, clap_strength


def save_transparent_gif(frames: list[Image.Image], out_path: Path) -> None:
    matte = (1, 255, 1)
    paletted = []
    for frame in frames:
        alpha = frame.getchannel("A")
        flattened = Image.new("RGBA", frame.size, matte + (255,))
        flattened.alpha_composite(frame)
        indexed = flattened.convert("P", palette=Image.Palette.ADAPTIVE, colors=255)
        palette = indexed.getpalette()
        indexed.putpalette([matte[0], matte[1], matte[2], *palette[: 255 * 3]])
        mask = alpha.point(lambda value: 255 if value < 128 else 0)
        indexed.paste(0, mask)
        indexed.info["transparency"] = 0
        paletted.append(indexed)

    paletted[0].save(
        out_path,
        save_all=True,
        append_images=paletted[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        disposal=2,
        transparency=0,
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAME_DIR.mkdir(parents=True, exist_ok=True)

    compose_frame, crop_hand, erase_regions = load_sprite_helpers()
    source = Image.open(SOURCE).convert("RGBA")
    base = erase_regions(source)
    right_hand = crop_hand(source)
    left_hand = ImageOps.mirror(right_hand)

    frames = []
    for index in range(FRAME_COUNT):
        phase, clap_strength = pose_for_frame(index)
        frame = compose_frame(base, right_hand, left_hand, phase, clap_strength)
        frame = frame.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS)
        frame.save(FRAME_DIR / f"hatch-clap-32-{index:02d}.png")
        frames.append(frame)

    sheet = Image.new("RGBA", (OUTPUT_SIZE * 8, OUTPUT_SIZE * 4), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, ((index % 8) * OUTPUT_SIZE, (index // 8) * OUTPUT_SIZE))
    sheet.save(OUT_DIR / "clap-32-sprite-sheet.png")

    save_transparent_gif(frames, OUT_DIR / "clap-32-transparent.gif")
    frames[0].save(
        OUT_DIR / "clap-32.webp",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        lossless=True,
        quality=100,
        method=6,
    )

    print(f"Wrote {OUT_DIR / 'clap-32-sprite-sheet.png'}")
    print(f"Wrote {OUT_DIR / 'clap-32-transparent.gif'}")
    print(f"Wrote {OUT_DIR / 'clap-32.webp'}")


if __name__ == "__main__":
    main()
