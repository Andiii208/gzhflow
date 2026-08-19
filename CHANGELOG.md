# Changelog

本文件记录 gzhflow 的显著变更，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-08-22

### Added（首个版本）

- 跨 Agent 兼容层：`AGENTS.md`（单一真源）+ `CLAUDE.md`（Claude Code 一行桥接）
- 主编排 skill：`skills/gzhflow/SKILL.md`（agentskills.io 兼容格式）
- 六阶段提示词模板：`skills/gzhflow/prompts/`（素材先行/写作/去AI味/配图/排版/发布）
- 方法论知识库：`references/`（文风路由/去AI味手册/配图路由/设计推理/主题路由/微信API指南/质检门）
- 纯 CLI 工具层：`scripts/`（仓库校验/去AI味机器门/配图prompt质检门/Markdown转公众号HTML/HTML校验/图片裁剪/推草稿箱）
- 配置层：`config/*.example.yaml`（workflow/styles/themes/publish）
- 示例层：`examples/`（文风模板/配图引擎模板/排版主题示例）
- 文档：`docs/`（快速上手/迁移指南/各 Agent 适配说明）
- CI：`.github/workflows/ci.yml`（gitleaks + 仓库校验 + 脚本 lint + 质检门冒烟）

### 设计要点

- 发布层主路径 = 官方 API `draft/add`（个人订阅号可用）+ 手动粘贴兜底；不内置 freepublish（个人号已回收权限）
- 排版层自研 `md2wechat.py`，不内置 gzh-design（AGPL），避免许可证污染
- 个人风格全部去个人化，降级为 `examples/` + `config/` 模板
