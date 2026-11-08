# DSH 前端设计系统与可复用 UI 原语清单

> **审计对象**：DeepSeek Harness 桌面版（`/Applications/DeepSeek Harness.app/Contents/Resources/app.asar`，构建于 2026-11-04）
> **调研日期**：2026-11-08　**方式**：只读静态审计（解包 `app.asar` + 解析 `lib/client.js` 产物 + 前端 dist bundle）
> **读者**：DSH 插件开发者。目标是把宿主 UI 的设计语言抄成自己能用的东西，而不破坏主题切换与无障碍行为。

---

## 0. 结论先行

1. **颜色只有一个权威来源**：`--dsw-alias-*`（119 个语义别名）+ `--dsw-static-*`（82 个原始色板）。别名在 `body` 上定义，浅色/深色两份，切换靠 `body[data-ds-dark-theme]`。
2. **插件不要自己写十六进制颜色**。`practices.md` 明确写了「literal colors are for artwork only」。
3. **不要 `require('@deepseek-ai/dsh-client-ui-primitives')`**（`practices.md:35`）。正确姿势是**把宿主的按钮/输入框等组件的 markup + CSS + 行为复制进插件**，只保留 `--dsw-alias-*` 令牌引用。
4. **UI 一律是 React 组件注册进 slot**，不是 iframe、不是独立 HTML 页。
5. **图标**：`viewBox="0 0 16 16"`、`stroke="currentColor"`、regular `stroke-width=1` / medium `stroke-width=1.3`；宿主用 `<symbol>` sprite + `<use href="#dsw-icon-...">`。
6. **没有间距令牌**。间距是各组件里的裸 px（4/6/8/10/12/16/20/24…），照抄宿主页面，别自创。

---

## 1. 令牌体系（Design Tokens）

### 1.1 命名空间与权威文件

| 前缀 | 语义 | 数量 | 定义位置 | 插件可否直接用 |
|---|---|---|---|---|
| `--dsw-static-*` | 原始色板（不随主题变，除 1 项外） | 82 | `dsh-client-ui-theme/lib/client.js:1470`（`design_platform_css_default`） | ⚠️ 尽量不直接用 |
| `--dsw-alias-*` | 语义别名（背景层 / 描边 / 文字 / 强调 / 状态 / 浮层…） | 119 | 同上（同一字符串内第 3、4 个 `body{}` 块） | ✅ **首选** |
| `--dsw-specific-*` | 特定场景（侧边栏、气泡、选择器、登录输入…） | 10 | 同上 | ⚠️ 仅对应场景 |
| `--dsw-menu-surface-fill` / `--dsw-alias-menu-group-header-fill` | 菜单材质 | 2 | 同上 | ✅ |
| `--dsw-font-*` | 字号阶梯（含 markdown 专用变体） | ~140 | `dsh-client-ui-theme/lib/client.js:1482`（`gradient_shadow_text_css_default`） | ✅ |
| `--dsw-radius-*` | 圆角阶梯 | 6 | `.../lib/client.js:1464`（`base_css_default`） | ✅ |
| `--dsw-shadow-lv*` / `--dsw-elevation-*` | 阴影 / 抬升 | 7 | `.../lib/client.js:1482` | ✅ |
| `--dsw-focus-ring-width` / `--dsw-focus-ring-color` | 焦点环 | 2 | `.../lib/client.js:1473`（`focus_css_default`） | ✅ |
| `--dsh-scrollbar-*` | 滚动条 | 5 | `.../lib/client.js:1479`（`scrollbar_css_default`） | ✅ |
| `--dsw-corner-shape` | 超椭圆圆角 | 1 | `.../lib/client.js:1467`（`corner_shape_css_default`） | ✅ |
| `--dsw-alias-onboarding-*` / `--dsw-gradient-onboarding-*` | 引导页专用 | 7 | `.../lib/client.js:1476`（`onboarding_css_default`） | ❌ 与插件无关 |
| `--shiki-*` | 代码高亮 | 11 | `.../lib/client.js:1485`（`shiki_css_default`） | ⚠️ 仅代码块 |
| `--dsh-content-font-size` / `--dsh-code-font-size` / `--dsh-terminal-font-size` | 用户字号偏好 | 3 | 运行时写到 `body.style`（见 §2） | 只读 |
| `--dsh-font-family-text` / `-code` / `-terminal` | 用户字体偏好 | 3 | 同上 | 只读 |

**样式表加载顺序**（`dsh-client-ui-theme/README.md:68`）：
`base.css` → `corner-shape.css` → `design-platform.css` → `focus.css` → `onboarding.css` → `scrollbar.css` → `gradient-shadow-text.css` → `shiki.css`
（`scrollbar.css` 必须在 `design-platform.css` 之后，因为前者消费后者声明的 `--dsw-alias-scrollbar-*`。）

> **注**：上面 8 张 CSS 在**已安装的包里没有独立 `.css` 文件**，它们以字符串形式内联在 `lib/client.js` 里（`var base_css_default = "..."` 等）。`/tmp/dsh-theme/*_css_default.css` 是同源的单行压缩副本，本文的行号以**美化后副本**为准，原始字符串的行号以 `lib/client.js` 为准（两者内容一致）。

---

### 1.2 语义令牌全表（浅色 / 深色对照）

下面的「浅色 / 深色」两列是 `design-platform.css` 里的**原始表达式**，「解析值」是把它顺着 `--dsw-static-*` 链解析出来的最终颜色（用于肉眼判断）。


#### 静态色板（`--dsw-static-*`）

浅色与深色下**只有 1 个令牌不同**：`--dsw-static-neutral-bluish-60`（浅 `#f5f6f7` / 深 `#f9fafb`）。其余 81 个完全相同——静态色板是「原料」，主题差异全部发生在 alias 层。

| 静态色板令牌 | 浅色 | 深色 | 差异 |
|---|---|---|---|
| `--dsw-static-amber-100` | `#fef5e7` | `#fef5e7` | — |
| `--dsw-static-amber-400` | `#f7ad31` | `#f7ad31` | — |
| `--dsw-static-amber-500` | `#f59e0b` | `#f59e0b` | — |
| `--dsw-static-amber-600` | `#dd8629` | `#dd8629` | — |
| `--dsw-static-amber-900` | `#27241f` | `#27241f` | — |
| `--dsw-static-blue-100` | `#dbeafe` | `#dbeafe` | — |
| `--dsw-static-blue-300` | `#93c5fd` | `#93c5fd` | — |
| `--dsw-static-blue-400` | `#60a5fa` | `#60a5fa` | — |
| `--dsw-static-blue-450` | `#4d93f8` | `#4d93f8` | — |
| `--dsw-static-blue-50` | `#eff6ff` | `#eff6ff` | — |
| `--dsw-static-blue-500` | `#3b82f6` | `#3b82f6` | — |
| `--dsw-static-blue-50p` | `#eaf3ff` | `#eaf3ff` | — |
| `--dsw-static-blue-600` | `#2563eb` | `#2563eb` | — |
| `--dsw-static-blue-75` | `#e5f0ff` | `#e5f0ff` | — |
| `--dsw-static-blue-800` | `#1e40af` | `#1e40af` | — |
| `--dsw-static-blue-900` | `#0e3074` | `#0e3074` | — |
| `--dsw-static-blue-950` | `#172554` | `#172554` | — |
| `--dsw-static-deepseek-100` | `#e4edfd` | `#e4edfd` | — |
| `--dsw-static-deepseek-200` | `#d3e2ff` | `#d3e2ff` | — |
| `--dsw-static-deepseek-300` | `#b7c8fe` | `#b7c8fe` | — |
| `--dsw-static-deepseek-400` | `#7aaaff` | `#7aaaff` | — |
| `--dsw-static-deepseek-450` | `#5686fe` | `#5686fe` | — |
| `--dsw-static-deepseek-50` | `#edf3fe` | `#edf3fe` | — |
| `--dsw-static-deepseek-500` | `#4176e6` | `#4176e6` | — |
| `--dsw-static-deepseek-600` | `#4868b2` | `#4868b2` | — |
| `--dsw-static-deepseek-700-delete` | `#2f4c8f` | `#2f4c8f` | — |
| `--dsw-static-deepseek-800` | `#34415b` | `#34415b` | — |
| `--dsw-static-deepseek-900` | `#283142` | `#283142` | — |
| `--dsw-static-green-100` | `#e6faed` | `#e6faed` | — |
| `--dsw-static-green-400` | `#4ed17e` | `#4ed17e` | — |
| `--dsw-static-green-500` | `#22c55e` | `#22c55e` | — |
| `--dsw-static-green-500-a08` | `#22c55e14` | `#22c55e14` | — |
| `--dsw-static-green-500-a12` | `#22c55e1f` | `#22c55e1f` | — |
| `--dsw-static-green-900` | `#233c2c` | `#233c2c` | — |
| `--dsw-static-neutral-00` | `#fff` | `#fff` | — |
| `--dsw-static-neutral-100` | `#f5f5f5` | `#f5f5f5` | — |
| `--dsw-static-neutral-1000` | `#000` | `#000` | — |
| `--dsw-static-neutral-150` | `#ededed` | `#ededed` | — |
| `--dsw-static-neutral-200` | `#e5e5e5` | `#e5e5e5` | — |
| `--dsw-static-neutral-250` | `#dcdcdc` | `#dcdcdc` | — |
| `--dsw-static-neutral-300` | `#d4d4d4` | `#d4d4d4` | — |
| `--dsw-static-neutral-400` | `#a2a4a6` | `#a2a4a6` | — |
| `--dsw-static-neutral-50` | `#fafafa` | `#fafafa` | — |
| `--dsw-static-neutral-500` | `#7f8287` | `#7f8287` | — |
| `--dsw-static-neutral-550` | `#65676b` | `#65676b` | — |
| `--dsw-static-neutral-600` | `#545557` | `#545557` | — |
| `--dsw-static-neutral-700` | `#3c3c3d` | `#3c3c3d` | — |
| `--dsw-static-neutral-800` | `#292929` | `#292929` | — |
| `--dsw-static-neutral-850` | `#212123` | `#212123` | — |
| `--dsw-static-neutral-900` | `#0f0f0f` | `#0f0f0f` | — |
| `--dsw-static-neutral-bluish-00` | `#fff` | `#fff` | — |
| `--dsw-static-neutral-bluish-100` | `#ebeef2` | `#ebeef2` | — |
| `--dsw-static-neutral-bluish-1000` | `#0f1115` | `#0f1115` | — |
| `--dsw-static-neutral-bluish-150` | `#e9ecf2` | `#e9ecf2` | — |
| `--dsw-static-neutral-bluish-200` | `#e1e5ee` | `#e1e5ee` | — |
| `--dsw-static-neutral-bluish-300` | `#cfd3d6` | `#cfd3d6` | — |
| `--dsw-static-neutral-bluish-310` | `#cad2db` | `#cad2db` | — |
| `--dsw-static-neutral-bluish-400` | `#adb2b8` | `#adb2b8` | — |
| `--dsw-static-neutral-bluish-50` | `#f9fafb` | `#f9fafb` | — |
| `--dsw-static-neutral-bluish-500` | `#979da6` | `#979da6` | — |
| `--dsw-static-neutral-bluish-55` | `#f5f7fa` | `#f5f7fa` | — |
| `--dsw-static-neutral-bluish-60` | `#f5f6f7` | `#f9fafb` | **不同** |
| `--dsw-static-neutral-bluish-600` | `#81858c` | `#81858c` | — |
| `--dsw-static-neutral-bluish-700` | `#61666b` | `#61666b` | — |
| `--dsw-static-neutral-bluish-75` | `#f1f3f5` | `#f1f3f5` | — |
| `--dsw-static-neutral-bluish-750` | `#43454a` | `#43454a` | — |
| `--dsw-static-neutral-bluish-800` | `#353638` | `#353638` | — |
| `--dsw-static-neutral-bluish-850` | `#2c2c2e` | `#2c2c2e` | — |
| `--dsw-static-neutral-bluish-875` | `#232324` | `#232324` | — |
| `--dsw-static-neutral-bluish-90` | `#edf0f4` | `#edf0f4` | — |
| `--dsw-static-neutral-bluish-900` | `#1b1b1c` | `#1b1b1c` | — |
| `--dsw-static-neutral-bluish-950` | `#151517` | `#151517` | — |
| `--dsw-static-red-100` | `#fee2e2` | `#fee2e2` | — |
| `--dsw-static-red-400` | `#f25a5a` | `#f25a5a` | — |
| `--dsw-static-red-400-a12` | `#f25a5a1f` | `#f25a5a1f` | — |
| `--dsw-static-red-50` | `#fef2f2` | `#fef2f2` | — |
| `--dsw-static-red-500` | `#ef4444` | `#ef4444` | — |
| `--dsw-static-red-600` | `#ec1313` | `#ec1313` | — |
| `--dsw-static-red-600-a08` | `#ec131314` | `#ec131314` | — |
| `--dsw-static-red-900` | `#570c0c` | `#570c0c` | — |
| `--dsw-static-violet-400` | `#a78bfa` | `#a78bfa` | — |
| `--dsw-static-violet-600` | `#7c3aed` | `#7c3aed` | — |
#### 背景 / 表面层

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-bg-base` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-950)` | `#ffffff` / `#151517` |
| `--dsw-alias-bg-document-preview` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-950)` | `#ebeef2` / `#151517` |
| `--dsw-alias-bg-document-selection` | `color-mix(in srgb, var(--dsw-static-blue-500) 40%, transparent)` | `color-mix(in srgb, var(--dsw-static-blue-500) 40%, transparent)` | `color-mix(in srgb, var(--dsw-static-blue-500) 40%, transparent)` / `color-mix(in srgb, var(--dsw-static-blue-500) 40%, transparent)` |
| `--dsw-alias-bg-layer-1` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-875)` | `#ffffff` / `#232324` |
| `--dsw-alias-bg-layer-2` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-850)` | `#ffffff` / `#2c2c2e` |
| `--dsw-alias-bg-layer-3` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-800)` | `#ffffff` / `#353638` |
| `--dsw-alias-bg-mask-1` | `#0000003d` | `#00000080` | `#0000003d` / `#00000080` |
| `--dsw-alias-bg-mask-2` | `#0000001f` | `#0003` | `#0000001f` / `#00000033` |
| `--dsw-alias-bg-mask-3` | `#0000007a` | `#0000007a` | `#0000007a` / `#0000007a` |
| `--dsw-alias-bg-mask-drop` | `#ffffffb3` | `#272730b3` | `#ffffffb3` / `#272730b3` |
| `--dsw-alias-bg-mask-photo` | `#000000e0` | `#000000e0` | `#000000e0` / `#000000e0` |
| `--dsw-alias-bg-module-platform` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-bluish-800)` | `#f5f6f7` / `#353638` |
| `--dsw-alias-bg-multi-select` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-850)` | `#f5f6f7` / `#212123` |
| `--dsw-alias-bg-overlay` | `var(--dsw-static-neutral-bluish-150)` | `var(--dsw-static-neutral-bluish-700)` | `#e9ecf2` / `#61666b` |
| `--dsw-alias-bg-skeleton` | `#0000000a` | `#ffffff14` | `#0000000a` / `#ffffff14` |

