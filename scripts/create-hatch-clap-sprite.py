from __future__ import annotations

from math import sin
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/sandeep/Documents/hackproduct-marketing/mascot.png")
OUT_DIR = ROOT / "public" / "rive"
FRAME_DIR = ROOT / "tmp" / "rive-preview" / "hatch-source-frames"

FRAME_COUNT = 8
SOURCE_SIZE = 1024
OUTPUT_SIZE = 512

DARK = (28, 78, 52, 255)
ARM_FILL = (250, 246, 235, 255)
HIGHLIGHT = (255, 255, 255, 130)
CLAP = (196, 166, 106, 220)


def erase_regions(image: Image.Image) -> Image.Image:
    """Remove the source arm pose so the animated arms can be drawn cleanly."""
    alpha = image.getchannel("A")
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)

    # Viewer-left lowered arm and hand.
    draw.line([(374, 650), (326, 720), (330, 785)], fill=255, width=78, joint="curve")
    draw.ellipse((268, 690, 408, 824), fill=255)
    draw.polygon([(286, 636), (390, 642), (390, 790), (315, 826), (266, 748)], fill=255)

    # Viewer-right raised arm and mitten, kept away from the face shell/cap.
    draw.line([(626, 650), (674, 596), (736, 526)], fill=255, width=46, joint="curve")
    draw.ellipse((696, 444, 828, 606), fill=255)

    image = image.copy()
    image.putalpha(ImageChops.subtract(alpha, mask))

    repair = Image.new("RGBA", image.size, (0, 0, 0, 0))
    repair_draw = ImageDraw.Draw(repair)
    repair_draw.polygon([(354, 640), (414, 650), (404, 828), (356, 810), (322, 728)], fill=ARM_FILL)
    repair_draw.line([(390, 642), (356, 710), (350, 788)], fill=DARK, width=13, joint="curve")
    repair_draw.line([(397, 648), (366, 712), (363, 782)], fill=ARM_FILL, width=6, joint="curve")
    repair_draw.polygon([(610, 650), (668, 640), (704, 728), (668, 812), (620, 830)], fill=ARM_FILL)
    repair_draw.line([(626, 646), (670, 712), (668, 790)], fill=DARK, width=13, joint="curve")
    repair_draw.line([(620, 652), (660, 715), (658, 780)], fill=ARM_FILL, width=6, joint="curve")
    image.alpha_composite(repair)
    return image


