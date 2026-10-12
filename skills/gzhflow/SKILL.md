---
name: gzhflow
description: 跨 Agent 公众号内容发布工作流 — 从「一个主题」到「草稿箱里一篇排好版、配好图、去过 AI 味的文章」的七阶段流水线（素材先行→写作→去AI味→配图→排版→推草稿箱→复盘回写），每阶段带质量门。触发词：公众号、写公众号、公众号文章、公众号工作流、gzhflow、微信推文、推草稿箱。
version: 0.2.0
license: MIT
tags: [wechat, 公众号, content-publishing, workflow, cross-agent]
---

# gzhflow 主编排 — 微信公众号内容发布工作流

> 本文件是工作流的**唯一权威编排**。任何 Agent（Claude Code / Cursor / Codex / Gemini CLI / Qwen Code / DeepSeek / Hermes 等）按此执行。用户给主题后，按顺序走完七个阶段，每阶段读完对应 `prompts/` 文件、跑完对应质检门、输出给用户审阅后再进下一阶段。

## 0. 启动前必读（每次会话第一件事）

1. **读 `state.md`**（仓库根目录）：当前这篇写到哪了、待办、会话交接备注。
   用户在多个 Agent 之间切换，没有这个文件，上一个会话的上下文就断了——
   你会把已经问过的问题再问一遍。
   **这个文件被 gitignore（含个人进度），clone 下来没有是正常的**，按 SKILL.md 从阶段① 起即可。
2. **配置**：确认 `config/workflow.yaml`、`config/styles.yaml`、`config/themes.yaml`、`config/publish.yaml` 存在（不存在则从 `*.example.yaml` 复制，并让用户确认配置）。
3. **产物目录**：所有产物（草稿 md、HTML、图片）写入 `config/workflow.yaml` 的 `output_dir`（默认 `generated/`，已 gitignore）。
4. **审核模式**：默认 `strict`——每个阶段输出都给用户审阅；用户明确说「直接做/不用审阅」才切 `auto` 全自动。

## 1. 七阶段总览

| 阶段 | 提示词 | 质检门 | 产物 |
|---|---|---|---|
| ① 素材先行 | `prompts/01-material.md` | 意图三问（写给谁/什么感觉/为什么今天） | 素材锚点清单 |
| ② 写作 | `prompts/02-writing.md` | `scripts/ai_flavor_score.py` + 自检四问 | `draft.md`（frontmatter + 正文） |
| ③ 去AI味 | `prompts/03-deai.md` | `scripts/ai_flavor_score.py` 复检（FAIL 清零） | 定稿 `draft.md` |
| ④ 配图（可选） | `prompts/04-images.md` | `scripts/check_image_prompt.py`（PASS 才生成） | `cover.jpg` + 内文图 |
| ⑤ 排版 | `prompts/05-layout.md` | `scripts/validate_gzh_html.py`（0 ERROR） | `{标题}_排版_{主题}.html` |
| ⑥ 发布 | `prompts/06-publish.md` | `scripts/publish_draft.py --dry-run` 先验 | 草稿箱草稿 |
| ⑦ 复盘 | `prompts/07-review.md` | 每 5 篇回写一次 | `assets/log.md` + 回写四库 |

**质量门是硬门槛**：脚本 FAIL 不进入下一阶段。**默认停靠点**：①②③ 阶段输出全文给用户审阅。

## 1.5 四库与状态机（这套系统跟普通流水线的区别）

单篇生产只是飞轮的一段弧。底下四个库在下持续沉淀，单篇流程在上取用并回写：

| 库 | 文件 | 变化速度 | 什么时候动 |
|---|---|---|---|
| 输入收件箱 | `assets/inbox.md` | 快变（日） | 日常「记一笔」；阶段① 先查它 |
| 范文锚 | `assets/voice-samples/` | 慢变（月） | 阶段② 动笔前读 1~3 段 |
| 风格档案 | `assets/voice.md` | 慢变（季度） | 阶段② 前读；阶段⑦ 回写 |
| 教训库 | `assets/lessons.md` | 事件驱动 | 被否 2-3 次时查；阶段⑦ 回写 |

