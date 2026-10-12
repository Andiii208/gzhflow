#!/usr/bin/env python3
"""gzhflow 生图预算层（image_batch）。

阶段④的「生成」闸门：manifest 先立清单，再算钱，再并行出图。
预算管的是**生成纪律**（清单之外不生成、超限先砍次要图），不是限制品类——
金句卡、封面变体这些想加就加，加进 manifest 就受同一套账目管。

manifest（JSON，阶段④产出）：
    {
      "article": "标题",
      "palette": ["#3A4A5A", "#C4A484", "#7A6A58"],   # 可选：文章实体统一色板
      "anchors": ["examples/image-engines/anchors/cover-like-01.png"],  # 可选：风格锚图
      "images": [
        {"id": "cover",  "role": "cover", "ratio": "2.35:1", "quality": "high",
         "output": "generated/cover_raw.png", "prompt": "…"},
        {"id": "inline-1", "role": "inline", "ratio": "16:9", "quality": "medium",
         "output": "generated/inline_1_raw.png", "prompt": "…", "refs": []}
      ]
    }
role 取值：cover（封面，永不砍）/ share（1:1 分享卡）/ quote-card（金句卡）/ inline（内文图）。
quality 省略时按 role 取 image_budget 的默认档。
`palette` 会被接到每张图 prompt 末尾（晕染辅色，不动纸底）；per-image 可覆盖顶层。
`anchors` / `--anchors` / `--engine` 的参考图会并进每张图的 refs（走 /images/edits）。

预算配置（config/workflow.yaml）：
    image_budget:
      max_images: 4          # 张数上限（0 = 不限）
      max_cost_usd: 0.30     # 金额上限（0 = 不限）
      parallel: 4            # 并行数
      retry: 1               # 每张重试次数
      quality_cover: high
      quality_inline: medium
      quality_draft: low

用法:
    python scripts/image_batch.py --manifest gen/manifest.json --plan-only        # 只算账不出图
    python scripts/image_batch.py --manifest gen/manifest.json                    # 按预算出图
    python scripts/image_batch.py --manifest gen/manifest.json --auto-trim        # 超限自动砍次要图
    python scripts/image_batch.py --manifest gen/manifest.json --prompts-only     # 只落 prompt 文件
    python scripts/image_batch.py --manifest gen/manifest.json --backend gpt-image-2 --receipt gen/预算单.md
    python scripts/image_batch.py --manifest gen/manifest.json --engine watercolor --anchors examples/image-engines/anchors

退出码: 0 = 完成（含部分失败，见报告）, 1 = 全部失败, 2 = 配置/manifest 错误, 3 = 超预算且未开 auto-trim
"""
import argparse
import json
import random
import re
import shutil
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_image import (ROOT, ConfigError, generate_one,  # noqa: E402
                            load_workflow_config, resolve_backend, size_for,
                            unit_price)

# 超限时的裁剪顺序：数字越小越先被砍。cover 最后，且开 auto-trim 也不会砍它。
CUT_RANK = {"inline": 0, "quote-card": 1, "share": 2, "cover": 3}

# 统一色板必须是 6 位十六进制——脏值直接进 prompt 会污染每一张图，宁可早点报错。
HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
ANCHOR_EXT = {".png", ".jpg", ".jpeg", ".webp"}


def fail(msg, code=2):
    print("❌ %s" % msg, file=sys.stderr)
    sys.exit(code)


def _norm_palette(val, where):
    """把 palette 字段规整成 ["#RRGGBB", …]；非法色值直接报配置错误。"""
    if not val:
        return []
    if isinstance(val, str):
        val = [p for p in re.split(r"[,\s]+", val) if p]
    out = []
    for p in val:
        p = str(p).strip()
        if not p:
            continue
        if not HEX.match(p):
            fail("%s 里的色值不是 #RRGGBB：%r" % (where, p))
        out.append(p.upper())
    return out


def _inject_palette(prompt, palette):
    """把文章实体色板接到 prompt 尾部——只作晕染辅色，不动纸底与纸感词。"""
    if not palette:
        return prompt
    line = "统一色板：%s（仅作晕染辅色，不覆盖纸底与纸感）" % " ".join(palette)
    if line in prompt:
        return prompt
    return prompt.rstrip() + "\n" + line


def _dedup(seq):
    seen, out = set(), []
    for x in seq:
        if x and x not in seen:
            seen.add(x)
            out.append(x)
    return out


