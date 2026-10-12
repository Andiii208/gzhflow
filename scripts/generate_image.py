#!/usr/bin/env python3
"""gzhflow 图生脚本（generate_image）。

阶段④配图的「生成」一步：调用 OpenAI 兼容的图像接口出图。
本脚本同时是生图预算层的底座——`scripts/image_batch.py` 直接 import 它，
所以这里的函数保持无进程级状态、可重复调用。

后端配置（config/workflow.yaml）推荐用多后端写法：

    image_backends:
      default: agnes
      agnes:
        base_url: "https://apihub.agnes-ai.com/v1"
        model: "agnes-image-2.1-flash"
        api_key_env: "AGNES_API_KEY"
        price: 0                 # 每张单价（美元）；0 = 免费
      gpt-image-2:
        base_url: "https://api.openai.com/v1"
        model: "gpt-image-2"
        api_key_env: "OPENAI_API_KEY"
        strict_sizes: true       # 尺寸须为 16 倍数、宽高比 <3:1、像素 0.66M–8.3M
        supports_quality: true   # 支持 low / medium / high 质量档

旧版单后端写法 `image_backend:` 仍兼容（没有 image_backends 时才读它）。
API Key 优先读环境变量，其次读仓库根目录的 `.env`（纯 stdlib，不覆盖已存在的变量）。

比例默认取自 image_spec（cover_ratio/inline_ratio），也可用 --ratio / --size 覆盖。

依赖: 无（纯 stdlib：urllib + base64 + json）

用法:
    python scripts/generate_image.py --prompt "..." --ratio 16:9 -o cover.png
    python scripts/generate_image.py --prompt "..." --ratio 2.35:1 -o c.png --quality high --backend gpt-image-2
    python scripts/generate_image.py --prompt "..." --refs a.png,b.png -o out.png   # 参考图（走 /images/edits）

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
import uuid
from pathlib import Path

# Windows GBK 控制台兼容：强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent

# 比例 → 尺寸。宽松表给老后端（DashScope/MiniMax 等）用，
# 严格表给声明 strict_sizes 的后端用：两条边都对齐到 16，像素落在合法区间。
RATIO_SIZES = {
    "16:9": "1280x720",
    "1:1": "1024x1024",
    "2.35:1": "1280x544",
    "4:3": "1024x768",
    "3:2": "1152x768",
}
RATIO_SIZES_16 = {
    "16:9": "1536x864",
    "1:1": "1088x1088",
    "2.35:1": "1584x672",
    "4:3": "1024x768",
    "3:2": "1152x768",
}

# 每张单价（美元），仅作预算预估用。2026-10-12 实测：gpt-image-2 按 token 计费，
# 1024x1024 输出侧估算 low≈$0.006 / medium≈$0.053 / high≈$0.211，为保守起见取这组。
DEFAULT_PRICES = {
    "gpt-image-2": {"low": 0.006, "medium": 0.053, "high": 0.211},
}


class ConfigError(Exception):
    """配置缺失或非法——调用方据此退出码 2。"""


def _strip_inline_comment(s: str) -> str:
    """去掉行尾 `# 注释`，但不动引号里的 #（如 URL 里的锚点）。"""
    out, quote = [], None
    for i, ch in enumerate(s):
        if quote:
            out.append(ch)
            if ch == quote:
                quote = None
            continue
        if ch in "\"'":
            quote = ch
            out.append(ch)
        elif ch == "#" and (i == 0 or s[i - 1].isspace()):
            break
        else:
            out.append(ch)
    return "".join(out).strip()


def _coerce(v: str):
    """标量转换：true/false/数字/其余保持字符串。"""
    low = v.lower()
    if low in ("true", "yes", "on"):
        return True
    if low in ("false", "no", "off"):
        return False
    if low in ("null", "~"):
        return None
    try:
        return int(v)
    except ValueError:
        pass
    try:
        return float(v)
    except ValueError:
        pass
    return v


