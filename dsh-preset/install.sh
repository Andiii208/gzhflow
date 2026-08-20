#!/usr/bin/env bash
# gzhflow DSH preset 安装脚本（macOS/Linux）
# preset 用「真实目录拷贝 + .gzhflow-repo 指针」：DSH 预设发现不跟随 symlink（Node Dirent.isDirectory() 对 symlink 为 false）。
# skill 用 symlink（DSH 技能系统跟随链接）。脚本改动后重跑即可同步（幂等）。
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"

copy_preset() {
  local source="$1" target="$2"
  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ -L "$target" ]; then
      echo "检测到旧链接安装，移除后重建为真实目录: $target"
      rm -rf "$target"
    else
      echo "已存在目录，跳过: $target（如需强制同步请先手动删除）"
      return
    fi
  fi
  mkdir -p "$(dirname "$target")"
  cp -R "$source" "$target"
  printf '%s' "$REPO_ROOT" > "$target/.gzhflow-repo"
  echo "✅ 已安装 preset（真实目录）: $target"
  echo "   仓库指针: $target/.gzhflow-repo -> $REPO_ROOT"
}

link_skill() {
  local source="$1" target="$2"
  if [ -e "$target" ] || [ -L "$target" ]; then
    if [ -L "$target" ]; then echo "已存在链接，跳过: $target"; else echo "⚠️ $target 已存在但不是链接，跳过"; fi
    return
  fi
  mkdir -p "$(dirname "$target")"
  ln -s "$source" "$target"
  echo "✅ 已链接 skill: $target -> $source"
}

copy_preset "$REPO_ROOT/dsh-preset" "$DSH_HOME/.agent-presets/gzhflow"
SKILLS_DIR="${HOME}/.agents/skills"
[ -d "$SKILLS_DIR" ] || SKILLS_DIR="$DSH_HOME/skills"
link_skill "$REPO_ROOT/skills/gzhflow" "$SKILLS_DIR/gzhflow"
echo "安装完成。在 DSH 新建会话选择「gzhflow 公众号主编」预设。"
