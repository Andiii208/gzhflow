# 快速上手（Quickstart）

> 3 分钟跑通 gzhflow。前提：已安装 Python 3.9+。

## 第 1 步：复制配置

```bash
cp config/workflow.example.yaml config/workflow.yaml
cp config/styles.example.yaml config/styles.yaml
cp config/themes.example.yaml config/themes.yaml
cp config/publish.example.yaml config/publish.yaml
```

> Windows（PowerShell）：`Copy-Item config\workflow.example.yaml config\workflow.yaml` 等。

## 第 2 步：编辑配置

- `config/workflow.yaml`：作者名、审核模式（默认 strict）、是否启用配图（默认关）
- `config/styles.yaml`：换成你自己的文风（参考 `examples/styles/`）
- `config/themes.yaml`：排版主题路由（默认 zen/minimal 已可用）
- `config/publish.yaml`：微信公众号 AppID/AppSecret（本地文件，已 gitignore）
  - 也可用环境变量 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`

## 第 3 步：自检工具链

```bash
python scripts/validate_repo.py
```

应输出：`✅ 校验通过：链接 / references / secrets / frontmatter 全部正常`

## 第 4 步：开始写作

对任意 Agent（Claude Code / Cursor / Codex / Gemini CLI / Qwen Code / DeepSeek / Hermes）说：

```
用 gzhflow 工作流写一篇关于 <你的主题> 的公众号文章
```

Agent 会按六阶段执行：
1. 素材先行（问你 3-5 个问题）
2. 写作（按你 config/styles.yaml 的文风）
3. 去 AI 味（机器门 + 自检）
4. 配图（如启用）
5. 排版（md2wechat.py）
6. 推草稿箱（如配置了发布凭证）

每个阶段产出给你审阅，确认后进入下一阶段。

## 第 5 步：发布

- 推送成功后：打开「公众号助手 App → 草稿箱」→ 检查 → 点发布
- 未配置发布凭证：Agent 会交付排版 HTML，你到 mp.weixin.qq.com 后台手动粘贴

## 快速验证脚本（不连微信）

```bash
# 写一篇样例稿
cat > generated/sample.md <<'EOF'
---
title: 测试文章
author: 测试作者
---
今天是个好天气，出门走了一圈。
回来的时候，突然想到一些事情。
**这是加粗的关键句。**
EOF

# 排版
python scripts/md2wechat.py generated/sample.md --theme zen

# 校验 HTML
python scripts/validate_gzh_html.py "generated/sample_排版_zen.html"

# 去 AI 味检查
python scripts/ai_flavor_score.py generated/sample.md
```

## 常见问题

| 问题 | 解决 |
|---|---|
| `validate_repo.py` 报 secret | 检查是否误提交了真实凭证，改为占位符 |
| `ai_flavor_score.py` 报破折号 | 签名行/落款的破折号需先剥离（脚本自动处理），正文破折号改掉 |
| 推送报 40164 | IP 白名单：把报错里的 IP 加到开发者平台（见 references/wechat-api-guide.md） |
| 不想配 API | 只跑阶段①-⑤，产物 HTML 手动粘贴发布 |
