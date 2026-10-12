#!/usr/bin/env python3
"""gzhflow 手改学习（learned_edits）。

阶段⑦的入口之一：用户把手改过的稿子/HTML 拿回来时，比一比，把「改了什么」记成一条，
供后续蒸馏进 voice.md / lessons.md。**它是记录器，不是判官**——不下"改得好不好"的结论，
也不自动回写风格库（回写要人判断，见 prompts/07-review.md）。

用法:
    python scripts/learned_edits.py --before generated/draft_ai.md --after generated/draft_user.md
    python scripts/learned_edits.py --before a.md --after b.md --note "删了开头天气铺垫" \\
        --kind deai --append assets/learned-edits.md

退出码: 0 = 有改动并已记录, 4 = 无改动（什么都没写）, 2 = 用法/文件错误
"""
import argparse
import datetime
import difflib
import sys
from pathlib import Path

# 改动类型：决定这条记到哪个库的候选池（不强制，蒸馏时人工判断）
KINDS = {
    "deai": "去 AI 味（删填充/破折号/金句）",
    "structure": "结构（开头/结尾/段落顺序）",
    "voice": "语气与用词（像不像我）",
    "layout": "排版（主题/组件/下划线）",
    "image": "配图（选图/构图/色板）",
    "title": "标题",
    "other": "其它",
}


def read(path):
    p = Path(path)
    if not p.exists():
        print("❌ 文件不存在：%s" % p, file=sys.stderr)
        sys.exit(2)
    return p.read_text(encoding="utf-8", errors="replace").splitlines()


def diffstat(before, after):
    """返回 (added, removed)。用 SequenceMatcher 数真正的增删行。"""
    sm = difflib.SequenceMatcher(None, before, after)
    added = removed = 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag in ("replace", "insert"):
            added += j2 - j1
        if tag in ("replace", "delete"):
            removed += i2 - i1
    return added, removed


def unified(before, after, fromfile, tofile, context):
    return list(difflib.unified_diff(before, after, fromfile=fromfile, tofile=tofile,
                                     lineterm="", n=context))


def main():
    ap = argparse.ArgumentParser(description="gzhflow 手改学习（记录改动，供复盘蒸馏）")
    ap.add_argument("--before", required=True, help="AI 稿 / 旧版路径")
    ap.add_argument("--after", required=True, help="用户手改后的版本路径")
    ap.add_argument("--note", default="", help="一句话说明改了什么（你自己的话）")
    ap.add_argument("--kind", default="other", choices=sorted(KINDS),
                    help="改动类型（默认 other）：%s" % "；".join("%s=%s" % kv for kv in KINDS.items()))
    ap.add_argument("--context", type=int, default=2, help="diff 上下文行数（默认 2）")
    ap.add_argument("--max-lines", type=int, default=120, help="落盘时 diff 最多保留多少行")
    ap.add_argument("--append", help="追加到该 markdown 文件（缺省只打印，不落盘）")
    ap.add_argument("--title", default="", help="文章标题（写进记录）")
    args = ap.parse_args()

    before = read(args.before)
    after = read(args.after)
    if before == after:
        print("ℹ️  两版内容一致，没有可记录的改动")
        sys.exit(4)

    added, removed = diffstat(before, after)
    lines = unified(before, after, Path(args.before).name, Path(args.after).name, args.context)

    print("📊 改动：+%d 行 / -%d 行（类型：%s）" % (added, removed, args.kind))
    print("\n".join(lines[:args.max_lines]))
    if len(lines) > args.max_lines:
        print("…（diff 共 %d 行，落盘只保留前 %d 行）" % (len(lines), args.max_lines))

    if not args.append:
        print("\nℹ️  未加 --append，未写盘")
        sys.exit(0)

    entry = ["", "## %s｜%s" % (datetime.date.today().isoformat(), args.kind),
             ""]
    if args.title:
        entry.append("- 文章：%s" % args.title)
    entry += [
        "- 对比：`%s` → `%s`" % (args.before, args.after),
        "- 改动量：+%d / -%d 行" % (added, removed),
        "- 自述：%s" % (args.note or "（未填）"),
        "",
        "```diff",
    ] + lines[:args.max_lines] + ["```", ""]

    path = Path(args.append)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write("\n".join(entry) + "\n")
    print("✅ 已追加到 %s" % path)
    print("   蒸馏提示：攒够 2–3 条同类改动，再回写 voice.md / lessons.md（见 prompts/07-review.md）")
    sys.exit(0)


if __name__ == "__main__":
    main()
