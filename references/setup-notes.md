# baoyu-post-to-wechat 安装记录

安装日期: 2026-07-15
公众号: Andiii碎碎念 (WECHAT_APP_ID_REDACTED)

## 安装步骤

### 1. 安装 Bun
```bash
npm install -g bun
bun --version  # v1.3.14
```

### 2. 安装 baoyu-post-to-wechat skill
由于 `hermes skills install` 在国内网络下超时，改为手动安装：
```bash
cd ~/AppData/Local/hermes/skills/
git clone --depth 1 https://github.com/JimLiu/baoyu-skills.git baoyu-skills-tmp
mv baoyu-skills-tmp/skills/baoyu-post-to-wechat ./baoyu-post-to-wechat/
rm -rf baoyu-skills-tmp
```

### 3. 安装脚本依赖
```bash
cd ~/AppData/Local/hermes/skills/baoyu-post-to-wechat/scripts
bun install  # 164 packages
```

### 4. 配置凭证
`~/.baoyu-skills/.env`:
```
WECHAT_APP_ID=WECHAT_APP_ID_REDACTED
WECHAT_APP_SECRET=WECHAT_APP_SECRET_REDACTED
```

### 5. 配置偏好
`~/.baoyu-skills/baoyu-post-to-wechat/EXTEND.md`:
```yaml
default_author: Andiii碎碎念
need_open_comment: 1
only_fans_can_comment: 0
default_publish_method: api
```

### 6. IP 白名单
微信开发者平台 → 我的业务 → 公众号 → 基础信息 → 开发密钥 → IP白名单
添加: IP_REDACTED 和 IP_REDACTED

### 7. 验证
```bash
# 测试 access_token
curl -s "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=WECHAT_APP_ID_REDACTED&secret=WECHAT_APP_SECRET_REDACTED"

# 测试发布草稿
cd ~/AppData/Local/hermes/skills/baoyu-post-to-wechat/scripts
bun run wechat-api.ts article.md --theme default --author "Andiii碎碎念" --cover cover.png
```

## 结果
✅ 测试文章已成功推至草稿箱
