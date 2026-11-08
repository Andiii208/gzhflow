# gzhflow 仓库功能缺口清单（只读审计）

> 审计对象：`~/WorkBuddy/Andiii碎碎念/gzhflow`（GitHub 远端 `https://github.com/Andiii208/gzhflow`）
> 审计时间：2026-11-08　审计方式：只读（未修改仓库任何文件，未执行任何 git 写操作）
> 用途：供主 Agent 写 DSH 工作台的前端重设计与功能补齐计划

---

## 0. 结论先行（最重要的 6 条）

1. **工作台依赖的 `--json` 契约只存在于本地未提交的工作区，GitHub 上没有。**
   `ai_flavor_score.py` / `check_image_prompt.py` / `image_batch.py` / `validate_gzh_html.py` 四个脚本的 `--json` 全部是 `git diff` 里的未提交改动（HEAD = `origin/main` = `3702335`）。`git show HEAD:scripts/ai_flavor_score.py | grep -c json` = **0**。换机器、重装、CI、GitHub 上跑，全部没有 JSON 输出。**这是当前最高优先级的缺口。**

2. **P2 剩余三项的缺口全在 Host/工作台层，仓库侧基本够用**：
   - 「记一笔」：仓库**没有**写 inbox 的脚本 → 需 Host 侧实现（格式规范在 `assets/inbox.md:18-30`）。
   - 「显式推送」：脚本**已能真实推送**（`publish_draft.py:309` 调 `draft/add`），凭据也有真值 → 缺口在 Host 命令分支 + UI 二次确认 + 封面产物。
   - 「新写一篇」：仓库**既没有**初始化脚本**也没有** `state.md` 模板/schema（`state.md` 被 gitignore）→ 需先补仓库侧落盘契约，否则工作台会成为"第六个真源"。

3. **P3 四库只读视图几乎零仓库缺口**：四库路径与格式全部明确，且**没有任何"查看用脚本"**——因为不需要脚本，Host 直接读文件即可。这是 P3 最省力的一块。

4. **P3 手改 diff / 复盘的数据链断了**：规划里的 `generated/draft_ai.md` / `generated/draft_user.md` **没有任何脚本产出**，当前 `generated/` 里也没有；`assets/log.md`、`assets/learned-edits.md`、`assets/cover-preferences.md` 三个记录区**全是空的**。结构在、数据不在。

5. **仓库侧没有文章索引**：没有 `articles.json`、没有 archive 目录；`generated/` 扁平且被 gitignore。「历史文章列表」的现实来源只能是 DSH `session/list` + `session/page`，不是仓库文件。

6. **两处计划文档与仓库实际不符**（写计划时别照抄）：
   - 计划附录 B 写 `md2wechat.py` 退出码 `0 / 2`——**实际该文件没有任何 `sys.exit`，恒 0，异常时是 traceback + 退出 1**。
   - 计划 §5.7:415 说"三个 gate 脚本只有人类可读输出"、§5.7:433 写"已实现"——那是把**本地工作区状态**当成了仓库状态。

---

## 1. 仓库现有脚本与 CLI 入口

### 1.1 `scripts/` 全部 11 个文件（逐个：参数 / 退出码 / 输出格式 / 是否 `--json`）

| # | 文件 | 用途 | 参数 | 退出码 | `--json` |
|---|---|---|---|---|---|
| 1 | `scripts/ai_flavor_score.py` | 去 AI 味质检门 | `path?` / `--text` / `--model` / `-`(stdin) / `--json`(预扫描，不在 `--help` 里) | 0 无 FAIL；1 有 FAIL；2 缺输入 | ✅ 有 |
| 2 | `scripts/check_image_prompt.py` | 配图 prompt 质检门 | `path?` / `--engine` / `--json` | 0 PASS(含WARN)；1 FAIL；2 引擎文件读不到 | ✅ 有 |
| 3 | `scripts/crop_image.py` | 图片中心裁剪→jpg | `src` / `--ratio`(16:9) / `--width`(900) / `-o|--output` / `--quality`(85) | 1 = Pillow 缺失或源文件不存在 | ❌ 无 |
| 4 | `scripts/generate_image.py` | 单张图生（OpenAI 兼容接口） | `--prompt`(必填) / `--ratio` / `--size` / `-o`(必填) / `--n` / `--quality` / `--backend` / `--refs` | 0 成功；1 接口失败；2 参数/配置错误 | ❌ 无 |
| 5 | `scripts/image_batch.py` | 生图预算层（manifest 制） | `--manifest`(必填) / `--plan-only` / `--prompts-only` / `--auto-trim` / `--backend` / `--anchors` / `--engine` / `--max-images` / `--max-cost` / `--receipt` / `--json` | 0 ok；1 生成有失败；2 用法/配置错误(`fail()` 默认 code=2)；3(计划口径) | ✅ 有 |
| 6 | `scripts/learned_edits.py` | 手改记录器（阶段⑦入口） | `--before`(必填) / `--after`(必填) / `--note` / `--kind`(7 选) / `--context`(2) / `--max-lines`(120) / `--append` / `--title` | 0 有改动并已记录；2 用法/文件错；4 两版一致（什么都没写） | ❌ 无 |
| 7 | `scripts/md2wechat.py` | Markdown→公众号 HTML | `path` / `--theme`(zen) / `-o|--output` / `--enhance` / `--underline` / `--author` / `--signature` | **无 `sys.exit`** → 恒 0；未捕获异常时 traceback + 1 | ❌ 无 |
| 8 | `scripts/publish_draft.py` | 推草稿箱（微信 `draft/add`） | `html` / `--title`(必填) / `--author` / `--summary` / `--cover` / `--no-cover`(已废弃) / `--app-id` / `--app-secret` / `--dry-run` | 0 成功；1 API/网络错；2 参数/前置缺失 | ❌ 无 |
| 9 | `scripts/upload_gif.py` | GIF 直传微信素材 | `gif` / `--html` / `--out` | 0 成功；1 凭证缺失/上传失败 | ❌ 无 |
| 10 | `scripts/validate_gzh_html.py` | 公众号 HTML 合规校验（13 项红线） | `file?` / `--stdin` / `--json` | 0 通过；1 有 ERROR | ✅ 有 |
| 11 | `scripts/validate_repo.py` | 仓库自检（链接/引用/密钥/frontmatter） | 无 | 0 通过；1 有问题 | ❌ 无 |

