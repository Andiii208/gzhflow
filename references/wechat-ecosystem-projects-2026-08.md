# 公众号生态开源项目调研（2026-08-03）

背景：用户提供"5 个最值得收藏"的公众号项目列表，要求评估能否接入现有工作流。结论：唯一值得接入的是 **gzh-design-skill**，作为排版层替换 baoyu 内置 md→HTML 渲染。

## 调研结论表（星标/许可/维护均为 GitHub API 实测）

| 项目 | 实际星标 | 许可证 | 最后推送 | 结论 |
|---|---|---|---|---|
| doocs/md | 13,121 | WTFPL | 2026-08-02 | ⚪ 可选：人工兜底编辑器，不进自动化。`npm i -g @doocs/md-cli` 或 `docker run -d -p 8080:80 doocs/md:latest` |
| **isjiamu/gzh-design-skill** | **2,776** | AGPL-3.0 | 2026-07-08 | ✅ **接入对象**。给 agent 用的排版 skill：6 主题 + 主题生成器 + `validate_gzh_html.py`/`component_lint.py` 双关卡校验；不挑模型（DeepSeek 可跑一致效果）；产物为纯 `<section>` 片段、全内联样式、`<span leaf>` 包裹 |
| geekjourneyx/md2wechat-skill | 3,403 | Source Available（NOASSERTION） | 2026-07-24 | ❌ 头部能力（48 主题、`:::` 模块、直出 HTML）全在**付费 API 模式**（加作者公众号申请）；免费模式仅 3 基础主题 + 生成 prompt 交回 LLM；商业条款模糊；发布能力与 baoyu 重复 |
| mdnice/markdown-nice | 4,661 | GPL-3.0 | **2023-10-06** | ❌ 三年停更；功能与 doocs/md 重叠 |
| "全流程 AI 技能"（第 5 个） | 未定位 | — | — | 用户确认链接为 mdnice/markdown-nice → 实为 #4 重复（粘贴错位）。描述"热点→选题→写作→SEO→配图→排版→草稿箱"类能力已被本工作流覆盖 |

参考：baoyu-skills 本体（JimLiu/baoyu-skills）24,485⭐，是本工作流的基座。

## 集成计划状态（Phase 1/2 完成、G1 已定稿，G2 待验证）

计划文件：`C:\Users\26895\.hermes\plans\2026-08-03_153246-gzh-design-wechat-integration.md`

