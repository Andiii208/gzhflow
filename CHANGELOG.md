# Changelog

本文件记录 gzhflow 的显著变更，遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- **生图预算层** `scripts/image_batch.py`：manifest 先立清单 → 算账 → 并行出图。
  清单之外的图不生成；`--plan-only` 只算账（不调接口、不需 API key）；
  超限 `--auto-trim` 按 inline→金句卡→分享卡 顺序砍、**封面永不砍**；
  `--prompts-only` 零成本迭代构图；`--receipt` 落预算消耗单。
  并行 + 指数退避重试 + prompt 去重缓存 + 失败降级（留 `.FAILED.txt`，Run 不阻塞）
- `examples/image-manifest.example.json`：manifest 示例（兼作 CI 冒烟夹具）
- **多后端 + 预算配置**：`config` 的 `image_backends`（按名字切后端：
  agnes 免费试构图 / gpt-image-2 出定稿 / dashscope 等）与 `image_budget`
  （张数上限、金额上限、并行数、重试数、质量分轨）。旧版 `image_backend` 单后端写法仍兼容
- `generate_image.py` 新增 `--quality`（质量档）、`--backend`（选后端）、
  `--refs`（参考图，走 `/images/edits`）；声明 `strict_sizes` 的后端会自动把尺寸
  对齐到 16 的倍数并校验宽高比 <3:1、像素区间
- **主题扩容 2→7 套**：`examples/themes/` 新增 `moyu-green` / `red-white` / `graphite-minimal` /
  `moyu-ticket` / `olive-journal`，与 `skills/gzh-design/references/theme-index.md` 的 6 套注册
  主题色值对齐。此前 `md2wechat.py` 只能渲染 2 套、theme-index 却登记 6 套——
  **全自动选主题这条路对 4 套主题是断的**，现已打通
- `md2wechat.py --enhance`：章节自动编号（01/02/…，末章结语用 ∞）+ 文首引言卡 +
  尾部签名区（签名取 config 的 `author`，未配置则不加并提示）
- `md2wechat.py --underline "词A,词B"`：Agent 挑好要点后传入，按主题下划线色标记
- 主题 yaml 新增 `colors.underline` 与可选 `underline_css`（各主题线宽/字重不同）
- `references/long-image-layout.md` 补「长图节奏规范」：hook 占顶 15% → 章节图文交替
  → 结尾 CTA；矢量/位图分工（同时是成本策略）；不编造版面事实；空底=章节没画完的判定。
  来源 `zuoge` 的 `long_scroll`（Apache-2.0）
- DSH 插件打包：根目录 `package.json`（声明 `dsh.bundle`）+ `cordis.patch.yml` + `dsh-preset/tools/gzhflow-skill.mjs`（bundled skill provider），支持 `dsh plugin add https://github.com/Andiii208/gzhflow` 一键安装（全局注册 7 个 `gzhflow_*` 工具并随包携带 `gzhflow` skill）
- **B2 文章实体 → 统一色板**：manifest 顶层 `palette`（per-image 可覆盖），`image_batch.py`
  把它接到每张图 prompt 末尾（晕染辅色，不覆盖纸底）；非法色值（非 #RRGGBB）直接报错退出 2。
  规则与三步法见 `references/image-style-routing.md` 新增节「文章实体 → 统一色板」
- **B1 视觉锚**：引擎 yaml 新增 `anchor_images` 字段；`examples/image-engines/anchors/` 目录
  （README 公开、锚图 gitignore）。`image_batch.py` 新增 `--engine`（读引擎自带锚）与
  `--anchors`（目录/逗号清单），manifest 顶层 `anchors` 亦可——参考图并进每张图 refs（走 `/images/edits`）
- **B3 封面分轨**：`references/cover-design.md`——封面是两件套（2.35:1 头图 + 1:1 分享卡，
  不可互裁）、五种构图类型、安全区、封面 ≠ 正文图（用户 2026-08-07 纠正）、封面学习环；
  `assets/cover-preferences.md` 骨架（认可/被否各记一行，攒够 2 张进 `anchors/`）
