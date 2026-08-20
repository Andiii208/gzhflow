---
name: ai-image-style-engine
description: Build reusable AI image style engines - gates, crop, review.
version: 1.0.0
author: Hermes Agent
license: MIT
tags: [image-generation, prompt-engineering, style-engine, quality-gate, workflow]
related_skills: [baoyu-image-gen, baoyu-cover-image, baoyu-article-illustrator, external-ai-media-api]
---

# AI Image Style Engine — 可复用生图风格引擎设计

把用户已确认的审美（某风格：水彩/新中式/涂鸦…）固化为**可替换风格引擎**，接入任何图生后端（Wan2.7-Image / DALL-E / Gemini / Agnes…）。引擎吃内置生图工具，模型无关。完整触发词：设计/搭建可复用生图风格引擎、prompt 系统、风格化配图工作流（封面/海报/插画），或用户要跨图保持统一视觉风格时。

## 核心哲学（2026-08 用户纠正，最高优先级）

**工程约束 ≠ 创作约束。引擎管"风格底线"，不管"构图细节"。**

| 该管（品味） | 不该管（创作） |
|---|---|
| 配色体系（语义色名，非 hex） | 主体位置 / 占比 / 百分比坐标 |
| 纹理质感词表（纸纹/笔触/晕染） | 隐喻转译（唯一自由发挥点） |
| 雷区规避清单（反 AI 味） | 图内文字要不要（**默认无文字**） |

- 量化约束（"主体占 20%"、"标题在 30-45%"）会迅速滑向构图管制，把模型压成模板机。**每加一个数字，问一句：这是品味还是坐标？**
- 用户偏好 AI 自由发挥时，引擎只锁 3 件事（配色/纹理/规避），排版规则默认不参与。

## ⛔ 风格库路由原则（2026-08 用户第二次纠正，最高优先级）

**配图风格按文风/题材路由，不是默认单一风格**。用户分享过的风格资产（zine/喜茶/潦草/高星仓库调研）必须归位进路由表，不能"先做一个再说"丢掉其他。

```
文风（写作层路由）→ 查配图风格路由表 → 配图风格 → 加载对应引擎
```

- 风格引擎 = 风格库成员，**被匹配时才加载**，不做全局默认
- 路由表登记：已建（✅）/ 待蒸馏（📌 含来源+方法）；未建风格标"回退水彩或通用 prompt"并提示待蒸馏
- 蒸馏新风格 = 复制现有引擎 SKILL.md → 换四件套 → 过质检门 → 登记路由表（zine-poster 改版方法论：改"色彩引擎"即得新风格）
- 用户明确点名过但未建的风格（如喜茶风/潦草风）是欠账，主动列入排队，别等用户再提

## ⛔ 风格是参考，不是限制（2026-08 用户第三次纠正，最高优先级）

蒸馏出的风格引擎是**灵感起点**，不是约束框：
- 编译 prompt 时允许**跨风格借用 / 混搭 / 偏离**（实例：喜茶底 + 极简构图、zine 拼贴 + 一处水彩晕染、潦草线条 + 水墨质感）——当主题或用户意图更适合时
- 质检门（质感/雷区底线）仍然生效；**风格本身是软的**
- 把这条原则写进每个引擎的第零节（`## 零、风格是参考，不是限制`），防止 agent 把风格模板当死规矩
- 目的：以风格激发更多创意，不是按模板死板执行

## 多引擎并行蒸馏（delegate_task 子 agent 流程）

一次蒸多个风格时用 `delegate_task` 批量并行（每个子 agent 一个风格，leaf），已验证可行：
- context 给足：风格四件套定义、参考引擎路径（如 andiii-zine-style）、质检门脚本路径、输出文件路径（仓库目录）、验证要求（示例 prompt 必须过质检门 PASS 才交差）
- **子 agent 只写仓库目录**，Hermes skills 目录由主 agent 统一同步（防并发写冲突）
- 产出验证（务必做，子 agent 自报不算数）：
  - 读 SKILL.md 确认 frontmatter 合法、结构完整
  - **提取弹药库模板全量过质检门**——注意模板格式差异：`P1:` 前缀 / `P1` 开头 / 连续段落（喜茶用无标记四行式）/ 结构模板含 `[占位符]`（不是实际 prompt，FAIL 正常，不算 bug）——提取正则要按实际格式调整
