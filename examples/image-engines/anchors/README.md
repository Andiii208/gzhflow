# 视觉锚图（anchors）

这里放**你自己的**历史偏好图 —— 你以前觉得「对味」的封面/插图。生成新图时把它们当参考图喂给模型，
让新图的美术调性跟你认可过的图保持一致。这是把「风格」从文字描述升级成**图像条件**的地方。

> ⚠️ 本目录下的图片被 gitignore（属个人内容），clone 下来只有这份 README 是正常的。
> 仓库开源的是流程，不是你画过的图。

## 为什么有用

文字 prompt 的「暖米纸 + 低饱和晕染」每个模型理解都不一样，说十遍也不一定对味。
GPT-image-2 的 `/images/edits` 接口支持最多 16 张参考图 —— 给一张你认可的图当锚，
比写二十行纹理词都管用。2026-10-12 起 `image_batch.py` 支持把锚图并进每张图的 refs。

## 怎么用（三步）

1. **挑图**：从你发过的文章里挑 2–3 张你最认可的封面/插图，丢进本目录。
   命名带用途前缀，一眼能认出是哪套引擎的、什么角色：

   ```
   watercolor-cover-like-01.png      # 水彩引擎，封面参考
   watercolor-texture-like-01.png    # 水彩引擎，纹理/晕染参考
   zine-collage-like-01.png          # zine 引擎，拼贴构图参考
   ```

   **只挑你真的喜欢的**，不要为了凑数塞图 —— 锚图会同时影响所有图，一张不喜欢的锚污染整批。

2. **登记到引擎**：在 `examples/image-engines/<引擎>.yaml` 的 `anchor_images:` 下写出相对路径：

   ```yaml
   anchor_images:
     - watercolor-cover-like-01.png
     - watercolor-texture-like-01.png   # 路径相对本目录
   ```

   默认是空列表 `[]` —— 没有锚图时这条不生效，生成走纯文字 prompt，不影响使用。

3. **生成时挂上**（两条路，二选一或叠加）：

   ```bash
   # 路 A：按引擎自动带锚图
   python scripts/image_batch.py --manifest generated/manifest.json --engine watercolor

   # 路 B：显式指定目录/文件（可临时换一批锚）
   python scripts/image_batch.py --manifest generated/manifest.json --anchors examples/image-engines/anchors/watercolor-cover-like-01.png

   # 单张调试
   python scripts/generate_image.py --prompt "..." --refs examples/image-engines/anchors/watercolor-cover-like-01.png -o out.png
   ```

## 两条锚线，别混

| 锚线 | 管什么 | 放哪 | 变化速度 |
|---|---|---|---|
| **风格锚**（本目录 + 引擎 `anchor_images`） | 美术调性：纸感、笔触、配色倾向 | 本目录，长期复用 | 慢（认可一张加一张） |
| **实体锚**（manifest 的 `refs`） | 这一篇的具体东西：某张专辑、某个界面 | 随篇走，用完即弃 | 快（每篇不同） |

同一个 manifest 里两者可以叠加：`--engine watercolor` 给风格锚，`refs` 给实体锚。
`refs` 里的**实体锚优先**（模型更难从文字里「想象」出具体产品长什么样）。

## 脏锚比没锚更糟

- ❌ 塞一张高饱和/渐变/3D 的图当锚 → 模型会把这些也学过去，跟引擎的规避清单打架
- ❌ 锚图构图画满 → 新图也会画满，留白没了
- ✅ 锚图应当是**引擎风格的最干净样本**：纸感清楚、主体单一、留白到位

挑图时对不上就换 —— 锚是辅助，不是必须。没有锚图这套流程照样跑。