- ✅ **Phase 1 已装**：`git clone --depth 1 https://github.com/isjiamu/gzh-design-skill.git D:/tools/hermes/skills/productivity/gzh-design-skill`；`python3 scripts/component_lint.py .` → 0 ERROR（2 个 WARN 是摸鱼绿/橄榄手记主题自带虚线框的设计特性，属预期）；skills_list 已可见（category: productivity）
- ✅ **Phase 2 已出 A/B 实测**：按风格路由现写 3 篇测试样本（01 日常随笔/槽边往事风、02 诗意/MorningRocks 风、03 观点/L先生说风），分别用 留白禅意(素)/留白禅意(标准)/石墨极简(全套) 装配，`validate_gzh_html.py` 全部 0 ERROR，`wrap_preview.py` 生成预览页；对照组用 `md-to-wechat.ts --theme grace --color blue` 渲染。样本目录 `D:\tools\gzh-test\20260803\`。**用户已确认账号发布内容按话题切换文风、无单一调性 → 排版必须走主题路由，不做单一默认主题**
- ✅ **G1 已定稿**（2026-08-03 用户看预览后拍板"很好"）：路由定稿=下表三行（日常→留白禅意素 / 诗意→留白禅意标准 / 观点→石墨极简全套）；签名=**动态收尾版**——每篇由 AI 按文章内容写一句收尾（如「明天还来，说的也是你。」）+「—— Andiii碎碎念」，**不含三连 CTA**，写砸了随时改回固定文案；WhatYouNeed/新世相两行路由留待后续文章实测补
- **Phase 3（2026-08-03 实测）**：`--dry-run` ✅ 通过（HTML 正确解析、contentLength 10995、零微信调用）；真实推草稿 ❌ 卡 **40164 IP 白名单**——微信报错显示出口 IP `IP_REDACTED`（宽带直连 IP）不在白名单。诊断：Clash Mini TUN 模式下 `api.weixin.qq.com` 按规则走直连，`curl ifconfig.me` 看到的是代理出口（IP_REDACTED）——**以微信报错里的 IP 为准**。处置：公众号后台（设置与开发→基本配置→IP 白名单）加白名单。⚠️ 家庭宽带 IP 动态会再失效 → 根治用 baoyu `--remote`（固定 IP 服务器出口，用户计划买阿里云轻量）
- **G2 决策门**（待白名单修好后验证）：gzh-design HTML → `wechat-api.ts --html` 全自动 vs Plan B（预览页→人工粘贴）。API 路径下 span leaf 样式是否保留是最大未知点，需真实推草稿到公众号助手 App 验证
- G3（默认不做）：doocs/md 本地部署

### 主题路由初稿（与写作风格路由并行的排版路由，A/B 实测后校正）

| 话题/文风 | gzh-design 主题 | 特性档位 |
|---|---|---|
| 日常小事（槽边往事风） | 留白禅意 | 素（少下划线，无编号/目录） |
| 诗意场景（MorningRocks 风） | 留白禅意 | 标准（编号+目录+衬线金句+图） |
| 困惑/焦虑/自律（L先生说风） | 石墨极简 | 全套（水印编号+看点卡+药丸列表+竖条金句） |
| 情感命名（WhatYouNeed 风） | 留白禅意 / 橄榄手记 | A/B 定 |
| 失败/集体情绪（新世相风） | 红白 / 橄榄手记 | A/B 定 |
| 教程/工具盘点（如有） | 摸鱼绿 | 全套（其最强项） |

路由没合适主题时用 gzh-design 主题生成器现造一套（用户偏好 AI 自由发挥）。

### gzh-design 装配实操要点（已跑通）

- 工作流：读 `references/theme-index.md`（主题单一来源）→ 选主题 → 读该主题组件库 + `common-components.md`（代码块/图片/小标签）→ 判定文章类型查"配方表" → 按"完整文章模板骨架"装配（**HTML 一律从组件库取，不手写**）→ `validate_gzh_html.py` 0 ERROR + 半角标点 0 WARN → `wrap_preview.py` 出预览页（右上角一键复制）
- 产物：纯 `<section>` 片段（不带 doctype/html/head/body），文件名 `{名}_排版_{主题中文名}({英文标识}).html`
- 智能处理：章节自动编号（末章 `∞`）、每段 1-3 处关键词下划线、3+ 章节出"本文看点"目录、`![](...)` 图片保留相对路径
- ⚠️ **read_file 误判 binary**：`references/theme-*.md` 与 `common-components.md` 是合法 UTF-8 但 read_file 报"Binary file"（CRLF/内容特征触发），用 `python3 -c "print(open(path,encoding='utf-8').read())"` 转储读取
- ⚠️ 中文+括号文件名在 git-bash 中必须整体加双引号
- 测试素材：纯色 PNG 用 stdlib（struct+zlib）生成，先 `mkdir -p imgs`
- ⚠️ **预览页交付给用户（Windows）**：`open_preview` 面板用户可能看不到；`cmd //c start` / `explorer.exe` 打开**含中文的路径**会经 cmd 代码页乱码后**静默失败**（git-bash UTF-8 → cmd GBK，cmd banner 出现 `�汾` 类乱码即为信号）；Hermes 自带浏览器工具为无头模式、用户不可见。可靠兜底：① 复制到纯 ASCII 路径再启动浏览器；② 直接复制到桌面文件夹（中文文件名在资源管理器没问题），图片用 base64 data URI 内嵌保证自包含，用户自己双击打开

## wechat-api.ts HTML 输入链路（代码级核实，v1.118.2，文件 887 行）

- `.html` 输入：`isHtml = path.endsWith(".html")`（L655）→ 直接读取，`extractHtmlContent` 提取正文；无 `<body>` 时原样返回（gzh-design 的 `<section>` 片段正好命中，L460-468/L708-724）
- 正文图片：`uploadImagesInHtml` 扫描 `<img src>`，非 `mmbiz.qpic.cn` 的 src 走 `media/uploadimg` 上传并重写为 https URL（L233-301）；**前提：图片为本地相对路径**（baseDir = HTML 所在目录）
- 元数据：CLI `--title/--author/--summary` 优先；同目录同名 `.md`（`x.html`→`x.md`）frontmatter 兜底（L711-720）
- `--dry-run`（L776-789）：渲染+解析+组 payload，但在取 token **之前**返回——零风险全链路验证手段
- 封面：`--cover` 走 `material/add_material`；news 类型无封面直接报错（L838-840）
- 中文+括号文件名（gzh-design 默认输出 `{名}_排版_{主题}({id}).html`）在 git-bash 中必须整体加双引号

## 粘贴错位案例（供后续识别）

用户从文章复制的项目列表，URL 整体错位一位挂在下一行行首（doocs/md URL 在 #2 行、mdnice URL 在 #5 行）。诊断信号：URL↔描述不匹配 + 星标不匹配。处理：按名称搜索 + API 核验身份，不按 URL 下结论。