- 新风格词汇补质检门词表（按系分组注释）后**全量回归**（5 引擎 × 弹药库全跑，水彩 10 + 喜茶 6 + 潦草 6 + 极简 5 + zine 5）
- 同步脚本扩至全部引擎清单后 cmp 验证一致性

## 引擎结构（四件套）

```
SKILL.md
├── 一、色彩引擎   — 基底色 + 1-2 个低饱和主色（语义色名）+ 量化范围 + 禁用词表
├── 二、纹理引擎   — 纸感词/晕染词/笔触词/颗粒词 中英对照表（每 prompt ≥2 纹理 + 1 纸感）
├── 三、排版引擎   — 可选（默认无文字）；仅用户要求图内文字时启用安全区规则
├── 四、规避清单   — 硬规避(FAIL) / 软规避(WARN) 两级
└── 五、四段式编译模板
```

**四段式 prompt**（用结构，不用样例词）：
```
P1 画布与纸感: [比例] 全幅[纸色]底, [留白]留白, [纸感词]+[纹理词×2]; 主体位置与构图自由
P2 主体隐喻: [主题转译的意象]（[锚点类型]）, [锚点处理]
P3 文字与色彩: 默认无文字; 仅带字时填 [文字,字体,位置], [主色1]+[主色2] 以[晕染带/洗淡区]存在
P4 氛围与规避: [情绪词], 避免[命中规避项]
```

## 质检门（prompt 层自动检查，不依赖视觉模型）

