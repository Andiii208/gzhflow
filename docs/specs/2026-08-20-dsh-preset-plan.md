# gzhflow → DSH Preset 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 gzhflow 六阶段公众号工作流适配为 DSH Agent Preset（`.agent-presets/gzhflow/`），6 个质检脚本注册成真实 DSH 工具，随仓库 `dsh-preset/` 目录分发。

**Architecture:** preset 由 `preset.yml`（元信息）+ `agent.cordis.yml`（挂载 persona / agent-instructions / 工具模块）+ `tools/gzhflow-tools.mjs`（6 个脚本的薄包装，零外部依赖）组成。工具模块经 DSH 的 `ctx.subprocess` 服务跑仓库 `scripts/*.py`（沙箱合规），发布凭证经 `ctx.credentials` 读取并以 env 注入脚本。安装脚本把 `dsh-preset/` 与 `skills/gzhflow/` 以 junction/symlink 链接到 DSH 用户目录，改仓库即生效。

**Tech Stack:** Node ESM（仅 `node:` 内建模块）、PowerShell（install.ps1）、Bash（install.sh）、Python 3.11+（现有脚本）、YAML（preset 清单）。

**设计文档:** `docs/specs/2026-08-20-dsh-preset-design.md`（本计划的唯一权威 spec）

## Global Constraints

- **脚本零改动**：`scripts/*.py` 不因本 preset 做任何修改（保持纯 CLI、跨 agent 可复用）。
- **单一真源**：六阶段流程只存在于 `skills/gzhflow/SKILL.md`，preset 引用不复制。
- **凭证不落盘**：`WECHAT_APP_ID` / `WECHAT_APP_SECRET` 明文绝不写入仓库/日志/工具结果；只经 `ctx.credentials.resolve()` 读取、以子进程 env 注入。
- **零外部依赖**：`tools/gzhflow-tools.mjs` 只 import `node:` 内建（preset 相对路径在用户 home 下解析不到 `@deepseek-ai/*`）。
- **无 UI 面板**：v1 纯 preset + 工具，不建 dock 面板。
- **平台**：Windows 用 junction（`New-Item -ItemType Junction`），macOS/Linux 用 symlink（`ln -s`）；安装幂等（已存在则跳过）。
- **工具名**：`gzhflow_deai_score` / `gzhflow_check_prompt` / `gzhflow_validate_html` / `gzhflow_md2wechat` / `gzhflow_generate_image` / `gzhflow_publish_draft`（全计划一致）。
- **统一返回形状**：所有工具返回 `{ exit_code: number, output: string, stderr: string }`（`output` = 脚本 stdout，含 FAIL/WARN 明细文本，agent 据此判断）。

## 已实证的 DSH API（实现依据，勿偏离）

| 能力 | 写法 |
|---|---|
| 模块契约 | `export const name = '...'`；`export const inject = ['tools','credentials','subprocess']`；`export function apply(ctx, config)` |
| 注册工具 | `ctx.effect(() => ctx.tools.register({ ...tool, parameters: toJsonSchema(tool.parameters), output: { schema, render } }))` |
| 跑脚本 | `const h = ctx.subprocess.spawn({ argv: ['python', scriptPath, ...args], cwd: repoRoot, env: {...process.env, ...extra}, stdio: { stdin: 'ignore' 或 {data: '...'}, stdout: {maxBytes: 2e6}, stderr: {maxBytes: 2e6} } })`；`const { exitCode } = await h.done`；输出 `h.stdout?.text` / `h.stderr?.text` |
| 读凭证 | `const res = await ctx.credentials.resolve('WECHAT_APP_ID')` → `{ value, source } \| undefined` |

---

## 文件结构