**这四个库里，`inbox.md`、`voice-samples/` 里的范文段落、发文日志都被 gitignore**——
开源的是流程和方法论，不是你写过的内容。clone 下来缺这些文件是正常的，
首次使用照 `assets/voice-samples/README.md` 自建即可（那份 README 是公开的）。

`state.md` 是跨会话状态机，见 §0。

**references/ 有 38 份方法论，按阶段路由见 `references/INDEX.md`。** 别一次全读，按标题对上了再展开。

## 2. 阶段①：素材先行

读 `prompts/01-material.md`。核心纪律：

- **先收集，再提问**：先翻 `assets/inbox.md` 和本轮对话，缺什么才问，**只问一轮**
- 用户的每一句话、每个场景都是**锚点**，全文围着锚点转，不另起炉灶
- 只给主题没给素材 → 坦白缺什么，不硬写。硬写出来的必是 AI 味
- 意图三问：写给谁看？想让他读完产生什么感觉？为什么是今天写这篇？答不上来就先不写
- 用户说「多去网上搜集例子」= 主动 web_search 补充真实例子，标注来源给用户核对后再动笔
- 素材提问只问一轮，拒答后转入思辨深挖

## 3. 阶段②：写作

读 `prompts/02-writing.md` 与 `skills/andiii-writing-style/SKILL.md`（写作风格引擎）。流程：

0. **读风格档案与范文锚（动笔前必做）**：`assets/voice.md` + `assets/voice-samples/` 里按话题挑 1~3 段你自己的旧稿。**规则是"关于风格的知识"，真实段落才是"风格本身"**——目前 voice-samples 为空（见 state.md 待办），这是当前最大缺口
1. **风格路由**：读 `config/styles.yaml` 按话题关键词匹配文风；同时参考 `skills/andiii-writing-style/SKILL.md` 的**风格路由表**（6 公众号文风：槽边往事/MorningRocks/我要WhatYouNeed/杂乱无章/L先生说/新世相）+ **双模式写作体系**（模式A 个人感悟式 / 模式B 知识输出式）
2. **标题公式库**：从 andiii-writing-style §四 取公式（≤20 字、制造认知缺口、不用震惊体）
3. **写完** → 跑机器门：`python scripts/ai_flavor_score.py <draft.md>`（剥离 frontmatter 与签名行再检）。破折号阈值跟模型走，加 `--model deepseek` 更准
4. **自检四问 + 人味自检**（andiii-writing-style §五）：
   - 这句是我真的想说的，还是为了「好看」写的？
   - 如果朋友读到，会觉得这是「我」写的吗？
   - 有没有一句话能让读者停下来想一会儿？
   - 我有没有在编造不属于用户的经历？
   - **人味检查**：文章里有没有至少一个"只有你知道的细节"？找出全文最工整的三句话（AI 味最高处）优先处理；漂亮句子超过 2 句删到只剩最要紧的
5. **写作陷阱**（andiii-writing-style §七）：写太快会写出 AI 味；多版本迭代不如一次想清楚；最好的版本往往是最老实的一版；引用素材不要急着接"但是"
6. **输出全文给用户审阅**（严格模式），用户确认后才进阶段③

## 4. 阶段③：去AI味

读 `prompts/03-deai.md` 与 `references/de-ai-craft.md`。**拆三环，别合并**：

