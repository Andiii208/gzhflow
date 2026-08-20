#!/usr/bin/env python3
"""Preserve resolution while enforcing one grid, a bounded palette, and CRT warp.

Adapted from TaiT-tt/tait-crt-interface-skill/scripts/finalize_crt.py (MIT-style).
Changes vs upstream:
  - Signature is OPTIONAL (--signature). Default: no signature drawn at all.
    (Upstream hard-locks the brand string "tait-crt-interface-skill".)
  - 5x7 pixel font extended to full lowercase a-z, digits 0-9, space, hyphen.
  - All quantization / checkerboard / barrel-warp / scanline logic unchanged.
"""

from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image


SHADOW_CUTOFF = 0.36
LIGHT_CUTOFF = 0.64
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
SIGNATURE_CHARSET = set("abcdefghijklmnopqrstuvwxyz0123456789- ")
PIXEL_FONT_5X7 = {
    # 7 rows each: top spacer + 5 glyph rows + bottom spacer (upstream format)
    " ": ("00000", "00000", "00000", "00000", "00000", "00000", "00000"),
    "-": ("00000", "00000", "00000", "11111", "00000", "00000", "00000"),
    "a": ("00000", "01110", "00001", "01111", "10001", "01111", "00000"),
    "b": ("00000", "10000", "10110", "11001", "10001", "11110", "00000"),
    "c": ("00000", "01110", "10000", "10000", "10000", "01110", "00000"),
    "d": ("00000", "00001", "01101", "10011", "10001", "01111", "00000"),
    "e": ("00000", "01110", "10001", "11111", "10000", "01110", "00000"),
    "f": ("00000", "00110", "01001", "01000", "11100", "01000", "00000"),
    "g": ("00000", "01110", "10001", "01111", "00001", "01110", "00000"),
    "h": ("00000", "10000", "10110", "11001", "10001", "10001", "00000"),
    "i": ("00100", "00000", "01100", "00100", "00100", "01110", "00000"),
    "j": ("00000", "00110", "00010", "00010", "10010", "01100", "00000"),
    "k": ("00000", "10010", "10100", "11000", "10100", "10010", "00000"),
    "l": ("01100", "00100", "00100", "00100", "00100", "01110", "00000"),
    "m": ("00000", "00000", "11010", "10101", "10101", "10101", "00000"),
    "n": ("00000", "00000", "11010", "10101", "10101", "10101", "00000"),
    "o": ("00000", "01110", "10001", "10001", "10001", "01110", "00000"),
    "p": ("00000", "10110", "11001", "10001", "11110", "10000", "00000"),
    "q": ("00000", "01101", "10011", "10001", "01111", "00001", "00000"),
    "r": ("00000", "10110", "11001", "10000", "10000", "10000", "00000"),
    "s": ("00000", "01111", "10000", "01110", "00001", "11110", "00000"),
    "t": ("01000", "11100", "01000", "01000", "01000", "01110", "00000"),
    "u": ("00000", "10001", "10001", "10001", "10011", "01101", "00000"),
    "v": ("00000", "10001", "10001", "10001", "01010", "00100", "00000"),
    "w": ("00000", "10001", "10101", "10101", "10101", "11011", "00000"),
    "x": ("00000", "10001", "01010", "00100", "01010", "10001", "00000"),
    "y": ("00000", "10001", "10001", "01111", "00001", "01110", "00000"),
    "z": ("00000", "11111", "00010", "00100", "01000", "11111", "00000"),
    "0": ("00000", "01110", "10011", "10101", "11001", "01110", "00000"),
    "1": ("00000", "00100", "01100", "00100", "00100", "01110", "00000"),
    "2": ("00000", "01110", "00001", "00010", "00100", "11111", "00000"),
    "3": ("00000", "01110", "00001", "01110", "00001", "01110", "00000"),
    "4": ("00000", "00010", "00110", "01010", "11111", "00010", "00000"),
    "5": ("00000", "11111", "10000", "11110", "00001", "11110", "00000"),
    "6": ("00000", "01110", "10000", "11110", "10001", "01110", "00000"),
    "7": ("00000", "11111", "00001", "00010", "00100", "00100", "00000"),
    "8": ("00000", "01110", "10001", "01110", "10001", "01110", "00000"),
    "9": ("00000", "01110", "10001", "01111", "00001", "01110", "00000"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply outer-edge CRT warp and palette-bound grid quantization without resizing."
    )
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--palette",
        required=True,
        help="Comma-separated list of 2-5 #rrggbb colors.",
    )
    parser.add_argument(
        "--polarity",
        choices=("positive", "negative", "preserve"),
        default="preserve",
        help="positive=light-field, negative=dark-field, preserve=keep source polarity.",
    )
    parser.add_argument(
        "--edge-warp",
        type=float,
        default=0.12,
        help="Nearest-cell radial displacement inside the outer 10%% band.",
    )
    parser.add_argument(
        "--grid-cell",
        type=int,
        default=0,
        help="Shared subject/UI/text cell size in pixels; 0 selects about short-edge/384.",
    )
    parser.add_argument(
        "--signature",
        type=str,
        default="",
        help="Optional pixel-font signature text (lowercase a-z, 0-9, space, hyphen). "
        "Empty = no signature. Default: no signature.",
    )
    return parser.parse_args()


