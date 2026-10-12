# examples/themes — 排版主题定义

本目录放排版主题（`.yaml`，纯 YAML：`name` + `colors`/`fonts`/`layout` 三组变量 + 可选 `underline_css`），
供 `scripts/md2wechat.py --theme <名>` 读取渲染。

> **两套主题机制，色值必须同源**：
> - `examples/themes/*.yaml`（本目录）= 轻量主题，给 `md2wechat.py` **自动渲染**用
> - `skills/gzh-design/references/theme-*.md` = 完整组件库（引言卡/章节卡/签名区等），**手工装配**用
> - 色值与下划线的**单一权威来源**是 `skills/gzh-design/references/theme-index.md`，两边必须一致

## 主题变量说明

| 变量 | 含义 | 建议 |
|---|---|---|
| colors.bg | 页面背景 | 白/米白 |
| colors.text | 正文色 | #3f3f3f 或 #444（不要纯黑 #000） |
| colors.accent | 强调色（引用条/分割线/章节编号） | 全主题 ≤3 种颜色 |
| colors.quote_bg | 金句/引用块背景 | 比 bg 深一点点的中性色 |
| colors.underline | 关键词下划线色 | 取 theme-index.md「正文下划线 CSS」列里的颜色 |
| fonts.body / fonts.heading | 字体栈 | 衬线（随笔/内刊）或黑体（教程/观点） |
| layout.* | 字号/行距/段距/页边距 | 正文 15-16px，行距 1.7-1.8 |
| underline_css（可选） | 覆盖下划线完整 CSS | 各主题线宽/字重不同时用（如禅意风 1.5px + 500） |

## 可用主题（2026-10-12 补齐到 10 套）

| 文件 | 主题名 | 适合 |
|---|---|---|
| `01-zen-whitespace.yaml` | `zen` | 随笔/情感/深度文章（留白禅意） |
| `02-minimal.yaml` | `minimal` | 教程/干货/观点（极简理性，gzhflow 示例主题） |
| `03-moyu-green.yaml` | `moyu-green` | 教程/测评/清单/工具盘点（信息密度高） |
| `04-red-white.yaml` | `red-white` | 深度分析/观点/力量感（经典编辑风） |
| `05-graphite-minimal.yaml` | `graphite-minimal` | 设计/科技评论/专业观点（全灰阶） |
| `06-moyu-ticket.yaml` | `moyu-ticket` | 测评/工具对比（票据隐喻） |
| `07-olive-journal.yaml` | `olive-journal` | 内刊手记/深度评测/案例复盘（暖纸底） |
| `08-newyorker-editorial.yaml` | `newyorker-editorial` | 思辨观点/评论/深度随笔（衬线标题 + 单色砖橙 + 大留白；配图搭黑白线稿引擎） |
| `09-sspai.yaml` | `sspai` | 数码生活/效率工具/产品体验（暖白底 + 砖红点缀） |
| `10-mist-blue.yaml` | `mist-blue` | 设计/产品/技术解读/冷静叙事（浅雾蓝底，主题库唯一冷色系） |

> 后三套（08–10）有轻量 yaml、暂无独立组件库：`--enhance` 自动路径完整可用，手工装配时沿用同色系主题的组件库即可。

## 用法

```bash
# 基础转换
python scripts/md2wechat.py draft.md --theme red-white -o out.html

# 增强：章节自动编号 01/02/…（末章结语用 ∞）、文首引言卡、尾部签名区
python scripts/md2wechat.py draft.md --theme red-white --enhance

# 关键词下划线：Agent 挑好要点后传入；也可直接在稿里写 ==词== 或 ++词++
python scripts/md2wechat.py draft.md --theme red-white --enhance --underline "具体,确定性"
```

## 新增主题

复制任一文件 → 改名 → 改色值 → 在 `config/themes.yaml` 登记路由 →
**同时**在 `skills/gzh-design/references/theme-index.md` 登记（保持两套同源）。

## 已知坑（2026-10-12）

行尾注释现已正确剥除（`accent: "#4A5D52"  # 说明` 不再污染 CSS），
但**仍建议注释单独占一行**——早期版本会把注释整段当成色值，把 `style` 属性的引号截断。
`validate_gzh_html.py` 新增了「style 属性被引号截断」检查专门抓这类问题。
