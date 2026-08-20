# 微信公众号文章采集指南 — 风格分析用

> 目标：为文风蒸馏收集目标公众号的原始文章。适用于 style-reference-accounts.md 中未收录的号，或需要补充样文时。

---

## 核心限制

- **mp.weixin.qq.com 链接被 web_extract 拦截** — 不要重复尝试 web_extract，它永远返回空/blocked
- **浏览器工具可以访问** — 用 `browser_navigate` + `browser_snapshot(full=true)` 获取页面内容
- **许多高流量公众号的文章不公开转载** — 搜索引擎几乎找不到大号的文章链接

---

## 采集流程

### 第一步：定位文章 URL

**方法 A：搜索播客 show notes（最高效）**
大号作者经常上播客，播客介绍页会列出其代表作链接：
```
web_search(query='"公众号名称" 播客')
```
✅ 新世相 — 通过 Apple Podcast《日谈公园》show notes 找到 URL
✅ 新世相 — 通过 Apple Podcast《随机波动》show notes 找到 URL

**方法 B：搜学术/媒体文章引用**
有些学术文章或新闻报道会引用大号文章作为参考文献：
```
web_search(query='"新世相" mp.weixin.qq.com/s 独居')
```
命中率中等偏低。

**方法 C：用户从手机微信分享（最可靠）**
对完全没有公开链接的号（绝大多数），最可靠的方式是用户从手机微信打开一篇该号文章 → 右上角「…」→ 复制链接 → 发过来。

### 第二步：获取文章内容

**额外技巧：提取公众号 __biz（账号唯一标识）**

从任意一篇该号的文章页面可用 browser_console 提取 `__biz`：
```
document.documentElement.innerHTML.match(/biz:\s*"([^"]+)"/)?.[1]
```
返回的 base64 字符串（如 `MzA3NDYwNzI0NA==`）是该号唯一标识。可用来构造合集 URL，但不能替代桌面 GUI 的密钥批量下载。

---

**成功路径 A：远程 MCP 单篇下载（推荐，即开即用）**
```
mcp__wechat_download_mcp__wechat(url="https://mp.weixin.qq.com/s/XXXXX", config={"MD": true})
```
✅ 已验证：远程 `https://changfengbox.top/api/mcp` 的 `wechat` 工具可下载单篇文章，返回 MD 文件 URL。

**成功路径 B：本地桌面端批量下载（适合大批量）**
1. 运行 `D:\tools\wechatDownload\微信公众号批量下载工具4.6.exe`
2. 粘贴 URL → 获取公众号 ID
3. 电脑微信打开链接 → 获取密钥
4. 批量下载全部历史文章 → 选 MD 格式

**成功路径 C：浏览器工具（无工具时的备选）**
```
browser_navigate(url="https://mp.weixin.qq.com/s/XXXXX")
browser_snapshot(full=true)
```
浏览器可绕过 web_extract 限制。snapshot 返回结构化文本。

**失败路径（不要浪费时间）**
- web_extract 对 mp.weixin.qq.com → 永远被拦截
- curl/wget 对 mp.weixin.qq.com → 需要微信 Cookie
- 搜索 `site:mp.weixin.qq.com "公众号名"` → 微信文章极少被索引

### 第三步：保存格式

```markdown
---
title: "文章标题"
author: "作者名"
source: "公众号名称 (微信公众号)"
date: "YYYY年M月D日 HH:MM"
url: "https://mp.weixin.qq.com/s/XXXXX"
---

# 文章标题

> 副标题/引言

正文内容...

---

> 公众号签名

*公众号名称 — 简介*
```

---

## 已实操案例

### ✅ MorningRocks（实际公众号名：雨雪霏霏1015）
- **注意**：实际公众号名是「雨雪霏霏1015」，作者自称「雨雪霏霏」。老读者称其为 MorningRocks / 星玫。
- **可访问性**：✅ **通过 wechatDownload 桌面端批量下载成功**。11 篇纯文字可读，非长图。
- **已获取文章**：11 篇（书评/影评/随笔/AI/唐诗解读等），纯文字可读，非长图
- **URL 示例**：`https://mp.weixin.qq.com/s/XAhD-uJKQ0yL-O5rVHjUiQ`
- **批量下载方式**：wechatDownload 桌面端 → 获取密钥 → 批量拉取 → 输出 MD/HTML/PDF
- **辅助信息源**：即刻 @星玫、播客《脑袋空空 empty mind》第39期
- **其他渠道**：网站 morning.rocks、小红书/微博 @MorningRocks

