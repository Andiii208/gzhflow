# Security Policy

## 安全承诺

gzhflow 是「工作流框架 + 纯脚本工具」，核心安全风险是**凭证泄漏**。本项目从设计上最小化这一风险。

## 凭证处理原则

1. **仓库内绝不出现真实凭证**：AppSecret / API Key / access_token 一律只存在于本地（`.env`、`config/*.yaml`，均已 gitignore）。
2. **仓库内只有占位符**：`config/publish.example.yaml` 等模板文件使用 `your_app_id` / `REDACTED` 占位。
3. **CI 强制扫描**：`.github/workflows/ci.yml` 内置 gitleaks 全历史 secret 扫描，误提交即阻断。
4. **本地校验兜底**：`scripts/validate_repo.py` 内置 secret pattern 快扫（`sk-` / `WECHAT_APP_SECRET` / access_token 等）。

## 上报漏洞

若发现安全漏洞，请勿在公开 issue 中暴露细节。请通过 GitHub 私密渠道或邮件联系维护者。

## 使用微信 API 的安全提示

- AppSecret 只在「开发者平台启用开发者密码」时显示一次，请立即保存。
- 微信 API 需配置 **IP 白名单**，非白名单 IP 调用返回 `40164 invalid ip`。
- access_token 有效期 7200 秒，`publish_draft.py` 每次调用临时获取，不落盘、不打印到日志。
- 不要在文章正文/HTML 中嵌入任何凭证或内部信息。