| 文件 | 责任 |
|---|---|
| `dsh-preset/tools/gzhflow-tools.mjs`（新建） | 6 个脚本的 DSH 工具包装；`toJsonSchema` + `registerTool` 助手 + `runScript`（经 ctx.subprocess）+ 导出纯函数供测试 |
| `dsh-preset/preset.yml`（新建） | preset 元信息（name/description，出现在 DSH 预设选择 UI） |
| `dsh-preset/agent.cordis.yml`（新建） | 挂载 persona + agent-instructions + gzhflow-tools 模块 |
| `dsh-preset/install.ps1`（新建） | Windows 安装：junction 链接 preset 与 skill，幂等 |
| `dsh-preset/install.sh`（新建） | POSIX 安装：symlink 同上 |
| `dsh-preset/README.md`（新建） | 使用文档（安装/凭证/工具表/FAQ） |
| `scripts/validate_repo.py`（修改） | 增加 dsh-preset 完整性检查（必需文件存在 + 工具引用脚本存在） |

---

### Task 1: 工具模块 `dsh-preset/tools/gzhflow-tools.mjs`

**Files:**
- Create: `dsh-preset/tools/gzhflow-tools.mjs`
- Test: 命令行 `node --check` + `node -e` 冒烟（见步骤）

**Interfaces:**
- Consumes: DSH `ctx.tools` / `ctx.credentials` / `ctx.subprocess`（inject 声明）；仓库 `scripts/*.py`（只读调用）
- Produces: `export const name/inject/apply`（DSH 加载契约）；`export async function runScript(ctx, script, args, opts)`（测试用纯函数，返回 `{exitCode, stdout, stderr}`）

- [ ] **Step 1: 创建目录与文件骨架**

```bash
mkdir -p dsh-preset/tools
```

- [ ] **Step 2: 写完整模块内容**（整体写入 `dsh-preset/tools/gzhflow-tools.mjs`）

