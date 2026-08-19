# 微信公众平台 API 指南（WeChat API Guide）

> 阶段⑥ 发布层的技术文档。涵盖：权限矩阵（2025-2026 现状）、接入步骤、常见错误与踩坑。
> 事实来源：微信官方文档（developers.weixin.qq.com），2026-08 核实。

## 一、权限矩阵（2026-08 核实）

| 接口 | 路径 | 个人订阅号 | 认证服务号 | 说明 |
|---|---|---|---|---|
| 获取 access_token | /cgi-bin/token | ✅ | ✅ | 凭 AppID + AppSecret |
| 上传图片（正文） | /cgi-bin/media/uploadimg | ✅ | ✅ | 返回 https URL |
| 上传素材（封面等） | /cgi-bin/media/add_material | ✅ | ✅ | 需 type=image |
| **新增草稿** | /cgi-bin/draft/add | ✅ | ✅ | **推草稿箱主路径** |
| 更新草稿 | /cgi-bin/draft/update | ✅ | ✅ | |
| 获取草稿列表 | /cgi-bin/draft/batchget | ✅ | ✅ | 重推前拉用户版本用 |
| 删除草稿 | /cgi-bin/draft/delete | ✅ | ✅ | 防草稿箱堆积 |
| **发布草稿** | /cgi-bin/freepublish/submit | ❌ | ✅ | **2025-07 起个人主体回收** |
| 群发 | /cgi-bin/message/mass/* | ❌ | 认证号部分可用 | |

> ⚠️ **关键现实**：个人主体公众号（绝大多数个人号）2025-07 起**无法 API 直接发布**（freepublish 回收）。唯一合规路径：**API 推草稿箱（draft/add）→ 用户在「公众号助手 App」手动点发布**。gzhflow 按此设计。

## 二、接入步骤

1. **注册公众号**：mp.weixin.qq.com（个人订阅号即可，需实名）
2. **开启开发者密码**：登录 https://developers.weixin.qq.com → 我的业务 → 公众号 → 基础信息 → 开发密钥 → 启用
   - ⚠️ 2025 年 12 月起，开发接口管理从 mp.weixin.qq.com 迁移至开发者平台
   - ⚠️ **AppSecret 只显示一次**，立即复制保存，丢失只能重置
3. **配置 IP 白名单**：开发者平台 → 我的业务 → 公众号 → 基础信息 → 开发信息 → API IP 白名单
   - 添加调用机器的出口 IP（见下节诊断）
   - 实测添加后立即生效，无需等待
4. **配置凭证**：写入本地 `.env`（`WECHAT_APP_ID` + `WECHAT_APP_SECRET`）或 `config/publish.yaml`（已 gitignore）

## 三、常见错误

| 错误码 | 含义 | 解决 |
|---|---|---|
| 40164 invalid ip xxx | IP 不在白名单 | 把报错里的 IP 加入白名单（见下节） |
| 40001 invalid credential | access_token 无效/过期 | 重新获取（7200s 有效期） |
| 40003 invalid openid | openid 错误 | 本框架不涉及粉丝，忽略 |
| 45009 api freq out of limit | 接口调用频率超限 | 降频 |
| 48001 api unauthorized | 无权限 | 该接口对当前账号类型不可用（如个人号调 freepublish） |

## 四、IP 白名单深度诊断

- 家庭宽带 IP 动态，会不定期失效 → 报 40164 时以**报错里的 IP 为准**（可能与你 `curl ifconfig.me` 看到的不同）
- 代理/梯子环境下：`curl ifconfig.me` 看到的是代理出口 IP，但微信 API 可能走直连 → 两个 IP 都加
- 根治方案：固定 IP 服务器（云主机）中转，或临时切换网络模式

## 五、publish_draft.py 使用

```bash
# dry-run（不碰微信，零风险验证全链路）
python scripts/publish_draft.py <排版.html> --title "标题" --author "作者" --summary "摘要" --cover cover.jpg --dry-run

# 正式推草稿箱
python scripts/publish_draft.py <排版.html> --title "标题" --author "作者" --summary "摘要" --cover cover.jpg
```

- 自动处理：取 token → 上传正文图片（media/uploadimg，重写为 https URL）→ 上传封面（media/add_material）→ draft/add
- 凭证读取优先级：命令行参数 → 环境变量 → config/publish.yaml
- 成功返回 `media_id`（草稿箱 ID）

## 六、进阶踩坑（实战沉淀）

- **草稿箱堆积**：每次推新草稿不自动删旧 → 定期 draft/batchget + draft/delete 清理
- **用户手动改过草稿后重推**：先 draft/batchget（no_content=0）拉取**用户版本** HTML，在其上做局部替换再推送——不要用本地旧版直接覆盖，否则用户修改全丢
- **GIF 正文图**：wechat-api 的 HTML 输入会把 gif 转静态帧 → 需先替换为动图直传（高级用法，个人号一般用不到）
- **封面必须提供**：无 `--cover` 报错；图片在子目录要传 `./assets/cover.jpg`（裸文件名报 Image not found）
- **图片格式**：PIL 存 JPEG 内容命名 .png → 报 `Format mismatch`。封面/配图按实际格式命名（统一 .jpg）
- **HTML 输入**：接受 `<section>` 纯片段，正文 `<img>` 自动上传并重写为 https URL；元数据取 CLI 参数或同目录同名 .md 的 frontmatter
- **正文图片必须本地相对路径**（与 HTML 同目录）——远程非 mmbiz URL 上传行为不确定

## 七、兜底路径（无凭证 / API 失败）

1. 交付排版 HTML + 图片（本地路径）
2. 用户登录 mp.weixin.qq.com 后台 → 新建图文 → 编辑器「粘贴」HTML → 传封面 → 保存草稿 → 发布
3. 高级用户可自接：wechatpy（Python SDK）、Wechatsync（浏览器插件）、或浏览器自动化