**位置索引**：`scripts/ai_flavor_score.py:14-30`（用法/退出码）、`:409-420`（`--json` 预扫描）、`:431-486`（main/退出）；
`scripts/check_image_prompt.py:15-23`、`:171-220`；`scripts/crop_image.py:11-15`、`:34-35`、`:62-74`；
`scripts/generate_image.py:31-38`、`:371-418`；`scripts/image_batch.py:8-23`（manifest 结构）、`:97-105`（fail/exit 2）、`:349-374`（`--json`）、`:427-487`；
`scripts/learned_edits.py:8-13`、`:22-30`（KINDS）、`:58-107`；`scripts/md2wechat.py:13-17`、`:361-397`；
`scripts/publish_draft.py:16-22`、`:42-64`（凭据）、`:202-213`（参数）、`:271-277`（dry-run）、`:298-314`（draft/add）；
`scripts/upload_gif.py:8-23`、`:41`、`:106-132`；`scripts/validate_gzh_html.py:18-26`、`:300-347`；`scripts/validate_repo.py:10-13`、`:161-172`。

**已验证 `--json` 实际输出形状**（实跑，只读）：

```jsonc
// scripts/ai_flavor_score.py generated/draft.md --json   → exit 0
{"fail": [], "warn": [{"line":17,"rule":"提示性冒号","text":"…"}], "stats": {...}, "exit": 0}
// scripts/validate_gzh_html.py generated/draft_排版_zen.html --json   → exit 0
{"file":"generated/draft_排版_zen.html","errors":[],"warns":[{"line":1,"rule":"half-punct","message":"…"}],"spanLeafCount":N,"exit":0}
```

### 1.2 `skills/*/scripts/` 下的辅助脚本（不在 `scripts/`，容易被漏）

| 文件 | 用途 | 退出码 |
|---|---|---|
| `skills/gzh-design/scripts/validate_gzh_html.py` | **转发 shim** 到 `scripts/validate_gzh_html.py`（`:16-22`），历史遗留路径 | 同主脚本 |
| `skills/gzh-design/scripts/component_lint.py` | 扫组件库 .md 里的 HTML 反模式（源头检查） | 0 / 1（`:12`） |
| `skills/gzh-design/scripts/wrap_preview.py` | 排版 HTML 包装成带「复制到公众号」按钮的预览页 | 1 = 用法错/文件不存在（`:26-31`） |
| `skills/gzh-design/scripts/extract_docx.py` | docx → md | 0 / 1（`:165-167`） |
| `skills/andiii-crt-style/scripts/check_crt_prompt.py` | CRT 引擎 prompt 质检 | 0/1/3（`:113,126,142`） |
| `skills/andiii-crt-style/scripts/finalize_crt.py` | CRT 图终稿化 | — |
| `skills/ai-image-style-engine/scripts/batch_gate_check.py` | 批量 prompt 质检 | 0 / 1 |

### 1.3 可直接被工作台按钮调用的「确定性动作」清单

| 动作 | 命令（工作台 Host 命令层） | 脚本 | 外部副作用 |
|---|---|---|---|
| 体检（稿件） | `/gzh-gate draft` | `ai_flavor_score.py --json` | 无 |
| 体检（排版） | `/gzh-gate html` | `validate_gzh_html.py --json` | 无 |
| 体检（配图 prompt） | 需新增 | `check_image_prompt.py --engine X --json` | 无 |
| 生图算账 | 需新增 | `image_batch.py --manifest … --plan-only --json` | 无 |
| 只落 prompt（零成本迭代） | 需新增 | `image_batch.py --prompts-only` | 写 `generated/` |
| 正式出图 | 需新增 | `image_batch.py --receipt` | **花钱** |
| 排版 | `/gzh-layout [theme]`（已接，`gzh-workbench/index.js:780`） | `md2wechat.py --enhance` | 写 `generated/` |
| 裁剪 | 需新增 | `crop_image.py` | 写 `generated/` |
| 发布预检 | `/gzh-publish --dry-run`（已接，`index.js:786`） | `publish_draft.py --dry-run` | 无（不取 token） |
| **真实推草稿箱** | **需新增（现在被硬拒）** | `publish_draft.py` | **推草稿箱** |
| 手改记录 | 需新增 | `learned_edits.py --append` | 写 `assets/learned-edits.md` |
| 环境自检 | `/gzh-env`（已接，`index.js:730`） | `validate_repo.py` | 无 |
| GIF 直传 | 需新增（**凭据路径是遗留的**，见 §8-C） | `upload_gif.py` | 写微信素材 |

**仓库里不存在、必须由 Host 层新写的确定性动作**：① 追加 `assets/inbox.md`；② 初始化/改写 `state.md` 的「当前篇」；③ 读四库（**不需要脚本**，直接读文件）；④ 文章索引（仓库无此概念）。

### 1.4 DSH 侧已有的工具层（仓库内，非 `scripts/`）

`dsh-preset/tools/gzhflow-tools.mjs`（315 行，7 个工具）：`gzhflow_check_env`(:124) / `gzhflow_deai_score`(:177) / `gzhflow_check_prompt`(:192) / `gzhflow_validate_html`(:205) / `gzhflow_md2wechat`(:218) / `gzhflow_generate_image`(:234) / `gzhflow_publish_draft`(:277)。
关键：`gzhflow_publish_draft` 已实现「从 DSH credentials 读 `WECHAT_APP_ID/SECRET` → env 注入」（:296-310），**脚本层没有这条通道，只有工具层有**。

---

## 2. 「新写一篇」需要的落盘动作

### 2.1 落盘动作是什么

「新写一篇」= **改写 `state.md` 的「当前篇」代码块**（切到新主题、新日期、状态归零），其余产物随阶段推进逐步落到 `generated/`。
工作台侧的主通道是 DSH `session/create` + `session/prompt`（计划 §5.4:375-376），**但那只是开一个 Agent 会话；仓库侧的落盘契约缺一半。**

### 2.2 `state.md` 的结构与字段

唯一的现存实例就是仓库根的 `state.md` 本身（**它被 gitignore，`gitignore:53`**）：

