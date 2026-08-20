#!/usr/bin/env python3
"""gzhflow Markdown → 公众号 HTML 转换器（md2wechat）。

把 Markdown 稿件转成「可直接粘贴进公众号编辑器、粘贴后样式不丢失」的 HTML。
关键机制：
  - 内联样式（style 属性内嵌）
  - 文本用 <span leaf=""> 包裹（微信粘贴后样式保留的通行技巧）
  - 主题变量（色值/字体）从 examples/themes/<name>.yaml 读取

用法:
    python scripts/md2wechat.py <稿件.md> --theme zen -o 输出.html
    python scripts/md2wechat.py <稿件.md> --theme minimal            # 默认输出到同目录
依赖: 无（纯 stdlib；YAML 用极简解析，主题文件为简单键值结构）
"""
import argparse
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
def load_yaml_flat(path: Path) -> dict:
    """解析极简 YAML（支持嵌套两层的 colors/fonts/layout 字典与字符串值）。"""
    data = {}
    current = None
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())
        m = re.match(r"^(\S+):\s*(.*)$", line.strip())
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
    "colors": {"bg": "#ffffff", "text": "#3f3f3f", "accent": "#8c8c8c", "quote_bg": "#f7f7f5"},
    "fonts": {"body": "'SimSun', 'Songti SC', 'STSong', 'Noto Serif CJK SC', 'Source Han Serif SC', serif",
              "heading": "'SimSun', 'Songti SC', 'STSong', 'Noto Serif CJK SC', serif"},
    "layout": {"body_size": "15px", "line_height": "1.75",
               "paragraph_margin": "0 0 1em", "side_margin": "12px"},
}


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
        return DEFAULT_THEME
    theme = DEFAULT_THEME.copy()
    user = load_yaml_flat(theme_path)
    for section in ("colors", "fonts", "layout"):
        if section in user:
            theme[section].update(user[section])
    if "name" in user:
        theme["name"] = user["name"]
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


def inline(text: str) -> str:
    """处理行内标记：加粗/斜体/行内代码/链接（先 HTML 转义再套标记）。"""
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r'<strong style="font-weight:bold;color:#444;">\1</strong>', text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"`(.+?)`", r'<code style="background:#f5f5f5;padding:1px 4px;border-radius:2px;font-family:monospace;">\1</code>', text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" style="color:#576b95;">\1</a>', text)
    return text


def to_leaf(text: str) -> str:
    """文本包 span leaf（微信样式保留关键）。"""
    return f'<span leaf="">{text}</span>'


def convert(md_text: str, theme: dict) -> str:
    c = theme["colors"]
    f = theme["fonts"]
    l = theme["layout"]
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
                    cap = f'<p style="text-align:center;color:#888;font-size:12px;margin:4px 0 1.5em;">{to_leaf(alt)}</p>'
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
                blocks.append(
                    f'<section><h{level} style="font-family:{f["heading"]};font-size:{size};'
                    f'color:{c["text"]};font-weight:bold;margin:1.2em 0 0.6em;line-height:1.4;">'
                    f'{to_leaf(inline(h.group(2)))}</h{level}></section>'
                )
                continue
            # 引用（金句）
            if block.startswith(">"):
                quote_lines = [re.sub(r"^>\s?", "", ln) for ln in block.splitlines()]
                quote_text = "<br/>".join(inline(q) for q in quote_lines)
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
                    f'<li style="margin:4px 0;">{to_leaf(inline(li))}</li>' for li in li_items
                )
                blocks.append(f'<section><ul style="padding-left:1.5em;margin:0.8em 0;">{items}</ul></section>')
                continue
            # 有序列表
            if all(re.match(r"^\d+[.、]\s+", ln) for ln in block.splitlines() if ln.strip()):
                li_items = [re.sub(r"^\d+[.、]\s+", "", ln) for ln in block.splitlines() if ln.strip()]
                items = "".join(
                    f'<li style="margin:4px 0;">{to_leaf(inline(li))}</li>' for li in li_items
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
                    paras.append(f'<p style="{p_style}">{to_leaf(inline(ln))}</p>')
            blocks.append("<section>" + "".join(paras) + "</section>")

    html = (
        f'<section style="{container_style}">'
        + "".join(blocks)
        + "</section>"
    )

    # 去标签间空白（span 之间换行/缩进渲染成空格，justify 下被拉伸）
    html = re.sub(r">\s+<", "><", html)
    return html


def main():
    ap = argparse.ArgumentParser(description="gzhflow Markdown → 公众号 HTML")
    ap.add_argument("path", help="Markdown 稿件路径")
    ap.add_argument("--theme", default="zen", help="主题名（examples/themes/<name>.yaml）")
    ap.add_argument("-o", "--output", help="输出 HTML 路径（默认 <同名>_排版_<主题>.html）")
    args = ap.parse_args()

    src = Path(args.path)
    md_text = src.read_text(encoding="utf-8")
    md_text = strip_frontmatter(md_text)

    theme = load_theme(args.theme)
    html = convert(md_text, theme)

    if args.output:
        out = Path(args.output)
    else:
        out = src.with_name(f"{src.stem}_排版_{args.theme}.html")
    out.write_text(html, encoding="utf-8")
    print(f"✅ 转换完成: {out}（主题: {theme.get('name', args.theme)}）")


if __name__ == "__main__":
    main()
