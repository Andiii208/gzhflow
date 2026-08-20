# 网易云音乐热评抓取（老版 API，免登录）

> 2026-08-04 陶喆 top3 推文实测。适用：音乐/歌曲类公众号文章需要「真实热评」作正文主体时（用户 2026-08-04 确认的方向：**少个人思考，引用+解读热评，走文艺风**）。

## 为什么不用网页

`music.163.com/song?id=xxx` 网页版评论**需登录**（「登录后查看精彩评论」，4019 条评论可见数量但内容为空）。老版 API 免登录直取，curl 即可。

## 1) 搜歌曲 ID（song id）

歌名需 URL 编码：

```bash
curl -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  -H "Referer: https://music.163.com/" \
  "https://music.163.com/api/search/get?s=%E9%A3%9E%E6%9C%BA%E5%9C%BA%E7%9A%8410%3A30&type=1&limit=5" \
  | python -c "
import json,sys
d=json.load(sys.stdin)
for s in d.get('result',{}).get('songs',[])[:5]:
    print(s.get('id'),'|',s.get('name'),'|',s.get('album',{}).get('name',''))
"
```

⚠️ 同名 Live 版很多——按 album 名甄别 **studio 版**（如《飞机场的10:30》→ 150651 属《David Tao》1997；150450/150404 是 Soul Power / Power of Live 现场版）。

## 2) 拉热评（hotComments，含点赞数）

```bash
curl -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  -H "Referer: https://music.163.com/" \
  "https://music.163.com/api/v1/resource/comments/R_SO_4_150651?limit=30&offset=0" \
  | python -c "
import json,sys
d=json.load(sys.stdin)
print('total:', d.get('total'))
for c in d.get('hotComments',[])[:15]:
    print(f\"[{c.get('likedCount',0)}赞] {c.get('user',{}).get('nickname','匿名')}: {c.get('content','')[:140]}\")
"
```

- 字段：`hotComments[].content` / `.likedCount` / `.user.nickname`；`total` = 总评论数
- `limit` 可调大（30-100）
- 已实测 ID：《天天》150518、《讨厌红楼梦》150560、《飞机场的10:30》150651（均秒回，无需 token）

## 3) 引用纪律（用户逐项核对）

- 热评是**真实用户言论**——引用时标注来源（「网易云音乐热评」），不得改写成自己/用户的话
- 高赞评论是最好的章节钩子（如《讨厌红楼梦》171402 赞的「曹雪芹：讨厌陶喆」，五个字开一章）
- 知乎讨论可作补充（「如何评价《飞机场的10:30》中的歌词，剩一点可乐给你」类问答），zhihu 页面 web_extract 常被 block，用 web_search 摘要即可
- 引用歌词原句同样必须核实一字不差（见 music-article-workflow.md §1）

---

## 附：结构模板 v2 已并入 music-article-workflow.md

> ✅ 2026-08-04 已合并：结构模板 v2（真实热评为主体）+ 写法雷区（少个人思考/学音评风格/「第一首歌」歧义/删工整对仗句）现收录于 `music-article-workflow.md` §4 / §5。本文件只保留热评抓取 API 部分。
