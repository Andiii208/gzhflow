# gzhflow 升级记录 — 炼化 andiii-wechat-workflow 实战资产

> 本次升级把用户原仓库 `Andiii208/andiii-wechat-workflow` 中经过实战锤炼的成熟能力炼化进 gzhflow，补齐骨架之外的深度资产。

## 一、新增：gzh-design 排版引擎（最大项）

`skills/gzh-design/` — 完整迁移自源仓库 gzh-design-skill：

| 类别 | 内容 |
|---|---|
| 主题组件库 ×6 | zen-whitespace（留白禅意）/ moyu-green（摸鱼绿）/ red-white（红白）/ graphite-minimal（石墨极简）/ moyu-ticket（摸鱼票据）/ olive-journal（橄榄手记） |
| 主题索引 | theme-index.md（主题路由单一来源：主色/适用场景/组件库/下划线 CSS） |
| 通用组件库 | common-components.md（代码块 1a/1b/1c、图片/GIF 2a/2b/2c、小标签 3a-3e） |
| 主题生成器 | theme-generator.md（自定义主题流程：偏好收集→区块库→转标准库→登记） |
| 校验脚本 | component_lint.py（组件库源头检查，已修 Windows GBK 编码）+ validate_gzh_html.py |
| 预览交付 | wrap_preview.py（生成带「复制到公众号」按钮的预览页，已修 GBK） |
| 其他 | format-normalize.md（docx/pdf/txt 归一化）、eval-cases.md（回归用例）、assets/ 模板 |

**排版能力升级**：章节自动编号（01/02/03，结语 ∞）+ 英文标签 + 关键词下划线（每段 1-3 个，theme-index 权威色值）+ 引言卡 + 目录导读 + 金句块 + 图片细线边框 + END 分隔线 + 签名区 + 三层视觉层级（锚点/标记/容器）。

## 二、新增 references（实战经验库）

| 文件 | 内容 |
|---|---|
| style-rejection-cases.md | 文风被否案例库（案例 1-4 逐版复盘，写作前必读） |
| style-reference-accounts.md | 公众号文风参考号库 + 蒸馏方法论 |
| real-image-collection.md | 真实图渠道库（网上找合规真实图） |
| image-style-routing.md | 配图风格路由 + 图源三问决策 |
| inline-illustration-workflow.md | 正文内文配图工作流 |
| long-image-layout.md | 纯图长图排版管线 |
| draft-verification.md | 草稿推送后校验 |
| draft-box-housekeeping.md | 草稿箱清理运维 |
| account-permissions.md | 公众号 API 权限实测矩阵 |
| wechat-ecosystem-projects-2026-08.md | 公众号生态工具调研 |
| tech-share-article-lessons.md / web-research-deai-illustration-2026-08.md | 技术分享/配图经验 |

## 三、新增：配图风格引擎 ×4

`examples/image-engines/` 从 1 套扩到 5 套（炼化自源仓库风格 skills）：
- 01-watercolor（手绘水彩）→ 02-zine（拼贴档案）→ 03-sketchy（潦草手账）→ 04-minimal（石墨极简）→ 05-heytear（喜茶拙趣）

## 四、SKILL.md 流程升级

- ④配图：接入图源三问 + real-image-collection 渠道 + 5 引擎路由
- ⑤排版：从"极简 md2wechat"升级为"主题组件库装配"——选主题→读组件库→按配方装配（章节编号/下划线/引言卡/END/签名）→ component_lint + validate 双校验 → wrap_preview 预览交付 → 平台红线清单

## 五、修复

- component_lint.py / wrap_preview.py：Windows GBK 控制台 UTF-8 兼容
- upload_gif.py：补 UTF-8 重配置

## 六、第二批补全（2026-08-20 第二轮盘点）

初次迁移后复查，发现以下精华仍未炼化，全部补齐：

### 6.1 写作风格引擎 → `skills/andiii-writing-style/`
完整迁移（264 行）：诚实第一原则、6 公众号风格路由表、双模式写作体系（模式A 个人感悟 / 模式B 知识输出）、标题公式库、自检四问 + 人味自检、排版规范、写作陷阱（用户实测踩坑）、写作工作流、共鸣技法、参考源速查。

### 6.2 AI 图生引擎 → `skills/ai-image-style-engine/`
完整迁移：AGNES 生图配置、外部风格移植方法论、heytear 真实风格参考、tait CRT 接口、batch_gate_check.py 批量质检。

### 6.3 针管笔风格 → `skills/andiii-crt-style/`
完整迁移：黑白针管笔 SKILL + check_crt_prompt.py 质检 + finalize_crt.py 管线；另提炼 `examples/image-engines/06-crt.yaml`（第 6 个配图引擎）。

### 6.4 专项工作流 references（+18 篇）

| 类别 | 文件 |
|---|---|
| 文风蒸馏 | style-distillation-workflow.md（8 维度完整流程）、style-analysis-template.md（分析模板）、andiii-style-distillation-output.md（蒸馏实例）、collecting-source-articles.md（文章采集）、extract-biz-from-article.md |
| 音乐类专项 | music-article-workflow.md、netease-hot-comments.md（热评抓取）、netease-playlist-data.md（歌单数据）、playlist-summary-workflow.md（年度报告式）、playlist-illustration-imagery.md（音乐物件意象） |
| 写作教训 | friendship-article-rejection-case.md、qixi-aphasia-rejection-case.md、dual-theme-article-lesson-2026-08.md、info-overload-narrative.md、hot-topic-transcription-workflow.md |
| 安全与运维 | secret-leak-response.md（凭证泄露响应）、setup-notes.md（安装记录）、agnes-image-gen.md（图生后端配置） |

### 6.5 动图直传 → `scripts/upload_gif.py`
绕过微信 gif→静态帧转换，media/uploadimg 直传保留动图（DeepSeek 事件实测，见 hot-topic-transcription-workflow.md）。

### 6.6 SKILL.md 写作层升级
②写作引入 andiii-writing-style：风格路由表 + 双模式体系 + 标题公式库 + 人味自检 + 写作陷阱；③去AI味补充人味检查项。

### 6.7 工程修复
- validate_repo.py：check_refs 支持 skill 内嵌 references（三种路径写法：仓库根 / skill 内嵌 / 完整相对路径），并去重完整路径与短路径的重复报错
- 补充跨 skill 引用资产：zine-prompt-library.md、muted-zine-upstream.md（ai-image-style-engine 引用）
- 最终 `python scripts/validate_repo.py` ✅ 通过