#### 描边 / 分隔线

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-border-inverted` | `#0000` | `#ffffff0f` | `#00000000` / `#ffffff0f` |
| `--dsw-alias-border-inverted2` | `#0000` | `#ffffff14` | `#00000000` / `#ffffff14` |
| `--dsw-alias-border-l1` | `#0000000a` | `#ffffff0f` | `#0000000a` / `#ffffff0f` |
| `--dsw-alias-border-l2` | `#0000001a` | `#ffffff1f` | `#0000001a` / `#ffffff1f` |
| `--dsw-alias-border-l2-darkmode-thin` | `#0000001a` | `#ffffff0f` | `#0000001a` / `#ffffff0f` |
| `--dsw-alias-border-l3` | `#0000001f` | `#ffffff29` | `#0000001f` / `#ffffff29` |
| `--dsw-alias-border-l4` | `#00000029` | `#fff3` | `#00000029` / `#ffffff33` |

#### 文字层级

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-label-caption` | `var(--dsw-static-neutral-bluish-400)` | `var(--dsw-static-neutral-bluish-600)` | `#adb2b8` / `#81858c` |
| `--dsw-alias-label-deep-diving` | `color-mix(in srgb, var(--dsw-static-deepseek-500) 70%, var(--dsw-static-blue-950))` | `color-mix(in srgb, var(--dsw-static-deepseek-450) 55%, var(--dsw-static-neutral-bluish-400))` | `color-mix(in srgb, var(--dsw-static-deepseek-500) 70%, var(--dsw-static-blue-950))` / `color-mix(in srgb, var(--dsw-static-deepseek-450) 55%, var(--dsw-static-neutral-bluish-400))` |
| `--dsw-alias-label-deep-diving-shimmer` | `color-mix(in srgb, var(--dsw-static-deepseek-500) 30%, var(--dsw-static-blue-950))` | `color-mix(in srgb, var(--dsw-static-blue-300) 65%, var(--dsw-static-deepseek-400))` | `color-mix(in srgb, var(--dsw-static-deepseek-500) 30%, var(--dsw-static-blue-950))` / `color-mix(in srgb, var(--dsw-static-blue-300) 65%, var(--dsw-static-deepseek-400))` |
| `--dsw-alias-label-dimmed` | `var(--dsw-static-neutral-bluish-200)` | `var(--dsw-static-neutral-bluish-750)` | `#e1e5ee` / `#43454a` |
| `--dsw-alias-label-document-preview` | `var(--dsw-static-neutral-bluish-700)` | `var(--dsw-static-neutral-bluish-300)` | `#61666b` / `#cfd3d6` |
| `--dsw-alias-label-primary` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` | `#0f1115` / `#f9fafb` |
| `--dsw-alias-label-primary-bluish` | `var(--dsw-static-blue-900)` | `var(--dsw-static-neutral-bluish-50)` | `#0e3074` / `#f9fafb` |
| `--dsw-alias-label-primary-dimmed` | `var(--dsw-static-neutral-bluish-950)` | `var(--dsw-static-neutral-bluish-100)` | `#151517` / `#ebeef2` |
| `--dsw-alias-label-primary-foreground` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-1000)` | `#ffffff` / `#0f1115` |
| `--dsw-alias-label-primary-inverted` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-800)` | `#ffffff` / `#353638` |
| `--dsw-alias-label-secondary` | `var(--dsw-static-neutral-bluish-700)` | `var(--dsw-static-neutral-bluish-300)` | `#61666b` / `#cfd3d6` |
| `--dsw-alias-label-shimmer` | `color-mix(in srgb, var(--dsw-static-neutral-1000) 30%, transparent)` | `color-mix(in srgb, var(--dsw-static-neutral-00) 45%, transparent)` | `color-mix(in srgb, var(--dsw-static-neutral-1000) 30%, transparent)` / `color-mix(in srgb, var(--dsw-static-neutral-00) 45%, transparent)` |
| `--dsw-alias-label-tertiary` | `var(--dsw-static-neutral-bluish-600)` | `var(--dsw-static-neutral-bluish-400)` | `#81858c` / `#adb2b8` |
| `--dsw-alias-menu-icon` | `var(--dsw-static-neutral-bluish-800)` | `var(--dsw-alias-label-primary-dimmed)` | `#353638` / `#ebeef2` |

#### 品牌 / 强调 / 链接

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-brand-primary` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` | `#0f1115` / `#f9fafb` |
| `--dsw-alias-brand-primary-invert` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` | `#0f1115` / `#f9fafb` |
| `--dsw-alias-brand-primary-new-colorprimary-new-color` | `#4176e6` | `var(--dsw-static-deepseek-450)` | `#4176e6` / `#5686fe` |
| `--dsw-alias-brand-text` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` | `#0f1115` / `#f9fafb` |
| `--dsw-alias-link` | `var(--dsw-static-deepseek-500)` | `var(--dsw-static-deepseek-400)` | `#4176e6` / `#7aaaff` |

#### 按钮

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-button-contrast-fill` | `var(--dsw-static-neutral-bluish-700)` | `var(--dsw-static-neutral-bluish-50)` | `#61666b` / `#f9fafb` |
| `--dsw-alias-button-elevated-fill` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-750)` | `#ffffff` / `#43454a` |
| `--dsw-alias-button-floating-fill` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-850)` | `#ffffff` / `#2c2c2e` |
| `--dsw-alias-button-floating-hover` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-800)` | `#f1f3f5` / `#353638` |
| `--dsw-alias-button-ghost-active-border` | `var(--dsw-static-neutral-bluish-500)` | `var(--dsw-static-neutral-bluish-600)` | `#979da6` / `#81858c` |
| `--dsw-alias-button-ghost-active-fill` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-750)` | `#ebeef2` / `#43454a` |
| `--dsw-alias-button-ghost-active-hover` | `var(--dsw-static-neutral-bluish-150)` | `var(--dsw-static-neutral-bluish-700)` | `#e9ecf2` / `#61666b` |
| `--dsw-alias-button-info-fill` | `var(--dsw-static-deepseek-500)` | `var(--dsw-static-deepseek-400)` | `#4176e6` / `#7aaaff` |
| `--dsw-alias-button-info-hover` | `var(--dsw-static-deepseek-400)` | `var(--dsw-static-deepseek-500)` | `#7aaaff` / `#4176e6` |
| `--dsw-alias-button-primary-dimmed` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-750)` | `#ebeef2` / `#43454a` |
| `--dsw-alias-button-primary-fill` | `var(--dsw-alias-brand-primary)` | `var(--dsw-alias-brand-primary)` | `#0f1115` / `#f9fafb` |
| `--dsw-alias-button-primary-hover` | `var(--dsw-static-neutral-bluish-750)` | `var(--dsw-static-neutral-bluish-100)` | `#43454a` / `#ebeef2` |
| `--dsw-alias-button-tool-bar-fill` | `#54555780` | `#54555780` | `#54555780` / `#54555780` |
| `--dsw-alias-button-tool-bar-fill-invisible` | `#1f1f1f5c` | `#1f1f1f5c` | `#1f1f1f5c` / `#1f1f1f5c` |
| `--dsw-alias-button-tool-bar-hover` | `#54555799` | `#54555799` | `#54555799` / `#54555799` |

#### 交互态（hover/active）

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-interactive-bg-active` | `#2631481a` | `#ffffff24` | `#2631481a` / `#ffffff24` |
| `--dsw-alias-interactive-bg-hover` | `#2631480f` | `#ffffff14` | `#2631480f` / `#ffffff14` |
| `--dsw-alias-interactive-bg-hover-accent` | `#26314824` | `#ffffff3d` | `#26314824` / `#ffffff3d` |
| `--dsw-alias-interactive-bg-hover-danger` | `#ec13130d` | `#f25a5a26` | `#ec13130d` / `#f25a5a26` |
| `--dsw-alias-interactive-bg-hover-solid` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-800)` | `#f1f3f5` / `#353638` |

