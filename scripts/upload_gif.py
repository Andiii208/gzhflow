#!/usr/bin/env python3
"""上传 GIF 正文图到微信素材（绕开 wechat-image-processor 的 gif→静态帧转换）。

背景（2026-08-16 DeepSeek 事件实测，见 hot-topic-transcription-workflow.md）：
baoyu-post-to-wechat 的 wechat-image-processor.ts 会把 .gif 转静态帧（WECHAT_BODY_IMAGE_UNSUPPORTED_FORMATS 含 .gif）。
微信原生支持 gif 上传（media/uploadimg），multipart 直传返回 mmbiz 长链（长期有效），脚本对远程 URL 透传 → 动图保留。

用法:
    # 1) 只上传，拿到 mmbiz URL：
    python scripts/upload_gif.py ./assets/anim.gif

    # 2) 上传并把排版 HTML 里对应 gif 的 src 替换为 mmbiz URL（原地修改）：
    python scripts/upload_gif.py ./assets/anim.gif --html article_排版_xx.html

    # 3) 输出新文件不覆盖原 HTML：
    python scripts/upload_gif.py ./assets/anim.gif --html article_排版_xx.html --out article_gif.html

环境:
    - 凭证: ~/.baoyu-skills/.env 中的 WECHAT_APP_ID / WECHAT_APP_SECRET（与推送同一套）
    - 网络: 与推送一致，需在微信 API 白名单 IP 下执行（Clash 直连 IP 失效时先切 global 再推，
      见 wechat-content-automation SKILL.md「40164 直连 IP 失效的免白名单解法」）

退出码: 0 = 成功; 1 = 失败（凭证缺失/网络错误/上传失败）
"""

import argparse
import json
import mimetypes
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import os
import re
import sys
import urllib.request
import urllib.parse
import uuid

API = "https://api.weixin.qq.com/cgi-bin"
ENV_PATH = os.path.expanduser("~/.baoyu-skills/.env")


def load_env(path):
    """解析 .env 文件（WECHAT_APP_ID / WECHAT_APP_SECRET）。"""
    if not os.path.exists(path):
        return {}
    env = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def get_access_token(appid, secret):
    url = f"{API}/token?grant_type=client_credential&appid={appid}&secret={secret}"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read().decode("utf-8"))
    if "access_token" not in data:
        raise RuntimeError(f"gettoken 失败: {data}")
    return data["access_token"]


def upload_gif(access_token, gif_path):
    """multipart/form-data 上传 gif 到 media/uploadimg，返回 mmbiz URL。"""
    boundary = "----HermesGif" + uuid.uuid4().hex
    with open(gif_path, "rb") as f:
        content = f.read()
    ctype = mimetypes.guess_type(gif_path)[0] or "image/gif"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="media"; filename="{os.path.basename(gif_path)}"\r\n'
        f"Content-Type: {ctype}\r\n\r\n"
    ).encode("utf-8") + content + f"\r\n--{boundary}--\r\n".encode("utf-8")

    url = f"{API}/media/uploadimg?access_token={access_token}"
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read().decode("utf-8"))
    if "url" not in data:
        raise RuntimeError(f"uploadimg 失败: {data}")
    return data["url"]


def replace_in_html(html_path, gif_name, mmbiz_url, out_path=None):
    """把 HTML 中 src 以 gif 文件名结尾的 <img> 替换为 mmbiz URL。"""
    with open(html_path, encoding="utf-8") as f:
        html = f.read()
    # 匹配 src=".../xxx.gif"（文件名精确匹配，避免误伤其他 gif）
    pat = re.compile(r'(<img[^>]*\bsrc=["\'])([^"\']*' + re.escape(gif_name) + r')(["\'])', re.I)
    n = len(pat.findall(html))
    if n == 0:
        print(f"⚠️  HTML 中未找到 src 引用 `{gif_name}`（{html_path}）——gif 已上传但未替换")
    html2 = pat.sub(lambda m: m.group(1) + mmbiz_url + m.group(3), html)
    target = out_path or html_path
    with open(target, "w", encoding="utf-8") as f:
        f.write(html2)
    print(f"✅ 已替换 {n} 处 gif 引用 → {target}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("gif", help="GIF 文件路径")
    ap.add_argument("--html", help="排版 HTML 路径（上传后替换其中的 gif src）")
    ap.add_argument("--out", help="替换结果写到新文件（默认原地修改）")
    args = ap.parse_args()

    if not os.path.exists(args.gif):
        print(f"🔴 GIF 不存在: {args.gif}")
        sys.exit(1)

    env = load_env(ENV_PATH)
    appid = env.get("WECHAT_APP_ID")
    secret = env.get("WECHAT_APP_SECRET")
    if not appid or not secret:
        print(f"🔴 凭证缺失：{ENV_PATH} 中需有 WECHAT_APP_ID / WECHAT_APP_SECRET")
        sys.exit(1)

    try:
        token = get_access_token(appid, secret)
        url = upload_gif(token, args.gif)
    except Exception as e:
        print(f"🔴 上传失败: {e}")
        print("   ⚠️ 若为 40164 invalid ip：先切 Clash global 再执行（见 SKILL.md 40164 解法）")
        sys.exit(1)

    print(f"✅ GIF 上传成功: {url}")
    if args.html:
        replace_in_html(args.html, os.path.basename(args.gif), url, args.out)


if __name__ == "__main__":
    main()
