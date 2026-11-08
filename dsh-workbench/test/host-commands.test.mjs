// 宿主命令离线自测：不重启 DSH，直接跑 index.js 里的命令处理器。
// 用法：node dsh-workbench/test/host-commands.test.mjs
// 会在系统临时目录里造一个假仓库，不碰真实仓库。
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 先备好临时仓库再 import：Host 在模块加载时就把 REPO_CANDIDATES 定死了
const tmp = mkdtempSync(join(tmpdir(), 'gzw-repo-'))
mkdirSync(join(tmp, 'skills', 'gzhflow'), { recursive: true })
writeFileSync(join(tmp, 'skills', 'gzhflow', 'SKILL.md'), '# skill\n')
mkdirSync(join(tmp, 'assets'), { recursive: true })
writeFileSync(join(tmp, 'assets', 'inbox.md'), '# inbox\n\n## 未处理\n<!-- 注释 -->\n\n## 已用\n\n## 沉淀\n')
mkdirSync(join(tmp, 'generated'), { recursive: true })
process.env.GZHFLOW_REPO = tmp
const mod = await import(new URL('../index.js', import.meta.url).href)

function makeCtx() {
  const commands = new Map()
  const ctx = {
    commands: {
      register(spec) {
        commands.set(spec.name, spec)
      },
    },
    get() {
      return undefined
    },
    effect(fn) {
      fn()
    },
  }
  mod.apply(ctx)
  return { commands, ctx }
}

async function run(commands, name, rawInput) {
  const spec = commands.get(name)
  if (spec === undefined) throw new Error('command not registered: ' + name)
  const result = await spec.handler({ rawInput })
  return result
}

let failures = 0
function check(label, condition, detail) {
  const ok = condition === true
  if (!ok) failures += 1
  console.log((ok ? 'PASS  ' : 'FAIL  ') + label + (detail === undefined ? '' : '  → ' + detail))
}

const { commands } = makeCtx()

// 1. 命令注册
const expected = ['gzh-env', 'gzh-bind', 'gzh-note', 'gzh-artifacts', 'gzh-read', 'gzh-gate', 'gzh-layout', 'gzh-publish']
for (const name of expected) check('注册命令 ' + name, commands.has(name))

// 2. 记一笔：写进「未处理」区，且不动其他区
const noteRes = await run(commands, 'gzh-note', '这是一条测试念头 --source 随手记 --json')
const noteData = JSON.parse(noteRes.text)
check('记一笔 ok', noteData.ok === true, noteRes.text.slice(0, 160))
const inboxText = readFileSync(join(tmp, 'assets', 'inbox.md'), 'utf8')
const inboxSection = inboxText.split('## 未处理')[1]?.split('## 已用')[0] ?? ''
check('记一笔落在未处理区', /- \[\d{4}-\d{2}-\d{2}\] 这是一条测试念头（来源：随手记）/.test(inboxSection), inboxText.replace(/\n/g, ' | '))
check('记一笔不动已用/沉淀区', inboxText.includes('## 已用') && inboxText.includes('## 沉淀') && !/## 已用\n- /.test(inboxText))

// 3. 记一笔：无内容要报错
const emptyNote = await run(commands, 'gzh-note', '   --json')
check('空内容被拒', JSON.parse(emptyNote.text).ok === false, emptyNote.text.slice(0, 120))

// 4. 读白名单：assets/ 已放开
const readVoice = await run(commands, 'gzh-read', 'assets/voice.md --json')
check('assets/ 目录在只读白名单内（不再 forbidden）', JSON.parse(readVoice.text).code !== 'forbidden', readVoice.text.slice(0, 120))
const readOutside = await run(commands, 'gzh-read', 'scripts/publish_draft.py --json')
check('仓库其他文件仍被拒绝', JSON.parse(readOutside.text).code === 'forbidden')

// 5. 发布：未确认 → confirm_required；确认但无封面 → no_cover
const publishNoConfirm = JSON.parse((await run(commands, 'gzh-publish', '--json')).text)
check('推送未确认被拦', publishNoConfirm.code === 'confirm_required', publishNoConfirm.message)
writeFileSync(join(tmp, 'generated', 'draft_排版_zen.html'), '<h1>x</h1>')
writeFileSync(join(tmp, 'state.md'), '状态: ②写作\n主题: 测试标题\n开写日期: 2026-01-01\n')
const publishNoCover = JSON.parse((await run(commands, 'gzh-publish', '--confirm --json')).text)
check('确认推送但无封面被拦', publishNoCover.code === 'no_cover', JSON.stringify(publishNoCover).slice(0, 300))

// 6. dry-run 不取 token（凭据缺失也不报错）
const dry = JSON.parse((await run(commands, 'gzh-publish', '--dry-run --json')).text)
check('dry-run 不需要凭据', dry.ok === true || dry.code === 'dry_run_failed', JSON.stringify(dry).slice(0, 300))

// 7. 绑定 sidecar 原子写
const bind = JSON.parse((await run(commands, 'gzh-bind', 'session-abc --json')).text)
check('绑定写入成功', bind.ok === true && bind.binding.sessionId === 'session-abc', JSON.stringify(bind).slice(0, 160))
check('sidecar 落在 generated/.gzh-workbench/run.json', existsSync(join(tmp, 'generated', '.gzh-workbench', 'run.json')))

console.log('\n' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'))
process.exit(failures === 0 ? 0 : 1)
