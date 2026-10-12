# 阶段④ 配图（Illustration，可选）

> 目标：为文章配封面（双尺寸）+ 内文插图。**先定图源，再定画风。**
> 前提：`config/workflow.yaml` 的 `stages.illustration: true`、图生后端已配置（`image_backends`）、
> 预算上限已设（`image_budget`）。**只算账 / 只出 prompt 不需要 API key。**

## 流程

### Step 0：图源三问（每个意象块独立决策）

列出全文意象块清单，逐块过三问：

1. **本体问**：意象指向的东西现实中存在且读者认得出吗？（某软件/某张专辑/某地标 → 真实图；回忆/情绪/比喻/抽象 → AI 插画）
2. **功能问**：这张图要「证明」还是「营造」？（截图/数据/界面 → 真实图；氛围/情绪 → AI 插画）
3. **素材问**：网上有现成高质量合规真实图吗？（官方图/CC0 图库 → 用真的；找不到或版权不明 → AI 兜底）

一句话原则：**意象本体在现实里 → 真实图；在内心 → AI 图；找得到合规真实图永远优先。**

- 真实图轨 → web_search 找图 → 下载/筛选/归因（图下说明带来源）
- AI 轨 → 继续 Step 1

### Step 1：风格路由

读 `examples/image-engines/` 下的引擎定义，按文章文风选配图风格（如"诗意/散文 → 水彩"）。用户可手动指定。

**封面单独分流**：封面不是一个尺寸，是两件事——公众号头图（2.35:1）和分享卡（1:1）。
两者构图逻辑不同，别拿头图裁成分享卡。详见 `references/cover-design.md`。

### Step 2：设计推理（必做，≤60 秒）

读 `references/design-reasoning.md`，按 6 项模板作答：
① 用途与渠道 ② 受众与气质 ③ 视觉系统 ④ 主次层级 ⑤ 留白决策 ⑥ 方向承诺

### Step 3：四段式编译

```text
P1 画布与纸感: [比例] 全幅[底色], [留白比例]留白, [纸感词]+[纹理词×2]; 主体位置与构图自由
P2 主体隐喻: [主题转译的意象]（[锚点类型]）, [锚点处理]
P3 文字与色彩: 默认无文字; [晕染色1]+[晕染色2] 以[存在形式], [纸缺陷]
P4 氛围与规避: [氛围词], avoid [规避词1]; avoid [规避词2]; ...
```

**规避词必须「avoid X」成串**（`avoid neon glow; avoid 3d render; ...`，每个词前都带 avoid，质检门只认连续相邻）。

### Step 4：质检门

```bash
echo "prompt内容" | python scripts/check_image_prompt.py
```
- FAIL → 改 prompt 直到 PASS；WARN → 尽量消除
- **PASS 才允许调图生后端**

### Step 4.5：实体色板 + 视觉锚（写进 manifest）

两件事都是「让这一批图看起来是一家人」，在立清单前定好：

1. **实体色板（可选）**：全文若有一个反复出现、自带色彩的东西（某张专辑/某款相机/某个界面），
   取 **3 个 hex**（主色 + 辅色 + 中性）写进 manifest 顶层 `palette`。
   没有这样的实体就**不加**，整篇用引擎自带纸底。规则见 `references/image-style-routing.md`「文章实体 → 统一色板」。
2. **视觉锚（可选）**：你以前认可的封面/插图丢进 `examples/image-engines/anchors/`，
   在引擎 yaml 的 `anchor_images` 登记，生成时 `--engine <名>` 自动带上。
   没有锚图就走纯文字 prompt，不影响使用。详见该目录 README。

### Step 5：立清单 → 算账 → 出图（预算层）

**清单之外不生成**——这是"不乱生图"的唯一执行机制。把本轮要出的图列成 manifest（JSON，写入 `generated/manifest.json`）：

