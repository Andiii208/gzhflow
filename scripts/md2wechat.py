#!/usr/bin/env python3
"""gzhflow Markdown → 公众号 HTML 转换器（md2wechat）。

把 Markdown 稿件转成「可直接粘贴进公众号编辑器、粘贴后样式不丢失」的 HTML。
关键机制：
  - 内联样式（style 属性内嵌）
  - 文本用 <span leaf=""> 包裹（微信粘贴后样式保留的通行技巧）
  - 主题变量（色值/字体）从 examples/themes/<name>.yaml 读取
  - 关键词下划线：`==词==` / `++词++` 用主题下划线色标记（gzh-design 的核心特色，
    2026-10-12 前的版本会把它原样输出，属 bug）
  - `--enhance`：章节自动编号（01/02/…，末章结语用 ∞）+ 文首引言卡 + 尾部签名区

用法:
    python scripts/md2wechat.py <稿件.md> --theme moyu-green -o 输出.html
    python scripts/md2wechat.py <稿件.md> --theme red-white --enhance
    python scripts/md2wechat.py <稿件.md> --underline "具体,确定性" --enhance   # Agent 挑好关键词传进来
依赖: 无（纯 stdlib；YAML 用极简解析，主题文件为简单键值结构）
"""
import argparse
import copy
import html
import os
import re
import sys
from pathlib import Path

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent

# ============ 极简 YAML 解析（仅支持本仓库主题文件用的平面键值结构） ============
def _strip_inline_comment(s: str) -> str:
    """去掉行尾 `# 注释`，但保留引号内的 #（如色值或 URL 里的锚点）。

    2026-10-12 补：此前不剥注释，用户在主题文件里写 `accent: "#4A5D52"  # 说明`
    会把注释整段当成色值写进 style，把 style 属性的引号截断（真实踩到过）。
    """
    out, quote = [], None
    for i, ch in enumerate(s):
        if quote:
            out.append(ch)
            if ch == quote:
                quote = None
        elif ch in "\"'":
            quote = ch
            out.append(ch)
        elif ch == "#" and (i == 0 or s[i - 1].isspace()):
            break
        else:
            out.append(ch)
    return "".join(out).strip()


