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