```js
/**
 * gzhflow-tools — gzhflow 六阶段质检门脚本的 DSH 工具包装层。
 *
 * 零外部依赖（preset 相对路径在用户 home 下解析不到 @deepseek-ai/*），只用 node: 内建。
 * 脚本本体在仓库 scripts/（纯 stdlib CLI），本模块只做参数 → ctx.subprocess 调用 → 结构化结果。
 *
 * DSH preset 模块契约：export const name / inject / apply(ctx, config)。
 * 工具统一返回 { exit_code, output, stderr }；output = 脚本 stdout（含 FAIL/WARN 明细）。
 */
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

export const name = 'gzhflow-tools'
export const inject = ['tools', 'credentials', 'subprocess']

/** 仓库根：本文件位于 <repo>/dsh-preset/tools/，向上两级。junction 链接下 Node 解析为真实路径。 */
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const SCRIPTS_DIR = join(REPO_ROOT, 'scripts')

/** 最小 spec → JSON Schema 编译器（preset 环境无法 import defineTool）。 */
function toJsonSchema(spec) {
  const properties = {}
  const required = []
  for (const [key, meta] of Object.entries(spec || {})) {
    const prop = { type: meta.type }
    if (Array.isArray(meta.enum)) prop.enum = meta.enum
    if (meta.description) prop.description = meta.description
    properties[key] = prop
    if (meta.required) required.push(key)
  }
  return { type: 'object', properties, required, additionalProperties: false }
}

/** 跑一个 scripts/*.py（经 ctx.subprocess，沙箱合规）。返回 {exitCode, stdout, stderr}。 */
export async function runScript(ctx, script, args = [], opts = {}) {
  const handle = ctx.subprocess.spawn({
    argv: [opts.python ?? 'python', join(SCRIPTS_DIR, script), ...args],
    cwd: REPO_ROOT,
    env: { ...process.env, ...(opts.env ?? {}) },
    stdio: {
      stdin: opts.stdinData !== undefined ? { data: opts.stdinData } : 'ignore',
      stdout: { maxBytes: opts.maxBytes ?? 2_000_000 },
      stderr: { maxBytes: opts.maxBytes ?? 2_000_000 },
    },
  })
  const { exitCode } = await handle.done
  return {
    exitCode: exitCode ?? 1,
    stdout: (handle.stdout?.text ?? '').trim(),
    stderr: (handle.stderr?.text ?? '').trim(),
  }
}

/** 统一结果包装：脚本返回 → 工具返回。 */
function wrap(r) {
  return { exit_code: r.exitCode, output: r.stdout, stderr: r.stderr }
}

export function apply(ctx, config) {
  const pythonBin = config.python ?? 'python'
  const registerTool = (tool) => ctx.effect(() => ctx.tools.register({
    ...tool,
    parameters: toJsonSchema(tool.parameters),
  }))

  registerTool({
    name: 'gzhflow_deai_score',
    description: 'gzhflow 去 AI 味机器门（ai_flavor_score.py）。exit_code 0=硬禁令清零，1=有 FAIL（必须清零才能交稿）；output 含 FAIL/WARN 明细。',
    parameters: {
      text: { type: 'string', description: '待检文本（与 file 二选一）' },
      file: { type: 'string', description: '稿件 .md 路径（自动剥离 frontmatter 与签名行）' },
    },
    output: { schema: { type: 'object' }, render: (_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }] },
    async execute(args) {
      if (!args.text && !args.file) return { exit_code: 2, output: '参数错误：text 与 file 必须给一个', stderr: '' }
      const argv = args.file ? [args.file] : ['--text', args.text]
      return wrap(await runScript(ctx, 'ai_flavor_score.py', argv, { python: pythonBin }))
    },
  })

  registerTool({
    name: 'gzhflow_check_prompt',
    description: 'gzhflow 配图 prompt 质检门（check_image_prompt.py）。exit_code 0=PASS（含 WARN 不阻断），1=FAIL（硬规避或必需项缺失）。',
    parameters: {
      prompt: { type: 'string', required: true, description: '四段式编译出的图生 prompt 全文' },
    },
    output: { schema: { type: 'object' }, render: (_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }] },
    async execute(args) {
      if (!args.prompt) return { exit_code: 2, output: '参数错误：prompt 必填', stderr: '' }
      return wrap(await runScript(ctx, 'check_image_prompt.py', [], { stdinData: args.prompt, python: pythonBin }))
    },
  })

  registerTool({
    name: 'gzhflow_validate_html',
    description: 'gzhflow 排版 HTML 校验（validate_gzh_html.py）。exit_code 0=0 ERROR 通过，1=有 ERROR（必须清零才能推送）。',
    parameters: {
      html: { type: 'string', required: true, description: 'md2wechat 产出的 HTML 全文' },
    },
    output: { schema: { type: 'object' }, render: (_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }] },
    async execute(args) {
      if (!args.html) return { exit_code: 2, output: '参数错误：html 必填', stderr: '' }
      return wrap(await runScript(ctx, 'validate_gzh_html.py', ['--stdin'], { stdinData: args.html, python: pythonBin }))
    },
  })

  registerTool({
    name: 'gzhflow_md2wechat',
    description: 'gzhflow Markdown → 公众号 HTML 转换（md2wechat.py）。返回输出路径（output 首行）。',
    parameters: {
      md_path: { type: 'string', required: true, description: '稿件 .md 路径' },
      theme: { type: 'string', description: '主题名（默认 zen；可选 minimal）' },
      output: { type: 'string', description: '输出 HTML 路径（默认 <md 同目录>_排版_<主题>.html）' },
    },
    output: { schema: { type: 'object' }, render: (_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }] },
    async execute(args) {
      const argv = [args.md_path, '--theme', args.theme ?? 'zen']
      if (args.output) argv.push('-o', args.output)
      return wrap(await runScript(ctx, 'md2wechat.py', argv, { python: pythonBin }))
    },
  })

  registerTool({
    name: 'gzhflow_generate_image',
    description: 'gzhflow 图生（generate_image.py，OpenAI 兼容接口）。exit_code 0=成功，1=API 失败，2=缺 key/配置；output 含保存路径。',
    parameters: {
      prompt: { type: 'string', required: true, description: '四段式编译出的图生 prompt' },
      ratio: { type: 'string', description: '画布比例（默认读 config image_spec.cover_ratio，兜底 16:9）' },
      size: { type: 'string', description: '直接指定 size（如 1280x720），覆盖比例映射' },
      output: { type: 'string', required: true, description: '输出图片路径' },
      n: { type: 'number', description: '生成张数（默认 1）' },
    },
    output: { schema: { type: 'object' }, render: (_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }] },
    async execute(args) {
      const argv = ['--prompt', args.prompt, '-o', args.output]
      if (args.ratio) argv.push('--ratio', args.ratio)
      if (args.size) argv.push('--size', args.size)
      if (args.n && args.n > 1) argv.push('--n', String(args.n))
      return wrap(await runScript(ctx, 'generate_image.py', argv, { python: pythonBin }))
    },
  })

  registerTool({
    name: 'gzhflow_publish_draft',
    description: 'gzhflow 推草稿箱（publish_draft.py，微信官方 API）。凭证从 DSH 凭据存储读取（WECHAT_APP_ID / WECHAT_APP_SECRET），经 env 注入，不进命令行参数。建议先 dry_run=true 验证。',
    parameters: {
      html: { type: 'string', required: true, description: '排版 HTML 路径' },
      title: { type: 'string', required: true, description: '文章标题' },
      author: { type: 'string', description: '作者（默认 frontmatter > config > 空）' },
      summary: { type: 'string', description: '摘要（默认截取正文前 120 字）' },
      cover: { type: 'string', description: '封面图路径（默认读 frontmatter coverImage）' },
      dry_run: { type: 'boolean', description: 'true=只验证不推送（不取 token）' },
    },
    output: { schema: { type: 'object' }, render: (_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }] },
    async execute(args) {
      const credentials = ctx.get('credentials')
      const read = async (ref) => {
        const res = credentials ? await credentials.resolve(ref) : undefined
        return res?.value
      }
      const appId = await read('WECHAT_APP_ID')
      const appSecret = await read('WECHAT_APP_SECRET')
      if (!appId || !appSecret) {
        return { exit_code: 2, output: '', stderr: '❌ 未配置公众号凭证：请先在 DSH 设置 → 凭据 → 填写 WECHAT_APP_ID 与 WECHAT_APP_SECRET' }
      }
      const argv = [args.html, '--title', args.title]
      if (args.author) argv.push('--author', args.author)
      if (args.summary) argv.push('--summary', args.summary)
      if (args.cover) argv.push('--cover', args.cover)
      if (args.dry_run) argv.push('--dry-run')
      const r = await runScript(ctx, 'publish_draft.py', argv, {
        env: { WECHAT_APP_ID: appId, WECHAT_APP_SECRET: appSecret },
        python: pythonBin,
      })
      return wrap(r)
    },
  })
}
```