def _parse_yaml(text: str) -> dict:
    """极简 YAML：支持多层嵌套映射 + 标量，不支持列表与行内映射。

    config/*.yaml 只用到这两样，够用且零依赖。列表请改用 JSON（如 manifest）。
    """
    root = {}
    stack = [(-1, root)]
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        line = _strip_inline_comment(raw.strip())
        if not line:
            continue
        m = re.match(r"^([^:]+):\s*(.*)$", line)
        if not m:                     # 无法解析的行直接跳过，不炸整个配置
            continue
        key, val = m.group(1).strip(), m.group(2).strip()
        while len(stack) > 1 and indent <= stack[-1][0]:
            stack.pop()
        parent = stack[-1][1]
        if val == "":
            node = {}
            parent[key] = node
            stack.append((indent, node))
        else:
            if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
                val = val[1:-1]
            parent[key] = _coerce(val)
    return root


def _load_env_file():
    """把仓库根目录 .env 里未设置的变量补进环境（不覆盖已有值）。"""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = _strip_inline_comment(line.strip())
        if not line or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        if k and k not in os.environ:
            os.environ[k] = v


def load_workflow_config() -> dict:
    """读取 config/workflow.yaml，返回嵌套 dict。"""
    cfg = ROOT / "config" / "workflow.yaml"
    if not cfg.exists():
        return {}
    return _parse_yaml(cfg.read_text(encoding="utf-8"))


def resolve_backend(cfg: dict, name: str = None, require_key: bool = True) -> dict:
    """挑出生效的后端并补全默认字段。

    优先级：显式 name > image_backends.default > 旧版 image_backend。
    require_key=False 时跳过 API key 检查（预算预估等只读场景用）。
    返回 dict：name / base_url / model / api_key_env / strict_sizes /
    supports_quality / price / price_table / quality_default。
    """
    backends = cfg.get("image_backends") or {}
    picked = None
    if backends:
        key = name or backends.get("default")
        if key and isinstance(backends.get(key), dict):
            picked = dict(backends[key])
            picked.setdefault("name", key)
        elif name:                     # 指定了名字但配置里没有 → 明确报错，别静默换后端
            raise ConfigError(
                "image_backends 里没有名为 %r 的后端（现有：%s）"
                % (name, ", ".join(k for k, v in backends.items() if isinstance(v, dict))))
        else:
            first = next((k for k, v in backends.items() if isinstance(v, dict)), None)
            if first:
                picked = dict(backends[first])
                picked.setdefault("name", first)
    if picked is None:                 # 回落旧版单后端
        legacy = cfg.get("image_backend")
        if isinstance(legacy, dict):
            picked = dict(legacy)
            picked.setdefault("name", legacy.get("model") or "default")
    if picked is None:
        raise ConfigError(
            "缺配置：config/workflow.yaml 没有 image_backends（推荐）或 image_backend（旧版）"
            "——参考 config/workflow.example.yaml")

    base_url = str(picked.get("base_url", "")).rstrip("/")
    model = str(picked.get("model", ""))
    if not base_url or not model:
        raise ConfigError("后端 %r 缺 base_url 或 model" % picked.get("name"))

    _load_env_file()
    api_key_env = str(picked.get("api_key_env", "IMAGE_API_KEY"))
    api_key = os.environ.get(api_key_env, "")
    if require_key and not api_key:
        raise ConfigError(
            "缺 API key：环境变量 %s 未设置（写在仓库根 .env 里，"
            "或改 image_backends.%s.api_key_env 指向别的变量名）"
            % (api_key_env, picked.get("name")))

    picked.update({
        "base_url": base_url,
        "model": model,
        "api_key": api_key,
        "api_key_env": api_key_env,
        "strict_sizes": bool(picked.get("strict_sizes", False)),
        "supports_quality": bool(picked.get("supports_quality",
                                            "gpt-image" in model)),
        "price": float(picked.get("price", 0) or 0),
    })
    return picked


