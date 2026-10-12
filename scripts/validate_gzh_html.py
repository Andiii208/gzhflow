#!/usr/bin/env python3
"""gzhflow 公众号 HTML 校验脚本（validate_gzh_html）。

检查排版产物是否满足微信的粘贴限制，把 SKILL.md 里的平台红线从模型自觉变成确定性兜底。
历史上这个文件有一份 111 行的弱实现（只查标签平衡和 div/script/style），
class / id / @media / grid 等 13 项 CSS 红线漏在外面，而 README 和 CI 都指向它。
2026-10-12 两份合并：真正的实现在这里，gzh-design 下那个路径改成转发。

检查内容：
  1. 禁用标签与 CSS 红线（style/script/div/link/class/id/position:fixed/float/@media/grid/var()/外部字体）
  2. 标签白名单（未登记的标签直接报错，防止混入公众号不认的元素）
  3. 标签开闭平衡与交叉嵌套
  4. 文字节点是否被 <span leaf> 包裹（粘贴后不掉样式）
  5. 半角标点与英文引号（代码块内不计）
  6. 内联渐变背景（公众号深色模式会弹 darkmode-no-gradient 提示）

用法:
    python scripts/validate_gzh_html.py <文件.html>
    python scripts/validate_gzh_html.py --stdin < 文件.html

退出码: 0 = 通过, 1 = 有 ERROR（必须清零才能推送）
"""

import argparse
import re
import sys
from html.parser import HTMLParser

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# (正则, 说明) —— 命中即 ERROR，会被公众号过滤或导致粘贴后样式失效
FORBIDDEN = [
    (re.compile(r"<style[\s>]", re.I), "<style> 标签会被过滤，样式必须内联"),
    (re.compile(r"<script[\s>]", re.I), "<script> 标签会被过滤"),
    (re.compile(r"</?div[\s>]", re.I), "<div> 会被改写，请用 <section>"),
    (re.compile(r"<link[\s>]", re.I), "外部 <link>（CSS/字体）会被过滤"),
    (re.compile(r"\sclass\s*=", re.I), "class 属性会被剥离，请用内联 style"),
    (re.compile(r"\sid\s*=", re.I), "id 属性会被剥离"),
    (re.compile(r"position\s*:\s*(fixed|absolute|sticky)", re.I),
     "position fixed/absolute/sticky 不被支持"),
    (re.compile(r"float\s*:", re.I), "float 不被支持"),
    (re.compile(r"@media", re.I), "@media 媒体查询不被支持"),
    (re.compile(r"@keyframes", re.I), "@keyframes 动画不被支持"),
    (re.compile(r"@import", re.I), "@import 不被支持"),
    (re.compile(r"display\s*:\s*grid", re.I), "display:grid 不被支持，请用 flex"),
    (re.compile(r"var\s*\(\s*--", re.I), "CSS 变量 var(--x) 不被支持，请写死值"),
    (re.compile(r"url\s*\(\s*['\"]?https?://[^)]*\.(woff2?|ttf|otf|eot)", re.I),
     "外部字体不被支持"),
]

# 公众号编辑器认识的标签。没登记的一律报错，宁可错杀不放进正文。
ALLOWED_TAGS = {
    "section", "p", "span", "img", "h1", "h2", "h3", "h4", "strong", "em",
    "blockquote", "ul", "ol", "li", "a", "br", "hr", "code", "pre", "table",
    "thead", "tbody", "tr", "th", "td", "figure", "figcaption",
}

# 必须开闭平衡的标签。2026-08-16 实测：章节 <section> 忘闭合，章节互相嵌套，
# 微信端深层嵌套会把宽度收缩，同篇前几章看起来比后几章窄。
BALANCE_TAGS = ("section", "p", "span", "strong", "em", "h3", "blockquote")
TAG_RE = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>")

CJK = re.compile(r"[一-鿿㐀-䶿]")
SKIP_TAGS = {"head", "title", "style", "script"}
# 中文字后紧跟半角逗号/分号/叹号/问号；只查中文在前，中英混排不误伤
HALF_PUNCT = re.compile(r"[一-鿿㐀-䶿][,;!?]")
ASCII_QUOTE = re.compile(r"[\"']")
# 代码区特征：等宽字体或 white-space:pre，其内半角符号是正常的
CODE_STYLE = re.compile(r"monospace|white-space\s*:\s*pre|courier|consolas|sf mono", re.I)
# 渐变背景：公众号开启"深色模式"时会因渐变弹 darkmode-no-gradient 提示，破坏阅读体验。
# 只挖掉 CSS 注释与 url() 里的干扰内容——注意不能连引号一起挖，
# 因为样式就写在 style="…" 的引号里（源仓库那份实现连引号一起挖，导致这条检查形同虚设）。
CSS_NON_FUNCTION = re.compile(
    r"/\*.*?\*/|url\(\s*(?:\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|(?:\\.|[^)])*)\s*\)",
    re.I | re.S)
GRADIENT_BACKGROUND = re.compile(
    r"background(?:-image)?\s*:[^;\"']*?\b(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(",
    re.I)


def check_balance(html):
    """栈解析标签开闭平衡，返回问题列表（空 = 平衡）。

    查两类问题：未闭合 / 多余闭合，以及 <section><p>…</section></p> 这种交叉嵌套。
    """
    stack, problems = [], []
    for m in TAG_RE.finditer(html):
        closing, tag, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if not closing and attrs.rstrip().endswith("/"):
            continue
        if tag not in BALANCE_TAGS:
            continue
        if closing:
            if not stack:
                problems.append("多余的闭合标签 </%s>（偏移 %d）" % (tag, m.start()))
            elif stack[-1] == tag:
                stack.pop()
            else:
                problems.append(
                    "交叉嵌套：期望闭合 <%s>，遇到 </%s>（偏移 %d）"
                    % (stack[-1], tag, m.start()))
                for i in range(len(stack) - 1, -1, -1):
                    if stack[i] == tag:
                        del stack[i:]
                        break
        else:
            stack.append(tag)
    if stack:
        problems.append("未闭合标签: " + " > ".join("<%s>" % t for t in stack))
    return problems


