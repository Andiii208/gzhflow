import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'

export const inject = ['commands']

function repoCandidates() {
  const candidates = [process.env.GZHFLOW_REPO, join(process.cwd(), 'gzhflow'), join(process.cwd(), '..', 'gzhflow')]
  // 工作区常见布局：~/WorkBuddy/<项目名>/gzhflow
  const workspaceRoot = join(homedir(), 'WorkBuddy')
  try {
    for (const entry of readdirSync(workspaceRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      candidates.push(join(workspaceRoot, entry.name, 'gzhflow'))
    }
  } catch {
    // 工作区目录不存在就跳过
  }
  return candidates.filter((value) => typeof value === 'string' && value.length > 0)
}

const STATE_REL = 'state.md'
const SIDECAR_REL = 'generated/.gzh-workbench/run.json'
const SIDECAR_JOINED = join('generated', '.gzh-workbench', 'run.json')
const STATE_PATH_FIELD = 'gzhflow/state.md'
const MAX_READ_BYTES = 300 * 1024
const CIRCLED_STAGES = '①②③④⑤⑥⑦'
const READ_ALLOWED_FILES = new Set(['state.md', 'assets/log.md', 'assets/inbox.md'])
const READ_ALLOWED_DIRS = ['generated/', 'outputs/', 'assets/']

function findRepo() {
  for (const candidate of repoCandidates()) {
    if (existsSync(join(candidate, 'skills', 'gzhflow', 'SKILL.md'))) return candidate
  }
  return undefined
}

function resolvePython(repo) {
  const venv = join(repo, '.venv', 'bin', 'python')
  return existsSync(venv) ? venv : 'python3'
}

function toPosixPath(value) {
  return value.split(sep).join('/')
}

function repoRelative(repo, absPath) {
  return toPosixPath(relative(repo, absPath))
}

function humanBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function newestHtml(repo) {
  const generated = join(repo, 'generated')
  if (!existsSync(generated)) return undefined
  const files = readdirSync(generated)
    .filter((name) => name.endsWith('.html'))
    .map((name) => join(generated, name))
    .filter((path) => existsSync(path))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return files[0]
}

function parseCommandInput(rawInput) {
  const tokens = String(rawInput ?? '')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
  if (tokens.length > 0 && /^\/?gzh-/.test(tokens[0])) tokens.shift()
  const positional = []
  const flags = new Set()
  for (const token of tokens) {
    if (token.startsWith('--')) flags.add(token)
    else positional.push(token)
  }
  return { positional, flags, json: flags.has('--json') }
}

function jsonText(value) {
  return JSON.stringify(value)
}

function jsonResult(value) {
  return { kind: 'success', text: jsonText(value) }
}

// ---------------------------------------------------------------------------
// state.md 解析与绑定 sidecar
// ---------------------------------------------------------------------------

function matchStateField(raw, name) {
  // 行首允许缩进（state.md 里这些字段常写在代码块内），中英文冒号都认。
  const pattern = new RegExp(`^[ \\t]*${name}[ \\t]*[:：][ \\t]*(.*?)[ \\t]*$`, 'm')
  const match = raw.match(pattern)
  if (match === null) return null
  let value = match[1].replace(/[ \t]+#.*$/, '')
  value = value.replace(/^[`'"]+|[`'"]+$/g, '').trim()
  return value === '' ? null : value
}

function readArticle(repo) {
  const article = { key: null, topic: null, startDate: null }
  if (repo === undefined) return article
  const statePath = join(repo, STATE_REL)
  if (!existsSync(statePath)) return article
  let raw = ''
  try {
    raw = readFileSync(statePath, 'utf8')
  } catch {
    return article
  }
  const topic = matchStateField(raw, '主题')
  const startDate = matchStateField(raw, '开写日期')
  article.topic = topic
  article.startDate = startDate
  if (topic !== null && startDate !== null) {
    article.key = createHash('sha1').update(`${topic}\n${startDate}`, 'utf8').digest('hex').slice(0, 12)
  }
  return article
}

function bindingPath(repo) {
  return join(repo, SIDECAR_JOINED)
}

function readBinding(repo) {
  if (repo === undefined) return { binding: null, path: undefined, corrupt: false }
  const path = bindingPath(repo)
  if (!existsSync(path)) return { binding: null, path, corrupt: false }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { binding: null, path, corrupt: true }
    }
    return { binding: parsed, path, corrupt: false }
  } catch {
    return { binding: null, path, corrupt: true }
  }
}

function writeBinding(repo, sessionId, article) {
  const path = bindingPath(repo)
  const dir = dirname(path)
  mkdirSync(dir, { recursive: true })
  const payload = {
    version: 1,
    articleKey: article.key,
    topic: article.topic,
    startDate: article.startDate,
    statePath: STATE_PATH_FIELD,
    sessionId,
    boundAt: new Date().toISOString(),
  }
  const tmp = join(dir, `run.json.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`)
  writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  renameSync(tmp, path)
  return { path, payload }
}

function clearBinding(repo) {
  const path = bindingPath(repo)
  const existed = existsSync(path)
  rmSync(path, { force: true })
  try {
    const dir = dirname(path)
    if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true, force: true })
  } catch {
    // 目录不存在或不可读都无所谓：绑定文件已经删掉就够了。
  }
  return { path, existed }
}