def size_for(ratio: str, backend: dict, explicit: str = None) -> str:
    """比例/显式尺寸 → 实际 size 字符串。严格后端会对齐到 16 的倍数。"""
    if explicit:
        w, _, h = explicit.lower().partition("x")
        if not (w.isdigit() and h.isdigit()):
            raise ConfigError("--size 格式应为 宽x高（如 1536x864），收到 %r" % explicit)
        size = "%dx%d" % (int(w), int(h))
    else:
        table = RATIO_SIZES_16 if backend.get("strict_sizes") else RATIO_SIZES
        size = table.get(ratio)
        if not size:
            raise ConfigError("未知比例 %r：请用 --size 直接指定（如 --size 1536x864）" % ratio)
    if backend.get("strict_sizes"):
        w, h = (int(x) for x in size.split("x"))
        w, h = _snap16(w), _snap16(h)
        if w / h >= 3.0:
            raise ConfigError("严格后端要求宽高比 <3:1，当前 %dx%d" % (w, h))
        px = w * h
        if not (655_360 <= px <= 8_294_400):
            raise ConfigError("严格后端要求像素在 655360–8294400 之间，当前 %d" % px)
        size = "%dx%d" % (w, h)
    return size


def _snap16(n: int) -> int:
    """把边长对齐到最接近的 16 的倍数。"""
    return max(16, int(round(n / 16.0)) * 16)


def unit_price(backend: dict, quality: str = None) -> float:
    """每张单价（美元）。优先节点配置 price_table，其次内置表，最后 price 字段。"""
    model = backend.get("model", "")
    q = (quality or backend.get("quality_default") or "medium")
    q = str(q).lower()
    table = backend.get("price_table") or DEFAULT_PRICES.get(model) or {}
    if isinstance(table, dict) and table:
        val = table.get(q, table.get("medium", 0))
        try:
            return float(val or 0)
        except (TypeError, ValueError):
            return 0.0
    return float(backend.get("price", 0) or 0)


def _multipart(fields: dict, files: list):
    """构造 multipart/form-data 请求体（stdlib 实现，供 /images/edits 用）。"""
    boundary = "----gzhflow" + uuid.uuid4().hex
    body = bytearray()
    for k, v in fields.items():
        if v is None:
            continue
        body += ("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n"
                 % (boundary, k, v)).encode("utf-8")
    for name, fname, data in files:
        body += ("--%s\r\nContent-Disposition: form-data; name=\"%s\"; filename=\"%s\"\r\n"
                 "Content-Type: application/octet-stream\r\n\r\n"
                 % (boundary, name, fname)).encode("utf-8")
        body += data + b"\r\n"
    body += ("--%s--\r\n" % boundary).encode("utf-8")
    return bytes(body), "multipart/form-data; boundary=%s" % boundary