- [ ] **Step 3: 语法检查**

Run: `node --check dsh-preset/tools/gzhflow-tools.mjs`
Expected: 无输出，exit 0

- [ ] **Step 4: 冒烟测试（runScript 直连真实脚本，不依赖 DSH）**

构造最小假 ctx 后 import 模块并跑真实脚本：

```bash
node -e "
import('./dsh-preset/tools/gzhflow-tools.mjs').then(async (m) => {
  const fakeCtx = {
    subprocess: {
      spawn: (spec) => {
        // 用 child_process 模拟 ctx.subprocess 契约（仅测试用）
        const { spawn } = require('node:child_process');
        const child = spawn(spec.argv[0], spec.argv.slice(1), { cwd: spec.cwd, env: spec.env });
        let out = '', err = '';
        child.stdout.on('data', (d) => out += d);
        child.stderr.on('data', (d) => err += d);
        if (spec.stdio.stdin?.data) child.stdin.end(spec.stdio.stdin.data); else child.stdin.end();
        return {
          done: new Promise((res) => child.on('close', (code) => res({ exitCode: code }))),
          stdout: { get text() { return out } },
          stderr: { get text() { return err } },
        };
      },
    },
  };
  const r1 = await m.runScript(fakeCtx, 'ai_flavor_score.py', ['--text', '这是一个干净的句子。']);
  console.log('clean exit:', r1.exitCode);            // 期望 0
  const r2 = await m.runScript(fakeCtx, 'ai_flavor_score.py', ['--text', '这是——破折号。']);
  console.log('dash exit:', r2.exitCode);             // 期望 1（破折号 FAIL）
  if (r1.exitCode !== 0 || r2.exitCode !== 1) process.exit(1);
  console.log('SMOKE OK');
})
"
```