- **先选模式**：自家稿（可下狠刀、可向你要料）/ 白名单（只动清单内明确命中的条目）
- **三条硬边界优先于一切去味规则**：信息守恒、最小改动、结构不动
- **③a 结构手术**：删首尾填充、拆完美段落、去金句堆叠、不均匀化
- **③b 冷读重写**：**把原文盖上，用中文重新说一遍**。不是"请自然一点"——ACL 2025 实测后者不可靠且反效果，前者能把翻译腔从 43% 降到 25%
- **③c 分视角评审**：并行 6 个视角（准确性/语气漂移/受众匹配/AI 痕迹/改编忠实度/链接检查）**只读不改**，问题清单交回 ③b
- **声音层**：立场贯穿、承认矛盾、允许不完美、具体>抽象、结尾不升华
- **人称适配**：代笔禁止「我」叙事（除非用户给了亲身经历素材），用「你/我们」
- **机器门复检**：`python scripts/ai_flavor_score.py <draft.md>`，FAIL 清零才交稿
- 复输出全文给用户审阅

## 5. 阶段④：配图（可选，默认关）

`config/workflow.yaml` 的 `stages.illustration: true` 才执行。读 `prompts/04-images.md` 与 `references/image-routing.md`、`references/image-style-routing.md`：

1. **图源三问**（每个意象块独立决策，见 image-style-routing.md「图源决策」）：
   - 本体问：意象指向的东西现实中存在且读者认得出吗？→ 真实图（走 `references/real-image-collection.md` 渠道库）
   - 功能问：这张图要「证明」还是「营造」？证明→真实图；营造→AI 图
   - 素材问：网上有现成高质量合规真实图吗？有→用真的；找不到→AI 兜底
2. **AI 轨风格路由**：读 `examples/image-engines/` 下引擎定义（watercolor/zine/sketchy/minimal/heytear 五套），按文风选风格；风格是参考不是限制，允许跨风格混搭
3. **设计推理**：读 `references/design-reasoning.md`，按 6 项模板作答（≤60 秒）
4. **四段式编译**：画布纸感/主体隐喻/文字色彩/氛围规避
5. **质检门**：`echo "prompt" | python scripts/check_image_prompt.py` → PASS 才生成
6. **生成**：调 OpenAI 兼容图生接口（config 配置）；封面双尺寸 + 内文 16:9
7. **裁剪**：`python scripts/crop_image.py`（封面 2.35:1 / 内文 16:9 / jpg）
8. **视觉复核 + 用户确认**：先 1 张试水再批量（风格不确定时）

## 6. 阶段⑤：排版

读 `prompts/05-layout.md` 与 `skills/gzh-design/references/theme-index.md`：

1. **主题路由**：读 `skills/gzh-design/references/theme-index.md`（主题单一来源），按题材推荐：
   - 教程/清单/盘点 → 摸鱼绿；深度观点/力量感 → 红白；科技/专业 → 石墨极简；禅意/随笔 → 留白禅意；测评对比 → 摸鱼票据；内刊/案例复盘 → 橄榄手记
   - 用户指定 → 直接用；无指定 → 给选项确认（全自动模式自动选并说明理由）
2. **读组件库**：读所选主题的组件库 `skills/gzh-design/references/theme-{标识}.md` + 通用库 `common-components.md`（代码块/图片/GIF/小标签）——**HTML 一律从组件库取，不凭记忆手写**
3. **转换**：`python scripts/md2wechat.py draft.md --theme <主题> -o 输出.html`（简易转换）**或**按组件库手工装配（复杂排版：章节编号、引言卡、目录导读、关键词下划线、金句块、END、签名区）
   - **关键词下划线（核心特色）**：每个正文段落主动找 1-3 个核心短语，用 theme-index 登记的下划线 CSS 标记（即使原文无加粗也要标）
   - **章节自动编号** 01/02/03…，末章结语用 ∞ 变体；**尾部签名区仅末尾一处**
4. **校验**：`python scripts/validate_gzh_html.py 输出.html` → **0 ERROR + 半角标点 0 WARN** 才放行；复杂装配跑 `component_lint.py`
   （2026-10-12 起校验器已合并为一份，13 项 CSS 红线全覆盖——`skills/gzh-design/scripts/` 下那个路径改为转发到本脚本）