```
state.md
├── # state.md — 跨会话状态机            (1)
├── ## 环境速查（新会话先看这段）         (11-18)  仓库位置/主编排/Python 环境/质检门/references 路由/git push 代理
├── ## 用户硬性偏好（新会话必读）         (20-29)  7 条硬性偏好（每版必须输出全文、不编造经历…）
├── ## 当前篇                            (31-57)
│   └── ``` 代码块                        (33-44)  ← 唯一的状态字段区
│       状态: ②写作                       状态取值域（state.md:34 / SKILL.md:34）：
│                                        idle / run / ①素材 / ②写作 / ③去味 /
│                                        ④配图 / ⑤排版 / ⑥发布 / ⑦复盘
│       主题: <标题>                     
│       开写日期: 2026-10-13              
│       目标发布日: <自由文本>             
│       本轮搭载的系统改动: —             # 一篇最多 2 个（SKILL.md:203）
│       模式: strict                     # auto / strict / 交互（state.md:41）
│       run step: ②写作                   # 断点续跑用（state.md:42）
│       已完成: ①素材 ②写作               # 已完成阶段清单（state.md:43）
│   └── > 引文块                          (46-57)  阶段进度人话记录
├── ## 待办（按优先级）                   (61-72)
├── ## 个人基准线核心结论                  (74-81)
├── ## 已完成                              (83-126)  # 每篇/每次系统改动一条复选框
└── ## 会话交接备注                        (128-131)
```

Run 模式的三行规范另见 `skills/gzhflow/prompts/00-run.md:42-48`：

```
状态: run
run step: ④ 配图 (in_progress)
已完成: ①素材 ②写作 ③去味
```

### 2.3 有没有创建/初始化文章的脚本？

**没有。** 搜索 `init` / `new` / `start` / `inbox` 等：`scripts/` 全 11 个文件**没有一个**涉及 `state.md`（`grep "state.md|inbox.md|log.md" scripts/**/*.py` → 0 命中）。
仓库里也不存在 `state.md.example` / `state.template.md` / schema 文件——`examples/` 下只有 `image-manifest.example.json`、`styles/`、`themes/`、`image-engines/`、`case-study/`。

### 2.4 字段说明在哪个文件？

**没有一个集中的字段说明文件。** 权威来源是三处拼出来的：
- `state.md:31-44`（活实例，即"格式即模板"）
- `skills/gzhflow/prompts/00-run.md:40-54`（Run 三行 + 推进规则）
- `skills/gzhflow/SKILL.md:34`（状态取值域）、`:190`（每 5 篇回写 + 更新 state.md「已完成」区）

### 2.5 缺口结论

- 状态机是**人类可读约定**，不是机器契约。工作台若要"新写一篇"自动落盘，**必须先在仓库侧补一个 `state.md` 模板/schema**（或至少一份 `examples/state.example.md`），否则：
  - 换机器时 `state.md` 不存在（gitignore），没有骨架可写；
  - 工作台自己实现字段 = 变成计划 §2.6:121-125 禁止的"第六个真源"（"工作台不得新增第六个真源"）。
- 附带发现：`state.md:13` 写的仓库位置 `~/WorkBuddy/gzhflow/` **已过期**（实际 `~/WorkBuddy/Andiii碎碎念/gzhflow/`）。工作台解析状态时不要信这行。

---

## 3. 「记一笔」

### 3.1 inbox 是什么文件

`assets/inbox.md`（AGENTS.md:25、SKILL.md:45、README.md:76 均指此路径）。**被 gitignore**（`.gitignore:54`）——新 clone 不存在。

### 3.2 格式

`assets/inbox.md:1-30` 全文只有 30 行，是一个带注释的骨架：

```
## 未处理                                  (18)
<!-- 往下追加，格式：- [日期] 内容（来源：随手记/读到某处/聊天） -->   (20)
## 已用                                    (24)
<!-- - [日期] 内容 → 《文章标题》 -->        (26)
## 沉淀                                    (28)
<!-- - [日期] 内容（出现过 N 次） -->        (29)
```

三种条目格式：
- 未处理：`- [日期] 内容（来源：随手记/读到某处/聊天）`
- 已用：`- [日期] 内容 → 《文章标题》`
- 沉淀：`- [日期] 内容（出现过 N 次）`

分三区的语义见 `assets/inbox.md:10-14`：未处理=还没被任何文章用过；已用=被哪篇文章用了；沉淀=出现过两次以上的念头。

### 3.3 有没有写入脚本或规范？

**规范有，脚本没有。**
- 规范：`assets/inbox.md:5-8`「对任意 Agent 说一句『**记一笔：……**』，Agent 负责追加到下面的『未处理』区。不需要打开文件、不需要记格式。」+ `:20` 的格式注释 + `skills/gzhflow/prompts/07-review.md:51`（每篇顺手把用过的挪到「已用」区，出现两次以上的挪到「沉淀」）。
- 脚本：**零**。`grep "inbox"` 在 `scripts/` 下 0 命中；全仓 `inbox` 命中 20 处**全在 .md 文档里**。

### 3.4 缺口结论

Host 侧要实现「记一笔」，必须自己补齐以下全部语义（仓库不提供）：
1. **定位分区**：追加到「## 未处理」区段内，不是文件末尾（文件末尾是「## 沉淀」区）。
2. **补日期前缀** `[YYYY-MM-DD]`（格式在注释里，但没人写）。
3. **来源标注**（`随手记/读到某处/聊天`）——用户一句话通常不含来源。
4. **原子写 + 并发保护**（DSH 可能多个会话同时记）。
5. **文件不存在时建骨架**（gitignore → 新 clone 无文件；`assets/inbox.md:16` 有 `---` 分隔线可参照）。
6. **写前路径校验在仓库根内**（计划 §5.9:463 的白名单要求：`assets/inbox.md` 在白名单里）。

---

## 4. 「显式推送」

### 4.1 `publish_draft.py` 的真实参数

`scripts/publish_draft.py:202-213`：

```
publish_draft.py <排版.html>
  --title "标题"          # required
  --author "作者"         # 可选：CLI > frontmatter > config/publish.yaml 的 publish.default_author > 空（:266-269）
  --summary "摘要"        # 可选：缺省自动截正文前 120 字（:293-296）
  --cover cover.jpg       # 可选：缺省读 frontmatter 的 coverImage（:255-256）；实际最终必填（:258-264）
  --no-cover              # 已废弃，直接 exit 2（:215-218）
  --app-id / --app-secret # 覆盖环境变量
  --dry-run               # 取 token 前返回（:271-277）