// ---------------------------------------------------------------------------
// 产物扫描
// ---------------------------------------------------------------------------

const ARTIFACT_RULES = [
  {
    id: 'anchors',
    stage: '①',
    kind: 'md',
    label: '素材锚点清单',
    dir: 'generated',
    test: (name) => /^01-素材锚点清单.*\.md$/.test(name),
  },
  { id: 'draft', stage: '②③', kind: 'md', label: '草稿', dir: 'generated', test: (name) => name === 'draft.md' },
  {
    id: 'manifest',
    stage: '④',
    kind: 'json',
    label: '配图 manifest',
    dir: 'generated',
    test: (name) => name === 'manifest.json',
  },
  { id: 'budget', stage: '④', kind: 'md', label: '预算单', dir: 'generated', test: (name) => name === '预算单.md' },
  {
    id: 'layout',
    stage: '⑤',
    kind: 'html',
    label: '排版稿',
    dir: 'generated',
    test: (name) => /_排版_.*\.html$/.test(name),
  },
  {
    id: 'publish-dry',
    stage: '⑥',
    kind: undefined,
    label: '发布 dry-run',
    dir: 'generated',
    test: (name) => /publish.*dry.*\.(json|txt|md)$/i.test(name),
  },
  { id: 'decisions', stage: '⑦', kind: 'md', label: '决策日志', dir: 'generated', test: (name) => name === '决策日志.md' },
  { id: 'log', stage: '⑦', kind: 'md', label: '发文日志', dir: 'assets', test: (name) => name === 'log.md' },
]

function kindFromName(name, fallback) {
  if (fallback !== undefined) return fallback
  const lower = name.toLowerCase()
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.html')) return 'html'
  if (lower.endsWith('.md')) return 'md'
  if (lower.endsWith('.txt')) return 'txt'
  return 'file'
}

function stageOrder(stage) {
  const index = CIRCLED_STAGES.indexOf(String(stage)[0])
  return index === -1 ? CIRCLED_STAGES.length : index
}

