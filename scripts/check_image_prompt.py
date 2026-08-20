#!/usr/bin/env python3
"""gzhflow 配图 prompt 质检门（image prompt quality gate）。

检查四段式编译出的图生 prompt 是否满足「质感底线」：
  1. 必需项：纸感词（cold-pressed paper / paper 类）与纹理词（brush stroke 等）显式出现
  2. 规避项：硬规避词（命中即 FAIL）与软规避词（命中即 WARN）
  3. 规避写法：规避词必须「avoid X」成串（每个规避词前带 avoid），
     `_is_avoided` 只认 avoid/不要/no 前缀与规避词连续相邻

用法:
    echo "prompt内容" | python scripts/check_image_prompt.py
    python scripts/check_image_prompt.py <prompt文件>
退出码: 0 = PASS（含 WARN，WARN 不阻断）, 1 = FAIL（硬规避或必需项缺失）
"""
import argparse
import re
import sys

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ============ 必需词（缺失即 FAIL） ============
REQUIRED_PATTERNS = [
    ("纸感词", re.compile(r"cold-pressed paper|paper texture|paper grain|aged paper|washi paper|纸纹|纸感", re.I)),
    ("纹理词", re.compile(r"brush stroke|wet-on-wet|watercolor edge|granulating|晕染|笔触|溅墨", re.I)),
]

# ============ 硬规避（未成串规避则 FAIL） ============
HARD_AVOID = [
    "flat vector", "minimalist line art", "charcoal", "gold foil", "gallery poster",
    "vivid gradient", "glassmorphism", "neon glow", "3D render", "anime style",
    "swiss grid", "matte poster", "high saturation", "clean white background",
    "photorealistic", "stock photo", "cinematic lighting", "depth of field",
]

# ============ 软规避（未成串规避则 WARN） ============
SOFT_AVOID = [
    "gradient", "drop shadow", "bokeh", "vector", "logo", "text watermark",
]

# 规避前缀：只认「avoid / 不要 / no 」与规避词连续相邻（子串匹配）
AVOID_PREFIX_RE = re.compile(r"(avoid\s+|不要\s+|no\s+)", re.I)


def _is_avoided(word: str, text: str) -> bool:
    """规避词是否已被成串规避（avoid X / 不要 X / no X）。"""
    for m in AVOID_PREFIX_RE.finditer(text):
        # 前缀后紧跟 0-3 个词内包含规避词（子串匹配，连续相邻）
        tail = text[m.end():m.end() + len(word) + 12]
        if word.lower() in tail.lower():
            return True
    # 也接受「avoid A; avoid B」分号分隔写法（每个词独立带前缀）
    return False


def check(text: str):
    problems = []
    warns = []

    # 1. 必需词
    for name, pat in REQUIRED_PATTERNS:
        if not pat.search(text):
            problems.append(f"[FAIL] 必需项缺失: {name}（prompt 必须显式包含）")

    # 2. 硬规避
    for word in HARD_AVOID:
        if word.lower() in text.lower() and not _is_avoided(word, text):
            problems.append(f"[FAIL] 硬规避词未成串规避: 「{word}」（须写 avoid {word}）")

    # 3. 软规避
    for word in SOFT_AVOID:
        if word.lower() in text.lower() and not _is_avoided(word, text):
            warns.append(f"[WARN] 软规避词: 「{word}」（能改则改）")

    # 4. 比例声明
    if not re.search(r"16:9|1:1|2\.35:1|横构图|宽幅", text, re.I):
        warns.append("[WARN] 未声明画布比例（建议显式写 16:9 / 1:1）")

    return problems, warns


def main():
    ap = argparse.ArgumentParser(description="gzhflow 配图 prompt 质检门")
    ap.add_argument("path", nargs="?", help="prompt 文件路径（缺省读 stdin）")
    args = ap.parse_args()

    if args.path:
        text = open(args.path, encoding="utf-8").read()
    else:
        text = sys.stdin.read()

    problems, warns = check(text)

    if warns:
        print("⚠️  WARN:")
        for w in warns:
            print("   ", w)

    if problems:
        print("🔴 FAIL:")
        for p in problems:
            print("   ", p)
        sys.exit(1)

    if warns:
        print("✅ PASS（含 WARN，不阻断，建议优化）")
    else:
        print("✅ PASS")
    sys.exit(0)


if __name__ == "__main__":
    main()