```
**没有 `--json`**；输出是人类文本行，成功行是 `✅ 已推送到草稿箱: {media_id}`（:311）+ `请在「公众号助手 App → 草稿箱」检查后手动发布`（:312）。

### 4.2 凭据从哪来

`scripts/publish_draft.py:13-14`（docstring）与 `:42-64`（实现）：

**优先级：命令行 `--app-id/--app-secret` → 环境变量 `WECHAT_APP_ID` / `WECHAT_APP_SECRET` → `config/publish.yaml` 的 `wechat.app_id` / `wechat.app_secret`（正则抓取，`:48-56`）。**

脚本层**没有** DSH credentials 通道。但仓库的工具层 `dsh-preset/tools/gzhflow-tools.mjs:296-310` 已实现「从 `ctx.credentials` 读 → env 注入 → 跑脚本」，所以 **Host 命令层可以复用这条路径**（且凭据不下发浏览器，符合计划 §5.9:458-462）。

**实测现状（只读探测，未打印明文）**：
- `~/.dsh/.credentials.yaml` 存在，refs 仅：`STEPFUN_API_KEY` / `OPENCODE_GO_API_KEY` / `DEEPSEEK_API_KEY` / `GOD_API_KEY` / `MAGPIE_GATEWAY_KEY` —— **没有 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`**。
- 环境变量 `WECHAT_APP_ID` / `WECHAT_APP_SECRET` / `IMAGE_API_KEY` **均未设置**。
- `config/publish.yaml` 的 `wechat.app_id`（18 位）/ `wechat.app_secret`（32 位）**是真值、非占位符**（脚本 `:61-63` 的占位符检查会通过）。
  → **结论：真实推送今天就能跑通**，凭据走 `config/publish.yaml` 兜底路径即可，不需要先动 DSH credentials。

### 4.3 当前是否会真实推送

**会。** 除 `--dry-run` 外，`main` 走完整链路（`scripts/publish_draft.py:279-314`）：
取 access_token(:280) → 上传正文图片并重写为 https URL(:284) → 上传封面为永久素材 `material/add_material`(:290) → `draft/add` 创建草稿(:309) → 返回 media_id(:311)。
**只推草稿箱，不直接发布**（个人主体公众号 2025-07 起 freepublish 已回收，AGENTS.md:49）。

### 4.4 缺什么前置条件

| # | 前置 | 位置 | 失败表现 |
|---|---|---|---|
| 1 | **封面必须有**（`--cover` 或 frontmatter `coverImage`） | `publish_draft.py:258-264` | 缺 → `❌ 未指定封面…` exit 2；文件不存在 → `❌ 封面不存在` exit 2 |
| 2 | `--no-cover` 已废弃 | `:215-218` | 直接 exit 2（40007 invalid media_id） |
| 3 | HTML 文件必须存在 | `:220-223` | exit 2 |
| 4 | 封面走**永久素材** `material/add_material`（不是 `media/`），个人订阅号需此基础权限 | `:154-165` | 40189 等 → exit 1 |
| 5 | 出口 IP 在微信 API 白名单 | `:82-84`（40164 友好提示） | exit 1 |
| 6 | 排版 HTML 先过 `validate_gzh_html.py`（0 ERROR） | `prompts/06-publish.md:12` | 脚本自身**不检查**，需上层保证 |
| 7 | 摘要兜底、作者兜底、评论开关 | `:266-269`、`:293-296`、`:305` | config `publish.open_comment` |
| 8 | **当前 `generated/` 里没有封面**（只有 `01-素材锚点清单-*.md`、`draft.md`、`draft_排版_zen.html`） | 实测 `ls generated/` | 真实推送必失败在 #1 |

### 4.5 缺口结论

- **脚本侧无缺口**（除 #8 的封面产物属于内容流程）。
- **工作台侧缺口**：`gzh-workbench/index.js:686-693` 现在把非 `--dry-run` 一律拒掉（`code: 'push_disabled'`，`:690`）。要接真实推送，需要：① Host 新增真推分支；② 凭据注入（DSH credentials 优先 / config 兜底，**明文绝不下发浏览器**）；③ UI 两次点击确认态（计划 §4.7:308、§5.9:464）；④ 失败时展示 stderr 原文（脚本输出是中文错误行，可直接展示）。
- **副作用提醒**：脚本**不会**写 `assets/log.md`、**不会**更新 `state.md`。真实推完之后没有任何"已发"落盘 → 呼应 §6 的历史列表缺口。

---

## 5. 「四库」与手改/复盘数据

### 5.1 真实路径与格式