Run: 上述命令（工作目录 = 仓库根）
Expected: `clean exit: 0` / `dash exit: 1` / `SMOKE OK`，exit 0

- [ ] **Step 5: 提交**

```bash
git add dsh-preset/tools/gzhflow-tools.mjs
git commit -m "feat(dsh-preset): gzhflow 工具模块（6 个质检门的 DSH 工具包装）"
```

---

### Task 2: preset 清单（preset.yml + agent.cordis.yml）

**Files:**
- Create: `dsh-preset/preset.yml`
- Create: `dsh-preset/agent.cordis.yml`

**Interfaces:**
- Consumes: Task 1 的 `./tools/gzhflow-tools.mjs`（agent.cordis.yml 相对路径挂载）
- Produces: 可被 DSH 预设系统识别的 `preset.yml`（name/description）与 `agent.cordis.yml`（挂载清单）

- [ ] **Step 1: 写 `dsh-preset/preset.yml`**

```yaml
name: gzhflow 公众号主编
description: "gzhflow 六阶段公众号工作流：素材先行 → 写作 → 去AI味 → 配图 → 排版 → 推草稿箱。含 6 个质检门工具（去AI味/配图prompt/HTML校验/排版/图生/发布）与审阅纪律。"
```

- [ ] **Step 2: 写 `dsh-preset/agent.cordis.yml`**

```yaml
- id: persona
  name: '@deepseek-ai/dsh-persona'
  config:
    text: |
      你是公众号主编，负责按 gzhflow 六阶段流程生产公众号文章：
      ① 素材先行 → ② 写作 → ③ 去AI味 → ④ 配图（可选）→ ⑤ 排版 → ⑥ 推草稿箱。
      执行纪律：
      - 素材先行：用户没给的经历/场景/细节一律不写，这是去 AI 味的根本。
      - 质量门是硬门槛：每阶段跑对应 gzhflow_* 工具，FAIL 不进入下一阶段。
      - 默认停靠点：①②③ 阶段完成后必须输出全文给用户审阅，用户确认后才进入下一阶段。
      - 发布走草稿箱（gzhflow_publish_draft 先 dry_run=true 验证），最终由用户在公众号助手 App 手动发布。
      - 流程细则以 gzhflow skill 的 SKILL.md 为准：先加载 skill；若未加载，直接读仓库 skills/gzhflow/SKILL.md。
- id: agent-instructions
  name: '@deepseek-ai/dsh-agent-instructions'
  config:
    maxBytes: 65536
- id: gzhflow-tools
  name: ./tools/gzhflow-tools.mjs
- id: tool-fs
  name: '@deepseek-ai/dsh-tool-fs'
- id: tool-fs-search
  name: '@deepseek-ai/dsh-tool-fs-search'
- id: tool-str-replace-editor
  name: '@deepseek-ai/dsh-tool-str-replace-editor'
- id: tool-pwsh
  name: '@deepseek-ai/dsh-tool-pwsh'
  disabled: !!js process.platform !== 'win32'
- id: tool-bash
  name: '@deepseek-ai/dsh-tool-bash'
  disabled: !!js process.platform === 'win32'
- id: tool-skill
  name: '@deepseek-ai/dsh-tool-skill'
```

- [ ] **Step 3: 校验 YAML 可解析**

Run: `python -c "import yaml, pathlib; yaml.safe_load(pathlib.Path('dsh-preset/preset.yml').read_text()); yaml.safe_load(pathlib.Path('dsh-preset/agent.cordis.yml').read_text()); print('YAML OK')"`
Expected: `YAML OK`

- [ ] **Step 4: 提交**

