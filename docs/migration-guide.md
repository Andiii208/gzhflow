# 迁移指南：从个人工作流迁到 gzhflow

> 如果你有一套自己的公众号内容工作流（Hermes / Claude / 自建），想抽象成可复用框架或迁入 gzhflow，按本文操作。
> 本指南源自 gzhflow 作者从 Hermes 专属工作流迁移的真实案例（见 `examples/case-study/migration-case.md`）。

## 一、资产盘点（先分类，再迁移）

把你的工作流资产分成四类：

| 类别 | 例子 | 迁移去向 |
|---|---|---|
| **流程**（编排/顺序/阶段） | 六阶段流水线、质量门顺序 | `skills/gzhflow/SKILL.md` + `prompts/` |
| **方法论**（通用知识） | 去 AI 味手册、文风路由、设计推理 | `references/` |
| **工具**（脚本/质检） | 质检脚本、排版转换、发布脚本 | `scripts/`（纯 stdlib） |
| **个人化**（你的风格/偏好） | 你的文风、你的配图风格、你的主题 | `config/` + `examples/` |

**原则：流程和方法论进框架，个人化进配置。** 别人 clone 后只改 config 就能用。

## 二、去个人化（最关键的一步）

个人工作流里的「个人色彩」要剥离或降级为示例：

1. **文风**：你的风格分析 → 提炼成风格档案（标题公式/开头/人称/节奏/结尾）→ 存 `examples/styles/` 示例，或留空白模板 `style-template.md` 给用户自己填
2. **参考源**：只保留风格特征分析，不保留任何完整文章副本（版权）
3. **踩坑教训**：个人案例（「某篇文章被否了 6 次」）→ 提炼出通用教训写入 prompts/ 防坑；个案细节进 `examples/case-study/`
4. **硬编码偏好**（"我喜欢 7 张配图"）→ 变成 config 选项（`workflow.yaml`）

## 三、跨 Agent 化（适配主流 Agent）

| 原绑定 | gzhflow 方案 |
|---|---|
| Hermes SKILL.md | 保留 SKILL.md（agentskills.io 同源标准），加根 `AGENTS.md` |
| Claude Code | `CLAUDE.md` 一行 `@AGENTS.md` |
| Hermes 内置 image_generate | OpenAI 兼容图生接口（config 配置） |
| Hermes skills 安装 | 纯 CLI + 无外部依赖（stdlib） |
| Hermes 专用质检工具 | 纯 Python 脚本（可移植） |

## 四、发布层迁移

| 你原来的方式 | 迁到 |
|---|---|
| baoyu-post-to-wechat | `scripts/publish_draft.py`（官方 API draft/add） |
| gzh-design 排版（AGPL） | `scripts/md2wechat.py` + 主题 YAML（MIT，自研） |
| 浏览器自动化发布 | 暂不支持（v1），手动粘贴兜底 |

> ⚠️ 如果你的账号是个人订阅号：2025-07 起无法 API 直接发布（freepublish 回收），draft/add 推草稿箱仍可用——这是唯一合规路径。

## 五、验证迁移

```bash
python scripts/validate_repo.py          # 仓库结构校验
python -m py_compile scripts/*.py        # 脚本语法
# 跑一遍完整流程（建议先手动写一篇样例文章验证五阶段产物）
```

## 六、发布为公开框架

1. 你的个人化内容已在 config/examples（不涉及隐私/凭证）
2. 检查 `.gitignore`：generated/、config/*.yaml（非 example）、.env 不入库
3. 写 README（说明这是什么、怎么用）
4. GitHub 建公开仓库推送（CI 会自动跑 secret 扫描）
