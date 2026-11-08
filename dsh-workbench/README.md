# gzh-workbench — DSH 公众号工作台

把 gzhflow 的七阶段工作流搬进 DeepSeek Harness：侧栏一个「公众号工作台」入口，点开是一整页控制台。

它是**控制面**，不是新的真源：

- 只读 `state.md` / `generated/` / `assets/` 与会话事件，界面不存业务状态；
- 确定性动作（体检、排版、dry-run、推送）由宿主直接调 `scripts/` 里同一批 Python 脚本；
- 创作步骤交给绑定会话里的 Agent，工作台只发明确的中文指令；
- 关掉工作台，CLI 七阶段照样跑。

## 两个文件

| 文件 | 角色 |
|---|---|
| `index.js` | 宿主半：注册 `/gzh-env`、`/gzh-bind`、`/gzh-note`、`/gzh-artifacts`、`/gzh-read`、`/gzh-gate`、`/gzh-layout`、`/gzh-publish` 八个命令。凭据只在宿主解析，明文不下发浏览器。 |
| `client.js` | 客户端半：注册全局 `main` 面板与侧栏入口，纯 JS、无构建链。设计系统与可视化清单见 `../docs/dsh/gzhflow-DSH工作台计划-v2.md`。 |

## 安装

包是一个 DSH bundle，入口是 `cordis.patch.yml`：

```bash
# 1. 让包进 profile 的 node_modules（link 或发布到私有 registry 都可以）
cd ~/.dsh/profiles/desktop
pnpm add "link:/绝对路径/gzhflow/dsh-workbench"

# 2. 把 patch 里的 insert 段落合进 profile 的 cordis.patch.yml
#    （插件管理器的 install_bundle 会自动做这步）

# 3. 重启 DSH，让宿主半的命令注册生效
```

验证：

```bash
# 宿主半自检（不需要重启 DSH 也能跑）
node -e "import('./dsh-workbench/index.js').then(m=>{const c=new Map();m.apply({commands:{register:s=>c.set(s.name,s)},effect:f=>f(),get:()=>undefined});console.log([...c.keys()].join(', '))})"
```

## 宿主命令

| 命令 | 作用 | 备注 |
|---|---|---|
| `/gzh-env` | 环境自检 | 只打印路径与存在性 |
| `/gzh-bind [<sessionId>\|clear]` | 当前篇 ↔ 会话绑定 | sidecar 写在 `generated/.gzh-workbench/run.json`，原子写 |
| `/gzh-note <内容> [--source …]` | 记一笔 | 追加到 `assets/inbox.md` 的「未处理」区，按区插入，不动其他内容 |
| `/gzh-artifacts` | 列出七阶段产物 | 只扫 `generated/` 与 `assets/log.md` |
| `/gzh-read <路径>` | 按白名单读文件 | 白名单：`state.md`、`generated/`、`outputs/`、`assets/` |
| `/gzh-gate [draft\|html]` | 跑质检门 | 消费脚本原生 `--json`，旧脚本回退人类输出 |
| `/gzh-layout [theme]` | 生成排版 HTML | `md2wechat.py --enhance` |
| `/gzh-publish [--dry-run\|--confirm]` | 发布 | 默认要求二次确认；**只推草稿箱**，永不自动发布；凭据只在宿主 |

## 铁律

工作台不重写写作提示词与质量门规则，不把 `state.md` 复制成数据库，不做「一键优化到通过」，不提供「一键发布」。规则以 `skills/gzhflow/SKILL.md` 与 `AGENTS.md` 为准。