function listGeneratedFiles(repo) {
  const generated = join(repo, 'generated')
  if (!existsSync(generated)) return []
  try {
    return readdirSync(generated, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
  } catch {
    return []
  }
}

function scanArtifacts(repo) {
  const files = listGeneratedFiles(repo)
  const hits = new Map()
  for (const name of files) {
    let stat = undefined
    try {
      stat = statSync(join(repo, 'generated', name))
    } catch {
      continue
    }
    if (!stat.isFile()) continue
    for (const rule of ARTIFACT_RULES) {
      if (rule.dir !== 'generated') continue
      if (!rule.test(name)) continue
      const current = hits.get(rule.id)
      if (current === undefined || stat.mtimeMs > current.stat.mtimeMs) {
        hits.set(rule.id, { rule, name, stat })
      }
    }
  }
  for (const rule of ARTIFACT_RULES) {
    if (rule.dir !== 'assets') continue
    const abs = join(repo, rule.dir, 'log.md')
    if (!existsSync(abs)) continue
    let stat = undefined
    try {
      stat = statSync(abs)
    } catch {
      continue
    }
    if (!stat.isFile()) continue
    if (!rule.test('log.md')) continue
    hits.set(rule.id, { rule, name: 'log.md', stat })
  }
  const items = []
  for (const hit of hits.values()) {
    const rule = hit.rule
    const abs = join(repo, rule.dir, hit.name)
    items.push({
      id: rule.id,
      stage: rule.stage,
      kind: kindFromName(hit.name, rule.kind),
      path: repoRelative(repo, abs),
      bytes: hit.stat.size,
      mtimeMs: hit.stat.mtimeMs,
      label: rule.label,
    })
  }
  items.sort((a, b) => stageOrder(a.stage) - stageOrder(b.stage) || a.id.localeCompare(b.id))
  return items
}

// ---------------------------------------------------------------------------
// /gzh-read 路径与大小守卫
// ---------------------------------------------------------------------------

function resolveReadTarget(repo, rawPath) {
  const repoResolved = resolve(repo)
  const target = resolve(repoResolved, rawPath)
  if (target !== repoResolved && !target.startsWith(repoResolved + sep)) {
    return { error: 'forbidden' }
  }
  const rel = toPosixPath(relative(repoResolved, target))
  const allowed =
    READ_ALLOWED_FILES.has(rel) || READ_ALLOWED_DIRS.some((prefix) => rel.startsWith(prefix))
  if (!allowed) return { error: 'forbidden' }
  return { rel, target }
}

function readRepoText(repo, rawPath) {
  const resolved = resolveReadTarget(repo, rawPath)
  if (resolved.error !== undefined) return { ok: false, code: resolved.error }
  if (!existsSync(resolved.target)) return { ok: false, code: 'not_found' }
  let stat = undefined
  try {
    stat = statSync(resolved.target)
  } catch {
    return { ok: false, code: 'not_found' }
  }
  if (!stat.isFile()) return { ok: false, code: 'not_found' }
  if (stat.size > MAX_READ_BYTES) return { ok: false, code: 'too_large', bytes: stat.size }
  let text = ''
  try {
    text = readFileSync(resolved.target, 'utf8')
  } catch {
    return { ok: false, code: 'not_found' }
  }
  return {
    ok: true,
    path: resolved.rel,
    bytes: stat.size,
    lines: text.split('\n').length,
    text,
  }
}

// ---------------------------------------------------------------------------
// 脚本执行
// ---------------------------------------------------------------------------

function runScriptRaw(repo, script, args) {
  const python = resolvePython(repo)
  const result = spawnSync(python, [join(repo, 'scripts', script), ...args], {
    cwd: repo,
    encoding: 'utf8',
    timeout: 120000,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  })
  return {
    code: result.error !== undefined ? 2 : result.status ?? 2,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    error: result.error,
  }
}

function formatScriptReport(script, result) {
  if (result.error !== undefined) {
    return { code: 2, text: `[${script}] 无法执行：${result.error.message}` }
  }
  const code = result.code
  const lines = [`[${script}] exit ${code}`, result.stdout]
  if (result.stderr !== '') lines.push(`stderr:\n${result.stderr}`)
  return { code, text: lines.join('\n') }
}

function runScript(repo, script, args) {
  return formatScriptReport(script, runScriptRaw(repo, script, args))
}

function tryParseJsonOutput(text) {
  const trimmed = text.trim()
  if (trimmed === '') return undefined
  try {
    const value = JSON.parse(trimmed)
    return value === null ? undefined : value
  } catch {
    // 脚本可能在 JSON 前后混了日志行：从最后一行往前找可解析的 JSON。
  }
  const lines = trimmed.split('\n')
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index].trim()
    if (line === '' || !(line.startsWith('{') || line.startsWith('['))) continue
    try {
      const value = JSON.parse(line)
      if (value !== null) return value
    } catch {
      // 继续往前找。
    }
  }
  return undefined
}

function rawGateText(result) {
  if (result.error !== undefined) return `无法执行：${result.error.message}`
  const parts = [result.stdout]
  if (result.stderr !== '') parts.push(`stderr:\n${result.stderr}`)
  return parts.filter((part) => part !== '').join('\n')
}

function runGateJson(repo, target, script, args, fileBaseArgs) {
  const first = runScriptRaw(repo, script, [...args, '--json'])
  if (first.error === undefined) {
    const data = tryParseJsonOutput(first.stdout)
    if (data !== undefined) {
      return jsonResult({
        ok: true,
        target,
        exit: first.code,
        script: `scripts/${script}`,
        data,
      })
    }
  }
  // 脚本还不支持 --json（或 stdout 不是可解析的 JSON）：退回默认人类输出，raw 带回。
  const fallback = runScriptRaw(repo, script, fileBaseArgs)
  return jsonResult({
    ok: true,
    target,
    exit: fallback.code,
    script: `scripts/${script}`,
    json: null,
    raw: rawGateText(fallback),
  })
}