#### 状态色（成功/警告/错误/闲置/完成/业务）

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-state-business-primary` | `var(--dsw-static-deepseek-500)` | `var(--dsw-static-deepseek-400)` | `#4176e6` / `#7aaaff` |
| `--dsw-alias-state-business-tertiary` | `var(--dsw-static-deepseek-100)` | `var(--dsw-static-deepseek-800)` | `#e4edfd` / `#34415b` |
| `--dsw-alias-state-done-primary` | `var(--dsw-static-violet-600)` | `var(--dsw-static-violet-400)` | `#7c3aed` / `#a78bfa` |
| `--dsw-alias-state-error-primary` | `var(--dsw-static-red-600)` | `var(--dsw-static-red-400)` | `#ec1313` / `#f25a5a` |
| `--dsw-alias-state-error-secondary` | `var(--dsw-static-red-400)` | `var(--dsw-static-red-400)` | `#f25a5a` / `#f25a5a` |
| `--dsw-alias-state-idle-primary` | `var(--dsw-static-neutral-300)` | `var(--dsw-static-neutral-600)` | `#d4d4d4` / `#545557` |
| `--dsw-alias-state-success-primary` | `var(--dsw-static-green-500)` | `var(--dsw-static-green-500)` | `#22c55e` / `#22c55e` |
| `--dsw-alias-state-success-secondary` | `var(--dsw-static-green-400)` | `var(--dsw-static-green-400)` | `#4ed17e` / `#4ed17e` |
| `--dsw-alias-state-success-tertiary` | `var(--dsw-static-green-100)` | `var(--dsw-static-green-900)` | `#e6faed` / `#233c2c` |
| `--dsw-alias-state-warn-label` | `var(--dsw-static-amber-600)` | `var(--dsw-static-amber-600)` | `#dd8629` / `#dd8629` |
| `--dsw-alias-state-warn-primary` | `var(--dsw-static-amber-500)` | `var(--dsw-static-amber-500)` | `#f59e0b` / `#f59e0b` |
| `--dsw-alias-state-warn-secondary` | `var(--dsw-static-amber-400)` | `var(--dsw-static-amber-400)` | `#f7ad31` / `#f7ad31` |
| `--dsw-alias-state-warn-tertiary` | `var(--dsw-static-amber-100)` | `var(--dsw-static-amber-900)` | `#fef5e7` / `#27241f` |
| `--dsw-alias-switch-thumb` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-400)` | `#ffffff` / `#adb2b8` |

#### 浮层（Toast/Tooltip/菜单/遮罩/骨架/插画）

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-illustration-background` | `var(--dsw-static-neutral-bluish-55)` | `var(--dsw-static-neutral-bluish-850)` | `#f5f7fa` / `#2c2c2e` |
| `--dsw-alias-illustration-backing` | `var(--dsw-static-neutral-bluish-310)` | `var(--dsw-static-neutral-bluish-750)` | `#cad2db` / `#43454a` |
| `--dsw-alias-illustration-detail` | `var(--dsw-static-neutral-bluish-310)` | `var(--dsw-static-neutral-bluish-600)` | `#cad2db` / `#81858c` |
| `--dsw-alias-illustration-inset` | `var(--dsw-alias-illustration-surface)` | `var(--dsw-alias-illustration-backing)` | `#edf0f4` / `#43454a` |
| `--dsw-alias-illustration-shadow` | `var(--dsw-alias-illustration-surface)` | `var(--dsw-alias-illustration-backing)` | `#edf0f4` / `#43454a` |
| `--dsw-alias-illustration-surface` | `var(--dsw-static-neutral-bluish-90)` | `var(--dsw-static-neutral-bluish-700)` | `#edf0f4` / `#61666b` |
| `--dsw-alias-menu-group-header-fill` | `#f8f9faf0` | `#303136f0` | `#f8f9faf0` / `#303136f0` |
| `--dsw-alias-toast-bg` | `var(--dsw-static-neutral-bluish-800)` | `var(--dsw-static-neutral-bluish-750)` | `#353638` / `#43454a` |
| `--dsw-alias-toast-label` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-00)` | `#ffffff` / `#ffffff` |
| `--dsw-alias-tooltip-bg` | `var(--dsw-static-neutral-bluish-850)` | `var(--dsw-static-neutral-bluish-750)` | `#2c2c2e` / `#43454a` |
| `--dsw-alias-tooltip-key-bg` | `color-mix(in srgb, var(--dsw-alias-tooltip-bg), white 18%)` | `color-mix(in srgb, var(--dsw-alias-tooltip-bg), white 18%)` | `color-mix(in srgb, var(--dsw-alias-tooltip-bg), white 18%)` / `color-mix(in srgb, var(--dsw-alias-tooltip-bg), white 18%)` |
| `--dsw-menu-surface-fill` | `#fcfdfeb3` | `#303136a3` | `#fcfdfeb3` / `#303136a3` |

#### 滚动条

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-scrollbar-bg-l1` | `var(--dsw-static-neutral-200)` | `var(--dsw-static-neutral-700)` | `#e5e5e5` / `#3c3c3d` |
| `--dsw-alias-scrollbar-bg-l2` | `var(--dsw-static-neutral-200)` | `var(--dsw-static-neutral-600)` | `#e5e5e5` / `#545557` |
| `--dsw-alias-scrollbar-hover-l1` | `var(--dsw-static-neutral-300)` | `var(--dsw-static-neutral-600)` | `#d4d4d4` / `#545557` |
| `--dsw-alias-scrollbar-hover-l2` | `var(--dsw-static-neutral-300)` | `var(--dsw-static-neutral-550)` | `#d4d4d4` / `#65676b` |

#### Markdown 专用

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-markdown-citation` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-800)` | `#ebeef2` / `#353638` |
| `--dsw-alias-markdown-code-block` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-900)` | `#f9fafb` / `#1b1b1c` |
| `--dsw-alias-markdown-code-block-banner` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-850)` | `#f9fafb` / `#2c2c2e` |
| `--dsw-alias-markdown-code-segment-selected` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-800)` | `#ffffff` / `#353638` |
| `--dsw-alias-markdown-code-segment-unselected` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-900)` | `#f1f3f5` / `#1b1b1c` |
| `--dsw-alias-markdown-inline-code` | `var(--dsw-static-neutral-50)` | `var(--dsw-static-neutral-800)` | `#fafafa` / `#292929` |
| `--dsw-alias-markdown-placeholder` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-bluish-850)` | `#f5f6f7` / `#2c2c2e` |
| `--dsw-alias-markdown-tag` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-850)` | `#f1f3f5` / `#2c2c2e` |

#### 代码差异 / 文件差异

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-code-diff-added` | `var(--dsw-static-green-500-a08)` | `var(--dsw-static-green-500-a12)` | `#22c55e14` / `#22c55e1f` |
| `--dsw-alias-code-diff-deleted` | `var(--dsw-static-red-600-a08)` | `var(--dsw-static-red-400-a12)` | `#ec131314` / `#f25a5a1f` |
| `--dsw-alias-file-diff-added-bg` | `#e6f4e7` | `#1f3124` | `#e6f4e7` / `#1f3124` |
| `--dsw-alias-file-diff-added-gutter` | `#edf7ed` | `#132016` | `#edf7ed` / `#132016` |
| `--dsw-alias-file-diff-added-marker` | `#01a241` | `#41c977` | `#01a241` / `#41c977` |
| `--dsw-alias-file-diff-deleted-bg` | `#fce6e2` | `#3c1f1b` | `#fce6e2` / `#3c1f1b` |
| `--dsw-alias-file-diff-deleted-gutter` | `#fdece9` | `#28130e` | `#fdece9` / `#28130e` |
| `--dsw-alias-file-diff-deleted-marker` | `#ba2723` | `#fa423e` | `#ba2723` / `#fa423e` |

#### Turn 触发通知

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-alias-turn-trigger-bg` | `var(--dsw-alias-markdown-code-block)` | `var(--dsw-alias-interactive-bg-hover)` | `#f9fafb` / `#ffffff14` |
| `--dsw-alias-turn-trigger-bg-hover` | `var(--dsw-alias-interactive-bg-hover)` | `var(--dsw-alias-interactive-bg-active)` | `#2631480f` / `#ffffff24` |

#### 特定场景（specific）

| 令牌 | 浅色 | 深色 | 解析值（浅 / 深） |
|---|---|---|---|
| `--dsw-specific-bubble` | `var(--dsw-static-deepseek-50)` | `var(--dsw-static-neutral-bluish-850)` | `#edf3fe` / `#2c2c2e` |
| `--dsw-specific-bubble-highlight` | `var(--dsw-static-deepseek-200)` | `var(--dsw-static-neutral-bluish-750)` | `#d3e2ff` / `#43454a` |
| `--dsw-specific-input-major` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-850)` | `#ffffff` / `#2c2c2e` |
| `--dsw-specific-login-input` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-900)` | `#f9fafb` / `#1b1b1c` |
| `--dsw-specific-menu` | `var(--dsw-menu-surface-fill)` | `var(--dsw-menu-surface-fill)` | `#fcfdfeb3` / `#303136a3` |
| `--dsw-specific-selector` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-bluish-800)` | `#f5f6f7` / `#353638` |
| `--dsw-specific-sidebar-fill` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-900)` | `#f9fafb` / `#1b1b1c` |
| `--dsw-specific-sidebar-nav-item-active` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-750)` | `#ebeef2` / `#43454a` |
| `--dsw-specific-sidebar-nav-item-active-accent` | `var(--dsw-static-deepseek-100)` | `var(--dsw-static-neutral-bluish-800)` | `#e4edfd` / `#353638` |
| `--dsw-specific-tip` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-bluish-800)` | `#f5f6f7` / `#353638` |

---

### 1.3 圆角 / 阴影 / 字号 / 动效 / 字体族

#### 圆角（`base.css`，`lib/client.js:1464`）

```css
--dsw-radius-xs: 4px;     /* 行内 code、小圆角按钮、滚动条圆角 */
--dsw-radius-sm: 8px;     /* 小按钮、tooltip 气泡 */
--dsw-radius-md: 12px;    /* 常规按钮、输入框、设置步进器 */
--dsw-radius-lg: 16px;    /* 卡片、toast、菜单面板 */
--dsw-radius-xl: 20px;
--dsw-radius-panel: 28px; /* 对话框 / modal 面板 */
```

宿主组件选择规则（从实际 CSS 反推）：
- 按钮默认 `md`，小按钮 `sm`；输入框 `md`；标签/chip 用 `999px`（胶囊）并配 `corner-shape: round`；
- 卡片 `lg`；Modal `panel`；Tooltip 气泡 `sm`；Toast `lg`。

#### 阴影 / 抬升（`gradient-shadow-text.css`，`lib/client.js:1482`）

```css
--dsw-shadow-lv1: 0 2px 4px 0 #0000000d;
--dsw-shadow-lv1-blur: 0 4px 12px 0 #00000005;
--dsw-shadow-lv2: 0 4px 12px 0 #00000005, 0 2px 8px 0 #0000000a;
--dsw-shadow-lv3: 0 0 1px 0 #0003, 0 0 4px 0 #00000005, 0 12px 32px 0 #00000014;

/* 抬升层：先画 0.5px 发丝描边，再叠两层淡软阴影 */
--dsw-elevation-stroke: 0 0 0 .5px var(--dsw-elevation-stroke-color);
--dsw-elevation-stroke-color: var(--dsw-alias-border-l4); /* 暗色菜单材质下改用 border-l3 */
--dsw-elevation-panel:     var(--dsw-elevation-stroke), 0 3px 8px 0 #00000008, 0 0 16px 0 #00000005;
--dsw-elevation-prominent: var(--dsw-elevation-stroke), 0 3px 8px 0 #0000000a, 0 0 20px 0 #0000000d;
--dsw-elevation-soft:      var(--dsw-elevation-stroke), 0 4px 16px 0 #00000008, 0 0 24px 0 #00000008;
```

用法规则（`dsh-client-ui-theme/README.md:90`）：抬升表面要 `border: 0`，靠 `box-shadow: var(--dsw-elevation-*)` 自带描边，**不要**再写 `outline`（会占布局）。
Toast 用 `box-shadow: var(--dsw-shadow-lv3)`；Modal 用 `var(--dsw-elevation-prominent)`。

#### 字号阶梯（`gradient-shadow-text.css`）

UI 通用阶梯（不随用户字号变）：

| 令牌 | 值 | 用途 |
|---|---|---|
| `--dsw-font-xl-24` | `600 24px/32px` | 页面大标题 |
| `--dsw-font-l-20` | `500 20px/28px` | 二级标题 |
| `--dsw-font-m-18` | `500 16px/28px` | 三级标题（注意名字与实际不符） |
| `--dsw-font-base-16` | `400 16px/24px` | 常规正文 |
| `--dsw-font-base-strong-16` | `500 16px/24px` | 强调正文 |
| `--dsw-font-s-14` / `-strong-14` | `400` / `500` `14px/22px` | 默认 UI 字号 |
| `--dsw-font-xs-13` / `-strong-13` | `400` / `500` `13px/20px` | 次级文字、输入框文字 |
| `--dsw-font-xxs-12` / `-strong-12` | `400` / `500` `12px/18px` | 辅助说明 |
| `--dsw-font-xxxs-11` / `-strong-11` | `400` / `500` `11px/14px` | 极小标签 |

