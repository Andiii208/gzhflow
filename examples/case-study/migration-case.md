# 案例研究：从个人 Hermes 工作流迁移（Case Study）

> 本案例记录 gzhflow 的来源——作者个人的 Hermes 公众号工作流如何被抽象为通用框架。
> 目的：展示「个人工作流 → 可复用框架」的迁移方法论，供其他想要开源自己工作流的人参考。

## 背景

作者运营一个个人公众号，曾用 Hermes Agent（DeepSeek 写作 + Wan2.7 生图 + MiMo 视觉质检）搭建了一套全自动内容流水线：

```
用户: 发送主题 → ① 素材先行 → ② 文风路由写作 → ③ 去AI味
→ ④ 多引擎配图 → ⑤ gzh-design 排版 → ⑥ 推草稿箱 → 公众号助手 App 发布
```

这套系统跑通了真实发布，沉淀了大量宝贵方法论，但**深度绑定 Hermes**：SKILL.md 格式、Hermes 内置 image_generate、baoyu-skills、gzh-design 快照、个人文风库。

## 迁移决策

| 原资产 | 迁移去向 | 决策理由 |
|---|---|---|
| 六阶段工作流（素材先行/写作/去AI味/配图/排版/发布） | `skills/gzhflow/SKILL.md` + `prompts/` | 流程是核心资产，保留 |
| 文风路由表（6 套个人文风） | `config/styles.yaml` 模板 + `examples/styles/` 示例 | 个人化降级为模板，用户填自己的 |
| 去 AI 味手册（结构层/声音层） | `references/de-ai-craft.md` | 通用方法论，去个人化 |
| 配图四件套引擎（7 个风格） | `examples/image-engines/` 模板 + 水彩示例 | 机制保留，引擎用户自建 |
| 设计推理层（6 项） | `references/design-reasoning.md` | 通用方法论 |
| gzh-design 排版（AGPL） | 自研 `md2wechat.py` + 主题 YAML | 避免 AGPL 许可证污染，轻量化 |
| baoyu-post-to-wechat 推送 | 自研 `publish_draft.py`（官方 API） | 去除外部依赖，纯 stdlib |
| Hermes SKILL.md 格式 | agentskills.io 兼容格式 | 同源标准，迁移成本最低 |
| 个人踩坑教训（几十条） | 精选去个人化写入 prompts/ 防坑 | 只留通用教训，个案进案例库 |

## 关键发现（迁移过程中的调研结论）

1. **SKILL.md 已是开放标准**：Hermes 的 skill 格式与 agentskills.io 标准同源，跨 Agent 直接复用
2. **AGENTS.md 是跨工具事实标准**：30+ 工具支持，只需给 Claude Code 加一行 `@AGENTS.md` 桥接
3. **个人号发布现实**：2025-07 起 freepublish 回收，draft/add 草稿箱仍开放——「推草稿箱 + 手动发布」是唯一合规路径
4. **质量门三件套最可移植**：确定性脚本 + LLM 自检清单 + 人工审阅，不依赖任何 Agent 特性
5. **个人化 = 配置**：文风/主题/引擎全部走 config + examples，流程文件一个不碰

## 复用价值

- 如果你有自己的公众号工作流：按本案例的「资产分类 → 去个人化 → 落位」方法迁移
- 如果你没有工作流：直接用 gzhflow 的六阶段 + 模板填自己的风格
- 迁移完整指南见 `docs/migration-guide.md`