- **C1 学习我的修改**：`scripts/learned_edits.py`（difflib 比对机器稿与手改稿，
  `--kind` 七类、`--append` 结构化落盘；只记录不回写）+ `assets/learned-edits.md` 骨架；
  接线 `prompts/07-review.md` 与 SKILL.md ⑦

### Changed

- **修 `md2wechat.py` 不处理 `==高亮==` 的 bug**：此前这类标记被原样输出进公众号正文
  （样例文章里两处 `==能力商品==` 实测残留）。这是 gzh-design 的「关键词下划线」核心特色，
  现已实现，并支持 `++下划线++` / `~~荧光笔~~` / `<u>文字</u>`
- **修 `md2wechat.py` 不剥行尾注释的 bug**：主题文件里 `accent: "#4A5D52"  # 说明` 会把整段
  注释当色值写进 `style`，把属性引号截断。同类问题在 `generate_image.py` 一并修掉
  （它会直接把带注释的 `model` 名发给 API）
- **修 `md2wechat.py` 变量遮蔽 bug**：`convert()` 内把结果变量命名为 `html`，遮蔽了
  同名模块，导致配置了作者名（走到尾部签名区）时 `html.escape()` 抛 `UnboundLocalError`。
  修法与 CI：全主题冒烟补 `--author`，并新增「每套主题都要能渲染且 0 ERROR」一条
- `md2wechat.py` 主题加载改深拷贝——浅拷贝会让后加载的主题拿到前一个主题的色值
- `scripts/generate_image.py` 配置解析换成支持多层嵌套的极简 YAML 解析器（原先只支持一层）
- `scripts/validate_gzh_html.py` 新增两项检查：
  - **渐变背景**（`background:…gradient()` 会让公众号深色模式弹 `darkmode-no-gradient` 提示）。
    源实现那条检查因先把引号串整体挖掉而形同虚设——样式就写在 `style="…"` 里，本版改为只挖注释与 `url()`
  - **`style` 属性被未转义引号截断**（主题/配置注释漏进值的典型症状）
- `prompts/04-images.md` 与 `SKILL.md` ④ 阶段改为「立清单 → 预算门 → 出图」，
  质检门从「PASS 才生成」扩展为「PASS → 过预算」两道
- `SKILL.md` ⑤ 阶段改写：自动路径（`--enhance`）为主、手工装配为补充；
  `theme-index.md` 与 `examples/themes/README.md` 写明「两套主题机制、色值同源」的约定
- CI 补 `image_batch.py` 语法检查 + 四条冒烟（预算层 ×2、`style` 截断、`--enhance` 产物合规）
- `prompts/04-images.md` 加 Step 4.5（实体色板 + 视觉锚）、Step 1 封面分流、裁剪补 1:1；
  防坑补三条（各配各色 / 头图裁分享卡 / 脏锚）
- `references/INDEX.md` 登记 `cover-design`，⓪ 启动表补 `learned-edits` / `cover-preferences`；
  references 计数 38 → 39
- `SKILL.md` ④ ⑦ 与库表接线（色板/锚图/封面两件套/手改学习），修引擎数量笔误（五套 → 六套）
- CI 补 `learned_edits.py` 语法检查 + 三条冒烟（色板注入、非法色板报错、手改记录/无改动退出 4）

## [0.2.0] - 2026-10-12

本版把系统从「流水线」改成「飞轮」：单篇生产照旧，底下新增四个持续沉淀的库，
加一个跨会话状态机，质检门规则整体换成有语料实测依据的一套。

### Added

- **四库**：`assets/inbox.md`（输入收件箱，日常「记一笔」喂）、`assets/voice-samples/`（范文锚，
  你自己旧稿切的 300 字段落）、`assets/voice.md`（风格档案）、`assets/lessons.md`（教训库，
  15 条防坑总表）、`assets/log.md`（发文日志）
