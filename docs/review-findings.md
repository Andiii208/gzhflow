# gzhflow 代码审查报告与修复计划

> 状态：审查完成，P0 已修复并验证；本文件是剩余 **P1 / P2 / P3** 的修复清单，供后续 Agent 执行。
> 审查范围：`scripts/`（7 脚本）、`config/`（4 模板）、`references/`（7 文档）、`skills/gzhflow/prompts/`（6 提示词）、`docs/`（3+spec）、`examples/`、`.github/workflows/ci.yml`、`.gitignore`。

---

## 0. 已修复（P0，勿重复处理）

以下 3 处已修好并验证通过，新窗口**不要重做**：

| 位置 | 问题 | 已做修复 |
|---|---|---|
| `scripts/check_image_prompt.py` | WARN 时打印「✅ PASS」却 `exit(2)` | 无 FAIL 一律 `exit(0)`，WARN 打印「含 WARN 不阻断」；docstring 同步 |
| `scripts/publish_draft.py` | `--cover required=True` 使 `coverImage` 死代码；`with_suffix(".md")` 找不到 `draft.md` | `--cover` 改可选；侧车 md 加 `draft.md` 兜底；frontmatter 兜底封面；封面缺失时报错 |
| `scripts/md2wechat.py` | `.strip("'")` 剥掉字体栈开头引号 | 只在整串值被一对引号包裹时才剥引号 |

---

## 1. 待修复清单

> 每条含：**位置 → 问题 → 修法 → 验收**。做外科手术式改动，别重构。

### P1 — 逻辑矛盾 / 功能缺口（实质问题，优先）

#### 1.1 `ai_flavor_score.py` 黑话严重度与文档自相矛盾

- **位置**：`scripts/ai_flavor_score.py:33-36`（HARD_BANS「黑话（模型腔）」）vs `references/de-ai-craft.md:78`
- **问题**：`沉淀 / 颗粒度 / 对齐 / 方法论` 在脚本里是 **FAIL（硬禁令，必须清零）**，但 `de-ai-craft.md:78` 明确把它们列为 **WARN（语境黑话，本义准就留）**。Agent 按文档保留 → 机器门 FAIL；按脚本删 → 违背文档。
- **修法**（推荐方案 a）：
  - 从 `HARD_BANS["黑话（模型腔）"]` 的正则里移除 `方法论|对齐|沉淀|颗粒度`；
  - 新增 `WARN_ITEMS["语境黑话（本义准就留）"] = re.compile(r"沉淀|颗粒度|对齐|方法论")`；
  - 让这些词回到「本义正确可保留」的 WARN 语义。
  - 备选方案 b：保持脚本严格，改 `de-ai-craft.md:78` 把它们移到硬禁令列表。二选一，别两边都改。
- **验收**：`python scripts/ai_flavor_score.py --text "这篇文章沉淀了方法论"` 应为 WARN（exit 0），而非 FAIL。

#### 1.2 缺图片生成脚本，`image_backend`/`image_spec` 无消费方

- **位置**：`skills/gzhflow/prompts/04-images.md:53`（引用了「`crop_image.py` 同目录的图生脚本」，但该脚本**不存在**）；`config/workflow.example.yaml:32-43`（`image_backend` 与 `image_spec` 定义后无任何代码读取）
- **问题**：阶段④的「生成」一步只能靠 Agent 手工调 OpenAI 兼容接口，无法脚本化跑通。
- **修法**：新建 `scripts/generate_image.py`，纯 stdlib，规格如下：
  - 用法：`python scripts/generate_image.py --prompt "..." --ratio 16:9 -o cover.png [--n 1]`
  - 读 `config/workflow.yaml`：`image_backend.base_url`、`image_backend.model`、`image_backend.api_key_env`（默认 `IMAGE_API_KEY`）；比例默认取自 `image_spec`（cover_ratio/inline_ratio）
  - API Key 从 `image_backend.api_key_env` 指定的环境变量读；缺 key 报错 exit 2
  - POST `{base_url}/images/generations`，body `{"model":..., "prompt":..., "size":..., "n":...}`，header `Authorization: Bearer <key>`
  - 响应兼容两种：`data[].b64_json`（base64 解码存文件）与 `data[].url`（下载存文件）
  - 比例→尺寸给一个小映射（如 16:9→"1280x720"、1:1→"1024x1024"、2.35:1→"1280x544"），并支持 `--size` 覆盖（不同厂商 size 格式不同，映射要留手动口子）
  - 输出保存路径打印到 stdout；exit 0=成功 / 1=API 失败 / 2=配置缺失
  - 同时在 `04-images.md` 的 Step 5 补上本脚本的真实用法，替换那句「同目录的图生脚本」