// ---------------------------------------------------------------------------
// /gzh-note：记一笔 —— 追加到 assets/inbox.md 的「未处理」区
// ---------------------------------------------------------------------------

const INBOX_REL = 'assets/inbox.md'
const INBOX_SKELETON = `# inbox —— 随手记的收件箱

> 三个分区：未处理（还没被任何文章用过）· 已用（被哪篇文章用了）· 沉淀（出现过两次以上的念头）。
> 工作台只往「未处理」区追加，其他内容原样保留。

## 未处理
<!-- 往下追加，格式：- [日期] 内容（来源：随手记/读到某处/聊天） -->

## 已用
<!-- - [日期] 内容 → 《文章标题》 -->

## 沉淀
<!-- - [日期] 内容（出现过 N 次） -->
`

function inboxSectionInsert(text, entry) {
  // 找到「## 未处理」区段，在该区段末尾（下一个 ## 之前）插入一行
  const lines = text.split('\n')
  const startIndex = lines.findIndex((line) => /^##\s*未处理\s*$/.test(line.trim()))
  if (startIndex === -1) {
    // 没有该分区：按骨架重建
    const rebuilt = text.trim() === '' ? INBOX_SKELETON : text.replace(/\s*$/, '\n\n## 未处理\n') + entry + '\n'
    return rebuilt
  }
  let endIndex = lines.length
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index].trim())) {
      endIndex = index
      break
    }
  }
  // 去掉区段末尾的空行，插入后再补回
  while (endIndex - 1 > startIndex && lines[endIndex - 1].trim() === '') endIndex -= 1
  lines.splice(endIndex, 0, entry)
  return lines.join('\n')
}

function noteCommand(rawInput, ctx) {
  let raw = String(rawInput ?? '')
  const json = /--json\b/.test(raw)
  raw = raw.replace(/--json\b/g, ' ').trim()
  const sourceMatch = /(?:^|\s)--source\s+(.*)$/s.exec(raw)
  const source = sourceMatch === null ? '' : sourceMatch[1].trim()
  const body = sourceMatch === null ? raw : raw.slice(0, sourceMatch.index).trim()
  const text = body.replace(/^\/gzh-note\s*/, '').trim()
  const repo = findRepo()
  if (repo === undefined) {
    return json ? jsonResult({ ok: false, code: 'no_repo' }) : { kind: 'error', text: '找不到 gzhflow 仓库' }
  }
  if (text === '') {
    return json ? jsonResult({ ok: false, code: 'empty' }) : { kind: 'error', text: '用法：/gzh-note <内容> [--source 随手记|读到某处|聊天]' }
  }
  const target = join(repo, INBOX_REL)
  const resolved = resolve(target)
  const repoResolved = resolve(repo)
  if (resolved !== repoResolved && !resolved.startsWith(repoResolved + sep)) {
    return json ? jsonResult({ ok: false, code: 'forbidden' }) : { kind: 'error', text: '禁止写入：路径不在仓库内' }
  }
  let current = ''
  try {
    current = existsSync(target) ? readFileSync(target, 'utf8') : INBOX_SKELETON
  } catch {
    current = INBOX_SKELETON
  }
  const stamp = new Date().toISOString().slice(0, 10)
  const entry = '- [' + stamp + '] ' + text.replace(/\s+/g, ' ') + (source === '' ? '' : '（来源：' + source + '）')
  const next = inboxSectionInsert(current, entry)
  mkdirSync(dirname(target), { recursive: true })
  const tmp = target + '.tmp-' + process.pid + '-' + Date.now()
  try {
    writeFileSync(tmp, next, 'utf8')
    renameSync(tmp, target)
  } catch (error) {
    try {
      rmSync(tmp, { force: true })
    } catch {}
    return json ? jsonResult({ ok: false, code: 'write_failed', error: String(error && error.message ? error.message : error) }) : { kind: 'error', text: '写入失败：' + String(error && error.message ? error.message : error) }
  }
  ctx?.logger?.info?.('gzh-note: inbox +1 · ' + text)
  if (json) return jsonResult({ ok: true, path: INBOX_REL, entry, source })
  return { kind: 'success', text: '已写入 ' + INBOX_REL + '：' + entry }
}

