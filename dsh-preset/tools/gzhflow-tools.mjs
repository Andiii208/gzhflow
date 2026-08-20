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