- **验收**：`python scripts/generate_image.py --prompt "test" --ratio 16:9 -o /tmp/t.png` 在无 key 时退出码 2 且报「缺 API key」；`python -m py_compile scripts/generate_image.py` 通过；CI 的 py_compile 列表里补上本脚本（见 `.github/workflows/ci.yml:41-47`）。

---

### P2 — 脚本层缺陷

#### 2.1 `ai_flavor_score.py` 声明但未实现的 WARN 项（4 个）

- **位置**：`scripts/ai_flavor_score.py:48-55`（`WARN_ITEMS`）
- **问题**：`重复开头词` 声明为 `None` 且 `detect()` 直接 `continue`（从未实现）；`连词密度 / 句长变异系数 / 短段连击` 三项在 `de-ai-craft.md:78` 与 `03-deai.md:33` 都列为 WARN，但 `WARN_ITEMS` 里根本没这仨键。
- **修法**（二选一，别让文档说谎）：
  - 最小实现 `重复开头词`：按空行分段落，统计首词，≥3 段同首词 → WARN；
  - `连词密度 / 句长变异系数 / 短段连击`：要么补实现（连词密度=连词数/句数超阈值；句长变异系数=句长标准差/均值过低；短段连击=连续 N 段过短），要么从 `de-ai-craft.md:78`、`03-deai.md:33` 两处**删掉**对应承诺。
- **验收**：文档里承诺的 WARN 项，脚本要么能报、要么文档不再提。

#### 2.2 `ai_flavor_score.py` 死代码

- **位置**：`scripts/ai_flavor_score.py:79-80` 的 `_is_quote_colon(match)` 定义后从未调用。
- **修法**：删除该函数。
- **验收**：`python -m py_compile` 通过，无未使用函数。

#### 2.3 `md2wechat.py` 代码块与转义缺陷