def check_tags(html):
    """查禁用标签与未登记标签。"""
    problems = []
    for m in TAG_RE.finditer(html):
        tag = m.group(2).lower()
        if tag in ("div", "form", "iframe", "script", "style", "input",
                   "button", "video", "canvas"):
            problems.append("禁用标签 <%s>：公众号不支持，样式会丢" % tag)
        elif tag not in ALLOWED_TAGS:
            problems.append("未登记标签 <%s>：公众号可能不认，请换 section/p/span" % tag)
    return problems


class LeafChecker(HTMLParser):
    """逐个文本节点看它是否被 <span leaf> 包着，顺带收半角标点。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []           # [(tag, is_leaf, is_code)]
        self.leaf_depth = 0
        self.code_depth = 0
        self.span_leaf_count = 0
        self.unwrapped = []       # (文本片段, 父标签)
        self.half_punct = []

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        is_leaf = tag == "span" and "leaf" in ad
        is_code = bool(CODE_STYLE.search(ad.get("style", "") or ""))
        if is_leaf:
            self.span_leaf_count += 1
            self.leaf_depth += 1
        if is_code:
            self.code_depth += 1
        self.stack.append((tag, is_leaf, is_code))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for _, was_leaf, was_code in self.stack[i:]:
                    if was_leaf:
                        self.leaf_depth -= 1
                    if was_code:
                        self.code_depth -= 1
                del self.stack[i:]
                break

    def handle_data(self, data):
        text = data.strip()
        if not text or not CJK.search(text):
            return
        if any(t in SKIP_TAGS for t, _, _ in self.stack):
            return
        if self.leaf_depth == 0:
            parent = self.stack[-1][0] if self.stack else "(root)"
            snippet = text[:24] + ("…" if len(text) > 24 else "")
            self.unwrapped.append((snippet, parent))
        if self.code_depth == 0 and (HALF_PUNCT.search(text)
                                     or ASCII_QUOTE.search(text)):
            snippet = text[:24] + ("…" if len(text) > 24 else "")
            self.half_punct.append(snippet)


def validate(html):
    """返回 (errors, warnings, span_leaf_count)。"""
    errors, warnings = [], []

    for prob in check_balance(html):
        errors.append("标签不平衡: " + prob)
    for prob in check_tags(html):
        errors.append(prob)

    for rx, msg in FORBIDDEN:
        hits = len(rx.findall(html))
        if hits:
            errors.append("%s（命中 %d 处）" % (msg, hits))

    checker = LeafChecker()
    try:
        checker.feed(html)
    except Exception as e:
        warnings.append("HTML 解析中断: %s" % e)

    has_cjk = bool(CJK.search(html))
    if has_cjk and checker.span_leaf_count == 0:
        errors.append("全文没有任何 <span leaf> 包裹，粘贴到公众号后样式会大面积丢失")
    elif checker.unwrapped:
        sample = "；".join("「%s」(在 <%s> 内)" % (s, p)
                          for s, p in checker.unwrapped[:5])
        warnings.append("%d 处中文文本未被 <span leaf> 包裹，样式可能丢失。例：%s"
                        % (len(checker.unwrapped), sample))

    if checker.half_punct:
        sample = "；".join("「%s」" % s for s in checker.half_punct[:5])
        warnings.append("%d 处正文疑似半角标点/英文引号，应改中文全角（代码块内不计）。例：%s"
                        % (len(checker.half_punct), sample))

    # 渐变背景（挖掉注释/字符串/url 后再查，避免把示例文字当样式）
    masked = CSS_NON_FUNCTION.sub(" ", html)
    grad_hits = list(GRADIENT_BACKGROUND.finditer(masked))
    if grad_hits:
        warnings.append(
            "%d 处内联渐变背景（background:…gradient）：公众号深色模式会弹 darkmode-no-gradient "
            "提示。建议改主题内纯色/rgba；确需保留时交付说明风险" % len(grad_hits))

    return errors, warnings, checker.span_leaf_count


def main():
    ap = argparse.ArgumentParser(description="gzhflow 公众号 HTML 校验")
    ap.add_argument("file", nargs="?", help="HTML 文件路径")
    ap.add_argument("--stdin", action="store_true", help="从标准输入读取")
    args = ap.parse_args()

    if args.stdin or not args.file:
        html = sys.stdin.read()
        name = "<stdin>"
    else:
        with open(args.file, encoding="utf-8", errors="replace") as f:
            html = f.read()
        name = args.file

    errors, warnings, leaf_n = validate(html)

    print("📋 公众号 HTML 合规校验: %s" % name)
    print("   span leaf 包裹: %d 处" % leaf_n)
    if errors:
        print("\n❌ ERROR ×%d（必须修复，否则粘贴后失效）:" % len(errors))
        for e in errors:
            print("   • %s" % e)
    if warnings:
        print("\n⚠️  WARNING ×%d（建议人工确认）:" % len(warnings))
        for w in warnings:
            print("   • %s" % w)
    if not errors and not warnings:
        print("\n✅ 完全合规，可直接粘贴到公众号编辑器")
    elif not errors:
        print("\n✅ 无致命问题，可粘贴（warning 请人工确认）")

    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
