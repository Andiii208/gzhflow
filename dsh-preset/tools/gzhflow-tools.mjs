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
import { readFileSync, existsSync } from 'node:fs'

export const name = 'gzhflow-tools'
export const inject = ['tools', 'credentials', 'subprocess']

/**
 * 解析 gzhflow 仓库根（含 scripts/）。部署形态有两种：
 *   1. 仓库内开发（junction 或直接路径）：本文件位于 <repo>/dsh-preset/tools/，向上两级即仓库根。
 *   2. 拷贝安装（DSH 预设发现不跟 junction，需真实目录）：安装器把 dsh-preset/ 拷到
 *      <dshHome>/.agent-presets/gzhflow/ 并在同目录写 .gzhflow-repo 指针文件。
 * 解析优先级：env GZHFLOW_REPO > 指针文件 > 仓库布局探测。找不到时抛错（runScript 会转成友好返回）。
 */
function resolveRepoRoot() {
  const envRepo = process.env.GZHFLOW_REPO
  if (envRepo) return envRepo
  const moduleDir = fileURLToPath(new URL('.', import.meta.url))
  const pointer = join(moduleDir, '..', '.gzhflow-repo')
  try {
    const fromPointer = readFileSync(pointer, 'utf8').trim()
    if (fromPointer && existsSync(join(fromPointer, 'scripts'))) return fromPointer
  } catch { /* 指针文件缺失 = 仓库内布局，走下方探测 */ }
  const repo = fileURLToPath(new URL('../../', import.meta.url))
  if (existsSync(join(repo, 'scripts'))) return repo
  throw new Error(
    'gzhflow-tools: 无法定位仓库根（scripts/ 不存在）。' +
    '若为拷贝安装请检查 <preset>/.gzhflow-repo 指针文件，或设环境变量 GZHFLOW_REPO。'
  )
}

const REPO_ROOT = resolveRepoRoot()
const SCRIPTS_DIR = join(REPO_ROOT, 'scripts')

/**
 * 极简读取仓库 config/workflow.yaml 的 image_backend 段（base_url/model/api_key_env）。
 * 纯行扫描，零依赖；文件缺失/解析失败返回空对象（调用方给引导信息）。
 */
