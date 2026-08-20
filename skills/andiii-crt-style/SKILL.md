---
name: andiii-crt-style
description: Andiii碎碎念配图风格引擎 — 复古CRT电脑界面插画（早期Macintosh/Minitel/8-bit像素风：无边框像素主体壁纸+悬浮视窗+特征提取窗+扫描线+桶形畸变）。适配自 TaiT-tt/tait-crt-interface-skill（Codex 专属 → 纯文生图版）。适合科技怀旧/极客/游戏/数码回忆/赛博诗意类文章。生成封面、内文配图、金句卡前加载本 skill，过质检门+后处理脚本后再交付。触发词：CRT、复古电脑、像素界面、极客风、科技怀旧、老系统界面。
version: 1.0.0
author: Andiii208 (upstream: TaiT-tt/tait-crt-interface-skill)
license: MIT
tags: [image-generation, crt, retro, pixel-art, style-engine]
related_skills: [wechat-content-automation, andiii-image-style, ai-image-style-engine]
---

# Andiii CRT 复古电脑界面风格引擎 v1.0

适配自 **TaiT-tt/tait-crt-interface-skill**（GitHub，约 77⭐，Codex 图片生成 skill）到 Andiii 公众号工作流：Codex 专属能力（内置 image_gen 吃参考图 + 自带 Pillow 解释器）剥离后，改为**纯文生图 + 后处理脚本兜底**，保留色卡登记、全局像素网格、棋盘格中间调、CRT 信号面、变化引擎五大机制。

**风格定位**：把主题设计成一张"早期 CRT 计算机正在运行的界面"——像素风主体做无边框系统壁纸，悬浮视窗像 80 年代 Macintosh/Minitel 桌面，带扫描线、荧光辉光、边缘桶形畸变。与 zine（干的、拼贴的）和水彩（湿的、晕染的）都不同——CRT 是"电子的、发光的、有网格的"。

## 零、风格是参考，不是限制（用户 2026-08-03 明确，全引擎族通用）

- 默认按本引擎四件套走（保证气质底线），但允许跨风格借用/混搭/偏离（如 CRT 底 + 一处 zine 拼贴、CRT 荧光绿 + 潦草手写字）
- 质检门（质感/雷区底线）仍然生效；**风格本身是软的**
- 目的：以风格激发更多创意，不是按模板死板执行

## 一、色彩引擎（色卡登记，最硬的一层）

**只允许色卡内颜色，禁止色卡外任何颜色、灰阶渐变、抗锯齿**。光学灰/中间调 = 最暗色+最亮色交替棋盘格（成片覆盖主体约 15-35%，不是散点噪声）。

| 色卡名 | 色值 | 气质 |
|---|---|---|
| 经典 | `#dee4e0` `#2e382d` | 双色单显，最复古 |
| 粉黛 | `#f2d1d7` `#7a3f43` | 双色粉调，柔 |
| 极客01 | `#f2fcf6` `#485446` `#07100b` `#13f81f` | 荧光绿黑，最经典 CRT |
| 极客02 | `#e8e5df` `#2ca770` `#0d3d2d` `#3e6a9e` | 米白绿蓝，清爽 |
| 游戏01 | `#e7f5fe` `#7befa4` `#2fd9e7` `#ef9b9b` `#03101b` | 5色游戏机 |
| 游戏02 | `#efca54` `#5d9f58` `#e870a1` `#bbb8a5` `#49473c` | 5色暖调 |
| 自定 | 2-5 色，须含明显亮/暗对比对 | 按主题 |

规则：
- 亮/暗端点 = 色卡中感知亮度最高/最低的两色，只用于底、墨和棋盘格端点
- 其余色 = 平涂点缀（视窗标题栏、面板、图标、信号色），禁止渐变过渡
- 默认无图内大段文字（界面标签除外，见排版引擎）；金句类文字任务仍走排版块（用户惯例）
- 文生图选色卡 → 后处理脚本 `finalize_crt.py --palette` 强制锁色，双保险