Markdown 专用阶梯（随用户字号平移）：`--dsw-font-markdown-h1..h4`、`-base`（含 `-strong` / `-italic`）、`-table` / `-table-head`、`-small`（固定 12px/20px）、`-code` / `-code-block` / `-code-block-small`。

#### 用户字号（运行时变量，插件应读不应写）

`--dsh-content-font-size`（10–22，默认 14）、`--dsh-code-font-size`（10–16，默认 11）、`--dsh-terminal-font-size`（10–20，默认 13）。
写 在 `body.style` 上，由 theme 插件维护；派生量 `--dsh-content-font-delta`、`--dsh-content-font-size-secondary`、`--dsh-code-font-delta` 由 CSS 自动算。

#### 间距

**没有间距令牌。** 宿主各组件直接写裸 px：`4 / 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32`。
可参考的宿主内部变量（组件私有，不要跨插件依赖）：`--dsh-sidebar-inline-padding: 8px`、`--dsh-sidebar-row-padding: 12px`、`--dsh-sidebar-label-gap: 6px`。

#### 动效

```css
--ds-ease-in-out: cubic-bezier(.4, 0, .2, 1);
--ds-transition-duration:      .2s;   /* 默认 */
--ds-transition-duration-fast: .1s;   /* 箭头旋转等 */
--ds-transition-duration-slow: .3s;   /* 侧边栏宽度动画 */
```

Modal 进出场用 `var(--ds-transition-duration) var(--ds-ease-in-out)`；Switch 拇指用 `transform .12s ease`。

#### 字体族

```css
--dsh-font-family-text-default: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
                                "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
--dsh-font-family-code-default: "SF Mono", "JetBrains Mono", "Fira Code", Consolas,
                                "Liberation Mono", Menlo, Courier, "PingFang SC", "Microsoft YaHei";
--dsw-font-family:  var(--dsh-font-family-text, var(--dsh-font-family-text-default)), var(--dsh-font-family-text-default);
--ds-font-family-code: var(--dsh-font-family-code, var(--dsh-font-family-code-default)), var(--dsh-font-family-code-default);
--dsw-font-family-brand: "Montserrat", var(--dsh-font-family-text-default);  /* 品牌字，仅品牌文案 */
```

正文用 `var(--dsw-font-family)`，等宽用 `var(--ds-font-family-code)`（注意是 `--ds-` 不是 `--dsw-`）。
`--dsh-font-family-<role>` 是用户覆盖列表，宿主把它放在内置栈**前面**，未设置时回落内置栈。

---

## 2. 深色模式的切换机制

**确切选择器：`body[data-ds-dark-theme]`**（属性在 `body` 元素上，值为空字符串）。

| 环节 | 位置 | 细节 |
|---|---|---|
| 首屏引导脚本 | `dsh-client-ui-theme/lib/index.js:145-160` | `document.body.toggleAttribute('data-ds-dark-theme', dark)`（L158）；同时写 `document.documentElement.dataset.dsThemeSource = preference`（L157） |
| 运行时呈现器 | `dsh-client-ui-layout/lib/client.js:571` | `const DARK_ATTRIBUTE = "data-ds-dark-theme"` |
| 运行时切换 | `dsh-client-ui-layout/lib/client.js:614-635` | `apply(snapshot)`：`scheme === "dark"` → `body.setAttribute(DARK_ATTRIBUTE, "")`，否则 `removeAttribute`；同时 `document.documentElement.style.colorScheme = scheme` |
| 主题来源标记 | `dsh-client-ui-layout/lib/client.js:581` | `const THEME_SOURCE_ATTRIBUTE = "data-ds-theme-source"`（`light` / `dark` / `system`），写在 `<html>` 上，供 Electron 转发给 `nativeTheme.themeSource` |
| 深色 token 块 | `dsh-client-ui-theme/lib/client.js:1470` | `body[data-ds-dark-theme]{ ...119 个别名... }` |
| 平台差异 | 同上，尾部 | `html[data-platform=darwin] body{--dsw-specific-menu:#f8f9faf0}` 与 `html[data-platform=darwin] body[data-ds-dark-theme]{--dsw-specific-menu:#303136f0}` |

### 插件里怎么用

```css
/* ✅ 正确：只写语义令牌，主题切换自动跟随 */
.myCard { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }

/* ❌ 错误：写死颜色 / 自己判断深色 */
.myCard { background: #fff; }
@media (prefers-color-scheme: dark) { .myCard { background: #151517; } }  /* 错：宿主用属性，不用 media query */
```

**不要用 `prefers-color-scheme` 媒体查询做配色**。宿主的主题偏好是应用内设置（`light` / `dark` / `system`），与 OS 无关；只有当偏好为 `system` 时才由 `prefers-color-scheme` 决定。

---


## 3. 可复用的 UI 组件原语

### 3.1 组件库在哪、红线是什么

宿主组件库叫 **`@deepseek-ai/dsh-client-ui-primitives`**，源码在 `packages/client/ui-primitives/`，构建后被 `dsh-web-frontend/dist/assets/index-BgUyXZcc.js` 内联。

它**没有**以独立 npm 包形式装进 `node_modules`（`/dsh/node_modules/@deepseek-ai/` 下没有 `dsh-client-ui-primitives`），只在浏览器模块表里被暴露。

> 🔴 **红线**（`cordis-plugin-development/references/practices.md:35` 原文要点）：
> > Do not `require('@deepseek-ai/dsh-client-ui-primitives')` or load any other Harness Client package as a module…
> > Write your own controls and match the host instead: copy markup, CSS, and behavior from the primitive into the plugin … Rename copied classes under your plugin's prefix, keep only `--dsw-alias-*` token references, and keep the behavior that users rely on, such as Modal focus and Escape handling, `role="switch"` with `aria-checked`, and Tooltip placement.
>
> 原因：这些包**随时会变、无版本承诺**；插件是 plain JS 没有类型检查；组件一抛错就会**整条 slot 变空白**（控制台：`slot entry crashed in '<slot>'`，见 `dsh-client-ui-renderer/lib/client.js:638`）。
>
> 合规做法：**把宿主的 markup + CSS + 行为复制进你的插件**，类名加你的前缀，样式里只留 `--dsw-alias-*` 引用。

### 3.2 无构建链插件能拿到什么（`window.__ModuleLoader__`）

浏览器模块表（`dsh-web-frontend/dist/assets/index-BgUyXZcc.js:196`）暴露这些 specifier：

| specifier | 可用 | 说明 |
|---|---|---|
| `react` | ✅ | React 本体 |
| `react/jsx-runtime` | ✅ | JSX 运行时（无构建链时用 `React.createElement`） |
| `react-dom` / `react-dom/client` | ✅ | |
| `@deepseek-ai/cordis` | ✅ | 客户端 cordis 运行时 |
| `zod` | ✅ | |
| `@tanstack/react-virtual` | ✅ | 长列表虚拟滚动 |
| `@deepseek-ai/dsh-client-store` | ✅ | `createSnapshotStore` / `defineStore` |
| `@deepseek-ai/dsh-client-ui-slots` | ✅ | `SlotCore` / `resolveSlotLabel` / `standardHookPropName` |
| `@deepseek-ai/dsh-client-ui-primitives` | ⚠️ | **技术上能 require，但契约禁止**（§3.1） |
| `@deepseek-ai/dsh-client-ui-dockkit` | ⚠️ | 同上，属于 Host Client 包 |

**官方最小模板**（`cordis-plugin-development/templates/decoration/client.js`，逐字）：

```js
window.__ModuleLoader__.load({
  id: '@local/my-decoration',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    function Decoration() {
      return h('svg', {
        viewBox: '0 0 64 64', width: 48, height: 48,
        'aria-hidden': true,
        style: { display: 'block', pointerEvents: 'none' },
      }, h('circle', { cx: 32, cy: 32, r: 24, fill: '#247bbf' }));
    }
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock', id: 'my-decoration', order: 5,
        }, Decoration));
      },
    };
  },
});
```

配套 `package.json`（`templates/decoration/package.json`）：

```json
{
  "name": "@local/my-decoration",
  "type": "module",
  "exports": { ".": "./index.js", "./client": "./client.js", "./locale/*.json": "./locale/*.json", "./icon": "./icon.svg" },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": ["@deepseek-ai/dsh-client-ui-conversation"]
    }
  }
}
```

> `dsh.client.inject` **只是排序激活顺序**，不给你 import 权限（`practices.md:35`）。

### 3.3 原语导出清单与 props 速查

以下 props 全部从 `dsh-web-frontend/dist/assets/index-BgUyXZcc.js` 里还原（`FU` 导出表在 L194，组件实现在 L562882 起）。

| 导出名 | 类型 | 关键 props | 备注 |
|---|---|---|---|
| `Button` | 组件 | `variant`（`ghost`\|`primary`\|`outline`\|`toolbar`，默认 `ghost`）、`size`（`md`\|`sm`，默认 `md`）、`icon`、`className`，其余透传到 `<button type="button">` | 有 `forwardRef` |
| `Input` | 组件 | `icon`、`className`，其余透传 `<input>`（`value`/`placeholder`/`onChange`/`aria-invalid`…） | 外层 `<span class="wrap">` 包 `<span class="icon">` + `<input>` |
| `Checkbox` | 组件 | `checked`、`onChange`、`label`、`disabled`、`title` | `<label><input type=checkbox><span>{label}</span></label>` |
| `Switch` | 组件 | `checked`、`onChange`、`label`、`disabled`、`title` | `role="switch"` + `aria-checked`，**必须保留** |
| `Tag` | 组件 | `tone`（`outline`\|`solid`\|`neutral`\|`quiet`\|`success`\|`info`\|`warning`\|`danger`，默认 `outline`）、`children` | 胶囊，`data-tone` 属性驱动配色 |
| `Pill` | 组件 | `active`、`onClick`、`children` | 有 `onClick` 渲染 `<button>`，否则 `<span>` |
| `Modal` | 组件 | `open`、`onClose`、`title`、`closeLabel`、`description`、`children`、`footer`、`className`、`contentClassName`、`onKeyDownCapture`、`headless`、`backdropBlur`、`shortcutModal` | 焦点管理 + Escape 在 `useModalLayer` 里，**必须照抄** |
| `Menu` | 组件 | `anchor`（ReactNode）、`items`/`children`、`open`、`onClose` | 需 `useAnchoredPosition` + `useDismissOnOutsidePointer` |
| `MenuItemButton` | 组件 | `children`、`shortcut`、`icon`、`current`、`disabled`、`disabledReason`、`danger`、`separatorBefore`、`onSelect` | `role="menuitem"` |
| `MenuGroup` | 组件 | — | 分组 + 分隔线 |
| `MenuSurface` | 组件 | — | 菜单材质层，`--dsw-menu-surface-fill` + `backdrop-filter` |
| `Tooltip` | 组件 | `label`（string\|函数）、`shortcutKeys`、`side`（`right`\|`left`\|`top`\|`bottom`，默认 `right`）、`align`（`start`\|`center`\|`end`）、`delayMs`、`focusDelayMs`、`gap`、`disabled`、`portal`、`maxWidth`、`openOnClick`、`onlyWhenClipped` | 包一层 trigger 子元素；placement 行为**必须保留** |
| `Toast` | 组件 | `text`、`icon`、`tone`（`success`）、`anchor`、`holdMs`（默认 `iA`）、`actions`（`{prefix, ...}` 数组）、`onDone` | `role="alert"`，portal 到 body |
| `SegmentedTabs` | 组件 | `items`（`{id, value, label}`）、`value`、`onChange`、`label`、`size`（`md`） | `role="tablist"`，方向键导航 |
| `SegmentedControl` | 组件 | `id`、`value`、`options`（`{value, title, disabled}`）、`onChange`、`label`、`disabled` | `role="tablist"`，写 `--dsh-segment-count` / `--dsh-segment-index` |
| `StateDot` | 组件 | `state`（`ongoing`\|`done`\|`error`\|`warning`\|`idle`）、`size`、`appearance`（`dot`\|`step`） | `ongoing` 渲染旋转 svg spinner，默认 14px；其它 10px |
| `ShortcutKeys` | 组件 | `keys` | 快捷键胶囊 |
| `DisclosureRow` | 组件 | — | 折叠行 |
| `InlineEditor` | 组件 | `value`、`label`、`onChange`、`onSave`、`onCancel` | 自动增高 textarea，Enter 保存 / Escape 取消 |
| `CodeBlock` / `TerminalBlock` / `DiffBlock` / `JsonBlock` / `JsonTree` / `ReadBlock` / `SearchBlock` / `WebBlock` | 组件 | — | 内容块 |
| `DetailDocument` | 组件 | `state` | 文档详情面板 |
| `HoverCard` / `HoverCardGroup` | 组件 | — | 悬停卡片 |
| `RiskConfirmation` | 组件 | — | 风险确认 |
| `SettingsForm` / `SettingsFormModel` / `SettingsValueField` / `SettingsSecretField` / `settingsNumberField` / `settingsTextField` | 组件/函数 | — | 设置表单（配合 `ctx.configForms`） |
| `UserMessageBubble` / `UserTextRun` / `QuotePreview` / `ReferenceChip` | 组件 | — | 会话气泡与引用 |
| `AnimatedRows` | 组件 | — | 列表进场动画 |
| `TextShimmer` | 组件 | `children`、`active` | 活动指示 |
| `FileTypeIcon` | 组件 | — | 文件类型图标 |
| `FishLogo` / `BrandWordmark` | 组件 | `size` | 品牌 |
| `PluginArtworkDefault` / `PluginArtworkTerminal` / `PluginArtworkLoop` / `PluginArtworkSubagent` / `PluginArtworkSearch` | 组件 | `size` | 插件插画 |
| `Icon*Regular` / `Icon*Medium` | 组件 | `size`、`className` | 见 §4 |
| `ICON_SYMBOLS` | 对象 | `dsw-icon-<name>-<weight>` → SVG 字符串 | 194 项 |
| `ICON_REGULAR_STROKE` / `ICON_MEDIUM_STROKE` | 常量 | `1` / `1.3` | |
| 工具函数 | — | `focusWithoutRing`、`writeClipboard`、`useClipboardCopy`、`isMobileDevice`、`isDarwinDesktop`、`pointerModality`、`useAnchoredPosition`、`useDismissOnOutsidePointer`、`useModalLayer`、`isBehindModal`、`closeTopModal`、`modalSelector`、`relativeTime`、`fileSizeText`、`fileExtension`、`classifyFileType` 等 | |