def parse_palette(value: str) -> tuple[tuple[int, int, int], ...]:
    parts = [part.strip() for part in value.split(",") if part.strip()]
    if not 2 <= len(parts) <= 5:
        raise ValueError("--palette requires 2-5 comma-separated #rrggbb colors.")
    if any(not HEX_COLOR.fullmatch(part) for part in parts):
        raise ValueError("Every palette color must use #rrggbb syntax.")
    colors = tuple(tuple(bytes.fromhex(part[1:])) for part in parts)
    if len(set(colors)) != len(colors):
        raise ValueError("Palette colors must be unique.")
    return colors


def to_hex(color: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % color


def luminance(color: tuple[int, int, int]) -> float:
    red, green, blue = color
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def color_distance_squared(
    first: tuple[int, int, int], second: tuple[int, int, int]
) -> int:
    return sum((a - b) ** 2 for a, b in zip(first, second))


def endpoint_roles(
    palette: tuple[tuple[int, int, int], ...]
) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    ordered = sorted(palette, key=luminance)
    return ordered[0], ordered[-1]


def projection_to_light(
    rgb: tuple[int, int, int],
    dark: tuple[int, int, int],
    light: tuple[int, int, int],
) -> float:
    delta = tuple(high - low for high, low in zip(light, dark))
    denominator = sum(component * component for component in delta)
    if denominator == 0:
        return 0.0
    numerator = sum(
        (value - low) * component
        for value, low, component in zip(rgb, dark, delta)
    )
    return max(0.0, min(1.0, numerator / denominator))


def source_coordinate(
    x: int, y: int, width: int, height: int, strength: float
) -> tuple[int, int] | None:
    nx = 2.0 * x / max(1, width - 1) - 1.0
    ny = 2.0 * y / max(1, height - 1) - 1.0
    edge = max(abs(nx), abs(ny))
    band = max(0.0, min(1.0, (edge - 0.8) / 0.2))
    radial = nx * nx + ny * ny
    factor = 1.0 + max(0.0, strength) * band * band * radial
    sx = round((nx * factor + 1.0) * (width - 1) / 2.0)
    sy = round((ny * factor + 1.0) * (height - 1) / 2.0)
    if 0 <= sx < width and 0 <= sy < height:
        return sx, sy
    return None


def resolve_grid_cell(width: int, height: int, requested: int) -> int:
    if requested < 0:
        raise ValueError("--grid-cell must be 0 or a positive integer.")
    if requested > 0:
        return requested
    return max(1, round(min(width, height) / 384))


def sampled_average_rgb(
    pixels,
    coordinate: tuple[int, int] | None,
    width: int,
    height: int,
    cell: int,
    outside_color: tuple[int, int, int],
) -> tuple[int, int, int]:
    if coordinate is None:
        return outside_color
    sx, sy = coordinate
    low = cell // 2
    high = cell - low
    x0 = max(0, sx - low)
    y0 = max(0, sy - low)
    x1 = min(width, sx + high)
    y1 = min(height, sy + high)
    totals = [0, 0, 0]
    count = 0
    for sample_y in range(y0, y1):
        for sample_x in range(x0, x1):
            sample = pixels[sample_x, sample_y]
            for channel in range(3):
                totals[channel] += sample[channel]
            count += 1
    return tuple(round(total / max(1, count)) for total in totals)


def choose_cell_color(
    rgb: tuple[int, int, int],
    palette: tuple[tuple[int, int, int], ...],
    dark: tuple[int, int, int],
    light: tuple[int, int, int],
    grid_x: int,
    grid_y: int,
) -> tuple[tuple[int, int, int], bool]:
    accents = tuple(color for color in palette if color not in (dark, light))
    if accents:
        accent = min(accents, key=lambda color: color_distance_squared(rgb, color))
        accent_distance = color_distance_squared(rgb, accent)
        endpoint_distance = min(
            color_distance_squared(rgb, dark), color_distance_squared(rgb, light)
        )
        if accent_distance < 0.72 * endpoint_distance:
            return accent, False

    amount = projection_to_light(rgb, dark, light)
    if amount <= SHADOW_CUTOFF:
        return dark, False
    if amount >= LIGHT_CUTOFF:
        return light, False
    checker = light if (grid_x + grid_y) % 2 == 0 else dark
    return checker, True


def apply_surface_scanlines(
    result: Image.Image,
    period: int,
    light: tuple[int, int, int],
    dark: tuple[int, int, int],
) -> int:
    pixels = result.load()
    width, height = result.size
    changed = 0
    for y in range(period - 1, height, period):
        for x in range(width):
            if pixels[x, y] == light:
                pixels[x, y] = dark
                changed += 1
    return changed


def render_optional_signature(
    result: Image.Image,
    cell: int,
    polarity: str,
    light: tuple[int, int, int],
    dark: tuple[int, int, int],
    signature: str,
) -> dict[str, object] | None:
    """Render an optional 5x7 pixel-font signature in the upper-right title-bar
    zone. Returns None when signature is empty (default, no branding)."""
    if not signature:
        return None
    width, height = result.size
    advance = 6 * cell
    text_width = (len(signature) * 6 - 1) * cell
    text_height = 7 * cell
    right_inset = max(3 * cell, round(width * 0.04))
    target_y = round(height * 0.03)
    y0 = max(cell, (target_y // cell) * cell)
    x0 = max(cell, width - text_width - right_inset)
    background = dark if polarity == "negative" else light
    foreground = light if polarity == "negative" else dark
    result.paste(
        background,
        (
            max(0, x0 - cell),
            max(0, y0 - cell),
            min(width, x0 + text_width + cell),
            min(height, y0 + text_height + cell),
        ),
    )
    for index, character in enumerate(signature):
        glyph = PIXEL_FONT_5X7[character]
        glyph_x = x0 + index * advance
        for row, bits in enumerate(glyph):
            for column, bit in enumerate(bits):
                if bit == "1":
                    px = glyph_x + column * cell
                    py = y0 + row * cell
                    if px < width and py < height:
                        result.paste(
                            foreground,
                            (px, py, min(width, px + cell), min(height, py + cell)),
                        )
    return {
        "text": signature,
        "position": "upper_right_title_bar",
        "locked": False,
        "pixel_font": "custom_5x7_shared_grid",
    }


def finalize(
    source: Path,
    destination: Path,
    palette: tuple[tuple[int, int, int], ...],
    polarity: str,
    edge_warp: float,
    requested_grid_cell: int,
    signature: str = "",
) -> dict[str, object]:
    if destination.suffix.lower() != ".png":
        raise ValueError("Output must be PNG to preserve exact colors.")
    if source.resolve() == destination.resolve():
        raise ValueError("Output must be a new file; do not overwrite the source.")
    if destination.exists():
        raise FileExistsError(f"Output already exists: {destination}")

    image = Image.open(source).convert("RGB")
    width, height = image.size
    source_pixels = image.load()
    dark, light = endpoint_roles(palette)
    corners = (
        source_pixels[0, 0],
        source_pixels[width - 1, 0],
        source_pixels[0, height - 1],
        source_pixels[width - 1, height - 1],
    )
    corner_average = tuple(round(sum(c[i] for c in corners) / 4) for i in range(3))
    preserve_outside = min((dark, light), key=lambda c: color_distance_squared(corner_average, c))
    outside_color = light if polarity == "positive" else dark if polarity == "negative" else preserve_outside
    result = Image.new("RGB", image.size, outside_color)
    grid_cell = resolve_grid_cell(width, height, requested_grid_cell)

    checker_area = 0
    for y0 in range(0, height, grid_cell):
        for x0 in range(0, width, grid_cell):
            x1 = min(width, x0 + grid_cell)
            y1 = min(height, y0 + grid_cell)
            center_x = min(width - 1, x0 + grid_cell // 2)
            center_y = min(height - 1, y0 + grid_cell // 2)
            coordinate = source_coordinate(center_x, center_y, width, height, edge_warp)
            average = sampled_average_rgb(
                source_pixels,
                coordinate,
                width,
                height,
                grid_cell,
                outside_color,
            )
            color, is_checker = choose_cell_color(
                average,
                palette,
                dark,
                light,
                x0 // grid_cell,
                y0 // grid_cell,
            )
            result.paste(color, (x0, y0, x1, y1))
            if is_checker:
                checker_area += (x1 - x0) * (y1 - y0)

    counts = result.getcolors(maxcolors=len(palette) + 1) or []
    counts_by_color = {color: count for count, color in counts}
    light_count = counts_by_color.get(light, 0)
    dark_count = counts_by_color.get(dark, 0)
    should_invert = (polarity == "positive" and dark_count > light_count) or (
        polarity == "negative" and light_count > dark_count
    )
    if should_invert:
        pixels = result.load()
        for y in range(height):
            for x in range(width):
                if pixels[x, y] == light:
                    pixels[x, y] = dark
                elif pixels[x, y] == dark:
                    pixels[x, y] = light
        light_count, dark_count = dark_count, light_count

    resolved_polarity = "positive" if light_count >= dark_count else "negative"
    scanline_period = max(6, grid_cell * 3)
    apply_surface_scanlines(result, scanline_period, light, dark)
    signature_report = render_optional_signature(
        result, grid_cell, resolved_polarity, light, dark, signature
    )

    destination.parent.mkdir(parents=True, exist_ok=True)
    result.save(destination, format="PNG", optimize=False)

    verified = Image.open(destination).convert("RGB")
    colors = verified.getcolors(maxcolors=len(palette) + 1)
    if colors is None:
        raise RuntimeError("Final image contains more colors than the resolved palette.")
    colors_used = {color for _, color in colors}
    allowed = set(palette)
    if verified.size != image.size:
        raise RuntimeError(f"Resolution changed: {image.size} -> {verified.size}")
    if not colors_used.issubset(allowed):
        raise RuntimeError(f"Unexpected colors: {colors_used - allowed}")
    if not {light, dark}.issubset(colors_used):
        raise RuntimeError("Final image must retain both contrast endpoints.")
    counts_by_color = {color: count for count, color in colors}

    return {
        "path": str(destination),
        "size": verified.size,
        "source_size": image.size,
        "resolved_palette": [to_hex(color) for color in palette],
        "colors_used": [to_hex(color) for color in sorted(colors_used, key=luminance)],
        "darkest": to_hex(dark),
        "lightest": to_hex(light),
        "polarity": (
            "positive"
            if counts_by_color.get(light, 0) >= counts_by_color.get(dark, 0)
            else "negative"
        ),
        "edge_warp_band": "outer_10_percent",
        "edge_warp_strength": edge_warp,
        "barrel_curve": "mandatory_radial_outer_band",
        "halftone": "alternating_darkest_lightest_checkerboard",
        "checkerboard_area_pixels": checker_area,
        "checkerboard_canvas_share": round(checker_area / (width * height), 4),
        "global_grid_cell_px": grid_cell,
        "global_grid_dimensions": (
            math.ceil(width / grid_cell),
            math.ceil(height / grid_cell),
        ),
        "grid_scope": "subject_windows_text_icons_accents_shared",
        "surface_scanline_period_px": scanline_period,
        "signature": signature_report,
    }


def main() -> None:
    args = parse_args()
    if args.signature:
        bad = set(args.signature) - SIGNATURE_CHARSET
        if bad:
            raise ValueError(
                f"--signature contains unsupported characters: {sorted(bad)} "
                "(allowed: lowercase a-z, 0-9, space, hyphen)"
            )
    print(
        finalize(
            args.input,
            args.output,
            parse_palette(args.palette),
            args.polarity,
            args.edge_warp,
            args.grid_cell,
            args.signature,
        )
    )


if __name__ == "__main__":
    main()