- **位置**：`scripts/md2wechat.py:129`（`re.split(r"\n\s*\n", ...)`）、`:98-104`（`inline()`）、`:187-193`（代码块）
- **问题**：① 含空行的围栏代码块被按空行切碎，结尾 ``` 掉出来当段落渲染；② `.strip("`")` 把 ```python 的 `python` 语言标签带进正文；③ `inline()` 与代码块都不做 HTML 转义，正文/代码里的 `& < >` 产出非法 HTML 并被 `validate_gzh_html.py` 误判。
- **修法**：
  - 先按 ``` 围栏切分文档，再对围栏外的 Markdown 按空行切块（代码块整体处理）；
  - 代码块丢弃首行语言标签；
  - `inline()` 对文本先 `html.escape`；代码块内容 `html.escape` 后再进 `<pre>`。
- **验收**：构造一个带空行 + `python` 语言标签 + 含 `<div>` 的代码块，`md2wechat.py` 转换后 `validate_gzh_html.py` 仍 0 ERROR。

#### 2.4 `validate_gzh_html.py` 半角标点过严

- **位置**：`scripts/validate_gzh_html.py:39`
- **问题**：`HALF_WIDTH_PUNCT = re.compile(r"[,;!?]")` 对去标签后**所有文本**报 WARN，而 `SKILL.md`/`theme-routing.md` 要求「半角标点 0 WARN 放行」，英文引用/英文名/时间戳必挂。
- **修法**：只匹配「中文字符紧邻的半角标点」，如 `re.compile(r"[\u4e00-\u9fff][,;!?]")`；英文句内标点豁免。
- **验收**：含英文句子 `Hello, world` 的 HTML 不再报半角标点 WARN；`你好,世界` 仍报。

#### 2.5 `publish_draft.py` 无 HTTP 异常处理 + 上传类型写死

- **位置**：`scripts/publish_draft.py:68-94`（`api_get`/`api_post`）、`:111`、`:122`（`"image/jpeg"`）
- **问题**：`urllib.error.HTTPError`/`URLError` 未捕获，40164/token 过期直接 traceback；上传类型写死 jpeg，PNG 图被误标。
- **修法**：
  - `api_get`/`api_post` 包一层 `try/except`，把 HTTP 状态码 + 响应 body 转成友好错误再 `exit(1)`；
  - 上传类型按文件后缀判断（`.png`→`image/png`、`.gif`→`image/gif`，默认 `image/jpeg`）。
- **验收**：`python -m py_compile` 通过；代码路径上 40164 时打印含「invalid ip」的友好信息而非 traceback。

---

### P3 — 文档 ↔ 代码不一致 + 配置接线 + 卫生

#### 3.1 `quality-gates.md` 退出码表过时

- **位置**：`references/quality-gates.md:24`
- **问题**：仍写 `check_image_prompt.py` 退出码 `2=WARN`，与已修复的脚本（WARN 不阻断、exit 0）不符。
- **修法**：改为 `0=PASS（含 WARN，不阻断）；1=FAIL（硬规避或必需项缺失）`。

#### 3.2 `theme-routing.md` 文档化了未实现的 `signature` 段

- **位置**：`references/theme-routing.md:32-33`
- **问题**：主题 YAML 里写了 `signature.template`，但两个主题 yaml 没有该段，`md2wechat.py` 也不读它（签名实际由 `config/workflow.yaml` 的 `signature` 定义、Agent 写入 md 正文，且 `ai_flavor_score` 会剥离签名行）。
- **修法**：删除 `theme-routing.md` 里的 `signature` 段说明（推荐，避免重复定义），或明确标注「v2 待实现」。

#### 3.3 设计文档文件树与实际不符

- **位置**：`docs/specs/2026-08-22-gzhflow-design.md:82`、`:84`
- **问题**：写 `01-watercolor.md`，实际是 `01-watercolor.yaml`；themes 只列了 `01-zen-whitespace.yaml`，漏 `02-minimal.yaml`。
- **修法**：改 `01-watercolor.md`→`01-watercolor.yaml`；themes 段补 `02-minimal.yaml`。

#### 3.4 主题/引擎 `.yaml` 实为「Markdown 套 ```yaml 代码块」

