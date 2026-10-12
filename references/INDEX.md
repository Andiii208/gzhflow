# references 索引（按阶段路由）

这个文件存在的理由：`references/` 攒了 39 份方法论，但**只有 8 份被 SKILL.md 或 prompts 显式点名**，
剩下 30 份基本处于"谁也读不到"的状态——2026-10-12 实测，其中 17 份全仓只有一个入链，
而且那个入链来自历史文档，不是活流程。

值钱的东西锁在抽屉里等于没有。所以有了这张表：**每个阶段该翻哪几份，一目了然。**

## 用法

跑流程时按阶段来，先读本表对应那一节，再决定要不要展开原文。
不是每份都要读——**按标题对上了再点开**，别一次全加载。

---

## ⓪ 启动（任何会话第一步）

| 文件 | 什么时候读 |
|---|---|
| `../state.md` | **每次会话第一件事**。当前进行到哪、待办、上下文 |
| `../assets/inbox.md` | 阶段① 前。日常"记一笔"攒的素材 |
| `../assets/voice.md` | 阶段② 前。我是谁、节奏、标题公式 |
| `../assets/voice-samples/README.md` | 阶段② 前。范文锚（**目前为空，是最大缺口**） |
| `../assets/lessons.md` | 被否 2-3 次时。防坑总表，15 条 |
| `../assets/learned-edits.md` | 阶段⑦。手改记录，蒸馏回写各库的原料 |
| `../assets/cover-preferences.md` | 阶段④/⑦。认可与否掉的封面，攒够进 `anchors/` |
| `../assets/log.md` | 阶段⑦ 前。发文日志 |

## ① 素材先行

| 文件 | 解决什么 |
|---|---|
| `collecting-source-articles` | 素材从哪来（含 Windows 工具残留，Mac 上要找替代） |
| `hot-topic-transcription-workflow` | 热点转选题的完整流程 |
| `netease-hot-comments` | 网易云热评当素材 |
| `seed-inbox-2026-10-12` | 收件箱首批种子，用前先让用户逐条确认 |

## ② 写作

| 文件 | 解决什么 |
|---|---|
| `style-routing` | 文风路由主文档 |
| `style-reference-accounts` | 6 个参考公众号的详细风格特征 |
| `style-analysis-template` | 逐篇文风分析卡模板 |
| `style-distillation-workflow` | 怎么从一批文章蒸馏出风格（含并行分析技巧） |
| `andiii-style-distillation-output` | 22 篇蒸馏项目的产出摘要 |
| `extract-biz-from-article` | 从文章里挖选题 |
| `info-overload-narrative` | 信息过载类题材怎么写 |
| `music-article-workflow` | 音乐向文章流程 |
| `playlist-summary-workflow` | 歌单向文章流程 |

## ③ 去 AI 味

| 文件 | 解决什么 |
|---|---|
| `de-ai-craft` | **三层去味主手册**（语言层 / 结构层 / 声音层） |
| `style-rejection-cases` | 文风被否的案例集 |
| `friendship-article-rejection-case` | 友情向文章被否 6 次的完整复盘 |
| `qixi-aphasia-rejection-case` | 失语症：有素材写不出来的案例 |
| `tech-share-article-lessons` | 技术分享文的教训 |
| `dual-theme-article-lesson-2026-08` | 双主题文章的坑 |
| `web-research-deai-illustration-2026-08` | 去味 + 配图的检索笔记 |

## ④ 配图

| 文件 | 解决什么 |
|---|---|
| `image-routing` | 配图总路由 |
| `image-style-routing` | 图源三问 + 风格路由 + 文章实体统一色板 |
| `cover-design` | 封面两件套（2.35:1 头图 + 1:1 分享卡）+ 构图类型 + 封面学习环 |
| `design-reasoning` | 设计推理 6 问 |
| `real-image-collection` | 真实图渠道库 |
| `agnes-image-gen` | Agnes 图生脚本（在仓库外，Mac 上要重接） |
| `inline-illustration-workflow` | 内文插画流程 |
| `playlist-illustration-imagery` | 歌单配图意象 |
| `long-image-layout` | 长图排版（含 Windows msedge 残留） |
| `netease-playlist-data` | 网易云歌单数据 |

## ⑤ 排版

| 文件 | 解决什么 |
|---|---|
| `theme-routing` | 主题路由 + md2wechat 用法 |
| `wechat-ecosystem-projects-2026-08` | 微信生态项目盘点 + A/B 实测记录 |

## ⑥ 发布

| 文件 | 解决什么 |
|---|---|
| `wechat-api-guide` | **微信 API 主文档**（含 40164 IP 白名单） |
| `draft-verification` | 草稿箱核验（含大量 Windows 路径残留） |
| `draft-box-housekeeping` | 草稿箱日常维护 |
| `account-permissions` | 账号权限边界（个人号能干什么） |
| `secret-leak-response` | 凭据泄露了怎么办 |
| `setup-notes` | 安装记录（Windows Hermes 时代，已过时） |

## 质量门（跨阶段）

| 文件 | 解决什么 |
|---|---|
| `quality-gates` | 三层门的设计与分工 |

---

## 已知的 Windows 残留（Mac 上要么改要么标注失效）

这几份的操作步骤是在 Windows 上写的，`conversation_search` 捞不回原文细节，
要么按 Mac 重写，要么在文件头加一句"以下路径为 Windows，Mac 上不成立"：

- `collecting-source-articles`（依赖 `D:\tools\wechatDownload\...exe`）
- `long-image-layout`（`msedge --headless --screenshot`）
- `draft-verification`（满篇 `C:/Users/26895/...` + MSYS 路径坑）
- `setup-notes`（`~/AppData/Local/hermes/skills/`，已完全过时）
- `wechat-ecosystem-projects-2026-08` L49（Windows cmd 代码页乱码的坑，Mac 上不成立）
