#!/usr/bin/env python3
"""转发到 scripts/validate_gzh_html.py。

历史上这里躺着一份独立实现，跑着跑着和 scripts/ 那份漂移了：
这份多查 class/id/@media 等 13 项 CSS 红线，那份多查标签白名单，
而 README、quickstart、CI、dsh-preset 全指向 scripts/ 那份，
等于红线那层常年不生效——照着 SKILL.md 装出来的 HTML 可能带着 class 和
@media 就过了校验。

2026-10-12 合并成一份实现，落到 scripts/validate_gzh_html.py。
这个路径保留只为让 gzh-design 里的旧调用不散架，不再单独维护。
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))

import validate_gzh_html

if __name__ == "__main__":
    sys.argv[0] = "validate_gzh_html.py"
    validate_gzh_html.main()
