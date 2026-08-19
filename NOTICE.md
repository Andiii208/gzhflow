# NOTICE

## 本仓库自身

- 版权：© 2026 Andiii208
- 主许可证：MIT（见根目录 `LICENSE`）
- 本仓库原创内容（工作流设计、路由方法论、脚本、文档、示例）遵循 MIT。

## 许可证边界声明

本仓库是「工作流框架 + 纯脚本工具」仓库，**刻意避免复制第三方代码**：

- **不包含** gzh-design（AGPL-3.0）代码。排版引擎 `scripts/md2wechat.py` 为原创轻量实现，仅采用社区通用技术（如 `span leaf` 包裹以保留微信样式——这是微信公众号排版的公开通行技巧，非任何项目的专有代码）。
- **不包含** baoyu-skills / wechatpy / MCP 等发布工具代码。发布层 `scripts/publish_draft.py` 直接调用微信官方公开 API（draft/add 等），属原创实现。
- 示例文风/配图引擎为**去个人化改编**：不保留原参考公众号名称，不保存任何完整文章副本，仅保留风格特征的方法论描述。

## 上游借鉴清单（思想/方法论层面，非代码复制）

| 上游项目 | 借鉴内容 | 许可证 | 本仓库使用方式 |
|---|---|---|---|
| Andiii208/andiii-wechat-workflow | 六阶段工作流、文风路由、去 AI 味手册、配图四件套引擎、设计推理层、质检门思路（作者本人作品） | MIT | 抽象泛化 + 去个人化改写 |
| human-writing（KKKKhazix） | check_prose.py 文字质检门的「硬禁令 + WARN」思路 | MIT | 借鉴思路，`ai_flavor_score.py` 为原创实现 |
| agentskills.io（Anthropic 开放标准） | SKILL.md frontmatter 格式（name/description 等） | Apache-2.0（规范文档） | 遵循格式规范 |
| AGENTS.md（agents.md） | 仓库级指令约定 | CC-BY（规范文档） | 遵循约定 |
| 微信公众号官方文档 | draft/add / media/uploadimg 等 API 调用方式 | 官方文档 | 事实性引用 |

## 注意

- 本仓库为公开仓库，**严禁提交**任何真实凭据（AppSecret、API Key、Token）、个人私密素材或运行产物。
- 本地路径、IP 白名单、AppID 等个人细节一律使用 `REDACTED` / `your_*` 占位符。
