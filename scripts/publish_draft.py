#!/usr/bin/env python3
"""gzhflow 推草稿箱工具（publish_draft）。

调用微信官方 API 把排版好的 HTML + 封面图推送到公众号草稿箱：
  1. 获取 access_token（凭 AppID + AppSecret）
  2. 上传正文图片（media/uploadimg）→ 重写为 https URL
  3. 上传封面素材（media/add_material, type=image）
  4. draft/add 创建草稿

⚠️ 个人主体公众号 2025-07 起无法 API 直接发布（freepublish 回收），
   本工具只推草稿箱，用户在「公众号助手 App」手动点发布。

凭证读取优先级：命令行参数 → 环境变量 WECHAT_APP_ID/WECHAT_APP_SECRET
              → config/publish.yaml 的 wechat 字段

用法:
    python scripts/publish_draft.py <排版.html> --title "标题" \
        --author "作者" --summary "摘要" --cover cover.jpg --dry-run
    python scripts/publish_draft.py <排版.html> --title "标题" \
        --author "作者" --summary "摘要" --cover cover.jpg

退出码: 0 = 成功, 非0 = 失败
"""
import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

API_BASE = "https://api.weixin.qq.com"
ROOT = Path(__file__).resolve().parent.parent


# ============ 凭证读取 ============
def load_credentials(args):
    app_id = args.app_id or os.environ.get("WECHAT_APP_ID")
    app_secret = args.app_secret or os.environ.get("WECHAT_APP_SECRET")

    if not app_id or not app_secret:
        # 兜底：config/publish.yaml
        cfg = ROOT / "config" / "publish.yaml"
        if cfg.exists():
            text = cfg.read_text(encoding="utf-8")
            m_id = re.search(r"app_id\s*[:=]\s*[\"']?([^\"'\s]+)", text)
            m_sec = re.search(r"app_secret\s*[:=]\s*[\"']?([^\"'\s]+)", text)
            if m_id:
                app_id = app_id or m_id.group(1)
            if m_sec:
                app_secret = app_secret or m_sec.group(1)

    if not app_id or not app_secret:
        print("❌ 缺少凭证：请设环境变量 WECHAT_APP_ID/WECHAT_APP_SECRET 或填 config/publish.yaml", file=sys.stderr)
        sys.exit(2)
    if "your_" in app_id or "your_" in app_secret or "REDACTED" in app_id:
        print("❌ 凭证仍是占位符（your_*/REDACTED），请填入真实 AppID/AppSecret", file=sys.stderr)
        sys.exit(2)
    return app_id, app_secret


# ============ API 调用 ============
def _die_api_error(e: Exception, context: str) -> None:
    """urllib 网络/HTTP 错误 → 友好信息 + exit(1)，不吐 traceback。"""
    if isinstance(e, urllib.error.HTTPError):
        body = e.read().decode("utf-8", errors="replace")[:300]
        print(f"❌ 微信 API HTTP {e.code}（{context}）: {body}", file=sys.stderr)
    else:
        print(f"❌ 微信 API 网络错误（{context}）: {e.reason}", file=sys.stderr)
    sys.exit(1)


def _die_wechat_error(resp: dict, context: str) -> None:
    """微信业务错误 → 40164（IP 白名单）给友好提示，其余给原始响应；exit(1)。"""
    errcode = resp.get("errcode")
    errmsg = str(resp.get("errmsg", ""))
    if errcode == 40164 or "invalid ip" in errmsg:
        print(f"❌ {context}失败: IP 不在白名单（errcode 40164 invalid ip）。"
              f"请把当前出口 IP 加入「公众号后台 → 设置与开发 → 基本配置 → IP 白名单」", file=sys.stderr)
    else:
        print(f"❌ {context}失败: {resp}", file=sys.stderr)
    sys.exit(1)


def api_get(url: str) -> dict:
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            return json.loads(r.read().decode("utf-8"))
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        _die_api_error(e, "api_get")


