# 获取公众号 __biz 的两种方式

## 方式一：通过浏览器提取（MCP不可用时）

当 you 只有一篇公众号文章 URL，且 wechatDownload MCP 无法直接获取账号信息时：

1. 用 `browser_navigate` 打开文章 URL
2. 在浏览器控制台运行：
   ```js
   document.documentElement.innerHTML.match(/biz:\s*"([^"]+)"/)?.[1]
   ```
3. 返回的结果就是该公众号的 `__biz` 参数（base64编码）

### 示例

| 公众号 | __biz |
|--------|-------|
| 我要WhatYouNeed | MzA3NDYwNzI0NA== |
| 杂乱无章 | MzA3OTY5NTUwNQ== |
| L先生说 | MzAxNTY0NjEzNg== |
| 新世相 | MzI2OTA3MTA5Mg== |

## 方式二：通过文章URL提取

完整格式的 URL 中通常包含 `__biz` 参数：
```
https://mp.weixin.qq.com/s?__biz=MzA3NDYwNzI0NA==&mid=xxx&idx=1&sn=xxx
```

但微信公众号的短链接（`https://mp.weixin.qq.com/s/xxxx`）不包含 `__biz`，需要用方式一。

## 获取到 __biz 之后的用途

- 构造合集页面 URL：`https://mp.weixin.qq.com/mp/appmsgalbum?__biz={BIZ}&action=getalbum&album_id={ID}`
- 但需要知道具体的 `album_id`，目前无法自动获取
- 单篇文章拉取仍然是最可靠的方式（MCP工具 `wechat`）
