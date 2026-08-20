#!/usr/bin/env python3
"""gzhflow 去 AI 味机器门（De-AI flavor score）。

检测文本中的「模型腔修辞动作」（AI 写作特征），与配图质检门 check_image_prompt.py 对称。
借鉴思路：human-writing（KKKKhazix, MIT）的 check_prose.py「硬禁令 + WARN」结构，本实现为原创。

用法:
    python scripts/ai_flavor_score.py <稿件.md>      # 检文件（自动剥离 frontmatter）
    python scripts/ai_flavor_score.py --text "文本"  # 检直接传入的文本
    python scripts/ai_flavor_score.py - < 稿件.md    # 检 stdin

退出码: 0 = 通过（无硬禁令命中）, 1 = 有 FAIL（硬禁令命中，必须清零）
WARN 项只报告，不影响退出码，由人工判断。

⚠️ 检文件前先剥离 frontmatter（--- 块）与落款签名行（如「——作者」），
   否则签名行的破折号会被破折号禁令误报。
"""
import argparse
import re
import sys
from collections import Counter

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


# ============ 硬禁令（FAIL，必须清零） ============
HARD_BANS = {
    "中文冒号（非引语）": re.compile(r"[：]"),
    "英文冒号（非引语）": re.compile(r":(?![//])"),
    "破折号": re.compile(r"[—–]"),
    "硬停词": re.compile(r"说白了|说穿了|先说结论|言归正传|总而言之|综上所述"),
    "黑话（模型腔）": re.compile(
        r"赋能|抓手|闭环|底层逻辑|顶层设计|降本增效|全链路|组合拳|"
        r"商业闭环|护城河|第二曲线|心智|赛道|生态位|势能"
    ),
    "模型路标": re.compile(r"值得注意的是|需要指出的是|更微妙的是|不难发现|显而易见|"
                           r"总的来说|归根结底|换言之|换句话说|值得一提的是"),
    "翻案句": re.compile(
        r"不是[^。！？]{2,20}而是|并非[^。！？]{2,20}而是|"
        r"不在于[^。！？]{2,20}而在于|与其说[^。！？]{2,20}不如说|"
        r"表面[^。！？]{2,20}其实|看似[^。！？]{2,20}实则|"
        r"看似[^。！？]{2,20}实际上"
    ),
}

# ============ WARN（人工判断，不影响退出码） ============
WARN_ITEMS = {
    "语境黑话（本义准就留）": re.compile(r"沉淀|颗粒度|对齐|方法论"),
    "翻案腔变形": re.compile(r"以为[^。！？]{2,20}其实|回头才发现|真正[^。！？]{2,20}的是|不只[^。！？]{2,20}还"),
    "抒情词（≥2 处）": re.compile(r"安放|抵达|微光|褶皱|滚烫|斑驳|葳蕤|缱绻|呢喃|氤氲"),
    "名词化句式": re.compile(r"进行了[^。]{1,10}|实现了[^。]{1,10}提升|完成了对[^。]{1,10}的"),
    "重复开头词（同词开头 ≥3 段）": None,  # 特殊处理
    "隐喻簇（借喻密集）": re.compile(r"温度|战争|建筑|仓储|机器|海洋|赛道|剧场|舞台|乐章"),
    "三连同构排比（人工确认）": re.compile(r"([^。！？]{2,12}[，,]){3,}[^。！？]{2,12}"),
}

# 连词密度（WARN）：常见过渡连词
CONJUNCTION_RE = re.compile(
    r"但是|然而|因此|所以|而且|不过|并且|因为|虽然|如果|于是|同时|此外|可是|总之"
)


def strip_frontmatter(text: str) -> str:
    """剥离 YAML frontmatter（--- 块）。"""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            return parts[2]
    return text


def strip_signature(text: str) -> str:
    """剥离落款签名行（如「—— 作者名」，破折号是签名格式会被误报）。"""
    lines = text.splitlines()
    kept = [ln for ln in lines if not re.match(r"^\s*[—–]\s*\S", ln)]
    return "\n".join(kept)


