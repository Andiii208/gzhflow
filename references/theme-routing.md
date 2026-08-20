# 排版主题路由方法论（Theme Routing）

> 阶段⑤ 排版层的方法论。原理：**按文章题材/文风选排版主题**，而不是所有文章同一套排版。
> 你的主题定义在 `examples/themes/*.yaml`，路由表在 `config/themes.yaml`，转换器是 `scripts/md2wechat.py`。

## 路由机制

```
文章题材/文风 → 匹配 config/themes.yaml 的 routing → 主题名
              → 未命中 → default_theme
              → 用户指定 → 直接用
```

## 主题定义结构（examples/themes/<name>.yaml）

```yaml
name: "zen"                    # 主题标识
description: "留白禅意：大面积留白、衬线字体、克制配色"
colors:
  bg: "#ffffff"                # 背景色
  text: "#3f3f3f"              # 正文色（不要纯黑）
  accent: "#8c8c8c"            # 强调色（≤3 种颜色）
  quote_bg: "#f7f7f5"          # 引用块背景
fonts:
  body: "'Songti SC', 'Noto Serif CJK SC', 'SimSun', serif"   # 正文衬线
  heading: "'Noto Serif SC', serif"                            # 标题
layout:
  body_size: "15px"            # 正文字号
  line_height: "1.75"          # 行距（微信默认 1.0 太挤）
  paragraph_margin: "0 0 1em"  # 段间距
  side_margin: "12px"          # 页边距
```

> 签名不在此定义：签名由 `config/workflow.yaml` 的 `signature` 定义、写入 md 正文（见下文「签名约定」），主题文件不含 signature 段。

## 排版通用规范（微信公众号）

| 规范 | 内容 |
|---|---|
| 正文字号 | 15-16px（移动端最佳） |
| 行间距 | 1.75-1.8 倍 |
| 段间距 | 段落之间空一行，不用段前距/段后距 |
| 页边距 | 两端 8-12px |
| 正文颜色 | #3f3f3f 或 #444444（不要纯黑） |
| 强调色 | 不超过 3 种 |
| 段落长度 | 手机阅读每段 ≤5 行（约 70-100 字） |
| 关键句 | 独立成段，一句一行 |
| 加粗 | 关键句和金句，每篇 ≤5 处 |
| 小标题 | 1500 字以上必须用 `##` 分节 |
| 首行缩进 | ❌ 不需要 |

## 图片规范（排版层）

- 封面 `cover.jpg`：2.35:1 ≈ 900×383（必须提供）
- 内文图：16:9 ≈ 900×506，与 HTML 同目录（相对路径，发布层自动上传）
- 图序：正文段落 → 图 → 一行居中说明（`— 一句话说明`）
- 图片标签：`max-width:100%;height:auto;display:block;margin:0 auto`，不用 `width:100%`（小图会糊）

## 签名约定

- 文末收尾：**按文章内容写一句收尾**（4-15 字，与文章呼应、回扣标题/意象；不升华、不鸡汤、不说教）+ 作者签名
- 不用「点赞在看转发三连」类 CTA
- 写砸了（套路感/强行升华）→ 改回固定文案 `我是 <作者>。`

## 质量门

```bash
python scripts/validate_gzh_html.py <输出.html>
```

- **0 ERROR + 半角标点 0 WARN 才放行**
- 交叉核对：md 里的每个 `##` 标题、`>` 金句、`![]` 图片必须全部出现在 HTML（grep 比对）——校验脚本查不出「内容缺失」
