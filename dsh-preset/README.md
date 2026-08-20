# gzhflow DSH Preset

把 gzhflow 六阶段公众号工作流适配为 DeepSeek Harness（DSH）的 Agent Preset。
选择该预设后，会话自动获得：六阶段流程纪律（persona）、6 个质检门 DSH 工具、发布凭证接线。

## 安装

```bash
# Windows
powershell -ExecutionPolicy Bypass -File dsh-preset/install.ps1
# macOS / Linux
bash dsh-preset/install.sh
```

（在仓库根目录运行）

安装脚本把 `dsh-preset/` **拷贝**到 `~/.dsh/.agent-presets/gzhflow/`（真实目录，非链接——DSH 预设发现不跟随 junction/symlink），
并在同目录写 `.gzhflow-repo` 指针文件记录仓库路径（工具经它定位 `scripts/`）；把 `skills/gzhflow/` 链接到 DSH skill 目录。
重复安装幂等（已存在则跳过，检测到旧链接安装会自动重建为真实目录）。

> 改 `dsh-preset/` 内文件后重跑安装脚本同步；`scripts/` 与 `skills/` 的改动经仓库指针 / skill 链接即时生效，无需重装。

## 使用

1. 在 DSH 新建会话，选择预设「gzhflow 公众号主编」。
2. 会话开始会自动做**环境自检**（`gzhflow_check_env`），按结果引导你配置，然后才开始流程。
3. 说「用 gzhflow 写一篇关于 XX 的文章」。
4. 按六阶段推进：每阶段跑对应 gzhflow_* 工具质检，①②③ 完成输出全文审阅。

## 首次使用：环境自检（必读）

预设会话的第一步是 `gzhflow_check_env` 环境自检，凭据分**必填 / 选填**两档：

| 配置项 | 级别 | 不配置会怎样 |
|---|---|---|
| `WECHAT_APP_ID` / `WECHAT_APP_SECRET`（公众号） | **必填** | 阻塞：引导你填好之前不开始写作流程（发布是必经阶段） |
| `image_backend`（base_url/model，config/workflow.yaml） | 选填 | ④配图走真实图轨：用你提供的素材图，或 AI 用 web_search 找合规真实图 |
| `IMAGE_API_KEY`（图生 key，.credentials.yaml） | 选填 | 同上；想用 AI 生图时再配置 |

**配置方式**：编辑 `~/.dsh/.credentials.yaml` 与仓库 `config/workflow.yaml`（见下两节），保存即生效。

## 凭证（必填，仅发布阶段用）

推草稿箱需要公众号 AppID/AppSecret，存于 DSH 凭据存储（`~/.dsh/.credentials.yaml`，0600，不写入本仓库）：

- 编辑 `~/.dsh/.credentials.yaml`，追加两行（等号右侧填你的真实值）：

```yaml
WECHAT_APP_ID: <你的AppID>
WECHAT_APP_SECRET: <你的AppSecret>
```

保存即生效（凭据存储热发布外部编辑）。注意：DSH 的 Models 设置页只管理模型 API key，自定义凭据需直接编辑该文件。

未配置时 `gzhflow_publish_draft` 返回友好错误提示配置，不会泄露或误用。

## 图生后端（仅④配图阶段需要）

`gzhflow_generate_image` 调用 OpenAI 兼容 `/images/generations` 端点，需要两处配置：

1. **后端定义**：复制仓库 `config/workflow.example.yaml` 为 `config/workflow.yaml`，填 `image_backend`：

```yaml
image_backend:
  base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1"  # 你的服务商（DashScope/MiniMax/OpenAI 等兼容端点）
  model: "wanx2.1-t2i-turbo"      # 模型名按服务商文档填
  api_key_env: "IMAGE_API_KEY"    # 默认 IMAGE_API_KEY
```

2. **API key**：编辑 `~/.dsh/.credentials.yaml` 添加：

```yaml
IMAGE_API_KEY: <你的图生服务商 API key>
```

未配置时 `gzhflow_generate_image` 返回可操作的引导提示（指出改哪个文件、填哪个键），不会静默失败。

## 工具一览

| 工具 | 对应脚本 | 用途 |
|---|---|---|
| gzhflow_deai_score | scripts/ai_flavor_score.py | 去 AI 味机器门（硬禁令清零） |
| gzhflow_check_prompt | scripts/check_image_prompt.py | 配图 prompt 质检门（PASS 才生成） |
| gzhflow_validate_html | scripts/validate_gzh_html.py | 排版 HTML 校验（0 ERROR） |
| gzhflow_md2wechat | scripts/md2wechat.py | Markdown → 公众号 HTML |
| gzhflow_generate_image | scripts/generate_image.py | 图生（OpenAI 兼容接口） |
| gzhflow_publish_draft | scripts/publish_draft.py | 推草稿箱（--dry-run 先验） |

## FAQ

- **脚本改仓库立即生效吗？** `scripts/` 与 `skills/` 是——工具经 `.gzhflow-repo` 指针定位仓库，skill 是链接；`dsh-preset/` 内文件（persona/工具模块/安装脚本）改动后重跑一次安装脚本即可同步。
- **凭证放哪里安全？** DSH 凭据存储（`.credentials.yaml`，0600）；不要写进 config/publish.yaml 或任何提交。
- **个人号能直接发布吗？** 不能（2025-07 起 freepublish 回收），只能推草稿箱 + 公众号助手 App 手动发布。
