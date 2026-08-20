# TaiT CRT Interface Skill — 第三方风格引擎拆解（2026-08-06 调研）

来源：GitHub `TaiT-tt/tait-crt-interface-skill`（约 77 stars，Codex 图片生成 skill）。
定位：把上传人像/摄影/文字描述重构为 80 年代 CRT 电脑界面复古插画（早期 Macintosh / Minitel / 8-bit）。
结构：`SKILL.md`（工作流+构图规则+质量门槛）+ `references/palettes.md`（色卡登记）+ `references/requirements.md`（需求账本）+ `scripts/finalize_crt.py`（后处理）+ `assets/`（色卡图）+ `agents/openai.yaml`（Codex 元数据）。

## 架构六件套（值得借鉴）

1. **两阶段输入门**：先问色卡（图片展示，一次只问一个问题），再问比例（3:4/4:3/9:16/16:9，可自定义）。两字段齐了才生成，绝不静默代默认值；已有字段跳过对应问题。
2. **色卡登记（palette registry）**：命名色卡 + `如图`（从参考图情绪/氛围推导 2-5 色）。按感知亮度排序取最亮/最暗为对比端点。
3. **全局像素网格**：基础格 `p ≈ 短边/384`，主体/窗口/文字/图标共用同一网格——从 prompt 层杜绝"主体像素比 UI 像素粗"的破绽。禁止半格/拉伸/旋转/错位/碎像素；斜线用整数阶梯。
4. **变化引擎**：14 个轴（位置/裁剪/覆盖率/窗数/星座布局/大小层级/主应用/提取数/提取几何/卡通处理/夸张突变/中间调映射/极性/信号强调）组合防雷同，改布局语法不是只挪位置。
5. **后处理脚本兜底**：模型不听话时脚本强制色卡量化 + 网格 + 桶形畸变 + 署名（见下）。
6. **质量门槛 + 固定署名**：生成前 preflight、生成后 11 条验收清单、不自动重试；右上角固定署名 `tait-crt-interface-skill`（品牌标识，硬性不可移除）。

## 色卡（palettes.md 原文）

| 名称 | 色值 |
|---|---|
| 经典 | `#dee4e0` `#2e382d` |
| 粉黛 | `#f2d1d7` `#7a3f43` |
| 极客01 | `#f2fcf6` `#485446` `#07100b` `#13f81f` |
| 极客02 | `#e8e5df` `#2ca770` `#0d3d2d` `#3e6a9e` |
| 游戏01 | `#e7f5fe` `#7befa4` `#2fd9e7` `#ef9b9b` `#03101b` |
| 游戏02 | `#efca54` `#5d9f58` `#e870a1` `#bbb8a5` `#49473c` |
| 如图 | 从参考图推导 2-5 色，须含明显亮/暗对比对，合并近重复色 |

**中间调规则**：光学灰只用最暗+最亮色交替棋盘格（50% 交替）表示，覆盖可见主体约 15-35%，禁止自造灰/渐变/抗锯齿。棋盘格要成片连接，不是散点噪声。

## finalize_crt.py 机制

- `--palette` 2-5 个 `#rrggbb`，去重校验；`--polarity positive|negative|preserve`（亮场/暗场/保持）
- `endpoint_roles()`：按 Rec.709 亮度排序取最亮/最暗为端点；`projection_to_light()`：像素投影到端点线段后量化回色卡
- `--edge-warp 0.12`：外 10% 径向桶形畸变（nearest-cell 位移，角比边心压缩更强），内 80% 稳定
- `--grid-cell 0`：自动取短边/384 网格量化
- 内置 5x7 位图字体绘制固定署名（`PIXEL_FONT_5X7` 字典，逐字符画）
- 运行命令：`<bundled-python> scripts/finalize_crt.py --input <gen> --output <final> --palette hex,hex --polarity positive --grid-cell 0 --edge-warp 0.12`

## 质量门槛要点（11 条摘录）

- 主体是**独立创作的卡通**：只保留 3-5 个身份锚点、≥3 处结构关系改动、2-3 处大胆夸张、5-9 个大块面；silhouette 不得与参考图轮廓重合，去掉 UI/纹理后不得露出滤镜照片底子
- 全局同一 `p` 网格，无半格/拉伸/错位/碎像素
- 单主体无边框壁纸占画面 50%+（目标 60-80%），不得重复出现
- 1-3 个特征提取窗（局部特写），互相尺寸和比例都不同
- 视窗 3-6 个、多象限分布、保 20-30% 连通留白
- 外 10% 四边桶形畸变明显（长线可见弯曲），内 80% 稳定

## Hermes 迁移要点

- Codex 专属依赖：内置 `image_gen`（支持参考图）+ `codex_app__load_workspace_dependencies`（返回自带 Pillow 的 Python）
- **Wan2.7-Image 纯文生图、不吃参考图** → "传图变 CRT" 场景必须走 GPT Image 后端（baoyu-image-gen）
- 署名 `tait-crt-interface-skill` 是硬性品牌标识，移植给公众号用必须改成自己的
- 纯文生图档位：保留色卡+全局网格+棋盘格+畸变约束，只做文字描述生成（skill 也鼓励"纯文字抽象意象"玩法）

## 评估第三方生图 skill 的通用流程（本会话验证）

1. `api.github.com/repos/<owner>/<repo>/git/trees/main?recursive=1` 拿完整文件清单（含中文目录名 URL 编码）
2. `raw.githubusercontent.com/<owner>/<repo>/main/<path>` 下载 SKILL.md / references / scripts
3. 下载生成示例图，vision_analyze 对照 spec 逐条验证（色卡是否锁死、棋盘格中间调、桶形畸变、署名）——**示例图是 spec 是否被真实执行的证据**
4. 看 `agents/*.yaml` 确认绑定的平台与模型（openai.yaml 声明 Codex 专用）
5. 迁移评估三问：后端能力边界（能否吃参考图）？平台专属 API 依赖？品牌署名冲突？