```json
{
  "article": "文章标题",
  "palette": ["#3A4A5A", "#C4A484", "#7A6A58"],
  "anchors": ["examples/image-engines/anchors/watercolor-cover-like-01.png"],
  "images": [
    {"id": "cover", "role": "cover", "ratio": "2.35:1", "quality": "high",
     "output": "generated/cover_raw.png", "prompt": "四段式 prompt"},
    {"id": "inline-1", "role": "inline", "ratio": "16:9", "quality": "medium",
     "output": "generated/inline_1_raw.png", "prompt": "四段式 prompt"},
    {"id": "share", "role": "share", "ratio": "1:1", "quality": "medium",
     "output": "generated/share_raw.png", "prompt": "四段式 prompt"}
  ]
}
```

`role` 四选一：`cover`（封面，永不砍）/ `share`（1:1 分享卡）/ `quote-card`（金句卡）/ `inline`（内文图）。
`quality` 省略时按 role 走 `image_budget` 默认档。
`palette` / `anchors` 都可省略；`refs` 给单张图挂实体锚（某张专辑封面等）。

```bash
# 1) 先算账（不调接口、不需要 API key）：张数/尺寸/单价/总额 vs 上限
python scripts/image_batch.py --manifest generated/manifest.json --plan-only

# 2) 超预算 → 调 image_budget 上限，或自动砍次要图（顺序 inline→金句卡→分享卡，封面永不砍）
python scripts/image_batch.py --manifest generated/manifest.json --auto-trim

# 3) 正式出图（并行 + 指数退避重试 + 失败降级不阻塞）
python scripts/image_batch.py --manifest generated/manifest.json --engine watercolor --receipt generated/预算单.md

# 迭代构图时只落 prompt，零成本零等待
python scripts/image_batch.py --manifest generated/manifest.json --prompts-only
```

- **成本纪律**：封面走 high、内文 medium、试稿/金句卡 low（档位间差 35 倍，别乱用 high）
- **后端切换**：只改 `image_backends.default`——agnes（免费）试构图、gpt-image-2 出定稿
- **视觉锚**：`--engine <名>` 读引擎的 `anchor_images`；`--anchors <目录/逗号清单>` 临时换一批
- **失败降级**：失败的图留 `.FAILED.txt`（含 prompt），Run 继续走完，报告标注
- 单张调试仍可直接用 `scripts/generate_image.py --prompt … --quality high --backend gpt-image-2`（加 `--refs a.png` 走参考图）

### Step 6：裁剪

```bash
python scripts/crop_image.py <原图> --ratio 2.35:1 -o cover.jpg    # 公众号头图
python scripts/crop_image.py <原图> --ratio 1:1    -o share.jpg    # 分享卡
python scripts/crop_image.py <原图> --ratio 16:9   -o inline.jpg   # 内文
```

### Step 7：视觉复核 + 用户确认

- 硬检查：主体是否完整未裁切？有无硬雷区（高饱和/霓虹/3D/玻璃拟态）？图内文字是否完整？
- **色板一致性**：多张图的晕染主色调是不是同一族？（有 `palette` 时必查）
- **封面核对**：头图（2.35:1）与分享卡（1:1）是否各成一图、构图都对？（见 `references/cover-design.md`）
- **风格不确定时先出 1 张试水图给用户确认方向，过了再批量**
- 单张连被否 2-3 次后停止猜测，列候选方向让用户选

## 防坑

- ❌ 抽象线条/隐喻构图 → 必须落到可识别的人/物/叙事，抽象隐喻不适合公众号配图
- ❌ 人物"面对面"用纯背影 → 看不出相对关系。用侧面剪影相对（一人面朝左一人面朝右）
- ❌ 一图多焦点 → 每图单一视觉焦点（1:1 分享图尤其）
- ❌ 图内文字乱码（长数字串/英文乱码）→ 微文本要么极小要么 textless
- ❌ 拼贴图同一意象用多张照片碎片 → 一个意象 = 一张主体照片碎片
- ❌ 忽略文风 → 配图风格跟着文风走（意象匹配 > 画风）
- ❌ 每张图各配各的色 → 一篇里多张 AI 图必须共享统一色板（有实体时），否则像三篇不同的文
- ❌ 拿头图裁成分享卡 → 头图 2.35:1 的信息密度放到 1:1 会挤成一条，分享卡要单独构图
- ❌ 塞高饱和/画满的图当视觉锚 → 模型会连雷区一起学，锚图必须是引擎风格最干净的样本
