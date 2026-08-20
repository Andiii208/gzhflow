# 草稿箱验证脚本（推送后必须拉回确认，2026-08-19 实测）

> 用户说「走完全部流程」/ 全自动授权时，交付前**必须从微信 API 拉回草稿确认真实存在**——只信 wechat-api.ts 返回的 `media_id` 不够（它是自报），要读到草稿的 title/digest/图片数/内容头尾才算数。

## 坑（2026-08-19 实测）

- **python 直连拉 token 会被 40164 拦**：Clash TUN 下 `api.weixin.qq.com` 被强制直连，python urllib 的 HTTPS_PROXY 被 TUN 接管无效 → 先切 Clash 全局（见 SKILL.md 40164 条目），再用 **npx bun 跑 TypeScript** 拉取（bun 走代理成功）。
- **bun 不认 MSYS 路径**：`npx bun /c/Users/.../check_draft.ts` 报 `Module not found`——必须传 Windows 格式 `C:/Users/.../check_draft.ts`。
- **切全局→验证→恢复 rule 串成一条命令**，验证脚本失败也要恢复。

## 可复用脚本（check_draft.ts）

```ts
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/26895/.baoyu-skills/.env", "utf-8");
const appid = env.match(/WECHAT_APP_ID\s*=\s*(\S+)/)![1];
const secret = env.match(/WECHAT_APP_SECRET\s*=\s*(\S+)/)![1];
const tokRes = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`);
const tok = (await tokRes.json() as any).access_token;
const res = await fetch(`https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${tok}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ offset: 0, count: 3, no_content: 0 }),
});
const d = await res.json() as any;
for (const it of d.item ?? []) {
  const m = it.content.news_item[0];
  console.log("---");
  console.log("media_id:", it.media_id);
  console.log("title:", m.title);
  console.log("digest:", m.digest);
  console.log("content length:", m.content.length);
  console.log("has cover:", Boolean(m.thumb_media_id));
  console.log("images:", m.content.match(/<img/g)?.length ?? 0);
  console.log("head:", m.content.slice(0, 180).replace(/\s+/g, " "));
  console.log("tail:", m.content.slice(-180).replace(/\s+/g, " "));
}
```

## 调用姿势（bash，git-bash）

```bash
# 1) 切全局（secret 从 %APPDATA%\clashmi\clashmi\service_core_setting.json 读）
curl -s -X PATCH -H "Authorization: Bearer <secret>" -H "Content-Type: application/json" -d '{"mode":"global"}' http://127.0.0.1:9090/configs && echo SWITCHED
# 2) 验证（Windows 路径）
cd C:/Users/26895/projects/qixi-aphasia && npx -y bun "C:/Users/26895/projects/qixi-aphasia/check_draft.ts"
# 3) 恢复（无论成败都执行）
curl -s -X PATCH -H "Authorization: Bearer <secret>" -H "Content-Type: application/json" -d '{"mode":"rule"}' http://127.0.0.1:9090/configs && echo RESTORED
```

验证通过标准：返回草稿的 title 正确 + has cover: true + images ≥ 1 + head/tail 与本地排版一致（head 是 `<section style="max-width: 677px...` 全局容器开头，tail 是签名区 `——Andiii碎碎念`）。
