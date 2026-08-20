# 网易云歌单全量提取 + 口味分析（免登录）

> 2026-08-05「ooccean-喜欢的音乐」1301 首歌单推文实战沉淀。适用：用户甩一个网易云歌单链接让写「歌单/听歌」类推文时，先把歌单全量数据拉下来做口味分析，再动笔。与 netease-hot-comments.md（单曲热评）互补：那是 song 级，这是 playlist 级。

## 为什么不能直接读歌单页

- 网页版 `music.163.com/m/playlist?id=xxx` 是 JS 渲染，web_extract 拿不到完整列表
- `/api/v6/playlist/detail?id=xxx&n=1000&s=0` 未登录时 **tracks 只回 6 首**（`n` 参数无效，别调 `n`）——但响应里的 `playlist.trackIds` 数组是**完整的**（实测 1301/1301）

## 拉全量三步

### 1) 拿歌单元数据 + 完整 trackIds

```bash
curl -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" \
  -H "Referer: https://music.163.com/" \
  "https://music.163.com/api/v6/playlist/detail?id={PLAYLIST_ID}" -o pl.json
```

- `playlist.trackCount` = 总曲数（可能比歌单页显示少几首：1306→1301，下架曲目）
- `playlist.trackIds[]` = 全部曲目 ID，**数组顺序即歌单添加顺序**（`ordered=true` 时，头部=最早加入，尾部=最近加入）
- `playlist.createTime` = 建歌单时间戳（ms）——文章的时间线锚点
- 大歌单（1000+）可只拉这一步看规模，再决定要不要全量

### 2) 按 trackIds 批量取歌曲详情，每批 100 首

```python
import json, urllib.request, urllib.parse, time

d = json.load(open('pl.json', encoding='utf-8'))
track_ids = [t['id'] for t in d['playlist']['trackIds']]

UA = {'User-Agent': 'Mozilla/5.0 ...', 'Referer': 'https://music.163.com/'}
all_tracks = []
BATCH = 100   # ⚠️ 500/批 返回 0 首；100/批 实测稳定（1301 首 13 批全成功）
for i in range(0, len(track_ids), BATCH):
    batch = track_ids[i:i+BATCH]
    c = json.dumps([{"id": x} for x in batch], separators=(',', ':'))
    url = "https://music.163.com/api/v3/song/detail?c=" + urllib.parse.quote(c)
    # 失败重试 3 次（urllib.error.HTTPError/URLError），批间 sleep 0.5-1s
    all_tracks.extend(json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read())['songs'])
```

- 备选老接口：`/api/song/detail?ids=[...]`（URL 编码 JSON 数组，同样按 id 批量）
- 单曲查询 `{"id":150566}` 实测秒回——批量被拒是**数量问题不是鉴权问题**
- 失败的最后一批可能只回 1 首（正常，别当 bug 重试刷屏）

### 3) 口味分析（写文素材）

```python
from collections import Counter
artist_cnt = Counter()
for t in tracks:
    for ar in t.get('ar', []):
        artist_cnt[ar['name']] += 1
# 年份分布: t['publishTime']（ms）→ datetime.fromtimestamp(pt/1000).year
# 添加顺序 = trackIds 顺序: 前 15 首=歌单起点, 后 20 首=最近加入
```

## 已有实测结论（可复用作判断依据）

- 🔴 **「第一首」指代陷阱（用户爆粗纠正）**：API trackIds 排第一 ≠ 用户口中「歌单第一首」。本案 My Anata 排第一，被写成「歌单第一首」遭纠正：「陶喆的第一首是anata，谁他妈跟你说所有的第一首是啊」——那是**听陶喆的第一首**（入坑起点），不是歌单第一首。trackIds 顺序只能当「数据层面头部」，写进文章前必须确认用户指代（歌单 vs 某歌手的歌）；不确定写「从 My Anata 开始——那是听他的第一首」这类安全表述
- **全专辑覆盖 + Live 版成排 = 死忠特征**：某歌手 87 首且含一整排 Soul Power Live 现场版，是「真·死忠」而非路人收藏
- **尾部最近加入 vs 年份分布结合读**：尾部收的是 2017–2018 老歌（消愁/成都/年少有为）→ 能读出「回头补课」行为
- **歌手梯队分层**：Top1 断崖领先（87 首）→ 第二梯队（45）→ 第三梯队（20±）→ 口味底色从梯队风格就能定（本案：华语 R&B/Soul 主线 + 欧美流行/独立乐队外层）
