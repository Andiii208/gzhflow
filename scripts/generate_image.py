#!/usr/bin/env python3
"""gzhflow 图生脚本（generate_image）。

阶段④配图的「生成」一步：调用 OpenAI 兼容的 /images/generations 端点出图，
覆盖 cover/inline 两种尺寸，响应兼容 b64_json 与 url 两种返回格式。

后端配置读 config/workflow.yaml 的 image_backend 段：
    image_backend:
      base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1"
      model: "wanx2.1-t2i-turbo"
      api_key_env: "IMAGE_API_KEY"    # API Key 从该环境变量读（本地 .env）
比例默认取自 image_spec（cover_ratio/inline_ratio），也可用 --ratio / --size 覆盖。

依赖: 无（纯 stdlib：urllib + base64 + json）

用法:
    python scripts/generate_image.py --prompt "..." --ratio 16:9 -o cover.png
    python scripts/generate_image.py --prompt "..." --ratio 1:1 -o square.png --n 2
    python scripts/generate_image.py --prompt "..." --size 1280x720 -o out.png

退出码: 0 = 成功, 1 = API 失败, 2 = 配置缺失（缺 API key / 缺 base_url/model）
"""
import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent

# 比例 → 常见厂商尺寸映射（不同厂商 size 格式不同，可用 --size 覆盖）
RATIO_SIZES = {
    "16:9": "1280x720",
    "1:1": "1024x1024",
    "2.35:1": "1280x544",
    "4:3": "1024x768",
    "3:2": "1152x768",
}


def load_workflow_config() -> dict:
    """读取 config/workflow.yaml（极简平面 YAML 解析，纯 stdlib）。"""
    cfg = ROOT / "config" / "workflow.yaml"
    if not cfg.exists():
        return {}
    data = {}
    current = None
    for line in cfg.read_text(encoding="utf-8").splitlines():
        line = line.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())
        m = re.match(r"^(\S+):\s*(.*)$", line.strip())
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        # 只在整串值被一对引号完整包裹时才剥引号
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


def main():
    ap = argparse.ArgumentParser(description="gzhflow 图生（OpenAI 兼容 /images/generations）")
    ap.add_argument("--prompt", required=True, help="图片描述 prompt（四段式编译产物）")
    ap.add_argument("--ratio", help="画布比例（16:9 / 1:1 / 2.35:1；缺省读 config image_spec.cover_ratio）")
    ap.add_argument("--size", help="直接指定 size（如 1280x720），覆盖比例映射")
    ap.add_argument("-o", "--output", required=True, help="输出图片路径")
    ap.add_argument("--n", type=int, default=1, help="生成张数（默认 1；>1 时输出文件加序号）")
    args = ap.parse_args()

    if args.n < 1:
        print("❌ --n 必须 ≥ 1", file=sys.stderr)
        sys.exit(2)

    cfg = load_workflow_config()
    backend = cfg.get("image_backend") or {}
    api_key_env = backend.get("api_key_env", "IMAGE_API_KEY")

    # API Key 缺失 → exit 2（配置缺失类）
    api_key = os.environ.get(api_key_env, "")
    if not api_key:
        print(f"❌ 缺 API key：环境变量 {api_key_env} 未设置"
              f"（在 .env 里设它，或在 config/workflow.yaml 的 image_backend.api_key_env 指定别的变量名）",
              file=sys.stderr)
        sys.exit(2)

    base_url = backend.get("base_url", "").rstrip("/")
    model = backend.get("model", "")
    if not base_url or not model:
        print("❌ 缺配置：config/workflow.yaml 的 image_backend.base_url / model 未设置"
              "（参考 config/workflow.example.yaml）", file=sys.stderr)
        sys.exit(2)

    # 比例解析：--ratio > image_spec.cover_ratio > 16:9
    ratio = args.ratio
    if not ratio:
        spec = cfg.get("image_spec") or {}
        ratio = spec.get("cover_ratio", "16:9")
    size = args.size or RATIO_SIZES.get(ratio)
    if not size:
        print(f"❌ 未知比例 {ratio}：请用 --size 直接指定（如 --size 1280x720）", file=sys.stderr)
        sys.exit(2)

    # 调用 OpenAI 兼容接口
    url = f"{base_url}/images/generations"
    body = json.dumps({"model": model, "prompt": args.prompt, "size": size, "n": args.n}).encode("utf-8")
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            resp = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:300]
        print(f"❌ 图生 API HTTP {e.code}: {detail}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"❌ 图生 API 网络错误: {e.reason}", file=sys.stderr)
        sys.exit(1)

    if "error" in resp:
        print(f"❌ 图生 API 返回错误: {resp['error']}", file=sys.stderr)
        sys.exit(1)

    data = resp.get("data") or []
    if not data:
        print(f"❌ 图生 API 响应无 data 字段: {resp}", file=sys.stderr)
        sys.exit(1)

    # 保存图片：b64_json 或 url 两种兼容
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    saved = []
    for i, item in enumerate(data[: args.n]):
        if args.n > 1:
            p = out.with_name(f"{out.stem}_{i + 1}{out.suffix or '.png'}")
        else:
            p = out
        if item.get("b64_json"):
            b64 = item["b64_json"]
            if isinstance(b64, list):
                b64 = "".join(b64)
            p.write_bytes(base64.b64decode(b64))
        elif item.get("url"):
            try:
                with urllib.request.urlopen(item["url"], timeout=120) as ir:
                    p.write_bytes(ir.read())
            except (urllib.error.HTTPError, urllib.error.URLError) as e:
                print(f"❌ 下载图片失败 {item['url'][:60]}…: {e}", file=sys.stderr)
                sys.exit(1)
        else:
            print(f"❌ 响应项缺 b64_json/url: {item}", file=sys.stderr)
            sys.exit(1)
        saved.append(str(p))
        print(f"✅ 已保存: {p}")

    print(f"生成完成（{ratio} → {size}），共 {len(saved)} 张")
    sys.exit(0)


if __name__ == "__main__":
    main()
