# 真实截图搜集路径（公众号配图：科技/工具分享类推文）

> 2026-08-17 用户拍板：科技/工具分享类推文配图 = 少量 AI 生图（概念图 2-3 张）+ 网上真实截图补充，图说明标注「来源：xxx」归因。
> 本文记录实测可用的搜集路径与坑。SKILL.md「配图来源策略」条目为入口。

## GitHub README 演示图（最可靠的官方/项目图源）

```bash
# 1. 从 README 提取图片 URL（gh api 拿 base64 内容解码）
gh api repos/<owner>/<repo>/readme --jq .content | base64 -d | grep -oE '!\[[^]]*\]\([^)]*\.(png|jpg)' | head -10

# 2. 下载：用 jsdelivr CDN 镜像（国内可直连，绕开 raw.githubusercontent 被墙）
curl -sL -o demo.png "https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/<path/to/img.png>"
```

- 实测：liustack/modsearch 的 assets/ 有 2 张真实对话演示图（demo-codex-search.png / demo-codex-fetch.png），下载成功
- 仓库 404（改名/私有）时跳过，换博客文章源

## 技术博客文章图（curl 抓 HTML 提图 URL）

```bash
curl -sL --max-time 20 -A "Mozilla/5.0 ..." "<文章URL>" | grep -oE 'https?://[^" ]+\.(png|jpg|jpeg|gif|webp)' | grep -vE "logo|avatar|icon|\.gif" | sort -u
```

- **博客园 img2024.cnblogs.com 图床可直连下载**（实测拿到 DSH 官方「Everything is a plugin」架构图 + 插件管理界面截图，2477×1403 大图）
- 36kr 的图多为 AI 生成配图（URL 含 `ai_oswg`），无真实界面价值
- 知乎图有防盗链（zhimg 需 Referer/登录）、腾讯新闻懒加载抓不到
- 下载后用 vision_analyze 逐张筛选（判别：真实界面截图 vs 架构图 vs 无关插画），只留能用且清晰的

## 工具坑

- **web_extract 抓国内文章被拦**：Clash fake-ip 劫持 DNS → SSRF 防护误报 `Blocked: URL targets a private or internal network address` → 改用 curl
- **browser_exec 中文注释崩溃**：code 里的中文注释在 Windows 下 stdin 按 GBK 解码 → `UnicodeDecodeError: 'utf-8' codec can't decode byte` → 代码里只用纯 ASCII 注释
- 浏览器远程调试（Chrome Allow 弹窗）需要用户手动批准，别默认能自动抓

## 全类型真实图渠道库(2026-08-19 扩展)

> 2026-08-19 用户拍板:配图不全押 AI 绘图,意象本体在现实里→真实图(网上找),在内心→AI 插画。散文/共情/向往类 = AI 为主 + 网上真实场景照点睛 1-2 张。三问决策见 image-style-routing.md「图源决策」章节,本文件是真实图轨的渠道库。

### 1. CC0/CC 授权图库(散文/通用场景照主力)

用于黄昏、操场、食堂、山海、城市、日常物件等真实场景照。**全部免费可商用(CC0),无需归因但建议标注来源**:

| 图库 | 特点 | 国内可达性 |
|---|---|---|
| Unsplash | 摄影质感最好,场景照全 | ✅ 直连可达(2026-08-19 实测 images.unsplash.com 返回 200) |
| Pexels | 摄影+视频,搜索友好 | 需 API key,暂未接(可网页搜索拿图) |
| Pixabay | 量大,质量参差 | 需 API key,暂未接(可网页搜索拿图) |
| Wikimedia Commons | 百科级,历史/地标/事件图权威 | ✅ 全链路实测通过(2026-08-19):API 搜图+下载均通 |

**Wikimedia Commons 实测命令(2026-08-19 通过,无需 key):**

```bash
# 搜真实照片:gsrsearch 换英文关键词,gsrlimit 控制数量,iiurlwidth 控制下载尺寸
curl -s "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=sunset%20beach&gsrlimit=5&gsrnamespace=6&prop=imageinfo&iiprop=url%7Csize&iiurlwidth=1600&format=json"
# 从返回 JSON 里取 thumburl,下载(实测:200, 509KB, 1920x1344 JPEG 真实照片)
curl -sL -o img.jpg "<thumburl>"
```

**Unsplash 实测命令(2026-08-19 通过,直链可达):**

```bash
# photo-<id> 从 unsplash.com 页面 URL 或 web_search 拿;?w=1600&q=80 控尺寸
curl -sL -o img.jpg "https://images.unsplash.com/photo-<id>?w=1600&q=80"
```

- 常用检索词:场景英文关键词 + site 限定(如 `sunset beach unsplash`),用 web_search 找直链或官方搜索页
- 下载后 vision_analyze 逐张筛选(判别:真实照片 vs 无关图/低清图),只留清晰可用的(实测样例:Wikimedia 日落海滩图经 vision 复核确认真实照片、清晰、可做配图)
- ⚠️ 下载的图按「真实图规范」处理:不强制 16:9,竖版保持原比例,resize 后 `max-width:100%;height:auto` 插入;横版可按 16:9 裁(900×506)+ jpg quality 85

### 2. 官方图

品牌官网/发布会/官方公告/官方博客头图(科技、产品、事件类)。渠道:官网 press 页、官方博客、官方 GitHub 组织头像/banner。归因写官方名即可。

### 3. 社区同人图

科技/工具圈社区图(已验证 2026-08-17):标注作者与出处,沿用现有归因格式。⚠️ 拿不准授权的不用。

### 4. 专辑封面

音乐类封面走 `references/music-article-workflow.md` 的 iTunes Search API 流程(100x100bb→600/1200x1200bb 换参法),不重复实现。

### 5. 用户自拍(可选备注,非默认路径)

若用户某天愿意提供自己拍的照片(尼康 Z50II),属独家素材最高优先,零版权问题;不作默认流程,用户没主动给就不等。

### 6. 图源纪律(统一,2026-08-19)

- 归因格式:`— 说明文字(来源:xxx)`,真实图一律带来源
- 版权红线:只可用官方/CC0/授权/社区已标注图,**拿不准一律不用,宁缺毋滥**
- 真实图不强制 16:9(竖版长图保持原比例),AI 生成图的 16:9 构图铁律只管 AI 轨
- 找不到合规真实图 → 回退 AI 插画,不硬凑

## 使用规范

- 真实截图**不强制 16:9**：竖版长截图（对话类演示）保持原比例 resize 后插入（`max-width:100%;height:auto` 自适应）即可；16:9 构图铁律只管 AI 生成图
- 横版截图按 16:9 裁（900×506）+ jpg quality 85（与 AI 图同规格）
- 图说明必须带来源：`— 说明文字（来源：modsearch 项目演示图）`
- 换图/插图改 HTML 时用精确匹配的 del_img 正则（见 SKILL.md Pitfalls「批量替换图片块」），先删旧图再插新图
