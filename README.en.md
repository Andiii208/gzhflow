# gzhflow · A Cross-Agent WeChat Official Account Publishing Workflow

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A **reusable, cross-agent** workflow framework for publishing WeChat Official Account (公众号) content: from "a topic" to "a styled, illustrated, de-AI-flavored article in your draft box", as a six-stage pipeline with a quality gate at every step.

> Works with Claude Code, Cursor, Codex CLI, Gemini CLI, Qwen Code, DeepSeek, and other mainstream agents. Also compatible with the Hermes `SKILL.md` format (same-origin standard).

## Features

- **Cross-agent, out of the box**: `AGENTS.md` as the single source of truth + a one-line `CLAUDE.md` bridge
- **Six-stage pipeline**: material-first → writing → de-AI → illustration → layout → publish, each with a quality gate
- **Personalization is pluggable**: writing styles / image styles / layout themes live in `config/` + `examples/`, never hard-coded into the flow
- **Three-tier quality gates**: deterministic script gates + LLM self-check checklists + human review/dry-run
- **Works for personal accounts**: official API `draft/add` (available to personal 订阅号) + manual paste fallback
- **Pure CLI tools**: stdlib-first, no external dependencies, cross-platform

## Quick Start

```bash
cp config/workflow.example.yaml config/workflow.yaml
cp config/styles.example.yaml config/styles.yaml
cp config/themes.example.yaml config/themes.yaml
cp config/publish.example.yaml config/publish.yaml

python scripts/validate_repo.py

# Then tell any agent:
#   "Use the gzhflow workflow to write a WeChat OA article about <topic>"
```

See [`docs/quickstart.md`](docs/quickstart.md) for full instructions.

> **Note**: WeChat OA publishing requires a Chinese WeChat Official Account and its AppID/AppSecret. Since 2025-07, personal accounts can no longer use the `freepublish` API to publish directly — `gzhflow` pushes to the **draft box** via `draft/add` (still available), and you tap "publish" in the 公众号助手 app yourself.

## Use in DeepSeek Harness (DSH plugin)

gzhflow is also packaged as a DSH plugin (a `dsh.bundle` manifest in `package.json`):

```bash
# registers 7 gzhflow_* tools (6 quality gates + env self-check) and ships the gzhflow skill
dsh plugin --profile web add https://github.com/Andiii208/gzhflow
```

Then tell any session "Use the gzhflow workflow to write a WeChat OA article about <topic>", or load the `gzhflow` skill.

For the "公众号主编" persona (session-scoped, opt-in), install the agent preset:

```bash
powershell -ExecutionPolicy Bypass -File dsh-preset/install.ps1   # Windows
bash dsh-preset/install.sh                                       # macOS / Linux
```

See [`dsh-preset/README.md`](dsh-preset/README.md).

## Pipeline

| Stage | Purpose | Gate |
|---|---|---|
| ① Material-first | Ask questions to mine real material — never fabricate | Intent triple-check |
| ② Writing | Write in the routed style | `ai_flavor_score.py` + self-check |
| ③ De-AI | Structural surgery + voice + person adaptation | `ai_flavor_score.py` re-check |
| ④ Illustration (opt.) | Source triage → style routing → 4-part prompt | `check_image_prompt.py` |
| ⑤ Layout | Theme routing → Markdown → WeChat HTML | `validate_gzh_html.py` |
| ⑥ Publish | Push to draft box | `publish_draft.py --dry-run` |

## License

MIT (see [LICENSE](LICENSE)); upstream boundaries in [NOTICE.md](NOTICE.md).