5. **交叉核对**：md 里的每个 `##` 标题、`>` 金句、`![]` 图片必须全部出现在 HTML（grep 比对）
6. **预览交付**：产物命名 `{标题}_排版_{主题}({标识}).html`；用 `skills/gzh-design/scripts/wrap_preview.py` 生成带「复制到公众号」按钮的 `_预览.html`（一键复制，免手动全选）
7. **平台红线**：禁 `<style>/<script>/<div>/class/id/position:fixed/float/@media/grid`；样式全内联；文字节点全用 `<span leaf="">` 包裹；图片 `max-width:100%` 不用 `width:100%`

## 7. 阶段⑥：发布

读 `prompts/06-publish.md` 与 `references/wechat-api-guide.md`：

1. **dry-run 先验**（不碰微信）：`python scripts/publish_draft.py <html> --title ... --cover cover.jpg --dry-run`
2. **正式推草稿箱**：`python scripts/publish_draft.py <html> --title ... --author ... --summary ... --cover cover.jpg`
   - 主路径 = 官方 API `draft/add`（个人订阅号可用）
   - 自动上传正文图片（media/uploadimg）+ 封面
3. **发布**：用户到「公众号助手 App → 草稿箱」手动点发布（个人号无法 API 直接发布，2025-07 起 freepublish 回收）
4. **无凭证/失败兜底**：交付排版 HTML + 图片，指导用户到 mp.weixin.qq.com 后台手动粘贴

## 8. 阶段⑦：复盘（发完才闭环）

读 `prompts/07-review.md`：

- **每篇发完**：往 `assets/log.md` 追加一行（一分钟）
- **每 5 篇**：回写一次——规律进 `assets/voice.md`，坑进 `assets/lessons.md`，
  满意的稿子切 300 字段落进 `assets/voice-samples/`
- 同时更新 `state.md` 的「已完成」区，把这篇的进度收掉

**没有这一环，工作流只是传送带。** 第 10 篇要比第 1 篇聪明，靠的就是这个。

## 9. 关键纪律（全文遵守）

- **不编造**：用户没给的经历/场景/细节一律不写。素材先行是去 AI 味的根本
- **不过度聪明**：聪明句（断言/金句式）全文 ≤3-4 句，其余平实。漂亮句子是稀有品
- **不被否后空转**：文风/配图被否 2-3 次后停止猜测，列出候选方向让用户选或请用户给参考（先查 `assets/lessons.md`）
- **不跳过用户审阅**（严格模式）：每阶段确认后才推进
- **不提交凭证**：AppSecret/API Key 只在本地配置，仓库只留占位符
- **个人化只改配置**：改文风/主题/风格只动 `config/` 与 `examples/`，不修改本流程文件
- **不为过质检门改文字**：门是提示不是目标。违禁词清零 ≠ 人味够了
- **一篇最多搭载 2 个系统改动**：改完立刻用真实一篇验证，别攒批

## 10. 常见问题（Pitfalls）

- ❌ 收到主题直接写 → 必出 AI 味。先走素材先行
- ❌ 「列举不全面」理解为可以动笔 → 是明确指令：去网上搜集真实例子
- ❌ 预设场景（时间/地点/季节/身份）→ 动笔前先问，不确定就不写
- ❌ 给读者（「你」）预设行为 → 同样是编造，无锚点时场景停在现象级描述
- ❌ 共情向文章加科普数据 → 纯共情向砍掉一切研究佐证
- ❌ 复用旧文章获认可的结尾句 → 每次按当下文章重新想
- ❌ 排版后 HTML 直接推 → 必须先 validate_gzh_html.py（0 ERROR）+ 交叉核对内容完整性
- ⚠️ 微信 API 40164 = IP 白名单问题，报错里的 IP 为准（详见 wechat-api-guide.md）
