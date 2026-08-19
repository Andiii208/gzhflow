---
name: gzhflow
description: 跨 Agent 公众号内容发布工作流 — 从「一个主题」到「草稿箱里一篇排好版、配好图、去过 AI 味的文章」的六阶段流水线（素材先行→写作→去AI味→配图→排版→推草稿箱），每阶段带质量门。触发词：公众号、写公众号、公众号文章、公众号工作流、gzhflow、微信推文、推草稿箱。
version: 0.1.0
license: MIT
tags: [wechat, 公众号, content-publishing, workflow, cross-agent]
---

# gzhflow 主编排 — 微信公众号内容发布工作流

> 本文件是六阶段工作流的**唯一权威编排**。任何 Agent（Claude Code / Cursor / Codex / Gemini CLI / Qwen Code / DeepSeek / Hermes 等）按此执行。用户给主题后，严格按顺序走完六个阶段，每阶段读完对应 `prompts/` 文件、跑完对应质检门、输出给用户审阅后再进下一阶段。

## 0. 启动前必读

1. **配置**：确认 `config/workflow.yaml`、`config/styles.yaml`、`config/themes.yaml`、`config/publish.yaml` 存在（不存在则从 `*.example.yaml` 复制，并让用户确认配置）。
2. **产物目录**：所有产物（草稿 md、HTML、图片）写入 `config/workflow.yaml` 的 `output_dir`（默认 `generated/`，已 gitignore）。
3. **审核模式**：默认 `strict`——每个阶段输出都给用户审阅；用户明确说「直接做/不用审阅」才切 `auto` 全自动。

## 1. 六阶段总览

| 阶段 | 提示词 | 质检门 | 产物 |
|---|---|---|---|
| ① 素材先行 | `prompts/01-material.md` | 意图三问（写给谁/什么感觉/为什么今天） | 素材锚点清单 |
| ② 写作 | `prompts/02-writing.md` | `scripts/ai_flavor_score.py` + 自检四问 | `draft.md`（frontmatter + 正文） |
| ③ 去AI味 | `prompts/03-deai.md` | `scripts/ai_flavor_score.py` 复检（硬禁令清零） | 定稿 `draft.md` |
| ④ 配图（可选） | `prompts/04-images.md` | `scripts/check_image_prompt.py`（PASS 才生成） | `cover.jpg` + 内文图 |
| ⑤ 排版 | `prompts/05-layout.md` | `scripts/validate_gzh_html.py`（0 ERROR） | `{标题}_排版_{主题}.html` |
| ⑥ 发布 | `prompts/06-publish.md` | `scripts/publish_draft.py --dry-run` 先验 | 草稿箱草稿 |

**质量门是硬门槛**：脚本 FAIL 不进入下一阶段。**默认停靠点**：①②③ 阶段输出全文给用户审阅。

## 2. 阶段①：素材先行

读 `prompts/01-material.md`。核心纪律：

- 收到主题**先别动笔**，问 3-5 个针对性问题挖真实颗粒（时间/场景/感受/具体画面）
- 用户的每一句话、每个场景都是**锚点**，全文围着锚点转，不另起炉灶
- 只给主题没给素材 → 坦白缺什么，不硬写。硬写出来的必是 AI 味
- 意图三问：写给谁看？想让他读完产生什么感觉？为什么是今天写这篇？答不上来就先不写
- 素材提问只问一轮，拒答后转入思辨深挖（这个主题背后在发生什么）
- 用户说「多去网上搜集例子」= 主动 web_search 补充真实例子，标注来源给用户核对后再动笔

## 3. 阶段②：写作

读 `prompts/02-writing.md`。流程：

1. **风格路由**：读 `config/styles.yaml`，按用户话题关键词匹配文风 → 读对应 `examples/styles/<风格名>.md`（或用户自定义的风格文件）→ 按该风格特征写作
2. 匹配不到 → 用 `default_style`
3. 写完 → 跑机器门：`python scripts/ai_flavor_score.py <draft.md>`（剥离 frontmatter 与签名行再检）
4. 自检四问：
   - 这句是我真的想说的，还是为了「好看」写的？
   - 如果朋友读到，会觉得这是「我」写的吗？
   - 有没有一句话能让读者停下来想一会儿？
   - 我有没有在编造不属于用户的经历？
5. **输出全文给用户审阅**（严格模式），用户确认后才进阶段③

## 4. 阶段③：去AI味

读 `prompts/03-deai.md` 与 `references/de-ai-craft.md`：

