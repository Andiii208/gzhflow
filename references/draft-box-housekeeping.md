# 草稿箱运维（draft box housekeeping）

> 2026-08-05 信息爆炸史推送后检查实测。

## 核心事实

- wechat-api.ts 每次推**新**草稿（新 media_id），旧草稿不会自动删除 → 草稿箱堆积。
- **重推删旧稿只覆盖本次文章的旧版**：其他会话推过的文章旧版（同标题重复多份 + 测试稿）会长期累积。实测草稿箱 11 份里 10 份是历史遗留（旅游×2、最好的夏天×3、测试推送×1 等）。
- 清理历史草稿是用户的决定：先列清单给用户，**不擅自删**。

## 检查/验证命令（draft/batchget）

```python
import re, urllib.request, json
env = open(r'C:\Users\26895\.baoyu-skills\.env', encoding='utf-8').read()
appid = re.search(r'WECHAT_APP_ID\s*=\s*(\S+)', env).group(1)
secret = re.search(r'WECHAT_APP_SECRET\s*=\s*(\S+)', env).group(1)
tok = json.loads(urllib.request.urlopen(
    f'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}'
).read())['access_token']

# 列表（no_content=1 轻量）：total_count + 每份 media_id/标题/update_time
data = json.dumps({'offset': 0, 'count': 20, 'no_content': 1}).encode()
req = urllib.request.Request(f'https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token={tok}',
                             data=data, headers={'Content-Type': 'application/json'})
r = json.loads(urllib.request.urlopen(req).read())
for it in r['item']:
    ni = it['content']['news_item'][0]
    print(it['media_id'][:20], ni['title'], it['update_time'])

# 完整验证（no_content=0）：正文 mmbiz 图数 + 关键文本 + 封面
data = json.dumps({'offset': 0, 'count': 1, 'no_content': 0}).encode()
# ... content 字段里 re.findall(r'https://mmbiz[^"\s]+', c) 数正文图
```

## 封面判断（防误判）

- 草稿的 `thumb_media_id` 对**新建**草稿返回空字符串是**微信正常行为**（batchget 不返回该字段值），**不是封面缺失**。
- 判断封面是否关联看 **`thumb_url`**：有值（mmbiz 图片 URL）即封面已生效。
- 只有部分老草稿（如手动编辑过的）会带 thumb_media_id 值。

## 删除单份草稿

```python
data = json.dumps({'media_id': '旧media_id'}).encode()
req = urllib.request.Request(f'https://api.weixin.qq.com/cgi-bin/draft/delete?access_token={tok}',
                             data=data, headers={'Content-Type': 'application/json'})
print(json.loads(urllib.request.urlopen(req).read()))  # {'errcode': 0, 'errmsg': 'ok'}
```
