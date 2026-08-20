# gzhflow 设计文档 — 跨 Agent 公众号内容发布工作流框架

> 状态：v1 设计定稿（2026-08-22）｜作者：Andiii208｜许可证：MIT
> 本文件是 gzhflow 的架构蓝图。实现以此为准。

## 0. 背景与目标

原仓库 `Andiii208/andiii-wechat-workflow` 是一套深度绑定 **Hermes Agent** 的个人公众号自动化工作流（文风蒸馏 → 写作 → 多引擎配图 → 排版 → 推草稿箱），包含 6-7 套个人文风、7 个配图风格引擎、大量个人踩坑教训。用户希望将其**抽象为可复用的范式框架**，适配主流 Agent（Claude Code / Cursor / Codex CLI / Gemini CLI / Qwen Code / DeepSeek 等），供绝大多数人直接使用。

### 目标

1. **跨 Agent 开箱即用**：任何主流 Agent 打开仓库即可按框架执行公众号内容生产流程
2. **发布层对个人号可用**：个人主体订阅号无法 API 直接发布（2025-07 起 freepublish 回收），但 **draft/add 草稿箱接口仍开放**——主路径 = API 推草稿箱 + 手动发布；兜底 = 手动粘贴
3. **个人化可替换**：原个人风格降级为 examples/ 模板，流程与配置分离
4. **质量门可移植**：脚本质检门 + 自检清单门 + 人工 dry-run 门，纯文本/纯 CLI，不绑 Agent

### 非目标（v1 不做）

- 不做浏览器自动化发布（Playwright 操作 mp 后台）——v1 以 API + 手动为主
- 不内置完整 gzh-design（AGPL）——排版引擎改为自研轻量转换器 + 可选集成外部工具
- 不打包个人文风库——仅保留去个人化示例

## 1. 设计原则（来自调研结论）