| 库 | 路径 | 格式 | 现有数据量 |
|---|---|---|---|
| 输入收件箱 | `assets/inbox.md` | 三区 markdown 列表（未处理/已用/沉淀），条目 `- [日期] 内容（来源：…）` | **空**（三个区只有注释） |
| 范文锚 | `assets/voice-samples/` | 每文件一篇 ~300 字，文件名按话题（`assets/voice-samples/README.md:66-70`） | 4 篇私藏（`01-十八岁成人礼.md` / `02-高中与大学.md` / `03-2025年终.md` / `04-AI时代怎么学计算机.md`）+ 公开 README |
| 风格档案 | `assets/voice.md` | 定位表/节奏/标题/声音红线/一手样本指纹/「已被验证有效的」 | 完整（108 行），但 `:103-108`「已被验证有效的」区为空 |
| 教训库 | `assets/lessons.md` | 防坑总表 15 条 + 完整案例原文链接 + 「新增规矩」区 | 15 条预置；`:37-40`「新增规矩」为空 |
| 手改学习 | `assets/learned-edits.md` | `## YYYY-MM-DD｜kind` + 元信息 + ` ```diff ` 块 | 骨架（`:40-51` 记录区**空**） |
| 封面偏好 | `assets/cover-preferences.md` | `日期 \| 文章 \| 判断 \| 封面描述 \| 一句话理由` | 骨架（`:22-27` 记录区**空**） |
| 发文日志 | `assets/log.md` | `日期 \| 标题 \| 选题类型 \| 开头方式 \| 结构 \| 用的标题公式 \| 阅读/在看/留言 \| 一句话结论` | 骨架（`:12-14` 记录区**空**） |
| 个人基准线 | `assets/baseline.md` + `assets/baseline/` | 私人基准线 | 存在（gitignored，`.gitignore:59-60`） |

四库的权威定义另见 `skills/gzhflow/SKILL.md:43-51`（含变化速度与"什么时候动"），路由表见 `references/INDEX.md:16-27`。

### 5.2 有没有查看用的脚本？

**没有，而且不需要。** `scripts/` 里没有任何读四库的脚本（11 个文件全在"生成/校验/发布"侧）。
四库只读视图直接用 `remote.workspaceFiles.read` 读文件即可（计划 §5.3:352-367）。
唯一约束：`workspaceFiles.read` **需要 sessionId** 作为读取授权（计划 §7:587）——工作台已有绑定机制，问题不大。

### 5.3 `learned_edits.py` 的接口与产物格式

**接口**（`scripts/learned_edits.py:58-69`）：
`--before`(必填) `--after`(必填) `--note` `--kind`(deai/structure/voice/layout/image/title/other，`:22-30`) `--context`(2) `--max-lines`(120) `--append` `--title`。
退出码：**0** 有改动并已记录 / **2** 用法或文件错误 / **4** 两版一致（什么都没写，`:73-75`）。

**产物格式**（`:89-104`，追加到 `--append` 指定的 markdown 末尾）：

```markdown
## 2026-11-01｜deai

- 文章：《标题》
- 对比：`generated/draft_ai.md` → `generated/draft_user.md`
- 改动量：+3 / -12 行
- 自述：删掉开头天气铺垫，直接从事件进

```diff
@@ …
-旧行
+新行
```
```

**接口缺口**：
- **无 `--json`**（人类输出：`📊 改动：+N 行 / -M 行（类型：…）` + diff 文本）。
- **无"读取/列出已有记录"接口**——想复盘历史，只能直接读 `assets/learned-edits.md` 解析那套 `## 日期｜kind` + diff 块的格式（格式定义在 `assets/learned-edits.md:42-50`）。
- **无去重、无按文章分组、无按 kind 统计**（蒸馏规则要求"不满 2 条同类不下结论"，见 `assets/learned-edits.md:33-38`）——统计得自己算。

### 5.4 手改 diff 与复盘所需的数据是否存在？

| 需要的数据 | 存在？ | 证据 |
|---|---|---|
| `generated/draft_ai.md`（机器稿） | **不存在，且无脚本产出** | 实测 `generated/` 只有 3 个文件；`SKILL.md:185`、`prompts/07-review.md:22` 只是**约定名** |
| `generated/draft_user.md`（手改稿） | **不存在，且无脚本产出** | 同上 |
| diff 计算能力 | ✅ 有 | `scripts/learned_edits.py:41-55`（difflib） |
| 记录容器 | ✅ 有（空） | `assets/learned-edits.md:40-51` |
| 发文日志 | ✅ 有（空） | `assets/log.md:12-14` |
| 封面偏好 | ✅ 有（空） | `assets/cover-preferences.md:22-27` |
| 教训库 | ✅ 有（15 条预置） | `assets/lessons.md:8-26` |
| voice.md 回写区 | ✅ 有（空） | `assets/voice.md:103-108` |
| 每 5 篇复盘记录区 | ✅ 有（空） | `assets/log.md:16-18` |

**结论：结构全在，数据几乎全空。** P3 复盘页如果只是"把空页面搭出来"，无法验证价值；需要先跑 1 篇真文章产生 `draft_ai.md` / `draft_user.md` 和一条 log。
**缺口动作**：① 约定并固化机器稿/手改稿的文件名（或让脚本接受任意路径——它已经接受任意路径，只是工作流里没人产出这两个文件）；② 补一个"列出 learned-edits 记录"的读取接口（读文件即可，不必是脚本）。

---

## 6. 「历史文章列表与回放」

### 6.1 仓库里有什么

| 候选 | 路径 | 能否支撑文章列表 |
|---|---|---|
| 发文日志 | `assets/log.md:3-7` | **格式上可以**（一行一篇：日期\|标题\|选题类型\|…\|一句话结论），但**记录区是空的**（`:12-14`），且**无标题→文件路径的映射**（只有标题，没有 md/html 路径） |
| state.md「已完成」 | `state.md:83-126` | 是**系统改动记录**（B5/A5/主题扩容…），不是文章索引 |
| voice-samples | `assets/voice-samples/*.md` | 4 段旧稿，不是文章列表，无日期/标题索引 |
| 产物目录 | `generated/` | 扁平、**被 gitignore**（`.gitignore:4`），当前只有 1 篇的 3 个产物，**没有文章子目录** |
| 归档目录 | — | **不存在**（无 `articles/`、无 `archive/`、无 `index.md`、无 `articles.json`） |

**结论：仓库侧没有文章索引，也没有任何"历史"概念的文件。**

### 6.2 现实来源是 DSH 会话

计划 §5.3:362-364、附录 C:680-685 已经指出：历史靠 `session/list`（筛 cwd 指向 gzhflow 的会话）+ `session/page`（分页读历史事件），§5.8:456 明确"**会话日志本身就是轨迹**，这也是 DSH 的核心设计（session log is the only source of truth）"。
绑定 sidecar 已在 `gzhflow/generated/.gzh-workbench/run.json`（计划 §6:504，实测目录 `generated/.gzh-workbench/`），`articleKey = sha1(主题+"\n"+开写日期)[:12]`。

### 6.3 缺口结论

