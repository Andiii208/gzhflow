# gzhflow DSH preset 安装脚本（Windows）：junction 链接，改仓库即生效，幂等。
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }

function Link-Dir {
  param([string]$Source, [string]$Target, [string]$Label)
  if (Test-Path $Target) {
    $item = Get-Item $Target -Force
    if ($item.LinkType -eq 'Junction') { Write-Host "已存在链接，跳过: $Target" }
    else { Write-Host "⚠️ $Target 已存在但不是链接，跳过（如需覆盖请先手动删除）" }
    return
  }
  New-Item -ItemType Junction -Path $Target -Target $Source | Out-Null
  Write-Host "✅ 已链接 ${Label}: $Target -> $Source"
}

Link-Dir -Source (Join-Path $repoRoot 'dsh-preset') -Target (Join-Path $dshHome '.agent-presets\gzhflow') -Label 'preset'
$skillsDir = if (Test-Path (Join-Path $HOME '.agents\skills')) { Join-Path $HOME '.agents\skills' } else { Join-Path $dshHome 'skills' }
Link-Dir -Source (Join-Path $repoRoot 'skills\gzhflow') -Target (Join-Path $skillsDir 'gzhflow') -Label 'skill'
Write-Host '安装完成。在 DSH 新建会话选择「gzhflow 公众号主编」预设。'
