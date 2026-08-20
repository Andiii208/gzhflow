# 网上「去AI味」与「配图」技能调研(2026-08-18)

> 调研目的:为 Andiii碎碎念公众号工作流寻找可吸收的外部 skill/方法论。
> 结论一句话:外部方案的价值不在"多一个 skill",在"多一双按我们自己标准审稿的眼睛"。
> 本文件是调研存档 + 待执行清单。执行任何一项前需用户拍板。

## 一、去AI味方向

### ✅ 可吸收(按优先级)

1. **两遍检测机制**(来自 conorbronsdon/avoid-ai-writing v3.25, MIT, 明确支持 Hermes)
   - 机制:第一遍改完,重读一遍抓漏网的(换词没换干净的翻案腔、残留拔高词、换皮 copula)
   - 我们现状:check_prose.py 是单遍规则扫描。humanizer skill 的 process 第 6-9 步有人工两遍自查 prompt,但未脚本化
   - 落地:check_prose 第一遍 → 修改 → 重跑,比对新旧稿违规项新增
   - 该 skill 本身是**英文向**(delve/tapestry/em dash),词表对中文文艺散文不适用 → 不装进技能库,README/SKILL.md 已存档思路即可
   - 它的三模式(detect-only / rewrite / edit-in-place)和 voice profiles 机制可借鉴

2. **「裁判模型」工作流**(来自 AI TNT 转载 Louis 反 slop 工作流)
   - 原始形态:V0 草稿 → 独立"冷酷编辑"视角只诊断不改写 → 诊断报告甩回写手视角,只修被点名问题
   - **修正判断(2026-08-18 复盘)**:通用版(拿反AI味规则让 LLM 审 LLM)增量有限——DeepSeek 写、DeepSeek 判,同源自我偏好;通用规则 check_prose 已覆盖大半
   - **正确形态**:裁判标准来自**用户历次否定**(style-rejection-cases.md),让 LLM 按"检查单+素材清单"审稿,只报雷点不重写。这才是别人抄不走的
   - 待落地:`audit_draft.py`(输入=稿件+素材清单,按用户雷区逐项扫描:旁观者≠当事人/预设场景/聪明句密度/素材阶段错位/旧认可句复用/翻案腔残留)

3. **句首连接词密度检测**(来自 jalaalrd/anti-ai-slop-writing, 343★, MIT)
   - 它的词库:50+ 禁词 / 35+ 禁短语 / 16 禁句首 / 10 结构模式,基于 CMU 2025 研究 + Wikipedia Signs of AI Writing + Buffer 5200万帖分析
   - 中文适用增量:**句首连接词密度**(首先/其次/此外/然而/所以/但是 连续出现频率)——我们 check_prose.py 的 HARD_STOPS/HARD_JARGON/ROAD_SIGNS 已覆盖黑话/路标词/翻案腔,唯独缺连接词密度
   - 禁词表主体是英文商业写作向,与我们的黑话库重叠,不重复合并

4. **md2wechat 官方博客《去 AI 味改写清单》**(md2wechat.com/zh/blog/remove-ai-tone-wechat-articles)
   - 与我们的链路同为 md→微信,分层改写思路:删空背景开头 → 绝对化判断加边界 → 小标题必须真回答问题 → **结尾从"升华"改"收口"**(收回到适用人群/下一步动作/阅读后的判断)
   - "结尾收口"与用户拍板的"极简三句收"同频,可作补充参照

### ❌ 不吸收(明确排除)

- 付费降AI工具(嘎嘎降AI/去AIGC/比话降AI 等)——检测器驱动写作,与"真去AI味"理念冲突
- "故意制造标点错误/错别字骗检测器"套路(泛科学院/知乎)——用户 2026-08-07 明确"过于生活化反而很AI",刻意伪人味是 AI 最擅长的伪人味,方向相反
- 躲检测器提示词(10条规则那种)——质量归零,且我们目标是读者观感不是检测器分数
- 商业 AI 检测器(Sapling/ZeroGPT/GPTZero 等)——对中文误判率高(实测把浓AI味稿判成100%人类),无参考价值