- **「历史文章列表」只能由 DSH `session/list` 构建**（标题/cwd/时间），再按 cwd 过滤到 gzhflow 仓库。
- 但 `session/list` 给的是**会话**，不是文章；一个会话可能跑多篇。要变成"文章列表"需要约定：会话标题 = 文章标题（计划 §5.4:382 有 `session/rename`），或用 state.md 的 articleKey 体系。
- **「回放」**：`session/page` 分页读事件 + `session/follow` 实时，**能力已具备**，缺的是 UI 聚合与去重（计划 §5.8:447-454 给了映射规则）。
- **「上下篇」快捷键（P3）**缺一个稳定排序依据：仓库侧无索引 → 要么按 `session/list` 的时间排序，要么新增一个索引文件（后者触碰单源纪律）。

---

## 7. AGENTS.md 与 SKILL.md 的既有约束与铁律（逐条）

### 7.1 `AGENTS.md`

| # | 条款 | 位置 | 对工作台的含义 |
|---|---|---|---|
| A1 | **`state.md` 是跨会话状态机**；"先读 `state.md`… **每次会话第一件事**" | `:30`、`:37` | 新会话启动提示词必须包含"读 state.md" |
| A2 | **`skills/gzhflow/SKILL.md` 是工作流的唯一权威源** | `:38`、`:55` | 工作台不得重写流程规则（计划 §3.2:151） |
| A3 | 配置从 `*.example.yaml` 复制；产物全部写入 `generated/`（已 gitignore） | `:39`、`:41` | 写路径白名单的第一条 |
| A4 | **不要跳过质量门**：每阶段的 `scripts/` 质检脚本是硬门槛，**脚本 FAIL 就不许进入下一阶段** | `:45` | UI 上 FAIL 必须显红且阻断 |
| A5 | **不要编造素材**：用户没给的经历/场景/细节一律不写 | `:46` | "新写一篇"的启动提示词必须带这条 |
| A6 | **默认停靠点**：①②③ 阶段完成后**必须输出全文给用户审阅**；除非用户明确说"直接做/不用审阅"，否则不许自动跳过 | `:47` | 审阅页是硬约束，不能做成"可跳过"的按钮 |
| A7 | **不要提交任何凭证**：AppSecret / API Key / token 一律只放本地 `.env` 或 `config/*.yaml`（gitignore），仓库里只有 `*.example` 占位符 | `:48` | 凭据永不下发浏览器；且 `config/*.yaml` 已被 gitignore（`.gitignore:10`） |
| A8 | **发布层现实**：个人主体公众号 2025-07 起无法 API 直接发布（freepublish 已回收），**只能 `draft/add` 推草稿箱**，再由用户在「公众号助手 App」手动点发布。**这是唯一合规路径** | `:49` | 工作台只能"推草稿箱"，不能有"一键发布"按钮 |
| A9 | `state.md` / `assets/inbox.md` / `assets/log.md` / `assets/voice-samples/` 段落**都被 gitignore** | `:32-33` | 新 clone 缺这些是正常的 → 首次引导必须处理"文件不存在" |

### 7.2 `skills/gzhflow/SKILL.md`

| # | 条款 | 位置 | 对工作台的含义 |
|---|---|---|---|
| B1 | 本文件是**唯一权威编排** | `:11` | 同 A2 |
| B2 | **默认 `strict`**：每阶段输出都给用户审阅；用户明确说"直接做/不用审阅"才切 `auto` | `:21` | 模式开关要显式呈现（state.md 的 `模式:` 字段） |
| B3 | **质量门是硬门槛**；**默认停靠点**：①②③ 阶段输出全文给用户审阅 | `:37` | 同 A4/A6 |
| B4 | **发布永不进 Run**：推草稿箱是**显式授权的独立动作**（安全边界） | `:76` | 「显式推送」必须是独立按钮 + 二次确认，不能混进 Run/自动流程 |
| B5 | 阶段⑦的 `learned_edits.py` **是记录器不是判官**，**不回写风格库**（回写要人判断） | `:186` | 工作台不能"一键回写 voice.md" |
| B6 | 每 5 篇回写 + **更新 `state.md` 的「已完成」区** | `:188-190` | 复盘页写回走窄命令 |
| B7 | §9 关键纪律 **8 条**：①不编造 ②不过度聪明 ③不被否后空转 ④**不跳过用户审阅** ⑤不提交凭证 ⑥**个人化只改 `config/` 与 `examples/`，不修改本流程文件** ⑦**不为过质检门改文字**（"门是提示不是目标"）⑧**一篇最多搭载 2 个系统改动** | `:194-203` | ⑥⑦⑧ 直接约束 UI：不能做"一键优化到通过"（计划 §3.2:152） |
| B8 | 四库中 `inbox.md` / `log.md` / `voice-samples` 段落 / `anchors/` 被 gitignore；**开源的是流程和方法论** | `:52-57` | 同 A9 |
| B9 | `references/` 40 份方法论**按阶段路由**（`references/INDEX.md`），别一次全读 | `:61` | 复盘页不要一次加载全部库 |
| B10 | 40164 = IP 白名单问题，报错里的 IP 为准 | `:214` | 发布错误要原样展示 |

### 7.3 计划文档里的既有约束（同样约束工作台）

| # | 条款 | 位置 |
|---|---|---|
| C1 | **单源纪律**：现有单源 = SKILL.md / AGENTS.md / state.md / theme-index.md / voice.md；**"工作台不得新增第六个真源"**；展示的一切必须能指回某个文件或某条会话事件；**关掉工作台，流程仍然完整可跑** | 计划 `:121-125` |
| C2 | **确定性归代码，创作归 Agent**："工作台沿这条线切：确定性按钮直接调脚本（快、免费、可重跑），创作步骤交给会话里的 Agent" | 计划 `:105-119` |
| C3 | **写白名单**："所有文件写入只发生在 `generated/`、`assets/inbox.md`、`assets/log.md` 等白名单路径；路径必须校验在仓库根内" | 计划 `:463` |
| C4 | **凭据不下发浏览器**："浏览器端只拿『是否配置』和结果文本，不拿明文 secret"；发布命令在 Host 执行 | 计划 `:458-462` |
| C5 | **发布按钮需二次确认态**（inline 两次点击，不是 modal） | 计划 `:464` |
| C6 | **不在 UI 里重写写作提示词或质量门规则**；不做"红绿 KPI / 完成度百分比 / 一键优化到通过"；不把 `state.md` 复制成数据库 | 计划 `:148-156` |
| C7 | **"只减不加"**：任何新按钮都要通过"它是否减少了一次复制/查找/回忆"的检验 | 计划 `:165` |
| C8 | **产物优先**：屏幕上的每个状态都能指到一个文件/一条事件；**对不上就显示"未知"，不猜** | 计划 `:160` |
| C9 | **"工作台只调用同一批脚本与文件；SKILL/CLI 保持完整"**（关闭工作台后 CLI 流程不受影响） | 计划 `:597`、P3 验收 `:570` |

