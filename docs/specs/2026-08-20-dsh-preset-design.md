# gzhflow → DSH Preset 设计文档（DSH 适配）

> 状态：v1 设计定稿（2026-08-20）｜基于 gzhflow v0.1.0 代码审查修复后（main f7f233e）
> 目标：把 gzhflow 六阶段公众号工作流适配为 DeepSeek Harness（DSH）的 **Agent Preset**，随仓库分发。

## 0. 背景

gzhflow 是一套跨 Agent 的公众号内容发布工作流框架（六阶段：素材先行 → 写作 → 去AI味 → 配图 → 排版 → 推草稿箱），
由 `skills/gzhflow/SKILL.md` 编排、`scripts/*.py` 质检门、`config/*.example.yaml` 配置组成，纯 stdlib、agent 无关。

用户希望把 gzhflow 适配进 **DSH（DeepSeek Harness）**，让「在 DSH 里开一个公众号写作会话，一句话跑完 gzhflow」成为开箱体验。

## 1. 设计决策（已与用户确认）

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 载体形态 | **Agent Preset**（`.agent-presets/gzhflow/`，preset.yml + agent.cordis.yml） |
| 2 | 质检门形态 | 6 个脚本**注册成真实 DSH 工具**（结构化参数 + 结果返回） |
| 3 | 发布凭证来源 | 接 **DSH credentials 存储**（dsh-credentials-local），不再依赖 config/publish.yaml |
| 4 | 分发范围 | **随 gzhflow 仓库分发**（dsh-preset/ 目录 + 安装脚本 + 文档） |
| 5 | 流程指令载体 | **挂 skill 引用**（gzhflow SKILL.md 单一真源，不复制） |

## 2. 架构

```
DSH 会话选择「gzhflow 公众号主编」预设
   │
   ├─ persona（@deepseek-ai/dsh-persona）      → 行为纪律（素材先行/不编造/停靠点/审阅）
   ├─ agent-instructions（挂 skill 引用）       → 六阶段流程单一真源 skills/gzhflow/SKILL.md
   ├─ tools/gzhflow-tools.mjs                  → 6 个质检脚本的 DSH 工具包装
   │     ├─ gzhflow_deai_score       ai_flavor_score.py
   │     ├─ gzhflow_check_prompt     check_image_prompt.py
   │     ├─ gzhflow_validate_html    validate_gzh_html.py
   │     ├─ gzhflow_md2wechat        md2wechat.py
   │     ├─ gzhflow_generate_image   generate_image.py
   │     └─ gzhflow_publish_draft    publish_draft.py（凭证来自 DSH credentials）
   └─ 基础工具行（tool-pwsh / tool-fs / tool-skill 等，照 router-standard 标准）
```

**关键原则**：
- **脚本零改动**：所有包装在 mjs 层完成，`scripts/*.py` 保持纯 CLI（可被任何 agent 复用）。
- **单一真源**：流程指令只存在于 `skills/gzhflow/SKILL.md`；preset 通过 agent-instructions 引用，不复制内容。
- **凭证不落盘**：AppID/AppSecret 只在 DSH credentials 存储中管理，工具运行期从存储读取注入。

## 3. 目录布局（新增 `dsh-preset/`，随仓库分发）

```
dsh-preset/
├── preset.yml               # 预设元信息（name/description，出现在 DSH 预设选择 UI）
├── agent.cordis.yml         # 核心：挂载工具模块 + persona + skill 引用 + 审阅纪律
├── tools/
│   └── gzhflow-tools.mjs    # 6 个脚本的 DSH 工具包装层（零依赖）
├── install.ps1              # Windows 安装脚本（junction 链接到 ~/.dsh/.agent-presets/gzhflow/）
├── install.sh               # macOS/Linux 安装脚本（symlink）
└── README.md                # 使用文档（安装/凭证配置/常见问题）
```

## 4. preset 组成（agent.cordis.yml 挂载清单）

格式照 DSH 活样本 `.agent-presets/router-standard/agent.cordis.yml`（挂载列表 + cordis:group 隔离组）：

```yaml
- id: persona
  name: '@deepseek-ai/dsh-persona'
  config:
    text: |   # 「公众号主编」人设一句话 + 核心纪律
      你是公众号主编。严格按 gzhflow 六阶段流程执行：
      素材先行，不编造用户没给的细节；①②③ 阶段输出全文给用户审阅后才进入下一阶段；
      每阶段质检门 FAIL 不进入下一阶段；发布走推草稿箱 + 用户手动发布。
- id: agent-instructions
  name: '@deepseek-ai/dsh-agent-instructions'
  config:
    maxBytes: 65536
- id: gzhflow-tools
  name: ./tools/gzhflow-tools.mjs      # 相对 preset 目录解析
- id: tool-pwsh
  name: '@deepseek-ai/dsh-tool-pwsh'
  disabled: !!js process.platform !== 'win32'
- id: tool-skill
  name: '@deepseek-ai/dsh-tool-skill'
# ... 其余基础工具行照 router-standard 标准挂载
```

