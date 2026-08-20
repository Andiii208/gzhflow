#!/usr/bin/env python3
"""gzhflow 公众号 HTML 校验脚本（validate_gzh_html）。

检查 md2wechat.py 产出的 HTML 是否满足微信排版合规：
  1. 标签平衡（stack 检查：section/p/span 等必须闭合）
  2. 禁用标签（div 等在微信编辑器会丢样式）
  3. 半角标点检查（中文语境应为全角）
  4. span 包裹检查（文本必须在 span leaf 内，否则微信粘贴丢样式）

用法:
    python scripts/validate_gzh_html.py <文件.html>
    python scripts/validate_gzh_html.py --stdin < 文件.html
退出码: 0 = 通过（0 ERROR）, 1 = 有 ERROR
"""
import argparse
import re
import sys

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 允许的标签（微信编辑器支持）
ALLOWED_TAGS = {
    "section", "p", "span", "img", "h1", "h2", "h3", "h4", "strong", "em",
    "blockquote", "ul", "ol", "li", "a", "br", "hr", "code", "pre", "table",
    "thead", "tbody", "tr", "th", "td", "figure", "figcaption",
}

# 禁用标签（微信会丢样式或报错）
FORBIDDEN_TAGS = {"div", "form", "iframe", "script", "style", "input", "button", "video", "canvas"}

# 自闭合标签
VOID_TAGS = {"img", "br", "hr", "input"}

TAG_RE = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s[^<>]*?)?)(/?)>")

# 半角标点（只匹配「中文字符紧邻的半角标点」；英文句内标点/时间戳等豁免）
HALF_WIDTH_PUNCT = re.compile(r"[\u4e00-\u9fff][,;!?]")

ERRORS = []
WARNINGS = []


def validate(text: str):
    stack = []
    for m in TAG_RE.finditer(text):
        closing, tag, attrs, self_close = m.group(1), m.group(2).lower(), m.group(3), m.group(4)
        if tag in FORBIDDEN_TAGS:
            ERRORS.append(f"禁用标签: <{tag}>（微信编辑器不支持，样式会丢）")
            continue
        if tag not in ALLOWED_TAGS:
            ERRORS.append(f"未登记标签: <{tag}>（若为合法请加入 ALLOWED_TAGS）")
            continue
        if closing:
            if not stack:
                ERRORS.append(f"标签不平衡: 多余的闭合 </{tag}>")
                continue
            top = stack.pop()
            if top != tag:
                ERRORS.append(f"标签不平衡: 期望 </{top}> 但遇到 </{tag}>")
        elif not self_close and tag not in VOID_TAGS:
            stack.append(tag)

    if stack:
        ERRORS.append(f"标签不平衡: 未闭合 {stack}")

    # 禁用字符/标签检查：文本是否都在 span 内（简化：检查 section > p > span 结构存在）
    if "<span" not in text:
        WARNINGS.append("未发现 span 包裹（微信粘贴可能丢样式，建议用 md2wechat.py 生成）")

    # 半角标点检查（只统计文本节点外的明显位置；简化处理）
    # 去掉标签属性后检查正文
    text_only = re.sub(r"<[^>]+>", "", text)
    for m in HALF_WIDTH_PUNCT.finditer(text_only):
        WARNINGS.append(f"半角标点: 「{m.group(0)}」（中文语境应为全角）")


def main():
    ap = argparse.ArgumentParser(description="gzhflow 公众号 HTML 校验")
    ap.add_argument("path", nargs="?", help="HTML 文件路径")
    ap.add_argument("--stdin", action="store_true", help="从 stdin 读入")
    args = ap.parse_args()

    if args.stdin:
        text = sys.stdin.read()
    elif args.path:
        text = open(args.path, encoding="utf-8").read()
    else:
        ap.print_help()
        sys.exit(2)

    validate(text)

    for w in WARNINGS[:20]:
        print(f"⚠️  WARN: {w}")
    if len(WARNINGS) > 20:
        print(f"⚠️  ... 共 {len(WARNINGS)} 条 WARN")

    if ERRORS:
        print(f"🔴 ERROR: {len(ERRORS)} 处（必须清零才能推送）")
        for e in ERRORS[:30]:
            print("   ", e)
        sys.exit(1)

    print("✅ 校验通过：0 ERROR")
    sys.exit(0)


if __name__ == "__main__":
    main()
