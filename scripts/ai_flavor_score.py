#!/usr/bin/env python3
"""gzhflow 去 AI 味质检门（ai_flavor_score）。

出稿后跑一遍，FAIL 项必须清零，WARN 项是体检报告，人看。
规则依据来自两处：一是本项目自己攒的踩坑经验，二是 larashero3-dotcom/lieflat-less-ai-tone
（MIT）那篇对照语料研究——629 篇文章 283 万字，5 个模型各 60 篇对 329 篇人类文本，
26 项候选特征逐项算频率比 R = 生成侧 ÷ 人类侧。本文件里带 R 的注释都出自它。

三条已按那项研究撤掉的规则（曾在本文件里，2026-10-12 删）：
  句长变异系数 CV < 0.3 —— 实测 R=0.87，生成 0.58 / 人类 0.67，无区分力
  句内同构排比 —— 实测 R=0.61，人类用得比 AI 还多
  比喻/隐喻整体 —— 实测 R=0.42，人类是 AI 的 2.4 倍

用法:
    python scripts/ai_flavor_score.py <稿件.md>       # 检文件（自动剥离 frontmatter）
    python scripts/ai_flavor_score.py --text "文本"    # 检直接传入的文本
    python scripts/ai_flavor_score.py --model deepseek <稿件.md>
    python scripts/ai_flavor_score.py - < 稿件.md      # 检 stdin

--model 只影响破折号的阈值。破折号这项模型间极差 40 倍
（DeepSeek 5.16 次/千字，Claude 4.25，Kimi 2.32，Gemini 0.51，GPT 只有 0.11，
人类 0.80），一刀切禁它对 GPT 输出是在删一个比人用得还少的标点。
不指定时用生成侧整体均值 2.38。

退出码: 0 = 无 FAIL, 1 = 有 FAIL（必须清零后才能交稿）
"""
import argparse
import re
import sys
from collections import Counter

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 各模型破折号频率（次/千字），来自 lieflat 的实测表
MODEL_DASH = {
    "gpt": 0.11, "gemini": 0.51, "kimi": 2.32,
    "claude": 4.25, "deepseek": 5.16,
}
DASH_HUMAN = 0.80      # 人类侧基准
DASH_DEFAULT = 2.38    # 未指定模型时用生成侧整体均值

# FAIL：命中必须清零。多数是词汇层，删掉就行，不涉及重写。
HARD_BANS = {
    # 对举结构，R=3.4，本项目踩坑最多的一项
    "翻案句": re.compile(
        r"不是[^。！？]{2,20}而是|并非[^。！？]{2,20}而是|"
        r"不在于[^。！？]{2,20}而在于|与其说[^。！？]{2,20}不如说|"
        r"表面[^。！？]{2,20}其实|看似[^。！？]{2,20}实则|"
        r"看似[^。！？]{2,20}实际上"),

    # 段首起首语，R=3.2。说白了/说到底同时归这里和下面的段首零回指
    "起首语": re.compile(r"说白了|说穿了|先说结论|言归正传|总而言之|综上所述"),

    # 拟人化喻体，R=7.3，区分力最强的一项。禁的不是比喻本身（人类比 AI 更爱比喻），
    # 禁的是"像一位智慧的导师""一个永不疲倦的初级审查员"这种理想化职业人格
    "拟人化喻体": re.compile(
        r"(?:像|就像|好比|好像|仿佛|如同|好似)[^。]{0,14}"
        r"(导师|审查员|侦探|律师|医生|老师|工程师|会计|管家|助手|伙伴|"
        r"向导|引路人|灯塔|舵手|守门人|裁判|教练|工匠|园丁|建筑师|"
        r"观察者|记录者|叙事者|策展人)"),

    # 模型路标：一开口就是"值得注意的是"，读者立刻知道不是人写的
    "模型路标": re.compile(r"值得注意的是|需要指出的是|更微妙的是|不难发现|显而易见|"
                           r"总的来说|归根结底|换言之|换句话说|值得一提的是"),

    "黑话（模型腔）": re.compile(
        r"赋能|抓手|闭环|底层逻辑|顶层设计|降本增效|全链路|组合拳|"
        r"商业闭环|护城河|第二曲线|心智|赛道|生态位|势能"),
}