---

## 8. 计划文档 §6 P2/P3 勾选状态 ↔ 仓库现状 逐条对照

对照对象：`~/WorkBuddy/Andiii碎碎念/gzhflow-DSH工作台计划-v1.md:547-568`

### 8.1 P2（计划 `:547-559`）

| # | 计划条目 | 计划勾选 | 仓库/工作台现状（含证据） | 判定 |
|---|---|---|---|---|
| P2-1 | 新写一篇（创建会话 + 启动提示词） | ☐ 未接 | 仓库：**无初始化脚本**、**无 state.md 模板/schema**（§2.3/§2.4）；`state.md` 被 gitignore（`.gitignore:53`）。工作台：`gzh-workbench/index.js:730-787` 只注册了 env/bind/artifacts/read/gate/layout/publish **8 个命令**，无 new/note 类命令；`session/create` 通道 DSH 自带但计划 §7:602-603 自己标为"尚不确定、必须实测"。 | **未接，且仓库侧也缺落盘契约**。补齐顺序应为：先补 `state.md` 模板/schema → 再接 `session/create` + `session/prompt` |
| P2-2 | 记一笔（命令写 inbox） | ☐ 未接 | 仓库：**无写 inbox 的脚本**（`scripts/` 11 文件对 `inbox` 0 命中）；规范在 `assets/inbox.md:18-30`。工作台：无 `/gzh-note`。 | **未接；仓库缺脚本，Host 侧需自实现"按区追加 + 日期 + 来源 + 原子写 + 缺文件建骨架"**（§3.4） |
| P2-3 | 质检按钮（draft/html，`--json` 结构化展示） | ☑ 已完成 | **功能在本地可用**（实跑 `--json` 正常），工作台 `/gzh-gate` 已接（`index.js:773-779`、`client.js:1895`）。**但 4 个脚本的 `--json` 全是未提交工作区改动**：`git diff --stat` = ai_flavor_score.py +195 / check_image_prompt.py +80 / image_batch.py +125 / validate_gzh_html.py +202；`git show HEAD:scripts/ai_flavor_score.py \| grep -c json` = **0**；`origin/main` = 本地 HEAD = `3702335`。 | **勾选与 GitHub 现状不一致**（本地可用 ≠ 远端可用）。**最高优先级：先提交并推送这 4 个脚本** |
| P2-4 | 排版命令按钮 + 主题 + iframe 预览 + 复制（`/gzh-layout`） | ☑ 已完成 | 仓库：`scripts/md2wechat.py` 存在，`--enhance`/`--underline` 可用（`:366-368`）；实测已产出 `generated/draft_排版_zen.html`（9752 bytes）。工作台 `/gzh-layout` 已接（`index.js:780-786`、`:648-678`）。 | **一致**。唯一小问题：`md2wechat.py` **无 `--json` 且无 `sys.exit`**（恒 0，异常 → traceback + 1），计划附录 B 写的"0 / 2"是错的，Host 侧已按"code===0"判（`index.js:669`），实际可用 |
| P2-5 | 发布 dry-run 按钮（零风险、不取 token） | ☑ 已完成 | 仓库：`publish_draft.py:212` `--dry-run`、`:271-277` 取 token 前返回。工作台 `/gzh-publish` 已接但**硬拒真推**（`index.js:686-693`）。 | **一致** |
| P2-6 | 显式推送（两次点击 → 推草稿箱；凭据只留 Host） | ☐ 未接 | 仓库：**脚本已具备真推能力**（`publish_draft.py:309` `draft/add`）；**凭据有真值**（`config/publish.yaml` 的 `wechat.app_id/app_secret` 非占位符，18/32 位）；工具层已有 credentials→env 注入（`dsh-preset/tools/gzhflow-tools.mjs:296-310`）。缺：**封面前置产物**（`generated/` 里没有 cover.jpg）、Host 真推分支、UI 二次确认态、失败 stderr 展示。 | **未接；缺口在 Host/UI 层，不在仓库层**（这是好消息） |
| P2-7 | 取消运行（`session.cancel`） | ☑ 已完成 | 纯 DSH 能力，与仓库无关；计划 `:509`/`:555` 记录已实测。 | **一致** |
| P2-8 | 断点续跑提示（state.md 已有 run step，UI 尚未做成卡片） | ☐ 未接 | 仓库：**数据齐**——`state.md:42-43` 有 `run step:` / `已完成:`；字段规范 `prompts/00-run.md:42-48`；取值域 `state.md:34`。工作台已能 `/gzh-read state.md`。 | **未接，但只差 UI 卡片 + 解析**（计划 §5.7:442 已规定解析器只认固定行）。**最省力的一项** |
| P2-9 | 配图 manifest 表格 + 预算单只读展示 | ☑ 已完成 | 仓库：manifest 结构定义在 `scripts/image_batch.py:8-23` + `examples/image-manifest.example.json`；`--plan-only --json` 已实现（工作区）。**但当前 `generated/` 里没有 manifest.json、没有预算单**。 | **功能已接，但当前无样本可显示**（数据空，不是能力缺） |

### 8.2 P3（计划 `:561-568`，全部未勾选）

