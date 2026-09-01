/**
 * gzhflow-skill — 把 gzhflow 六阶段工作流 skill 作为「bundled」provider 注册进
 * DeepSeek Harness 的 ctx.skills 注册表，使 `dsh plugin add` 安装后无需任何
 * 文件拷贝即可被 skill 系统发现、加载。
 *
 * 零运行时依赖（只用 node: 内建），不 import @deepseek-ai/*（服务经 inject 注入）。
 * 与 gzhflow-tools.mjs 解耦：即使 skill 目录缺失，本模块也静默降级（list 返回空），
 * 不影响工具注册。
 *
 * DSH plugin 模块契约：export const name / inject / apply(ctx, config)。
 */
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

export const name = 'gzhflow-skill'
export const inject = ['skills']

// 模块位于 <pkg>/dsh-preset/tools/ → 打包的 skill 目录在 <pkg>/skills/gzhflow
const SKILL_DIR = fileURLToPath(new URL('../../skills/gzhflow/', import.meta.url))
const SKILL_MD = join(SKILL_DIR, 'SKILL.md')

// @deepseek-ai/dsh-skill 的 BUNDLED_SKILL_RANK：打包 provider 的标准优先级。
const BUNDLED_SKILL_RANK = 600
const INVOCATION = { modelInvocable: true, userInvocable: true }
const RESOURCE_BASE = { kind: 'directory', path: SKILL_DIR }

const FALLBACK_DESCRIPTION =
  '跨 Agent 公众号内容发布工作流（六阶段，带质量门）。'

/** 极简 YAML frontmatter 解析（skill 头只需 name/description 等纯键值）。 */
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return { body: text, meta: {} }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (kv) meta[kv[1]] = kv[2].trim()
  }
  return { body: text.slice(m[0].length), meta }
}

/** 读取并解析 SKILL.md（惰性，跟随文件改动；缺失返回 null）。 */
function readSkill() {
  let text
  try {
    text = readFileSync(SKILL_MD, 'utf8')
  } catch {
    return null
  }
  const { body, meta } = parseFrontmatter(text)
  return { body, meta }
}

const skillAtLoad = readSkill()
const DESCRIPTION = typeof skillAtLoad?.meta?.description === 'string'
  ? skillAtLoad.meta.description
  : FALLBACK_DESCRIPTION

const provider = {
  name: 'gzhflow',
  async list() {
    if (!existsSync(SKILL_MD)) return []
    return [{
      name: 'gzhflow',
      description: DESCRIPTION,
      rank: BUNDLED_SKILL_RANK,
      locator: SKILL_MD,
      path: SKILL_MD,
      metadata: skillAtLoad?.meta,
      source: 'bundled',
      provider: 'gzhflow',
      invocation: INVOCATION,
      resourceBase: RESOURCE_BASE,
    }]
  },
  async get() {
    const s = readSkill()
    if (!s) return undefined
    return {
      name: 'gzhflow',
      description: DESCRIPTION,
      content: s.body,
      path: SKILL_MD,
      metadata: s.meta,
      source: 'bundled',
      provider: 'gzhflow',
      invocation: INVOCATION,
      resourceBase: RESOURCE_BASE,
    }
  },
}

export function apply(ctx) {
  if (!ctx.skills || typeof ctx.skills.registerProvider !== 'function') return
  ctx.effect(() => ctx.skills.registerProvider(() => provider))
}