| # | 原则 | 依据 |
|---|------|------|
| 1 | **AGENTS.md 单一真源** + CLAUDE.md 一行桥接（`@AGENTS.md`） | AGENTS.md 已是 30+ 工具事实标准；Claude Code 是唯一例外 |
| 2 | **SKILL.md 兼容 agentskills.io 开放标准**（name+description frontmatter） | Hermes SKILL.md 与该标准同源，迁移成本最低 |
| 3 | **纯脚本工具层**（scripts/，stdlib 优先） | 确定性质检门跨 Agent 可移植 |
| 4 | **配置与流程分离**（config/*.example.yaml + .env.example） | 用户个性化只改配置，不动流程 |
| 5 | **个人化降级 examples/**，不硬编码进流程 | 参考 writing-agent / TrendPublish 等社区范式 |
| 6 | **质量门三件套**：脚本门 + LLM 自检清单门 + 人工 dry-run 门 | 最可移植的三类门（确定性 / 清单 / 人工） |
| 7 | **发布分层降级**：API 草稿箱 → 手动粘贴 | 个人号可用性现实（官方文档核实） |
| 8 | **中文为主 + 英文 README** | 目标用户是中文公众号作者，同时保持国际可发现性 |

## 2. 仓库结构

```
gzhflow/
├── AGENTS.md                      # 跨 Agent 入口（单一真源，任何 Agent 先读它）
├── CLAUDE.md                      # 一行：@AGENTS.md（Claude Code 桥接）
├── README.md                      # 中文主文档
├── README.en.md                   # English
├── LICENSE                        # MIT
├── NOTICE.md                      # 上游许可边界（AGPL gzh-design 只引用不入仓）
├── SECURITY.md
├── CHANGELOG.md
├── .gitignore                     # generated/ outputs/ 凭证
├── .github/workflows/ci.yml       # CI：secret 扫描 + 仓库校验 + 脚本语法 + 质检门冒烟
│
├── config/                        # 用户配置层（*.example.yaml 为模板，复制为 *.yaml 使用）
│   ├── workflow.example.yaml      # 工作流开关：阶段启用/停用、默认值、图生后端
│   ├── styles.example.yaml        # 文风路由表（用户自己的风格定义）
│   ├── themes.example.yaml        # 排版主题路由（文风→主题映射）
│   └── publish.example.yaml       # 发布配置（微信公众号 AppID/AppSecret 占位）
│
├── skills/gzhflow/                # 编排层：主工作流 skill（agentskills.io 兼容）
│   ├── SKILL.md                   # 主编排：六阶段流程 + 质量门 + 检查清单
│   └── prompts/                   # 分阶段提示词模板（阶段化加载，保持 SKILL.md 精简）
│       ├── 01-material.md         # 素材先行（提问挖素材）
│       ├── 02-writing.md          # 写作（风格路由 + 写作规范）
│       ├── 03-deai.md             # 去 AI 味（结构手术 + 声音层 + 人称适配）
│       ├── 04-images.md           # 配图（图源三问 + 风格路由 + 四段式编译）
│       ├── 05-layout.md           # 排版（主题路由 + md2wechat 转换）
│       └── 06-publish.md          # 发布（API 草稿箱 + 手动兜底）
│
├── references/                    # 知识层（去个人化活文档）
│   ├── style-routing.md           # 文风路由方法论（含空白路由表）
│   ├── de-ai-craft.md             # 去 AI 味手册（结构层/声音层/人称适配）
│   ├── image-routing.md           # 配图路由（图源三问 + 风格→引擎 + 四段式）
│   ├── design-reasoning.md        # 设计推理层（6 项模板 + 反 AI 味清单）
│   ├── theme-routing.md           # 排版主题路由方法论
│   ├── wechat-api-guide.md        # 微信公众平台 API 指南（权限矩阵/踩坑/个人号现状）
│   └── quality-gates.md           # 质检门总表（每阶段的门定义）
│
├── examples/                      # 示例层（个人化唯一落点，全部可替换）
│   ├── styles/                    # 文风示例（去个人化）+ 空白模板
│   │   ├── style-template.md      # 用户自定义文风的空白模板
│   │   └── 01-daily-sketch.md     # 示例：日常白描风（脱敏自原槽边往事式）
│   ├── image-engines/             # 配图风格引擎示例
│   │   ├── engine-template.md     # 四件套引擎空白模板
│   │   └── 01-watercolor.yaml      # 示例：手绘水彩引擎（脱敏）
│   └── themes/                    # 排版主题示例（md2wechat 主题定义）
│       ├── 01-zen-whitespace.yaml # 示例：留白禅意主题
│       └── 02-minimal.yaml        # 示例：极简理性主题
│
├── scripts/                       # 工具层（纯 CLI，stdlib，跨 Agent）
│   ├── validate_repo.py           # 仓库校验（链接/引用/secret/版本）
│   ├── ai_flavor_score.py         # 去 AI 味机器门（硬禁令清零 + WARN 报告）
│   ├── check_image_prompt.py      # 配图 prompt 质检门（PASS/WARN/FAIL 三态）
│   ├── md2wechat.py               # Markdown → 公众号 HTML（内联样式 + span leaf）
│   ├── validate_gzh_html.py       # HTML 校验（标签平衡 + 禁用标签 + 半角标点）
│   ├── crop_image.py              # 图片裁剪（封面 2.35:1 / 内文 16:9 / jpg）
│   └── publish_draft.py           # 推草稿箱（官方 API，--dry-run 支持）
│
└── docs/
    ├── quickstart.md              # 快速上手（3 分钟跑通）
    ├── migration-guide.md         # 从原 Hermes 工作流迁移指南
    └── agent-compat.md            # 各 Agent 适配说明（含 CLAUDE.md 桥接原理）
```

## 3. 六阶段工作流

```
用户给主题
   ↓
① 素材先行（material-first）     —— 问 3-5 个问题挖真实颗粒；意图三问；不硬写
   ↓
② 写作（writing）               —— 查 config/styles.yaml 路由选文风 → 按文风写
   ↓  质量门：ai_flavor_score.py（硬禁令清零）+ 自检四问 + 输出给用户审阅
③ 去 AI 味（deai）              —— 结构层手术 + 声音层 + 人称适配（"你/我们"）
   ↓  质量门：ai_flavor_score.py 复检 + 用户确认
④ 配图（images，可选）          —— 图源三问（真实图/AI 图）→ 风格路由 → 四段式编译
   ↓  质量门：check_image_prompt.py（PASS 才生成）+ 视觉复核 + 用户确认
⑤ 排版（layout）                —— 主题路由 → md2wechat.py 转 HTML
   ↓  质量门：validate_gzh_html.py（0 ERROR）
⑥ 发布（publish）               —— publish_draft.py 推草稿箱（--dry-run 先验）
   ↓  用户公众号助手 App 手动点发布（个人号现实）
```

**默认停靠点**：①②③ 阶段输出必须给用户审阅，用户确认后才进入下一阶段；仅当用户明确说"直接做/不用审阅"才全自动。

## 4. 关键实现决策

### 4.1 跨 Agent 兼容层

- 根 `AGENTS.md`：任何 Agent 的入口，说明仓库用途 + 加载 skills/gzhflow/SKILL.md + 配置位置
- `CLAUDE.md`：仅一行 `@AGENTS.md`（Claude Code 原生不读 AGENTS.md，需此桥接）
- SKILL.md frontmatter 遵循 agentskills.io：`name` + `description`（含触发词）必填
- prompts/ 按阶段拆分：SKILL.md 只编排不堆全文（渐进式披露）

### 4.2 发布层（个人号现实）

| 路径 | 方式 | 适用 |
|---|---|---|
| 主路径 | 官方 API `draft/add`（publish_draft.py，stdlib urllib） | 有 AppID/AppSecret + IP 白名单的个人号 |
| 兜底 | 手动粘贴：md2wechat 产物 HTML → mp.weixin.qq.com 编辑器 | 无 API 凭证 / API 失败 |
| 可选 | 用户自接 wechatpy / MCP / 浏览器自动化 | 高级用户 |

- ⚠️ 2025-07 起个人主体 **freepublish（直接发布）回收**；draft/add 仍开放（官方文档核实）
- publish_draft.py 支持 `--dry-run`（取 token 前返回，零风险验证）

### 4.3 配图层（可选，可插拔）

- 图源三问（本体/功能/素材）→ 真实图轨（网上找）或 AI 轨（风格路由→引擎→四段式）
- 引擎机制 = 四件套（色彩/纹理/排版/规避）+ 质检门（check_image_prompt.py）
- 引擎定义放 examples/image-engines/（用户自建自己的引擎），流程不绑定任何具体引擎
- 图生后端：OpenAI 兼容接口（DashScope/MiniMax/OpenAI 等，config/workflow.yaml 配置），无后端可跳过配图

### 4.4 排版层

- `md2wechat.py`：自研轻量 Markdown → 公众号 HTML（内联样式 + span leaf 包裹，微信样式保留关键）
- 主题 = YAML 定义（examples/themes/），md2wechat 加载主题变量渲染
- `validate_gzh_html.py`：标签平衡 + 禁用标签 + 半角标点检查（0 ERROR 放行）
- 不内置 gzh-design（AGPL）——NOTICE.md 声明可外部集成

### 4.5 质量门三件套（每阶段）

1. **脚本门**（确定性）：ai_flavor_score.py / check_image_prompt.py / validate_gzh_html.py
2. **清单门**（LLM 自检）：自检四问 / 人味自检 / 设计推理 6 项
3. **人工门**：每阶段用户审阅 + 发布前 dry-run

## 5. 许可证与上游边界

- 主许可证 **MIT**（本仓库原创：工作流设计、路由方法论、脚本、文档）
- **不复制** gzh-design（AGPL）代码；md2wechat.py 为原创实现（社区技术如 span-leaf 为通用技巧，非 AGPL 代码复制）
- 示例文风/引擎为**去个人化**改编（不保留原参考公众号名、不保存完整文章）
- NOTICE.md 登记：借鉴自原 andiii-wechat-workflow（MIT，作者自持）+ human-writing 质检思路（MIT）+ 社区规范（agentskills.io 等）

## 6. 验证方式

1. `python scripts/validate_repo.py`：链接/引用/secret/版本校验
2. `python -m py_compile` 全部脚本
3. 质检门冒烟测试（三态退出码）
4. CI（.github/workflows/ci.yml）：gitleaks + validate + lint + smoke

## 7. 后续迭代（v2+，非本期）

- 浏览器自动化发布层（Playwright + 扫码登录态）
- 风格引擎仓库分离（独立 repo，框架只引用）
- 多平台扩展（小红书/知乎/即刻）
- MCP Server 封装（发布工具独立成 MCP）
