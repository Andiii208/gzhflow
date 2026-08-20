# gzhflow DSH preset 安装脚本（Windows）
# preset 用「真实目录拷贝 + .gzhflow-repo 指针」：DSH 预设发现不跟随 junction（Node Dirent.isDirectory() 对 junction 为 false），
# junction 装的 preset 不会被发现。skill 用 junction（DSH 技能系统跟随链接，已验证可用）。
# 脚本改动后重跑本脚本即可同步（幂等）；scripts/ 与 skills/ 的改动经 repo 指针/skill junction 即时生效。
# 注意：本文件必须保存为 UTF-8 with BOM（PS 5.1 无 BOM 会把中文按 ANSI 解码导致解析失败）。
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }

function Copy-Preset {
  param([string]$Source, [string]$Target)
  $repoPointer = Join-Path $Target '.gzhflow-repo'
  if (Test-Path $Target) {
    $item = Get-Item $Target -Force
    if ($item.LinkType) {
      # 旧版 junction 安装 → 移除后重建为真实目录（自愈）
      Write-Host "检测到旧链接安装（$($item.LinkType)），移除后重建为真实目录: $Target"
      Remove-Item -LiteralPath $Target -Recurse -Force
    } else {
      Write-Host "已存在目录，跳过: $Target（如需强制同步请先手动删除）"
      return
    }
  }
  Copy-Item -Path $Source -Destination $Target -Recurse -Force
  Set-Content -Path $repoPointer -Value $repoRoot -Encoding ASCII
  Write-Host "✅ 已安装 preset（真实目录）: $Target"
  Write-Host "   仓库指针: $repoPointer -> $repoRoot"
}

function Link-Skill {
  param([string]$Source, [string]$Target)
  if (Test-Path $Target) {
    $item = Get-Item $Target -Force
    if ($item.LinkType -eq 'Junction') { Write-Host "已存在链接，跳过: $Target" }
    else { Write-Host "⚠️ $Target 已存在但不是链接，跳过（如需覆盖请先手动删除）" }
    return
  }
  New-Item -ItemType Junction -Path $Target -Target $Source | Out-Null
  Write-Host "✅ 已链接 skill: $Target -> $Source"
}

Copy-Preset -Source (Join-Path $repoRoot 'dsh-preset') -Target (Join-Path $dshHome '.agent-presets\gzhflow')
$skillsDir = if (Test-Path (Join-Path $HOME '.agents\skills')) { Join-Path $HOME '.agents\skills' } else { Join-Path $dshHome 'skills' }
Link-Skill -Source (Join-Path $repoRoot 'skills\gzhflow') -Target (Join-Path $skillsDir 'gzhflow')
Write-Host '安装完成。在 DSH 新建会话选择「gzhflow 公众号主编」预设。'