> ❌ **没有** `Card`、`Table`、`EmptyState`、`ProgressBar`、`Tabs`（只有 `SegmentedTabs` / `SegmentedControl`）、`Badge`、`Alert` 这些导出。卡片 / 表格 / 空状态 / 进度条都是**各页面自己写的 CSS**（例如插件管理器页的行、表格、卡片在 `dsh-client-ui-plugin-manager/lib/client.js` 内联样式里）。要做得像，就去抄那个页面的样式（`practices.md:34` 明确说「Plugin Manager 页是管理型列表的参考」）。

### 3.4 抄组件：直接可用的 CSS 配方

以下是从 `dsh-web-frontend/dist/assets/index-lh_YM6sT.css` 里抽出的**宿主真实样式**（已把哈希类名改成插件前缀 `dshp-`）。直接贴进插件的 CSS 即可，**只依赖 `--dsw-alias-*` 令牌**。

```css
/* ── Button ─────────────────────────────────────────── */
.dshp-button {
  box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center;
  gap: 4px; border: none; border-radius: var(--dsw-radius-md); cursor: pointer;
  font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-primary);
  background: transparent; padding: 0 14px; height: 36px;
}
.dshp-button:disabled { cursor: not-allowed; opacity: .4; }
.dshp-button--sm { height: 28px; font-size: 12px; line-height: 18px; padding: 0 10px; border-radius: var(--dsw-radius-sm); }
.dshp-button--primary { background: var(--dsw-alias-button-primary-fill); color: var(--dsw-alias-label-primary-foreground); }
.dshp-button--primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
.dshp-button--ghost:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dshp-button--ghost:active:not(:disabled) { background: var(--dsw-alias-interactive-bg-active); }
.dshp-button--outline {
  border: .5px solid transparent; background: transparent;
  box-shadow: inset 0 0 0 var(--dsh-hairline-width, .5px) var(--dsh-button-outline-color, var(--dsw-alias-border-l3));
}
.dshp-button--outline:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dshp-button--toolbar { background: var(--dsw-alias-button-tool-bar-fill); }
.dshp-button--toolbar:hover:not(:disabled) { background: var(--dsw-alias-button-tool-bar-hover); }
.dshp-button__icon { display: inline-flex; width: 16px; height: 16px; align-items: center; justify-content: center; }

/* ── Input ──────────────────────────────────────────── */
.dshp-input {
  height: 34px; padding: 0 12px; border: .5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-md); background: var(--dsw-alias-bg-layer-3);
  font: inherit; font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-primary);
}
.dshp-input:focus-visible { outline: none; border-color: var(--dsw-alias-state-business-primary); }
.dshp-input:disabled { color: var(--dsw-alias-label-tertiary); cursor: default; }
.dshp-input[aria-invalid="true"] { border-color: var(--dsw-alias-state-error-primary); }

/* ── Tag ────────────────────────────────────────────── */
.dshp-tag {
  display: inline-flex; align-items: center; border-radius: 999px; corner-shape: round;
  padding: 1px 8px; font-size: 11px; line-height: 17px; font-weight: 500; white-space: nowrap;
}
.dshp-tag[data-tone="outline"] { border: .5px solid var(--dsw-alias-border-l4); color: var(--dsw-alias-label-tertiary); }
.dshp-tag[data-tone="solid"]   { background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-layer-3); }
.dshp-tag[data-tone="neutral"] { background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-secondary); }
.dshp-tag[data-tone="quiet"]   { color: var(--dsw-alias-label-tertiary); }
.dshp-tag[data-tone="success"] { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent); color: var(--dsw-alias-state-success-primary); }
.dshp-tag[data-tone="info"]    { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent); color: var(--dsw-alias-state-business-primary); }
.dshp-tag[data-tone="warning"] { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent); color: var(--dsw-alias-state-warn-primary); }
.dshp-tag[data-tone="danger"]  { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); color: var(--dsw-alias-state-error-primary); }

/* ── Switch ─────────────────────────────────────────── */
.dshp-switch {
  box-sizing: border-box; position: relative; flex: 0 0 auto; width: 36px; height: 20px;
  padding: 2px; border: 0; border-radius: 999px; corner-shape: round;
  background: var(--dsw-alias-border-l3); cursor: pointer;
}
.dshp-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); }
.dshp-switch:disabled { cursor: default; opacity: .5; }
.dshp-switch:focus-visible { outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }
.dshp-switch__thumb {
  display: block; width: 16px; height: 16px; border-radius: 50%; corner-shape: round;
  background: var(--dsw-alias-label-primary-foreground); transition: transform .12s ease;
}
.dshp-switch[aria-checked="false"] .dshp-switch__thumb { background: var(--dsw-alias-switch-thumb); }
.dshp-switch[aria-checked="true"]  .dshp-switch__thumb { transform: translate(16px); }

/* ── Tooltip 气泡 ───────────────────────────────────── */
.dshp-tooltip {
  display: inline-flex; align-items: safe center; gap: 8px; position: fixed; z-index: 100;
  width: max-content; box-sizing: border-box; max-width: min(50vw, calc(100vw - 24px));
  max-height: calc(100vh - 24px); overflow: auto; padding: 3px 7px;
  border-radius: var(--dsw-radius-sm); background: var(--dsw-alias-tooltip-bg);
  color: var(--dsw-static-neutral-bluish-00); font-size: 13px; line-height: 20px;
  white-space: pre-line; overflow-wrap: anywhere;
}
.dshp-tooltip[data-portal] { z-index: 1100; }
.dshp-tooltip[data-side="right"], .dshp-tooltip[data-side="left"] { transform: translateY(-50%); }
.dshp-tooltip[data-side="bottom"] { transform: translateX(-50%); }
.dshp-tooltip[data-side="top"] { transform: translate(-50%, -100%); }
.dshp-tooltip[data-side="bottom"][data-align="end"] { transform: translateX(-100%); }
.dshp-tooltip[data-side="top"][data-align="end"] { transform: translate(-100%, -100%); }
.dshp-tooltip__key {
  min-width: 16px; height: 16px; padding: 0 2px; border-radius: 4px; border: 0;
  background: var(--dsw-alias-tooltip-key-bg);
}

/* ── Modal ──────────────────────────────────────────── */
.dshp-modal__root {
  pointer-events: auto; position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: max(24px, var(--dsh-frame-overlay-top, 24px)) 24px;
}
.dshp-modal__mask { position: absolute; inset: var(--dsh-frame-chrome-top, 0px) 0 0; backdrop-filter: var(--dsw-mask-blur); }
.dshp-modal__mask::after { content: ""; position: absolute; inset: 0; background: var(--dsw-alias-bg-mask-1); }
.dshp-modal__dialog {
  box-sizing: border-box; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 20px;
  width: min(380px, 100%); padding: 0 0 24px; overflow: hidden; border: 0;
  border-radius: var(--dsw-radius-panel); background: var(--dsw-alias-bg-layer-2);
  box-shadow: var(--dsw-elevation-prominent);
  animation: dshp-modal-enter var(--ds-transition-duration) var(--ds-ease-in-out);
}
.dshp-modal__title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 500; color: var(--dsw-alias-label-primary); }
.dshp-modal__description { margin: 0; padding: 0 24px; font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-primary); }
.dshp-modal__body { display: flex; flex-direction: column; min-width: 0; margin-top: 20px; padding: 0 24px; }
.dshp-modal__footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 0 24px; }
.dshp-modal__close {
  flex: none; display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; border-radius: var(--dsw-radius-sm);
  background: transparent; cursor: pointer; color: var(--dsw-alias-label-secondary);
}
.dshp-modal__close:hover { background: var(--dsw-alias-interactive-bg-hover); }
@keyframes dshp-modal-enter { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }

/* ── Toast ──────────────────────────────────────────── */
.dshp-toast {
  position: fixed; top: 40px; left: 50%; z-index: 1100; pointer-events: none;
  display: flex; align-items: center; gap: 10px; width: max-content;
  max-width: min(640px, calc(100vw - 48px)); padding: 12px 16px;
  border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-toast-bg);
  color: var(--dsw-alias-toast-label); font-size: 14px; line-height: 22px;
  box-shadow: var(--dsw-shadow-lv3); transform: translateX(-50%);
}
.dshp-toast__icon { display: grid; place-items: center; flex: none; color: var(--dsw-alias-state-warn-label); }
.dshp-toast__icon--success { color: var(--dsw-alias-state-success-primary); }
.dshp-toast__text { min-width: 0; }

/* ── 卡片 / 表格 / 空状态（宿主页面通用做法） ───────── */
.dshp-card {
  border-radius: var(--dsw-radius-lg);
  background: var(--dsw-alias-bg-layer-2);
  border: .5px solid var(--dsw-alias-border-l4);
  box-shadow: var(--dsw-elevation-soft);
}
.dshp-table { width: 100%; border-collapse: collapse; font: var(--dsw-font-markdown-table); }
.dshp-table th { text-align: left; font: var(--dsw-font-markdown-table-head); color: var(--dsw-alias-label-secondary); }
.dshp-table td { padding: 10px 16px; border-bottom: .5px solid var(--dsw-alias-border-l2); max-width: 320px; min-width: 100px; }
.dshp-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 48px 24px; color: var(--dsw-alias-label-tertiary);
  font-size: var(--dsw-font-s-14); line-height: 22px; text-align: center;
}
.dshp-progress { height: 4px; border-radius: 999px; background: var(--dsw-alias-bg-layer-3); overflow: hidden; }
.dshp-progress__bar { height: 100%; border-radius: 999px; background: var(--dsw-alias-brand-primary); transition: width var(--ds-transition-duration) var(--ds-ease-in-out); }
```

