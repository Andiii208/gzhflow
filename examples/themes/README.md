# examples/themes — 排版主题示例说明

本目录放排版主题定义（`.yaml`，纯 YAML：`name` + `colors`/`fonts`/`layout` 三组变量），供 `scripts/md2wechat.py --theme <名>` 读取。

## 主题变量说明

| 变量 | 含义 | 建议 |
|---|---|---|
| colors.bg | 页面背景 | 白/米白 |
| colors.text | 正文色 | #3f3f3f 或 #444（不要纯黑 #000） |
| colors.accent | 强调色（引用条/分割线） | 全主题 ≤3 种颜色 |
| colors.quote_bg | 金句/引用块背景 | 比 bg 深一点点的中性色 |
| fonts.body | 正文字体栈 | 中文衬线优先（iOS 宋体/Android 思源宋体） |
| fonts.heading | 标题字体 | 衬线 |
| layout.body_size | 正文字号 | 15-16px |
| layout.line_height | 行距 | 1.75-1.8（微信默认 1.0 太挤） |
| layout.paragraph_margin | 段间距 | 段落间空一行即可 |
| layout.side_margin | 页边距 | 8-12px |

## 示例主题

- `01-zen-whitespace.yaml` — 留白禅意：衬线字体 + 大面积留白 + 克制配色，适合随笔/情感/深度文章（`--theme zen`）
- `02-minimal.yaml` — 极简理性：无衬线黑体系 + 更紧的行距 + 灰阶强调色 = 理性工具感，适合教程/干货/观点/方法论（`--theme minimal`）

想自定义主题：复制任一文件 → 改名 → 改色值/字体 → 在 `config/themes.yaml` 登记路由。