# WARN：体检报告项，不拦稿，人看了自己判断。带 R 的是 lieflat 实测通过的。
WARN_ITEMS = {
    # 冒号。以前是一刀切 FAIL，把"时间：2024年秋天"一起杀了。
    # 实测有区分力的是提示性冒号（R=3.8）和空转句引列表（R=9.4），其余冒号无区分力。
    # 这里只查这两种：段首/段中挂着程度副词然后冒号引出解释，以及"如下/包括"这类空转引列表。
    "提示性冒号": re.compile(
        r"[^。！？\n]{0,10}(?:很|太|最|更|特别|尤其|真正|其实|往往|通常|真的|"
        r"确实|显然|明显|事实上)[^。！？\n]{0,8}[：:]"),
    "空转列表冒号": re.compile(r"(如下|包括|分为|有以下|以下几|三类|三种|两步)[：:]"),

    # 段首零回指评论，R=4.4，全场区分力最强，而本项目此前完全没有这项。
    # 新段落开口就下评价，不说是评谁，读者得翻回上一段才知道在讲什么。
    # 修法很轻：补一个"这/那"把上文接回来。
    "段首零回指评论": re.compile(
        r"^(?:听起来|看起来|看上去|听上去|说白了|说到底|换句话说|意味着|值得注意|"
        r"不难看出|细看|再看|回过头看|问题在于|原因在于|结果是|有意思的是|"
        r"更重要的是|关键在于|真正的)"),
    # 段首带了回指成分的（这/那/其/以上/但/所以…）不算，那是正常衔接
    "段首有回指": re.compile(
        r"^(?:这|那|其|此|上面|前面|刚才|以上|该|它|他|她|它们|他们|同样|类似|"
        r"相比|反过来|但|不过|所以|因此|于是|而|另|除此|与此)"),

    # 相邻句结构同构，R=2.0。注意不是句内排比——句内排比人类用得更多。
    # 指纹取（逗号数, 有无冒号, 有无括号, 长度档），段内连续两句指纹相同且都有逗号才算。
    "相邻句同构": None,   # 特殊处理，见 detect_adjacent_isomorphic

    # 顿号并列过密，R=1.8
    "顿号并列过密": re.compile(r"[，、][^，。！？]{1,12}(?:、[^，。！？]{1,12}){3,}"),

    # 序数词充当小标题，R=3.1。
    # 注意：排版主题若自带编号章节（红白主题就是），最终 HTML 的编号是排版加的，
    # 不算 AI 味；这里只反映 md 原文里 AI 自己写的序号标题。
    "序数词小标题": re.compile(r"^(?:0[1-9]|[1-9][0-9]?)[、.． ]"),

    # 译文句式 5 项，R=2.6~5.3。全是英文句法直接移植的产物
    "当…时从句": re.compile(r"当[^。]{2,30}时"),
    "前置话题壳": re.compile(r"对于[^。]{2,20}来说"),
    "句首连接词": re.compile(r"^(然而|因此|此外|与此同时)[，,]"),
    "这意味着复述句": re.compile(r"这意味着"),
    "过长前置定语": re.compile(r"的[^。！？，、；]{1,18}的[^。！？，、；]{1,18}的"),

    "抒情词（≥2 处）": re.compile(r"安放|抵达|微光|褶皱|滚烫|斑驳|葳蕤|缱绻|呢喃|氤氲"),
    "语境黑话（本义准就留）": re.compile(r"沉淀|颗粒度|对齐|方法论"),
    "翻案腔变形": re.compile(r"以为[^。！？]{2,20}其实|回头才发现|真正[^。！？]{2,20}的是|不只[^。！？]{2,20}还"),
    "名词化句式": re.compile(r"进行了[^。]{1,10}|实现了[^。]{1,10}提升|完成了对[^。]{1,10}的"),
    "重复开头词（同词开头 ≥3 段）": None,   # 特殊处理
}

