# 公众号 API 权限实测矩阵（2026-08-04 只读探测）

账号类型：**未认证个人订阅号**（Andiii碎碎念）。实测方式：access_token + curl 逐个只读探测接口，errcode=48001 = 该接口无权限。所有探测均为只读（查草稿/查素材/查菜单），未发布、未修改任何数据。

## ✅ 可用（实测通过）

| 能力 | 接口 | 说明 |
|------|------|------|
| 建草稿 | `draft/add` | 日常推送用 |
| 改草稿 | `draft/update` | 可原地改草稿箱内容（含用户手动改过的版本），不必重推新草稿 |
| 删草稿 | `draft/delete` | 可删草稿箱文章 |
| 查草稿 | `draft/count` / `draft/batchget` | 数量统计、拉取草稿内容（重推前保留用户手改版的关键） |
| 传图片 | `media/uploadimg`、`material/add_material` | 正文图、封面图 |
| 素材库管理 | `material/batchget_material` 等 | 永久素材增删查 |

→ **草稿箱全生命周期（建/改/删/查）可操作**，素材库也可管。

## ❌ 无权限（实测 48001 api unauthorized）

- `freepublish/*`（直接发布）→ 流程必须停在草稿箱，用户手机点发布
- `message/mass/*`（群发）
- `menu/*`（自定义菜单，含 get_current_selfmenu_info 仅返回 is_menu_open:0）
- `user/get`、`tags/*`（粉丝列表/用户标签）
- `datacube/*`（数据统计，返回空）
- `qrcode/create`（带参二维码）、`shorturl`（短链接）

## 原因

高级接口需认证（企业主体/服务号），个人主体订阅号无法认证，微信只开放内容管理类基础接口。

## 探测方法（可复用）

```bash
# 1. 取 token（凭证在 ~/.baoyu-skills/.env）
TOKEN=$(curl -s "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}" | python -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

# 2. POST 探测（最小合法 body），判读 errcode
curl -s -X POST "https://api.weixin.qq.com/cgi-bin/draft/count?access_token=${TOKEN}" -d '{}'
# errcode=0 → 可用；errcode=48001 → 未授权
```

⚠️ datacube 类接口 unauthorized 时可能返回空体（parse-fail），以 48001/空体均为无权限判断。
