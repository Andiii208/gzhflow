# Agnes AI Image Generation Reference

## API Info

- **Endpoint**: `https://apihub.agnes-ai.com/v1/images/generations`
- **Model**: `agnes-image-2.1-flash`（2026-08-03 官方文档确认仍为最新可用版；2.5 Preview 未上线）
- **Auth**: `AGNES_API_KEY`，**优先读 `~/.hermes/.env`**（external-ai-media-api skill 规范），`~/.baoyu-skills/.env` 为兜底
- **Cost**: 免费（2026-06-01 起无限期免费开放）
- ⚠️ **踩坑**：key 若 401，检查是否被存成了掩码占位符（如 `sk-hkq...MUo5` 带省略号）——真实 key 约 51 字符，从 `~/.hermes/.env` 拷贝

## Python Script

位于: `D:\tools\hermes\skills\creative\external-ai-media-api\scripts\agnes_image.py`（参数: prompt size model，读 ~/.hermes/.env）

## Usage Patterns

### Cover image (16:9)
```
python3 agnes_image.py "Cover for essay '标题'. Summer desk, window, laptop, warm golden tones, soft illustration, text space at top, 16:9" "1792x1024" "agnes-image-2.1-flash"
```

### Inline illustration (4:3)
```
python3 agnes_image.py "Soft warm illustration, student desk at sunset, laptop, cozy summer atmosphere, warm tones, minimal" "1024x768" "agnes-image-2.1-flash"
```

## Common Issues

| Issue | Fix |
|-------|-----|
| HTTP 503 Service busy | Retry 1-3 times with 2s interval. Usually works on retry. |
| HTTP 503 still fails | Simplify prompt (shorter, fewer adjectives) or use different size |
| HTTP 400 `content_policy_violation` | 提示词触发内容策略：**"地图+图钉"组合必踩**（地图易被策略限制）；改写意象（如地图→旅行手帐/门票/照片便签） |
| HTTP 400 任意 prompt | **不要加 `extra_body`/`response_format` 字段**——Agnes API 不支持，会直接 400；返回 b64_json 或 url 由脚本自动处理 |
| HTTP 401 | key 无效：检查是否被存成掩码占位符（`sk-hkq...MUo5` 带省略号），真实 key 约 51 字符，从 `~/.hermes/.env` 拷贝 |

## Prompt Tips

- Keep prompts under 200 chars for reliability
- Specify style: "soft illustration", "minimal", "warm golden tones"
- For cover images, mention "text space at top"
- For inline images, match the article's emotional tone
- Use simpler prompts when 503 errors persist
