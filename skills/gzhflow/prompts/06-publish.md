# 阶段⑥ 发布（Publish）

> 目标：把排版好的 HTML + 封面图推送到微信公众号**草稿箱**。
> ⚠️ 个人主体公众号 2025-07 起无法 API 直接发布（freepublish 已回收）——只能推草稿箱，由用户在「公众号助手 App」手动点发布。这是唯一合规路径。

## 流程

### Step 0：前置检查

- `config/publish.yaml` 存在且 AppID/AppSecret 已填（或环境变量 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`）
- 机器出口 IP 已加入微信开发者平台「API IP 白名单」（报错 40164 说明没加/加错了，详见 `references/wechat-api-guide.md`）
- 排版 HTML 已通过 `validate_gzh_html.py`（0 ERROR）

### Step 1：dry-run 先验（不碰微信，零风险）

```bash
python scripts/publish_draft.py <排版.html> \
  --title "标题" --author "作者" --summary "摘要" --cover cover.jpg \
  --dry-run
```

- dry-run 在取 token 前返回，验证参数/文件/全链路

### Step 2：正式推草稿箱

```bash
python scripts/publish_draft.py <排版.html> \
  --title "标题" --author "作者" --summary "摘要" --cover cover.jpg
```

- 主路径 = 官方 API `draft/add`
- 自动上传正文图片（media/uploadimg）并重写为 https URL
- 成功返回 `media_id`（草稿箱 ID）

### Step 3：用户发布

告知用户：**打开「公众号助手 App → 草稿箱」→ 找到这篇文章 → 检查 → 点发布**。

### 兜底路径（无凭证 / API 失败 / 不想配 API）

1. 交付：排版 HTML + 封面图 + 内文图片（本地路径）
2. 指导用户：登录 mp.weixin.qq.com 后台 → 新建图文 → 用「编辑器工具栏 → 粘贴」把 HTML 粘贴进去（或直接复制 HTML 源粘贴）
3. 上传封面 → 保存草稿 → 发布

## 防坑

- ❌ 跳过 dry-run → 参数错误会浪费一次 token 获取 + 可能产生孤儿素材
- ❌ 重复推送不删旧草稿 → 草稿箱堆积。推新后手动删旧（draft/delete）
- ❌ 用户手动改过草稿后重推直接覆盖 → 先 draft/batchget 拉取用户版本，在其上做局部替换
- ❌ 正文含 .gif 直接推 → 微信 API 会把 gif 转静态帧；需先替换为动图直传（见 wechat-api-guide.md）
- ⚠️ 40164 IP 白名单：报错里的 IP 为准（可能是宽带直连 IP，不是代理出口 IP）
- ⚠️ `--cover` 传路径：图片在子目录要传 `./assets/cover.jpg`，传裸文件名报 Image not found
- ⚠️ AppSecret 只显示一次，丢失只能重置