- **位置**：`examples/themes/01-zen-whitespace.yaml`、`examples/themes/02-minimal.yaml`、`examples/image-engines/01-watercolor.yaml`
- **问题**：真正的 YAML 内容被包在 ```yaml 围栏里，文件头还有 `#` 注释、`>` 引用块、`##` 小标题；扩展名是 `.yaml` 却不是合法 YAML，靠 `md2wechat.py` 的 `load_yaml_flat` 宽容才碰巧能跑。一旦说明文字里出现带冒号的句子就会被误解析成配置。
- **修法**：把这三个文件改成**纯 YAML**（去掉 ``` 围栏、Markdown 标题、引用块；说明文字移到同目录或对应 `references/`）。改完必须保证 `md2wechat.py --theme zen` / `--theme minimal` 仍能正确加载（`name` 字段保留）。
- **验收**：`python -c "import md2wechat; print(md2wechat.load_theme('zen')['name'])"` 输出 `zen`；三个文件都能被标准 YAML 解析器读通。

#### 3.5 默认作者两处定义未接线

- **位置**：`config/workflow.example.yaml:23`（`author`）、`config/publish.example.yaml:20`（`publish.default_author`）vs `scripts/publish_draft.py`
- **问题**：`publish_draft.py` 不读任何一处，默认作者只能是空串。
- **修法**：`publish_draft.py` 的作者兜底顺序改为 `--author` > frontmatter `author` > `config/publish.yaml` 的 `publish.default_author` > 空。`workflow.yaml` 的 `author` 保留给写作阶段填 frontmatter 用（职责不同，别删）。

#### 3.6 `open_comment` 配置未读

- **位置**：`config/publish.example.yaml:22`（`open_comment: true`）vs `scripts/publish_draft.py:225`（写死 `need_open_comment: 1`）
- **修法**：`publish_draft.py` 读 `config/publish.yaml` 的 `publish.open_comment`（默认 true），映射到 `need_open_comment`。

#### 3.7 `sample.md` frontmatter 不完整

- **位置**：`generated/sample.md:1-4`
- **问题**：只有 `title/author`，缺 `prompts/02-writing.md:26-34` 规定的 `coverImage/description`。
- **修法**：补 `coverImage: ./cover.jpg` 和 `description: 测试摘要` 到 frontmatter。

#### 3.8 卫生：`__pycache__`/`generated` 跟踪状态 + secret 扫描扫 `.pyc`

- **位置**：`scripts/__pycache__/*.pyc`、`generated/sample*`、`generated/cover.jpg`；`scripts/validate_repo.py:26-32`（`is_skipped`）、`:97`（`ROOT.rglob("*")`）
- **问题**：这些产物在工作树里，`.gitignore` 已忽略，但需确认**没被 git 跟踪**；`validate_repo.py` 的 secret 扫描不排除 `.pyc`，拿二进制跑正则。
- **修法**：
  - 本地执行 `git ls-files | findstr "__pycache__ generated cover.jpg"`；若列出文件则 `git rm -r --cached` 清出跟踪；
  - `is_skipped()` 增加 `.pyc` 后缀与 `__pycache__` 目录排除。
- **验收**：`git ls-files` 不再列出任何 `__pycache__`/`generated`/`*.pyc`；`validate_repo.py` 不再扫描 `.pyc`。

---

## 2. 全量回归验收（修完后必跑）

```bash
cd <仓库根>

# 1. 语法检查（含新增脚本）
python -m py_compile scripts/*.py

# 2. 仓库结构校验
python scripts/validate_repo.py

# 3. 质检门冒烟
python scripts/ai_flavor_score.py --text "这是一个普通的句子，没有破折号也没有黑话。"
echo "cold-pressed paper, brush stroke, 晕染, 16:9" | python scripts/check_image_prompt.py
printf '<section><p><span>你好</span></p></section>' | python scripts/validate_gzh_html.py --stdin

# 4. 主题加载（确认 P3.4 改纯 YAML 后没坏）
python -c "import sys; sys.path.insert(0,'scripts'); import md2wechat; print(md2wechat.load_theme('zen')['name'], md2wechat.load_theme('minimal')['name'])"

# 5. 新增图生脚本的配置缺失路径（无 key 应 exit 2 且报「缺 API key」）
python scripts/generate_image.py --prompt test --ratio 16:9 -o /tmp/t.png
```

## 3. 执行约束（务必遵守）

- **外科手术式改动**：只改清单点名的文件与位置，不重构、不顺手改无关代码。
- **验证优先**：每修一处跑对应「验收」，别等全改完才发现第一个就改坏了。
- **不提交凭证**：不写、不读、不打印任何真实 AppSecret/API Key；本地 `.env`、`config/*.yaml` 不动。
- **行号漂移**：若清单里的行号与实际不符（文件已改过），以实际代码为准，并在最终总结里说明偏差。
- **不碰 `.git`**：不 commit、不 push，除非用户明确要求。