def detect(text: str):
    fails = []
    warns = []

    for name, pat in HARD_BANS.items():
        if "冒号" in name:
            # 冒号豁免：冒号后紧跟「「『"或引号前有“说/道/问”等
            for m in pat.finditer(text):
                after = text[m.end():m.end() + 1]
                before = text[max(0, m.start() - 1):m.start()]
                if after in ("「", "『", '"', "“") or before in ("说", "道", "问", "答", "想", "写"):
                    continue
                fails.append(f"[FAIL] {name}: 「{text[max(0,m.start()-8):m.end()+8]}」")
        else:
            for m in pat.finditer(text):
                fails.append(f"[FAIL] {name}: 「{text[max(0,m.start()-8):m.end()+8]}」")

    for name, pat in WARN_ITEMS.items():
        if pat is None:
            continue
        for m in pat.finditer(text):
            warns.append(f"[WARN] {name}: 「{text[max(0,m.start()-8):m.end()+8]}」")

    # 抒情词计数（≥2 才报）
    lyr = WARN_ITEMS["抒情词（≥2 处）"]
    lyr_hits = lyr.findall(text)
    if len(lyr_hits) >= 2:
        warns.append(f"[WARN] 抒情词 {len(lyr_hits)} 处: {'/'.join(lyr_hits)}")

    # 隐喻簇计数（≥3 类密集出现）
    meta = WARN_ITEMS["隐喻簇（借喻密集）"]
    meta_hits = set(meta.findall(text))
    if len(meta_hits) >= 3:
        warns.append(f"[WARN] 隐喻簇 {len(meta_hits)} 类: {'/'.join(sorted(meta_hits))}")

    # ── 结构级 WARN（段落/句子维度，无法用单条正则表达） ──
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    # 重复开头词：≥3 段同首词 → WARN
    starts = []
    for para in paras:
        m = re.match(r"^[#>\-\*\d\.、\s]*([A-Za-z]+|[\u4e00-\u9fff]{2})", para)
        if m:
            starts.append(m.group(1))
    if starts:
        word, cnt = Counter(starts).most_common(1)[0]
        if cnt >= 3:
            warns.append(f"[WARN] 重复开头词: 「{word}」作为段首词出现 {cnt} 次（≥3 段同首词）")

    # 连词密度：连词数/句数 过高 → WARN
    sentences = [s for s in re.split(r"[。！？!?]", text) if s.strip()]
    if sentences:
        conj_cnt = len(CONJUNCTION_RE.findall(text))
        if conj_cnt / len(sentences) > 0.5:
            warns.append(f"[WARN] 连词密度偏高: {conj_cnt} 个连词 / {len(sentences)} 句（过渡词过多）")

    # 句长变异系数：句长标准差/均值过低（太均匀）→ WARN
    if len(sentences) >= 3:
        lengths = [len(s) for s in sentences]
        mean = sum(lengths) / len(lengths)
        var = sum((x - mean) ** 2 for x in lengths) / len(lengths)
        cv = (var ** 0.5) / mean if mean else 0
        if cv < 0.3:
            warns.append(f"[WARN] 句长变异系数偏低: CV≈{cv:.2f}（<0.3，句长过于均匀）")

    # 短段连击：连续 ≥3 段过短 → WARN
    if len(paras) >= 3:
        streak = 0
        for para in paras:
            body = re.sub(r"^[#>\-\*\d\.、\s]+", "", para)
            if len(body) <= 15:
                streak += 1
            else:
                streak = 0
            if streak >= 3:
                warns.append("[WARN] 短段连击: 连续 ≥3 段过短（每段 ≤15 字，节奏细碎）")
                break

    return fails, warns


def main():
    ap = argparse.ArgumentParser(description="gzhflow 去 AI 味机器门")
    ap.add_argument("path", nargs="?", help="稿件文件路径（- 表示 stdin）")
    ap.add_argument("--text", help="直接传入文本")
    args = ap.parse_args()

    if args.text:
        text = args.text
    elif args.path == "-":
        text = sys.stdin.read()
    elif args.path:
        text = open(args.path, encoding="utf-8").read()
        text = strip_frontmatter(text)
        text = strip_signature(text)
    else:
        ap.print_help()
        sys.exit(2)

    fails, warns = detect(text)

    if warns:
        print("⚠️  WARN 项（人工判断）:")
        for w in warns:
            print("   ", w)

    if fails:
        print(f"🔴 FAIL: {len(fails)} 处硬禁令命中，必须清零后才能交稿:")
        for f in fails:
            print("   ", f)
        sys.exit(1)

    print("✅ 硬禁令清零，通过")
    sys.exit(0)


if __name__ == "__main__":
    main()