脚本 `scripts/check_engine_prompt.py` 模式（纯标准库，stdin 或文件输入）：
- **必备要素**：≥1 纸感词、≥2 纹理词、画布比例声明
- **硬规避 FAIL**：雷区词表（英文为主 + 中文补全：炭黑金/高饱和/渐变紫/动漫脸/卡通/玻璃拟态/霓虹灯…）
- **软规避 WARN**：gradient / drop shadow / bokeh / stock photo / high saturation…
- **"避免"豁免**（关键）：`避免X / 不要X / no X / avoid X / without X` 前缀不算命中——否则"避免高饱和"这类正常规避表述会被误杀。⚠️ 豁免要求前缀与词**连续相邻**（脚本按 `prefix+word` 子串匹配）：写"避免精致矢量插画、完美平滑线条、高饱和"时，"高饱和"前面是顿号不是"避免"，**仍判命中**。规避项必须**逐个**写 `避免X`（实测踩过；zine/sketchy 引擎模板已按此规范，P4 一律"避免A、避免B、避免C"）
- **负向豁免前缀表必须含"无/不用"**（2026-08-06 CRT 质检门实测新坑）：prompt 里"无显示器外壳 / no monitor bezel"这类否定表述很常见，但 `_AVOID_RE` 只有 避免/不要/no/not/avoid/without 时，"无显示器外壳"会被硬规避词"显示器外壳"**误判命中 FAIL**。check_crt_prompt.py 已修（前缀加 `无|不用`）；主质检门 check_engine_prompt.py 同样缺"无"，新写质检门脚本照抄时要带上
- 词表维护：**模板库必须能过自己的质检门**（写完弹药库全量跑一遍，FAIL 的修模板或修词表）；词表与 SKILL.md 规避清单要双向一致（同一词不能同时出现在硬+软规避）
- 全量跑模板库用 `scripts/batch_gate_check.py <SKILL.md> [check_engine_prompt.py]`——自动提取"弹药库/模板库"章节所有 ```text 块逐条过门（`-prompt "..."` 单条直测，`-section 关键词` 换章节）；只验证 1 个示例 prompt 不够，模板里词表外的纹理词或合并写"避免A、B、C"会让个别模板 FAIL

## 安全区设计（有裁剪需求时）

16:9 生成 → 裁 2.35:1 会砍 24% 高度：中心裁切切标题/主体，锚点裁剪（center/bottom）总牺牲一边。**正解 = 生成时预留安全区**，不是靠裁剪锚点：
```
构图安全区：画面顶部与底部边缘各保留纯纸色留白（无文字无主体），便于安全裁切
```
- 约束句是**软约束**（模型不完全遵守）——真正防线是**裁剪后必视觉复核**（crop 后主体完整才算过）
- 裁剪脚本：`crop_image.py <in> <out> --ratio 2.35:1 --anchor center|bottom --quality 85`（支持小数比例）

## 视觉复核循环（有视觉模型时）

出图 → vision_analyze **固定问句模板**（禁止自由发挥问句）→ 任一 FAIL 收紧 prompt 重生成一次 → 再 FAIL 才交用户 → PASS 交用户最终确认。
- 纯意象图问句：主体完整？硬雷区？质感达标？
- 图内文字图加：文字完整无错字？左右留边？
- 金句卡/文字为主图必查文字
- ⚠️ 视觉模型只做硬检查（错字/被裁/雷区），**审美判断以用户为准**（模型会误判，用户纠正过）

## 弹药库（按主题模板库）

- 槽位化模板（`{主体}`/`{色调}`/`{情绪}`），禁止整段复制（防同质化）
- 模板结构雷同会带来布局同质化——P1 布局参数放开后靠隐喻多样性
- **P3 文字槽位必须标注"默认无文字"**，否则 agent 会往内文图里塞字

## Pitfalls（实测踩过）

- **新引擎引用必须仓库内可解析**（2026-08-06 CI 事故）：SKILL.md 里出现的任何 `references/<文件名>.md` 字样都会被 `validate_repo.py` 检查（全仓库任意 skill 的 `references/` 或顶层 `references/` 至少一处存在）。引用 Hermes 侧独有存档而仓库没有 → CI FAIL。正解：按 zine 惯例把上游/拆解档案**复制进新引擎自己的 `references/` 自包含**，再写引用；本地先跑 `python scripts/validate_repo.py` 验证再推送
- **规范与实现一致性**：改完引擎全文扫描残留（旧比例名 21:9、旧文件名、旧默认值会漏在 description/模板/输出格式里）
- **Windows Python 不认 MSYS `/d/` 路径**：脚本与参数一律 `D:/...` 或 `D:\...`（git-bash 里 `/d/` 只对 shell 命令有效）
- **vision_analyze 不吃 MSYS 虚拟路径**：传 `/tmp/xxx.png` 报 "media file not found"（/tmp 是 git-bash 虚拟目录），先 `cygpath -w <path>` 转 `C:\...\Temp\...` 真实 Windows 路径再传
- **Hermes venv 的 PIL 可能损坏**：用系统 python（`python -c "import PIL"` 探测）
- **后端能力边界先实测再定规则**：中文标题渲染、长句渲染、比例支持（如 Wan2.7 只出 16:9/1:1/9:16）——用最小测试图验证后再写进引擎
- **交付格式双轨**：图内文字 ≠ 平台标题时要规范（图内文字 = 标题短版或意象词），并列出双轨供用户核对
- 生图后端 fallback 链（主→备）要记录（如 tokenrhythm→agnes 自动切换）
- **质检门词表按风格族扩展**：新风格（如 zine 系 risograph/xerox/halftone/拼贴）的纹理词要加进词表，否则该风格 prompt 过不了自己的质检门；写完模板库全量跑一遍
- **蒸馏风格必须对拍真实品牌/真实样例，否则会跑偏**（2026-08-05 喜茶教训）：子 agent 蒸馏出的 andiii-heytear-style 走"宣纸水墨新中式"，用户一眼否掉——真喜茶风是**拙趣儿童简笔画**（喜茶 2025 视觉关键词：拙感手写体、圆钝简笔画、铅笔草稿线、松弛不精致）。教训：蒸馏后先搜真实品牌视觉（喜茶公众号/Design360 分析），发现方向存疑就先给用户**试水图**再批量，别一口气 13 张全生成。**优先搜 GitHub 专门 skill**（`gh search repos "X style"`），常有人已蒸馏好（案例：Hchen1218/heytea-style 有完整 style-guide + 参考图）。
- **外部 skill 移植同样必须先出试水图**（2026-08-06 TaiT CRT 验证）：移植 GitHub 生图 skill（Codex/Claude 系）到 Hermes 前，**先按移植后的写法纯文生图一张给用户看**，用户确认方向（"可以可以"）才动手建引擎——与喜茶教训同一模式：方向验证成本 < 落地返工成本。完整移植清单见 `references/external-skill-porting.md`
- **图生图 skill 转文生图的适配**：GitHub 喜茶 skill 是"照片锚点 + 小人涂鸦"（图生图），纯文生图时**去掉真实物件摄影锚点**，改"插画风主体（均匀黑色描边、简洁扁平）+ 简笔画小人"——用户明确"不要真实摄影质感，就要插画"；构图同理（白底大留白、物件 25-45%、小人极小 8-18%）。
- **质检门与风格失配**：喜茶插画风（白底黑线小人）没有宣纸/水墨/茶渍纹理词，旧质检门会 FAIL——风格引擎换底时要同步换质检门词表，或对该风格跳过纸感词校验（质感底线另行定义）。：用户工作流仓库（`D:\tools\andiii-wechat-workflow\skills\`）是引擎与质检门词表的**权威源**，Hermes skills 副本由主 agent 同步、可能滞后（实测：hermes 副本缺 sketchy 系词表，同一 prompt 它 FAIL 而仓库版 PASS）。质检门结果可疑时（如缺纸感词/纹理词报错但 prompt 明明写了），先对比两份 `check_engine_prompt.py` 的修改时间与词表，以较新/仓库版为准，并在引擎 SKILL.md 里留同步提醒
- **MiMo/XIAOMI 视觉配置 401**：`XIAOMI_BASE_URL` 必须 `https://api.xiaomimimo.com/v1`（官方按量付费）；Token Plan 的 `tp-` key 与 sk key 混用必 401（token-plan-cn 是套餐专用地址）；Hermes 实际读 `D:\tools\hermes\.env`（不是 ~/.hermes/.env）；**改 env 后需重启应用**（进程缓存）；排查先 curl 直测官方 OpenAI 兼容端点区分"key 无效"vs"base_url 错"