// ---------------------------------------------------------------------------
// 命令注册
// ---------------------------------------------------------------------------

function bindCommand(rawInput) {
  const { positional, json } = parseCommandInput(rawInput)
  const repo = findRepo()
  const article = readArticle(repo)

  if (json) {
    if (repo === undefined) {
      return jsonResult({ ok: false, code: 'no_repo', article })
    }
    const action = positional[0]
    if (action === undefined) {
      const { binding } = readBinding(repo)
      return jsonResult({
        ok: true,
        binding,
        article,
        match: binding !== null && article.key !== null && binding.articleKey === article.key,
      })
    }
    if (action === 'clear') {
      clearBinding(repo)
      return jsonResult({ ok: true, binding: null, article, match: false })
    }
    if (article.key === null) {
      return jsonResult({ ok: false, code: 'no_article', article })
    }
    const { payload } = writeBinding(repo, action, article)
    return jsonResult({ ok: true, binding: payload, article, match: true })
  }

  if (repo === undefined) return { kind: 'error', text: '找不到 gzhflow 仓库' }
  const action = positional[0]
  if (action === undefined) {
    const { binding, corrupt } = readBinding(repo)
    const articleLine =
      article.key === null
        ? '文章: state.md 未写「主题:」「开写日期:」'
        : `文章: ${article.topic}（${article.startDate}）key ${article.key}`
    if (binding === null) {
      const why = corrupt ? `${SIDECAR_REL} 损坏` : '未绑定'
      return { kind: 'success', text: [articleLine, `绑定: ${why}`].join('\n') }
    }
    const match = article.key !== null && binding.articleKey === article.key
    const session = typeof binding.sessionId === 'string' && binding.sessionId !== '' ? binding.sessionId : '（无 sessionId）'
    return {
      kind: 'success',
      text: [
        articleLine,
        `绑定: 会话 ${session}`,
        `匹配: ${match ? '一致' : '不一致（state.md 已变，建议重新 /gzh-bind <sessionId>）'}`,
      ].join('\n'),
    }
  }
  if (action === 'clear') {
    const { existed } = clearBinding(repo)
    return { kind: 'success', text: existed ? `已清除绑定（${SIDECAR_REL}）` : '没有绑定可清除' }
  }
  if (article.key === null) {
    return { kind: 'error', text: 'state.md 里没有可用的「主题:」「开写日期:」，无法绑定' }
  }
  const { payload } = writeBinding(repo, action, article)
  return {
    kind: 'success',
    text: [
      `已绑定: 会话 ${action} → ${payload.articleKey}`,
      `文章: ${payload.topic}（${payload.startDate}）`,
    ].join('\n'),
  }
}

function artifactsCommand(rawInput) {
  const { json } = parseCommandInput(rawInput)
  const repo = findRepo()
  if (repo === undefined) {
    return json ? jsonResult({ ok: false, code: 'no_repo', items: [] }) : { kind: 'error', text: '找不到 gzhflow 仓库' }
  }
  const items = scanArtifacts(repo)
  if (json) return jsonResult({ ok: true, repo, items })
  if (items.length === 0) {
    return { kind: 'success', text: `repo: ${repo}\n（generated/ 与 assets/log.md 暂无产物）` }
  }
  const lines = [`repo: ${repo}`]
  for (const item of items) {
    lines.push(`${item.stage} ${item.label}（${item.kind}） ${item.path}  ${humanBytes(item.bytes)}`)
  }
  return { kind: 'success', text: lines.join('\n') }
}