```bash
git add dsh-preset/preset.yml dsh-preset/agent.cordis.yml
git commit -m "feat(dsh-preset): preset 清单（persona + 工具模块挂载）"
```

---

### Task 3: 安装脚本（install.ps1 + install.sh）

**Files:**
- Create: `dsh-preset/install.ps1`
- Create: `dsh-preset/install.sh`

**Interfaces:**
- Consumes: 仓库 `dsh-preset/` 与 `skills/gzhflow/` 目录
- Produces: `~/.dsh/.agent-presets/gzhflow/`（→ dsh-preset/）与 `<skills 目录>/gzhflow`（→ skills/gzhflow/）的链接；幂等

- [ ] **Step 1: 写 `dsh-preset/install.ps1`**

> 注意：install.ps1 必须保存为 UTF-8 with BOM（PS 5.1 无 BOM 会把中文按 ANSI 解码导致解析失败）；`$Label:` 在 PS 5.1 会被解析为 drive-qualified 引用，须写 `${Label}:`。

```powershell
# gzhflow DSH preset 安装脚本（Windows）：junction 链接，改仓库即生效，幂等。
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }

function Link-Dir {
  param([string]$Source, [string]$Target, [string]$Label)
  if (Test-Path $Target) {
    $item = Get-Item $Target -Force
    if ($item.LinkType -eq 'Junction') { Write-Host "已存在链接，跳过: $Target" }
    else { Write-Host "⚠️ $Target 已存在但不是链接，跳过（如需覆盖请先手动删除）" }
    return
  }
  New-Item -ItemType Junction -Path $Target -Target $Source | Out-Null
  Write-Host "✅ 已链接 ${Label}: $Target -> $Source"
}

Link-Dir -Source (Join-Path $repoRoot 'dsh-preset') -Target (Join-Path $dshHome '.agent-presets\gzhflow') -Label 'preset'
$skillsDir = if (Test-Path (Join-Path $HOME '.agents\skills')) { Join-Path $HOME '.agents\skills' } else { Join-Path $dshHome 'skills' }
Link-Dir -Source (Join-Path $repoRoot 'skills\gzhflow') -Target (Join-Path $skillsDir 'gzhflow') -Label 'skill'
Write-Host '安装完成。在 DSH 新建会话选择「gzhflow 公众号主编」预设。'
```

- [ ] **Step 2: 写 `dsh-preset/install.sh`**

```bash
#!/usr/bin/env bash
# gzhflow DSH preset 安装脚本（macOS/Linux）：symlink，改仓库即生效，幂等。
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"

link_dir() {
  local source="$1" target="$2" label="$3"
  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ -L "$target" ]; then echo "已存在链接，跳过: $target"; else echo "⚠️ $target 已存在但不是链接，跳过"; fi
    return
  fi
  mkdir -p "$(dirname "$target")"
  ln -s "$source" "$target"
  echo "✅ 已链接 $label: $target -> $source"
}

link_dir "$REPO_ROOT/dsh-preset" "$DSH_HOME/.agent-presets/gzhflow" "preset"
SKILLS_DIR="${HOME}/.agents/skills"
[ -d "$SKILLS_DIR" ] || SKILLS_DIR="$DSH_HOME/skills"
link_dir "$REPO_ROOT/skills/gzhflow" "$SKILLS_DIR/gzhflow" "skill"
echo "安装完成。在 DSH 新建会话选择「gzhflow 公众号主编」预设。"
```

- [ ] **Step 3: 本机安装验证（Windows）**

Run: `powershell -ExecutionPolicy Bypass -File dsh-preset/install.ps1`
Expected: 输出两条「✅ 已链接」；`Test-Path "$HOME\.dsh\.agent-presets\gzhflow"` 为 True

- [ ] **Step 4: 幂等验证**

Run: 再次执行 install.ps1
Expected: 输出「已存在链接，跳过」×2，exit 0

- [ ] **Step 5: 提交**

```bash
git add dsh-preset/install.ps1 dsh-preset/install.sh
git commit -m "feat(dsh-preset): 安装脚本（junction/symlink，幂等）"
```

