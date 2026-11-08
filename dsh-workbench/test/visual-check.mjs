// 工作台视觉自检：用 headless Chrome 打开真实 DSH GUI，逐页截图并收集控制台错误。
// 用法：node dsh-workbench/test/visual-check.mjs /tmp/shot --tabs=总览,阶段 --theme=dark
// 需要 DSH 正在运行（默认 http://127.0.0.1:55261，可用 DSH_URL 覆盖）。
// 它只读本机 cookie 做临时登录，不写任何凭据。
import { spawn, execFileSync } from 'node:child_process'
import { rmSync, mkdirSync, writeFileSync } from 'node:fs'

const APP_URL = process.env.DSH_URL || 'http://127.0.0.1:55261'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const COOKIES_DB = process.env.HOME + '/Library/Application Support/@deepseek-ai/dsh-desktop/Cookies'
const PROFILE = '/tmp/dsh-chrome-visual-check'

function authCookie() {
  const out = execFileSync('sqlite3', [
    COOKIES_DB,
    "select name||char(9)||value from cookies where name like 'dsh-auth-%' order by expires_utc desc limit 1;",
  ], { encoding: 'utf8' }).trim()
  const [name, value] = out.split('\t')
  if (!name || !value) throw new Error('no dsh-auth cookie found')
  return { name, value }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForDevtools(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try { const res = await fetch('http://127.0.0.1:' + port + '/json/version'); if (res.ok) return await res.json() } catch {}
    await sleep(200)
  }
  throw new Error('devtools did not start')
}

class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.consoleErrors = []; this.pageErrors = [] }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = (e) => reject(new Error('ws error')) })
    const cdp = new Cdp(ws)
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)
      if (data.id !== undefined) {
        const p = cdp.pending.get(data.id)
        if (p) { cdp.pending.delete(data.id); data.error ? p.reject(new Error(JSON.stringify(data.error))) : p.resolve(data.result) }
        return
      }
      if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
        cdp.consoleErrors.push(data.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
      }
      if (data.method === 'Runtime.exceptionThrown') {
        const d = data.params.exceptionDetails
        cdp.pageErrors.push(d.exception?.description || d.text)
      }
    }
    return cdp
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
  async eval(expression, awaitPromise = true) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true })
    if (r.exceptionDetails) throw new Error('eval failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
    return r.result.value
  }
  async screenshot(path, full = false) {
    const r = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full })
    writeFileSync(path, Buffer.from(r.data, 'base64'))
    return path
  }
  async clickText(text, exact = true) {
    const expr = `(() => {
      const t = ${JSON.stringify(text)};
      const all = [...document.querySelectorAll('.gzw-tab,button,a,[role="button"],[role="tab"],li,div,span')];
      const nodes = all.filter(n => (n.innerText||n.textContent||'').trim().split('\\n')[0].trim() === t);
      const el = nodes[0] || all.find(n => (n.innerText||n.textContent||'').trim().includes(t));
      if (!el) return { ok:false };
      const target = el.closest('.gzw-tab,button,[role="button"],[role="tab"]') || el;
      target.scrollIntoView({block:'center'});
      target.click();
      return { ok:true, tag: target.tagName, cls: target.className };
    })()`
    return this.eval(expr)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const prefix = args[0] || '/tmp/gzw'
  const getArg = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=').slice(1).join('=') : d }
  const tabs = getArg('tabs', '总览,阶段,轨迹,产物,绑定').split(',').filter(Boolean)
  const theme = getArg('theme', 'dark')
  const width = parseInt(getArg('w', '1600'), 10)
  const height = parseInt(getArg('h', '1000'), 10)

  rmSync(PROFILE, { recursive: true, force: true })
  mkdirSync(PROFILE, { recursive: true })
  const port = 9600 + (process.pid % 300)
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + port, '--user-data-dir=' + PROFILE,
    `--window-size=${width},${height}`, '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' })
  const out = { shots: [], consoleErrors: [], pageErrors: [] }
  try {
    await waitForDevtools(port)
    const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()
    const page = targets.find((t) => t.type === 'page')
    const cdp = await Cdp.connect(page.webSocketDebuggerUrl)
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable')
    const cookie = authCookie()
    await cdp.send('Network.setCookie', { name: cookie.name, value: cookie.value, domain: '127.0.0.1', path: '/', httpOnly: false, secure: false })
    await cdp.send('Page.navigate', { url: APP_URL })
    await sleep(4000)
    // dismiss onboarding
    await cdp.eval(`(()=>{const n=[...document.querySelectorAll('*')].filter(x=>(x.textContent||'').trim()==='继续'&&x.children.length===0);n.forEach(x=>{x.click();x.parentElement&&x.parentElement.click()});return n.length})()`)
    await sleep(800)
    // theme
    if (theme === 'light') {
      await cdp.eval(`(()=>{try{document.body.removeAttribute('data-ds-dark-theme')}catch(e){};return document.body.getAttribute('data-ds-dark-theme')})()`)
    }
    // open workbench panel
    await cdp.clickText('公众号工作台')
    await sleep(4500)
    for (const tab of tabs) {
      const r = await cdp.clickText(tab)
      await sleep(1800)
      const path = `${prefix}-${theme}-${tab}.png`
      await cdp.screenshot(path)
      out.shots.push({ tab, ok: r.ok, path })
    }
    out.bodyText = (await cdp.eval('document.body.innerText')).slice(0, 4000)
    out.consoleErrors = cdp.consoleErrors.slice(0, 20)
    out.pageErrors = cdp.pageErrors.slice(0, 10)
  } finally {
    chrome.kill('SIGKILL')
  }
  console.log(JSON.stringify(out, null, 2))
}
main().catch((e) => { console.error(e.stack || String(e)); process.exit(1) })
