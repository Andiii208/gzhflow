#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批量质检门验证：把 SKILL.md 弹药库/模板库章节的 ```text 代码块全量跑一遍质检门。

为什么需要：引擎写完弹药库后，只验证 1 个示例 prompt 不够——模板里某个词表外的
纹理词或合并写的"避免A、B、C"会让个别模板 FAIL。本脚本一次跑完全部模板。

用法:
    python batch_gate_check.py <SKILL.md> [<check_engine_prompt.py>]
    python batch_gate_check.py <SKILL.md> -prompt "单条四段式 prompt"   # 单条直测
    python batch_gate_check.py <SKILL.md> -section 弹药库                # 自定义章节关键词

默认 gate 脚本: 与 SKILL.md 同引擎目录下的 scripts/check_engine_prompt.py；
               找不到则用本脚本同目录的 ../scripts/check_engine_prompt.py。
提取规则: 取标题含"弹药库/模板库"的 ## 章节下的 ```text 代码块
          （规避把"四段式模板"这类带槽位的示例块也算进去）。
退出码: 0 = 全部 PASS, 1 = 有 FAIL 或未找到代码块。
"""
import io
import os
import re
import subprocess
import sys


def run_gate(gate, text):
    r = subprocess.run([sys.executable, gate], input=text.encode("utf-8"), capture_output=True)
    out = r.stdout.decode("utf-8").strip()
    return r.returncode == 0, out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    section_kw = "弹药库"
    if "-section" in sys.argv:
        section_kw = sys.argv[sys.argv.index("-section") + 1]

    here = os.path.dirname(os.path.abspath(__file__))
    default_gate = os.path.join(here, "..", "scripts", "check_engine_prompt.py")

    if "-prompt" in sys.argv:
        text = sys.argv[sys.argv.index("-prompt") + 1]
        gate = args[1] if len(args) > 1 else default_gate
        ok, out = run_gate(gate, text)
        print(f"[单条] {'PASS' if ok else 'FAIL'}")
        for line in out.splitlines()[1:]:
            print("    ", line)
        sys.exit(0 if ok else 1)

    md_path = args[0]
    gate = None
    # 优先引擎自带 gate
    engine_dir = os.path.dirname(os.path.abspath(md_path))
    candidate = os.path.join(engine_dir, "scripts", "check_engine_prompt.py")
    if os.path.exists(candidate):
        gate = candidate
    else:
        gate = args[1] if len(args) > 1 else default_gate

    with io.open(md_path, encoding="utf-8") as f:
        md = f.read()

    # 按 ## 章节切分，只取章节标题含关键词的 ```text 块
    sections = re.split(r"^(## .*)$", md, flags=re.M)
    blocks = []  # (label, text)
    for i in range(1, len(sections), 2):
        title, body = sections[i], sections[i + 1]
        if section_kw not in title:
            continue
        for b in re.findall(r"```text\n(.*?)```", body, re.S):
            blocks.append((title.strip(), b))
    if not blocks:
        heads = re.findall(r"^## .*$", md, flags=re.M)
        print(f"FAIL: 未找到标题含'{section_kw}'的章节代码块（可用 -section 指定）。现有章节：")
        for h in heads:
            print("    ", h.strip())
        sys.exit(1)

    all_ok = True
    for label, b in blocks:
        text = " ".join(l.strip() for l in b.strip().splitlines())
        ok, out = run_gate(gate, text)
        all_ok = all_ok and ok
        first = out.splitlines()[0] if out else "no-output"
        print(f"[{label}] {first}")
        for line in out.splitlines()[1:]:
            print("    ", line)
    print("==>", "ALL PASS" if all_ok else "SOME FAIL")
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