---

### Task 4: 使用文档 `dsh-preset/README.md`

**Files:**
- Create: `dsh-preset/README.md`

**Interfaces:**
- Consumes: Task 1-3 的产物（工具名、安装命令、凭证键名）
- Produces: 使用者可照文档完成安装/配置/使用

- [ ] **Step 1: 写 `dsh-preset/README.md`**

```markdown
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

安装脚本把 `dsh-preset/` 链接到 `~/.dsh/.agent-presets/gzhflow/`、把 `skills/gzhflow/` 链接到 DSH skill 目录，
改仓库即生效（junction/symlink），重复安装幂等。

## 使用

1. 在 DSH 新建会话，选择预设「gzhflow 公众号主编」。
2. 说「用 gzhflow 写一篇关于 XX 的文章」。
3. 按六阶段推进：每阶段跑对应 gzhflow_* 工具质检，①②③ 完成输出全文审阅。

## 凭证（仅发布阶段需要）

推草稿箱需要公众号 AppID/AppSecret，从 DSH 凭据存储读取（不写入本仓库）：

- DSH 设置 → 凭据 → 新增 `WECHAT_APP_ID`、`WECHAT_APP_SECRET` 两项。

未配置时 `gzhflow_publish_draft` 返回友好错误提示配置，不会泄露或误用。

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

- **脚本改仓库立即生效吗？** 是——preset 是指向仓库的链接，`scripts/` 与 `skills/` 改动即时可见。
- **凭证放哪里安全？** DSH 凭据存储（`.credentials.yaml`，0600）；不要写进 config/publish.yaml 或任何提交。
- **个人号能直接发布吗？** 不能（2025-07 起 freepublish 回收），只能推草稿箱 + 公众号助手 App 手动发布。
```

- [ ] **Step 2: 链接/格式自检**

Run: `python scripts/validate_repo.py`
Expected: ✅ 校验通过（README 内路径均在代码围栏或纯文本中，无失效 markdown 链接）

- [ ] **Step 3: 提交**

```bash
git add dsh-preset/README.md
git commit -m "docs(dsh-preset): 安装/使用/凭证文档"
```

---

### Task 5: validate_repo.py 增加 dsh-preset 校验

**Files:**
- Modify: `scripts/validate_repo.py`（在 `check_versions` 之后新增 `check_dsh_preset`，并在 `main()` 调用）

**Interfaces:**
- Consumes: 仓库 `dsh-preset/` 目录结构
- Produces: `errors` 列表新增 `[dsh-preset]` 前缀条目

- [ ] **Step 1: 在 `scripts/validate_repo.py` 的 `check_versions` 函数之后新增校验函数**

```python
# ---- 5. dsh-preset 完整性（工具 ↔ 脚本映射） ----
DSH_PRESET_FILES = ("preset.yml", "agent.cordis.yml", "tools/gzhflow-tools.mjs",
                    "install.ps1", "install.sh", "README.md")


def check_dsh_preset():
    preset_dir = ROOT / "dsh-preset"
    if not preset_dir.exists():
        return  # 仓库未启用 dsh-preset，跳过
    for rel in DSH_PRESET_FILES:
        if not (preset_dir / rel).exists():
            errors.append(f"[dsh-preset] 缺少文件: dsh-preset/{rel}")
    tools_mjs = preset_dir / "tools" / "gzhflow-tools.mjs"
    if tools_mjs.exists():
        text = tools_mjs.read_text(encoding="utf-8")
        for m in re.finditer(r"['\"]([a-z0-9_]+\.py)['\"]", text):
            if not (ROOT / "scripts" / m.group(1)).exists():
                errors.append(f"[dsh-preset] 工具引用了不存在的脚本: scripts/{m.group(1)}")
```

- [ ] **Step 2: 在 `main()` 中调用（`check_versions()` 之后）**

```python
def main():
    check_links()
    check_refs()
    check_secrets()
    check_versions()
    check_dsh_preset()
```