def _read_engine_anchors(name_or_path):
    """从 examples/image-engines/*.yaml 的 `anchor_images:` 块列表读风格锚图路径。

    只认这一个字段（通用 YAML 解析器不支持列表，不为此扩大解析面）。
    传引擎名（匹配文件主干或内部 name）或 yaml 路径均可。
    """
    p = Path(name_or_path)
    if not p.is_file():
        eng_dir = ROOT / "examples" / "image-engines"
        hit = None
        for cand in sorted(eng_dir.glob("*.yaml")):
            if cand.stem == name_or_path or cand.stem.split("-", 1)[-1] == name_or_path:
                hit = cand
                break
            text = cand.read_text(encoding="utf-8", errors="replace")
            if re.search(r'^name:\s*["\']?%s["\']?\s*$' % re.escape(name_or_path), text, re.M):
                hit = cand
                break
        if hit is None:
            fail("找不到配图引擎 %r（examples/image-engines/*.yaml）" % name_or_path)
        p = hit
    if not p.exists():
        fail("引擎文件不存在：%s" % p)
    anchors, in_block = [], False
    for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
        if re.match(r"^anchor_images\s*:", line):
            in_block = True
            continue
        if in_block:
            m = re.match(r"^\s+-\s*(.+?)\s*$", line)
            if m:
                anchors.append(m.group(1).strip("\"'"))
            elif line.strip():
                break
    base = p.parent
    return [str((base / a) if not Path(a).is_absolute() else Path(a)) for a in anchors]


def _expand_anchors(spec):
    """把 --anchors 的参数展开成路径列表：目录则取其下所有图片，否则按逗号分。"""
    if not spec:
        return []
    out = []
    for part in [s for s in re.split(r"[,\n]", spec) if s.strip()]:
        path = Path(part.strip())
        if path.is_dir():
            out += [str(f) for f in sorted(path.iterdir()) if f.suffix.lower() in ANCHOR_EXT]
        else:
            out.append(str(path))
    return out


def role_quality(role, budget, manifest_quality=None):
    """确定每张图的质量档：manifest 指定 > image_budget 按 role 给的默认 > medium。"""
    if manifest_quality:
        return str(manifest_quality).lower()
    by_role = {"cover": budget.get("quality_cover"),
               "share": budget.get("quality_inline"),      # 分享卡是次要资产，不吃封面档
               "inline": budget.get("quality_inline"), "quote-card": budget.get("quality_draft")}
    return str(by_role.get(role) or budget.get("quality_default") or "medium").lower()


def build_plan(manifest, backend, budget, cli_max_images=None, cli_max_cost=None,
               anchors=None):
    """把 manifest 折算成可执行的计划行：尺寸、单价、成本。

    额外接线（2026-10-12）：
    - manifest 顶层 `palette` → 注入每张图的 prompt 末尾（文章实体统一色板）
    - per-image `palette` 覆盖顶层
    - manifest 顶层 `anchors` + CLI `--anchors` → 并进每张图的 refs（风格锚）
    """
    rows = []
    m_palette = _norm_palette(manifest.get("palette"), "manifest.palette")
    extra_anchors = _dedup([str(a) for a in (manifest.get("anchors") or [])]
                           + [str(a) for a in (anchors or [])])
    for i, item in enumerate(manifest.get("images") or []):
        if not isinstance(item, dict) or not item.get("prompt") or not item.get("output"):
            fail("manifest.images[%d] 缺 prompt 或 output" % i)
        role = str(item.get("role") or "inline").lower()
        quality = role_quality(role, budget, item.get("quality"))
        ratio = item.get("ratio")
        try:
            size = size_for(ratio or "16:9", backend, item.get("size"))
        except ConfigError as e:
            fail("images[%d] %s" % (i, e))
        palette = _norm_palette(item.get("palette") or m_palette, "images[%d].palette" % i)
        unit = unit_price(backend, quality)
        rows.append({
            "id": item.get("id") or ("img-%d" % (i + 1)),
            "role": role,
            "ratio": ratio or "16:9",
            "quality": quality,
            "size": size,
            "unit": unit,
            "output": Path(item["output"]),
            "prompt": _inject_palette(item["prompt"], palette),
            "palette": palette,
            "refs": _dedup([*(item.get("refs") or []), *extra_anchors]),
            "status": "待生成",
        })
    if not rows:
        fail("manifest 里没有 images")
    max_images = cli_max_images if cli_max_images is not None else int(budget.get("max_images", 0) or 0)
    max_cost = cli_max_cost if cli_max_cost is not None else float(budget.get("max_cost_usd", 0) or 0)
    return rows, max_images, max_cost