def crop_hand(source: Image.Image) -> Image.Image:
    size = 132
    scale = 4
    hand = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(hand)

    def box(values: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
        return tuple(value * scale for value in values)

    fill = (76, 126, 89, 255)
    shadow = (54, 101, 70, 255)

    # Draw a compact mitten at source-image scale. It reads cleaner than a
    # cropped hand once the whole frame is downsampled into app-size avatars.
    dark_shapes = [
        (28, 34, 108, 116),
        (14, 62, 58, 106),
        (44, 18, 104, 64),
    ]
    fill_shapes = [
        (36, 42, 100, 108),
        (22, 70, 52, 98),
        (50, 26, 96, 58),
    ]

    for shape in dark_shapes:
        draw.ellipse(box(shape), fill=DARK)
    for shape in fill_shapes:
        draw.ellipse(box(shape), fill=fill)

    draw.arc(box((42, 58, 100, 116)), start=204, end=306, fill=shadow, width=5 * scale)
    draw.line([(54 * scale, 102 * scale), (44 * scale, 122 * scale)], fill=DARK, width=8 * scale)

    return hand.resize((size, size), Image.Resampling.LANCZOS)


def rotate_layer(layer: Image.Image, degrees: float) -> Image.Image:
    return layer.rotate(degrees, expand=True, resample=Image.Resampling.BICUBIC)


def paste_center(canvas: Image.Image, layer: Image.Image, center: tuple[float, float]) -> None:
    x = round(center[0] - layer.width / 2)
    y = round(center[1] - layer.height / 2)
    canvas.alpha_composite(layer, (x, y))


def quad_points(
    start: tuple[float, float],
    control: tuple[float, float],
    end: tuple[float, float],
    steps: int = 18,
) -> list[tuple[float, float]]:
    points = []
    for index in range(steps + 1):
        t = index / steps
        mt = 1 - t
        x = mt * mt * start[0] + 2 * mt * t * control[0] + t * t * end[0]
        y = mt * mt * start[1] + 2 * mt * t * control[1] + t * t * end[1]
        points.append((x, y))
    return points


def draw_arm(
    draw: ImageDraw.ImageDraw,
    start: tuple[float, float],
    control: tuple[float, float],
    end: tuple[float, float],
) -> None:
    points = quad_points(start, control, end)
    draw.line(points, fill=DARK, width=22, joint="curve")
    draw.line(points, fill=ARM_FILL, width=13, joint="curve")
    highlight = [(x - 7, y - 7) for x, y in points[3:13]]
    draw.line(highlight, fill=HIGHLIGHT, width=4, joint="curve")


def draw_clap_marks(draw: ImageDraw.ImageDraw, strength: float) -> None:
    if strength < 0.15:
        return
    width = max(3, round(8 * strength))
    marks = [
        ((512, 624), (512, 574)),
        ((472, 632), (438, 596)),
        ((552, 632), (588, 596)),
    ]
    for start, end in marks:
        draw.line([start, end], fill=CLAP, width=width)


def compose_frame(
    base: Image.Image,
    right_hand: Image.Image,
    left_hand: Image.Image,
    phase: float,
    clap_strength: float,
) -> Image.Image:
    frame = Image.new("RGBA", base.size, (0, 0, 0, 0))
    arm_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    top_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    arm_draw = ImageDraw.Draw(arm_layer)
    top_draw = ImageDraw.Draw(top_layer)

    ease = phase * phase * (3 - 2 * phase)
    lift = sin(ease * 3.14159)
    left_center = (386 + 102 * ease, 712 - 58 * lift)
    right_center = (638 - 102 * ease, 712 - 58 * lift)

    draw_arm(arm_draw, (368, 654), (398 + 84 * ease, 696 - 42 * lift), (left_center[0] - 8, left_center[1] + 28))
    draw_arm(arm_draw, (624, 654), (624 - 84 * ease, 696 - 42 * lift), (right_center[0] + 8, right_center[1] + 28))

    draw_clap_marks(top_draw, clap_strength)
    frame.alpha_composite(base)
    frame.alpha_composite(arm_layer)
    frame.alpha_composite(top_layer)

    left = rotate_layer(left_hand, 10 - 24 * ease)
    right = rotate_layer(right_hand, -10 + 24 * ease)
    paste_center(frame, left, left_center)
    paste_center(frame, right, right_center)
    return frame


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAME_DIR.mkdir(parents=True, exist_ok=True)

    source = Image.open(SOURCE).convert("RGBA")
    base = erase_regions(source)
    right_hand = crop_hand(source)
    left_hand = ImageOps.mirror(right_hand)

    sequence = [
        (0.00, 0.00),
        (0.38, 0.00),
        (0.88, 1.00),
        (0.58, 0.35),
        (0.18, 0.00),
        (0.92, 0.90),
        (0.45, 0.15),
        (0.00, 0.00),
    ]

    frames = []
    for index, (phase, clap_strength) in enumerate(sequence):
        frame = compose_frame(base, right_hand, left_hand, phase, clap_strength)
        frame = frame.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS)
        frame_path = FRAME_DIR / f"hatch-clap-{index:02d}.png"
        frame.save(frame_path)
        frame.save(OUT_DIR / f"hatch-clap-frame-{index:02d}.png")
        frames.append(frame)

    strip = Image.new("RGBA", (OUTPUT_SIZE * FRAME_COUNT, OUTPUT_SIZE), (0, 0, 0, 0))
    strip_preview = Image.new("RGBA", strip.size, (244, 240, 230, 255))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * OUTPUT_SIZE, 0))
        strip_preview.alpha_composite(frame, (index * OUTPUT_SIZE, 0))
    strip.save(OUT_DIR / "hatch-clap-sprite-strip.png")
    strip_preview.save(ROOT / "tmp" / "rive-preview" / "hatch-clap-sprite-strip-preview.png")

    preview_frames = []
    for frame in frames:
        bg = Image.new("RGBA", frame.size, (244, 240, 230, 255))
        bg.alpha_composite(frame)
        preview_frames.append(bg.convert("P", palette=Image.Palette.ADAPTIVE))

    preview_frames[0].save(
        OUT_DIR / "hatch-clap-preview.gif",
        save_all=True,
        append_images=preview_frames[1:],
        duration=[95, 75, 85, 80, 95, 85, 90, 130],
        loop=0,
        disposal=2,
    )

    print(f"Wrote {OUT_DIR / 'hatch-clap-sprite-strip.png'}")
    print(f"Wrote {OUT_DIR / 'hatch-clap-preview.gif'}")


if __name__ == "__main__":
    main()
