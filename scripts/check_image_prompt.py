#!/usr/bin/env python3
"""gzhflow 配图 prompt 质检门（image prompt quality gate）。

检查四段式编译出的图生 prompt 是否满足「质感底线」：
  1. 必需项：材质词——**纸感类**与**肌理类**各至少一个
  2. 规避项：硬规避词（命中即 FAIL）与软规避词（命中即 WARN）
  3. 规避写法：规避词必须「avoid X」成串（每个规避词前带 avoid），
     `_is_avoided` 只认 avoid/不要/no 前缀与规避词连续相邻

⚠️ 材质词按引擎取：加 `--engine <名|路径>` 后，除通用水彩词表外，还会认该引擎
   `texture.paper` / `texture.effects` 里声明的词。**不加 --engine 只认水彩词表**——
   CRT、zine 这类非水彩引擎必须带 --engine，否则会被误判 FAIL。
   （2026-10-12 修：此前词表写死水彩，与「换风格只换引擎文件」的设计自相矛盾）

用法:
    echo "prompt内容" | python scripts/check_image_prompt.py
    python scripts/check_image_prompt.py <prompt文件>
    python scripts/check_image_prompt.py --engine crt <prompt文件>
退出码: 0 = PASS（含 WARN，WARN 不阻断）, 1 = FAIL（硬规避或必需项缺失）, 2 = 引擎文件读不到
"""
import argparse
import re
import sys
from pathlib import Path

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent

# ============ 通用材质词（水彩系；非水彩引擎用 --engine 补自己的词） ============
GENERIC_PAPER = re.compile(
    r"cold-pressed paper|paper texture|paper grain|aged paper|washi paper|"
    r"paper surface|screen surface|surface texture|paper|纸纹|纸感|纸面", re.I)
GENERIC_TEXTURE = re.compile(
    r"brush stroke|wet-on-wet|watercolor edge|granulating|"
    r"scanline|halftone|dithering|cross-hatch|hatching|stipple|"
    r"晕染|笔触|溅墨|扫描线|网点|抖动|针管笔", re.I)

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


def _engine_materials(spec: str):
    """从引擎 yaml 读 texture.paper / texture.effects 的内联数组。

    只认这两个字段（通用 YAML 解析器不支持列表，不为体检门扩大解析面）。
    spec 可为引擎名（匹配文件名主干或内部 name）或 yaml 路径。
    """
    p = Path(spec)
    if not p.is_file():
        eng_dir = ROOT / "examples" / "image-engines"
        hit = None
        for cand in sorted(eng_dir.glob("*.yaml")):
            if cand.stem == spec or cand.stem.split("-", 1)[-1] == spec:
                hit = cand
                break
            if re.search(r'^name:\s*["\']?%s["\']?\s*$' % re.escape(spec),
                         cand.read_text(encoding="utf-8", errors="replace"), re.M):
                hit = cand
                break
        if hit is None:
            print("❌ 找不到配图引擎 %r（examples/image-engines/*.yaml）" % spec, file=sys.stderr)
            sys.exit(2)
        p = hit
    text = p.read_text(encoding="utf-8", errors="replace")
    terms = []
    for key in ("paper", "effects"):
        m = re.search(r"^\s*%s\s*:\s*\[(.*?)\]\s*$" % key, text, re.M)
        if m:
            terms += [t.strip().strip("\"'") for t in m.group(1).split(",") if t.strip()]
    return [t for t in terms if t]


def check(text: str, engine_terms=None):
    problems = []
    warns = []
    engine_terms = engine_terms or []

    # 1. 必需词：纸感类 + 肌理类各至少一个（通用词表 ∪ 引擎自带词）
    paper_re = GENERIC_PAPER
    texture_re = GENERIC_TEXTURE
    if engine_terms:
        extra = "|".join(re.escape(t) for t in engine_terms)
        paper_re = re.compile(GENERIC_PAPER.pattern + "|" + extra, re.I)
        texture_re = re.compile(GENERIC_TEXTURE.pattern + "|" + extra, re.I)
    if not paper_re.search(text):
        problems.append("[FAIL] 必需项缺失: 纸感/承载面词"
                        + ("（可取自 --engine 声明的 texture.paper）" if engine_terms else ""))
    if not texture_re.search(text):
        problems.append("[FAIL] 必需项缺失: 肌理词"
                        + ("（可取自 --engine 声明的 texture.effects）" if engine_terms else ""))

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
    ap.add_argument("--engine", help="配图引擎名/路径：按其 texture.paper/effects 追加材质词")
    args = ap.parse_args()

    engine_terms = _engine_materials(args.engine) if args.engine else []

    if args.path:
        text = open(args.path, encoding="utf-8").read()
    else:
        text = sys.stdin.read()

    problems, warns = check(text, engine_terms)

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