### 3.5 常用组合片段（React，无构建链）

```js
const React = require('react');
const h = React.createElement;

/* 按钮 */
h('button', {
  className: 'dshp-button dshp-button--primary',
  type: 'button',
  onClick: onClick,
}, '保存');

/* 输入框（无效态） */
h('input', {
  className: 'dshp-input',
  value, placeholder: '搜索…',
  'aria-invalid': invalid ? 'true' : undefined,
  onChange: (e) => setValue(e.target.value),
});

/* 标签 */
h('span', { className: 'dshp-tag', 'data-tone': 'success' }, '已安装');

/* 开关（必须带 role/aria-checked） */
h('button', {
  className: 'dshp-switch', type: 'button',
  role: 'switch', 'aria-checked': enabled, 'aria-label': '启用',
  onClick: () => setEnabled(!enabled),
}, h('span', { className: 'dshp-switch__thumb' }));

/* 分段控件（自带方向键导航） */
h('div', { role: 'tablist', 'aria-label': '视图' },
  ['列表', '详情'].map((label, i) =>
    h('button', {
      key: label, type: 'button', role: 'tab',
      'aria-selected': tab === i,
      className: 'dshp-pill' + (tab === i ? ' dshp-pill--active' : ''),
      onClick: () => setTab(i),
    }, label)));

/* 卡片 + 空状态 */
h('div', { className: 'dshp-card' },
  rows.length === 0
    ? h('div', { className: 'dshp-empty' }, '还没有内容')
    : rows.map((r) => h('div', { key: r.id }, r.title)));
```

---


## 4. 图标方案

### 4.1 宿主怎么画图标

DSH 用**内联 SVG sprite**，不是图标字体、也不是 `lucide` 之类的第三方包。

- 定义表在 `dsh-web-frontend/dist/assets/index-BgUyXZcc.js`（`Qv` 对象，约 L562882）：`{ "chevron-down-outline": { size: 14, svg: (strokeWidth) => \`<svg ...>\` } }`
- 权重表：`Vp = { regular: 1, medium: 1.3 }`（导出名 `ICON_REGULAR_STROKE` / `ICON_MEDIUM_STROKE`）
- 符号 id 生成：`ey(name, weight) => \`dsw-icon-${name}-${weight}\``（L632824 附近）
- `ICON_SYMBOLS` = 97 个基础名 × 2 权重 = **194 个 symbol**
- sprite 注入：`dsh-client-ui-theme/lib/client.js:1431 installIconSprite(ctx, icons)`，在 `body` 开头放一个隐藏 `<svg>`，每个 symbol 的 `<symbol id="dsw-icon-...">`

### 4.2 图标规格（插件自绘时照抄）

```html
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 16 16"
     width="16" height="16"
     fill="none"
     stroke="currentColor"
     stroke-width="1"          <!-- regular=1，medium=1.3 -->
     stroke-linejoin="round"   <!-- 宿主图标大多带这个 -->
     aria-hidden="true">
  <path d="…" />
</svg>
```

- **viewBox**：绝大多数是 `0 0 16 16`；少数例外：`0 0 36 36`、`0 0 17 17`、`0 0 14 14`、`0 0 20 20`、`0 0 9 11`（非方形的用 `aspect` 比例换算宽高）
- **尺寸档位**（`size` prop 默认取自定义表）：`10 / 12 / 14 / 16 / 18 / 20`
  - 侧边栏折叠态 16/18px、宽态 14px
  - 列表行内小图标 13/14px
  - Toast / 空状态大图标 28px
- **渲染方式**（宿主组件的输出形状）：
  ```html
  <svg width="16" height="16" class="…" data-icon="dsw-icon-chevron-down-outline-regular" aria-hidden="true">
    <use href="#dsw-icon-chevron-down-outline-regular" />
  </svg>
  ```
  → 你的插件**不需要**建 sprite，直接内联 `<path>` 即可（插件没有 sprite 注入通道），但要保持同样的视觉参数。

### 4.3 图标基础名全表（97 个）

```
save-outline, new-chat-outline, search-outline, globe-outline, settings-outline,
panel-left-outline, ellipsis-outline, plus-outline, check-outline, branch-outline,
chevron-down-outline, chevron-left-outline, chevron-right-outline, chevron-up-outline,
chevrons-up-down-outline, triangle-right-fill, close-outline, close-fill, close-circle-fill,
copy-outline, refresh-outline, like-outline, like-fill, dislike-outline, dislike-fill,
share-outline, deliver-doc, edit-outline, think-outline, agent-preset-outline,
browse-outline, context-injection-outline, link-outline, right-up-outline, enhance-outline,
trash-outline, warning-outline, warning-triangle-outline, check-circle-fill,
check-circle-outline, user-outline, users-outline, paper-plane-outline, stop-fill,
paperclip-outline, loading-outline, download-outline, play-outline, pause-outline,
fullscreen-outline, code-outline, cordis-plugin-outline, api-outline,
personalization-outline, project-add-outline, folder-open-outline, folder-open,
folder-close, tree-corner, light-outline, dark-outline, followsystem-outline, data-outline,
database-outline, clock-outline, gauge-outline, send-outline, queue-outline,
checklist-outline, list-pen-outline, goal-outline, inspect-outline, skill-outline,
question-outline, info-outline, plugin-pinwheel-outline, alarm-clock-outline,
archive-outline, archive-check-outline, archive-off-outline, unarchive-outline,
wrap-lines-outline, nowrap-fill, wrap-fill, compare-split-outline, plan-outline,
compact-outline, shield-outline, pin-outline, pin-fill, flat-list-outline,
workspace-tree-outline, drag-handle-outline, sliders-two-outline, microphone-outline,
apps-add-outline, apps-add-compact-outline
```

对应组件名 = `Icon` + PascalCase(基础名) + `Regular`/`Medium`，
例如 `chevron-down-outline` → `IconChevronDownOutlineRegular` / `IconChevronDownOutlineMedium`。

另外还有 4 个权限图标：`PermissionIconAutoReview*`、`PermissionIconFullAccess*`、`PermissionIconReadOnly*`、`PermissionIconWorkspaceWrite*`。

### 4.4 主题可以替换图标

`ctx.theme.register({ id, colorScheme, tokens, icons })`（`dsh-client-ui-theme/lib/client.js:2057`）：
`icons` 的键必须是 `ICON_SYMBOLS` 里的 id，值是**完整 SVG 文档字符串**。校验规则（`validateIcons`，L2207）：
必须是 SVG 命名空间的 `<svg>` 根、必须有 `viewBox`、不能含 `<style>`/`<script>`、内部元素的 id 必须以 `<symbol id>-` 开头。
替换后的图标可以多色、可以用 `currentColor` 或 `--dsw-*` 变量，但**渐变等 paint server 在 sprite 内解析**，不跟随使用点颜色。

---

## 5. Slot 清单与 Client API

### 5.1 Slot 机制（`ctx.slots`）

宿主实现在 `dsh-client-ui-renderer/lib/client.js`，底层 `SlotCore` 在 `dsh-client-ui-slots`。

**四种 kind**（`SlotCore.register` 的校验）：

| kind | 要求 | 语义 |
|---|---|---|
| `single` | 无 | 全局只能一个注册，第二个直接抛错 |
| `keyed` | `options.key` 必填 | 同 key 互斥，可多 key 并存 |
| `list` | `options.id` 必填 | 可多个，按 `order` 排序 |
| `chain` | `options.select` 必填 | 链式，多个都渲染 |

**`ctx.slots.register(options, component)` 的 options**：

| 字段 | 说明 |
|---|---|
| `name` | **必填**，slot 名；必须已被父级 `children` 声明，否则抛 `slot "<name>" is not declared` |
| `key` / `id` / `select` | 按 kind 要求 |
| `order` | list 槽内的排序（`priority` 更大优先） |
| `label` | `string` 或 `() => string`；被 `resolveSlotLabel` 解析，用于侧边栏 / 设置导航 |
| `priority` | 覆盖优先级，默认 0，**最低的先渲染** |
| `inject` | `() => ({...props})`，注入给组件的 props |
| `children` | 声明子 slot：`{ "child.key": { kind, scope } }` |
| `store` | 状态句柄（`defineStore` / `createSnapshotStore`） |
| `locale` | 该 slot 的文案命名空间 |
| `registrant` | 默认取 `ctx.fiber.name` |

**`ctx.slots` API**：

| 方法 | 位置 | 说明 |
|---|---|---|
| `ctx.slots.inject(key, cb)` | renderer L1368 | 声明存在时同步跑回调；声明塌陷时自动 dispose，声明恢复时重装。**插件的标准接入口** |
| `ctx.slots.register(options, component)` | renderer L1603 | 注册 |
| `ctx.slots.entries(key)` | renderer L1542 | 该 slot 的全部注册项 |
| `ctx.slots.entriesOfSlot(key)` | renderer L1554 | 每个格子取第一个存活项（渲染用的视图） |
| `ctx.slots.subscribe(key, fn)` | renderer L1591 | 注册变化订阅 |
| `ctx.slots.getVersion(key)` | renderer L1599 | 版本号，配合 `useSyncExternalStore` |
| `ctx.slots.snapshot(root?)` | renderer L1562 | 导出 JSON-safe 的 slot 声明树（只读检查用） |
| `ctx.slots.spec(key)` | renderer L1582 | 查声明 |
| `ctx.slots.renderSlot("root", owner)` | renderer L1531 | **只允许渲染 `root`**，子 slot 必须走组件 props 里的 `renderSlot` |
| `ctx.slots.onEntryError(fn)` | renderer L1574 | 观察 slot 项崩溃 |
| `ctx.slots.provideRoot({ hooks })` | renderer L1465 | 往 root 贡献 hooks |

> 运行时的 slot 树用 `cordis_inspect_query` 查 **`Slots`** 服务（`SKILL.md:23`：「For UI, query Client `Slots.listSubTree` and the selected slot's registration options and props」）。客户端等价物是 `ctx.slots.snapshot(root)`。

### 5.2 已知 slot 清单（来自各包 `ctx.slots.inject(...)` / `renderSlot(...)`）

**Shell / 布局**（`dsh-client-ui-layout/lib/client.js:705-736`）

| slot | kind | 备注 |
|---|---|---|
| `root` | single | 根；`children` 声明下面所有 |
| `sidebar` | single | 左侧栏（`dsh-client-ui-sidebar` 注册） |
| `main` | **keyed** | 主面板；`key` = 面板 id，`ctx.layout.selectPanel(id)` 用它切换 |
| `rightbar` | single | 右侧栏 |
| `shell.bottom` | single | 底部条 |
| `shell.overlay` | list | 浮层（弹窗、toast 容器） |
| `shell.leading` | single | 顶栏左侧（移动端折叠按钮） |

**侧边栏**（`dsh-client-ui-sidebar/lib/client.js:733-771`）

`sidebar.brand.mark`（single）、`sidebar.brand.name`（single）、`sidebar.toggle.badge`（single）、
`sidebar.panellist`（**list**）、`sidebar.panellist.actions`（list）、`sidebar.workspaces`（single）、
`sidebar.settings`（single）、`sidebar.footer.action`（list）

> `sidebar.panellist` 项的 options：`{ id, order, label }`。侧边栏按 `order` 升序排，label 走 `resolveSlotLabel`（`dsh-client-ui-sidebar/lib/client.js:690-705`）。

**设置**（`dsh-client-ui-settings-general/lib/client.js:1522-1560`）

`settings.launcher`（single）、`settings.trigger`（single）、`settings.header`（single）、
`settings.action`（single）、`settings.close`（single）、`settings.section`（**list**）、
`settings.section.icon`（single）、`settings.onboarding`（list）
另有 `settings.plugins.tab`、`settings.models.*`、`settings.action` 等由各子包注册。