## 设计推理层（艺术感/设计感保障，2026-08 调研落地）

**核心洞察**：AI 生图"像 AI 图"的根源不是模型弱，而是**没有设计意图**——只有"怎么画"（画布/隐喻/色彩）没有"为什么这么画"（给谁看/什么气质/主次层级）。无意图时模型只能平均化风格。**编译四段式前必跑设计推理**（引擎工作流第 0 步，≤60 秒）。

**6 项模板**（逐项作答，见 `references/design-reasoning.md`）：
1. 用途与渠道（封面 2.35:1 / 分享 1:1 / 内文 16:9 / 金句卡 1:1；小屏阅读）
2. 受众与气质（一句话）
3. 视觉系统（风格引擎 + 本文具体落点）
4. 主次层级（第一眼 / 第二眼看什么）
5. 留白决策（留白是设计决策不是默认——传达什么）
6. 方向承诺（拒绝平均化：保守 / 平衡 / 大胆 选一，模糊任务给用户多方向）

**艺术指导词表**（替代模糊风格词）："高级感"→ editorial / tactile / refined；"氛围感"→ cinematic / atmospheric / dreamlike；"有设计感"→ graphic / typographic / sculptural；"高级配色"→ restrained palette / tonal harmony。

**anti-slop 抢救**（视觉复核 FAIL 后按序执行）：
- 默认禁止：随机渐变雾、漂浮几何碎片、无意义 HUD 叠层、过度镜头光晕、处处拥挤细节、一图混多种风格
- 抢救五招：重述主体焦点一句话 → 删一层背景复杂度 → 强制空白安全区 → 收窄到 2-3 主色 → 模糊风格词换艺术指导词
- Too generic：加构图指令 / 具体纹理材质线索 / 明确情绪目标 / 引用真实使用场景（"公众号封面"）
- Too busy：减道具 / 减背景对比 / 放大主体 / 更干净负空间