def totals(rows):
    return len(rows), sum(r["unit"] for r in rows)


def print_table(rows, max_images, max_cost):
    print("📋 生图计划（%d 张）" % len(rows))
    print("   %-12s %-10s %-8s %-8s %-10s %8s" % ("id", "role", "ratio", "quality", "size", "单价$"))
    for r in rows:
        print("   %-12s %-10s %-8s %-8s %-10s %8.4f"
              % (r["id"], r["role"], r["ratio"], r["quality"], r["size"], r["unit"]))
    n, cost = totals(rows)
    print("   ── 合计：%d 张，预估 $%.4f（上限：%s 张 / $%.4f）"
          % (n, cost, max_images or "不限", max_cost))
    palettes = _dedup([" ".join(r["palette"]) for r in rows if r.get("palette")])
    if palettes:
        print("   🎨 统一色板：%s" % " | ".join(palettes))
    n_anchor = len(rows[0].get("refs") or []) if rows else 0
    if n_anchor:
        print("   🖼️  风格锚：每张带 %d 张参考图（走 /images/edits）" % n_anchor)
    return n, cost


def trim(rows, max_images, max_cost):
    """超限时按 CUT_RANK 砍次要图（cover 永不砍），返回 (保留行, 被砍行)。"""
    dropped = []
    while True:
        n, cost = totals(rows)
        if (max_images and n > max_images) or (max_cost and cost > max_cost):
            droppable = sorted([r for r in rows if r["role"] != "cover"],
                               key=lambda r: CUT_RANK.get(r["role"], 9))
            if not droppable:
                break
            victim = droppable[0]
            rows = [r for r in rows if r is not victim]
            dropped.append(victim)
        else:
            break
    return rows, dropped


def write_prompts(rows):
    out = None
    for r in rows:
        p = r["output"].with_suffix(r["output"].suffix + ".prompt.txt")
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(r["prompt"], encoding="utf-8")
        out = p.parent
    print("✅ 已写出 %d 份 prompt 文件到 %s（未调用生图接口）" % (len(rows), out))


def run_one(row, backend, retry, cache):
    """生成单张：命中缓存则复制，失败重试 ≤retry 次（指数退避 + 抖动）。"""
    key = (row["prompt"].strip(), row["size"], row["quality"], tuple(row["refs"]))
    if key in cache:
        src = cache[key]
        if src.exists():
            row["output"].parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, row["output"])
            return row, "复用缓存（%s）" % src.name
    last = None
    for attempt in range(retry + 1):
        try:
            saved = generate_one(row["prompt"], row["output"], backend=backend,
                                 size=row["size"], quality=row["quality"],
                                 refs=row["refs"])
            cache[key] = saved[0]
            return row, "成功"
        except RuntimeError as e:
            last = e
            if attempt < retry:
                time.sleep((2 ** attempt) + random.uniform(0, 1))
    return row, "失败：%s" % last


def write_receipt(path, rows, dropped, backend, max_images, max_cost, mode):
    n, cost = totals(rows)
    lines = ["# 生图预算消耗单", "",
             "- 后端：`%s`（%s）" % (backend.get("name"), backend.get("model")),
             "- 模式：%s" % mode,
             "- 上限：%s 张 / $%.4f" % (max_images or "不限", max_cost),
             "- 实际：%d 张 / 预估 $%.4f" % (n, cost), ""]
    palettes = _dedup([" ".join(r["palette"]) for r in rows if r.get("palette")])
    if palettes:
        lines += ["- 统一色板：%s" % " | ".join("`%s`" % p for p in palettes), ""]
    if rows and rows[0].get("refs"):
        lines += ["- 风格锚：每张带 %d 张参考图" % len(rows[0]["refs"]), ""]
    if dropped:
        lines += ["## 预算裁剪（超限自动砍）", ""] + \
                 ["- %s（%s）" % (r["id"], r["role"]) for r in dropped] + [""]
    lines += ["## 明细", "", "| id | role | ratio | quality | size | 单价$ | 状态 |",
              "|---|---|---|---|---|---|---|"]
    for r in rows:
        lines.append("| %s | %s | %s | %s | %s | %.4f | %s |"
                     % (r["id"], r["role"], r["ratio"], r["quality"], r["size"], r["unit"], r["status"]))
    Path(path).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("🧾 预算消耗单: %s" % path)


