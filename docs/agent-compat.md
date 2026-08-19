# 各 Agent 适配说明（Agent Compatibility）

> gzhflow 设计为跨 Agent 开箱即用。本文说明各主流 Agent 如何读取本仓库指令，以及遇到问题的排查方法。

## 兼容矩阵

| Agent | 读取文件 | 适配状态 |
|---|---|---|
| Claude Code | `CLAUDE.md`（内容为 `@AGENTS.md`） | ✅ 一行桥接 |
| Cursor | `AGENTS.md`（设置中可配置读取） | ✅ |
| Windsurf | `AGENTS.md` | ✅ |
| Codex CLI（OpenAI） | `AGENTS.md` | ✅ 原生 |
| Gemini CLI | `AGENTS.md`（默认读根目录） | ✅ |
| Qwen Code | `AGENTS.md` | ✅ |
| DeepSeek（无第一方 CLI，经 Qwen Code / Cline 等宿主） | 由宿主规则决定 | ✅ 宿主读 AGENTS.md |
| Cline / OpenCode / Aider 等 | `AGENTS.md` | ✅ |
| Hermes | `skills/gzhflow/SKILL.md`（同源格式） | ✅ 直接可用 |
| Copilot | `AGENTS.md` | ✅ |

## 原理：为什么一行 CLAUDE.md 就够

- **AGENTS.md 是事实标准**：30+ 工具原生支持，Linux Foundation 旗下 Agentic AI Foundation 托管
- **Claude Code 是唯一例外**：原生不读 AGENTS.md，官方桥接方式是 `CLAUDE.md` 首行写 `@AGENTS.md`（导入根文件）
- **SKILL.md 是开放标准**：agentskills.io 规范（2025-12 发布），40+ 产品兼容，Hermes 格式同源

## 给 Agent 的启动指令

任何 Agent 打开仓库后应自动读取 `AGENTS.md`，其中指明：

1. 这是 gzhflow：跨 Agent 公众号内容发布工作流
2. 主编排：`skills/gzhflow/SKILL.md`
3. 配置：`config/*.yaml`（首次使用从 example 复制）
4. 六阶段流程 + 质量门

## 排查指南

| 症状 | 排查 |
|---|---|
| Agent 不读 AGENTS.md | 手动把 AGENTS.md 内容贴给它，或检查该工具是否需配置（如 Cursor 的 Rules 设置） |
| Claude Code 报错 | 确认 CLAUDE.md 首行是 `@AGENTS.md`（不含其它内容） |
| Agent 不懂 SKILL.md | 让它读 `skills/gzhflow/SKILL.md` 全文；SKILL.md 是流程唯一权威源 |
| 想加自定义规则 | 编辑 AGENTS.md（单一真源），不要复制规则到各 Agent 的私有文件 |

## 进阶：无 AGENTS.md 支持的宿主

极少数工具不读 AGENTS.md 也不支持 CLAUDE.md 导入时：

1. 把 `AGENTS.md` 全文作为系统提示词粘贴
2. 或让 Agent 先执行 `cat AGENTS.md` 再开始

> 原则：**一个事实只存在于一个文件**（AGENTS.md），适配层（CLAUDE.md 等）只做导入，不复制规则。
