# 阶段⑤ 排版（Layout）

> 目标：把定稿 Markdown 转成「可直接粘贴进公众号编辑器、粘贴后样式不丢失」的 HTML。
> 工具：`scripts/md2wechat.py`（自研轻量转换器）+ `scripts/validate_gzh_html.py`（校验门）。

## 流程

### Step 1：主题路由

读 `config/themes.yaml`，按文章题材/文风选主题：

| 题材 | 推荐主题 |
|---|---|
| 日常/随笔/情感 | zen（留白禅意） |
| 教程/干货/盘点/知识 | minimal（极简理性） |
| 观点/深度/分析 | zen |

- 用户已指定主题 → 直接用
- 主题定义在 `examples/themes/*.yaml`（复制改色值即可自定义，然后在 config 登记路由）

### Step 2：转换

```bash
python scripts/md2wechat.py <draft.md> --theme <主题名> -o <输出.html>
```

- 自动处理：标题/章节/加粗/引用/图片/代码块/列表/分割线
- 输出为内联样式 HTML，文本用 `span leaf` 包裹（微信粘贴后样式保留的关键）
- 主题变量（色值/字体/组件样式）从 `examples/themes/<主题>.yaml` 读取

### Step 3：校验（强制）

```bash
python scripts/validate_gzh_html.py <输出.html>
```

- **0 ERROR + 半角标点 0 WARN 才放行**
- ERROR 项：标签不平衡 / 禁用标签（div 等）/ 嵌套错误
- WARN 项：半角标点（中文语境下应为全角）

### Step 4：交叉核对（内容完整性）

md 里的每个 `##` 标题、`>` 金句、`![]` 图片必须全部出现在 HTML 中：

```bash
grep -n "金句关键词" <输出.html>
```

- 校验脚本查不出「内容缺失」，只有 grep 比对能抓到
- 遗漏 → 修正后重跑校验

### Step 5：交付

- 产物命名：`{标题}_排版_{主题}.html`
- 可选生成 `_预览.html`（浏览器打开人工检查）
- 图片必须与 HTML 同目录（相对路径），发布层自动上传

## 防坑

- ❌ 手写 HTML → 一律用 md2wechat.py + 主题定义，不要凭记忆手写组件
- ❌ 装配后不去标签间空白 → span 之间换行/缩进渲染成空格，`justify` 下被拉伸。用 `re.sub(r'>\s+<','><',html)` 处理
- ❌ 把组件写进正文中间 → 图片/引用块插在段落结尾 `</span></p>` 之后，别插进 span 内部
- ❌ 中文引号归一化误伤属性 → 只动文本节点，勿 `html.replace('"','“')` 全局替换（会把 style/src 属性也换坏）
- ⚠️ 封面图必须提供（`--cover`），无封面推送报错
- ⚠️ 图片统一 .jpg 扩展名（PIL 存 JPEG 命名 .png 会触发 Format mismatch）