function readImageBackendConfig() {
  const cfgPath = join(REPO_ROOT, 'config', 'workflow.yaml')
  let text
  try {
    text = readFileSync(cfgPath, 'utf8')
  } catch {
    return {}
  }
  const out = {}
  let inBackend = false
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (/^image_backend\s*:/.test(trimmed)) { inBackend = true; continue }
    if (/^\S/.test(trimmed)) inBackend = false // 顶层新键，退出 image_backend 段
    if (!inBackend) continue
    const m = /^(base_url|model|api_key_env)\s*:\s*"?([^"\s]+)"?/.exec(trimmed)
    if (m) out[m[1]] = m[2]
  }
  return out
}

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
  let handle
  try {
    handle = ctx.subprocess.spawn({
      argv: [opts.python ?? 'python', join(SCRIPTS_DIR, script), ...args],
      cwd: REPO_ROOT,
      env: opts.env ?? {}, // 只传增量：运行时自带清洗后的父环境基线，勿展开 ...process.env
      graceMs: opts.graceMs ?? 3000,
      stdio: {
        stdin: opts.stdinData !== undefined ? { data: opts.stdinData } : 'ignore',
        stdout: { maxBytes: opts.maxBytes ?? 2_000_000 },
        stderr: { maxBytes: opts.maxBytes ?? 2_000_000 },
      },
    })
  } catch (err) {
    return { exitCode: 2, stdout: '', stderr: `❌ 无法启动脚本（python 是否在 PATH？）: ${err?.message ?? err}` }
  }
  const { exitCode } = await handle.done
  return {
    exitCode: exitCode ?? 1,
    stdout: (handle.collected?.stdout?.readFrom(0)?.text ?? '').trim(),
    stderr: (handle.collected?.stderr?.readFrom(0)?.text ?? '').trim(),
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

  // 首次使用环境自检：会话开始第一步调用。只返回「已配置/缺失」状态，绝不返回凭据值。
  registerTool({
    name: 'gzhflow_check_env',
    description: 'gzhflow 环境自检（会话开始第一步）：检查公众号发布凭据（必填）与图生后端（选填）配置状态，返回结构化结果与引导建议。只返回是否已配置，不返回任何凭据值。',
    parameters: {},
    output: { schema: { type: 'object' }, render: (_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }] },
    async execute() {
      const credentials = ctx.get('credentials')
      const read = async (ref) => {
        if (credentials) {
          const res = await credentials.resolve(ref)
          if (res?.value !== undefined && res?.value !== '') return true
        }
        return !!(process.env[ref] && process.env[ref].length > 0)
      }
      const wechatId = await read('WECHAT_APP_ID')
      const wechatSecret = await read('WECHAT_APP_SECRET')
      const backend = readImageBackendConfig()
      const keyName = backend.api_key_env || 'IMAGE_API_KEY'
      const imageKey = await read(keyName)
      const wechatReady = wechatId && wechatSecret
      const backendReady = !!(backend.base_url && backend.model)
      const imageReady = backendReady && imageKey

      const wechatMissing = []
      if (!wechatId) wechatMissing.push('WECHAT_APP_ID')
      if (!wechatSecret) wechatMissing.push('WECHAT_APP_SECRET')
      const imageMissing = []
      if (!backendReady) imageMissing.push('image_backend.base_url/model（config/workflow.yaml）')
      if (!imageKey) imageMissing.push(keyName)

      let recommendation
      if (!wechatReady) {
        recommendation = '❌ 公众号凭据未配置（必填）：请编辑 ~/.dsh/.credentials.yaml 添加 ' +
          wechatMissing.join(' 与 ') + '，配置完成前不开始写作流程。'
      } else if (!imageReady) {
        recommendation = '⚠️ 图生后端未配置（选填）：④配图将走真实图轨（用户提供素材图，或 web_search 找合规真实图）；' +
          '如需 AI 生图，配置 config/workflow.yaml 的 image_backend 与 .credentials.yaml 的 ' + keyName + '。'
      } else {
        recommendation = '✅ 公众号凭据与图生后端均已配置，可完整跑六阶段。'
      }

      return {
        wechat_ready: wechatReady,
        wechat_missing: wechatMissing,
        image_generation_ready: imageReady,
        image_backend_configured: backendReady,
        image_key_configured: imageKey,
        image_key_env: keyName,
        recommendation,
      }
    },
  })

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
    description: 'gzhflow 图生（generate_image.py，OpenAI 兼容接口）。需先配置图生后端：仓库 config/workflow.yaml 的 image_backend（base_url/model）+ DSH 凭据 IMAGE_API_KEY。exit_code 0=成功，1=API 失败，2=缺 key/配置；output 含保存路径。',
    parameters: {
      prompt: { type: 'string', required: true, description: '四段式编译出的图生 prompt' },
      ratio: { type: 'string', description: '画布比例（默认读 config image_spec.cover_ratio，兜底 16:9）' },
      size: { type: 'string', description: '直接指定 size（如 1280x720），覆盖比例映射' },
      output: { type: 'string', required: true, description: '输出图片路径' },
      n: { type: 'number', description: '生成张数（默认 1）' },
    },
    output: { schema: { type: 'object' }, render: (_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }] },
    async execute(args) {
      // 图生后端引导：config/workflow.yaml 的 image_backend 段缺失时给可操作指引
      const backend = readImageBackendConfig()
      if (!backend.base_url || !backend.model) {
        return {
          exit_code: 2,
          output: '',
          stderr: '❌ 图生后端未配置：复制仓库 config/workflow.example.yaml 为 config/workflow.yaml，' +
                  '填写 image_backend.base_url（如 https://dashscope.aliyuncs.com/compatible-mode/v1）与 image_backend.model（如 wanx2.1-t2i-turbo）。',
        }
      }
      // key：DSH 凭据 IMAGE_API_KEY > 环境变量 IMAGE_API_KEY（或 config 里 api_key_env 指定的变量名）
      const credentials = ctx.get('credentials')
      const envKeyName = backend.api_key_env || 'IMAGE_API_KEY'
      const credRes = credentials ? await credentials.resolve(envKeyName) : undefined
      const apiKey = credRes?.value || process.env[envKeyName] || ''
      if (!apiKey) {
        return {
          exit_code: 2,
          output: '',
          stderr: `❌ 缺图生 API key：请编辑 ~/.dsh/.credentials.yaml 添加 ${envKeyName}: <你的key>（或设同名环境变量）。`,
        }
      }
      const argv = ['--prompt', args.prompt, '-o', args.output]
      if (args.ratio) argv.push('--ratio', args.ratio)
      if (args.size) argv.push('--size', args.size)
      if (args.n && args.n > 1) argv.push('--n', String(args.n))
      const r = await runScript(ctx, 'generate_image.py', argv, { env: { [envKeyName]: apiKey }, python: pythonBin })
      return wrap(r)
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
      const argv = [args.html, '--title', args.title]
      if (args.author) argv.push('--author', args.author)
      if (args.summary) argv.push('--summary', args.summary)
      if (args.cover) argv.push('--cover', args.cover)
      if (args.dry_run) argv.push('--dry-run')
      const env = {}
      if (!args.dry_run) {
        // dry_run 免凭证（与脚本一致：dry-run 在 load_credentials 前返回）
        const credentials = ctx.get('credentials')
        const read = async (ref) => {
          const res = credentials ? await credentials.resolve(ref) : undefined
          return res?.value
        }
        const appId = await read('WECHAT_APP_ID')
        const appSecret = await read('WECHAT_APP_SECRET')
        if (!appId || !appSecret) {
          return { exit_code: 2, output: '', stderr: '❌ 未配置公众号凭证：请编辑 ~/.dsh/.credentials.yaml 添加 WECHAT_APP_ID 与 WECHAT_APP_SECRET（详见 dsh-preset/README.md「凭证」）' }
        }
        env.WECHAT_APP_ID = appId
        env.WECHAT_APP_SECRET = appSecret
      }
      const r = await runScript(ctx, 'publish_draft.py', argv, { env, python: pythonBin })
      return wrap(r)
    },
  })
}