**迭代原则**：一次只改一个变量（方向 / 层级 / 配色 / 光线 / 写实度 / 密度）。

**构图法则**（三分法 / 黄金分割 / 对角线 / 负空间）是帮助不是定律——设计推理定了意图后，它们是表达意图的工具，可守可破。

## 工作流接入

引擎做成独立 skill 后，插入主链配图层：`skill_view(引擎) → 设计推理(第0步) → 编译四段式 → 过质检门(PASS 才生成) → 生成 → 视觉复核 → 用户确认`。主链 skill 的 related_skills 加引擎名。

## 参考实现

- 真实喜茶风（拙趣简笔画）完整文生图配方与意象库：见 `references/heytear-real-style.md`（2026-08-05 验证）
- `andiii-image-style`（用户仓库 Andiii208/andiii-wechat-workflow，水彩风 v1.2.1）——四件套、四段式、质检门、安全区、视觉复核、弹药库 10 类、金句卡
- `andiii-zine-style`（Zine 拼贴档案风）——适配自 moonlin1213/muted-zine-poster-v01（MIT，上游 LiamGvchi/gc-minimal-zine-poster），上游 SKILL.md 存档于其 references/；质检门词表补 zine 系词汇；弹药库 `references/zine-prompt-library.md`（5 主题：记忆旧物/城市夜行/情绪孤独/书阅读/时间等待，2026-08-04 补）
- `andiii-sketchy-style`（潦草手账涂鸦风，2026-08-04 建，路由表"待蒸馏"项已销账）——白纸/牛皮纸底 + 铅笔灰 + 至多 1-2 个低饱和马克笔色（旧蓝/砖红/橄榄绿/焦黄）；sketchy/scribble/doodle/胶带/涂改/马克笔/铅笔 已入质检门词表；默认无文字，胶带/涂改划掉/手绘箭头为标志元素
- `andiii-heytear-style`（喜茶风，2026-08-04 子 agent 蒸馏）——⚠️ **2026-08-05 用户否掉旧方向**：原蒸馏成"米白/宣纸底 + 茶汤色 + 水墨 + 印章"（新中式茶饮），实测出图用户明确说"根本不是喜茶风"。**真实喜茶风 = 拙趣儿童简笔画**（白底大留白 + 插画主体 + 粗黑断笔简笔画小人 + 可选歪扭手写字），权威源 GitHub `Hchen1218/heytea-style`（图生图向）。纯文生图适配见 `references/heytear-real-style.md`。避雷：塑料奶茶杯/吸管特写/网红奶茶店风/照片质感/摄影/水墨国画/书法
- `andiii-minimal-style`（石墨极简风，2026-08-04 自建，L先生说风向）——白/浅灰/暖灰纸底 + 石墨灰墨 + 至多一个低饱和点缀（冷蓝/墨绿/赭灰）；hairline/grid/cross-hatch/subtle shadow 已入质检门词表；避雷：水彩晕染感/拼贴碎片感/手绘笔触感；教程/清单类信息图不走 AI 生图（文字乱码）→ gzh-design 组件或 HTML/SVG
- `andiii-crt-style`（复古 CRT 电脑界面风，2026-08-06 建，TaiT-tt/tait-crt-interface-skill 文生图适配）——**色卡登记**（经典/粉黛/极客01/极客02/游戏01/游戏02/自定 2-5 色）+ 全局像素网格（短边/384）+ 棋盘格中间调（最暗+最亮色交替，15-35% 成片）+ CRT 信号面（扫描线/辉光/桶形畸变外 10%）；**自带专用质检门** `scripts/check_crt_prompt.py`（不走纸感词通用门，必备=网格+CRT纹理≥2+畸变+比例+色卡声明；负向豁免含"无X"）；**自带后处理兜底** `scripts/finalize_crt.py`（色卡量化+网格对齐+桶形畸变+可选署名，默认无署名）——本引擎族首个"prompt 质检 + 成品兜底"双保险引擎
- 路由表范例：Andiii 工作流 `references/image-style-routing.md`——文风→风格→引擎 + 待蒸馏排队（Mondo/guizang Swiss/nano-banana prompt 库）
- 实测：Wan2.7-Image 中文标题 ≤10 字可靠无错字，17 字两行长句（金句卡）也可行