## 二、配图方向

### ✅ 可吸收

1. **「垫图=风格库」概念**(翔宇工作流 xiangyugongzuoli.com/ai-image-workflow)
   - 核心:风格 = 一张参考图 + styles.json 一条记录,丢进 reference/images/ 永久可用,不记 prompt
   - 我们现状:风格全部文字化(四段式 prompt 编译),Wan2.7 不收参考图 → 现在落不了地
   - **路线图**:哪天后端支持参考图(Agnes API 是 OpenAI 兼容,可测),风格库改成"图片文件即风格",7 个引擎的 prompt 沉淀成图
   - 平台规格表(微信封面 2.35:1≈900×383、主图 16:9≈1280×720)与我们一致,无需动

2. **拼贴类 prompt 细节**(数位时代《18组AI生图提示词》)
   - 负向控制写法:禁止对称构图/禁止小图大于主图/手绘线描厚度不均/画面之间均匀白边
   - ⚠️ 吸收时以我们实测纪律为准(Wan2.7 多格画板退化、单照片碎片、zine 配方是验证过的,外部写法只补细节)

3. **深色模式兼容**(花叔公众号配图设计规范)——**待实测,未验证不写铁律**
   - 避免纯黑封面(深色模式信息流隐身)、透明底 PNG 优先、低饱和配色
   - 我们配图是插画(zine/水彩/手绘),微信深色模式渲染未实测 → 列为待办,实测后决定是否并入 theme-routing.md

4. **马识途两套快速配图 prompt**(X @shitunote)——入门向(70分快速图),我们四段式+质检门已超过,仅"不要虚拟场景/敏感内容画相似替代"约束可参考

### ❌ 不吸收

- 壹伴/Canva 模板站(商业模板,非工作流增量)
- n8n 全自动流水线(火山引擎教程,我们已有更定制化链路)
- `PedroCouto839/nano-banana-pro-prompts-recommend-skill`(6000+ prompt 那个是**包装成 skill 的下载站垃圾**,README 全套话,排除)
- 优设网 11 领域 prompt 库(pop mart/cyberpunk 等,风格不贴公众号文艺散文)

## 三、待执行清单(需用户拍板)

| 优先级 | 动作 | 预估 |
|---|---|---|
| 1 | `audit_draft.py`:把 style-rejection-cases.md 否定模式蒸馏成发文前自检检查单(输入=稿件+素材清单,按用户雷区扫描) | ~15分钟 |
| 2 | check_prose.py 补句首连接词密度检测 + 两遍检测(改完重跑对比违规项) | ~10分钟 |
| 3 | avoid-ai-writing / anti-ai-slop 原文存档到工作流仓库 references/(不装技能库) | ~5分钟 |
| 4(远期) | 用户认可配图沉淀 assets/approved-images/ 视觉资产库;垫图风格库等换后端再启用 | — |
| 待实测 | 微信深色模式下插画配图渲染;Agnes API 是否支持参考图 | — |

## 四、链接存档

- github.com/conorbronsdon/avoid-ai-writing(MIT, 支持 Hermes)
- github.com/jalaalrd/anti-ai-slop-writing(343★, MIT)
- github.com/blader/humanizer(已装,humanizer skill 即此, v2.5.1)
- github.com/hardikpandya/stop-slop(5维评分思路:Directness/Rhythm/Trust/Authenticity/Density, <35/50 重修)
- m.aitntnews.com/newDetail.html?newId=22610(AI TNT, Louis 反slop + 裁判模型)
- www.md2wechat.com/zh/blog/remove-ai-tone-wechat-articles(去AI味改写清单)
- m.36kr.com/p/3824601267196037(36氪去AI味手册:注入肉身/三明治修正法/从X到Y句型)
- xiangyugongzuoli.com/ai-image-workflow(垫图风格库)
- www.bnext.com.tw/article/91430(18组生图提示词,拼贴类)
- www.huasheng.ai/insights/wechat-article-image-design(花叔配图规范,深色模式)
