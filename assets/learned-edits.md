# 手改学习库（learned-edits）

记录**你在机器产出的稿子上做的每一次手工修改**。这些改动是最贵的信号——
它们是「机器给的」和「你想要的」之间的差，比任何风格描述都准。

> 配套脚本：`scripts/learned_edits.py`（比两版 → 结构化记一条）。
> 蒸馏去向：`assets/voice.md`（语气规律）、`assets/lessons.md`（坑）、`references/cover-design.md`（封面）。

## 什么时候记

用户把改过的稿子/HTML 拿回来时（严格模式下几乎每次都会）。**改动一发生就记，别攒**——
隔一天就记不清当时为什么这么改。

```bash
python scripts/learned_edits.py \
  --before generated/draft_ai.md --after generated/draft_user.md \
  --kind deai --note "删掉开头天气铺垫，直接从事件进" \
  --append assets/learned-edits.md
```

## 改动类型（`--kind`）

| kind | 管什么 | 蒸馏去向 |
|---|---|---|
| `deai` | 去 AI 味（删填充/破折号/金句） | `voice.md` + `lessons.md` |
| `structure` | 结构（开头/结尾/段落顺序） | `voice.md` |
| `voice` | 语气与用词（像不像我） | `voice.md` + `voice-samples/` |
| `layout` | 排版（主题/组件/下划线） | `lessons.md` |
| `image` | 配图（选图/构图/色板） | `references/cover-design.md` + `image-style-routing.md` |
| `title` | 标题 | `voice.md` |
| `other` | 其它 | 攒着看 |

## 蒸馏规则（每 5 篇或攒够 3–5 条同类）

- **不满 2 条不下结论**：一次手改可能只是那天心情，不一定是规律
- **同类改动重复出现** → 才是真规律 → 回写对应库
- **同一条被改回来两次** → 说明规则互相打架，先在 `lessons.md` 记一笔冲突，别急着定规矩
- 记录器只负责记，**回写一律要人判断**（脚本不自动改风格库）

## 记录

<!-- 脚本 --append 会往这里追加。手写也行，格式：
## 2026-11-01｜deai
- 文章：《标题》
- 对比：`generated/draft_ai.md` → `generated/draft_user.md`
- 改动量：+3 / -12 行
- 自述：删掉开头天气铺垫，直接从事件进
```diff
...
```
-->
