#!/usr/bin/env python3
"""gzhflow 图片裁剪工具（crop_image）。

按目标比例中心裁剪并转为 jpg（公众号发布标准）：
  - 封面: 2.35:1 ≈ 900x383
  - 内文: 16:9 ≈ 900x506
  - 分享图: 1:1

依赖: Pillow（可选；无 Pillow 时提示安装）

用法:
    python scripts/crop_image.py <原图> --ratio 2.35:1 -o cover.jpg
    python scripts/crop_image.py <原图> --ratio 16:9 --width 900 -o inline.jpg
    python scripts/crop_image.py <原图> --ratio 1:1 --width 800 -o square.jpg
"""
import argparse
import sys
from pathlib import Path

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def parse_ratio(s: str) -> tuple:
    w, h = s.split(":")
    return float(w), float(h)


def crop_image(src: Path, ratio_w: float, ratio_h: float, width: int, quality: int, out: Path):
    try:
        from PIL import Image
    except ImportError:
        print("❌ 需要 Pillow: pip install Pillow", file=sys.stderr)
        sys.exit(1)

    img = Image.open(src)
    img = img.convert("RGB")  # Wan 系列输出 RGBA PNG，转 jpg 前必须 convert（KeyError: 'RGBA' 坑）
    w, h = img.size
    target = ratio_w / ratio_h

    # 中心裁剪到目标比例
    cur = w / h
    if cur > target:  # 太宽 → 裁左右
        new_w = int(h * target)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif cur < target:  # 太高 → 裁上下
        new_h = int(w / target)
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))

    # 缩放
    if img.width > width:
        new_h = int(img.height * width / img.width)
        img = img.resize((width, new_h), Image.LANCZOS)

    img.save(out, "JPEG", quality=quality)
    print(f"✅ 裁剪完成: {out} ({img.width}x{img.height}, quality={quality})")


def main():
    ap = argparse.ArgumentParser(description="gzhflow 图片裁剪（中心裁剪 + jpg）")
    ap.add_argument("src", help="原图路径")
    ap.add_argument("--ratio", default="16:9", help="目标比例，如 2.35:1 / 16:9 / 1:1")
    ap.add_argument("--width", type=int, default=900, help="输出宽度（默认 900）")
    ap.add_argument("-o", "--output", help="输出路径（默认 <src>_<ratio>.jpg）")
    ap.add_argument("--quality", type=int, default=85, help="jpg 质量（默认 85）")
    args = ap.parse_args()

    src = Path(args.src)
    if not src.exists():
        print(f"❌ 文件不存在: {src}", file=sys.stderr)
        sys.exit(1)

    rw, rh = parse_ratio(args.ratio)
    if args.output:
        out = Path(args.output)
    else:
        out = src.with_name(f"{src.stem}_{args.ratio.replace(':','-')}.jpg")

    crop_image(src, rw, rh, args.width, args.quality, out)


if __name__ == "__main__":
    main()
