from __future__ import annotations

import json
import math
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_CANDIDATES = [
    Path("/Users/sandeep/Documents/hackproduct-marketing/mascot.png"),
    ROOT / "public" / "images" / "hatch" / "hatch-official-mascot.png",
    ROOT / "public" / "images" / "hatch-mascot.png",
]

APP_OUT = ROOT / "public" / "mascots" / "hatch" / "app"
CODEX_OUT = ROOT / "public" / "mascots" / "hatch" / "codex"
CODEX_PACKAGE_OUT = Path.home() / ".codex" / "pets" / "hackproduct-hatch"

CELL_W = 192
CELL_H = 208
APP_FRAMES = 8
APP_STATES = [
    "idle",
    "listening",
    "thinking",
    "speaking",
    "celebrating",
    "waiting",
    "failed",
    "clapping",
    "interview-listening",
    "interview-speaking",
]

CODEX_ROWS = [
    ("idle", 6),
    ("running-right", 8),
    ("running-left", 8),
    ("waving", 4),
    ("jumping", 5),
    ("failed", 8),
    ("waiting", 6),
    ("running", 6),
    ("review", 6),
]

GREEN_DARK = (27, 76, 51, 255)
GREEN_MID = (70, 119, 83, 255)
GREEN_LIGHT = (119, 173, 129, 255)
CREAM = (249, 245, 234, 255)
CHAIR_DARK = (46, 80, 58, 255)
CHAIR_FILL = (76, 115, 82, 255)
HEADPHONE = (28, 67, 47, 255)


@dataclass(frozen=True)
class PlacedSprite:
    image: Image.Image
    box: tuple[int, int, int, int]


def source_path() -> Path:
    for candidate in SOURCE_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("Could not find the Hatch mascot PNG.")