### ✅ 新世相（单篇测试）
- **URL**：`https://mp.weixin.qq.com/s/Cf8XHio2ovitAmQpwtGW6Q`（《决定独居前，一定要想清楚这10个问题》）
- **获取方式**：Apple Podcast show notes → 远程 MCP `wechat` 工具 → 成功下载 MD
- **状态**：✅ 远程 MCP 单篇下载成功。批量下载需用户提供更多链接。
- **__biz**：`MzI2OTA3MTA5Mg==`（从文章页面提取）

### ✅ 我要WhatYouNeed（单篇测试）
- **样例文章**：《其实，塑料杯咖啡才是打工人的「阿贝贝」》（2026-07-10）
- **获取方式**：用户分享链接 → 远程 MCP → 成功下载
- **__biz**：`MzA3NDYwNzI0NA==`

### ✅ 杂乱无章（单篇测试）
- **样例文章**：《从头来过的勇气》（作者张荆棘）
- **__biz**：`MzA3OTY5NTUwNQ==`

### ✅ L先生说（单篇测试）
- **样例文章**：《总是忍不住玩手机？真正有效的解决方法》（作者李睿秋Lachel）
- **__biz**：`MzAxNTY0NjEzNg==`

### ❌ 海听 / 酒鬼诗人（已移除）
- 经用户实地核实，这两个号是低流量营销号，非真正的个人随笔号
- 已从参考库中移除。不需要再采集。

---

## 微信公众号文章批量下载工具

### 🥇 qiye45/wechatDownload（推荐，支持 MCP）

**Star:** ⭐ 8.5k | **仓库:** https://github.com/qiye45/wechatDownload
**已安装位置:** `D:\\tools\\wechatDownload\\`（v4.6）
**支持平台:** Windows / MacOS

**特点：**
- 桌面端 GUI，一键批量下载
- 导出格式：HTML / MD / PDF / Word / MHTML / CSV
- **支持 MCP** — 远程 `wechat`（单篇）/ `wechat_collection`（合集），本地 `batch_download_articles`
- ⚠️ **长图文章只能下载到图片**，需 vision_analyze OCR

**远程 MCP（即开即用）：**
```
hermes mcp add "wechat-download-mcp" --url "https://changfengbox.top/api/mcp"
```

**本地 MCP（与远程工具一致）：**
- 端口：`http://127.0.0.1:4545/mcp`
- 需运行桌面端并勾选「启动MCP」
- ⚠️ 本地 MCP 暴露的工具与远程相同：仅 `wechat`（单篇）和 `wechat_collection`（合集）。无 `batch_download_articles` 工具。

**批量下载流程（必须走桌面 GUI）：**
1. 运行桌面 exe → 粘贴 URL → 获取公众号 ID
2. 电脑微信打开链接 → 获取密钥
3. 批量下载 → 选 MD 格式

### 🥈 wechat-article-exporter（在线版）

**在线使用:** https://down.mptext.top
- ⚠️ 需要有公众号作为搜索入口
- ⚠️ 不支持 MCP

### 长图文章处理

```
工具下载长图 → vision_analyze OCR → 保存为 Markdown
```

### 选择建议

| 场景 | 工具 |
|------|------|
| 看一篇风格 | 远程 MCP `wechat` |
| 批量下载整个号 | wechatDownload 桌面端 |
| 长图文章 | 下载后 vision_analyze OCR |

---

## Pitfalls

- ❌ **不要尝试 web_extract 对 mp.weixin.qq.com** — 永远失败
- ❌ **不要认为大号文章可被搜索引擎找到** — 新世相/夜听/蕊希等几乎不被索引
- ❌ **MCP 无法全量批量拉取整个账号** — `wechat` 仅单篇，`wechat_collection` 需具体合集 URL。全量批量必须走桌面 GUI + 电脑微信密钥
- ✅ **文风分析不需要全量** — 每个号 4-6 篇代表性样文足够提取风格特征。不必为"全量"卡住进度
- ✅ **播客 show notes 是找大号文章 URL 的最佳渠道**
- ✅ **先远程 MCP 单篇测试风格，值得分析再走桌面端批量**
- ✅ **`browser_console` 可提取 __biz** — `document.documentElement.innerHTML.match(/biz:\s*"([^"]+)"/)?.[1]`
- ⚠️ **浏览器 snapshot 可能丢图** — 文字内容完整
- ⚠️ **部分文章有留言区** — 如需分析互动模式需截图