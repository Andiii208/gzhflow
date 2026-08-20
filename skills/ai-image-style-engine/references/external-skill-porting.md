# 外部生图 skill → Hermes 风格引擎：移植清单

> 2026-08-06 由 TaiT CRT Interface 移植（`andiii-crt-style`）实测验证。适用于把 GitHub 上 Codex/Claude 系生图 skill 移植为 Hermes 文生图引擎。评估通用流程见 `references/tait-crt-interface.md`（本文件是"评估后怎么落地"的续篇）。

## 0. 核心纪律（两次教训的共识）

**先出试水图，再动手建引擎。** 移植前按移植后的写法纯文生图一张给用户看（vision_analyze 自检 + 用户确认方向）。用户说"可以"才落地——喜茶（蒸馏跑偏 13 张全废）和 TaiT CRT（试水一次过）正反两次验证：方向验证成本远小于落地返工成本。

## 1. 调研拆解（1-2 次工具调用）

1. `api.github.com/repos/<owner>/<repo>/git/trees/main?recursive=1` 拿完整文件清单（中文目录名会自动 URL 编码）
2. `raw.githubusercontent.com/<owner>/<repo>/main/<path>` 下载 SKILL.md / references / scripts（下载时用 `$(basename $f)` 会拍平目录，后续读文件注意路径）
3. 下载生成示例图 → vision_analyze 对照 spec 逐条验证（色卡锁死？棋盘格？畸变？署名？）——**示例图是 spec 被真实执行的证据**
4. 看 `agents/*.yaml` / 工作流段确认平台绑定（openai.yaml → Codex 专属；bundled python / workspace dependencies → 平台注入）
5. 迁移评估三问：后端能力边界（能否吃参考图）？平台专属 API 依赖？品牌署名冲突？

## 2. 试水图验证（必做）

- 用移植后的 prompt 结构（保留核心约束：色卡/网格/纹理/畸变）直接文生图一张
- vision_analyze 固定问句对照 spec 逐条打分
- 把图发给用户，用户确认才继续。试水图发现的能力缺口（如"特征提取窗模型居然画出来了"）直接写进引擎能力边界

## 3. 适配清单（Codex/Claude skill → Hermes 引擎）

| 上游能力 | Hermes 适配 |
|---|---|
| 内置 image_gen（吃参考图） | 纯文生图：剥离参考图依赖，改"主题隐喻转译"；Wan2.7 不吃参考图，图生图场景标注需 GPT Image 后端 |
| `codex_app__load_workspace_dependencies`（bundled python） | 用系统 python（`py -3` / `python`；Hermes venv PIL 可能坏） |
| 强制第三方署名（品牌标识） | **默认去掉**（公众号配图不带第三方标识）；可选 `--signature` 参数 |
| 上游通用质检门（纸感词） | 风格换底 → 质感底线另行定义：专用质检门脚本（必备词表按新风格：网格/纹理≥2/畸变/比例/色卡声明） |
| 后处理脚本（色卡量化/畸变） | 保留并适配为引擎自带 `scripts/finalize_crt.py`（兜底模型不听话） |
| 两阶段输入门 / 变化引擎轴 | 保留为交互节奏 + 防雷同轴表（可精简到 6-8 轴） |

## 4. 落地四步

1. 建引擎：仓库 `skills/<engine-name>/`（SKILL.md + scripts/），frontmatter 注明 upstream + license
2. 登记路由表：仓库 `references/image-style-routing.md` 加文风→风格→引擎行
3. 同步：`bash scripts/sync_to_hermes.sh`（仓库是权威源，Hermes 副本由脚本部署；mtime 守卫会拦截未推回的活文档）
4. 提交推送：git commit + push；同时更新 `ai-image-style-engine` SKILL.md 参考实现清单 + 记忆风格路由

## 5. 实测数据（TaiT CRT → andiii-crt-style，供参考）

- Wan2.7 纯文生图一次出图即过视觉复核（像素主体 60-70% 覆盖率、6 视窗含特征提取窗、扫描线+桶形畸变全有）
- 翻车点：模型在 99% 的图里会漏 1-2 个色卡外杂色（如猫耳朵粉色）——**这正是后处理脚本存在的意义**
- finalize_crt.py 结果：1024×1024 → 4 色精确锁定（程序级校验 `colors_used ⊆ palette`）、网格 3px（短边/384）、扫描线 9px、无署名
- 质检门 bug 实录："无显示器外壳"被硬规避"显示器外壳"误杀 → `_AVOID_RE` 前缀补 `无|不用`（主质检门 check_engine_prompt.py 同样缺，写新脚本要带上）

## 6. 已知边界

- 纯文生图做不了"上传图片 → 变风格"（Wan2.7 无图生图）；该能力等 GPT Image 后端接入后再补
- 比例受后端限制：Wan2.7 只出 1:1/16:9/9:16，上游的 4:3/3:4 需生成后裁剪
- 迁移后引擎质量门槛（自检清单）要从上游 Quality Gate 摘录并本土化（去 Codex 专属项）
