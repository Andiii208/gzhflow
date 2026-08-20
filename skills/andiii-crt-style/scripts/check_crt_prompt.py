#!/usr/bin/env python3
"""andiii-crt-style 质检门 v1.0 — prompt 层检查（无 vision 依赖）。

CRT 复古界面风格不走通用质检门（check_engine_prompt.py 的纸感词不适用）：
质感底线另行定义 = 像素网格 + CRT 信号纹理 + 桶形畸变 + 色卡声明。

用法:
    echo "prompt内容" | python check_crt_prompt.py
    python check_crt_prompt.py prompt.txt
    python check_crt_prompt.py --format json prompt.txt

退出码: 0 = PASS, 1 = FAIL, 2 = WARN（软规避命中）, 3 = 脚本/参数错误

2026-08-06 初版（接口约定与 check_engine_prompt.py 保持一致）:
    - 必备：像素网格词 ≥1、CRT 纹理词 ≥2、畸变词 ≥1、画布比例声明、色卡声明
    - 硬规避 FAIL / 软规避 WARN 两级
    - 负向豁免：规避词前 12 字符内出现 避免/不要/no/not/avoid/without 即豁免
"""
import json
import re
import sys

GRID_WORDS = [
    "pixel grid", "square pixel", "pixel lattice", "shared grid",
    "chunky square pixels", "像素网格", "方形像素",
]
CRT_TEXTURE_WORDS = [
    "scanline", "scan line", "scan-line", "checkerboard", "dither",
    "phosphor", "noise", "interference", "persistence", "glitch",
    "misregistration", "bloom",
    "扫描线", "棋盘格", "辉光", "噪点", "信号干扰", "残像",
]
WARP_WORDS = [
    "barrel distortion", "barrel curve", "curved edge", "curved screen",
    "edge curvature", "桶形", "畸变", "屏幕弯曲",
]
PALETTE_WORDS = [
    "palette", "色卡", "#rrggbb", "#hex", "色值", "色彩",
]
HARD_BLOCK = [
    # 色卡外颜色 / 现代渲染（硬规避）
    "gradient", "anti-alias", "anti alias", "antialiasing",
    "photorealistic", "realistic rendering", "3d render",
    "glassmorphism", "modern flat", "glossy", "smooth curve",
    "monitor bezel", "physical monitor",
    "vivid", "saturated", "high-chroma", "high saturation",
    "渐变", "抗锯齿", "写实", "玻璃拟态", "高饱和", "显示器外壳",
]
SOFT_WARN = [
    "drop shadow", "bokeh", "soft light", "soft lighting",
    "stock photo", "clean vector", "柔和光",
]

_AVOID_RE = re.compile(r"(?:避免|不要|无|不用|no\s+|not\s+|avoid\s+|without\s+)")


def _is_avoided(t: str, w: str) -> bool:
    idx = t.find(w.lower())
    if idx < 0:
        return False
    start = max(0, idx - 12)
    return _AVOID_RE.search(t[start:idx]) is not None


def check(text: str):
    t = text.lower()
    issues = []

    grid_hits = [w for w in GRID_WORDS if w in t and not _is_avoided(t, w)]
    if not grid_hits:
        issues.append("FAIL: 缺像素网格词 (pixel grid / square pixel / 像素网格 …)")

    tex_hits = [w for w in CRT_TEXTURE_WORDS if w in t and not _is_avoided(t, w)]
    if len(tex_hits) < 2:
        issues.append(f"FAIL: CRT 纹理词 < 2 个 (当前 {len(tex_hits)}: {tex_hits})")

    warp_hits = [w for w in WARP_WORDS if w in t and not _is_avoided(t, w)]
    if not warp_hits:
        issues.append("FAIL: 缺桶形畸变词 (barrel distortion / 桶形 / 畸变 …)")

    if not any(w in t for w in ["16:9", "1:1", "9:16", "square", "portrait", "landscape", "竖版", "横版", "方形"]):
        issues.append("FAIL: 缺画布比例声明 (1:1 / 16:9 / 9:16 …)")

    pal_hits = [w for w in PALETTE_WORDS if w in t and not _is_avoided(t, w)]
    if not pal_hits:
        issues.append("FAIL: 缺色卡声明 (palette / 色卡 / #rrggbb …)")

    for w in HARD_BLOCK:
        if w in t and not _is_avoided(t, w):
            issues.append(f"FAIL: 硬规避命中 [{w}]")
    for w in SOFT_WARN:
        if w in t and not _is_avoided(t, w):
            issues.append(f"WARN: 软规避命中 [{w}]")

    has_fail = any(i.startswith("FAIL") for i in issues)
    has_warn = any(i.startswith("WARN") for i in issues)
    if has_fail:
        return ("FAIL", issues)
    if has_warn:
        return ("WARN", issues)
    return ("PASS", issues)


def main():
    args = sys.argv[1:]
    fmt = "text"
    if "--format" in args:
        i = args.index("--format")
        fmt = args[i + 1] if i + 1 < len(args) else "text"
        del args[i:i + 2]
    if fmt not in ("text", "json"):
        print(f"🔴 未知 --format: {fmt}（支持 text/json）", file=sys.stderr)
        sys.exit(3)

    try:
        sys.stdin.reconfigure(encoding="utf-8")
    except Exception:
        pass

    if args and args[0] != "-":
        try:
            with open(args[0], encoding="utf-8") as f:
                text = f.read()
        except OSError as e:
            print(f"🔴 读取失败: {e}", file=sys.stderr)
            sys.exit(3)
    else:
        text = sys.stdin.read()

    status, issues = check(text)
    code = {"PASS": 0, "FAIL": 1, "WARN": 2}[status]

    if fmt == "json":
        print(json.dumps(
            {"status": status, "exit_code": code, "issues": issues},
            ensure_ascii=False,
        ))
    else:
        print(status)
        for i in issues:
            print(" ", i)
    sys.exit(code)


if __name__ == "__main__":
    main()
