# 文章内文配图工作流

用于在已完成的公众号文章中插入分节插画。适用于用户说"中间也要穿插一些图片"的场景。

> ⚠️ 本文写于 Windows 时代，生成/发布步骤的路径（`D:/tools/hermes/...`）在 Mac 上不成立，照搬前先换路径。

## 何时启用

- 文章完成并获得用户认可
- 用户要求配图（非封面，而是正文中间的插图）
- 文章有3-7个自然分段，每个分段可配1张概念图

## 工作流

### 0. 先定图源（三问）

每个意象块独立决策，允许整篇混用真实图与 AI 插画——真实图管「见证」，AI 插画管「想象」：

1. **本体问**：这个意象指向的东西现实中存在且读者认得出吗？（某软件/某产品/某事件 → 真实图；回忆/情绪/比喻 → AI 插画）
2. **功能问**：这张图要「证明」还是「营造」？（截图/数据/界面 → 真实图；氛围/情绪 → AI 插画）
3. **素材问**：网上有现成的高质量合规真实图吗？（官方图/CC0 图库/社区同人图 → 用真的；找不到或版权不明 → AI 兜底）

- **真实图轨** → 走 `references/real-image-collection.md` 渠道库（GitHub README 演示图 / 博客文章图 / CC0 图库 / 官方图 / 社区同人图），web_search 找图 → 下载/筛选/归因（图下说明带来源），**跳过下面 2-3 两步，直接进第 4 步嵌入**
- **AI 轨** → 继续走下面的 1-3 步

完整决策规则见 `references/image-style-routing.md`「图源决策」章节；按文章类型的默认倾向见同文件「图源策略表」（新闻/热点事件默认真实图优先）。

### 1. 规划配图位置

阅读文章结构，在3-4个**关键转折点**放置插图。关键转折点指：章节转换、情绪转折、概念性跳转。不要在同一个段落密集放图。

示例映射（来自《理想的大学生活，也许永远不会来》）:
- "楼梯间"比喻段落后 → 无尽楼梯概念图
- "两个版本/选择消耗"段落后 → 书桌+亮屏手机（现实 vs vlog）
- "许可/等待外部信号"段落后 → 门前背影（等待一辈子不会来的许可）

### 2. 写 prompt（仅 AI 轨；真实图轨跳过 2-3，直接进第 4 步嵌入）

**先加载风格引擎**：`skill_view(name='andiii-image-style')` — 水彩四件套 + 弹药库（`references/watercolor-prompt-library.md` 按主题取模板填槽）。

每个 prompt 需包含：
- 引擎四段式结构（P1 画布纸感 / P2 隐喻 / P3 文字色彩 / P4 氛围规避）
- 16:9 横构图，prompt 显式锚定横向元素（构图铁律）
- 中文 prompt 更准确；禁止水印
- **必须过质检门**：`python D:/tools/hermes/skills/creative/andiii-image-style/scripts/check_engine_prompt.py`（FAIL/WARN 先改再生成；⚠️ 用 Windows 路径 `D:/...`，MSYS 的 `/d/...` 格式 Windows Python 不认）

文件保存在 `prompts/` 下。

### 3. 生成图片

```bash
cd /d/tools/hermes/skills/baoyu-image-gen/scripts
bun main.ts \
  --prompt "$(prompt text)" \
  --image output.png \
  --ar 16:9 \
  --quality 2k \
  --provider agnes \
  --model agnes-image-2.1-flash
```

Agnes provider 偶尔需重试，设 300s 超时。

### 4. 嵌入 markdown

```markdown
![](./imgs/image.png)
```

**注意**：Markdown 图片语法要求半角括号 `(` `)`，不是中文全角 `（` `）`。

### 5. 重新发布到草稿箱

**关键路径问题**：baoyu-post-to-wechat 的 wechat-api.ts 脚本解析相对路径时，以脚本自身的 cwd 为基准，不是 article.md 的位置。

解决方法：
- 把图片复制到 article.md 同一目录
- 路径用 `./imgs/xxx.png` 格式
- 从脚本目录执行发布命令

```bash
cp /path/to/images/*.png /d/tools/hermes/skills/baoyu-post-to-wechat/scripts/imgs/
cd /d/tools/hermes/skills/baoyu-post-to-wechat/scripts
bun wechat-api.ts article.md \
  --theme grace --color blue \
  --title "标题" --author "Andiii碎碎念" \
  --cover ./imgs/cover.png
```

脚本会自动检测 `![]()` 中的图片引用，上传到微信CDN并插入正文。

## 风格一致性

所有内文配图应与封面保持视觉统一：
- 同一 provider 和 model
- 同一色板（elegant/cool/dark...）
- 同一渲染风格（digital/flat-vector/painterly...）
- 16:9 横版