## 二、纹理引擎（CRT 信号面）

中英对照质感词（每 prompt ≥2 个 + 1 个畸变词）：

| 中文 | 英文 |
|---|---|
| 扫描线 | dense horizontal scanlines / scan lines |
| 棋盘格中间调 | alternating checkerboard dithering |
| 方形像素网格 | shared square pixel grid / chunky square pixels |
| 荧光辉光 | phosphor glow / palette-bound bloom |
| 噪点 | subtle noise / grain |
| 信号干扰 | signal interference / glitch |
| 桶形畸变 | barrel distortion / curved screen edges |
| 残像 | persistence / ghosting |
| 套印错位 | misregistration / color fringing |
| 同步抖动 | sync fault / row jitter |

**畸变是风格本体不是可选项**：外 10% 四边径向桶形弯曲（角比边心压缩更强），内 80% 稳定。模型画不出时由脚本 `--edge-warp 0.12` 兜底。

## 三、排版引擎（界面语言，CRT 风格的核心差异点）

与其他引擎"默认无文字"不同，**界面元素就是风格本体**——但文字是"界面标签"不是"图内标题"：

- 3-6 个悬浮视窗：方形边框、标题栏、关闭格、滚动条、菜单栏 + 一个展开的下拉菜单、一个小光标
- 1-3 个**特征提取窗**（局部特写：五官/饰品/手/物件细节），互相尺寸和比例都不同；绝不放整个主体
- 位图短标签：法文/英文短词（FICHIER / TERMINAL / DIAGNOSTIC / EXTRAIT…），5x7 位图字形感
- 无边框主体壁纸占画面 60-80%（≥50%），视窗悬浮其上；主体不重复出现
- 所有元素（主体/视窗/边框/文字/图标）共用同一个方形像素网格

## 四、规避清单

**硬规避（FAIL）**：gradient / anti-aliasing / photorealistic / realistic rendering / 3D render / glassmorphism / modern flat UI / glossy / smooth curves / 色卡外颜色（vivid / saturated / neon 等超出色卡的描述）/ 物理显示器外壳（monitor bezel、房间）/ 主体重复出现 / 主体被框进窗口
**软规避（WARN）**：drop shadow / bokeh / soft lighting / stock photo / high saturation / clean vector export

## 五、四段式编译模板（适配 Wan2.7 纯文生图）

```text
P1 画布与网格: [1:1|16:9|9:16] 全幅[底色调] CRT 屏幕内容(无显示器外壳), 全局方形像素网格(短边/384), 主体位置与构图自由
P2 主体隐喻: [主题转译意象]（[锚点类型]）, 块状卡通化 + [2-3 处夸张：大脑袋/粗肢体/夸张配件], 占画面 60-80%
P3 界面与色彩: [3-6] 个悬浮视窗(大小层级分明+多象限分布+一个展开下拉菜单), [1-3] 个特征提取窗(局部特写,尺寸比例各异), 严格[色卡名]色卡[色数]色, 中间调用最暗+最亮色交替棋盘格
P4 CRT 信号与规避: [情绪词], 密集扫描线+[噪点/荧光辉光/信号干扰], 四周外 10% 桶形畸变, 避免[硬规避项]
```

> P2 隐喻是唯一自由发挥点；P3 必须写色卡名（让模型锁定配色）；比例受后端限制（Wan2.7 只出 1:1/16:9/9:16，需要 4:3/3:4 时生成后裁剪）。

## 六、变化引擎（防雷同轴表）

每轴选一项，连续出图至少改 2 个高影响轴：

| 轴 | 选项 |
|---|---|
| 主体位置 | 左墙 / 右墙 / 上部 / 下部 / 对角 |
| 主体覆盖率 | 60% / 70% / 80% |
| 视窗数量 | 3 / 4 / 5 / 6 |
| 视窗星座 | 对角 / 不对称L / 锯齿级联 / 环绕 / 角落爆发 |
| 主应用 | 终端 / 文件 / 表格 / 图表 / 警告 / 设置 |
| 特征提取 | 1 个 / 2 个不等 / 3 个递减 |
| 极性 | 亮场 / 暗场 / 局部明暗 |
| 信号强调 | 残像 / 行抖动 / 同步带 / 边缘噪点 / 套印错位 |