## 外部借鉴（2026-08 调研，构建引擎前先读）

- **design-image-studio**（kangarooking）：设计编译器三层（design_reasoning → compiled_brief → 短 prompt）+ anti-slop 抢救手册 → 本 skill 设计推理层的直接来源；其 anti-slop 手册全文已存档于本仓库 `references/learnings/design-image-studio-anti-slop.md`
- **canvas-design**（Anthropic 官方 skills）：设计哲学先行、"命名运动"（1-2 词如 Brutalist Joy / Chromatic Silence）、**用户输入是基础、不限制创作自由**
- **brand-guidelines / theme-factory / frontend-design**（Anthropic 官方 skills）：品牌色板+字体系统、命名调色板（Charcoal Minimal / Teal Trust）、设计 brief 先行 → 启示：为公众号建 Andiii 品牌视觉基准（色板/字体/气质基线，5 引擎共享，可选）
- ⚠️ **安全**：第三方 skill 生态约 36% 含 prompt injection（Snyk ToxicSkills 研究，1,467 个恶意 payload）——只吸收理念，不装第三方；确要装则先审阅 SKILL.md

## 外部借鉴：TaiT CRT Interface（2026-08-06 调研）

- **TaiT CRT Interface**（`TaiT-tt/tait-crt-interface-skill`，Codex 图片生成 skill）：完整拆解与色卡/变化引擎/后处理脚本机制见 `references/tait-crt-interface.md`。最值得偷师的四个点：
  - **色卡登记 + 棋盘格中间调**：2-5 色严格锁色，光学灰 = 最暗+最亮色交替棋盘格（15-35% 成片覆盖），禁自造灰/渐变——比"语义色名"更硬的一层色管
  - **两阶段输入门**：色卡→比例分两轮问，一轮一问，齐了才生成——交互节奏模板
  - **变化引擎 14 轴**：组合防雷同（本引擎族目前只有"弹药库槽位化"防同质化，可升级为轴表）
  - **后处理脚本兜底**：模型不听话时用 Pillow 脚本强制色卡量化+畸变+署名（本引擎族尚无此层，质检门只查 prompt 不查成品）
  - ⚠️ 迁移限制：Codex 专属（内置 image_gen 吃参考图 + 自带 Pillow 解释器）；**Wan2.7 纯文生图做不了"传图变风格"**，需 GPT Image 后端；品牌署名须替换
  - ✅ **已落地**（2026-08-06）：`andiii-crt-style` 引擎——纯文生图适配版，Wan2.7 实测一次出图通过视觉复核（见该引擎 SKILL.md），色卡/棋盘格/变化轴/后处理脚本全保留，强制第三方署名已去除。**外部生图 skill → Hermes 引擎的完整移植清单（拆解→试水图→适配→落地）见 `references/external-skill-porting.md`**