def load_yaml_flat(path: Path) -> dict:
    """解析极简 YAML（支持嵌套两层的 colors/fonts/layout 字典与字符串值）。"""
    data = {}
    current = None
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())
        line = _strip_inline_comment(line.strip())
        if not line:
            continue
        m = re.match(r"^(\S+):\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        # 只在整串值被一对引号完整包裹时才剥引号，避免误伤字体栈里的内层引号
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        if indent == 0:
            if val:
                data[key] = val
            else:
                data[key] = {}
                current = key
        elif indent > 0 and current:
            data.setdefault(current, {})[key] = val
    return data


DEFAULT_THEME = {
    "name": "default",
    "colors": {"bg": "#ffffff", "text": "#3f3f3f", "accent": "#8c8c8c",
               "quote_bg": "#f7f7f5", "underline": "#cfcfc9"},
    "fonts": {"body": "'SimSun', 'Songti SC', 'STSong', 'Noto Serif CJK SC', 'Source Han Serif SC', serif",
              "heading": "'SimSun', 'Songti SC', 'STSong', 'Noto Serif CJK SC', serif"},
    "layout": {"body_size": "15px", "line_height": "1.75",
               "paragraph_margin": "0 0 1em", "side_margin": "12px"},
}

# 末章用 ∞ 编号的标题特征（gzh-design 的结语变体）
FINAL_PAT = re.compile(r"结语|总结|写在最后|尾声|后记|收尾")


def mark_css(theme: dict, kind: str = "underline") -> str:
    """关键词标记的 CSS。下划线色优先取主题 underline_css，其次按 colors.underline 生成。"""
    c = theme["colors"]
    if kind == "marker":
        return f'background:{c["underline"]};padding:0 3px;border-radius:2px;'
    return theme.get("underline_css") or f'border-bottom:2px solid {c["underline"]};font-weight:600;'


def load_theme(name: str) -> dict:
    theme_path = ROOT / "examples" / "themes" / f"{name}.yaml"
    if not theme_path.exists():
        # 按内部 name 字段扫描（文件名可以是序号前缀，如 01-zen-whitespace.yaml）
        themes_dir = ROOT / "examples" / "themes"
        if themes_dir.exists():
            for candidate in themes_dir.glob("*.yaml"):
                try:
                    meta = load_yaml_flat(candidate)
                except Exception:
                    continue
                if meta.get("name") == name:
                    theme_path = candidate
                    break
    if not theme_path.exists():
        print(f"⚠️ 主题 {name} 未找到（{theme_path}），使用默认主题", file=sys.stderr)
        return copy.deepcopy(DEFAULT_THEME)
    theme = copy.deepcopy(DEFAULT_THEME)   # 深拷贝：浅拷贝会让第二个主题拿到第一个的色值
    user = load_yaml_flat(theme_path)
    for section in ("colors", "fonts", "layout"):
        if section in user:
            theme[section].update(user[section])
    for key in ("name", "underline_css"):
        if key in user:
            theme[key] = user[key]
    return theme


def strip_frontmatter(text: str) -> str:
    text = text.lstrip("\ufeff")  # 去 UTF-8 BOM
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            return parts[2]
    return text


def _code_block_html(code: str) -> str:
    """代码块内容 → HTML：丢弃首行语言标签（```python 的 python）+ HTML 转义。"""
    lines = code.strip("`").strip("\n").splitlines()
    if lines and re.match(r"^[A-Za-z0-9_+.\-]*$", lines[0].strip()):
        lines = lines[1:]
    return html.escape("\n".join(lines))


def inline(text: str, theme: dict, keywords=None) -> str:
    """处理行内标记。

    顺序有讲究：先把 ==/++/~~/<u> 这类显式标记挖成占位符，
    再按 Agent 给的关键词清单补下划线，最后处理 **/*/`/链接，末尾还原占位符。
    这样关键词不会在已有标记里再套一层。
    """
    text = html.escape(text)
    u_css, m_css = mark_css(theme, "underline"), mark_css(theme, "marker")
    stash = []

    def _stash(frag):
        stash.append(frag)
        return "\x00%d\x00" % (len(stash) - 1)

    def _mark(m):
        return _stash(f'<span style="{u_css}">{m.group(1)}</span>')

    text = re.sub(r"==(.+?)==", _mark, text)
    text = re.sub(r"\+\+(.+?)\+\+", _mark, text)
    text = re.sub(r"&lt;u&gt;(.+?)&lt;/u&gt;", _mark, text)
    text = re.sub(r"~~(.+?)~~", lambda m: _stash(f'<span style="{m_css}">{m.group(1)}</span>'), text)

    for kw in keywords or []:
        kw = kw.strip()
        if kw and html.escape(kw) in text:
            esc = html.escape(kw)
            text = text.replace(esc, f'<span style="{u_css}">{esc}</span>')

    text = re.sub(r"\*\*(.+?)\*\*", r'<strong style="font-weight:bold;color:#444;">\1</strong>', text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"`(.+?)`", r'<code style="background:#f5f5f5;padding:1px 4px;border-radius:2px;font-family:monospace;">\1</code>', text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" style="color:#576b95;">\1</a>', text)
    return re.sub(r"\x00(\d+)\x00", lambda m: stash[int(m.group(1))], text)


def to_leaf(text: str) -> str:
    """文本包 span leaf（微信样式保留关键）。"""
    return f'<span leaf="">{text}</span>'


def convert(md_text: str, theme: dict, enhance: bool = False,
            keywords=None, signature_text: str = "") -> str:
    c = theme["colors"]
    f = theme["fonts"]
    l = theme["layout"]
    # 章节编号与引言卡需要块级状态（inline 不管这些）
    h2_titles = re.findall(r"^##\s+(.+)$", md_text, re.M)
    st = {"h2": 0, "quote_seen": False}

    def il(t):
        return inline(t, theme, keywords)
    body_style = (
        f'font-family:{f["body"]};font-size:{l["body_size"]};'
        f'color:{c["text"]};line-height:{l["line_height"]};'
        f'margin:0;padding:0 {l["side_margin"]};'
    )
    p_style = f'margin:{l["paragraph_margin"]};text-align:justify;text-indent:2em;'

    # 通用容器样式（微信编辑器骨架）
    container_style = (
        f'background:{c["bg"]};{body_style}'
    )

    blocks = []
    # 先按 ``` 围栏切分文档：代码块整体处理（含空行的围栏代码块不会被按空行切碎），
    # 围栏外的 Markdown 再按空行切块。
    for chunk in re.split(r"(```[\s\S]*?```)", md_text):
        chunk = chunk.strip("\n")
        if not chunk.strip():
            continue
        if chunk.startswith("```"):
            blocks.append(
                f'<section><pre style="background:#f6f8fa;padding:12px 14px;border-radius:4px;'
                f'overflow-x:auto;font-family:monospace;font-size:13px;line-height:1.5;">'
                f'{_code_block_html(chunk)}</pre></section>'
            )
            continue
        for raw in re.split(r"\n\s*\n", chunk):
            block = raw.strip()
            if not block:
                continue
            # 图片
            img = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", block)
            if img:
                alt, src = img.group(1), img.group(2)
                cap = ""
                if alt:
                    cap = f'<p style="text-align:center;color:#888;font-size:12px;margin:4px 0 1.5em;">{to_leaf(il(alt))}</p>'
                blocks.append(
                    f'<section><p style="text-align:center;margin:1.5em 0;">'
                    f'<img src="{src}" alt="{alt}" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.08);"/></p>{cap}</section>'
                )
                continue
            # 标题
            h = re.match(r"^(#{1,4})\s+(.+)$", block)
            if h:
                level = len(h.group(1))
                size = {1: "20px", 2: "18px", 3: "16px", 4: "15px"}[level]
                title = h.group(2)
                num_html = ""
                if enhance and level == 2:
                    st["h2"] += 1
                    is_last = st["h2"] == len(h2_titles)
                    num = "∞" if (is_last and FINAL_PAT.search(title)) else "%02d" % st["h2"]
                    num_html = ('<span leaf="" style="color:%s;font-family:monospace;'
                                'font-size:0.9em;margin-right:8px;">%s</span>' % (c["accent"], num))
                blocks.append(
                    f'<section><h{level} style="font-family:{f["heading"]};font-size:{size};'
                    f'color:{c["text"]};font-weight:bold;margin:1.2em 0 0.6em;line-height:1.4;">'
                    f'{num_html}{to_leaf(il(title))}</h{level}></section>'
                )
                continue
            # 引用（金句）：--enhance 下，正文开始前的第一个引用块升级为「引言卡」
            if block.startswith(">"):
                quote_lines = [re.sub(r"^>\s?", "", ln) for ln in block.splitlines()]
                quote_text = "<br/>".join(il(q) for q in quote_lines)
                is_intro = enhance and st["h2"] == 0 and not st["quote_seen"]
                st["quote_seen"] = True
                if is_intro:
                    blocks.append(
                        f'<section style="background:{c["quote_bg"]};border-left:4px solid {c["accent"]};'
                        f'padding:14px 16px;margin:1.4em 0;border-radius:0 6px 6px 0;">'
                        f'<p style="margin:0;color:{c["text"]};font-size:15px;line-height:1.7;'
                        f'text-align:justify;">{to_leaf(quote_text)}</p></section>'
                    )
                else:
                    blocks.append(
                        f'<section><blockquote style="background:{c["quote_bg"]};border-left:3px solid {c["accent"]};'
                        f'padding:10px 14px;margin:1em 0;color:{c["text"]};">'
                        f'{to_leaf(quote_text)}</blockquote></section>'
                    )
                continue
            # 分割线
            if re.match(r"^(-{3,}|\*{3,}|_{3,})$", block):
                blocks.append(f'<section><hr style="border:none;border-top:1px solid {c["accent"]};margin:1.5em 0;"/></section>')
                continue
            # 列表
            if all(re.match(r"^[-*]\s+", ln) for ln in block.splitlines() if ln.strip()):
                li_items = [re.sub(r"^[-*]\s+", "", ln) for ln in block.splitlines() if ln.strip()]
                items = "".join(
                    f'<li style="margin:4px 0;">{to_leaf(il(li))}</li>' for li in li_items
                )
                blocks.append(f'<section><ul style="padding-left:1.5em;margin:0.8em 0;">{items}</ul></section>')
                continue
            # 有序列表
            if all(re.match(r"^\d+[.、]\s+", ln) for ln in block.splitlines() if ln.strip()):
                li_items = [re.sub(r"^\d+[.、]\s+", "", ln) for ln in block.splitlines() if ln.strip()]
                items = "".join(
                    f'<li style="margin:4px 0;">{to_leaf(il(li))}</li>' for li in li_items
                )
                blocks.append(f'<section><ol style="padding-left:1.5em;margin:0.8em 0;">{items}</ol></section>')
                continue
            # 代码块（未闭合围栏兜底；正常围栏已在顶层整体处理）
            if block.startswith("```"):
                blocks.append(
                    f'<section><pre style="background:#f6f8fa;padding:12px 14px;border-radius:4px;'
                    f'overflow-x:auto;font-family:monospace;font-size:13px;line-height:1.5;">'
                    f'{_code_block_html(block)}</pre></section>'
                )
                continue
            # 普通段落（按行，关键句独立成段交给作者控制）
            paras = []
            for ln in block.splitlines():
                ln = ln.strip()
                if ln:
                    paras.append(f'<p style="{p_style}">{to_leaf(il(ln))}</p>')
            blocks.append("<section>" + "".join(paras) + "</section>")

    # 尾部签名区（--enhance 且配置里有作者名时才有；不写死任何人名，也不加套路化互动语）
    if enhance and signature_text:
        blocks.append(
            f'<section style="margin:2em 0 0.5em;padding-top:14px;'
            f'border-top:1px solid {c["underline"]};">'
            f'<p style="margin:0;color:{c["text"]};font-size:14px;">'
            f'{to_leaf(html.escape(signature_text))}</p></section>'
        )

    doc = (
        f'<section style="{container_style}">'
        + "".join(blocks)
        + "</section>"
    )

    # 去标签间空白（span 之间换行/缩进渲染成空格，justify 下被拉伸）
    doc = re.sub(r">\s+<", "><", doc)
    return doc


def load_config_scalars() -> dict:
    """从 config/workflow.yaml 取顶层标量（author / signature）。读不到就返回空 dict。"""
    cfg = ROOT / "config" / "workflow.yaml"
    out = {}
    if not cfg.exists():
        return out
    for line in cfg.read_text(encoding="utf-8").splitlines():
        if not line or line.lstrip().startswith("#") or line[0] in " \t":
            continue                      # 缩进行属于嵌套段（stages/colors…），跳过
        m = re.match(r"^([A-Za-z_][\w]*):\s*(.*)$", line)
        if not m:
            continue
        v = m.group(2).split("#")[0].strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        out[m.group(1)] = v
    return out


def main():
    ap = argparse.ArgumentParser(description="gzhflow Markdown → 公众号 HTML")
    ap.add_argument("path", help="Markdown 稿件路径")
    ap.add_argument("--theme", default="zen", help="主题名（examples/themes/<name>.yaml）")
    ap.add_argument("-o", "--output", help="输出 HTML 路径（默认 <同名>_排版_<主题>.html）")
    ap.add_argument("--enhance", action="store_true",
                    help="开启：章节自动编号（01/02/…，末章结语 ∞）+ 文首引言卡 + 尾部签名区")
    ap.add_argument("--underline", help="关键词下划线清单，逗号分隔（Agent 挑好要点后传入）")
    ap.add_argument("--author", help="签名区作者名（缺省读 config/workflow.yaml 的 author）")
    ap.add_argument("--signature", help="签名字符串，{author} 会被替换（缺省读 config 的 signature）")
    args = ap.parse_args()

    src = Path(args.path)
    md_text = strip_frontmatter(src.read_text(encoding="utf-8"))

    theme = load_theme(args.theme)
    keywords = [k for k in (args.underline or "").split(",") if k.strip()]

    signature_text = ""
    if args.enhance:
        cfg = load_config_scalars()
        author = args.author or cfg.get("author", "")
        sig_tpl = args.signature or cfg.get("signature", "") or "—— {author}"
        if author and author not in ("你的公众号名", "your-name"):
            signature_text = sig_tpl.replace("{author}", author)
        else:
            print("⚠️ 未配置作者名（config/workflow.yaml 的 author），本次不加尾部签名区",
                  file=sys.stderr)

    html_out = convert(md_text, theme, enhance=args.enhance,
                       keywords=keywords, signature_text=signature_text)

    out = Path(args.output) if args.output else src.with_name(f"{src.stem}_排版_{args.theme}.html")
    out.write_text(html_out, encoding="utf-8")
    flags = "".join([" +enhance" if args.enhance else "",
                     " +%d 关键词下划线" % len(keywords) if keywords else ""])
    print(f"✅ 转换完成: {out}（主题: {theme.get('name', args.theme)}{flags}）")


if __name__ == "__main__":
    main()