## 七、工作流

0. **设计推理（必做，≤60秒）**：读 `../ai-image-style-engine/references/design-reasoning.md`（Hermes 注入副本；仓库权威源为顶层 `references/design-reasoning.md`），按 6 项模板作答（用途渠道/受众气质/视觉系统/主次层级/留白决策/方向承诺）——先定「为什么这么画」，再动手编译
1. 定色卡：主题气质匹配（科技/极客 → 极客01 或 02；怀旧温柔 → 经典/粉黛；游戏/热闹 → 游戏01/02；主题特殊 → 自定 2-5 色）；用户指定优先
2. 转译主题 → 选变体配方（变化引擎 8 轴各一）
3. 按四段式编译 prompt（P2 隐喻自由发挥，不写场景堆砌）
4. **质检门**：`python D:/tools/hermes/skills/creative/andiii-crt-style/scripts/check_crt_prompt.py`（CRT 专用门：像素网格+CRT纹理词+畸变词必备，纸感词不适用不走通用门），PASS 才生成
5. **生成**：image_generate（Wan2.7，1:1 或 16:9；封面 16:9 生成后 `crop_image.py --ratio 2.35:1` 裁首图）
6. **后处理兜底**（必做）：`python scripts/finalize_crt.py --input <gen> --output <final> --palette <色卡hex,逗号分隔> --polarity positive|negative|preserve --grid-cell 0 --edge-warp 0.12`——强制色卡锁色 + 网格量化 + 桶形畸变（模型漏色/漏畸变时靠它救场）
7. **视觉复核**（MiMo 固定问句）：主体完整未裁切 / 无硬雷区 / 扫描线+畸变+像素感明显 / 色卡外颜色是否残留；封面裁后必复核
8. 交用户最终确认（审美以用户为准）

## 八、后处理脚本说明

`scripts/finalize_crt.py`（适配自上游，MIT）：
- 机制：按 Rec.709 亮度取色卡端点 → 像素投影量化回色卡 → 中间调用亮暗棋盘格 → 短边/384 网格对齐 → 外 10% 径向桶形畸变 → 扫描线
- 与上游差异：**默认不画署名**（公众号配图不带第三方品牌标识）；如需署名 `--signature <text>`（支持小写字母 a-z 与连字符，5x7 位图字体）
- 运行环境：**用系统 python**（Hermes venv 的 PIL 坏过，`python -c "import PIL"` 探测；Windows 下用 `py -3`）
- 输出必 PNG（保色）；禁止覆盖源文件

## 九、质量底线（自检清单）

- [ ] 色卡内颜色严格锁定，无杂色/渐变/抗锯齿；中间调是成片棋盘格
- [ ] 单一主体壁纸占 60-80%，无边框、不重复、不被框进窗口
- [ ] 3-6 视窗 + 1-3 特征提取窗，大小层级分明，多象限分布
- [ ] 所有元素共用同一像素网格（无"主体像素比 UI 粗"破绽）
- [ ] 外 10% 桶形畸变明显、内 80% 稳定
- [ ] 无物理显示器外壳/房间/现代 UI 元素
- [ ] 后处理已跑：输出色数 == 色卡色数，分辨率未变

## 上游署名

- 本引擎适配自 [TaiT-tt/tait-crt-interface-skill](https://github.com/TaiT-tt/tait-crt-interface-skill)（MIT 风格开源，约 77⭐）
- 上游完整拆解存档：`references/tait-crt-interface.md`（色卡/14 轴变化引擎/质量门槛全文）
- 核心机制保留：色卡登记、全局像素网格、棋盘格中间调、CRT 信号面、后处理兜底；剥离：Codex 内置图生图依赖、强制第三方署名