**skill 引用方式（v1 定死）**：安装脚本负责把 `skills/gzhflow/` 链接到 DSH 的 skill 目录
（`~/.agents/skills/gzhflow/`），DSH skill 系统自动发现并注册；preset 的 `agent-instructions`
配置写「加载 gzhflow skill，严格按 SKILL.md 的六阶段执行」，不复制 SKILL.md 内容。

## 5. 工具层设计（tools/gzhflow-tools.mjs）

每个工具：`name / description / inputSchema / execute`。execute 内用 child_process 调仓库 `scripts/*.py`，
把 stdout/stderr + 退出码转成结构化结果返回给 agent。

| 工具名 | 脚本 | 输入 schema 要点 | 返回要点 |
|---|---|---|---|
| `gzhflow_deai_score` | ai_flavor_score.py | `text` 或 `file` 路径 | `{exit_code, fails[], warns[]}`；exit 1 = FAIL |
| `gzhflow_check_prompt` | check_image_prompt.py | `prompt` 文本 | `{exit_code, problems[], warns[]}`；exit 1 = FAIL |
| `gzhflow_validate_html` | validate_gzh_html.py | `html` 文本或 `path` | `{exit_code, errors[], warnings[]}` |
| `gzhflow_md2wechat` | md2wechat.py | `md_path`, `theme`(默认 zen), `output` 可选 | `{exit_code, output_path}` |
| `gzhflow_generate_image` | generate_image.py | `prompt`, `ratio`, `size?`, `output`, `n?` | `{exit_code, saved[]}` |
| `gzhflow_publish_draft` | publish_draft.py | `html`, `title`, `author?`, `summary?`, `cover?`, `dry_run?` | `{exit_code, message}` |

### 5.1 凭证注入（gzhflow_publish_draft）

- 工具执行时从 **DSH credentials 存储**读取 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`（dsh-credentials-local 提供 API）；
- 读不到 → 返回友好错误「请先在 DSH 设置 → 凭据 → 填写 WECHAT_APP_ID / WECHAT_APP_SECRET」，不调用脚本；
- 读到 → 经子进程 env 注入（WECHAT_APP_ID / WECHAT_APP_SECRET），不进命令行参数；
- 凭证只存在于 DSH credentials 存储与进程内存，**绝不写入仓库/日志/工具结果**。

### 5.2 错误处理

- 脚本退出码 2（配置缺失/参数错误）→ 工具返回友好错误信息 + `exit_code: 2`；
- 脚本找不到 / Python 不可用 → 工具返回安装提示；
- 网络/API 错误（图生、发布）→ 透传脚本的友好错误（脚本已做 HTTP 异常友好化）；
- 所有工具结果不包含任何凭证明文。

## 6. 安装与使用

```bash
# Windows
powershell -ExecutionPolicy Bypass -File dsh-preset/install.ps1
# macOS / Linux
bash dsh-preset/install.sh
```

- 安装脚本把 `dsh-preset/` **链接**到 `~/.dsh/.agent-presets/gzhflow/`（Windows junction / POSIX symlink），
  改仓库即生效（符合 DSH junction 惯例）；幂等（已存在则跳过）。
- 安装脚本同时把 `skills/gzhflow/` 链接到 DSH skill 目录（如 `~/.agents/skills/gzhflow/`），保证 skill 引用可解析。
- 使用：DSH 新建会话 → 选「gzhflow 公众号主编」预设 → 说「用 gzhflow 写一篇关于 XX 的文章」。
- 凭证：DSH 设置 → 凭据 → `WECHAT_APP_ID` / `WECHAT_APP_SECRET`。

## 7. 测试与验收

1. **安装**：跑 install 脚本 → `~/.dsh/.agent-presets/gzhflow/` 存在且为链接 → 重装幂等。
2. **工具冒烟**（不碰网络）：逐个调用 6 个工具验证 schema 与结果结构；
   `gzhflow_deai_score` 对干净文本 exit 0、对含破折号文本 exit 1；`gzhflow_validate_html` 对平衡 HTML 0 ERROR。
3. **凭证路径**：未配置 credentials 时 `gzhflow_publish_draft` 返回「请先配置凭据」友好错误，不抛 traceback。
4. **预设加载**：DSH 中新建会话选择预设，确认 persona + 工具 + skill 引用全部生效。
5. **回归**：`python -m py_compile scripts/*.py` 与 `python scripts/validate_repo.py` 仍全绿；
   `validate_repo.py` 增加对 `dsh-preset/` 的校验（工具名 ↔ 脚本存在性映射）。

## 8. 范围外（YAGNI，不做）

- ❌ 不做 UI 面板（发布面板/排版预览）——v1 纯 preset + 工具，agent 文本交互足够；
- ❌ 不发 DSH 插件市场——v1 随仓库分发，市场准入留到有社区需求时；
- ❌ 不改 `scripts/*.py` 行为——工具包装层隔离，脚本保持跨 agent 可复用；
- ❌ 不做凭证自动配置向导——v1 指引用户手动在 DSH 设置填写。