def api_post(url: str, data: dict, files: dict = None) -> dict:
    if files:
        # multipart 上传素材
        boundary = "----gzhflowBoundary" + os.urandom(8).hex()
        body = b""
        for key, (fname, content, ctype) in files.items():
            body += f"--{boundary}\r\n".encode()
            body += f'Content-Disposition: form-data; name="{key}"; filename="{fname}"\r\n'.encode()
            body += f"Content-Type: {ctype}\r\n\r\n".encode()
            body += content + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        )
    else:
        req = urllib.request.Request(
            url, data=json.dumps(data, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        _die_api_error(e, "api_post")


def _content_type(path: Path) -> str:
    """按文件后缀判断上传 Content-Type（.png→image/png、.gif→image/gif，默认 image/jpeg）。"""
    return {
        ".png": "image/png",
        ".gif": "image/gif",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }.get(path.suffix.lower(), "image/jpeg")


def get_token(app_id: str, app_secret: str) -> str:
    url = f"{API_BASE}/cgi-bin/token?grant_type=client_credential&appid={app_id}&secret={app_secret}"
    resp = api_get(url)
    if "access_token" not in resp:
        _die_wechat_error(resp, "获取 token")
    return resp["access_token"]


# ============ 上传图片 ============
def upload_image(token: str, img_path: Path) -> str:
    """上传正文图片（media/uploadimg），返回 https URL。"""
    content = img_path.read_bytes()
    url = f"{API_BASE}/cgi-bin/media/uploadimg?access_token={token}"
    resp = api_post(url, {}, files={"media": (img_path.name, content, _content_type(img_path))})
    if "url" not in resp:
        _die_wechat_error(resp, "上传正文图片")
    return resp["url"]


def upload_cover(token: str, cover_path: Path) -> str:
    """上传封面为永久素材（material/add_material），返回 media_id（thumb_media_id 用）。

    注意：路径是 /cgi-bin/material/add_material（永久素材），不是 /cgi-bin/media/...
    （media/ 下没有 add_material，写错会 404）。个人订阅号拥有此基础权限。
    """
    content = cover_path.read_bytes()
    url = f"{API_BASE}/cgi-bin/material/add_material?access_token={token}&type=image"
    resp = api_post(url, {}, files={"media": (cover_path.name, content, _content_type(cover_path))})
    if "media_id" not in resp:
        _die_wechat_error(resp, "上传封面")
    return resp["media_id"]


def upload_html_images(token: str, html_text: str, base_dir: Path) -> str:
    """扫描 HTML 中的本地图片，上传并重写为 https URL。"""
    def _replace(m):
        src = m.group(1)
        if src.startswith(("http://", "https://", "data:")):
            return m.group(0)
        p = base_dir / src
        if not p.exists():
            print(f"⚠️ 图片不存在，保留原路径: {src}", file=sys.stderr)
            return m.group(0)
        url = upload_image(token, p)
        print(f"  ↳ 上传图片 {src} → {url[:60]}…")
        return f'src="{url}"'
    return re.sub(r'src="([^"]+)"', _replace, html_text)


# ============ 发布偏好（config/publish.yaml 的 publish 段） ============
def load_publish_config() -> dict:
    """极简读取 config/publish.yaml 的 publish.default_author / publish.open_comment。"""
    cfg = ROOT / "config" / "publish.yaml"
    result = {"default_author": "", "open_comment": True}
    if not cfg.exists():
        return result
    text = cfg.read_text(encoding="utf-8")
    m = re.search(r"default_author\s*[:=]\s*[\"']?([^\"'\n]+)", text)
    if m:
        result["default_author"] = m.group(1).strip().strip("\"'")
    m = re.search(r"open_comment\s*[:=]\s*(\w+)", text)
    if m:
        result["open_comment"] = m.group(1).strip().lower() in ("true", "1", "yes")
    return result


# ============ 主流程 ============
def main():
    ap = argparse.ArgumentParser(description="gzhflow 推草稿箱（微信官方 API）")
    ap.add_argument("html", help="排版 HTML 路径")
    ap.add_argument("--title", required=True, help="文章标题")
    ap.add_argument("--author", help="作者（默认 config 或 frontmatter）")
    ap.add_argument("--summary", help="摘要（默认截取正文前 120 字）")
    ap.add_argument("--cover", help="封面图路径（2.35:1 ≈ 900x383；缺省读 frontmatter 的 coverImage）")
    ap.add_argument("--no-cover", action="store_true", help="不设置封面（个人订阅号 API 无法传封面，稍后在公众号助手 App 手动补）")
    ap.add_argument("--app-id", help="AppID（覆盖环境变量）")
    ap.add_argument("--app-secret", help="AppSecret（覆盖环境变量）")
    ap.add_argument("--dry-run", action="store_true", help="验证全链路但不推送（取 token 前返回）")
    args = ap.parse_args()

    html_path = Path(args.html)
    if not html_path.exists():
        print(f"❌ HTML 不存在: {html_path}", file=sys.stderr)
        sys.exit(2)

    # 元数据：CLI 参数 > frontmatter（md 侧车文件）
    html_text = html_path.read_text(encoding="utf-8")
    author = args.author
    summary = args.summary
    title = args.title
    cover = Path(args.cover) if args.cover else None

    # 侧车 md：优先同名 .md，其次工作流产物 draft.md（两者都在 output_dir 内）
    md_side = next(
        (p for p in (html_path.with_suffix(".md"), html_path.parent / "draft.md") if p.exists()),
        None,
    )
    if md_side and not args.no_cover:
        md_text = md_side.read_text(encoding="utf-8")
        fm = re.search(r"^---\s*\n(.*?)\n---", md_text, re.S)
        if fm:
            for key, pat in (("title", r"title\s*:\s*(.+)"),
                             ("author", r"author\s*:\s*(.+)"),
                             ("description", r"description\s*:\s*(.+)"),
                             ("coverImage", r"coverImage\s*:\s*(.+)")):
                m = re.search(pat, fm.group(1))
                val = m.group(1).strip() if m else ""
                if not val or val == "null":
                    continue
                if key == "title":
                    title = title or val
                elif key == "author":
                    author = author or val
                elif key == "description":
                    summary = summary or val
                elif key == "coverImage" and cover is None:
                    cover = html_path.parent / val

    if cover is None and not args.no_cover:
        print("❌ 未指定封面：请用 --cover，或在 frontmatter 写 coverImage，或加 --no-cover", file=sys.stderr)
        sys.exit(2)
    if cover is not None and not cover.exists():
        print(f"❌ 封面不存在: {cover}", file=sys.stderr)
        sys.exit(2)

    # 作者兜底：--author > frontmatter author > config/publish.yaml 的 publish.default_author > 空
    pub_cfg = load_publish_config()
    if not author:
        author = pub_cfg["default_author"] or ""

    if args.dry_run:
        print("✅ dry-run 通过：参数/文件就绪（未取 token，零风险）")
        print(f"   title: {title}")
        print(f"   author: {author or '(未指定)'}")
        print(f"   summary: {(summary or '')[:60]}{'…' if summary and len(summary) > 60 else ''}")
        print(f"   cover: {cover}")
        sys.exit(0)

    app_id, app_secret = load_credentials(args)
    token = get_token(app_id, app_secret)
    print("✅ 已获取 access_token")

    # 上传正文图片并重写
    html_remote = upload_html_images(token, html_text, html_path.parent)
    if html_remote != html_text:
        print("✅ 正文图片已上传并重写为 https URL")

    # 上传封面（个人订阅号 thumb_media_id 需永久素材、无 add_material 权限：
    # 40007/404。封面交给用户到公众号助手 App 手动设置，正文完整推送即可）
    cover_media_id = None
    if cover is not None:
        try:
            cover_media_id = upload_cover(token, cover)
            print(f"✅ 封面已上传: {cover_media_id}")
        except SystemExit:
            print("⚠️ 封面上传失败（个人订阅号限制），继续推送正文，封面请在公众号助手 App 手动设置", file=sys.stderr)

    # 摘要兜底：截取正文前 120 字
    if not summary:
        text_only = re.sub(r"<[^>]+>", "", html_remote)
        summary = re.sub(r"\s+", "", text_only)[:120]

    # 创建草稿
    article = {
        "title": title,
        "author": author or "",
        "digest": summary,
        "content": html_remote,
        "content_source_url": "",
        "need_open_comment": 1 if pub_cfg["open_comment"] else 0,
    }
    if cover_media_id:
        article["thumb_media_id"] = cover_media_id
    resp = api_post(f"{API_BASE}/cgi-bin/draft/add?access_token={token}", {"articles": [article]})
    if "media_id" in resp:
        print(f"✅ 已推送到草稿箱: {resp['media_id']}")
        print("   请在「公众号助手 App → 草稿箱」检查后手动发布（个人号无法 API 直接发布）")
        sys.exit(0)
    _die_wechat_error(resp, "创建草稿")


if __name__ == "__main__":
    main()