| # | 计划条目 | 仓库侧现状 | 缺口定位 |
|---|---|---|---|
| P3-1 | 四库只读视图 + 复盘页 | **路径与格式全部明确**（§5.1），**且没有任何查看脚本**——不需要脚本，Host 直接读文件（`workspaceFiles.read` 需 sessionId，计划 §7:587） | **仓库零缺口**。工作台需做：四库只读渲染 + 空态（大部分库记录区是空的，**必须设计空态而不是报错**） |
| P3-2 | 手改 diff + learned-edits 记录 | `learned_edits.py` 可用（exit 0/2/4），但**缺两个输入文件的产出链**（`draft_ai.md` / `draft_user.md` 无脚本产出、`generated/` 里也没有）；**无 `--json`**、**无"列出已有记录"接口** | **需补三件**：① 机器稿/手改稿的文件名约定或产出脚本；② 已有记录的读取/统计（读 `assets/learned-edits.md` 解析 `## 日期｜kind` + diff 块即可，不必新脚本）；③ 工作台 diff 视图（可调脚本取 diff 文本，或前端自算） |
| P3-3 | 历史文章列表与回放 | 仓库**无文章索引**（§6.1：`log.md` 记录区空且无路径映射、`generated/` 扁平且 gitignore、无 archive/索引文件） | **列表只能来自 DSH `session/list`**（筛 cwd）+ `session/page` 回放（能力已有）；需约定"会话↔文章"的映射（`session/rename` 用文章标题，计划 §5.4:382）。**若另建索引文件 → 触碰 C1 单源纪律** |
| P3-4 | 键盘快捷键（通过/退回/上下篇） | 纯 UI，无仓库依赖 | **可做**；「上下篇」依赖 P3-3 的排序依据 |
| P3-5 | 中英 locale、暗色模式细节、小屏适配 | 工作台已有 `gzh-workbench/locale/` 目录 + client 已注册 locale service（`client.js:3320` 'gzh-workbench: locale'） | **locale 基本已存在**，剩余是暗色细节与小屏适配 |
| P3-6 | 首次使用引导 | 素材齐：`docs/quickstart.md`、`config/*.example.yaml`（4 个模板）、`assets/voice-samples/README.md:29-64`（四路径自建范文锚）、`SKILL.md:13-23` §0 启动必读 | **仓库零缺口**，只需 UI 文案 + "缺文件时给可执行建议" |

### 8.3 计划文档自身与仓库实际不符之处（写新计划时勿照抄）

| # | 不符点 | 证据 |
|---|---|---|
| A | **§5.7:415** 说"三个 gate 脚本只有人类可读输出"，**§5.7:433-438** 说"已实现"——但仓库 HEAD 里 `ai_flavor_score.py` / `check_image_prompt.py` / `validate_gzh_html.py` 的 json 计数是 **0/0/0**，`image_batch.py` 在 HEAD 只有 `json.loads` 没有 `--json` | `git show HEAD:<file> \| grep -c json`；`git diff --stat` |
| B | **附录 B:669** 写 `md2wechat.py` 退出码 `0 / 2`——实际该文件**没有任何 `sys.exit`**，恒 0，异常时 traceback + 1 | `grep -n "exit" scripts/md2wechat.py` → 0 命中 |
| C | **`scripts/upload_gif.py` 的凭据路径是遗留 Windows 时代的 `~/.baoyu-skills/.env`**（`:41`、`:117-121`），与 `publish_draft.py` 的 `config/publish.yaml` 不同源。工作台若接 GIF 会踩坑 | `scripts/upload_gif.py:41` |
| D | **`state.md:13` 的仓库路径已过期**（写的是 `~/WorkBuddy/gzhflow/`，实际 `~/WorkBuddy/Andiii碎碎念/gzhflow/`） | `state.md:13` vs 实际路径 |
| E | 工作区当前有 **4 个 M 状态文件**（未提交），工作台运行时读的就是这份工作区，**不是 GitHub** | `git status --porcelain` |
| F | 计划 §2.7:136 写的卡点"三个 gate 脚本无 `--json`"已经**过时**（本地工作区有了，仓库没有） | 同 A |

---

## 9. 给主 Agent 的补齐清单（按依赖顺序）

**第 0 步（先做，否则后面全是空中楼阁）**
1. 提交并推送 4 个脚本的 `--json` 改动（`ai_flavor_score.py` / `check_image_prompt.py` / `image_batch.py` / `validate_gzh_html.py`），或明确接受"工作台只在本地工作区跑"。
2. 补 `config/publish.example.yaml` 等 example 的完整性自检；确认 `config/publish.yaml` 的凭据不会被误提交（`.gitignore:10` 已覆盖）。

**第 1 步（仓库侧契约，挡住 P2-1/P2-2）**
3. 新增 `examples/state.example.md`（state.md 的模板 + 字段表：状态取值域 / 模式 / run step / 已完成），并在 `SKILL.md` 或 `AGENTS.md` 指向它 → 让"新写一篇"有唯一落盘契约，不新增真源。
4. 新增 `scripts/inbox_note.py`（或等价 Host 命令规范）：按区追加、日期前缀、来源标注、原子写、文件缺失建骨架、路径白名单校验。

**第 2 步（工作台 Host 命令层）**
5. `/gzh-new`（或复用 `session/create`+`session/prompt`）：启动提示词按 `SKILL.md` 七阶段 + `AGENTS.md:37,46,47` 组装（读 state.md / 素材先行 / ①②③ 停靠点 / 不编造）。
6. `/gzh-note`：`scripts/inbox_note.py` 或等价实现（走 §5.9:463 白名单）。
7. `/gzh-publish` 真推分支：凭据优先 DSH credentials → config 兜底，**明文不下发浏览器**，失败展示 stderr 原文；UI 两次 inline 确认（§5.9:464）。
8. `/gzh-learned`：调 `learned_edits.py --append`，并提供"列出已有记录"（读 `assets/learned-edits.md` 解析）。

**第 3 步（前端，P3）**
9. 四库只读视图（路径/格式见 §5.1，**重点设计空态**——4 个库的记录区都是空的）。
10. 断点续跑卡片：只认 `state.md` 的 7 个固定行（计划 §5.7:442）。
11. 历史列表：从 `session/list`（筛 cwd）+ `session/page`；不要在仓库里另建索引（C1）。
12. locale / 暗色 / 小屏 / 首次引导：仓库素材已齐（§8.2 P3-5/P3-6）。

**已知不做（明确排除）**
- 工作台不重写提示词/质量门（C6）；不缓存 `state.md` 成数据库（C6）；不做"一键优化到通过"（B7⑦）；不做"一键发布"（A8，只有推草稿箱）；不把 `draft_ai.md`/`draft_user.md` 的产出逻辑塞进 UI（应在流程层解决）。

---

*本文件由只读审计生成，未修改 gzhflow 仓库任何文件，未执行任何 git 写操作。*