def main():
    ap = argparse.ArgumentParser(description="gzhflow 生图预算层")
    ap.add_argument("--manifest", required=True, help="manifest JSON 路径")
    ap.add_argument("--plan-only", action="store_true", help="只算账不出图")
    ap.add_argument("--prompts-only", action="store_true", help="只落 prompt 文件，不调接口")
    ap.add_argument("--auto-trim", action="store_true", help="超预算时自动砍次要图（封面不砍）")
    ap.add_argument("--backend", help="image_backends 里的后端名")
    ap.add_argument("--anchors", help="风格锚图：目录（取其下图片）或逗号分隔路径；并进每张图的 refs")
    ap.add_argument("--engine", help="配图引擎名/路径：读其 anchor_images 作为风格锚（与 --anchors 叠加）")
    ap.add_argument("--max-images", type=int, help="覆盖张数上限")
    ap.add_argument("--max-cost", type=float, help="覆盖金额上限（美元）")
    ap.add_argument("--receipt", help="预算消耗单输出路径（默认不写，仅打印）")
    args = ap.parse_args()

    mpath = Path(args.manifest)
    if not mpath.exists():
        fail("manifest 不存在：%s" % mpath)
    try:
        manifest = json.loads(mpath.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail("manifest 不是合法 JSON：%s" % e)

    cfg = load_workflow_config()
    # 只算账/只写 prompt 时不要求 API key——没配好后端也能先看预算
    need_key = not (args.plan_only or args.prompts_only)
    try:
        backend = resolve_backend(cfg, args.backend, require_key=need_key)
    except ConfigError as e:
        fail(str(e))

    budget = cfg.get("image_budget") or {}
    anchors = _expand_anchors(args.anchors)
    if args.engine:                       # 引擎自带风格锚（examples/image-engines/*.yaml）
        anchors += _read_engine_anchors(args.engine)
    rows, max_images, max_cost = build_plan(manifest, backend, budget,
                                            args.max_images, args.max_cost, anchors)

    n, cost = print_table(rows, max_images, max_cost)

    if args.prompts_only:
        write_prompts(rows)
        sys.exit(0)

    over = (max_images and n > max_images) or (max_cost and cost > max_cost)
    dropped = []
    if over and args.auto_trim:
        rows, dropped = trim(rows, max_images, max_cost)
        print("✂️  超预算，自动砍掉 %d 张：%s"
              % (len(dropped), "、".join(r["id"] for r in dropped)))
        n, cost = print_table(rows, max_images, max_cost)
        over = (max_images and n > max_images) or (max_cost and cost > max_cost)
    if over:
        fail("超预算（%d 张 / $%.4f）。加 --auto-trim 自动砍次要图，或调 image_budget"
             % (n, cost), code=3)
    if args.plan_only:
        if args.receipt:      # plan-only 也给一份单子，便于先看账再决定
            write_receipt(args.receipt, rows, dropped, backend, max_images, max_cost, "plan")
        print("ℹ️  --plan-only：未调用生图接口")
        sys.exit(0)

    parallel = max(1, int(budget.get("parallel", 4) or 4))
    retry = max(0, int(budget.get("retry", 1) or 1))
    cache = {}
    print("🚀 并行生成（%d 路，重试 %d 次）…" % (parallel, retry))
    with ThreadPoolExecutor(max_workers=min(parallel, len(rows))) as pool:
        futures = {pool.submit(run_one, r, backend, retry, cache): r for r in rows}
        for fut in as_completed(futures):
            row, status = fut.result()
            row["status"] = status
            print("   %-12s %s" % (row["id"], status))

    ok = [r for r in rows if r["status"] == "成功" or r["status"].startswith("复用")]
    failed = [r for r in rows if r["status"].startswith("失败")]
    for r in failed:   # 失败降级：留一份 prompt，Run 继续走完
        note = r["output"].with_suffix(r["output"].suffix + ".FAILED.txt")
        note.parent.mkdir(parents=True, exist_ok=True)
        note.write_text("prompt:\n%s\n\n错误: %s\n" % (r["prompt"], r["status"]), encoding="utf-8")

    if args.receipt:
        write_receipt(args.receipt, rows, dropped, backend, max_images, max_cost,
                      "plan+generate" if not args.plan_only else "plan")
    print("完成：成功 %d / 失败 %d / 共 %d（预估 $%.4f）" % (len(ok), len(failed), len(rows), cost))
    if failed:
        print("⚠️  失败的图已留 .FAILED.txt（含 prompt），Run 可继续")
    sys.exit(1 if failed and not ok else 0)


if __name__ == "__main__":
    main()
