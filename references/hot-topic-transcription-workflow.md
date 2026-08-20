# 热点事件转述文 + 推送技术坑（2026-08-16 DeepSeek 事件实测）

> 本篇对应文章《DeepSeek这几天经历了什么》（V4 Pro 三个指纹谜团 + DSH 极简模式/插件，7 图石墨极简排版，已推草稿箱）。
> 写作教训与推送技术坑均在此，SKILL.md 若已并入同类条目以 SKILL.md 为准。

## 一、写作：热点转述文的素材归属与立场纪律（用户三次纠正）

1. **素材归属（用户原话「我的素材是别人写的呀，不是我的话」）** — 用户转来的小红书/微博笔记是**别人的素材**（"我从小红书上看到的信息"）。里面的吐槽/经历（"好你个小梁子""两天没睡过好觉"）只能作为**引用**（"原帖底下有网友吐槽"），**不能**拟成作者金句、更不能当作者立场。判断：用户说"我复制了一整篇人家的笔记给你的" = 引用素材；作者立场需另行确认。
2. **纯转述文模式（用户拍板「不带作者立场」）** — 热点事件转述文写法：通篇无"我认为"；结尾落在未实锤/待官方回应的事实上（"官方没有回应：究竟是上错了模型，还是真的在背后路由了三个模型，都没有实锤"）；网友原话全部标注引用；圈内梗只在引用时出现一次，不堆砌。作者不评价、不升华。
3. **不做梗装置（用户「你这个梗看起来很ai啊」）** — 把真人吐槽抽出来做"金句块/彩蛋"、给梗编号定位 = AI 化的设计感。梗不做装置：故事讲到哪、话自然带到哪，不预告/不回收/不解释。节奏靠事实本身的戏剧性，不靠设计。
4. **标题覆盖全部产品线（用户「标题不要写v4pro，写deepseek啊，因为也有harness相关的内容啊」）** — 文章跨多个产品/事件线时，标题以**主体公司/事件**命名（DeepSeek这几天经历了什么），不能只点其中一条线（V4 Pro）。
5. **流程：先素材清单+骨架确认，再动笔** — 用户批评"没有走正常的工作流"：转述类文章同样要先深挖搜索（多源交叉：X/知乎/快科技/官网）→ 整理时间线+素材清单给用户过目 → 确认写作骨架（读者/结构/语气/不写清单）→ 才动笔。跳过 = 被点名。

## 二、推送技术坑（实测解法）

### GIF 正文图会被转静态（wechat-api.ts 限制）
- `wechat-image-processor.ts` 的 `WECHAT_BODY_IMAGE_UNSUPPORTED_FORMATS` 含 `.gif`，上传时转静态帧（日志 `converted unsupported .gif source`），动图丢失。
- ✅ **2026-08-16 已固化为 `scripts/upload_gif.py`**：multipart 直传 `media/uploadimg`（微信原生支持 gif）→ mmbiz 长链 → 自动替换 HTML 里的 gif src。用法：`python scripts/upload_gif.py ./assets/anim.gif --html article_排版_x.html`（凭证读 ~/.baoyu-skills/.env，与推送同一套）。
- mmbiz URL 长期有效；替换后推送时脚本对远程 URL 透传（日志 `Processed 0`），动图保留。
- ⚠️ 上传 gif 也要在 Clash global 模式下做（同 40164 白名单问题）。

### 排版 section 未闭合 → 微信渲染缩窄
- 章节标题组件 `<section>` 忘闭合 → 章节互相嵌套 → 微信端深层嵌套 section 宽度收缩（用户实测「04 05 明显比 01 02 03 窄」）。
- ✅ **2026-08-16 已固化进 validate_gzh_html.py**：新增 `check_balance()` 栈解析（section/p/span/strong/em/h3/blockquote 开闭平衡 + 交叉嵌套检测），不平衡即 ERROR——不再只靠人工自检。
- 交付前仍可手动跑 `python validate_gzh_html.py <file.html>` 确认 0 ERROR；修复模式：章节标题返回"开始+标题区"，每章内容结束后 `body.append('</section>')`；多次修复后必须重新生成并跑栈验证。

### 同人图素材源（用户拍板：用别人画的 DeepSeek 同人图）
- **dsh-deep-whale**（Small-tailqwq，626⭐）— DSH 鲸鱼娘皮肤「深海女仆工坊」：`maid-atelier/assets/` 有高清女仆鲸鱼娘立绘（maid-left/maid-right）+ 宫殿背景（palace-day/night）。**CC BY-NC-SA 4.0**，署名链：原作 上善（Pixiv/B站 上善无形）、二次设计 ZipZipPipe（拉链管道）——公众号用需文末署名 + 非商业用途。
- **dafeiyu-pet**（1190fasheqi）— 鲸鱼娘·大肥鱼三视图（sprites/正面/侧面/背面.png，透明底 Q 版）。
- **dsh-web-ui**（zhu1090093659）— `packages/dsh-pet/assets/whale/previews/*.gif` 鲸鱼娘桌宠动图（idle/waiting/running/waving/jumping/failed/review），适合做段落间动图。
- 官方 logo：deepseek-ai GitHub 组织头像（`avatars.githubusercontent.com/u/148330874`）即官方鲸鱼 logo，白底蓝鲸，可直接做封面（900×383 白底 + 居中）。
- 流程：git clone --depth 1 → vision 复核内容/干净度 → PIL 白底合成（RGBA→RGB）+ 压宽 800 → 图注标注来源。
- 竖版立绘在公众号内文可接受（居中显示），不强制 16:9；动图（GIF）比静态图更"丰富"。

## 三、石墨极简排版章节化要点（本次成功结构）
- 引言金句卡（组件2，金句与标题视角错开）→ 导读 3 看点（组件3）→ 编号章节（组件5：01/02/03/04/05 + ∞ 结语）→ 数据卡（组件12 两列大数字版，手机上三列太窄）→ 竖条金句（8a）→ 图片容器（14）→ 引用块（REFERENCE）→ END → 签名（落款：就到这里，下次见。/ ——Andiii碎碎念，禁三连文案）。
- 三种指纹类并列内容用 ordered-list（11a 圆标）。