> `settings.section` 项的 options：`{ id, order, label, locale, inject }`。
> 参考注册：`dsh-client-ui-agent-preset/lib/client.js:3080-3087`
> ```js
> ctx.slots.inject("settings.section", () => ctx.slots.register({
>   name: "settings.section", id: "agent-presets", order: 20,
>   label: () => ctx.locale.bind("settings.agentPreset")("nav"),
>   locale: "settings.agentPreset",
>   inject: sectionInjected,
> }, AgentPresetSection));
> ```
> `settings.section` 的渲染带 `{ close }` prop（`dsh-client-ui-settings-general/lib/client.js:341`）。

**会话 / Composer**（`dsh-client-ui-conversation/lib/client.js:22792-23110`）

`conversation.session`（single）、`conversation.view`（list）、`conversation.header`（single）、
`conversation.header.leading`（single）、`conversation.session.header`（single）、
`conversation.session.header.lineage`（single）、`conversation.session.header.actions`（list）、
`conversation.session.header.utilities`（list）、`conversation.session.header.corner`（single）、
`conversation.session.header.views.actions`（list）、
`conversation.composer`（single）、`conversation.composer.bar`（single）、**`conversation.composer.dock`（list）**、
`conversation.input.dock`（list）、`conversation.input.attachments`（single）、`conversation.input.overlay`（list）、
`conversation.input.permission`（single）、`conversation.input.left`（list）、`conversation.input.right`（list）、
`conversation.input.plan`（single）、`conversation.input.model`（single）、`conversation.input.model.label`（single）、
`conversation.input.activity`（single）、`conversation.hero.brand.mark`（single）、`conversation.hero.workspace`（single）、
`conversation.hero.options`（list）、`conversation.user.text.node`（keyed）

**Chat 行**（`dsh-client-ui-chat/lib/client.js:9234-9343`）

`conversation.chat.node`（**keyed**，`key` = 事件定义的 `kind`）、`conversation.chat.reasoning.body`（list）、
`conversation.chat.flow`（list）、`conversation.chat.assistant-actions`（list）、
`conversation.chat.message.images` / `conversation.chat.user.images` / `conversation.trajectory.images`（list）、
`conversation.chat.text-interaction`（list）、`conversation.chat.commandview`（list）、
`conversation.approval.detail`（single）、`conversation.plan-review.actions`（list）

> **加一条 Chat 行**（`practices.md:37`）：
> 1. `ctx.uiConversation.events.register({ kind: "my-kind", ... })` 定义事件；
> 2. 在 `conversation.chat.node` slot 里用**同一个 `kind` 作为 `key`** 注册视图。
>    （实现在 `dsh-client-ui-conversation/lib/client.js:3358` / `dsh-client-ui-chat/lib/client.js:9238`）

**其它**

`sidebar.right.*`（文档预览/文件/guide 面板）、`tool.call.toolview`（list）、`tool.call.images`、
`deliverables.file.actions`、`plugins.*`（插件管理器自带）、`workspace.toast`、`rightbar.session`。

### 5.3 页面级注册范例（侧边栏面板 + 主面板）

`dsh-client-ui-plugin-manager/lib/client.js:7744-7826` 是宿主自己的完整范例，直接抄结构：

```js
// ① 主面板：注册到 keyed 的 "main" 槽
ctx.slots.inject("main", function* () {
  const handle = createNavigationStore(), instance = handle.create();
  const store = { ...handle, create: () => instance };
  yield ctx.slots.register({
    name: "main",
    key: PANEL_ID,                 // ← 这个 key 就是 ctx.layout.selectPanel(id) 的 id
    locale: NS,
    store,
    inject: () => ({ ...face, createHeaderRef: createPluginHeaderRef }),
    children: {                    // ← 声明子 slot
      "plugins.tab": { kind: "list", scope: "root" },
      "plugins.item": { kind: "list", scope: "root" },
      "plugins.detail.section": { kind: "list", scope: "root" },
    },
  }, PluginManagerPage);
  yield ctx.layout.panelInfo.subscribe(() => {
    if (ctx.layout.panelInfo.getSnapshot().activePanelId !== "plugins") instance.actions.setView({ kind: "list" });
  });
  yield () => { /* dispose */ };
});

// ② 侧边栏面板入口
ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
  name: "sidebar.panellist",
  id: PANEL_ID,        // ← 必须与 main 的 key 一致
  order: 0,            // ← 侧边栏排序
  label: () => t("panel"),
  locale: NS,
}, PluginsPanelIcon));
```

### 5.4 Client 服务 API 速查

#### `ctx.layout`（`dsh-client-ui-layout/lib/client.js:506-549`）

| 方法 | 说明 |
|---|---|
| `ctx.layout.selectPanel(panelId)` | 切换主面板；`panelId` 必须是已在 `main` 槽注册的 `key`，否则抛 `layout.selectPanel: main panel "<id>" is not registered`。传 `null` 回到会话 |
| `ctx.layout.toggleSidebar()` | 折叠/展开左栏 |
| `ctx.layout.openRightbar(track, fullscreen)` / `closeRightbar()` | 右侧栏 |
| `ctx.layout.beginNavigation()` | 返回 `AbortSignal`，用于取消挂起导航 |
| `ctx.layout.panelInfo` | store（`getSnapshot()` / `subscribe()`），快照 `{ activePanelId }` |
| `ctx.layout.hasMainPanel(id)` | 检查主面板是否已注册 |

#### `ctx.theme`（`dsh-client-ui-theme/lib/client.js:1890-2136`，`ctx.provide("theme", theme)` 在 L2318）

| 方法 | 说明 |
|---|---|
| `ctx.theme.getTheme()` | 返回**不可变快照**：`{ preference, fontSizes, fontFamilies, active: { id, colorScheme, tokens, icons }, themes, revision }` |
| `ctx.theme.setTheme(id)` | 切换偏好（`light` / `dark` / `system` 或已注册的第三方主题 id）；写入设置并广播 `theme/change` |
| `ctx.theme.setFontSize(role, px)` | `role` ∈ `text` / `code` / `terminal`；越界抛错 |
| `ctx.theme.adjustFontSizes(delta)` | 三个角色同时 ±1px |
| `ctx.theme.setFontFamily(role, value)` | 逗号分隔字体名，内部会规范化 |
| `ctx.theme.register(definition)` | 注册第三方主题（`{ id, colorScheme, tokens: { "--dsw-alias-x": { light, dark } }, icons }`）；返回 disposer |
| `ctx.theme.overrideTokens(source, tokens)` | 叠一层令牌覆盖（**必须 `{light, dark}` 成对**，单字符串会抛教学式 TypeError，见 L2188） |
| `ctx.theme.exportInspectTokens()` | 导出**令牌目录**（JSON-safe）：14 个内置已文档化令牌（`BUILTIN_INSPECT_TOKENS`，L1779-1878）+ 所有已注册/覆盖的名字 |

事件：`ctx.on("theme/change", snapshot => ...)`。

> `Theme.listTokens` 的等价物有两个：运行时用 `ctx.theme.exportInspectTokens()`；用 Agent 工具时用 `cordis_inspect_query` 查 **`Theme`** 服务（`SKILL.md:30`：「live Client Slots and theme tokens (`Slots`, `Theme`)」）。

#### `ctx.slots` —— 见 §5.1

#### `ctx.locale`（`dsh-client-ui-locale`）

| 方法 | 说明 |
|---|---|
| `ctx.locale.register(ns, dict)` | 注册多语言字典（`zh/en/ja/es/fr/de/ru/pt`） |
| `ctx.locale.bind(ns)` | 返回 `t(key, params?)` |
| `ctx.locale.resolveText(value)` | 解析可能含 `{placeholder}` 的文本 |
| `ctx.locale.subscribe(fn)` / `getSnapshot()` | 订阅 / 读 revision |

#### `ctx.uiConversation`（`dsh-client-ui-conversation/lib/client.js:4097`）

`ctx.uiConversation.events.register({ kind, ... })`（L3358）、`views.register`（L3632）、`groups.register`（L3655）、
`interactions.register`（L3678）、`userText.register`（L3944）、`binding(sessionId)`（L4138）、`seedImageUrl` / `imageUrl`。

#### 其它

`ctx.configForms`（设置表单作用域，theme 用它持有 `ui-theme` 命名空间）、
`ctx.remote` / `ctx.remote.$on` / `ctx.remote.$host`、`ctx.shortcuts.register` / `ctx.shortcuts.catalog`、
`ctx.productAnalytics.track`、`ctx.uiRenderer.mount`。

---


## 6. 前端实践约束（`references/practices.md` 逐条摘录）

文件：`/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-agent-preset/skills/cordis-plugin-development/references/practices.md`
（**注意**：SKILL.md:38 明确说，Desktop 里这个目录在 `app.asar` 内，**shell 命令读不到**，只有 Host 进程自己的文件读能打开；必须先复制到工作区。）

### 6.1 与「自定义页面 UI」直接相关的硬性要求

| # | 行号 | 硬性要求 |
|---|---|---|
| 1 | L33 | **不要 iframe / 不要自建 HTML 页**。「Render plugin pages as React components in a slot. Do not serve an HTML page from the Host and embed it in an iframe: an iframe document does not receive the host's theme tokens, light/dark switching, or `ctx.locale`.」 |
| 2 | L34 | **只用 `--dsw-alias-*` 令牌**。「Style with the theme tokens that `cordis_inspect_query` `Theme` lists (`--dsw-alias-*`); literal colors are for artwork only.」并强调令牌是「最低风险」的匹配方式——「a renamed token degrades appearance but never breaks rendering」 |
| 3 | L34 | **照抄宿主同类页面的间距/字号/行式样**；「the Plugin Manager page is the reference for management lists」 |
| 4 | L35 | **禁止 `require('@deepseek-ai/dsh-client-ui-primitives')` 或以模块方式加载任何 Harness Client 包**；`dsh.client.inject` 只用于排序激活顺序，仍然允许 |
| 5 | L35 | **自己写控件并对齐宿主**：把原语组件的 markup、CSS、行为复制进插件（源码 checkout 用 `src/*.tsx` + `*.module.css`，安装包用 `lib/index.js` + `lib/**/*.css`），或直接检查页面里已渲染的宿主控件 |
| 6 | L35 | **复制时**：类名换成自己插件的前缀；只保留 `--dsw-alias-*` 令牌引用；**保留用户依赖的行为**——Modal 的焦点与 Escape 处理、`role="switch"` 配 `aria-checked`、Tooltip 的 placement |
| 7 | L36 | **通过 slot 贡献**：`ctx.slots.inject(ownerKey, () => ctx.slots.register(...))`；回调里的注册在所属声明塌陷时被 dispose、声明回来时重新安装 |
| 8 | L36 | **通过 slot props 的 selector hook 读会话数据**，只订阅最小切片 |
| 9 | L36 | **不要在组件外写 DOM，不要 `append` 到 `document.body`** |
| 10 | L37 | **加 Chat 行**：先 `ctx.uiConversation.events.register()` 注册事件定义，再在 `conversation.chat.node` 槽里用该 `kind` 作为 renderer key 注册视图；会话层负责分页、Turn/Step 布局与增量装配 |
| 11 | L38 | 需要会话派生值时，在 Host projection 上声明 `wire.view`，值由 Host 算好送到 Client；**Client 自己不折叠会话事件** |

### 6.2 其它相关原则（同文件，摘要）

- L7　会话日志是唯一真相源，插件内存只是派生缓存。
- L8　注册是**归属某个 context 的 effect**；注册在别的 context（如 `agent.ctx`）等于两个所有者，自己的 effect 里也要留 disposer。
- L9　**框架驱动、插件计算**：订阅、缓存、发布交给框架；插件自己去扫 `session.events` 会绕过增量机制。
- L10　扩展点从弱到强：`ctx.tools.restrict()` < `ctx.tools.guard()` < waterfall 监听 < `system-prompt/assemble`；越强越要保别人的贡献。
- L12　**插件 UI 就是 Harness UI**：用宿主的主题令牌、locale 和布局模式，视觉与行为要对齐；**渲染表面选错了，后面再补样式也救不回来**。
- L20　可选服务放 `inject` 或 `ctx.inject([...], ...)`，缺服务时插件保持休眠而不是抛错。

### 6.3 `references/ui-plugin.md`（Web UI 专用）

