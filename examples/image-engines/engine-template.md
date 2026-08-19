# 配图风格引擎模板（Engine Template）

> 复制本文件为 `examples/image-engines/<你的引擎名>.yaml`，逐项填写，然后在配图阶段按文风路由选用。
> 引擎 = 四件套（色彩/纹理/排版/规避）+ 质检门（check_image_prompt.py）。换风格只换引擎文件，管线不动。

```yaml
# 引擎名（唯一标识，路由引用）
name: "你的引擎名"

# 一句话描述（配图阶段据此判断是否适合当前文章）
description: "一句话：这是什么风格、适合什么内容"

# ── 一、色彩引擎 ──
color:
  base: "基底色描述（如：暖米色纸系，占画面 55%-75%）"
  accents: ["晕染色1", "晕染色2", "晕染色3"]   # 1-2 个主色即可
  ink: "墨色描述（如：深灰暖棕，不用纯黑）"
  forbidden: ["flat vector", "neon glow"]     # 禁用词（prompt 里禁止出现）

# ── 二、纹理引擎 ──
# 每个 prompt 必须包含 ≥2 个纹理词 + 1 个纸感词（质检门硬性要求）
texture:
  paper: ["cold-pressed paper texture", "aged paper"]   # 纸感词（必选其一）
  effects: ["wet-on-wet blooms", "visible brush strokes", "granulating pigments"]  # 纹理词

# ── 三、排版引擎（可选文字规则）──
typography:
  default: "无文字"        # 默认策略：封面纯意象无文字（标题由平台显示）
  max_title: "10字"        # 图内文字上限
  font: "handwritten Chinese calligraphy"   # 字体方向

# ── 四、规避清单 ──
layout:
  hard: ["玻璃拟态", "渐变紫", "霓虹", "3D渲染", "日系动漫脸", "高饱和色块"]   # 命中即 FAIL
  soft: ["high saturation", "gradient", "drop shadow", "bokeh"]              # 命中即 WARN
```

## 使用方式

1. 保存为 `examples/image-engines/<name>.yaml`
2. 配图阶段：文风路由 → 选引擎 → 读本文件四件套 → 设计推理 6 项 → 四段式编译 → 质检门 → 生成

## 四段式编译（配图阶段用）

```text
P1 画布与纸感: [比例 16:9/1:1] 全幅[纸色]底, [留白比例]留白, [纸感词]+[纹理词×2]; 主体位置与构图自由
P2 主体隐喻: [主题转译的意象]（[锚点类型]）, [锚点处理: 边缘渗开/洗淡/纸感/笔触]
P3 文字与色彩: 默认无文字; 仅封面带字时填 [文字, 字体, 位置], [晕染色] 以[湿画法/晕染带]存在
P4 氛围与规避: [氛围词], avoid [规避词1]; avoid [规避词2]; ...
```

> ⚠️ 规避词必须「avoid X」成串（每个词前都带 avoid，质检门只认连续相邻）。
