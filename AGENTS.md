# gzhflow — 跨 Agent 公众号内容发布工作流框架

> **本文件是任何 AI Agent 打开本仓库后的统一入口。** 无论你在使用 Claude Code、Cursor、Codex CLI、Gemini CLI、Qwen Code、DeepSeek 还是其他 Agent，都请先完整阅读本文件，再开始工作。

## 这个仓库是什么

`gzhflow` 是一套**可复用的微信公众号内容发布工作流**：从「一个主题」到「公众号草稿箱里一篇排好版、配好图、去过 AI 味的文章」。

它把内容生产拆成六个可独立执行、每步带质量门的阶段，任何主流 Agent 都能按这套流程运行。它不绑定某个 Agent，也不绑定某个人的文风——你的文风、你的配图风格、你的排版主题，都通过 `config/` 配置，`examples/` 给模板。

## 核心流程（六阶段）

```
① 素材先行 → ② 写作 → ③ 去AI味 → ④ 配图(可选) → ⑤ 排版 → ⑥ 推草稿箱
```

每个阶段的详细提示词在 `skills/gzhflow/prompts/`，方法论在 `references/`，质检脚本在 `scripts/`。

## 如何运行（任何 Agent）

1. **先读主编排**：`skills/gzhflow/SKILL.md`——这是六阶段工作流的完整编排说明，是流程的唯一权威源。
2. **看配置**：`config/*.example.yaml` 是模板。首次使用把 `.example` 去掉（复制成 `config/*.yaml`）并填你自己的文风/主题/发布凭证。
3. **按阶段执行**：用户给主题后，严格按 SKILL.md 的六阶段顺序走，每阶段先读对应 `prompts/` 文件，跑对应 `scripts/` 质检门，输出给用户审阅后再进入下一阶段。
4. **产出位置**：所有产物（草稿 md、排版 HTML、图片）写入 `generated/`（已 gitignore）。

## 关键约束（务必遵守）

- **不要跳过质量门**：每阶段的 `scripts/` 质检脚本是硬门槛，脚本 FAIL 就不许进入下一阶段。
- **不要编造素材**：写作阶段遵循「素材先行」——用户没给的经历/场景/细节一律不写，这是去 AI 味的根本。
- **默认停靠点**：①②③ 阶段完成后必须输出全文给用户审阅；除非用户明确说"直接做/不用审阅"，否则不许自动跳过。
- **不要提交任何凭证**：AppSecret / API Key / token 一律只放本地 `.env` 或 `config/*.yaml`（已 gitignore），仓库里只有 `*.example` 占位符。
- **发布层现实**：个人主体公众号 2025-07 起无法 API 直接发布（freepublish 已回收），只能 `draft/add` 推草稿箱，再由用户在「公众号助手 App」手动点发布。这是唯一合规路径。

## 目录速览

| 路径 | 作用 |
|---|---|
| `skills/gzhflow/SKILL.md` | **主编排**（流程唯一权威源） |
| `skills/gzhflow/prompts/` | 六阶段提示词模板 |
| `references/` | 方法论活文档（文风路由/去AI味/配图/设计推理/主题/微信API/质检门） |
| `scripts/` | 纯 CLI 工具（质检门/排版/裁剪/推草稿） |
| `config/*.example.yaml` | 配置模板（你的文风/主题/发布凭证） |
| `examples/` | 去个人化示例 + 空白模板 |
| `docs/` | 快速上手 / 迁移指南 / 各 Agent 适配说明 |

## 首次使用

```bash
# 1. 复制配置模板
cp config/workflow.example.yaml config/workflow.yaml
cp config/styles.example.yaml config/styles.yaml
cp config/themes.example.yaml config/themes.yaml
cp config/publish.example.yaml config/publish.yaml   # 填你的 AppID/AppSecret（本地，不入库）

# 2. 自检工具链
python scripts/validate_repo.py

# 3. 开始：对 Agent 说「用 gzhflow 工作流写一篇关于 XX 的公众号文章」
```

详见 `docs/quickstart.md`。