| 行号 | 要求 |
|---|---|
| L3 | 读 `templates/decoration/` 并把文件写进 bundle 目录：`package.json` 加 `dsh.client` 段（`platform` / `immediately` / `inject`），并在 bundle patch 旁导出 `./client` |
| L5 | `index.js` 导出 `export function apply() {}`；patch 插入一行（按包名）。**简单绘制优先选有空间的 slot**，如 `conversation.composer.dock`；第一版就待在该 slot 的流里，不要绕开宿主控件设计动效路径；`shell.overlay` 只在确实需要浮层且位置确定时用 |
| L9 | 浏览器产物注册一个 **id 等于包名**的 lazy factory；**React 来自浏览器模块表**，不需要重复装 React、不需要 CDN 脚本、不需要找 UMD；有构建链时用部署的 Client 构建工具产出该格式，非基线的运行时 import 声明在 `dsh.client.external` |
| L11 | 工厂必须**无副作用**；样式、定时器、监听器等资源在 `apply` 里用 `ctx.effect`/`ctx.on` 注册并返回清理函数；组件局部样式可渲染成 React 元素，卸载即移除；**必须验证 dispose** |
| L13 | 容器与控件继承宿主主题，插画可用自己的颜色；页面/面板遵循 `practices.md` 的 UI 规则；**可见文案走 Client locale 服务**；**不要替换 app root，不要往 `document.body` 追加第二个应用**；**不要读别的插件的 DOM/样式表/组件源码来推测位置**——选一个已经分配了空间的 slot |

### 6.4 `SKILL.md` 的相关流程要求

| 行号 | 要求 |
|---|---|
| L23 | 只查需要的 API：`cordis_inspect_list` → 定向 `cordis_inspect_query`；**UI 查 Client `Slots.listSubTree`** 与目标 slot 的注册 options/props |
| L30 | 知识源优先级：① `cordis_inspect_query`（`Service` / `Event` / `Config.listConfigs` / `Tool` / **`Slots`** / **`Theme`**）→ ② 包 README → ③ 已安装包的 `lib/index.js` + `lib/types/**/*.d.ts`（含 JSDoc） |
| L38 | 包目录在 Desktop 里位于 `app.asar` 内，**shell / glob / grep / node / pnpm 都读不到**；必须复制到工作区再读 |

---

## 7. 坑清单（踩过就白踩）

| # | 坑 | 正确做法 |
|---|---|---|
| 1 | `require('@deepseek-ai/dsh-client-ui-primitives')` | `practices.md:35` 明令禁止。复制组件源码到插件里。技术上模块表里确实有这个 specifier，但契约不认 |
| 2 | 组件抛错 → **整条 slot 变空白**，控制台只打印 `slot entry crashed in '<slot>'` | 组件渲染体用 try/catch 兜底；渲染前把可能抛错的逻辑挪到 `apply` 里 |
| 3 | 用 `prefers-color-scheme` 媒体查询做配色 | 宿主用 `body[data-ds-dark-theme]`，与 OS 无关；只写 `--dsw-alias-*` 就行，别自己判断 |
| 4 | 写 `#fff` / `#151517` 这类字面色 | `practices.md:34`：literal colors 只给插画/图形用 |
| 5 | 复制了宿主的哈希类名（如 `_button_1ulci_2`） | 那些是 CSS Modules 产物，**跨包不保证存在**。改用自己的前缀，并**把 CSS 一起抄过来** |
| 6 | 抄了 CSS 但里面有非令牌色值 | 只保留 `--dsw-alias-*` 引用；硬编码色值要换成对应令牌 |
| 7 | 自定义「间距变量」 | 宿主没有间距令牌，各组件用裸 px（4/6/8/10/12/16/20/24/32），照抄页面 |
| 8 | 用 `--dsw-alias-bg-layer-4` | **这个令牌不存在**（只有 layer-1/2/3）。宿主自己的 CSS 里有一处误用（`_helpButton_181ew_41`），别跟着抄 |
| 9 | 直接 `background: var(--dsw-alias-bg-layer-2)` 以为有层次 | 浅色下 layer-1/2/3 **都是 `#fff`**（`--dsw-static-neutral-bluish-00`）。浅色模式的层次靠 **border/阴影**，不靠背景色；深色下才有 875/850/800 的阶梯 |
| 10 | 抬升表面又写 `border` 又写 `box-shadow` | 抬升层自带 0.5px 发丝描边，规则是 `border: 0` + `box-shadow: var(--dsw-elevation-*)` |
| 11 | 模态框遮罩加 `backdrop-filter: blur(...)` | 模态遮罩**保留半透明纯色、不加模糊**（`--dsw-mask-blur: none`；`backdrop-filter` 只属于菜单 `--dsw-menu-backdrop-filter`） |
| 12 | 用 `var(--dsh-hairline-width)` 但没等样式注入 | 该变量由 theme 的样式安装器写到 `documentElement`（`dsh-client-ui-theme/lib/client.js:1489`），有 fallback `.5px`，缺失时用 fallback 即可 |
| 13 | 焦点环在鼠标点击时还亮 | `html[data-input-modality='pointer']` 下环色被置透明（`focus.css`）。别自己写死环色，用 `var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary))` |
| 14 | 开关写成 `<input type="checkbox">` | 宿主的 Switch 是 `role="switch"` + `aria-checked` 的 `<button>`，`practices.md:35` 点名要保留 |
| 15 | Tooltip 自己算位置 | 位置算法在 `useAnchoredPosition` / `useAnchoredMaxHeight` 里，还要 `useDismissOnOutsidePointer`；placement 行为属于必须保留的部分 |
| 16 | `ctx.slots.renderSlot("main", …)` | `ctx.slots.renderSlot` **只允许渲染 `'root'`**，其它 slot 必须走组件 props 里的 `renderSlot` |
| 17 | 在 `apply` 外面做注册/定时器 | 工厂必须无副作用；注册、样式、定时器、监听器都要放进 `apply` 并用 `ctx.effect` 返回清理函数 |
| 18 | `ctx.layout.selectPanel("my-panel")` 抛 `not registered` | `selectPanel` 的 id 必须是 `main` 槽里已注册的 `key`；顺序上先注册再跳转 |
| 19 | `ctx.theme.overrideTokens(src, { "--x": "#fff" })` | 必须成对：`{ "--x": { light: "#fff", dark: "#fff" } }`，否则抛 TypeError（`lib/client.js:2188`） |
| 20 | 以为 `--dsw-static-*` 会随主题变 | 静态色板浅深几乎相同（只有 `--dsw-static-neutral-bluish-60` 不同）。主题差异全在 alias 层 |
| 21 | 找「Card / Table / EmptyState / ProgressBar」原语 | **不存在**。这些是各页面自写的 CSS；去抄插件管理器页或 markdown 表格样式 |
| 22 | 直接 `cat app.asar/dsh/...` 这样的**虚拟路径** | `app.asar` 内部路径 shell / rg / node 全都读不到（`SKILL.md:38`）。但 `app.asar` **本身是普通文件**，可写个解析器按 asar 头部 JSON 偏移直接抽文件（本调研就是这么做的），或用 Host 的文件读工具 |

---

## 8. 一页速查（可直接贴进新插件的 CSS 骨架）

```css
/* dsdp-panel.css —— 只用令牌，随主题自动切换 */
.dsdp-panel {
  box-sizing: border-box;
  border-radius: var(--dsw-radius-lg);
  border: .5px solid var(--dsw-alias-border-l4);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: var(--dsw-font-s-14);
  padding: 16px;
}
.dsdp-panel__title { margin: 0 0 8px; font: var(--dsw-font-base-strong-16); color: var(--dsw-alias-label-primary); }
.dsdp-panel__desc  { margin: 0; font: var(--dsw-font-xs-13); color: var(--dsw-alias-label-secondary); }
.dsdp-panel__row   { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: .5px solid var(--dsw-alias-border-l2); }
.dsdp-panel__row:last-child { border-bottom: none; }
.dsdp-panel__muted { color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xxs-12); }
.dsdp-panel__focus:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
```

```js
// client.js —— 无构建链插件骨架
window.__ModuleLoader__.load({
  id: '@local/my-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const PANEL_ID = 'my-panel';

    function Panel(props) {
      return h('div', { className: 'dsdp-panel' },
        h('h2', { className: 'dsdp-panel__title' }, props.title),
        h('p', { className: 'dsdp-panel__desc' }, props.desc),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind('my-panel');
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: PANEL_ID, locale: 'my-panel',
          inject: () => ({ title: t('title'), desc: t('desc') }),
        }, Panel));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL_ID, order: 20,
          label: () => t('nav'), locale: 'my-panel',
        }, function Icon() { return h('span', { 'aria-hidden': 'true' }, '◈'); }));
      },
    };
  },
});
```

---

## 附录 A：关键文件索引

| 内容 | 路径（`app.asar` 内） |
|---|---|
| 令牌 CSS（8 张表，内联字符串） | `dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js` — base `:1464`、corner-shape `:1467`、design-platform `:1470`、focus `:1473`、onboarding `:1476`、scrollbar `:1479`、gradient-shadow-text `:1482`、shiki `:1485` |
| 主题运行时（`ThemeRuntime`） | 同上 `:1890-2136`；`ctx.provide("theme", …)` `:2318` |
| 图标 sprite 注入 | 同上 `:1431 installIconSprite` |
| 令牌目录（14 个已文档化令牌） | 同上 `:1779-1878 BUILTIN_INSPECT_TOKENS` |
| 深色属性常量 / 主题来源属性 | `dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:571` / `:581` |
| `ctx.layout`（selectPanel 等） | 同上 `:506-549` |
| root slot 声明（含 `main`） | 同上 `:705-736` |
| `ctx.slots` 实现 | `dsh/node_modules/@deepseek-ai/dsh-client-ui-renderer/lib/client.js`（`inject` `:1368`、`register` `:1603`、`snapshot` `:1562`） |
| 侧边栏 slot 声明 | `dsh/node_modules/@deepseek-ai/dsh-client-ui-sidebar/lib/client.js:733-771` |
| 设置 slot 声明 | `dsh/node_modules/@deepseek-ai/dsh-client-ui-settings-general/lib/client.js:1522-1560` |
| 主面板 + 侧边栏注册范例 | `dsh/node_modules/@deepseek-ai/dsh-client-ui-plugin-manager/lib/client.js:7744-7826` |
| 会话 slot 声明 | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:22792-23110` |
| Chat 行注册范例 | `dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js:9234-9343` |
| 组件库 + 图标表 + 模块表 | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js`（导出表 `:194`、模块表 `:196`、图标定义 ≈`:562882`） |
| 宿主组件 CSS（可抄） | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-lh_YM6sT.css` |
| 插件开发约束 | `dsh/node_modules/@deepseek-ai/dsh-agent-preset/skills/cordis-plugin-development/references/{practices.md,ui-plugin.md,SKILL.md}` |
| 插件模板 | `dsh/node_modules/@deepseek-ai/dsh-agent-preset/skills/cordis-plugin-development/templates/decoration/*` |

## 附录 B：本次调研的方法与边界

- 只读。未修改任何 DSH 文件。调研用的临时解包产物已清理（`/tmp/dsh-extract/`、`/tmp/asar_ls.js` 等），用户提供的 `/tmp/dsh-theme/` 原样保留。
- `app.asar` 是二进制归档，用自写的 Node 解析器按 asar 头部 JSON + 数据偏移直接抽文件，未走 `npx asar`（避免联网）；解析器已随临时文件一并清理。
- 组件的 props 是从压缩后的产物**反推**的（`dsh-web-frontend/dist/assets/index-BgUyXZcc.js`），函数签名与 JSDoc 一致，但**未做运行时验证**。权威 API 请以 `cordis_inspect_query` 的 `Slots` / `Theme` 查询结果为准（`SKILL.md:30`）。
- `Theme.listTokens` 与 `Slots.listSubTree` 这两个名字**只出现在 `SKILL.md:23` / `ui-plugin.md:11` 的文档描述里**，静态产物中没有对应实现（它们是 Agent 侧 `cordis_inspect_query` 的服务名）。客户端等价物是 `ctx.theme.exportInspectTokens()` 与 `ctx.slots.snapshot(root)`。
