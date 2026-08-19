# gzhflow · 跨 Agent 公众号内容发布工作流

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

一套**可复用、跨主流 AI Agent** 的微信公众号内容发布工作流框架：从「一个主题」到「草稿箱里一篇排好版、配好图、去过 AI 味的文章」，六阶段流水线 + 每步质量门。

> 适配 Claude Code / Cursor / Codex CLI / Gemini CLI / Qwen Code / DeepSeek 等主流 Agent，也兼容 Hermes 的 SKILL.md 格式（同源标准）。

## 特性

- **跨 Agent 开箱即用**：`AGENTS.md` 单一真源 + `CLAUDE.md` 一行桥接，任何 Agent 打开即懂
- **六阶段流水线**：素材先行 → 写作 → 去AI味 → 配图 → 排版 → 推草稿箱，每步有质量门
- **个人化可替换**：文风/配图风格/排版主题全部走 `config/` 配置 + `examples/` 模板，流程不绑定个人
- **质量门三件套**：脚本门（确定性）+ 清单门（LLM 自检）+ 人工门（审阅/dry-run）
- **发布层个人号可用**：官方 API `draft/add` 推草稿箱（个人订阅号可用），手动粘贴兜底
- **纯 CLI 工具**：stdlib 优先，无外部依赖，跨平台

## 快速开始

```bash
# 1. 复制配置模板
cp config/workflow.example.yaml config/workflow.yaml
cp config/styles.example.yaml config/styles.yaml
cp config/themes.example.yaml config/themes.yaml
cp config/publish.example.yaml config/publish.yaml

# 2. 自检工具链
python scripts/validate_repo.py

# 3. 对任意 Agent 说：
#    「用 gzhflow 工作流写一篇关于 XX 的公众号文章」
```

完整步骤见 [`docs/quickstart.md`](docs/quickstart.md)。

## 六阶段流程

| 阶段 | 作用 | 质量门 |
|---|---|---|
| ① 素材先行 | 提问挖真实素材，杜绝编造 | 意图三问 |
| ② 写作 | 按文风路由写作 | `ai_flavor_score.py` + 自检四问 |
| ③ 去AI味 | 结构手术 + 声音层 + 人称适配 | `ai_flavor_score.py` 复检 |
| ④ 配图（可选） | 图源三问 → 风格路由 → 四段式编译 | `check_image_prompt.py` |
| ⑤ 排版 | 主题路由 → Markdown 转公众号 HTML | `validate_gzh_html.py` |
| ⑥ 发布 | 推草稿箱（个人号可用） | `publish_draft.py --dry-run` |

## 目录结构

```
gzhflow/
├── AGENTS.md            # 跨 Agent 入口（单一真源）
├── CLAUDE.md            # Claude Code 桥接（@AGENTS.md）
├── skills/gzhflow/      # 主编排 SKILL.md + 六阶段 prompts/
├── references/          # 方法论活文档
├── scripts/             # 纯 CLI 质检/排版/裁剪/推草稿
├── config/*.example     # 配置模板（你的文风/主题/凭证）
├── examples/            # 去个人化示例 + 空白模板
└── docs/                # 上手/迁移/Agent 适配
```

## 背景

本项目是对作者此前 **Hermes 专属个人公众号工作流**（[Andiii208/andiii-wechat-workflow](https://github.com/Andiii208/andiii-wechat-workflow)）的抽象与泛化：保留其精华方法论（文风路由、去 AI 味手册、配图四件套引擎、设计推理层、质检门），剥离 Hermes 绑定与个人化内容，重构为适配主流 Agent 的范式框架。迁移详情见 [`docs/migration-guide.md`](docs/migration-guide.md)。

## License

MIT（见 [LICENSE](LICENSE)）；上游许可边界见 [NOTICE.md](NOTICE.md)。