function readCommand(rawInput) {
  const { positional, json } = parseCommandInput(rawInput)
  const repo = findRepo()
  if (repo === undefined) {
    return json ? jsonResult({ ok: false, code: 'no_repo' }) : { kind: 'error', text: '找不到 gzhflow 仓库' }
  }
  const rawPath = positional[0]
  if (rawPath === undefined) {
    return json
      ? jsonResult({ ok: false, code: 'missing_path' })
      : { kind: 'error', text: '用法：/gzh-read <repo相对路径> [--json]' }
  }
  const result = readRepoText(repo, rawPath)
  if (json) {
    if (result.ok) {
      return jsonResult({ ok: true, path: result.path, bytes: result.bytes, lines: result.lines, text: result.text })
    }
    return jsonResult({ ok: false, code: result.code })
  }
  if (!result.ok) {
    if (result.code === 'forbidden') {
      return {
        kind: 'error',
        text: `禁止读取：${rawPath}\n只允许 state.md、generated/、outputs/、assets/log.md、assets/inbox.md`,
      }
    }
    if (result.code === 'too_large') {
      return {
        kind: 'error',
        text: `文件过大：${rawPath}（${humanBytes(result.bytes)} > 300 KB），请分段读取或在编辑器里打开`,
      }
    }
    return { kind: 'error', text: `文件不存在或不是文件：${rawPath}` }
  }
  return {
    kind: 'success',
    text: `${result.path}（${humanBytes(result.bytes)}，${result.lines} 行）\n${result.text}`,
  }
}

function gateCommand(rawInput) {
  const { positional, json } = parseCommandInput(rawInput)
  const repo = findRepo()
  if (repo === undefined) {
    return json ? jsonResult({ ok: false, code: 'no_repo' }) : { kind: 'error', text: '找不到 gzhflow 仓库' }
  }
  const target = positional[0] ?? 'draft'
  if (target === 'draft') {
    const draft = join(repo, 'generated', 'draft.md')
    if (!existsSync(draft)) {
      return json
        ? jsonResult({ ok: false, code: 'no_draft', target: 'draft' })
        : { kind: 'error', text: '找不到 generated/draft.md' }
    }
    if (json) {
      return runGateJson(
        repo,
        'draft',
        'ai_flavor_score.py',
        ['generated/draft.md', '--model', 'deepseek'],
        ['generated/draft.md', '--model', 'deepseek'],
      )
    }
    const report = runScript(repo, 'ai_flavor_score.py', ['generated/draft.md', '--model', 'deepseek'])
    return { kind: 'success', text: report.text }
  }
  if (target === 'html') {
    const html = newestHtml(repo)
    if (html === undefined) {
      return json
        ? jsonResult({ ok: false, code: 'no_html', target: 'html' })
        : { kind: 'error', text: '找不到任何 generated/*.html（先跑 md2wechat.py 生成排版稿）' }
    }
    const htmlArg = toPosixPath(html)
    if (json) {
      return runGateJson(repo, 'html', 'validate_gzh_html.py', [htmlArg], [htmlArg])
    }
    const report = runScript(repo, 'validate_gzh_html.py', [html])
    return { kind: 'success', text: `file: ${html}\n${report.text}` }
  }
  return json
    ? jsonResult({ ok: false, code: 'unknown_target', target })
    : { kind: 'error', text: `未知目标：${target}（可用 draft / html）` }
}

// ---------------------------------------------------------------------------
// /gzh-layout 与 /gzh-publish（P2：排版生成 + 发布 dry-run，推送永不自动）
// ---------------------------------------------------------------------------