- **`state.md` 跨会话状态机**：任何 Agent 任何会话先读它，记录当前进度与待办，
  解决多 Agent 切换时上下文断裂、重复提问的问题
- **阶段⑦ 复盘**：`prompts/07-review.md`。每篇发完记一行，每 5 篇回写四库，
  让第 10 篇比第 1 篇聪明
- **`references/INDEX.md`**：按阶段路由 38 份方法论。实测此前 17 份全仓只有一个入链
  且来自历史文档，等于跑流程时读不到
- `references/seed-inbox-2026-10-12.md`：收件箱首批种子素材（反挖自长期记忆，
  每条标注需用户确认，含"不得编造"的硬规矩）
- `prompts/03-deai.md` 新增：模式选择（自家稿 / 白名单）、三条硬边界
  （信息守恒 / 最小改动 / 结构不动）、③c 分视角评审

### Changed

- **质检门规则整体重写**，依据 `larashero3-dotcom/lieflat-less-ai-tone`（MIT）的对照语料研究
  ——629 篇文章 283 万字，5 个模型各 60 篇对人类 329 篇，26 项候选特征逐项算频率比 R：
  - 删除：句长变异系数 CV<0.3（实测 R=0.87 无区分力）、句内同构排比（R=0.61，
    人类用得更多）、比喻/隐喻整体（R=0.42，人类是 AI 的 2.4 倍）
  - 冒号：从一刀切 FAIL 改为只查提示性冒号（R=3.8）与空转列表冒号（R=9.4）。
    此前「时间：2024年秋天」这类正常中文被判 3 处 FAIL，属纯误杀
  - 破折号：改为按模型阈值判。模型间极差 40 倍（DeepSeek 5.16 次/千字、Claude 4.25、
    Kimi 2.32、Gemini 0.51、GPT 只有 0.11，人类 0.80），新增 `--model` 参数
  - 三连同构排比 → 相邻句结构同构（R=2.0）；隐喻簇 → 拟人化喻体（R=7.3）
  - 新增检测：**段首零回指评论（R=4.4，全场最强，此前完全空白）**、顿号并列过密（R=1.8）、
    序数词小标题（R=3.1）、译文句式 5 项（R=2.6~5.3）、数字密度反向提示（人类是 AI 的 2.8 倍）
  - 保留并标注依据：翻案句（R=3.4）、起首语（R=3.2）、模型路标、黑话
- **两个 `validate_gzh_html.py` 合并为一份**。此前 `scripts/` 版（111 行）缺 class / id /
  @media / grid / var() / 外部字体等 13 项 CSS 红线，而 README、quickstart、CI、dsh-preset
  全指向它——照着 SKILL.md 装出来的 HTML 可能带着 class 和 @media 就过了校验。
  真正实现落在 `scripts/validate_gzh_html.py`，`skills/gzh-design/scripts/` 那个路径改为转发
- **阶段① 从「提问」改为「先收集再提问」**：先翻收件箱和本轮对话存量，缺什么才问，只问一轮。
  提问从默认动作降级为兜底动作
- **阶段② 动笔前必读范文锚**，与 `assets/voice.md` 并用
- `config/themes.example.yaml` 补齐到 6 套主题并指向 `theme-index.md` 为权威来源
  （此前只登记 2 套，而 `theme-index.md` 有 6 套）
- 版本号 0.1.0 → 0.2.0

### Fixed

- `scripts/validate_gzh_html.py` 的 `ERRORS` / `WARNINGS` 原是模块级全局变量且从不重置，
  同一进程内重复调用会累积结果
- CI 冒烟用例 `<section><p><span>你好</span></p></section>` 在新校验器下会失败
  （无 `<span leaf>` 即 ERROR），已改为合规写法，并补三条反向用例
  （模型路标必须失败 / class 红线必须失败 / 交叉嵌套必须失败）

### Removed

- 句长变异系数（CV）、句内同构排比、比喻/隐喻簇三项检测规则，见 Changed

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