# 连词密度（WARN）：常见过渡连词
CONJUNCTION_RE = re.compile(
    r"但是|然而|因此|所以|而且|不过|并且|因为|虽然|如果|于是|同时|此外|可是|总之")

DASH_RE = re.compile(r"[—–]")


def strip_frontmatter(text):
    """剥离 YAML frontmatter（--- 块）。"""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            return parts[2]
    return text


def strip_signature(text):
    """剥离落款签名行（如「—— 作者名」），破折号是签名格式，不进去凑数。"""
    lines = text.splitlines()
    kept = [ln for ln in lines if not re.match(r"^\s*[—–]\s*\S", ln)]
    return "\n".join(kept)


def sentence_signature(sent):
    """句子结构指纹：逗号数、有无冒号、有无括号、长度档。"""
    return (sent.count("，"), "：" in sent,
            ("（" in sent or "(" in sent), len(sent) // 15)


def detect_adjacent_isomorphic(paras):
    """段内连续两句结构指纹相同且都带逗号 —— 比"句内排比"更接近 AI 的实际毛病。"""
    hits = []
    for para in paras:
        body = re.sub(r"^[#>\-\*\d\.、\s]+", "", para)
        sents = [s.strip() for s in re.split(r"[。！？]", body) if len(s.strip()) > 10]
        for i in range(len(sents) - 1):
            a, b = sentence_signature(sents[i]), sentence_signature(sents[i + 1])
            if a == b and a[0] >= 1:
                hits.append(sents[i][:14] + " / " + sents[i + 1][:14])
    return hits


def detect_repeat_head(paras):
    """≥3 段用同一个词开头。"""
    starts = []
    for para in paras:
        m = re.match(r"^[#>\-\*\d\.、\s]*([A-Za-z]+|[\u4e00-\u9fff]{2})", para)
        if m:
            starts.append(m.group(1))
    if not starts:
        return None
    word, cnt = Counter(starts).most_common(1)[0]
    return (word, cnt) if cnt >= 3 else None


def dash_threshold(model):
    """破折号阈值：取"人类基准"和"该模型实际用量的一半"里的较大值。

    这样对 GPT 这类天生不爱用破折号的模型基本不报，对 DeepSeek 照常抓。
    """
    rate = MODEL_DASH.get(model, DASH_DEFAULT)
    return max(DASH_HUMAN, rate * 0.6)


def detect(text, model=None):
    fails, warns = [], []

    for name, pat in HARD_BANS.items():
        for m in pat.finditer(text):
            fails.append("[FAIL] %s: 「%s」" % (name, text[max(0, m.start() - 8):m.end() + 8]))

    for name, pat in WARN_ITEMS.items():
        if pat is None or name == "段首有回指":
            # 段首有回指是"段首零回指"的排除条件，不是独立报告项
            continue
        if name == "段首零回指评论":
            # 逐段看段首：命中评论语且没有回指成分才算
            paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
            for para in paras:
                first = para.split("\n")[0].strip()
                if pat.match(first) and not WARN_ITEMS["段首有回指"].match(first):
                    snippet = first[:24] + ("…" if len(first) > 24 else "")
                    warns.append("[WARN] 段首零回指评论（R=4.4，全场最强特征，"
                                 "补个「这/那」就能修）: 「%s」" % snippet)
            continue
        if name == "序数词小标题":
            # 只看以标题形式出现的行，正文里提"第一步"不算
            for line in text.splitlines():
                line = line.strip()
                if line.startswith("#") or re.match(r"^\*\*", line):
                    if pat.match(re.sub(r"^[#*\s]+", "", line)):
                        warns.append("[WARN] 序数词小标题（R=3.1）: 「%s」" % line[:30])
            continue
        if name == "句首连接词":
            for line in text.splitlines():
                line = line.strip()
                if not line:
                    continue
                if pat.match(line):
                    warns.append("[WARN] 句首连接词（R=2.6~5.3）: 「%s」" % line[:24])
            continue
        for m in pat.finditer(text):
            warns.append("[WARN] %s: 「%s」" % (name, text[max(0, m.start() - 8):m.end() + 8]))

    # 抒情词计数（≥2 才报）
    lyr = WARN_ITEMS["抒情词（≥2 处）"]
    lyr_hits = lyr.findall(text)
    if len(lyr_hits) >= 2:
        warns.append("[WARN] 抒情词 %d 处: %s" % (len(lyr_hits), "/".join(lyr_hits)))

    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    # 相邻句同构
    iso = detect_adjacent_isomorphic(paras)
    if iso:
        warns.append("[WARN] 相邻句同构（R=2.0，%d 处）: %s"
                     % (len(iso), "；".join(iso[:3])))

    # 重复开头词
    rep = detect_repeat_head(paras)
    if rep:
        warns.append("[WARN] 重复开头词: 「%s」作为段首词出现 %d 次" % rep)

    # 连词密度
    sentences = [s for s in re.split(r"[。！？!?]", text) if s.strip()]
    if sentences:
        conj_cnt = len(CONJUNCTION_RE.findall(text))
        if conj_cnt / len(sentences) > 0.5:
            warns.append("[WARN] 连词密度偏高: %d 个连词 / %d 句"
                         % (conj_cnt, len(sentences)))

    # 短段连击
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

    # 破折号：按模型阈值判，不再一刀切
    plain = text
    body_chars = len(re.sub(r"\s", "", plain))
    if body_chars >= 200:
        dashes = len(DASH_RE.findall(plain))
        per_k = dashes * 1000.0 / body_chars
        thr = dash_threshold(model)
        if per_k > thr:
            fails.append("[FAIL] 破折号: 每千字 %.2f 次，超过 %s 的阈值 %.2f"
                         % (per_k, model or "默认", thr))
        elif per_k > DASH_HUMAN:
            warns.append("[WARN] 破折号: 每千字 %.2f 次，高于人类基准 %.2f 但未超当前模型阈值"
                         % (per_k, DASH_HUMAN))

    # 数字密度。实测反向：人类每千字 17.92 个数字，生成侧只有 6.34（R=0.35）。
    # 人类是 AI 的 2.8 倍。数字太少往往意味着写得不够具体。
    if body_chars >= 400:
        digits = len(re.findall(r"[0-9０-９]|一两三四五六七八九十百千万亿", plain))
        per_k = digits * 1000.0 / body_chars
        if per_k < 8:
            warns.append("[WARN] 数字偏少: 每千字 %.1f 个，人类基准约 17.9。"
                         "是不是有一段可以落到具体数上？" % per_k)

    return fails, warns


def main():
    ap = argparse.ArgumentParser(description="gzhflow 去 AI 味质检门")
    ap.add_argument("path", nargs="?", help="稿件文件路径（- 表示 stdin）")
    ap.add_argument("--text", help="直接传入文本")
    ap.add_argument("--model", help="当前用的模型（gpt/gemini/kimi/claude/deepseek），只影响破折号阈值")
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

    fails, warns = detect(text, args.model)

    if warns:
        print("⚠️  WARN 项（体检报告，人工判断）:")
        for w in warns:
            print("   ", w)

    if fails:
        print("🔴 FAIL: %d 处命中，必须清零后才能交稿:" % len(fails))
        for f in fails:
            print("   ", f)
        sys.exit(1)

    print("✅ FAIL 清零，通过")
    sys.exit(0)


if __name__ == "__main__":
    main()