function readDraftMeta(repo) {
  const meta = { title: null, author: null, description: null, coverImage: null }
  // 没有 draft.md 时也要能从 state.md 拿到标题
  const stateTitle = readArticle(repo).topic
  if (stateTitle !== null) meta.title = stateTitle
  const draftPath = join(repo, 'generated', 'draft.md')
  if (!existsSync(draftPath)) return meta
  let raw = ''
  try {
    raw = readFileSync(draftPath, 'utf8')
  } catch {
    return meta
  }
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  const source = frontmatter === null ? raw : frontmatter[1]
  for (const [key, name] of [
    ['title', 'title'],
    ['author', 'author'],
    ['description', 'description'],
    ['coverImage', 'coverImage'],
  ]) {
    const match = new RegExp(`^[ \\t]*${name}[ \\t]*[:：][ \\t]*(.*?)[ \\t]*$`, 'm').exec(source)
    if (match !== null) {
      const value = match[1].replace(/^[`'"]+|[`'"]+$/g, '').trim()
      if (value !== '' && value !== 'null') meta[key] = value
    }
  }
  if (meta.title === null) {
    meta.title = stateTitle
  }
  return meta
}

function layoutCommand(rawInput) {
  const { positional, flags, json } = parseCommandInput(rawInput)
  const repo = findRepo()
  if (repo === undefined) {
    return json ? jsonResult({ ok: false, code: 'no_repo' }) : { kind: 'error', text: '找不到 gzhflow 仓库' }
  }
  const draft = join(repo, 'generated', 'draft.md')
  if (!existsSync(draft)) {
    return json ? jsonResult({ ok: false, code: 'no_draft' }) : { kind: 'error', text: '找不到 generated/draft.md' }
  }
  const theme = (positional[0] ?? 'zen').replace(/[^a-zA-Z0-9_-]/g, '')
  if (theme === '') {
    return json ? jsonResult({ ok: false, code: 'bad_theme' }) : { kind: 'error', text: '主题名不合法' }
  }
  const args = ['generated/draft.md', '--theme', theme]
  if (!flags.has('--no-enhance')) args.push('--enhance')
  const result = runScriptRaw(repo, 'md2wechat.py', args)
  const expected = join(repo, 'generated', `draft_排版_${theme}.html`)
  const report = formatScriptReport('md2wechat.py', result)
  if (json) {
    return jsonResult({
      ok: result.code === 0,
      code: result.code === 0 ? undefined : 'script_failed',
      exit: result.code,
      theme,
      output: existsSync(expected) ? repoRelative(repo, expected) : null,
      text: report.text,
    })
  }
  return { kind: result.code === 0 ? 'success' : 'error', text: report.text }
}

function publishCommand(rawInput, ctx) {
  const { flags, json } = parseCommandInput(rawInput)
  const repo = findRepo()
  if (repo === undefined) {
    return json ? jsonResult({ ok: false, code: 'no_repo' }) : { kind: 'error', text: '找不到 gzhflow 仓库' }
  }
  const confirmed = flags.has('--confirm')
  if (!flags.has('--dry-run') && !confirmed) {
    const payload = {
      ok: false,
      code: 'confirm_required',
      message: '推送需要二次确认：再点一次确认，或带 --confirm 调用。发布永不自动。',
    }
    return json ? jsonResult(payload) : { kind: 'error', text: payload.message }
  }
  const htmlAbs = newestHtml(repo)
  if (htmlAbs === undefined) {
    return json ? jsonResult({ ok: false, code: 'no_html' }) : { kind: 'error', text: '找不到任何 generated/*.html（先跑 /gzh-layout）' }
  }
  const meta = readDraftMeta(repo)
  if (meta.title === null) {
    return json ? jsonResult({ ok: false, code: 'no_title' }) : { kind: 'error', text: '找不到标题（draft.md frontmatter 无 title，state.md 无主题）' }
  }
  const args = [repoRelative(repo, htmlAbs), '--title', meta.title]
  if (meta.author !== null) args.push('--author', meta.author)
  if (meta.description !== null) args.push('--summary', meta.description)
  let coverRel = null
  if (meta.coverImage !== null) {
    const candidate = resolve(join(repo, 'generated'), meta.coverImage)
    if (existsSync(candidate)) {
      coverRel = repoRelative(repo, candidate)
      args.push('--cover', coverRel)
    }
  }
  if (flags.has('--dry-run')) args.push('--dry-run')

  // 凭据只留在宿主：优先 DSH credentials，其次脚本自己读 config/publish.yaml；明文不下发浏览器。
  const env = { ...process.env, PYTHONIOENCODING: 'utf-8' }
  let credentialSource = 'config/publish.yaml'
  if (!flags.has('--dry-run')) {
    const provider = ctx !== undefined && ctx !== null ? ctx.get?.('credentials') ?? ctx.credentials : undefined
    const read = async (ref) => {
      if (provider === undefined || typeof provider.resolve !== 'function') return undefined
      try {
        const res = await provider.resolve(ref)
        return res?.value
      } catch {
        return undefined
      }
    }
    const appId = read('WECHAT_APP_ID')
    const appSecret = read('WECHAT_APP_SECRET')
    if (typeof appId === 'string' && appId !== '' && typeof appSecret === 'string' && appSecret !== '') {
      env.WECHAT_APP_ID = appId
      env.WECHAT_APP_SECRET = appSecret
      credentialSource = 'dsh-credentials'
    }
    if (coverRel === null) {
      const missing = '封面缺失：draft.md 的 frontmatter 没有 coverImage，或 generated/ 下找不到它。推草稿箱必须先有封面。'
      return json ? jsonResult({ ok: false, code: 'no_cover', message: missing }) : { kind: 'error', text: missing }
    }
  }

  const python = resolvePython(repo)
  const result = spawnSync(python, [join(repo, 'scripts', 'publish_draft.py'), ...args], {
    cwd: repo,
    encoding: 'utf8',
    timeout: 120000,
    env,
  })
  const report = formatScriptReport('publish_draft.py', result)
  const code = result.error !== undefined ? 2 : result.status ?? 2
  if (json) {
    return jsonResult({
      ok: code === 0,
      code: code === 0 ? undefined : flags.has('--dry-run') ? 'dry_run_failed' : 'push_failed',
      exit: code,
      mode: flags.has('--dry-run') ? 'dry-run' : 'push',
      html: repoRelative(repo, htmlAbs),
      title: meta.title,
      cover: coverRel,
      credentialSource: flags.has('--dry-run') ? 'none' : credentialSource,
      text: report.text,
    })
  }
  return { kind: code === 0 ? 'success' : 'error', text: report.text }
}

export function apply(ctx) {
  ctx.commands.register({
    name: 'gzh-env',
    description: 'gzhflow 工作台环境自检',
    handler: () => {
      const repo = findRepo()
      const venvPython = repo === undefined ? undefined : join(repo, '.venv', 'bin', 'python')
      const config = repo === undefined ? undefined : join(repo, 'config', 'workflow.yaml')
      const state = repo === undefined ? undefined : join(repo, 'state.md')
      const lines = [
        `repo: ${repo ?? '未找到'}`,
        `SKILL.md: ${repo !== undefined && existsSync(join(repo, 'skills', 'gzhflow', 'SKILL.md')) ? '有' : '无'}`,
        `state.md: ${state !== undefined && existsSync(state) ? '有' : '无'}`,
        `config/workflow.yaml: ${config !== undefined && existsSync(config) ? '有' : '无'}`,
        `.venv/bin/python: ${venvPython !== undefined && existsSync(venvPython) ? '有' : '无'}`,
        `node: ${process.version}`,
        `cwd: ${process.cwd()}`,
      ]
      return { kind: 'success', text: lines.join('\n') }
    },
  })

  ctx.commands.register({
    name: 'gzh-bind',
    description: '当前篇 ↔ 会话绑定：读绑定 / 写绑定 / clear',
    input: { hint: '[<sessionId>|clear] [--json]' },
    handler: ({ rawInput } = {}) => bindCommand(rawInput),
  })

  ctx.commands.register({
    name: 'gzh-note',
    description: '记一笔：追加到 assets/inbox.md 的「未处理」区',
    input: { hint: '<内容> [--source 随手记|读到某处|聊天] [--json]' },
    handler: ({ rawInput } = {}) => noteCommand(rawInput, ctx),
  })

  ctx.commands.register({
    name: 'gzh-artifacts',
    description: '列出 generated/ 七阶段产物与 assets/log.md',
    input: { hint: '[--json]' },
    handler: ({ rawInput } = {}) => artifactsCommand(rawInput),
  })

  ctx.commands.register({
    name: 'gzh-read',
    description: '按白名单读取 gzhflow 仓库文件（state.md / generated/ / outputs/ / assets log·inbox）',
    input: { hint: '<repo相对路径> [--json]' },
    handler: ({ rawInput } = {}) => readCommand(rawInput),
  })

  ctx.commands.register({
    name: 'gzh-gate',
    description: '跑 gzhflow 质检门：draft（去AI味）/ html（排版校验）',
    input: { hint: '[draft|html] [--json]' },
    handler: ({ rawInput } = {}) => gateCommand(rawInput),
  })

  ctx.commands.register({
    name: 'gzh-layout',
    description: '用 md2wechat.py 生成排版 HTML（默认主题 zen，默认 --enhance）',
    input: { hint: '[theme] [--no-enhance] [--json]' },
    handler: ({ rawInput } = {}) => layoutCommand(rawInput),
  })

  ctx.commands.register({
    name: 'gzh-publish',
    description: '发布：dry-run 只读检查；--confirm 才真推草稿箱（需二次确认，永不自动）',
    input: { hint: '[--dry-run|--confirm] [--json]' },
    handler: ({ rawInput } = {}) => publishCommand(rawInput, ctx),
  })
}