def clean_transparency(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = []
    for r, g, b, a in rgba.getdata():
        data.append((0, 0, 0, 0) if a == 0 else (r, g, b, a))
    rgba.putdata(data)
    return rgba


def crop_to_alpha(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return image
    return image.crop(bbox)


def paste_sprite(
    canvas: Image.Image,
    source: Image.Image,
    *,
    scale: float = 1.0,
    dx: float = 0,
    dy: float = 0,
    max_w: int = 162,
    max_h: int = 190,
    bottom_pad: int = 8,
    pre: Callable[[Image.Image], Image.Image] | None = None,
) -> PlacedSprite:
    sprite = crop_to_alpha(source)
    if pre:
        sprite = pre(sprite)

    target_w = max(1, round(max_w * scale))
    target_h = max(1, round(max_h * scale))
    ratio = min(target_w / sprite.width, target_h / sprite.height)
    size = (max(1, round(sprite.width * ratio)), max(1, round(sprite.height * ratio)))
    sprite = sprite.resize(size, Image.Resampling.LANCZOS)

    x = round((CELL_W - sprite.width) / 2 + dx)
    y = round(CELL_H - sprite.height - bottom_pad + dy)
    canvas.alpha_composite(sprite, (x, y))
    return PlacedSprite(sprite, (x, y, x + sprite.width, y + sprite.height))


def point(box: tuple[int, int, int, int], rx: float, ry: float) -> tuple[float, float]:
    x0, y0, x1, y1 = box
    return (x0 + (x1 - x0) * rx, y0 + (y1 - y0) * ry)


def draw_headphones(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    # The graduation cap owns the top silhouette, so keep the headset tucked to
    # the side shell instead of drawing a large band over the cap.
    for rx in (0.13, 0.87):
        cx, cy = point(box, rx, 0.44)
        stem_top = point(box, 0.27 if rx < 0.5 else 0.73, 0.31)
        draw.line([stem_top, (cx, cy - 14)], fill=HEADPHONE, width=4)
        draw.rounded_rectangle(
            (cx - 7, cy - 15, cx + 7, cy + 15),
            radius=7,
            fill=GREEN_MID,
            outline=HEADPHONE,
            width=3,
        )
    mic_start = point(box, 0.87, 0.53)
    mic_end = point(box, 0.73, 0.56)
    draw.line([mic_start, mic_end], fill=HEADPHONE, width=4)
    draw.ellipse((mic_end[0] - 3, mic_end[1] - 3, mic_end[0] + 3, mic_end[1] + 3), fill=HEADPHONE)


def draw_chair(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    w = x1 - x0
    h = y1 - y0
    back = (x0 + w * 0.2, y0 + h * 0.56, x1 - w * 0.2, y0 + h * 0.84)
    seat = (x0 + w * 0.08, y0 + h * 0.76, x1 - w * 0.08, y0 + h * 0.91)
    draw.rounded_rectangle(tuple(round(v) for v in back), radius=18, fill=CHAIR_DARK)
    inset_back = (back[0] + 6, back[1] + 7, back[2] - 6, back[3] - 6)
    draw.rounded_rectangle(tuple(round(v) for v in inset_back), radius=14, fill=CHAIR_FILL)
    draw.rounded_rectangle(tuple(round(v) for v in seat), radius=16, fill=CHAIR_DARK)
    inset_seat = (seat[0] + 7, seat[1] + 5, seat[2] - 7, seat[3] - 6)
    draw.rounded_rectangle(tuple(round(v) for v in inset_seat), radius=12, fill=(92, 133, 96, 255))
    leg_y0 = seat[3] - 2
    leg_y1 = min(CELL_H - 3, seat[3] + h * 0.2)
    for rx in (0.28, 0.72):
        lx = x0 + w * rx
        draw.line([(lx, leg_y0), (lx - w * 0.08, leg_y1)], fill=CHAIR_DARK, width=5)


def draw_mouth(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], openness: float) -> None:
    cx, cy = point(box, 0.5, 0.48)
    width = (box[2] - box[0]) * 0.22
    height = 5 + 10 * openness
    draw.rounded_rectangle((cx - width / 2 - 2, cy - 4, cx + width / 2 + 2, cy + height + 3), radius=9, fill=CREAM)
    draw.ellipse((cx - width / 2, cy - 1, cx + width / 2, cy + height), fill=GREEN_DARK)
    if openness > 0.35:
        draw.pieslice((cx - width / 2 + 3, cy + 1, cx + width / 2 - 3, cy + height * 0.72), 0, 180, fill=(255, 255, 255, 245))


def draw_closed_smile(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    cx, cy = point(box, 0.5, 0.49)
    width = (box[2] - box[0]) * 0.25
    draw.rounded_rectangle((cx - width / 2 - 4, cy - 9, cx + width / 2 + 4, cy + 14), radius=9, fill=CREAM)
    draw.arc((cx - width / 2, cy - 9, cx + width / 2, cy + 15), start=22, end=158, fill=GREEN_DARK, width=4)


def draw_frown(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    cx, cy = point(box, 0.5, 0.49)
    width = (box[2] - box[0]) * 0.24
    draw.rounded_rectangle((cx - width / 2 - 4, cy - 8, cx + width / 2 + 4, cy + 14), radius=9, fill=CREAM)
    draw.arc((cx - width / 2, cy - 1, cx + width / 2, cy + 23), start=205, end=335, fill=GREEN_DARK, width=4)
    left_brow = point(box, 0.41, 0.38)
    right_brow = point(box, 0.59, 0.38)
    draw.line([(left_brow[0] - 8, left_brow[1] - 2), (left_brow[0] + 6, left_brow[1] + 3)], fill=GREEN_DARK, width=3)
    draw.line([(right_brow[0] - 6, right_brow[1] + 3), (right_brow[0] + 8, right_brow[1] - 2)], fill=GREEN_DARK, width=3)


def draw_attached_sweat(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    cx, cy = point(box, 0.78, 0.31)
    draw.ellipse((cx - 5, cy - 3, cx + 6, cy + 10), fill=(126, 190, 166, 230), outline=GREEN_DARK, width=2)


def body_preprocess_for_failed(sprite: Image.Image) -> Image.Image:
    muted = ImageEnhance.Color(sprite).enhance(0.72)
    return ImageEnhance.Brightness(muted).enhance(0.88)


def render_plain_state(source: Image.Image, state: str, frame: int) -> Image.Image:
    t = frame / APP_FRAMES
    bob = math.sin(t * math.tau)
    canvas = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    scale = 0.95
    dx = 0.0
    dy = bob * 1.8
    bottom_pad = 8
    pre = None

    if state == "thinking":
        dx = math.sin(t * math.tau + 0.4) * 1.5
        dy = bob * 1.2
    elif state == "celebrating":
        dy = -8 * max(0, math.sin(t * math.tau)) + 2 * math.cos(t * math.tau)
    elif state == "waiting":
        dy = math.sin(t * math.tau * 0.5) * 1.4
    elif state == "failed":
        dy = 5 + abs(bob) * 1.4
        scale = 0.93
        pre = body_preprocess_for_failed

    placed = paste_sprite(canvas, source, scale=scale, dx=dx, dy=dy, bottom_pad=bottom_pad, pre=pre)

    if state == "listening":
        draw_headphones(draw, placed.box)
        draw_closed_smile(draw, placed.box)
    elif state == "speaking":
        openness = 0.25 + 0.75 * abs(math.sin(t * math.tau * 2))
        draw_mouth(draw, placed.box, openness)
    elif state == "failed":
        draw_frown(draw, placed.box)
        draw_attached_sweat(draw, placed.box)

    return clean_transparency(canvas)


def render_interview_state(source: Image.Image, state: str, frame: int) -> Image.Image:
    return render_interview_drawn_state(state, frame)


def render_interview_drawn_state(state: str, frame: int) -> Image.Image:
    scale = 4
    canvas = Image.new("RGBA", (CELL_W * scale, CELL_H * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    t = frame / APP_FRAMES
    body_y = math.sin(t * math.tau) * 0.8
    head_y = math.sin(t * math.tau + 0.45) * 1.8
    blink = state == "interview-listening" and frame in (3, 4)
    speaking_open = 0.24 + 0.76 * abs(math.sin(t * math.tau * 2)) if state == "interview-speaking" else 0

    def c(color: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
        return color

    def box(values: tuple[float, float, float, float], y_offset: float = 0) -> tuple[int, int, int, int]:
        x0, y0, x1, y1 = values
        return (
            round(x0 * scale),
            round((y0 + y_offset) * scale),
            round(x1 * scale),
            round((y1 + y_offset) * scale),
        )

    def p(x: float, y: float, y_offset: float = 0) -> tuple[int, int]:
        return (round(x * scale), round((y + y_offset) * scale))

    def rr(values: tuple[float, float, float, float], radius: float, fill, outline=None, width: float = 1, y_offset: float = 0) -> None:
        draw.rounded_rectangle(box(values, y_offset), radius=round(radius * scale), fill=fill, outline=outline, width=round(width * scale))

    def ell(values: tuple[float, float, float, float], fill, outline=None, width: float = 1, y_offset: float = 0) -> None:
        draw.ellipse(box(values, y_offset), fill=fill, outline=outline, width=round(width * scale))

    def line(points: list[tuple[float, float]], fill, width: float = 1, y_offset: float = 0) -> None:
        draw.line([p(x, y, y_offset) for x, y in points], fill=fill, width=round(width * scale), joint="curve")

    def poly(points: list[tuple[float, float]], fill, outline=None, width: float = 1, y_offset: float = 0) -> None:
        scaled = [p(x, y, y_offset) for x, y in points]
        draw.polygon(scaled, fill=fill)
        if outline:
            draw.line([*scaled, scaled[0]], fill=outline, width=round(width * scale), joint="curve")

    body_offset = body_y
    head_offset = head_y

    # Chair sits behind Hatch and stays visually attached to the avatar.
    rr((49, 76, 143, 190), 18, CHAIR_DARK, y_offset=body_offset)
    rr((58, 85, 134, 182), 14, (91, 128, 96, 255), y_offset=body_offset)
    rr((36, 139, 76, 153), 7, CHAIR_DARK, y_offset=body_offset)
    rr((116, 139, 156, 153), 7, CHAIR_DARK, y_offset=body_offset)
    line([(72, 183), (120, 183)], CHAIR_DARK, 6, body_offset)
    line([(96, 183), (96, 199)], CHAIR_DARK, 5, body_offset)
    line([(78, 197), (114, 197)], CHAIR_DARK, 4, body_offset)
    ell((62, 194, 72, 204), CHAIR_DARK, y_offset=body_offset)
    ell((120, 194, 130, 204), CHAIR_DARK, y_offset=body_offset)

    # Body and seated legs.
    rr((61, 116, 131, 176), 26, CREAM, GREEN_DARK, 4, body_offset)
    line([(84, 140), (84, 158)], GREEN_MID, 5, body_offset)
    line([(108, 140), (108, 158)], GREEN_MID, 5, body_offset)
    line([(84, 149), (108, 149)], GREEN_MID, 5, body_offset)
    ell((58, 164, 84, 194), GREEN_DARK, y_offset=body_offset)
    ell((63, 167, 83, 187), GREEN_MID, y_offset=body_offset)
    ell((108, 164, 134, 194), GREEN_DARK, y_offset=body_offset)
    ell((109, 167, 129, 187), GREEN_MID, y_offset=body_offset)

    # Relaxed arms and hands on the chair arms.
    line([(64, 126), (52, 143), (49, 155)], GREEN_DARK, 12, body_offset)
    line([(64, 126), (54, 143), (52, 154)], CREAM, 7, body_offset)
    ell((41, 148, 59, 166), GREEN_DARK, y_offset=body_offset)
    ell((46, 151, 58, 162), GREEN_MID, y_offset=body_offset)
    line([(128, 126), (140, 143), (143, 155)], GREEN_DARK, 12, body_offset)
    line([(128, 126), (138, 143), (140, 154)], CREAM, 7, body_offset)
    ell((133, 148, 151, 166), GREEN_DARK, y_offset=body_offset)
    ell((134, 151, 146, 162), GREEN_MID, y_offset=body_offset)

    # Growth arrow and headset band sit behind the cap/head shell.
    line([(126, 37), (145, 18)], GREEN_LIGHT, 6, head_offset)
    poly([(145, 18), (145, 33), (158, 19)], GREEN_LIGHT, y_offset=head_offset)
    draw.arc(box((34, 34, 158, 119), head_offset), start=188, end=352, fill=HEADPHONE, width=round(5 * scale))

    # Head shell.
    rr((38, 45, 154, 128), 30, GREEN_DARK, y_offset=head_offset)
    rr((45, 52, 147, 122), 25, GREEN_MID, y_offset=head_offset)
    rr((54, 58, 138, 115), 18, CREAM, y_offset=head_offset)

    # Headphones align to side shell rather than covering the face.
    ell((27, 70, 48, 107), HEADPHONE, y_offset=head_offset)
    rr((32, 74, 46, 103), 7, GREEN_MID, HEADPHONE, 2, head_offset)
    ell((144, 70, 165, 107), HEADPHONE, y_offset=head_offset)
    rr((146, 74, 160, 103), 7, GREEN_MID, HEADPHONE, 2, head_offset)
    line([(154, 103), (137, 104), (129, 101)], HEADPHONE, 4, head_offset)
    ell((126, 98, 134, 106), HEADPHONE, y_offset=head_offset)

    # Cap.
    poly([(49, 39), (96, 17), (146, 39), (96, 61)], GREEN_DARK, GREEN_DARK, 2, head_offset)
    poly([(58, 39), (96, 22), (137, 39), (96, 55)], (71, 120, 83, 255), y_offset=head_offset)
    rr((67, 43, 127, 65), 8, GREEN_DARK, y_offset=head_offset)
    rr((72, 47, 122, 63), 7, (74, 126, 88, 255), y_offset=head_offset)

    # Face details.
    if blink:
        line([(70, 85), (82, 87)], GREEN_DARK, 3, head_offset)
        line([(111, 87), (123, 85)], GREEN_DARK, 3, head_offset)
    else:
        ell((68, 78, 83, 94), GREEN_DARK, y_offset=head_offset)
        ell((110, 78, 125, 94), GREEN_DARK, y_offset=head_offset)
        ell((70, 79, 75, 84), (255, 255, 255, 245), y_offset=head_offset)
        ell((112, 79, 117, 84), (255, 255, 255, 245), y_offset=head_offset)
    if speaking_open:
        cx, cy = 96, 100
        width = 26
        height = 7 + 10 * speaking_open
        ell((cx - width / 2, cy - 2, cx + width / 2, cy + height), GREEN_DARK, y_offset=head_offset)
        draw.pieslice(box((cx - width / 2 + 3, cy, cx + width / 2 - 3, cy + height * 0.72), head_offset), 0, 180, fill=(255, 255, 255, 245))
    else:
        draw.arc(box((76, 88, 116, 108), head_offset), start=25, end=155, fill=GREEN_DARK, width=round(3 * scale))

    # Face highlights keep it closer to the soft raster mascot style.
    draw.arc(box((60, 62, 88, 88), head_offset), start=200, end=285, fill=(255, 255, 255, 150), width=round(4 * scale))
    draw.arc(box((113, 62, 137, 88), head_offset), start=255, end=338, fill=(255, 255, 255, 130), width=round(4 * scale))

    return clean_transparency(canvas.resize((CELL_W, CELL_H), Image.Resampling.LANCZOS))


def erase_clap_regions(image: Image.Image, *, draw_side_hands: bool = True) -> Image.Image:
    alpha = image.getchannel("A")
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)

    draw.line([(374, 650), (326, 720), (330, 785)], fill=255, width=78, joint="curve")
    draw.ellipse((268, 690, 408, 824), fill=255)
    draw.polygon([(286, 636), (390, 642), (390, 790), (315, 826), (266, 748)], fill=255)
    draw.line([(626, 650), (674, 596), (736, 526)], fill=255, width=46, joint="curve")
    draw.ellipse((696, 444, 828, 606), fill=255)

    image = image.copy()
    image.putalpha(ImageChops.subtract(alpha, mask))

    repair = Image.new("RGBA", image.size, (0, 0, 0, 0))
    repair_draw = ImageDraw.Draw(repair)

    left_arm = quadratic_points((390, 642), (350, 704), (326, 772), 20)
    right_arm = quadratic_points((626, 642), (666, 704), (690, 772), 20)
    for points in (left_arm, right_arm):
        repair_draw.line(points, fill=GREEN_DARK, width=28, joint="curve")
        repair_draw.line(points, fill=CREAM, width=17, joint="curve")
        repair_draw.line([(x - 7, y - 7) for x, y in points[4:15]], fill=(255, 255, 255, 115), width=4, joint="curve")

    if draw_side_hands:
        for cx, cy, thumb_side in ((322, 784, -1), (694, 784, 1)):
            repair_draw.ellipse((cx - 34, cy - 38, cx + 34, cy + 34), fill=GREEN_DARK)
            repair_draw.ellipse((cx - 25, cy - 30, cx + 24, cy + 23), fill=GREEN_MID)
            repair_draw.ellipse((cx + thumb_side * 23 - 18, cy - 7, cx + thumb_side * 23 + 18, cy + 29), fill=GREEN_DARK)
            repair_draw.ellipse((cx + thumb_side * 23 - 11, cy - 2, cx + thumb_side * 23 + 10, cy + 20), fill=GREEN_MID)
    image.alpha_composite(repair)
    return image


def mitten() -> Image.Image:
    size = 132
    scale = 4
    hand = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(hand)

    def box(values: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
        return tuple(value * scale for value in values)

    for shape in [(28, 34, 108, 116), (14, 62, 58, 106), (44, 18, 104, 64)]:
        draw.ellipse(box(shape), fill=GREEN_DARK)
    for shape in [(36, 42, 100, 108), (22, 70, 52, 98), (50, 26, 96, 58)]:
        draw.ellipse(box(shape), fill=GREEN_MID)
    draw.arc(box((42, 58, 100, 116)), start=204, end=306, fill=(51, 94, 65, 255), width=5 * scale)
    draw.line([(54 * scale, 102 * scale), (44 * scale, 122 * scale)], fill=GREEN_DARK, width=8 * scale)
    return hand.resize((size, size), Image.Resampling.LANCZOS)


def quadratic_points(
    start: tuple[float, float],
    control: tuple[float, float],
    end: tuple[float, float],
    steps: int = 18,
) -> list[tuple[float, float]]:
    points = []
    for index in range(steps + 1):
        t = index / steps
        mt = 1 - t
        points.append(
            (
                mt * mt * start[0] + 2 * mt * t * control[0] + t * t * end[0],
                mt * mt * start[1] + 2 * mt * t * control[1] + t * t * end[1],
            )
        )
    return points


def draw_clap_arm(
    draw: ImageDraw.ImageDraw,
    start: tuple[float, float],
    control: tuple[float, float],
    end: tuple[float, float],
) -> None:
    points = quadratic_points(start, control, end)
    draw.line(points, fill=GREEN_DARK, width=22, joint="curve")
    draw.line(points, fill=CREAM, width=13, joint="curve")
    draw.line([(x - 7, y - 7) for x, y in points[3:13]], fill=(255, 255, 255, 130), width=4, joint="curve")


def paste_center(canvas: Image.Image, layer: Image.Image, center: tuple[float, float]) -> None:
    canvas.alpha_composite(layer, (round(center[0] - layer.width / 2), round(center[1] - layer.height / 2)))


def render_clap_frame(source: Image.Image, frame: int) -> Image.Image:
    sequence = [
        (0.00, 0.00),
        (0.36, 0.00),
        (0.82, 0.90),
        (0.56, 0.35),
        (0.18, 0.00),
        (0.92, 0.80),
        (0.45, 0.15),
        (0.00, 0.00),
    ]
    phase, strength = sequence[frame]
    base = erase_clap_regions(source, draw_side_hands=False)
    right_hand = mitten()
    left_hand = ImageOps.mirror(right_hand)
    frame_image = Image.new("RGBA", source.size, (0, 0, 0, 0))
    arms = Image.new("RGBA", source.size, (0, 0, 0, 0))
    arm_draw = ImageDraw.Draw(arms)

    ease = phase * phase * (3 - 2 * phase)
    lift = math.sin(ease * math.pi)
    left_center = (386 + 102 * ease, 712 - 58 * lift)
    right_center = (638 - 102 * ease, 712 - 58 * lift)
    draw_clap_arm(arm_draw, (368, 654), (398 + 84 * ease, 696 - 42 * lift), (left_center[0] - 8, left_center[1] + 28))
    draw_clap_arm(arm_draw, (624, 654), (624 - 84 * ease, 696 - 42 * lift), (right_center[0] + 8, right_center[1] + 28))

    frame_image.alpha_composite(base)
    frame_image.alpha_composite(arms)
    left = left_hand.rotate(10 - 24 * ease, expand=True, resample=Image.Resampling.BICUBIC)
    right = right_hand.rotate(-10 + 24 * ease, expand=True, resample=Image.Resampling.BICUBIC)
    paste_center(frame_image, left, left_center)
    paste_center(frame_image, right, right_center)

    # Keep the clap contact inside the sprite silhouette rather than as loose marks.
    if strength > 0.1:
        draw = ImageDraw.Draw(frame_image)
        x, y = 512, 626
        draw.ellipse((x - 12 * strength, y - 11 * strength, x + 12 * strength, y + 11 * strength), fill=(197, 169, 104, round(180 * strength)))

    cell = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    placed = paste_sprite(cell, frame_image, scale=0.95)
    return clean_transparency(cell)


def render_state(source: Image.Image, state: str, frame: int) -> Image.Image:
    if state == "clapping":
        return render_clap_frame(source, frame)
    if state.startswith("interview-"):
        return render_interview_state(source, state, frame)
    return render_plain_state(source, state, frame)


def make_app_atlas(source: Image.Image) -> dict[str, dict[str, int | bool | str]]:
    atlas = Image.new("RGBA", (CELL_W * APP_FRAMES, CELL_H * len(APP_STATES)), (0, 0, 0, 0))
    frames_root = APP_OUT / "frames"
    frames_root.mkdir(parents=True, exist_ok=True)
    state_manifest: dict[str, dict[str, int | bool | str]] = {}
    neutral_source = erase_clap_regions(source)

    fps_by_state = {
        "idle": 8,
        "listening": 8,
        "thinking": 8,
        "speaking": 13,
        "celebrating": 11,
        "waiting": 7,
        "failed": 7,
        "clapping": 13,
        "interview-listening": 8,
        "interview-speaking": 13,
    }

    for row, state in enumerate(APP_STATES):
        state_dir = frames_root / state
        state_dir.mkdir(parents=True, exist_ok=True)
        for frame in range(APP_FRAMES):
            cell_source = source if state == "clapping" else neutral_source
            cell = render_state(cell_source, state, frame)
            cell.save(state_dir / f"{frame:02d}.png")
            atlas.alpha_composite(cell, (frame * CELL_W, row * CELL_H))
        state_manifest[state] = {
            "row": row,
            "frames": APP_FRAMES,
            "fps": fps_by_state[state],
            "loop": True,
        }

    APP_OUT.mkdir(parents=True, exist_ok=True)
    clean_transparency(atlas).save(APP_OUT / "spritesheet.webp", lossless=True, quality=100, method=6)
    return state_manifest


def make_codex_atlas(source: Image.Image) -> None:
    atlas = Image.new("RGBA", (CELL_W * 8, CELL_H * 9), (0, 0, 0, 0))
    frames_root = CODEX_OUT / "frames"
    frames_root.mkdir(parents=True, exist_ok=True)
    neutral_source = erase_clap_regions(source)

    def codex_cell(row_name: str, frame: int) -> Image.Image:
        if row_name == "running-right":
            t = frame / 8
            canvas = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
            paste_sprite(canvas, neutral_source, scale=0.93, dx=math.sin(t * math.tau) * 4 + 2, dy=math.sin(t * math.tau * 2) * 2)
            return clean_transparency(canvas)
        if row_name == "running-left":
            t = frame / 8
            canvas = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
            paste_sprite(canvas, neutral_source, scale=0.93, dx=-math.sin(t * math.tau) * 4 - 2, dy=math.sin(t * math.tau * 2) * 2)
            return clean_transparency(canvas)
        if row_name == "waving":
            return render_plain_state(source, "waiting", frame % APP_FRAMES)
        if row_name == "jumping":
            return render_plain_state(neutral_source, "celebrating", frame % APP_FRAMES)
        if row_name == "running":
            return render_plain_state(neutral_source, "thinking", frame % APP_FRAMES)
        if row_name == "review":
            return render_plain_state(neutral_source, "listening", frame % APP_FRAMES)
        return render_state(neutral_source, row_name, frame % APP_FRAMES)

    for row, (name, frame_count) in enumerate(CODEX_ROWS):
        state_dir = frames_root / name
        state_dir.mkdir(parents=True, exist_ok=True)
        for frame in range(frame_count):
            cell = codex_cell(name, frame)
            cell.save(state_dir / f"{frame:02d}.png")
            atlas.alpha_composite(cell, (frame * CELL_W, row * CELL_H))

    CODEX_OUT.mkdir(parents=True, exist_ok=True)
    clean_transparency(atlas).save(CODEX_OUT / "spritesheet.webp", lossless=True, quality=100, method=6)

    pet_json = {
        "id": "hackproduct-hatch",
        "displayName": "HackProduct Hatch",
        "description": "Hatch keeps an eye on product thinking work with the official HackProduct mascot.",
        "spritesheetPath": "spritesheet.webp",
    }
    (CODEX_OUT / "pet.json").write_text(json.dumps(pet_json, indent=2) + "\n")

    CODEX_PACKAGE_OUT.mkdir(parents=True, exist_ok=True)
    shutil.copy2(CODEX_OUT / "spritesheet.webp", CODEX_PACKAGE_OUT / "spritesheet.webp")
    shutil.copy2(CODEX_OUT / "pet.json", CODEX_PACKAGE_OUT / "pet.json")


def save_transparent_gif(frames: list[Image.Image], out_path: Path, duration_ms: int) -> None:
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
        duration=duration_ms,
        loop=0,
        disposal=2,
        transparency=0,
    )


def make_contact_sheet(states: list[str], atlas_path: Path, output_path: Path, rows: int) -> None:
    atlas = Image.open(atlas_path).convert("RGBA")
    label_w = 206
    gutter = 10
    scale = 0.72
    cell_w = round(CELL_W * scale)
    cell_h = round(CELL_H * scale)
    sheet_w = label_w + APP_FRAMES * cell_w + (APP_FRAMES + 1) * gutter
    sheet_h = rows * (cell_h + gutter) + gutter
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (246, 241, 232, 255))
    draw = ImageDraw.Draw(sheet)

    for row, state in enumerate(states):
        y = gutter + row * (cell_h + gutter)
        draw.text((16, y + cell_h / 2 - 7), state, fill=(23, 63, 43, 255))
        for frame in range(APP_FRAMES):
            cell = atlas.crop((frame * CELL_W, row * CELL_H, (frame + 1) * CELL_W, (row + 1) * CELL_H))
            cell = cell.resize((cell_w, cell_h), Image.Resampling.LANCZOS)
            x = label_w + gutter + frame * (cell_w + gutter)
            checker = Image.new("RGBA", (cell_w, cell_h), (233, 226, 213, 255))
            tile = 12
            cdraw = ImageDraw.Draw(checker)
            for cy in range(0, cell_h, tile):
                for cx in range(0, cell_w, tile):
                    if (cx // tile + cy // tile) % 2:
                        cdraw.rectangle((cx, cy, cx + tile - 1, cy + tile - 1), fill=(246, 241, 232, 255))
            checker.alpha_composite(cell)
            sheet.alpha_composite(checker, (x, y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(output_path)


def make_app_previews(state_manifest: dict[str, dict[str, int | bool | str]]) -> None:
    previews = APP_OUT / "previews"
    previews.mkdir(parents=True, exist_ok=True)
    for state in APP_STATES:
        state_dir = APP_OUT / "frames" / state
        frames = [Image.open(state_dir / f"{frame:02d}.png").convert("RGBA") for frame in range(APP_FRAMES)]
        fps = int(state_manifest[state]["fps"])
        save_transparent_gif(frames, previews / f"{state}.gif", round(1000 / fps))


def write_manifest(state_manifest: dict[str, dict[str, int | bool | str]], source: Path) -> None:
    manifest = {
        "id": "hackproduct-hatch-app",
        "displayName": "HackProduct Hatch",
        "description": "Official Hatch mascot state atlas for HackProduct app surfaces.",
        "sourceImage": str(source),
        "spritesheetPath": "/mascots/hatch/app/spritesheet.webp",
        "cellWidth": CELL_W,
        "cellHeight": CELL_H,
        "columns": APP_FRAMES,
        "rows": len(APP_STATES),
        "states": state_manifest,
    }
    (APP_OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def validate_output() -> dict[str, object]:
    results: dict[str, object] = {}
    for name, path, size in [
        ("app", APP_OUT / "spritesheet.webp", (CELL_W * APP_FRAMES, CELL_H * len(APP_STATES))),
        ("codex", CODEX_OUT / "spritesheet.webp", (CELL_W * 8, CELL_H * 9)),
    ]:
        image = Image.open(path).convert("RGBA")
        alpha = image.getchannel("A")
        transparent_rgb_clean = all(
            (r, g, b) == (0, 0, 0)
            for r, g, b, a in image.getdata()
            if a == 0
        )
        results[name] = {
            "path": str(path),
            "size": list(image.size),
            "expectedSize": list(size),
            "sizeOk": image.size == size,
            "hasAlpha": alpha.getextrema()[0] < 255,
            "transparentRgbClean": transparent_rgb_clean,
        }
    (APP_OUT / "validation.json").write_text(json.dumps(results["app"], indent=2) + "\n")
    (CODEX_OUT / "validation.json").write_text(json.dumps(results["codex"], indent=2) + "\n")
    return results


def main() -> None:
    source = source_path()
    canonical = ROOT / "public" / "images" / "hatch" / "hatch-official-mascot.png"
    canonical.parent.mkdir(parents=True, exist_ok=True)
    if canonical.resolve() != source.resolve():
        shutil.copy2(source, canonical)

    source_image = Image.open(source).convert("RGBA")
    state_manifest = make_app_atlas(source_image)
    make_codex_atlas(source_image)
    write_manifest(state_manifest, source)
    make_app_previews(state_manifest)
    make_contact_sheet(APP_STATES, APP_OUT / "spritesheet.webp", APP_OUT / "contact-sheet.png", len(APP_STATES))
    make_contact_sheet([name for name, _ in CODEX_ROWS], CODEX_OUT / "spritesheet.webp", CODEX_OUT / "contact-sheet.png", len(CODEX_ROWS))
    results = validate_output()
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