def generate_one(prompt: str, output, *, backend: dict, size: str,
                 quality: str = None, refs=None, n: int = 1,
                 timeout: int = 180) -> list:
    """生成并落盘，返回保存路径列表。失败抛 RuntimeError。

    给了 refs 就调 /images/edits（参考图/风格锚），否则调 /images/generations。
    quality 只在后端声明 supports_quality 时下发——老后端不认这个字段。
    """
    out = Path(output)
    out.parent.mkdir(parents=True, exist_ok=True)

    fields = {"model": backend["model"], "prompt": prompt, "size": size}
    if n and n > 1:
        fields["n"] = str(n)
    if quality and backend.get("supports_quality"):
        fields["quality"] = quality

    ref_list = [Path(p) for p in (refs or [])]
    if ref_list:
        files = []
        for i, rp in enumerate(ref_list):
            if not rp.exists():
                raise RuntimeError("参考图不存在：%s" % rp)
            files.append(("image[]", rp.name, rp.read_bytes()))
        body, ctype = _multipart(fields, files)
        url = "%s/images/edits" % backend["base_url"]
    else:
        body = json.dumps(fields).encode("utf-8")
        ctype = "application/json"
        url = "%s/images/generations" % backend["base_url"]

    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": ctype, "Authorization": "Bearer %s" % backend["api_key"]})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            resp = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError("HTTP %d: %s" % (e.code, detail))
    except urllib.error.URLError as e:
        raise RuntimeError("网络错误: %s" % e.reason)

    if isinstance(resp, dict) and "error" in resp:
        raise RuntimeError("接口返回错误: %s" % resp["error"])
    data = (resp or {}).get("data") or []
    if not data:
        raise RuntimeError("响应无 data 字段: %s" % str(resp)[:200])

    saved = []
    for i, item in enumerate(data[:max(1, n)]):
        p = out.with_name("%s_%d%s" % (out.stem, i + 1, out.suffix or ".png")) if n > 1 else out
        if item.get("b64_json"):
            b64 = item["b64_json"]
            if isinstance(b64, list):
                b64 = "".join(b64)
            p.write_bytes(base64.b64decode(b64))
        elif item.get("url"):
            try:
                with urllib.request.urlopen(item["url"], timeout=timeout) as ir:
                    p.write_bytes(ir.read())
            except (urllib.error.HTTPError, urllib.error.URLError) as e:
                raise RuntimeError("下载图片失败 %s: %s" % (item["url"][:60], e))
        else:
            raise RuntimeError("响应项缺 b64_json/url: %s" % item)
        saved.append(p)
    return saved


def main():
    ap = argparse.ArgumentParser(description="gzhflow 图生（OpenAI 兼容图像接口）")
    ap.add_argument("--prompt", required=True, help="图片描述 prompt（四段式编译产物）")
    ap.add_argument("--ratio", help="画布比例（16:9 / 1:1 / 2.35:1；缺省读 config image_spec.cover_ratio）")
    ap.add_argument("--size", help="直接指定 size（如 1280x720），覆盖比例映射")
    ap.add_argument("-o", "--output", required=True, help="输出图片路径")
    ap.add_argument("--n", type=int, default=1, help="生成张数（默认 1；>1 时输出文件加序号）")
    ap.add_argument("--quality", choices=["low", "medium", "high"],
                    help="质量档（支持的后端才下发；影响速度与成本）")
    ap.add_argument("--backend", help="image_backends 里的后端名（缺省用 default）")
    ap.add_argument("--refs", help="参考图路径，逗号分隔（给了就走 /images/edits）")
    args = ap.parse_args()

    if args.n < 1:
        print("❌ --n 必须 ≥ 1", file=sys.stderr)
        sys.exit(2)

    cfg = load_workflow_config()
    try:
        backend = resolve_backend(cfg, args.backend)
    except ConfigError as e:
        print("❌ %s" % e, file=sys.stderr)
        sys.exit(2)

    ratio = args.ratio
    if not ratio and not args.size:
        spec = cfg.get("image_spec") or {}
        ratio = spec.get("cover_ratio", "16:9")
    try:
        size = size_for(ratio or "16:9", backend, args.size)
    except ConfigError as e:
        print("❌ %s" % e, file=sys.stderr)
        sys.exit(2)

    refs = [p.strip() for p in (args.refs or "").split(",") if p.strip()]
    try:
        saved = generate_one(args.prompt, args.output, backend=backend, size=size,
                             quality=args.quality, refs=refs, n=args.n)
    except RuntimeError as e:
        print("❌ 图生失败: %s" % e, file=sys.stderr)
        sys.exit(1)

    for p in saved:
        print("✅ 已保存: %s" % p)
    cost = unit_price(backend, args.quality) * (args.n if args.n > 1 else 1)
    print("生成完成（%s → %s，后端 %s，%d 张，预估成本 $%.4f）"
          % (ratio or size, size, backend.get("name"), len(saved), cost))
    sys.exit(0)


if __name__ == "__main__":
    main()