- **结构层手术**：删首尾填充、拆完美段落、去金句堆叠、不均匀化
- **声音层**：立场贯穿、承认矛盾、允许不完美、具体>抽象、结尾不升华
- **人称适配**：代笔禁止「我」叙事（除非用户给了亲身经历素材），用「你/我们」
- **机器门复检**：`python scripts/ai_flavor_score.py <draft.md>`，硬禁令清零才交稿
- 复输出全文给用户审阅

## 5. 阶段④：配图（可选，默认关）

`config/workflow.yaml` 的 `stages.illustration: true` 才执行。读 `prompts/04-images.md` 与 `references/image-routing.md`：

1. **图源三问**（每个意象块独立决策）：
   - 本体问：意象指向的东西现实中存在且读者认得出吗？→ 真实图（网上找）
   - 功能问：这张图要「证明」还是「营造」？证明→真实图；营造→AI 图
   - 素材问：网上有现成高质量合规真实图吗？有→用真的；找不到→AI 兜底
2. **AI 轨风格路由**：读 `examples/image-engines/` 下的引擎定义，按文风选风格
3. **设计推理**：读 `references/design-reasoning.md`，按 6 项模板作答（≤60 秒）
4. **四段式编译**：画布纸感/主体隐喻/文字色彩/氛围规避
5. **质检门**：`echo "prompt" | python scripts/check_image_prompt.py` → PASS 才生成
6. **生成**：调 OpenAI 兼容图生接口（config 配置）；封面双尺寸 + 内文 16:9
7. **裁剪**：`python scripts/crop_image.py`（封面 2.35:1 / 内文 16:9 / jpg）
8. **视觉复核 + 用户确认**：先 1 张试水再批量（风格不确定时）

## 6. 阶段⑤：排版

读 `prompts/05-layout.md` 与 `references/theme-routing.md`：

1. **主题路由**：读 `config/themes.yaml`，按文章题材/文风选主题
2. **转换**：`python scripts/md2wechat.py draft.md --theme <主题名> -o 输出.html`（主题定义在 `examples/themes/`）
3. **校验**：`python scripts/validate_gzh_html.py 输出.html` → **0 ERROR + 半角标点 0 WARN** 才放行
4. **交叉核对**：md 里的每个 `##` 标题、`>` 金句、`![]` 图片必须全部出现在 HTML（grep 比对）
5. 产物命名：`{标题}_排版_{主题}.html`，另可生成 `_预览.html` 人工兜底

## 7. 阶段⑥：发布

读 `prompts/06-publish.md` 与 `references/wechat-api-guide.md`：

1. **dry-run 先验**（不碰微信）：`python scripts/publish_draft.py <html> --title ... --cover cover.jpg --dry-run`
2. **正式推草稿箱**：`python scripts/publish_draft.py <html> --title ... --author ... --summary ... --cover cover.jpg`
   - 主路径 = 官方 API `draft/add`（个人订阅号可用）
   - 自动上传正文图片（media/uploadimg）+ 封面
3. **发布**：用户到「公众号助手 App → 草稿箱」手动点发布（个人号无法 API 直接发布，2025-07 起 freepublish 回收）
4. **无凭证/失败兜底**：交付排版 HTML + 图片，指导用户到 mp.weixin.qq.com 后台手动粘贴

## 8. 关键纪律（全文遵守）

- **不编造**：用户没给的经历/场景/细节一律不写。素材先行是去 AI 味的根本
- **不过度聪明**：聪明句（断言/金句式）全文 ≤3-4 句，其余平实。漂亮句子是稀有品
- **不被否后空转**：文风/配图被否 2-3 次后停止猜测，列出候选方向让用户选或请用户给参考
- **不跳过用户审阅**（严格模式）：每阶段确认后才推进
- **不提交凭证**：AppSecret/API Key 只在本地配置，仓库只留占位符
- **个人化只改配置**：改文风/主题/风格只动 `config/` 与 `examples/`，不修改本流程文件

## 9. 常见问题（Pitfalls）

- ❌ 收到主题直接写 → 必出 AI 味。先走素材先行
- ❌ 「列举不全面」理解为可以动笔 → 是明确指令：去网上搜集真实例子
- ❌ 预设场景（时间/地点/季节/身份）→ 动笔前先问，不确定就不写
- ❌ 给读者（「你」）预设行为 → 同样是编造，无锚点时场景停在现象级描述
- ❌ 共情向文章加科普数据 → 纯共情向砍掉一切研究佐证
- ❌ 复用旧文章获认可的结尾句 → 每次按当下文章重新想
- ❌ 排版后 HTML 直接推 → 必须先 validate_gzh_html.py（0 ERROR）+ 交叉核对内容完整性
- ⚠️ 微信 API 40164 = IP 白名单问题，报错里的 IP 为准（详见 wechat-api-guide.md）