- [ ] **Step 3: 运行校验**

Run: `python scripts/validate_repo.py`
Expected: ✅ 校验通过（`dsh-preset/` 完整，6 个工具引用的脚本均存在）

- [ ] **Step 4: 破坏性负测（可选，快速确认校验生效）**

Run: `python -c "import sys; sys.path.insert(0,'scripts'); import validate_repo as v; v.ROOT=v.Path('dsh-preset'); v.errors.clear()"` 可跳过——改用临时验证：
Run: `python -c "import sys; sys.path.insert(0,'scripts'); import validate_repo as v; v.ROOT = v.Path('.') ; v.check_dsh_preset(); print('errors:', v.errors); assert not v.errors"`
Expected: `errors: []`

- [ ] **Step 5: 提交**

```bash
git add scripts/validate_repo.py
git commit -m "feat(validate_repo): dsh-preset 完整性校验（必需文件 + 工具脚本映射）"
```

---

### Task 6: 端到端验收 + 全量回归

**Files:**
- 无新增（验证既有产物）

**Interfaces:**
- Consumes: Task 1-5 全部产物

- [ ] **Step 1: 工具模块语法 + 冒烟复跑**

Run: `node --check dsh-preset/tools/gzhflow-tools.mjs` 与 Task 1 Step 4 的冒烟命令
Expected: 均 exit 0，`SMOKE OK`

- [ ] **Step 2: 全量回归（报告第 2 节）**

```bash
python -m py_compile scripts/*.py
python scripts/validate_repo.py
python scripts/ai_flavor_score.py --text "这是一个普通的句子，没有破折号也没有黑话。"
echo "cold-pressed paper, brush stroke, 晕染, 16:9" | python scripts/check_image_prompt.py
python -c "import sys; sys.path.insert(0,'scripts'); import md2wechat; print(md2wechat.load_theme('zen')['name'], md2wechat.load_theme('minimal')['name'])"
python scripts/generate_image.py --prompt test --ratio 16:9 -o /tmp/t.png  # 期望 exit 2（缺 key）
```

Expected: py_compile 0；validate_repo ✅；ai_flavor_score 0；check_image_prompt 0；`zen minimal`；generate_image exit 2

- [ ] **Step 3: 安装验证（Windows 本机）**

Run: `powershell -ExecutionPolicy Bypass -File dsh-preset/install.ps1`（两次，第二次验证幂等）
Expected: 第一次两条「✅ 已链接」，第二次两条「已存在链接，跳过」

- [ ] **Step 4: 预设会话冒烟（人工/UI 验证，记录结果）**

在 DSH 新建会话选择「gzhflow 公众号主编」预设，确认：
1. persona 纪律在系统提示中生效；
2. 6 个 `gzhflow_*` 工具出现在工具清单；
3. 调用 `gzhflow_deai_score --text "干净的句子。"` 返回 exit_code 0。

（此步若当前会话无法切换预设，记录为「待人工验证」并说明，不阻塞其余步骤。）

- [ ] **Step 5: 提交收尾（若 Step 1-3 有修复则提交，否则跳过）**

```bash
git status --short
```

Expected: 工作树干净（或仅有预期未提交项）

---

## Self-Review 记录

- **Spec 覆盖**：设计文档 §3 目录 → Task 1-4；§4 挂载清单 → Task 2；§5 工具层 + §5.1 凭证 → Task 1（publish 工具 env 注入，无命令行泄露）；§6 安装/使用 → Task 3-4；§7 测试验收 → Task 5-6。无缺口。
- **占位符**：无 TBD/TODO；所有步骤含真实代码与命令。
- **类型一致性**：`runScript` 返回 `{exitCode, stdout, stderr}`（Task 1 Step 2 定义），`wrap` 产出 `{exit_code, output, stderr}`；Task 1 冒烟与 Task 6 复跑均按此断言。6 个工具名在 Task 1/2/4/5 中一致。`WECHAT_APP_ID`/`WECHAT_APP_SECRET` 键名在 Task 1/4 一致。
