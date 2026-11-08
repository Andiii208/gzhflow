window.__ModuleLoader__.load({
  id: '@local/gzh-workbench',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    let serviceCtx = null

    // -----------------------------------------------------------------------
    // 设计系统
    // 只从 DSH 主题别名取底色/文字/描边，其余（青瓷绿 + 琥珀金）是本工作台自己的
    // 视觉语言；深浅色各自一套，靠 body[data-ds-dark-theme] 切换。
    // -----------------------------------------------------------------------
    const css = `
/* ==========================================================================
   gzhflow 工作台 · 设计系统 v2
   - 底色 / 描边 / 文字 / 圆角 / 阴影 / 动效 全部取 DSH 原生令牌
   - 工作台只定义「角色色」与自有排版尺度，明暗两套独立取值
   - 间距走 4px 基准刻度；字号走 DSH 字体阶
   ========================================================================== */
.gzw-root{
  /* ---- 角色色（浅色） ---- */
  --gzw-accent:#0f7a6c;
  --gzw-accent-strong:#0b5a50;
  --gzw-accent-soft:color-mix(in srgb,#0f7a6c 9%,transparent);
  --gzw-accent-line:color-mix(in srgb,#0f7a6c 26%,transparent);
  --gzw-warn:#9a5b06;
  --gzw-warn-soft:color-mix(in srgb,#e08b1e 15%,transparent);
  --gzw-warn-line:color-mix(in srgb,#c77700 30%,transparent);
  --gzw-danger:#ad2f38;
  --gzw-danger-soft:color-mix(in srgb,#d94a55 11%,transparent);
  --gzw-danger-line:color-mix(in srgb,#d94a55 28%,transparent);
  --gzw-info:#2a5cb8;
  --gzw-info-soft:color-mix(in srgb,#2f74d8 11%,transparent);
  --gzw-info-line:color-mix(in srgb,#2f74d8 26%,transparent);
  --gzw-decision:#5a49c6;
  --gzw-decision-soft:color-mix(in srgb,#6d5be0 11%,transparent);
  --gzw-decision-line:color-mix(in srgb,#6d5be0 26%,transparent);

  /* ---- 表面与描边 ---- */
  --gzw-surface:var(--dsw-alias-bg-layer-1);
  --gzw-surface-2:var(--dsw-alias-bg-layer-2);
  --gzw-surface-3:var(--dsw-alias-bg-layer-3);
  --gzw-surface-sunken:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 62%,transparent);
  --gzw-line:var(--dsw-alias-border-l2);
  --gzw-line-soft:var(--dsw-alias-border-l1);
  --gzw-line-strong:var(--dsw-alias-border-l3);

  /* ---- 文字 ---- */
  --gzw-ink:var(--dsw-alias-label-primary);
  --gzw-ink-2:var(--dsw-alias-label-secondary);
  --gzw-ink-3:var(--dsw-alias-label-tertiary);
  --gzw-ink-invert:var(--dsw-alias-label-primary-foreground);

  /* ---- 尺度 ---- */
  --gzw-s1:4px; --gzw-s2:8px; --gzw-s3:12px; --gzw-s4:16px; --gzw-s5:20px; --gzw-s6:24px; --gzw-s8:32px; --gzw-s10:40px; --gzw-s12:48px;
  --gzw-r1:4px; --gzw-r2:8px; --gzw-r3:12px; --gzw-r4:16px;
  --gzw-shadow:var(--dsw-elevation-soft);
  --gzw-shadow-panel:var(--dsw-elevation-panel);
  --gzw-shadow-prominent:var(--dsw-elevation-prominent);
  --gzw-font:var(--dsw-font-family);
  --gzw-mono:var(--ds-font-family-code);
  --gzw-dur:var(--ds-transition-duration);
  --gzw-dur-fast:var(--ds-transition-duration-fast);
  --gzw-dur-slow:var(--ds-transition-duration-slow);
  --gzw-ease:var(--ds-ease-in-out);

  height:100%;
  overflow:auto;
  box-sizing:border-box;
  background:var(--dsw-alias-bg-base);
  color:var(--gzw-ink);
  font-family:var(--gzw-font);
  font-size:var(--dsw-font-s-14-font-size,14px);
  line-height:var(--dsw-font-s-14-line-height,22px);
  -webkit-font-smoothing:antialiased;
  scroll-behavior:smooth;
}
body[data-ds-dark-theme] .gzw-root{
  --gzw-accent:#4fd8bb;
  --gzw-accent-strong:#7ee9d1;
  --gzw-accent-soft:color-mix(in srgb,#2dd4bf 14%,transparent);
  --gzw-accent-line:color-mix(in srgb,#2dd4bf 32%,transparent);
  --gzw-warn:#f0b45c;
  --gzw-warn-soft:color-mix(in srgb,#f2b95e 14%,transparent);
  --gzw-warn-line:color-mix(in srgb,#f2b95e 32%,transparent);
  --gzw-danger:#ff8f96;
  --gzw-danger-soft:color-mix(in srgb,#ff8f96 13%,transparent);
  --gzw-danger-line:color-mix(in srgb,#ff8f96 30%,transparent);
  --gzw-info:#8fb9ff;
  --gzw-info-soft:color-mix(in srgb,#7fb0ff 15%,transparent);
  --gzw-info-line:color-mix(in srgb,#7fb0ff 30%,transparent);
  --gzw-decision:#b4a6ff;
  --gzw-decision-soft:color-mix(in srgb,#9c8cff 16%,transparent);
  --gzw-decision-line:color-mix(in srgb,#9c8cff 30%,transparent);
  --gzw-surface-sunken:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 52%,transparent);
}
.gzw-root *{box-sizing:border-box}
.gzw-root button{font-family:inherit}
.gzw-root ::selection{background:var(--gzw-accent-soft)}
.gzw-root :focus-visible{outline:2px solid var(--gzw-accent);outline-offset:2px;border-radius:var(--gzw-r1)}

/* ============================ 排版工具 ============================ */
.gzw-display{font:var(--dsw-font-l-20);letter-spacing:-.01em}
.gzw-title{font:var(--dsw-font-m-18);letter-spacing:-.005em}
.gzw-body{font:var(--dsw-font-s-14)}
.gzw-meta{font:var(--dsw-font-xs-13);color:var(--gzw-ink-2)}
.gzw-micro{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-3)}
.gzw-eyebrow{font:var(--dsw-font-xxxs-11);letter-spacing:.14em;text-transform:uppercase;color:var(--gzw-ink-3);font-weight:600}
.gzw-num{font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.gzw-mono{font-family:var(--gzw-mono);font-size:var(--dsw-font-xxs-12-font-size,12px)}
.gzw-muted{color:var(--gzw-ink-2);font-size:var(--dsw-font-xs-13-font-size,13px);line-height:1.7}
.gzw-dim{color:var(--gzw-ink-3);font-size:var(--dsw-font-xxs-12-font-size,12px);line-height:1.65}
.gzw-error{color:var(--gzw-danger);font-size:var(--dsw-font-xs-13-font-size,13px);line-height:1.7}
.gzw-warn{color:var(--gzw-warn);font-size:var(--dsw-font-xs-13-font-size,13px);line-height:1.7}
.gzw-ok{color:var(--gzw-accent);font-size:var(--dsw-font-xs-13-font-size,13px);line-height:1.7}
.gzw-row{display:flex;align-items:center;gap:var(--gzw-s2);flex-wrap:wrap}
.gzw-row.tight{gap:var(--gzw-s1)}
.gzw-row.between{justify-content:space-between}
.gzw-spacer{flex:1}
.gzw-truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ============================ 应用外壳 ============================ */
.gzw-top{
  position:sticky;top:0;z-index:30;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 86%,transparent);
  backdrop-filter:blur(20px) saturate(160%);
  -webkit-backdrop-filter:blur(20px) saturate(160%);
  border-bottom:1px solid var(--gzw-line-soft);
}
.gzw-top-inner{
  max-width:1440px;margin:0 auto;padding:var(--gzw-s3) var(--gzw-s8);
  display:flex;align-items:center;gap:var(--gzw-s4);
}
.gzw-brand{display:flex;align-items:center;gap:var(--gzw-s3);min-width:0;flex:none}
.gzw-logo{
  width:32px;height:32px;border-radius:var(--gzw-r2);display:grid;place-items:center;
  color:#eafaf5;background:linear-gradient(145deg,#14907c,#0a4f49 72%);
  box-shadow:inset 0 1px 0 rgb(255 255 255 / .26),0 4px 12px -6px rgb(9 80 70 / .7);
  flex:none;
}
body[data-ds-dark-theme] .gzw-logo{color:#052822;background:linear-gradient(145deg,#7ff0d6,#2fae97 76%)}
.gzw-brand-text{display:flex;flex-direction:column;min-width:0}
.gzw-brand-title{font:var(--dsw-font-s-strong-14);line-height:1.2;white-space:nowrap}
.gzw-brand-meta{font:var(--dsw-font-xxxs-11);letter-spacing:.12em;text-transform:uppercase;color:var(--gzw-ink-3);white-space:nowrap;line-height:1.4}

.gzw-nav{display:flex;gap:2px;padding:3px;border-radius:var(--gzw-r2);background:var(--gzw-surface-sunken);border:1px solid var(--gzw-line-soft)}
.gzw-tab{
  appearance:none;border:0;background:transparent;color:var(--gzw-ink-2);
  font:var(--dsw-font-xs-13);padding:5px 12px;border-radius:6px;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;white-space:nowrap;
  transition:background var(--gzw-dur-fast) var(--gzw-ease),color var(--gzw-dur-fast) var(--gzw-ease);
}
.gzw-tab:hover{color:var(--gzw-ink);background:color-mix(in srgb,var(--gzw-surface-3) 70%,transparent)}
.gzw-tab.on{background:var(--gzw-surface);color:var(--gzw-ink);font-weight:600;box-shadow:var(--dsw-shadow-lv1)}
.gzw-tab-count{
  font:var(--dsw-font-xxxs-11);font-variant-numeric:tabular-nums;
  padding:0 5px;border-radius:5px;background:var(--gzw-surface-2);color:var(--gzw-ink-3);
}
.gzw-tab.on .gzw-tab-count{background:var(--gzw-accent-soft);color:var(--gzw-accent)}

.gzw-top-right{margin-left:auto;display:flex;align-items:center;gap:var(--gzw-s2);flex:none}
.gzw-context{
  display:flex;align-items:center;gap:var(--gzw-s3);min-width:0;flex:1;
  padding-left:var(--gzw-s4);border-left:1px solid var(--gzw-line-soft);
}
.gzw-context-title{font:var(--dsw-font-xs-strong-13);color:var(--gzw-ink);max-width:420px}
.gzw-context-meta{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-3);white-space:nowrap}
.gzw-status{
  display:inline-flex;align-items:center;gap:6px;
  font:var(--dsw-font-xxs-12);color:var(--gzw-ink-2);
  padding:4px 10px;border-radius:999px;border:1px solid var(--gzw-line-soft);white-space:nowrap;
}
.gzw-status-dot{width:6px;height:6px;border-radius:50%;background:var(--gzw-accent);flex:none}
.gzw-status.busy .gzw-status-dot{animation:gzw-pulse 1.8s var(--gzw-ease) infinite}
.gzw-status.paused .gzw-status-dot{background:var(--gzw-ink-3)}
.gzw-status.warn .gzw-status-dot{background:var(--gzw-warn)}
@keyframes gzw-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.78)}}

.gzw-icon-btn{
  appearance:none;width:30px;height:30px;display:grid;place-items:center;
  border-radius:var(--gzw-r2);border:1px solid var(--gzw-line-soft);
  background:transparent;color:var(--gzw-ink-2);cursor:pointer;
  transition:background var(--gzw-dur-fast) var(--gzw-ease),color var(--gzw-dur-fast) var(--gzw-ease);
}
.gzw-icon-btn:hover{color:var(--gzw-ink);background:var(--gzw-surface-2)}
.gzw-icon-btn[disabled]{opacity:.4;cursor:default}

.gzw-content{
  max-width:1440px;margin:0 auto;padding:var(--gzw-s6) var(--gzw-s8) var(--gzw-s12);
  display:flex;flex-direction:column;gap:var(--gzw-s4);
}
.gzw-sec{display:flex;flex-direction:column;gap:var(--gzw-s4);animation:gzw-rise var(--gzw-dur-slow) var(--gzw-ease) both}
@keyframes gzw-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.gzw-root *{animation:none!important;transition:none!important}}

/* ============================ 卡片 ============================ */
.gzw-card{
  position:relative;border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r4);
  background:var(--gzw-surface);box-shadow:var(--gzw-shadow);
  padding:var(--gzw-s5);min-width:0;
}
.gzw-card.flush{padding:0;overflow:hidden}
.gzw-card.quiet{box-shadow:none;background:var(--gzw-surface-sunken)}
.gzw-card.flat{box-shadow:none;background:transparent;border-style:dashed}
.gzw-card-head{display:flex;align-items:flex-start;gap:var(--gzw-s3);margin-bottom:var(--gzw-s4)}
.gzw-card-head-main{min-width:0;flex:1}
.gzw-card-title{
  font:var(--dsw-font-s-strong-14);margin:0;display:flex;align-items:center;gap:var(--gzw-s2);line-height:1.4;
}
.gzw-card-ico{color:var(--gzw-ink-3);display:inline-flex}
.gzw-card-sub{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-3);margin-top:3px;line-height:1.6}
.gzw-card-actions{display:flex;align-items:center;gap:var(--gzw-s2);flex-wrap:wrap;justify-content:flex-end}
.gzw-hair{height:1px;background:var(--gzw-line-soft);margin:var(--gzw-s4) 0}

/* ============================ 控件 ============================ */
.gzw-btn{
  appearance:none;display:inline-flex;align-items:center;gap:6px;
  border:1px solid var(--gzw-line);background:var(--gzw-surface);
  color:var(--gzw-ink);border-radius:var(--gzw-r2);padding:6px 12px;
  font:var(--dsw-font-xs-13);cursor:pointer;white-space:nowrap;
  transition:background var(--gzw-dur-fast) var(--gzw-ease),border-color var(--gzw-dur-fast) var(--gzw-ease),transform var(--gzw-dur-fast) var(--gzw-ease);
}
.gzw-btn:hover:not([disabled]){background:var(--gzw-surface-2);border-color:var(--gzw-line-strong)}
.gzw-btn:active:not([disabled]){transform:translateY(1px)}
.gzw-btn[disabled]{opacity:.45;cursor:default}
.gzw-btn.brand{
  background:var(--gzw-accent);border-color:transparent;color:#f2fffb;font-weight:600;
  box-shadow:0 6px 16px -10px color-mix(in srgb,var(--gzw-accent) 90%,transparent);
}
.gzw-btn.brand:hover:not([disabled]){background:var(--gzw-accent-strong);filter:saturate(1.05)}
body[data-ds-dark-theme] .gzw-btn.brand{color:#04231e}
.gzw-btn.danger{color:var(--gzw-danger);border-color:var(--gzw-danger-line);background:var(--gzw-danger-soft)}
.gzw-btn.danger:hover:not([disabled]){background:color-mix(in srgb,var(--gzw-danger) 18%,transparent)}
.gzw-btn.ghost{border-color:transparent;background:transparent;color:var(--gzw-ink-2)}
.gzw-btn.ghost:hover:not([disabled]){color:var(--gzw-ink);background:var(--gzw-surface-2)}
.gzw-btn.sm{padding:3px 8px;font:var(--dsw-font-xxs-12);border-radius:6px;gap:5px}
.gzw-btn.wide{width:100%;justify-content:center}
.gzw-btn-ico{display:inline-flex;opacity:.9}

.gzw-chip{
  display:inline-flex;align-items:center;gap:5px;
  border:1px solid var(--gzw-line-soft);background:var(--gzw-surface-sunken);
  border-radius:999px;padding:3px 10px;
  font:var(--dsw-font-xxs-12);line-height:18px;color:var(--gzw-ink-2);white-space:nowrap;
}
.gzw-chip b{color:var(--gzw-ink);font-weight:600}
.gzw-chip.accent{border-color:var(--gzw-accent-line);background:var(--gzw-accent-soft);color:var(--gzw-accent)}
.gzw-chip.accent b{color:var(--gzw-accent)}
.gzw-chip.warn{border-color:var(--gzw-warn-line);background:var(--gzw-warn-soft);color:var(--gzw-warn)}
.gzw-chip.danger{border-color:var(--gzw-danger-line);background:var(--gzw-danger-soft);color:var(--gzw-danger)}
.gzw-chip.info{border-color:var(--gzw-info-line);background:var(--gzw-info-soft);color:var(--gzw-info)}
.gzw-chip.decision{border-color:var(--gzw-decision-line);background:var(--gzw-decision-soft);color:var(--gzw-decision)}

.gzw-input,.gzw-textarea{
  width:100%;border:1px solid var(--gzw-line);border-radius:var(--gzw-r2);
  background:var(--dsw-alias-bg-base);color:var(--gzw-ink);
  padding:7px 11px;font:var(--dsw-font-xs-13);font-family:inherit;outline:none;
  transition:border-color var(--gzw-dur-fast) var(--gzw-ease),box-shadow var(--gzw-dur-fast) var(--gzw-ease);
}
.gzw-input:focus,.gzw-textarea:focus{border-color:var(--gzw-accent-line);box-shadow:0 0 0 3px var(--gzw-accent-soft)}
.gzw-input::placeholder,.gzw-textarea::placeholder{color:var(--gzw-ink-3)}
.gzw-textarea{min-height:72px;resize:vertical;line-height:1.7}
.gzw-input.sm{width:120px;padding:5px 9px;font:var(--dsw-font-xxs-12)}
.gzw-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.gzw-field-label{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-3)}

.gzw-note{
  border:1px solid var(--gzw-accent-line);background:var(--gzw-accent-soft);
  border-radius:var(--gzw-r3);padding:var(--gzw-s3) var(--gzw-s4);
  font:var(--dsw-font-xs-13);line-height:1.7;color:var(--gzw-ink-2);
}
.gzw-note.warn{border-color:var(--gzw-warn-line);background:var(--gzw-warn-soft)}
.gzw-note.danger{border-color:var(--gzw-danger-line);background:var(--gzw-danger-soft)}
.gzw-note.plain{border-color:var(--gzw-line-soft);background:var(--gzw-surface-sunken);color:var(--gzw-ink-3)}

.gzw-block{
  border:1px solid var(--gzw-danger-line);background:var(--gzw-danger-soft);
  border-radius:var(--gzw-r3);padding:var(--gzw-s3) var(--gzw-s4);
}
.gzw-block-title{font:var(--dsw-font-s-strong-14);color:var(--gzw-danger);display:flex;align-items:center;gap:6px}
.gzw-block-body{margin-top:6px}

/* ============================ 当前篇（Hero v2） ============================ */
.gzw-hero{
  position:relative;overflow:hidden;border-radius:var(--gzw-r4);
  border:1px solid var(--gzw-line-soft);
  background:
    radial-gradient(620px 260px at 4% -20%,var(--gzw-accent-soft),transparent 66%),
    linear-gradient(180deg,var(--gzw-surface),var(--gzw-surface-sunken));
  box-shadow:var(--gzw-shadow-panel);
  padding:var(--gzw-s6);
}
.gzw-hero-main{display:grid;grid-template-columns:minmax(0,1fr) 216px;gap:var(--gzw-s6);align-items:start}
.gzw-hero-eyebrow{display:flex;align-items:center;gap:var(--gzw-s2);margin-bottom:var(--gzw-s3)}
.gzw-hero-dot{width:6px;height:6px;border-radius:50%;background:var(--gzw-accent);flex:none}
.gzw-hero-stage{font:var(--dsw-font-xxxs-11);letter-spacing:.14em;text-transform:uppercase;color:var(--gzw-accent);font-weight:600}
.gzw-topic{
  margin:0;font:var(--dsw-font-l-20);line-height:1.4;letter-spacing:-.015em;
  color:var(--gzw-ink);max-width:820px;
}
.gzw-topic-sub{margin-top:6px;font:var(--dsw-font-xs-13);color:var(--gzw-ink-2);line-height:1.7;max-width:760px}
.gzw-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:var(--gzw-s4)}
.gzw-hero-facts{display:flex;flex-wrap:wrap;gap:var(--gzw-s5);margin-top:var(--gzw-s4);padding-top:var(--gzw-s3);border-top:1px solid var(--gzw-line-soft)}
.gzw-fact{min-width:0}
.gzw-fact-k{font:var(--dsw-font-xxxs-11);letter-spacing:.06em;text-transform:uppercase;color:var(--gzw-ink-3)}
.gzw-fact-v{font:var(--dsw-font-m-18);font-weight:650;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gzw-hero-side{
  display:flex;flex-direction:column;align-items:center;gap:var(--gzw-s2);
  padding:var(--gzw-s4);border-radius:var(--gzw-r3);
  background:color-mix(in srgb,var(--gzw-surface) 70%,transparent);
  border:1px solid var(--gzw-line-soft);
}
.gzw-ring{position:relative;display:grid;place-items:center}
.gzw-ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.gzw-ring-value{font:var(--dsw-font-l-20);font-weight:650;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}
.gzw-ring-value span{font-size:12px;font-weight:600;opacity:.65}
.gzw-ring-label{font:var(--dsw-font-xxxs-11);letter-spacing:.1em;text-transform:uppercase;color:var(--gzw-ink-3)}
.gzw-next{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-2);text-align:center;line-height:1.6}
.gzw-next b{color:var(--gzw-ink);font-weight:600}
.gzw-hero-facts{display:flex;flex-wrap:wrap;gap:var(--gzw-s5);margin-top:var(--gzw-s4);padding-top:var(--gzw-s3);border-top:1px solid var(--gzw-line-soft)}
.gzw-fact{min-width:0}
.gzw-fact-k{font:var(--dsw-font-xxxs-11);letter-spacing:.06em;text-transform:uppercase;color:var(--gzw-ink-3)}
.gzw-fact-v{font:var(--dsw-font-m-18);font-weight:650;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ============================ 阶段流水线 ============================ */
.gzw-flow{border-top:1px solid var(--gzw-line-soft);margin-top:var(--gzw-s5);padding-top:var(--gzw-s4)}
.gzw-flow-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--gzw-s3)}
.gzw-flow-track{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:0;position:relative}
.gzw-flow-step{
  appearance:none;background:transparent;border:0;padding:0;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;color:var(--gzw-ink-3);
}
.gzw-flow-node{
  position:relative;z-index:1;width:28px;height:28px;border-radius:50%;
  display:grid;place-items:center;font:var(--dsw-font-xxs-12);font-weight:600;
  background:var(--dsw-alias-bg-base);border:1.5px solid var(--gzw-line);
  color:var(--gzw-ink-3);transition:all var(--gzw-dur) var(--gzw-ease);
}
.gzw-flow-name{font:var(--dsw-font-xxs-12);line-height:1.3;white-space:nowrap;transition:color var(--gzw-dur-fast) var(--gzw-ease)}
.gzw-flow-meta{font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);font-variant-numeric:tabular-nums}
.gzw-flow-link{position:absolute;top:14px;left:calc(50% + 20px);width:calc(100% - 40px);height:2px;background:var(--gzw-line-soft);z-index:0}
.gzw-flow-link.done{background:var(--gzw-accent-line)}
.gzw-flow-step.done .gzw-flow-node{background:var(--gzw-accent-soft);border-color:var(--gzw-accent-line);color:var(--gzw-accent)}
.gzw-flow-step.done .gzw-flow-name{color:var(--gzw-ink-2)}
.gzw-flow-step.active .gzw-flow-node{
  background:var(--gzw-accent);border-color:transparent;color:#f2fffb;
  box-shadow:0 0 0 4px var(--gzw-accent-soft),0 6px 14px -8px color-mix(in srgb,var(--gzw-accent) 80%,transparent);
}
body[data-ds-dark-theme] .gzw-flow-step.active .gzw-flow-node{color:#04231e}
.gzw-flow-step.active .gzw-flow-name{color:var(--gzw-ink);font-weight:600}
.gzw-flow-step:hover .gzw-flow-node{border-color:var(--gzw-accent-line);color:var(--gzw-ink-2)}
.gzw-flow-dots{display:flex;gap:3px;height:5px;align-items:center}
.gzw-flow-dots i{width:4px;height:4px;border-radius:50%;background:var(--gzw-line);display:block}
.gzw-flow-dots i.on{background:var(--gzw-accent);opacity:.8}
.gzw-flow-bar{height:3px;border-radius:999px;background:var(--gzw-line-soft);overflow:hidden;margin-top:var(--gzw-s2)}
.gzw-flow-bar span{display:block;height:100%;background:var(--gzw-accent);border-radius:999px;transition:width var(--gzw-dur-slow) var(--gzw-ease)}

/* ============================ 动作条 ============================ */
.gzw-actionbar{
  display:flex;align-items:center;gap:var(--gzw-s4);flex-wrap:wrap;
  border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r4);
  background:var(--gzw-surface);box-shadow:var(--gzw-shadow);padding:var(--gzw-s3) var(--gzw-s4);
}
.gzw-actionbar-main{flex:1;min-width:200px}
.gzw-actionbar-title{font:var(--dsw-font-s-strong-14);margin-top:2px}
.gzw-actionbar-sub{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-3);margin-top:2px}
.gzw-actionbar-actions{display:flex;gap:var(--gzw-s2);align-items:center;flex-wrap:wrap}
.gzw-new{
  flex-basis:100%;display:flex;gap:var(--gzw-s3);align-items:flex-start;flex-wrap:wrap;
  margin-top:var(--gzw-s3);padding-top:var(--gzw-s3);border-top:1px solid var(--gzw-line-soft);
}
.gzw-new-main{flex:1;min-width:240px}
.gzw-new-side{width:200px}

/* ============================ 关键指标 ============================ */
.gzw-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gzw-s3)}
.gzw-kpi{
  position:relative;border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r4);
  background:var(--gzw-surface);box-shadow:var(--gzw-shadow);
  padding:var(--gzw-s4);display:flex;flex-direction:column;gap:var(--gzw-s2);min-width:0;overflow:hidden;
  transition:transform var(--gzw-dur) var(--gzw-ease),box-shadow var(--gzw-dur) var(--gzw-ease),border-color var(--gzw-dur) var(--gzw-ease);
}
.gzw-kpi:hover{transform:translateY(-2px);box-shadow:var(--gzw-shadow-prominent);border-color:var(--gzw-line)}
.gzw-kpi-head{display:flex;align-items:center;gap:6px;color:var(--gzw-ink-3);font:var(--dsw-font-xxs-12)}
.gzw-kpi-icon{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:var(--gzw-accent-soft);color:var(--gzw-accent);flex:none}
.gzw-kpi-icon.warn{background:var(--gzw-warn-soft);color:var(--gzw-warn)}
.gzw-kpi-icon.info{background:var(--gzw-info-soft);color:var(--gzw-info)}
.gzw-kpi-icon.decision{background:var(--gzw-decision-soft);color:var(--gzw-decision)}
.gzw-kpi-value{
  display:flex;align-items:baseline;gap:4px;
  font:var(--dsw-font-xl-24);font-weight:650;letter-spacing:-.02em;line-height:1.05;font-variant-numeric:tabular-nums;
}
.gzw-kpi-value .unit{font:var(--dsw-font-xs-13);font-weight:500;color:var(--gzw-ink-2);letter-spacing:0}
.gzw-kpi-sub{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-3);line-height:1.55}
.gzw-kpi-viz{margin-top:auto;padding-top:var(--gzw-s2);min-height:30px;display:flex;align-items:flex-end;overflow:hidden}
.gzw-kpi-viz svg{display:block;overflow:visible}
.gzw-kpi-action{
  position:absolute;right:var(--gzw-s3);top:var(--gzw-s3);
  font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);opacity:0;
  transition:opacity var(--gzw-dur-fast) var(--gzw-ease);
}
.gzw-kpi:hover .gzw-kpi-action{opacity:1;color:var(--gzw-accent)}

/* ============================ 体检 ============================ */
.gzw-gate{display:grid;grid-template-columns:148px minmax(0,1fr);gap:var(--gzw-s6);align-items:center}
.gzw-gauge{position:relative;display:grid;place-items:center}
.gzw-gauge-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.gzw-gauge-value{font:var(--dsw-font-xl-24);font-weight:650;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}
.gzw-gauge-cap{font:var(--dsw-font-xxxs-11);letter-spacing:.08em;text-transform:uppercase;color:var(--gzw-ink-3)}
.gzw-gauge-scale{display:flex;justify-content:space-between;width:100%;font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);margin-top:6px;font-variant-numeric:tabular-nums}
.gzw-gate-side{display:flex;flex-direction:column;gap:var(--gzw-s3);min-width:0}
.gzw-bars{display:flex;flex-direction:column;gap:6px;min-width:0}
.gzw-bar-row{display:grid;grid-template-columns:minmax(72px,132px) minmax(0,1fr) 64px;align-items:center;gap:var(--gzw-s3);font:var(--dsw-font-xxs-12)}
.gzw-bar-label{color:var(--gzw-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gzw-bar-track{display:block;height:8px;border-radius:999px;background:var(--gzw-surface-sunken);overflow:hidden;position:relative;box-shadow:inset 0 0 0 1px var(--gzw-line-soft)}
.gzw-bar-fill{display:block;height:100%;border-radius:999px;background:var(--gzw-warn);opacity:.85;transition:width var(--gzw-dur-slow) var(--gzw-ease)}
.gzw-bar-fill.fail{background:var(--gzw-danger)}
.gzw-bar-count{text-align:right;color:var(--gzw-ink-2);font-variant-numeric:tabular-nums;font-weight:600}
.gzw-bar-count small{color:var(--gzw-ink-3);font-weight:400;margin-left:3px}
.gzw-issues{margin-top:var(--gzw-s3);display:flex;flex-direction:column;gap:2px;max-height:280px;overflow:auto;padding-right:4px}
.gzw-issue{
  display:grid;grid-template-columns:52px minmax(0,1fr);gap:var(--gzw-s2);
  font:var(--dsw-font-xxs-12);line-height:1.6;padding:6px 8px;border-radius:var(--gzw-r1);
  background:var(--gzw-surface-sunken);text-align:left;border:0;width:100%;cursor:pointer;
  transition:background var(--gzw-dur-fast) var(--gzw-ease);
}
.gzw-issue:hover{background:var(--gzw-surface-2)}
.gzw-issue .ln{color:var(--gzw-ink-3);font-family:var(--gzw-mono);font-size:11px;padding-top:1px}
.gzw-issue .rule{color:var(--gzw-warn);font-weight:600;margin-right:6px}
.gzw-issue.fail .rule{color:var(--gzw-danger)}
.gzw-issue .tx{color:var(--gzw-ink-2)}

/* ============================ 文本度量 ============================ */
.gzw-metrics{display:flex;flex-direction:column;gap:1px;border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);overflow:hidden;background:var(--gzw-line-soft)}
.gzw-metric{background:var(--gzw-surface);padding:var(--gzw-s2) var(--gzw-s3)}
.gzw-metric-k{font:var(--dsw-font-xxxs-11);letter-spacing:.06em;text-transform:uppercase;color:var(--gzw-ink-3)}
.gzw-metric-v{font:var(--dsw-font-m-18);font-weight:650;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1.35;display:flex;align-items:baseline;gap:3px}
.gzw-metric-v .u{font:var(--dsw-font-xxs-12);font-weight:500;color:var(--gzw-ink-3)}
.gzw-metric-hint{font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);line-height:1.5}

.gzw-hist{display:flex;align-items:flex-end;gap:var(--gzw-s4);height:110px;padding-top:var(--gzw-s2);border-bottom:1px solid var(--gzw-line-soft)}
.gzw-hist-col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%;min-width:0}
.gzw-hist-bar{width:46px;flex:none;border-radius:4px 4px 0 0;background:var(--gzw-accent-soft);border-top:2px solid var(--gzw-accent);min-height:2px;transition:height var(--gzw-dur-slow) var(--gzw-ease)}
.gzw-hist-bar.long{border-top-color:var(--gzw-warn);background:var(--gzw-warn-soft)}
.gzw-hist-label{font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);white-space:nowrap;font-variant-numeric:tabular-nums}
.gzw-hist-count{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-2);font-variant-numeric:tabular-nums;font-weight:600}

.gzw-rhythm{display:flex;align-items:flex-end;gap:2px;height:40px;position:relative;padding-top:4px}
.gzw-rhythm-bar{flex:1;min-width:2px;background:var(--gzw-accent-soft);border-radius:2px 2px 0 0;border-top:1.5px solid var(--gzw-accent);transition:height var(--gzw-dur-slow) var(--gzw-ease)}
.gzw-rhythm-bar.over{background:var(--gzw-warn-soft);border-top-color:var(--gzw-warn)}
.gzw-rhythm-line{position:absolute;left:0;right:0;border-top:1px dashed var(--gzw-warn-line)}
.gzw-rhythm-cap{display:flex;justify-content:space-between;margin-top:5px}

/* ============================ 网格与分栏 ============================ */
.gzw-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:var(--gzw-s4);align-items:start}
.gzw-grid.even{grid-template-columns:repeat(2,minmax(0,1fr))}
.gzw-grid.thirds{grid-template-columns:repeat(3,minmax(0,1fr))}
.gzw-stack{display:flex;flex-direction:column;gap:var(--gzw-s4);min-width:0}

/* ============================ 审阅条 ============================ */
.gzw-review{
  border:1px solid var(--gzw-accent-line);background:var(--gzw-accent-soft);
  border-radius:var(--gzw-r4);padding:var(--gzw-s4) var(--gzw-s5);
  display:flex;align-items:center;gap:var(--gzw-s4);flex-wrap:wrap;
}
.gzw-review.locked{background:var(--gzw-warn-soft);border-color:var(--gzw-warn-line)}
.gzw-review-main{flex:1;min-width:220px}
.gzw-review-title{font:var(--dsw-font-s-strong-14);display:flex;align-items:center;gap:6px}
.gzw-review-sub{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-2);margin-top:4px;line-height:1.65}
.gzw-review-actions{display:flex;gap:var(--gzw-s2);align-items:center;flex-wrap:wrap}
.gzw-receipt{margin-top:var(--gzw-s3);border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);padding:var(--gzw-s3);background:var(--gzw-surface-sunken);font:var(--dsw-font-xs-13);line-height:1.65}
.gzw-receipt.ok{border-color:var(--gzw-accent-line);background:var(--gzw-accent-soft)}
.gzw-receipt.bad{border-color:var(--gzw-danger-line);background:var(--gzw-danger-soft)}

/* ============================ 阶段页 ============================ */
.gzw-stage-head{display:flex;align-items:flex-start;gap:var(--gzw-s4);flex-wrap:wrap;margin-bottom:var(--gzw-s4)}
.gzw-stage-mark{
  width:44px;height:44px;border-radius:var(--gzw-r3);display:grid;place-items:center;flex:none;
  background:var(--gzw-accent-soft);color:var(--gzw-accent);
}
.gzw-stage-mark.warn{background:var(--gzw-warn-soft);color:var(--gzw-warn)}
.gzw-stage-mark.info{background:var(--gzw-info-soft);color:var(--gzw-info)}
.gzw-stage-mark.decision{background:var(--gzw-decision-soft);color:var(--gzw-decision)}
.gzw-stage-mark.danger{background:var(--gzw-danger-soft);color:var(--gzw-danger)}
.gzw-stage-title{font:var(--dsw-font-l-20);font-weight:650;letter-spacing:-.01em;line-height:1.3}
.gzw-stage-desc{font:var(--dsw-font-xs-13);color:var(--gzw-ink-2);margin-top:4px;line-height:1.7;max-width:720px}
.gzw-stage-nav{display:flex;gap:2px;flex-wrap:wrap;padding:3px;border-radius:var(--gzw-r2);background:var(--gzw-surface-sunken);border:1px solid var(--gzw-line-soft)}
.gzw-stage-nav button{
  appearance:none;border:0;background:transparent;color:var(--gzw-ink-2);cursor:pointer;
  font:var(--dsw-font-xxs-12);padding:4px 10px;border-radius:6px;white-space:nowrap;
}
.gzw-stage-nav button:hover{color:var(--gzw-ink);background:var(--gzw-surface-3)}
.gzw-stage-nav button.on{background:var(--gzw-surface);color:var(--gzw-ink);font-weight:600;box-shadow:var(--dsw-shadow-lv1)}
.gzw-stat-strip{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:1px;
  border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);overflow:hidden;background:var(--gzw-line-soft);
  margin:var(--gzw-s4) 0;
}
.gzw-stat{background:var(--gzw-surface);padding:var(--gzw-s2) var(--gzw-s3);min-width:0}
.gzw-stat .k{font:var(--dsw-font-xxxs-11);letter-spacing:.06em;text-transform:uppercase;color:var(--gzw-ink-3);white-space:nowrap}
.gzw-stat .v{font:var(--dsw-font-m-18);font-weight:650;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1.3;display:flex;align-items:baseline;gap:3px}
.gzw-stat .v small{font:var(--dsw-font-xxs-12);font-weight:500;color:var(--gzw-ink-3)}

/* ============================ 阅读区 ============================ */
.gzw-paper{
  border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);
  background:var(--gzw-surface-sunken);
  padding:var(--gzw-s6) var(--gzw-s8);max-height:720px;overflow:auto;position:relative;
}
.gzw-paper-head{display:flex;align-items:center;gap:var(--gzw-s3);margin-bottom:var(--gzw-s4);padding-bottom:var(--gzw-s3);border-bottom:1px solid var(--gzw-line-soft)}
.gzw-paper-title{font:var(--dsw-font-m-18);font-weight:650;letter-spacing:-.01em;line-height:1.4}
.gzw-paper-meta{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-3);margin-top:3px}
.gzw-md{font-size:15.5px;line-height:1.95;letter-spacing:.01em;max-width:720px;color:color-mix(in srgb,var(--gzw-ink) 94%,var(--gzw-ink-2))}
.gzw-md-p{margin:0 0 15px;text-align:justify}
.gzw-md-p:last-child{margin-bottom:0}
.gzw-md-p.hit{background:var(--gzw-warn-soft);border-radius:var(--gzw-r1);box-shadow:0 0 0 4px var(--gzw-warn-soft)}
.gzw-md-h{font-weight:650;margin:26px 0 12px;line-height:1.45;letter-spacing:-.01em}
.gzw-md-h:first-child{margin-top:0}
.gzw-md-h1{font-size:20px}
.gzw-md-h2{font-size:17px}
.gzw-md-h3{font-size:15.5px}
.gzw-md-h4{font-size:14.5px}
.gzw-md-q{border-left:2px solid var(--gzw-accent-line);margin:0 0 15px;padding:2px 0 2px 14px;color:var(--gzw-ink-2)}
.gzw-md-ul{margin:0 0 15px;padding-left:20px}
.gzw-md-ul li{margin-bottom:5px}
.gzw-md-code{margin:0 0 15px;padding:12px 14px;border-radius:var(--gzw-r2);background:var(--gzw-surface-2);overflow:auto;font-family:var(--gzw-mono);font-size:12px;line-height:1.7}
.gzw-md code{font-family:var(--gzw-mono);font-size:.88em;padding:1px 5px;border-radius:4px;background:var(--gzw-surface-2);color:var(--gzw-accent)}
.gzw-md-hr{border:none;border-top:1px solid var(--gzw-line-soft);margin:24px 0}
.gzw-md-tablewrap{overflow-x:auto;margin:0 0 15px;border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3)}
.gzw-md-table{width:100%;border-collapse:collapse;font-size:12.5px;line-height:1.65}
.gzw-md-table th,.gzw-md-table td{padding:6px 11px;border-bottom:1px solid var(--gzw-line-soft);white-space:nowrap}
.gzw-md-table th{background:var(--gzw-surface-2);color:var(--gzw-ink-2);font-weight:600;font-size:11.5px}
.gzw-md-table tr:last-child td{border-bottom:0}
.gzw-md-table td{color:var(--gzw-ink-2)}
.gzw-md strong{font-weight:650;color:var(--gzw-ink)}
.gzw-md a{color:var(--gzw-info);text-decoration:none;border-bottom:1px solid var(--gzw-info-line)}

/* ============================ 轨迹 ============================ */
.gzw-traceviz{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr) minmax(0,1fr);gap:var(--gzw-s3)}
.gzw-tviz{border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);padding:var(--gzw-s3) var(--gzw-s4);background:var(--gzw-surface);display:flex;flex-direction:column;gap:var(--gzw-s2);min-width:0}
.gzw-tviz-label{font:var(--dsw-font-xxxs-11);letter-spacing:.1em;text-transform:uppercase;color:var(--gzw-ink-3);display:flex;align-items:center;gap:6px}
.gzw-tviz-value{font:var(--dsw-font-m-18);font-weight:650;letter-spacing:-.01em;font-variant-numeric:tabular-nums;line-height:1.25}
.gzw-tviz-value small{font:var(--dsw-font-xxs-12);font-weight:500;color:var(--gzw-ink-3);margin-left:4px}
.gzw-legend{display:flex;flex-direction:column;gap:5px;font:var(--dsw-font-xxs-12);color:var(--gzw-ink-2)}
.gzw-legend-item{display:flex;align-items:center;gap:6px}
.gzw-legend-item i{width:7px;height:7px;border-radius:2px;flex:none}
.gzw-legend-item b{margin-left:auto;font-weight:600;color:var(--gzw-ink);font-variant-numeric:tabular-nums}
.gzw-filters{display:flex;gap:5px;flex-wrap:wrap;align-items:center}
.gzw-filter{
  display:inline-flex;align-items:center;gap:5px;border:1px solid var(--gzw-line-soft);background:transparent;
  color:var(--gzw-ink-2);border-radius:999px;padding:3px 10px;font:var(--dsw-font-xxs-12);line-height:18px;cursor:pointer;
  transition:all var(--gzw-dur-fast) var(--gzw-ease);
}
.gzw-filter:hover{background:var(--gzw-surface-2);color:var(--gzw-ink)}
.gzw-filter.on{border-color:var(--gzw-accent-line);background:var(--gzw-accent-soft);color:var(--gzw-accent);font-weight:600}
.gzw-filter .c{font-size:10.5px;opacity:.72;font-variant-numeric:tabular-nums}

.gzw-timeline{position:relative;display:flex;flex-direction:column;margin-top:var(--gzw-s2)}
.gzw-tl-row{display:grid;grid-template-columns:56px 24px minmax(0,1fr);position:relative}
.gzw-tl-time{font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);font-variant-numeric:tabular-nums;padding:12px 8px 0 0;text-align:right;font-family:var(--gzw-mono);white-space:nowrap}
.gzw-tl-rail{position:relative;display:flex;justify-content:center;padding-top:12px}
.gzw-tl-rail::before{content:"";position:absolute;top:0;bottom:0;width:1px;background:var(--gzw-line-soft);left:50%}
.gzw-tl-row:first-child .gzw-tl-rail::before{top:16px}
.gzw-tl-row:last-child .gzw-tl-rail::before{bottom:auto;height:16px}
.gzw-tl-node{position:relative;width:8px;height:8px;border-radius:50%;background:var(--gzw-ink-3);margin-top:3px;box-shadow:0 0 0 3px var(--dsw-alias-bg-base);z-index:1;flex:none}
.gzw-tl-node.user{background:var(--gzw-decision)}
.gzw-tl-node.review{background:var(--gzw-accent);box-shadow:0 0 0 3px var(--gzw-accent-soft)}
.gzw-tl-node.tool{background:var(--gzw-info)}
.gzw-tl-node.error{background:var(--gzw-danger)}
.gzw-tl-node.decision{background:var(--gzw-warn)}
.gzw-tl-node.system,.gzw-tl-node.turn,.gzw-tl-node.command{background:var(--gzw-ink-3)}
.gzw-tl-node.result{background:var(--gzw-decision)}
.gzw-tl-node.say{background:var(--gzw-accent)}
.gzw-tl-body{padding:8px 0 14px 12px;min-width:0}
.gzw-tl-line{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px}
.gzw-tl-kind{font:var(--dsw-font-xxxs-11);letter-spacing:.03em;line-height:17px;padding:0 7px;border-radius:5px;background:var(--gzw-surface-2);color:var(--gzw-ink-2);font-weight:600;white-space:nowrap}
.gzw-tl-kind.user,.gzw-tl-kind.review{background:var(--gzw-accent-soft);color:var(--gzw-accent)}
.gzw-tl-kind.say{background:var(--gzw-accent-soft);color:var(--gzw-accent)}
.gzw-tl-kind.tool{background:var(--gzw-info-soft);color:var(--gzw-info)}
.gzw-tl-kind.error{background:var(--gzw-danger-soft);color:var(--gzw-danger)}
.gzw-tl-kind.decision{background:var(--gzw-warn-soft);color:var(--gzw-warn)}
.gzw-tl-kind.result{background:var(--gzw-decision-soft);color:var(--gzw-decision)}
.gzw-tl-text{font:var(--dsw-font-xs-13);line-height:1.7;color:var(--gzw-ink-2);word-break:break-word;white-space:pre-wrap;max-height:5.2em;overflow:hidden;position:relative}
.gzw-tl-text.open{max-height:none}
.gzw-tl-toggle{position:absolute;right:0;bottom:0;font:var(--dsw-font-xxxs-11);color:var(--gzw-accent);background:linear-gradient(90deg,transparent,var(--gzw-surface) 40%);padding-left:24px;cursor:pointer}
.gzw-logs{margin-top:var(--gzw-s2);max-height:280px;overflow:auto}
.gzw-log{margin:0;white-space:pre-wrap;word-break:break-word;font-family:var(--gzw-mono);font-size:11.5px;line-height:1.75;color:var(--gzw-ink-2)}
.gzw-details{margin-top:var(--gzw-s2)}
.gzw-details>summary{cursor:pointer;font:var(--dsw-font-xxs-12);color:var(--gzw-ink-3);user-select:none;list-style:none;display:inline-flex;align-items:center;gap:5px}
.gzw-details>summary::-webkit-details-marker{display:none}
.gzw-details>summary::before{content:"▸";font-size:10px;transition:transform var(--gzw-dur-fast) var(--gzw-ease);display:inline-block}
.gzw-details[open]>summary::before{transform:rotate(90deg)}
.gzw-details>summary:hover{color:var(--gzw-ink)}

/* ============================ 产物 ============================ */
.gzw-arts{display:flex;flex-direction:column;gap:1px;border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);overflow:hidden;background:var(--gzw-line-soft)}
.gzw-art{display:flex;align-items:center;gap:var(--gzw-s3);padding:10px var(--gzw-s3);background:var(--gzw-surface);transition:background var(--gzw-dur-fast) var(--gzw-ease);cursor:pointer}
.gzw-art:hover{background:var(--gzw-surface-2)}
.gzw-art.on{background:var(--gzw-accent-soft)}
.gzw-art-ico{width:26px;height:26px;border-radius:var(--gzw-r2);display:grid;place-items:center;flex:none;background:var(--gzw-surface-2);color:var(--gzw-ink-2)}
.gzw-art-ico.md{background:var(--gzw-accent-soft);color:var(--gzw-accent)}
.gzw-art-ico.html{background:var(--gzw-info-soft);color:var(--gzw-info)}
.gzw-art-ico.json{background:var(--gzw-decision-soft);color:var(--gzw-decision)}
.gzw-art-main{flex:1;min-width:0}
.gzw-art-name{font:var(--dsw-font-xs-13);display:flex;align-items:center;gap:6px;min-width:0}
.gzw-art-name .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gzw-art-sub{font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);margin-top:1px;font-family:var(--gzw-mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gzw-art-tail{display:flex;align-items:center;gap:var(--gzw-s2);flex:none}
.gzw-sizebar{width:64px;height:4px;border-radius:999px;background:var(--gzw-surface-sunken);overflow:hidden;flex:none}
.gzw-sizebar span{display:block;height:100%;background:var(--gzw-info);opacity:.7;border-radius:999px}
.gzw-stage-pill{font:var(--dsw-font-xxxs-11);line-height:17px;padding:0 7px;border-radius:999px;background:var(--gzw-surface-2);color:var(--gzw-ink-3);white-space:nowrap}

.gzw-art-timeline{position:relative;padding:var(--gzw-s4) var(--gzw-s2) var(--gzw-s2)}
.gzw-art-tl{position:relative;height:44px}
.gzw-art-tl-line{position:absolute;left:0;right:0;top:20px;height:2px;background:var(--gzw-line-soft)}
.gzw-art-tl-dot{position:absolute;top:14px;width:13px;height:13px;border-radius:50%;background:var(--gzw-surface);border:2px solid var(--gzw-info);transform:translateX(-50%);cursor:pointer;transition:transform var(--gzw-dur-fast) var(--gzw-ease),box-shadow var(--gzw-dur-fast) var(--gzw-ease)}
.gzw-art-tl-dot:hover{transform:translateX(-50%) scale(1.2);box-shadow:0 0 0 4px var(--gzw-info-soft);z-index:2}
.gzw-art-tl-label{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-2);white-space:nowrap;background:var(--gzw-surface);padding:1px 5px;border-radius:4px;border:1px solid var(--gzw-line-soft);opacity:0;pointer-events:none;transition:opacity var(--gzw-dur-fast) var(--gzw-ease);z-index:3}
.gzw-art-tl-dot:hover .gzw-art-tl-label{opacity:1}
.gzw-art-tl-axis{display:flex;justify-content:space-between;margin-top:6px}

/* ============================ 两栏工作区 ============================ */
.gzw-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:var(--gzw-s4);align-items:start}
.gzw-card-body{min-width:0}
.gzw-budget{margin-top:var(--gzw-s4)}
.gzw-image-deco{position:absolute;inset:0;opacity:.5;background-image:radial-gradient(circle at 22% 26%,var(--gzw-accent-line),transparent 42%),radial-gradient(circle at 78% 74%,var(--gzw-warn-line),transparent 44%)}

/* ============================ 排版预览（手机框） ============================ */
.gzw-phone{width:min(100%,372px);margin:0 auto;border-radius:34px;border:1px solid var(--gzw-line);background:var(--dsw-alias-bg-base);padding:14px 10px 12px;box-shadow:var(--gzw-shadow-prominent),0 0 0 6px color-mix(in srgb,var(--gzw-surface-2) 60%,transparent)}
.gzw-phone-top{display:flex;justify-content:center;margin-bottom:8px}
.gzw-phone-notch{width:66px;height:5px;border-radius:99px;background:color-mix(in srgb,var(--gzw-ink-3) 40%,transparent)}
.gzw-phone-screen{height:640px;border-radius:22px;overflow:hidden;background:#fff;position:relative}
.gzw-phone-screen iframe{width:100%;height:100%;border:0;display:block;background:#fff}
.gzw-phone-label{text-align:center;font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);margin-top:8px;letter-spacing:.06em}

/* ============================ 配图与预算 ============================ */
.gzw-images{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:var(--gzw-s3)}
.gzw-image{border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);overflow:hidden;background:var(--gzw-surface);display:flex;flex-direction:column;transition:transform var(--gzw-dur) var(--gzw-ease),box-shadow var(--gzw-dur) var(--gzw-ease)}
.gzw-image:hover{transform:translateY(-2px);box-shadow:var(--gzw-shadow-prominent)}
.gzw-image-thumb{position:relative;aspect-ratio:16/10;display:grid;place-items:center;background:linear-gradient(135deg,var(--gzw-accent-soft),var(--gzw-warn-soft));color:var(--gzw-ink-3);overflow:hidden}
.gzw-image-ratio{position:absolute;left:8px;top:8px;font:var(--dsw-font-xxxs-11);line-height:16px;padding:0 6px;border-radius:5px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 78%,transparent);color:var(--gzw-ink-2);font-variant-numeric:tabular-nums}
.gzw-image-state{position:absolute;right:8px;top:8px;font:var(--dsw-font-xxxs-11);line-height:16px;padding:0 7px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 82%,transparent);color:var(--gzw-accent)}
.gzw-image-state i{width:5px;height:5px;border-radius:50%;background:currentColor;display:block}
.gzw-image-state.running{color:var(--gzw-warn)}
.gzw-image-state.pending{color:var(--gzw-ink-3)}
.gzw-image-body{padding:9px 11px 10px;display:flex;flex-direction:column;gap:5px}
.gzw-image-role{font:var(--dsw-font-xs-13);font-weight:600;line-height:1.35}
.gzw-image-meta{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.gzw-tag{display:inline-block;padding:0 6px;border-radius:5px;background:var(--gzw-surface-2);color:var(--gzw-ink-2);font:var(--dsw-font-xxxs-11);line-height:17px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gzw-budget-track{height:10px;border-radius:999px;background:var(--gzw-surface-sunken);overflow:hidden;display:flex;box-shadow:inset 0 0 0 1px var(--gzw-line-soft)}
.gzw-budget-fill{height:100%;background:var(--gzw-accent)}
.gzw-budget-fill.spent{background:color-mix(in srgb,var(--gzw-accent) 55%,var(--gzw-warn))}
.gzw-budget-fill.rest{background:transparent}
.gzw-budget-legend{display:flex;gap:var(--gzw-s4);margin-top:7px;font:var(--dsw-font-xxs-12);color:var(--gzw-ink-2);flex-wrap:wrap}
.gzw-budget-legend i{width:7px;height:7px;border-radius:2px;display:inline-block;margin-right:5px}

/* ============================ 发布清单 ============================ */
.gzw-checklist{display:flex;flex-direction:column;gap:1px;border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);overflow:hidden;background:var(--gzw-line-soft)}
.gzw-check{display:flex;align-items:center;gap:var(--gzw-s3);padding:10px var(--gzw-s4);background:var(--gzw-surface)}
.gzw-check-ico{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--gzw-accent-soft);color:var(--gzw-accent)}
.gzw-check-ico.todo{background:var(--gzw-surface-2);color:var(--gzw-ink-3)}
.gzw-check-ico.warn{background:var(--gzw-warn-soft);color:var(--gzw-warn)}
.gzw-check-ico.danger{background:var(--gzw-danger-soft);color:var(--gzw-danger)}
.gzw-check-main{flex:1;min-width:0}
.gzw-check-title{font:var(--dsw-font-xs-13);line-height:1.4}
.gzw-check-sub{font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);margin-top:1px;font-family:var(--gzw-mono)}
.gzw-check-val{font:var(--dsw-font-xxs-12);color:var(--gzw-ink-2);max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ============================ 会话绑定 ============================ */
.gzw-sessions{display:flex;flex-direction:column;gap:4px;max-height:420px;overflow:auto;padding-right:4px;margin-top:var(--gzw-s2)}
.gzw-session{display:flex;align-items:center;gap:var(--gzw-s3);padding:9px 11px;border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);background:var(--gzw-surface);transition:border-color var(--gzw-dur-fast) var(--gzw-ease),background var(--gzw-dur-fast) var(--gzw-ease)}
.gzw-session:hover{border-color:var(--gzw-accent-line);background:var(--gzw-surface-2)}
.gzw-session.bound{border-color:var(--gzw-accent-line);background:var(--gzw-accent-soft)}
.gzw-avatar{width:26px;height:26px;border-radius:var(--gzw-r2);display:grid;place-items:center;font:var(--dsw-font-xxxs-11);font-weight:650;flex:none;color:var(--gzw-ink-2);background:var(--gzw-surface-2);border:1px solid var(--gzw-line-soft)}
.gzw-session.bound .gzw-avatar{background:var(--gzw-accent);color:#f2fffb;border-color:transparent}
body[data-ds-dark-theme] .gzw-session.bound .gzw-avatar{color:#04231e}
.gzw-session-main{flex:1;min-width:0}
.gzw-session-title{font:var(--dsw-font-xs-13);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:6px}
.gzw-session-title .dot{width:5px;height:5px;border-radius:50%;background:var(--gzw-warn);flex:none;box-shadow:0 0 0 2px var(--gzw-warn-soft)}
.gzw-session-sub{font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;font-family:var(--gzw-mono)}

.gzw-kv{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px var(--gzw-s4);font:var(--dsw-font-xs-13)}
.gzw-kv dt{color:var(--gzw-ink-3)}
.gzw-kv dd{margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis}

/* ============================ 四库 ============================ */
.gzw-libs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gzw-s4);align-items:start}
.gzw-lib-item{display:flex;align-items:flex-start;gap:var(--gzw-s3);padding:10px 0;border-bottom:1px solid var(--gzw-line-soft)}
.gzw-lib-item:last-child{border-bottom:0}
.gzw-lib-bullet{width:5px;height:5px;border-radius:50%;background:var(--gzw-accent);margin-top:8px;flex:none}
.gzw-lib-bullet.warn{background:var(--gzw-warn)}
.gzw-lib-bullet.decision{background:var(--gzw-decision)}
.gzw-lib-body{min-width:0;flex:1}
.gzw-lib-text{font:var(--dsw-font-xs-13);line-height:1.65;color:var(--gzw-ink-2)}
.gzw-lib-meta{font:var(--dsw-font-xxxs-11);color:var(--gzw-ink-3);margin-top:2px;font-family:var(--gzw-mono)}

/* ============================ 空态 / 骨架 / 提示 ============================ */
.gzw-empty{display:flex;flex-direction:column;align-items:center;gap:6px;padding:var(--gzw-s4) var(--gzw-s3);text-align:center;color:var(--gzw-ink-3)}
.gzw-empty-art{width:40px;height:40px;border-radius:var(--gzw-r3);display:grid;place-items:center;background:var(--gzw-surface-sunken);color:var(--gzw-ink-3);margin-bottom:2px}
.gzw-empty-title{font:var(--dsw-font-s-strong-14);color:var(--gzw-ink-2)}
.gzw-empty-text{font:var(--dsw-font-xxs-12);max-width:420px;line-height:1.7}
.gzw-empty-action{margin-top:var(--gzw-s1)}

.gzw-skel{background:linear-gradient(90deg,var(--gzw-surface-2) 25%,var(--gzw-surface-3) 37%,var(--gzw-surface-2) 63%);background-size:400% 100%;animation:gzw-shimmer 1.4s ease infinite;border-radius:var(--gzw-r1)}
@keyframes gzw-shimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}

.gzw-toast{
  position:fixed;left:50%;bottom:var(--gzw-s6);transform:translateX(-50%);z-index:60;
  display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;
  background:var(--gzw-ink);color:var(--dsw-alias-bg-base);font:var(--dsw-font-xs-13);
  box-shadow:var(--gzw-shadow-prominent);animation:gzw-toast-in var(--gzw-dur) var(--gzw-ease);
}
@keyframes gzw-toast-in{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}

.gzw-footer{
  border:1px solid var(--gzw-line-soft);border-radius:var(--gzw-r3);padding:10px var(--gzw-s4);
  display:flex;align-items:center;gap:var(--gzw-s3);flex-wrap:wrap;background:var(--gzw-surface-sunken);
}
.gzw-footer .repo{font-family:var(--gzw-mono);font-size:11px;color:var(--gzw-ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}

.gzw-kbd{
  display:inline-block;min-width:20px;text-align:center;padding:1px 6px;border-radius:5px;
  border:1px solid var(--gzw-line);background:var(--gzw-surface-2);color:var(--gzw-ink-2);
  font-family:var(--gzw-mono);font-size:11px;
}
.gzw-help-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px var(--gzw-s4);margin-top:var(--gzw-s2)}
.gzw-help-row{display:flex;align-items:center;gap:var(--gzw-s2);font:var(--dsw-font-xxs-12);color:var(--gzw-ink-2)}
.gzw-help{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:color-mix(in srgb,var(--dsw-alias-bg-base) 62%,transparent)}
.gzw-help-card{
  width:min(520px,90vw);border:1px solid var(--gzw-line);border-radius:var(--gzw-r4);
  background:var(--gzw-surface);box-shadow:var(--gzw-shadow-prominent);padding:var(--gzw-s5);
}

/* ============================ 响应式 ============================
   工作台是 DSH 的主面板，宽度不等于视口宽度 —— 用容器查询跟面板走，
   媒体查询只留顶栏这种真正跟视口有关的地方。 */
.gzw-root{container-type:inline-size}
@container (max-width:1180px){
  .gzw-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  .gzw-grid,.gzw-grid.even,.gzw-grid.thirds,.gzw-libs{grid-template-columns:minmax(0,1fr)}
  .gzw-traceviz{grid-template-columns:repeat(2,minmax(0,1fr))}
  .gzw-layout{grid-template-columns:minmax(0,1fr)}
  .gzw-context{display:none}
}
@container (max-width:820px){
  .gzw-content{padding:var(--gzw-s4) var(--gzw-s4) var(--gzw-s10)}
  .gzw-top-inner{padding:var(--gzw-s2) var(--gzw-s4);gap:var(--gzw-s3);flex-wrap:wrap}
  .gzw-hero{padding:var(--gzw-s5) var(--gzw-s4)}
  .gzw-hero-main{grid-template-columns:minmax(0,1fr);gap:var(--gzw-s4)}
  .gzw-hero-side{flex-direction:row;align-items:center;justify-content:flex-start;gap:var(--gzw-s4)}
  .gzw-brand-meta{display:none}
  .gzw-paper{padding:var(--gzw-s5) var(--gzw-s4)}
  .gzw-traceviz{grid-template-columns:minmax(0,1fr)}
  .gzw-help-grid{grid-template-columns:minmax(0,1fr)}
  .gzw-flow-track{grid-template-columns:repeat(4,minmax(0,1fr));row-gap:var(--gzw-s4)}
  .gzw-kpis{grid-template-columns:minmax(0,1fr)}
  .gzw-stat-strip{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width:820px){
  .gzw-brand-meta{display:none}
}
`

    const STAGE_META = [
      { no: 1, name: '素材', desc: '锚点清单：从访谈/资料里挑出值得写的点，定素材边界。', tone: 'amber', icon: 'layers' },
      { no: 2, name: '写作', desc: '按锚点写成初稿，strict 模式下逐段过审。', tone: 'accent', icon: 'pen' },
      { no: 3, name: '去味', desc: '跑 AI 味体检，只改真正像机写的句子。', tone: 'violet', icon: 'spark' },
      { no: 4, name: '配图', desc: '按正文节奏定图位、比例与预算，再生成。', tone: 'blue', icon: 'image' },
      { no: 5, name: '排版', desc: '生成公众号 HTML，手机上过一遍再校验。', tone: 'accent', icon: 'layout' },
      { no: 6, name: '发布', desc: '发布 dry-run 只检查参数与文件；推送永不自动。', tone: 'rose', icon: 'send' },
      { no: 7, name: '复盘', desc: '从产物派生发文日志与决策记录，只读。', tone: 'violet', icon: 'chart' },
    ]
    const CIRCLED = '①②③④⑤⑥⑦'
    const STAGE_NAMES = STAGE_META.map((item) => item.name)
    const STAGES = [
      { name: '素材', artifactIds: ['anchors'] },
      { name: '写作', artifactIds: ['draft'] },
      { name: '去味', artifactIds: ['draft'] },
      { name: '配图', artifactIds: ['manifest', 'budget'] },
      { name: '排版', artifactIds: ['layout'] },
      { name: '发布', artifactIds: ['publish-dry'] },
      { name: '复盘', artifactIds: ['log', 'decisions'] },
    ]
    const ARTIFACT_LABELS = {
      anchors: '素材锚点清单',
      draft: '草稿',
      manifest: '配图 manifest',
      budget: '预算单',
      layout: '排版稿',
      'publish-dry': '发布 dry-run',
      log: '发文日志',
      decisions: '决策日志',
    }

    // 图标：viewBox 0 0 16 16 / stroke=currentColor / regular=1、medium=1.3（对齐 DSH 图标规格）
    const ICONS = {
      refresh: 'M13.2 8a5.2 5.2 0 1 1-1.55-3.7M13 2.4v3.2H9.8',
      check: 'M3.4 8.4l3.1 3.1 6.1-6.9',
      x: 'M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6',
      send: 'M13.8 2.2 7.4 8.9M13.8 2.2 9.7 13.8 7.4 8.9 2.3 6.4z',
      pause: 'M6.2 3.6v8.8M9.8 3.6v8.8',
      play: 'M5.6 3.4 12 8l-6.4 4.6z',
      copy: 'M5.6 5.6V3.4h7v7h-2.2M3.4 5.6h7v7h-7z',
      file: 'M9.4 2.4H5.6a1 1 0 0 0-1 1v9.2a1 1 0 0 0 1 1h4.8a1 1 0 0 0 1-1V5.4zM9.4 2.4v3h3',
      image: 'M2.4 3.4h11.2v9.2H2.4zM2.4 10.4l3-2.8 2.4 2.4 2-1.8 3.8 3M10 6.4a.7.7 0 1 0 0-.01',
      pen: 'M3 12.9l.8-2.6L10.4 3.7l1.9 1.9-6.6 6.6zM9.2 4.9l1.9 1.9',
      spark: 'M8 2.4v3.2M8 10.4v3.2M2.4 8h3.2M10.4 8h3.2M4.1 4.1l1.7 1.7M10.2 10.2l1.7 1.7M11.9 4.1l-1.7 1.7M5.8 10.2l-1.7 1.7',
      layers: 'M8 2.4 2.4 5.2 8 8l5.6-2.8zM2.4 8.2 8 11l5.6-2.8M2.4 11 8 13.8l5.6-2.8',
      layout: 'M2.4 3.4h11.2v9.2H2.4zM2.4 6.4h11.2M6.6 6.4v6.2',
      chart: 'M2.6 13.4h10.8M5 11V7.4M8 11V4.4M11 11V8.8',
      alert: 'M8 2.6 14.4 13.4H1.6zM8 6.4v3.2M8 11.6v.05',
      dot: 'M8 8m-2.6 0a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0',
      link: 'M6.6 9.4 9.4 6.6M6.3 6.9 5 8.2a2.5 2.5 0 0 0 3.5 3.5l.9-.9M9.7 9.1l1.3-1.3a2.5 2.5 0 0 0-3.5-3.5l-.9.9',
      arrow: 'M3 8h9.6M9.4 4.6 12.8 8l-3.4 3.4',
      hash: 'M6.4 2.6 4.9 13.4M11 2.6 9.5 13.4M2.9 5.6h10.2M2.4 10.4h10.2',
      clock: 'M8 13.9a5.9 5.9 0 1 0 0-11.8 5.9 5.9 0 0 0 0 11.8zM8 4.8V8l2.2 1.3',
      book: 'M2.8 2.8h4a2 2 0 0 1 2 2v8.4a1.6 1.6 0 0 0-1.6-1.6H2.8zM13.2 2.8h-4a2 2 0 0 0-2 2v8.4a1.6 1.6 0 0 1 1.6-1.6h4.4z',
      grid: 'M2.8 2.8h4.2v4.2H2.8zM9 2.8h4.2v4.2H9zM2.8 9h4.2v4.2H2.8zM9 9h4.2v4.2H9z',
      external: 'M9 3.1h3.9V7M12.9 3.1 7 9M11.6 9.4v3.4H3.2V4.4h3.4',
      shield: 'M8 2.3 3.7 4.1v3.7c0 2.7 1.8 4.7 4.3 5.7 2.5-1 4.3-3 4.3-5.7V4.1zM6.1 7.9 7.5 9.3l2.5-2.5',
      note: 'M3.4 13.2h9.2M4.4 10.4 11 3.8l1.2 1.2-6.6 6.6-1.9.6z',
      history: 'M3 8a5 5 0 1 0 1.5-3.6M2.6 2.6v3h3M8 5v3.2l2.2 1.3',
      library: 'M2.6 3.4h4.2v9.2H2.6zM7.6 3.4h4.2v9.2H7.6zM12.9 4.6h.9v8',
      keyboard: 'M1.8 4.2h12.4v7.6H1.8zM4.2 6.9h.01M6.6 6.9h.01M9 6.9h.01M11.4 6.9h.01M5 9.6h6',
      gauge: 'M2.8 12.2a5.2 5.2 0 1 1 10.4 0M8 12.2l2.7-3.4',
      plus: 'M8 3.2v9.6M3.2 8h9.6',
      search: 'M7.1 12.1a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM10.8 10.8l2.7 2.7',
      trash: 'M3.2 4.4h9.6M6.4 4.4V2.8h3.2v1.6M4.4 4.4l.6 8.8h6l.6-8.8',
      chevron: 'M6.4 3.4 11 8l-4.6 4.6',
      list: 'M2.8 4.2h10.4M2.8 8h10.4M2.8 11.8h10.4',
    }

    function Icon({ name, size = 16, stroke = 1.1, className }) {
      return h(
        'svg',
        {
          className,
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': true,
          style: { flex: 'none' },
        },
        h('path', {
          d: ICONS[name] ?? ICONS.dot,
          stroke: 'currentColor',
          strokeWidth: stroke,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    }

    // -----------------------------------------------------------------------
    // 工具
    // -----------------------------------------------------------------------
    function formatError(error) {
      if (error === undefined || error === null) return 'unknown error'
      if (typeof error === 'string') return error
      if (typeof error.message === 'string') return error.code ? error.code + ': ' + error.message : error.message
      try {
        return JSON.stringify(error, null, 2)
      } catch {
        return String(error)
      }
    }

    function clip(text, max) {
      const value = String(text ?? '')
      return value.length > max ? value.slice(0, max) + '…' : value
    }

    function num(value) {
      return Number(value || 0).toLocaleString('en-US')
    }

    function humanBytes(bytes) {
      const value = Number(bytes || 0)
      if (value < 1024) return value + ' B'
      if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
      return (value / 1024 / 1024).toFixed(2) + ' MB'
    }

    function sessionIdOf(row) {
      if (row === null || typeof row !== 'object') return undefined
      return row.sessionId ?? row.id ?? row.session?.id
    }

    function sessionCwdOf(row) {
      if (row === null || typeof row !== 'object') return ''
      return row.cwd ?? row.workingDirectory ?? row.workspacePath ?? ''
    }

    function sessionTitleOf(row) {
      if (row === null || typeof row !== 'object') return '(无标题)'
      const title = row.title ?? row.name ?? row.projections?.values?.title ?? row.projection?.values?.title
      return typeof title === 'string' && title.trim() !== '' ? title : '(无标题)'
    }

    function sessionRows(value) {
      if (Array.isArray(value)) return value
      if (value !== null && typeof value === 'object') {
        for (const key of ['items', 'sessions', 'rows', 'entries', 'values']) {
          if (Array.isArray(value[key])) return value[key]
        }
      }
      return []
    }

    function shortId(id) {
      return String(id || '').replace(/^session-/, '').slice(0, 8)
    }

    function pad2(value) {
      return String(value).padStart(2, '0')
    }

    function formatWhen(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms)) {
        const parsed = Date.parse(String(ms || ''))
        if (!Number.isFinite(parsed)) return ''
        return formatWhen(parsed)
      }
      const d = new Date(ms)
      return d.getMonth() + 1 + '/' + d.getDate() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes())
    }

    function relTime(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms)) return ''
      const diff = Date.now() - ms
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前'
      return Math.floor(diff / 86400000) + ' 天前'
    }

    function initialOf(text) {
      const value = String(text || '').trim()
      if (value === '') return '·'
      const first = value.replace(/^[【\[]/, '').charAt(0)
      return first
    }

    function pickLine(text, label) {
      const match = new RegExp('^\\s*' + label + '\\s*[:：]\\s*(.+?)\\s*$', 'm').exec(text)
      return match === null ? undefined : match[1].replace(/\s+#.*$/, '').trim()
    }

    function stageIndexFrom(value) {
      if (typeof value !== 'string') return undefined
      const hit = CIRCLED.indexOf(value.trim().charAt(0))
      if (hit >= 0) return hit + 1
      const digit = /^([1-7])/.exec(value.trim())
      return digit === null ? undefined : Number(digit[1])
    }

    function parseStateDoc(text) {
      const status = pickLine(text, '状态')
      const runStep = pickLine(text, 'run step')
      const done = pickLine(text, '已完成')
      const topic = pickLine(text, '主题')
      const mode = pickLine(text, '模式')
      const startDate = pickLine(text, '开写日期')
      const targetDate = pickLine(text, '目标发布日')
      const current = stageIndexFrom(runStep) ?? stageIndexFrom(status) ?? (status === 'run' ? undefined : 0)
      const doneStages = new Set()
      if (done !== undefined) {
        for (let index = 0; index < STAGE_NAMES.length; index += 1) {
          if (done.includes(CIRCLED[index]) || done.includes(String(index + 1))) doneStages.add(index + 1)
        }
      }
      const defaultStage = current ?? 1
      return {
        status: status ?? (runStep === undefined ? '未知' : 'run'),
        runStep: runStep ?? '',
        topic: topic ?? '',
        mode: mode ?? '',
        doneStages,
        current,
        defaultStage,
        startDate,
        targetDate,
      }
    }

    function splitFrontmatter(text) {
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
      if (match === null) return { body: text, meta: {}, offset: 0 }
      const meta = {}
      for (const line of match[1].split('\n')) {
        const pair = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
        if (pair !== null) meta[pair[1]] = pair[2].replace(/^['"]|['"]$/g, '')
      }
      // 正文起始行号：frontmatter 占掉的行数（体检脚本按整份文件的行号报）
      const offset = match[0].split('\n').length - 1
      return { body: text.slice(match[0].length), meta, offset }
    }

    function inlineParts(text, keyPrefix) {
      const parts = []
      const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
      let last = 0
      let match
      let index = 0
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index))
        const token = match[1]
        const key = keyPrefix + '-' + index
        if (token.startsWith('**')) {
          parts.push(h('strong', { key }, token.slice(2, -2)))
        } else if (token.startsWith('`')) {
          parts.push(h('code', { key }, token.slice(1, -1)))
        } else {
          const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
          parts.push(h('a', { key, href: link === null ? '#' : link[2], target: '_blank', rel: 'noreferrer' }, link === null ? token : link[1]))
        }
        index += 1
        last = match.index + token.length
      }
      if (last < text.length) parts.push(text.slice(last))
      return parts
    }

    // Markdown 渲染：保留每个块的起始行号，便于从体检明细定位到正文
    function MarkdownView({ text, highlight, offset }) {
      const lines = String(text || '').split('\n')
      const nodes = []
      let paragraph = []
      let quote = []
      let code = []
      let inCode = false
      let list = []
      let table = []
      const base = typeof offset === 'number' ? offset : 0
      const hit = (line) => (typeof highlight === 'number' && highlight > 0 && line === highlight ? ' hit' : '')
      let blockStart = base + 1
      const flushTable = () => {
        if (table.length === 0) return
        const parseRow = (raw) =>
          raw
            .replace(/^\s*\|/, '')
            .replace(/\|\s*$/, '')
            .split('|')
            .map((cell) => cell.trim())
        const head = parseRow(table[0])
        const rows = table.slice(2).map(parseRow)
        const align = (cell, index) => (/^[-:]+$/.test(cell) ? /:-+:$/.test(cell) ? 'center' : 'right' : head[index] === undefined ? 'left' : /^[-:]+$/.test(head[index]) ? 'right' : 'left')
        nodes.push(
          h(
            'div',
            { key: 't-' + nodes.length, className: 'gzw-md-tablewrap' },
            h(
              'table',
              { className: 'gzw-md-table' },
              h('thead', {}, h('tr', {}, ...head.map((cell, index) => h('th', { key: 'h' + index, style: { textAlign: align(head[index], index) } }, ...inlineParts(cell, 'th' + index))))),
              h(
                'tbody',
                {},
                ...rows.map((cells, rIndex) =>
                  h(
                    'tr',
                    { key: 'r' + rIndex },
                    ...cells.map((cell, cIndex) => h('td', { key: 'c' + cIndex, style: { textAlign: align(head[cIndex], cIndex) } }, ...inlineParts(cell, 'td' + rIndex + '-' + cIndex))),
                  ),
                ),
              ),
            ),
          ),
        )
        table = []
      }
      const flushParagraph = () => {
        if (paragraph.length === 0) return
        nodes.push(h('p', { key: 'p-' + nodes.length, className: 'gzw-md-p' + hit(blockStart), 'data-line': blockStart }, ...inlineParts(paragraph.join(' '), 'p' + nodes.length)))
        paragraph = []
      }
      const flushQuote = () => {
        if (quote.length === 0) return
        nodes.push(h('blockquote', { key: 'q-' + nodes.length, className: 'gzw-md-q' + hit(blockStart), 'data-line': blockStart }, ...inlineParts(quote.join(' '), 'q' + nodes.length)))
        quote = []
      }
      const flushList = () => {
        if (list.length === 0) return
        nodes.push(
          h(
            'ul',
            { key: 'l-' + nodes.length, className: 'gzw-md-ul' },
            list.map((item, index) => h('li', { key: 'li-' + index }, ...inlineParts(item, 'li-' + index))),
          ),
        )
        list = []
      }
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const raw = lines[lineIndex]
        const line = raw.replace(/\s+$/, '')
        if (/^\s*```/.test(line)) {
          flushTable()
          if (inCode) {
            nodes.push(h('pre', { key: 'c-' + nodes.length, className: 'gzw-md-code' }, code.join('\n')))
            code = []
            inCode = false
          } else {
            flushParagraph()
            flushQuote()
            flushList()
            inCode = true
          }
          continue
        }
        if (inCode) {
          code.push(line)
          continue
        }
        if (line.trim() === '') {
          flushParagraph()
          flushQuote()
          flushList()
          flushTable()
          continue
        }
        if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
          flushParagraph()
          flushQuote()
          flushList()
          flushTable()
          nodes.push(h('hr', { key: 'hr-' + nodes.length, className: 'gzw-md-hr' }))
          continue
        }
        const heading = /^(#{1,4})\s+(.*)$/.exec(line)
        if (heading !== null) {
          flushParagraph()
          flushQuote()
          flushList()
          flushTable()
          nodes.push(h('div', { key: 'h-' + nodes.length, className: 'gzw-md-h gzw-md-h' + heading[1].length + hit(base + lineIndex + 1), 'data-line': base + lineIndex + 1 }, ...inlineParts(heading[2], 'h' + nodes.length)))
          continue
        }
        if (/^>\s?/.test(line)) {
          flushParagraph()
          flushList()
          flushTable()
          quote.push(line.replace(/^>\s?/, ''))
          continue
        }
        const tableRow = /^\s*\|.*\|\s*$/.test(line)
        if (tableRow) {
          flushParagraph()
          flushQuote()
          flushList()
          table.push(line)
          continue
        }
        const item = /^[-*]\s+(.*)$/.exec(line)
        if (item !== null) {
          flushParagraph()
          flushQuote()
          flushTable()
          list.push(item[1])
          continue
        }
        const ordered = /^\d+\.\s+(.*)$/.exec(line)
        if (ordered !== null) {
          flushParagraph()
          flushQuote()
          flushList()
          nodes.push(h('p', { key: 'n-' + nodes.length, className: 'gzw-md-p' + hit(base + lineIndex + 1), 'data-line': base + lineIndex + 1 }, ...inlineParts(line, 'n' + nodes.length)))
          continue
        }
        if (paragraph.length === 0) blockStart = base + lineIndex + 1
        paragraph.push(line)
      }
      flushParagraph()
      flushQuote()
      flushList()
      flushTable()
      if (code.length > 0) nodes.push(h('pre', { key: 'c-' + nodes.length, className: 'gzw-md-code' }, code.join('\n')))
      return h('div', { className: 'gzw-md' }, ...nodes)
    }

    function summarizeToolCall(name, args) {
      const pick = (keys) => {
        for (const key of keys) {
          const value = args[key]
          if (typeof value === 'string' && value.length > 0) return value
        }
        return undefined
      }
      if (name === 'bash' || name === 'pwsh') return clip(pick(['description', 'command']) ?? '', 200)
      if (name === 'write' || name === 'edit' || name === 'read') return pick(['file_path', 'path']) ?? ''
      if (name === 'grep') return String(pick(['pattern', 'query']) ?? '')
      if (name === 'glob') return String(pick(['pattern']) ?? '')
      if (name === 'skill') return String(pick(['name']) ?? '')
      if (name === 'web_search' || name === 'web_fetch') return clip(pick(['queries', 'query', 'url']) ?? '', 200)
      if (name === 'present') return clip(pick(['files', 'path']) ?? '', 200)
      return clip(pick(['description', 'command', 'path', 'file_path', 'query', 'pattern', 'name']) ?? JSON.stringify(args), 200)
    }

    function looksLikeFile(text) {
      return /(?:^|[\s"'`({\[])(?:[\w.@\/-]*\/)?[\w.@-]+\.(?:md|markdown|json|html?|css|js|mjs|cjs|ts|py|yaml|yml|png|jpe?g|gif|webp|txt|svg)\b/.test(String(text || ''))
    }

    function isDecision(text) {
      const t = String(text || '').trim()
      if (t.length === 0 || t.length > 120) return false
      if (/[?？]\s*$/.test(t)) return false
      return /^(选|用|定|决定|建议|采用|进入|保持|跳过|不写|不用|先|继续|改成|修改|标题|主题|方案)/.test(t) || /(我选|决定|建议|因为)/.test(t)
    }

    const SKIP_EVENT_TYPES = new Set([
      'step/start',
      'step/end',
      'job/registered',
      'job/settled',
      'agent/inbox/spliced',
      'agent-preset/selected',
      'session/end-seed',
      'session/checkpoint',
      'permission/preset',
      'sandbox/mode',
      'approval/policy',
      'request/header',
      'request/context',
      'request/usage',
      'token/usage',
      'compaction/start',
      'compaction/end',
      'compaction/result',
    ])

    function traceRowsFromEvents(events) {
      const rows = []
      const byCall = new Map()
      const byCommand = new Map()
      for (const event of Array.isArray(events) ? events : []) {
        if (event === null || typeof event !== 'object') continue
        const type = event.type
        const data = event.data ?? {}
        const time = typeof event.time === 'number' ? new Date(event.time).toLocaleTimeString('zh-CN', { hour12: false }) : ''
        const clock = typeof event.time === 'number' ? event.time : 0

        if (type === 'user/message') {
          const content = Array.isArray(data.content) ? data.content : []
          const text = content
            .filter((block) => block?.type === 'text')
            .map((block) => String(block.text || ''))
            .join('\n')
            .trim()
          if (text === '') continue
          const sourceKind = String(data.source?.kind ?? 'user')
          if (sourceKind !== 'user' && sourceKind !== 'user-approval') {
            rows.push({ kind: 'system', label: '系统注入', text: '（' + sourceKind + '，' + text.length + ' 字符）', time, clock, file: false, error: false, decision: false, raw: clip(text, 1600) })
            continue
          }
          const isReview = text.startsWith('【工作台审阅') || text.includes('【工作台审阅')
          const isApproval = sourceKind === 'user-approval'
          rows.push({
            kind: isReview ? 'review' : isApproval ? 'system' : 'user',
            label: isReview ? '审阅指令' : isApproval ? '审批' : '用户',
            text: clip(text, 700),
            time,
            clock,
            file: false,
            error: false,
            decision: false,
            raw: isApproval ? clip(text, 1200) : null,
          })
          continue
        }

        if (type === 'assistant/message') {
          const content = data.message?.content ?? []
          for (const block of content) {
            if (block?.type !== 'text') continue
            const text = String(block.text || '').trim()
            if (text === '') continue
            const decision = isDecision(text)
            rows.push({ kind: decision ? 'decision' : 'say', label: decision ? '决策' : '助手', text: clip(text, 700), time, clock, file: false, error: false, decision, raw: null })
          }
          continue
        }

        if (type === 'tool/call') {
          const name = String(data.name || 'tool')
          const argsText = typeof data.arguments === 'string' ? data.arguments : JSON.stringify(data.arguments ?? {})
          let args = {}
          try {
            args = typeof data.arguments === 'string' ? JSON.parse(data.arguments) : data.arguments || {}
          } catch {
            args = {}
          }
          const summary = summarizeToolCall(name, args)
          const row = { kind: 'tool', label: name, text: summary, time, clock, file: looksLikeFile(argsText + ' ' + summary), error: false, decision: false, raw: null }
          rows.push(row)
          if (data.callId !== undefined) byCall.set(String(data.callId), row)
          continue
        }

        if (type === 'tool/result') {
          const content = data.message?.content ?? []
          const text = content
            .filter((block) => block?.type === 'text')
            .map((block) => String(block.text || ''))
            .join('\n')
            .trim()
          const isError = data.message?.isError === true || data.isError === true || /(^|\n)(Error|错误|\[exit code: [1-9]|Traceback)/.test(text)
          const callId = String(data.callId ?? data.message?.toolCallId ?? data.message?.source?.callId ?? '')
          const row = byCall.get(callId)
          if (row !== undefined) {
            row.text = row.text === '' ? clip(text, 300) : row.text + ' → ' + clip(text, 300)
            row.error = isError
            row.clock = row.clock || clock
            if (isError) row.label = row.label + '·失败'
          } else {
            rows.push({ kind: 'result', label: isError ? '结果·失败' : '结果', text: clip(text, 400), time, clock, file: false, error: isError, decision: false, raw: null })
          }
          continue
        }

        if (type === 'command/run') {
          const row = { kind: 'command', label: '命令', text: '/' + String(data.name || '') + (data.args ? ' ' + String(data.args) : ''), time, clock, file: false, error: false, decision: false, raw: null }
          rows.push(row)
          if (data.commandId !== undefined) byCommand.set(String(data.commandId), row)
          continue
        }

        if (type === 'command/done') {
          const row = byCommand.get(String(data.commandId ?? ''))
          const failed = data.kind === 'error'
          const suffix = failed ? ' · 失败' : ' · 完成'
          const output = data.text === undefined ? null : clip(String(data.text), 1600)
          if (row !== undefined) {
            row.text = row.text + suffix
            row.error = failed
            row.raw = output ?? row.raw
          } else {
            rows.push({ kind: 'command', label: '命令', text: '命令' + suffix, time, clock, file: false, error: failed, decision: false, raw: output })
          }
          continue
        }

        if (type === 'turn/start' || type === 'turn/end') {
          rows.push({ kind: 'turn', label: '轮次', text: type === 'turn/start' ? '开始 turn ' + String(data.turn ?? '') : '结束 turn ' + String(data.turn ?? ''), time, clock, file: false, error: false, decision: false, raw: null })
          continue
        }

        if (type === 'session/title') {
          rows.push({ kind: 'system', label: '标题', text: clip(String(data.title ?? ''), 200), time, clock, file: false, error: false, decision: false, raw: null })
          continue
        }

        if (type === 'system/message') {
          const content = Array.isArray(data.content) ? data.content : []
          const text = content
            .filter((block) => block?.type === 'text')
            .map((block) => String(block.text || ''))
            .join('\n')
            .trim()
          rows.push({ kind: 'system', label: '系统', text: clip(text, 300), time, clock, file: false, error: false, decision: false, raw: null })
          continue
        }

        if (SKIP_EVENT_TYPES.has(String(type))) continue

        rows.push({
          kind: 'unknown',
          label: String(type || 'unknown'),
          text: '',
          time,
          clock,
          file: false,
          error: false,
          decision: false,
          raw: (() => {
            try {
              return clip(JSON.stringify(data), 1200)
            } catch {
              return '(无法序列化)'
            }
          })(),
        })
      }
      return rows
    }

    function mergeEvent(prev, event) {
      if (event === null || typeof event !== 'object') return prev
      const seq = event.seq
      if (typeof seq === 'number' && prev.some((item) => item.seq === seq)) return prev
      const next = prev.concat(event)
      next.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
      return next.length > 800 ? next.slice(next.length - 800) : next
    }

    function eventsFromRecords(records) {
      return (Array.isArray(records) ? records : []).map((record) => record?.event ?? record).filter((event) => event !== null && typeof event === 'object')
    }

    // -----------------------------------------------------------------------
    // 派生数据
    // -----------------------------------------------------------------------
    // 句长分箱：<15 / 15–25 / 25–40 / 40–60 / 60+
    function sentenceBuckets(body) {
      const parts = String(body || '')
        .split(/[。！？!?…]+/)
        .map((part) => (part.match(/[^\s]/g) || []).length)
        .filter((value) => value > 0)
      const edges = [15, 25, 40, 60]
      const labels = ['<15', '15–25', '25–40', '40–60', '60+']
      const counts = [0, 0, 0, 0, 0]
      for (const value of parts) {
        let index = 0
        while (index < edges.length && value >= edges[index]) index += 1
        counts[index] += 1
      }
      return labels.map((label, index) => ({ label, count: counts[index], long: index === 4 }))
    }

    function draftStats(text) {
      const body = String(text || '')
      const paragraphs = body
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter((block) => block !== '' && !/^#{1,4}\s/.test(block) && !/^!\[/.test(block))
      const chars = (body.match(/[^\s]/g) || []).length
      const sentences = (body.match(/[。！？!?…]+/g) || []).length
      const rhythm = paragraphs.map((block) => (block.match(/[^\s]/g) || []).length)
      const readMinutes = Math.max(1, Math.round(chars / 420))
      const avgSentence = sentences > 0 ? Math.round(chars / sentences) : 0
      const longest = rhythm.length > 0 ? Math.max(...rhythm) : 0
      return { chars, paragraphs: paragraphs.length, sentences, rhythm, readMinutes, avgSentence, longest, buckets: sentenceBuckets(body) }
    }

    function eventSeries(events, bins) {
      const count = bins ?? 24
      const times = (Array.isArray(events) ? events : []).map((event) => event?.time).filter((time) => typeof time === 'number')
      if (times.length === 0) return { values: new Array(count).fill(0), min: 0, max: 0, span: 0, total: 0 }
      const min = Math.min(...times)
      const max = Math.max(...times)
      const span = Math.max(60000, max - min)
      const values = new Array(count).fill(0)
      for (const time of times) {
        const index = Math.min(count - 1, Math.max(0, Math.floor(((time - min) / span) * count)))
        values[index] += 1
      }
      return { values, min, max, span, total: times.length }
    }

    function traceStats(rows, events) {
      const byKind = {}
      for (const row of rows) byKind[row.kind] = (byKind[row.kind] ?? 0) + 1
      const errors = rows.filter((row) => row.error === true).length
      const tools = rows.filter((row) => row.kind === 'tool').length
      const decisions = rows.filter((row) => row.decision === true).length
      const reviews = rows.filter((row) => row.kind === 'review').length
      const turns = rows.filter((row) => row.kind === 'turn' && /开始/.test(row.text)).length
      const series = eventSeries(events, 24)
      return { byKind, errors, tools, decisions, reviews, turns, series, total: rows.length }
    }

    function groupEntries(entries) {
      const map = new Map()
      for (const entry of Array.isArray(entries) ? entries : []) {
        const rule = String(entry?.rule ?? entry?.message ?? '未分类')
        const current = map.get(rule) ?? { rule, count: 0, entries: [] }
        current.count += 1
        current.entries.push(entry)
        map.set(rule, current)
      }
      return Array.from(map.values()).sort((a, b) => b.count - a.count)
    }

    function gateAggregate(gate) {
      if (gate === null || gate === undefined) return null
      if (gate.status === 'running') return { running: true, target: gate.target }
      const payload = gate.payload
      if (payload !== null && payload !== undefined && payload.ok === false) {
        return { failed: true, target: gate.target, reason: String(payload.code || payload.error || '未知原因') }
      }
      const data = gate.data
      if (data === null || data === undefined) return { raw: String(gate.raw || gate.human || '无输出'), target: gate.target }
      if (gate.target === 'draft') {
        const fails = Array.isArray(data.fail) ? data.fail : []
        const warns = Array.isArray(data.warn) ? data.warn : []
        const groups = groupEntries(warns.concat(fails.map((entry) => ({ ...entry, fail: true }))))
        const hits = fails.length + warns.length
        const score = Math.max(0, Math.min(100, Math.round(100 - fails.length * 24 - warns.length * 3)))
        return { target: 'draft', fails, warns, groups, hits, score, exit: data.exit, stats: data.stats ?? null, at: gate.at }
      }
      if (gate.target === 'html') {
        const errors = Array.isArray(data.errors) ? data.errors : []
        const warns = Array.isArray(data.warns) ? data.warns : []
        const groups = groupEntries(errors.concat(warns))
        return { target: 'html', errors, warns, groups, spanLeafCount: data.spanLeafCount, exit: data.exit, at: gate.at }
      }
      return { raw: JSON.stringify(data, null, 2), target: gate.target }
    }

    function parseTargetDate(text) {
      const raw = String(text || '')
      const match = /(\d{1,2})[-/月](\d{1,2})/.exec(raw)
      if (match === null) return null
      const now = new Date()
      const month = Number(match[1])
      const day = Number(match[2])
      const target = new Date(now.getFullYear(), month - 1, day, 23, 59, 59)
      if (target.getTime() < now.getTime() - 300 * 86400000) target.setFullYear(now.getFullYear() + 1)
      const days = Math.round((target.getTime() - now.getTime()) / 86400000)
      return { days, label: match[1] + '-' + match[2] }
    }

    // -----------------------------------------------------------------------
    // 基础组件
    // -----------------------------------------------------------------------
    function Card({ title, sub, icon, actions, children, className, flush }) {
      const classes = ['gzw-card']
      if (className) classes.push(className)
      return h(
        'div',
        { className: classes.join(' ') + (flush ? ' flush' : '') },
        title === undefined && actions === undefined
          ? null
          : h(
              'div',
              { className: 'gzw-card-head' },
              h(
                'div',
                { className: 'gzw-card-head-main' },
                h('div', { className: 'gzw-card-title' }, icon ? h('span', { className: 'gzw-card-ico' }, h(Icon, { name: icon, size: 15 })) : null, title),
                sub ? h('div', { className: 'gzw-card-sub' }, sub) : null,
              ),
              actions === undefined ? null : h('div', { className: 'gzw-card-actions' }, ...(Array.isArray(actions) ? actions : [actions])),
            ),
        h('div', { className: 'gzw-card-body' }, ...(Array.isArray(children) ? children : [children])),
      )
    }

    function Btn({ children, onClick, variant, icon, disabled, title, wide, size }) {
      const classes = ['gzw-btn']
      if (variant) classes.push(variant)
      if (wide) classes.push('wide')
      if (size) classes.push(size)
      return h(
        'button',
        { type: 'button', className: classes.join(' '), onClick, disabled: disabled === true, title },
        icon ? h('span', { className: 'gzw-btn-ico' }, h(Icon, { name: icon, size: 14 })) : null,
        children,
      )
    }

    // 进度环：阶段完成度（0–7 段）
    function Ring({ value, max, size, stroke, children }) {
      const box = size ?? 96
      const weight = stroke ?? 7
      const radius = (box - weight) / 2
      const circumference = 2 * Math.PI * radius
      const top = max ?? 100
      const clamped = Math.max(0, Math.min(top, Number(value) || 0))
      return h(
        'div',
        { className: 'gzw-ring', style: { width: box, height: box } },
        h(
          'svg',
          { width: box, height: box, viewBox: '0 0 ' + box + ' ' + box, style: { transform: 'rotate(-90deg)', display: 'block' }, 'aria-hidden': true },
          h('circle', { cx: box / 2, cy: box / 2, r: radius, fill: 'none', stroke: 'var(--gzw-line-soft)', strokeWidth: weight }),
          h('circle', {
            cx: box / 2,
            cy: box / 2,
            r: radius,
            fill: 'none',
            stroke: 'var(--gzw-accent)',
            strokeWidth: weight,
            strokeLinecap: 'round',
            strokeDasharray: ((clamped / top) * circumference).toFixed(2) + ' ' + circumference,
            style: { transition: 'stroke-dasharray .6s var(--gzw-ease)' },
          }),
        ),
        children === undefined
          ? h(
              'div',
              { className: 'gzw-ring-center' },
              h('div', { className: 'gzw-ring-value' }, Math.round(clamped), h('span', {}, '/' + top)),
              h('div', { className: 'gzw-ring-label' }, '阶段完成'),
            )
          : h('div', { className: 'gzw-ring-center' }, children),
      )
    }

    // 体检分数仪表：0–100；分级由 FAIL/WARN 决定（WARN 不当失败看）
    function ScoreGauge({ score, size, cap, sub, tone }) {
      const box = size ?? 132
      const weight = 9
      const radius = (box - weight) / 2
      const circumference = 2 * Math.PI * radius
      const value = Math.max(0, Math.min(100, Number(score) || 0))
      const color = tone === 'danger' ? 'var(--gzw-danger)' : tone === 'warn' ? 'var(--gzw-warn)' : 'var(--gzw-accent)'
      return h(
        'div',
        { className: 'gzw-gauge' },
        h(
          'svg',
          { width: box, height: box, viewBox: '0 0 ' + box + ' ' + box, style: { transform: 'rotate(-90deg)', display: 'block' }, 'aria-hidden': true },
          h('circle', { cx: box / 2, cy: box / 2, r: radius, fill: 'none', stroke: 'var(--gzw-line-soft)', strokeWidth: weight }),
          h('circle', {
            cx: box / 2,
            cy: box / 2,
            r: radius,
            fill: 'none',
            stroke: color,
            strokeWidth: weight,
            strokeLinecap: 'round',
            strokeDasharray: ((value / 100) * circumference).toFixed(2) + ' ' + circumference,
            style: { transition: 'stroke-dasharray .6s var(--gzw-ease)' },
          }),
        ),
        h(
          'div',
          { className: 'gzw-gauge-center' },
          h('div', { className: 'gzw-gauge-value', style: { color } }, value),
          h('div', { className: 'gzw-gauge-cap' }, cap ?? '体检分'),
        ),
        h(
          'div',
          { className: 'gzw-gauge-scale' },
          h('span', {}, '0'),
          h('span', {}, sub ?? '100'),
        ),
      )
    }

    function Sparkline({ values, height, tone }) {
      const list = Array.isArray(values) ? values.filter((value) => typeof value === 'number') : []
      if (list.length < 2) return null
      const box = height ?? 34
      const width = 120
      const max = Math.max(1, ...list)
      const step = width / (list.length - 1)
      const points = list.map((value, index) => [index * step, box - (value / max) * (box - 4) - 2])
      const line = points.map((point, index) => (index === 0 ? 'M' : 'L') + point[0].toFixed(1) + ',' + point[1].toFixed(1)).join(' ')
      const fillPath = line + ' L' + width + ',' + box + ' L0,' + box + ' Z'
      const color = tone === 'warn' ? 'var(--gzw-warn)' : 'var(--gzw-accent)'
      return h(
        'svg',
        { viewBox: '0 0 ' + width + ' ' + box, preserveAspectRatio: 'none', style: { width: '100%', height: box }, 'aria-hidden': true },
        h('path', { d: fillPath, fill: tone === 'warn' ? 'var(--gzw-warn-soft)' : 'var(--gzw-accent-soft)', stroke: 'none' }),
        h('path', {
          d: line,
          fill: 'none',
          stroke: color,
          strokeWidth: 1.4,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          vectorEffect: 'non-scaling-stroke',
        }),
      )
    }

    // 段落节奏：条长 = 段落字数，虚线 = 200 字阈值
    function RhythmStrip({ values, threshold }) {
      const list = Array.isArray(values) ? values : []
      if (list.length === 0) return null
      const limit = threshold ?? 200
      const max = Math.max(limit, ...list)
      const over = list.filter((value) => value > limit).length
      return h(
        'div',
        {},
        h(
          'div',
          { className: 'gzw-rhythm' },
          ...list.slice(-60).map((value, index) =>
            h('span', {
              key: index,
              className: 'gzw-rhythm-bar' + (value > limit ? ' over' : ''),
              title: '第 ' + (index + 1) + ' 段 · ' + value + ' 字',
              style: { height: Math.max(2, (value / max) * 100) + '%' },
            }),
          ),
          h('span', { className: 'gzw-rhythm-line', style: { bottom: (limit / max) * 100 + '%' } }),
        ),
        h(
          'div',
          { className: 'gzw-rhythm-cap' },
          h('span', { className: 'gzw-dim' }, '每条一段 · 虚线 ' + limit + ' 字'),
          h('span', { className: over > 0 ? 'gzw-warn' : 'gzw-dim' }, over > 0 ? over + ' 段超阈值' : '没有超长段'),
        ),
      )
    }

    // 句长分布直方图
    function SentenceHistogram({ buckets }) {
      const list = Array.isArray(buckets) ? buckets : []
      if (list.length === 0) return null
      const total = list.reduce((sum, item) => sum + item.count, 0)
      const max = Math.max(1, ...list.map((item) => item.count))
      return h(
        'div',
        {},
        h(
          'div',
          { className: 'gzw-hist' },
          ...list.map((item, index) =>
            h(
              'div',
              { className: 'gzw-hist-col', key: index, title: item.label + '：' + item.count + ' 句' },
              h('span', { className: 'gzw-hist-count' }, item.count > 0 ? String(item.count) : ''),
              h('span', { className: 'gzw-hist-bar' + (item.long ? ' long' : ''), style: { height: Math.max(2, (item.count / max) * 100) + '%' } }),
              h('span', { className: 'gzw-hist-label' }, item.label),
            ),
          ),
        ),
        h('div', { className: 'gzw-rhythm-cap' }, h('span', { className: 'gzw-dim' }, '共 ' + total + ' 句 · 竖条为句数')),
      )
    }

    // 规则分布：命中数 + 占比
    function RuleBars({ rows, total }) {
      const list = Array.isArray(rows) ? rows : []
      if (list.length === 0) return h('div', { className: 'gzw-dim' }, '没有命中项，这一版很干净。')
      const max = Math.max(1, ...list.map((row) => row.count))
      const sum = total ?? list.reduce((acc, row) => acc + row.count, 0)
      return h(
        'div',
        { className: 'gzw-bars' },
        ...list.map((row, index) =>
          h(
            'div',
            { className: 'gzw-bar-row', key: row.rule + index, title: row.rule },
            h('span', { className: 'gzw-bar-label' }, row.rule),
            h(
              'span',
              { className: 'gzw-bar-track' },
              h('span', {
                className: 'gzw-bar-fill' + (row.fail === true ? ' fail' : ''),
                style: { width: Math.max(3, (row.count / max) * 100) + '%' },
              }),
            ),
            h('span', { className: 'gzw-bar-count' }, row.count, h('small', {}, ' · ' + Math.round((row.count / Math.max(1, sum)) * 100) + '%')),
          ),
        ),
      )
    }

    // 活动构成环：只有有数据时才画
    function Donut({ segments, size, children }) {
      const list = (Array.isArray(segments) ? segments : []).filter((item) => (Number(item.value) || 0) > 0)
      const box = size ?? 74
      const total = list.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
      if (total === 0) return null
      let acc = 0
      const stops = []
      for (const item of list) {
        const start = (acc / total) * 360
        acc += Number(item.value) || 0
        const end = (acc / total) * 360
        stops.push(item.color + ' ' + start.toFixed(2) + 'deg ' + end.toFixed(2) + 'deg')
      }
      return h(
        'div',
        { style: { position: 'relative', width: box, height: box, flex: 'none' } },
        h('div', {
          style: {
            width: box,
            height: box,
            borderRadius: '50%',
            background: 'conic-gradient(' + stops.join(',') + ')',
            WebkitMask: 'radial-gradient(circle,transparent 62%,#000 63%)',
            mask: 'radial-gradient(circle,transparent 62%,#000 63%)',
          },
        }),
        h('div', { style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' } }, children),
      )
    }

    // 工具调用排行
    function ToolRank({ rows, limit }) {
      const counts = new Map()
      for (const row of Array.isArray(rows) ? rows : []) {
        if (row.kind !== 'tool') continue
        const name = String(row.label || '工具')
        counts.set(name, (counts.get(name) ?? 0) + 1)
      }
      const list = Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit ?? 6)
      if (list.length === 0) return null
      const max = list[0].count
      const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0)
      return h(
        'div',
        { className: 'gzw-bars' },
        ...list.map((item, index) =>
          h(
            'div',
            { className: 'gzw-bar-row', key: item.name + index },
            h('span', { className: 'gzw-bar-label', title: item.name }, item.name),
            h('span', { className: 'gzw-bar-track' }, h('span', { className: 'gzw-bar-fill', style: { width: Math.max(4, (item.count / max) * 100) + '%', background: 'var(--gzw-info)' } })),
            h('span', { className: 'gzw-bar-count' }, item.count),
          ),
        ),
        h('div', { className: 'gzw-rhythm-cap' }, h('span', { className: 'gzw-dim' }, '共 ' + total + ' 次工具调用')),
      )
    }

    // 产物时间线：按 mtime 排布
    function ArtifactTimeline({ items }) {
      const list = Array.isArray(items) ? items.slice().sort((a, b) => a.mtimeMs - b.mtimeMs) : []
      if (list.length < 2) return null
      const min = list[0].mtimeMs
      const max = list[list.length - 1].mtimeMs
      const span = Math.max(1, max - min)
      return h(
        'div',
        { className: 'gzw-art-timeline' },
        h(
          'div',
          { className: 'gzw-art-tl' },
          h('span', { className: 'gzw-art-tl-line' }),
          ...list.map((item, index) =>
            h(
              'span',
              { key: item.id + index, className: 'gzw-art-tl-dot', style: { left: ((item.mtimeMs - min) / span) * 92 + 4 + '%' }, title: (ARTIFACT_LABELS[item.id] ?? item.id) + ' · ' + formatWhen(item.mtimeMs) },
              h('span', { className: 'gzw-art-tl-label' }, ARTIFACT_LABELS[item.id] ?? item.id),
            ),
          ),
        ),
        h(
          'div',
          { className: 'gzw-art-tl-axis' },
          h('span', { className: 'gzw-dim' }, formatWhen(min)),
          h('span', { className: 'gzw-dim' }, '产出时间（悬停看产物）'),
          h('span', { className: 'gzw-dim' }, formatWhen(max)),
        ),
      )
    }

    // 预算条：已花 / 预估 / 上限
    function BudgetMeter({ spent, estimated, limit }) {
      const cap = Number(limit) || 0
      if (cap <= 0) return null
      const pre = Math.min(100, (Number(estimated) || 0) / cap * 100)
      const used = Math.min(pre, (Number(spent) || 0) / cap * 100)
      return h(
        'div',
        {},
        h(
          'div',
          { className: 'gzw-budget-track' },
          h('span', { className: 'gzw-budget-fill spent', style: { width: used + '%' } }),
          h('span', { className: 'gzw-budget-fill', style: { width: Math.max(0, pre - used) + '%' } }),
        ),
        h(
          'div',
          { className: 'gzw-budget-legend' },
          h('span', {}, h('i', { style: { background: 'var(--gzw-accent)' } }), '预估 ¥' + (Number(estimated) || 0).toFixed(2)),
          h('span', {}, h('i', { style: { background: 'color-mix(in srgb,var(--gzw-accent) 55%,var(--gzw-warn))' } }), '已花 ¥' + (Number(spent) || 0).toFixed(2)),
          h('span', {}, h('i', { style: { background: 'var(--gzw-line)' } }), '剩余 ¥' + Math.max(0, cap - (Number(estimated) || 0)).toFixed(2)),
        ),
      )
    }

    // 发布前置清单
    function CheckList({ checks }) {
      const list = Array.isArray(checks) ? checks : []
      return h(
        'div',
        { className: 'gzw-checklist' },
        ...list.map((check, index) =>
          h(
            'div',
            { className: 'gzw-check', key: 'c' + index },
            h('span', { className: 'gzw-check-ico ' + (check.state === 'ok' ? '' : check.state ?? 'todo') }, h(Icon, { name: check.state === 'ok' ? 'check' : check.state === 'danger' ? 'x' : 'alert', size: 12 })),
            h('div', { className: 'gzw-check-main' }, h('div', { className: 'gzw-check-title' }, check.title), h('div', { className: 'gzw-check-sub' }, check.sub)),
            h('div', { className: 'gzw-check-val', title: check.value }, check.value || '—'),
          ),
        ),
      )
    }

    function Empty({ icon, title, text, action }) {
      return h(
        'div',
        { className: 'gzw-empty' },
        h('div', { className: 'gzw-empty-art' }, h(Icon, { name: icon ?? 'file', size: 18, stroke: 1.1 })),
        title ? h('div', { className: 'gzw-empty-title' }, title) : null,
        text ? h('div', { className: 'gzw-empty-text' }, text) : null,
        action ? h('div', { className: 'gzw-empty-action' }, action) : null,
      )
    }

    // 把宿主返回的原始 code 翻成人话
    function readErrorText(error) {
      const raw = String(error || '')
      if (raw === 'forbidden') return '这个路径在宿主只读白名单之外（重启 DSH 后生效）'
      if (raw === 'not_found') return '文件还不存在（新 clone 的个人数据不会入库）'
      if (raw === 'too_large') return '文件太大，超过单次读取上限'
      return raw
    }

    function Skeleton({ height, width }) {
      return h('span', { className: 'gzw-skel', style: { display: 'block', height: height ?? 14, width: width ?? '100%' } })
    }

    function Stat({ k, v, suffix }) {
      return h(
        'div',
        { className: 'gzw-stat' },
        h('div', { className: 'k' }, k),
        h('div', { className: 'v' }, v, suffix ? h('small', {}, suffix) : null),
      )
    }

    function Fact({ k, v }) {
      return h(
        'div',
        { className: 'gzw-fact' },
        h('div', { className: 'gzw-fact-k' }, k),
        h('div', { className: 'gzw-fact-v' }, v),
      )
    }

    function Metric({ k, v, suffix, hint }) {
      return h(
        'div',
        { className: 'gzw-metric' },
        h('div', { className: 'gzw-metric-k' }, k),
        h('div', { className: 'gzw-metric-v' }, h('span', { className: 'gzw-num' }, v), suffix ? h('span', { className: 'u' }, suffix) : null),
        hint ? h('div', { className: 'gzw-metric-hint' }, hint) : null,
      )
    }

    function Toast({ text }) {
      if (text === '') return null
      return h('div', { className: 'gzw-toast' }, h(Icon, { name: 'check', size: 14 }), text)
    }

    // -----------------------------------------------------------------------
    // 主面板
    // -----------------------------------------------------------------------
    function Workbench() {
      const [sessions, setSessions] = React.useState([])
      const [readSessionId, setReadSessionId] = React.useState('')
      const [controlSessionId, setControlSessionId] = React.useState('')
      const [readPrefix, setReadPrefix] = React.useState('gzhflow/')
      const [repoRoot, setRepoRoot] = React.useState('')
      const [binding, setBinding] = React.useState(null)
      const [bindingInfo, setBindingInfo] = React.useState(null)
      const [bindingError, setBindingError] = React.useState('')
      const [swapPicker, setSwapPicker] = React.useState(false)
      const [sessionFilter, setSessionFilter] = React.useState('')
      const [showAllSessions, setShowAllSessions] = React.useState(false)
      const [article, setArticle] = React.useState(null)
      const [stateError, setStateError] = React.useState('')
      const [draft, setDraft] = React.useState(null)
      const [draftError, setDraftError] = React.useState('')
      const [artifacts, setArtifacts] = React.useState([])
      const [artifactsError, setArtifactsError] = React.useState('')
      const [stageNo, setStageNo] = React.useState(0)
      const [highlightLine, setHighlightLine] = React.useState(0)
      const [docs, setDocs] = React.useState({})
      const [events, setEvents] = React.useState([])
      const [traceError, setTraceError] = React.useState('')
      const [followOn, setFollowOn] = React.useState(true)
      const [followMode, setFollowMode] = React.useState('off')
      const [traceFilter, setTraceFilter] = React.useState('all')
      const [traceSessionId, setTraceSessionId] = React.useState('')
      const [gate, setGate] = React.useState(null)
      const [gateBusy, setGateBusy] = React.useState(false)
      const [layoutTheme, setLayoutTheme] = React.useState('zen')
      const [layoutBusy, setLayoutBusy] = React.useState(false)
      const [layoutResult, setLayoutResult] = React.useState('')
      const [publishBusy, setPublishBusy] = React.useState(false)
      const [publishResult, setPublishResult] = React.useState(null)
      const [passConfirm, setPassConfirm] = React.useState(false)
      const [returnOpen, setReturnOpen] = React.useState(false)
      const [returnNote, setReturnNote] = React.useState('')
      const [promptBusy, setPromptBusy] = React.useState(false)
      const [receipt, setReceipt] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [logs, setLogs] = React.useState([])
      const [view, setView] = React.useState('overview')
      const [toast, setToast] = React.useState('')
      const [expandedRows, setExpandedRows] = React.useState({})
      const [noteDraft, setNoteDraft] = React.useState('')
      const [noteSource, setNoteSource] = React.useState('')
      const [noteBusy, setNoteBusy] = React.useState(false)
      const [noteError, setNoteError] = React.useState('')
      const [newOpen, setNewOpen] = React.useState(false)
      const [newTopic, setNewTopic] = React.useState('')
      const [newBusy, setNewBusy] = React.useState(false)
      const [newError, setNewError] = React.useState('')
      const [pushBusy, setPushBusy] = React.useState(false)
      const [pushConfirm, setPushConfirm] = React.useState(false)
      const [pushResult, setPushResult] = React.useState(null)
      const [onboarded, setOnboarded] = React.useState(() => {
        try {
          return typeof localStorage !== 'undefined' && localStorage.getItem('gzw-onboarded') === '1'
        } catch {
          return false
        }
      })
      const traceEndRef = React.useRef(null)
      const autoScrollRef = React.useRef(true)
      const pendingG = React.useRef(false)
      const toastTimer = React.useRef(null)

      const log = React.useCallback((text) => {
        const line = '[' + new Date().toLocaleTimeString() + '] ' + text
        setLogs((prev) => (prev.length > 220 ? prev.slice(prev.length - 200) : prev).concat(line))
      }, [])

      const dismissOnboarding = React.useCallback(() => {
        setOnboarded(true)
        try {
          localStorage.setItem('gzw-onboarded', '1')
        } catch {}
      }, [])

      const showToast = React.useCallback((text) => {
        setToast(text)
        if (toastTimer.current !== null) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(''), 2200)
      }, [])

      React.useEffect(
        () => () => {
          if (toastTimer.current !== null) clearTimeout(toastTimer.current)
        },
        [],
      )

      const remote = serviceCtx?.remote

      const execCommand = React.useCallback(
        async (text, sessionIdOverride) => {
          const target = typeof sessionIdOverride === 'string' && sessionIdOverride !== '' ? sessionIdOverride : controlSessionId !== '' ? controlSessionId : readSessionId
          if (remote?.commands === undefined || target === '') return { ok: false, text: '命令通道不可用' }
          try {
            const result = await remote.commands.execute(target, text, [])
            if (!result.ok) return { ok: false, text: '命令失败: ' + formatError(result.error) }
            const value = result.value
            return { ok: true, text: value?.result?.text ?? value?.text ?? formatError(value) }
          } catch (error) {
            return { ok: false, text: '命令异常: ' + formatError(error) }
          }
        },
        [readSessionId, controlSessionId],
      )

      const parseJsonText = (text) => {
        try {
          const value = JSON.parse(String(text || '').trim())
          return value !== null && typeof value === 'object' ? value : null
        } catch {
          return null
        }
      }

      const readWorkspaceFile = React.useCallback(
        async (relPath) => {
          const sessionId = readSessionId
          if (remote?.workspaceFiles === undefined || sessionId === '') return { ok: false, error: 'workspaceFiles 不可用' }
          try {
            const stat = await remote.workspaceFiles.stat(sessionId, relPath)
            if (!stat.ok) {
              log('workspaceFiles.stat 失败 ' + relPath + '：' + formatError(stat.error))
              return { ok: false, error: 'stat 失败: ' + formatError(stat.error) }
            }
            // workspaceFiles.read 的 limit 上限是 5000 行，超长文件按块读。
            const chunk = 5000
            let offset = 1
            let text = ''
            let lines = 0
            for (let round = 0; round < 20; round += 1) {
              const read = await remote.workspaceFiles.read(sessionId, relPath, { offset, limit: chunk })
              if (!read.ok) {
                log('workspaceFiles.read 失败 ' + relPath + '：' + formatError(read.error))
                return { ok: false, error: 'read 失败: ' + formatError(read.error) }
              }
              const part = String(read.value.text || '')
              text += part
              const got = part === '' ? 0 : part.split('\n').length
              lines += got
              if (got < chunk) break
              offset += got
            }
            return { ok: true, text, lines, bytes: stat.value.bytes, path: relPath }
          } catch (error) {
            log('workspaceFiles 异常 ' + relPath + '：' + formatError(error))
            return { ok: false, error: formatError(error) }
          }
        },
        [readSessionId, remote, log],
      )

      const readArtifact = React.useCallback(
        async (relPath, prefixOverride) => {
          const prefix = typeof prefixOverride === 'string' ? prefixOverride : readPrefix
          const direct = await readWorkspaceFile(prefix + relPath)
          if (direct.ok) return { ...direct, path: relPath }
          const fallback = await execCommand('/gzh-read ' + relPath + ' --json')
          if (!fallback.ok) return { ok: false, error: fallback.text }
          const data = parseJsonText(fallback.text)
          if (data === null) return { ok: false, error: '宿主读取返回不是 JSON' }
          if (data.ok !== true) return { ok: false, error: String(data.code || data.error || '读取失败') }
          return { ok: true, text: String(data.text || ''), lines: data.lines, bytes: data.bytes, path: relPath }
        },
        [readPrefix, readWorkspaceFile, execCommand],
      )

      const loadTrace = React.useCallback(
        async (sessionId) => {
          if (sessionId === '' || remote?.session?.events === undefined) return
          try {
            const page = await remote.session.events({ address: { kind: 'session', sessionId }, maxMessages: 200 })
            if (!page.ok) {
              setTraceError('session.events 失败: ' + formatError(page.error))
              return
            }
            setEvents(eventsFromRecords(page.value?.records))
            setTraceError('')
          } catch (error) {
            setTraceError(formatError(error))
          }
        },
        [remote],
      )

      const pickControlSession = React.useCallback((rows, boundId, rootCwd) => {
        const pool = rows.filter((row) => (rootCwd !== '' ? sessionCwdOf(row) === rootCwd : true))
        const others = pool.filter((row) => sessionIdOf(row) !== boundId)
        const blankIdle = others.find((row) => row.blank === true && row.running !== true)
        const idle = others.find((row) => row.running !== true)
        const chosen = blankIdle ?? idle ?? others[0] ?? pool[0]
        return sessionIdOf(chosen) ?? ''
      }, [])

      const loadBinding = React.useCallback(
        async (sessionIdOverride) => {
          const result = await execCommand('/gzh-bind --json', sessionIdOverride)
          const data = parseJsonText(result.text)
          if (data === null) {
            setBindingError('/gzh-bind 未返回 JSON：' + clip(result.text, 200))
            return null
          }
          setBinding(data.binding ?? null)
          setBindingInfo(data)
          setBindingError(data.ok === true ? '' : String(data.code || data.error || '读取绑定失败'))
          return data
        },
        [execCommand],
      )

      const loadArtifacts = React.useCallback(
        async (sessionIdOverride) => {
          const result = await execCommand('/gzh-artifacts --json', sessionIdOverride)
          const data = parseJsonText(result.text)
          if (data === null || data.ok !== true) {
            setArtifactsError('/gzh-artifacts 失败：' + clip(result.text, 240))
            return { items: [], repo: '' }
          }
          const items = Array.isArray(data.items) ? data.items : []
          setArtifacts(items)
          setArtifactsError('')
          if (typeof data.repo === 'string') setRepoRoot(data.repo)
          return { items, repo: typeof data.repo === 'string' ? data.repo : '' }
        },
        [execCommand],
      )

      const loadState = React.useCallback(
        async (prefixOverride, sessionIdOverride) => {
          const prefix = typeof prefixOverride === 'string' ? prefixOverride : readPrefix
          const candidates = [prefix + 'state.md', 'state.md']
          for (const path of candidates) {
            const result = await readWorkspaceFile(path)
            if (result.ok) {
              setArticle(parseStateDoc(result.text))
              setStateError('')
              return result
            }
          }
          const fallback = await execCommand('/gzh-read state.md --json', sessionIdOverride)
          const data = parseJsonText(fallback.text)
          if (data !== null && data.ok === true) {
            setArticle(parseStateDoc(String(data.text || '')))
            setStateError('')
            return data
          }
          setStateError('读不到 state.md：' + clip(fallback.text || '无可用会话', 200))
          return null
        },
        [readPrefix, readWorkspaceFile, execCommand],
      )

      const loadDraft = React.useCallback(
        async (prefixOverride, sessionIdOverride) => {
          const prefix = typeof prefixOverride === 'string' ? prefixOverride : readPrefix
          const candidates = [prefix + 'generated/draft.md', 'generated/draft.md']
          for (const path of candidates) {
            const result = await readWorkspaceFile(path)
            if (result.ok) {
              const split = splitFrontmatter(result.text)
              setDraft({ path, meta: split.meta, body: split.body, offset: split.offset })
              setDraftError('')
              return result
            }
          }
          const fallback = await execCommand('/gzh-read generated/draft.md --json', sessionIdOverride)
          const data = parseJsonText(fallback.text)
          if (data !== null && data.ok === true) {
            const split = splitFrontmatter(String(data.text || ''))
            setDraft({ path: 'generated/draft.md', meta: split.meta, body: split.body, offset: split.offset })
            setDraftError('')
            return data
          }
          setDraft(null)
          setDraftError('读不到 generated/draft.md')
          return null
        },
        [readPrefix, readWorkspaceFile, execCommand],
      )

      const refresh = React.useCallback(async () => {
        const api = serviceCtx?.remote
        if (api === undefined) {
          log('remote 服务不可用')
          return
        }
        setBusy(true)
        try {
          let rows = []
          try {
            let listed = await api.session.list({})
            if (!listed.ok) listed = await api.session.list()
            if (listed.ok) rows = sessionRows(listed.value)
            else log('session.list 失败：' + formatError(listed.error))
          } catch (error) {
            log('session.list 异常：' + formatError(error))
          }
          setSessions(rows)
          const rootCwd = rows.map((row) => sessionCwdOf(row)).find((cwd) => /Andiii碎碎念[\\/]?$/.test(cwd)) ?? sessionCwdOf(rows[0]) ?? ''
          const preferred = rows.find((row) => sessionCwdOf(row) === rootCwd) ?? rows[0]
          const readId = sessionIdOf(preferred) ?? ''
          setReadSessionId(readId)
          log('会话列表：' + rows.length + ' 条，读取会话 ' + (readId === '' ? '无' : shortId(readId)))

          if (readId !== '') {
            const prefixGuess = /gzhflow[\\/]?$/.test(sessionCwdOf(preferred)) ? '' : 'gzhflow/'
            let boundFromSidecar = null
            for (const path of [prefixGuess + 'generated/.gzh-workbench/run.json', 'generated/.gzh-workbench/run.json']) {
              const direct = await readWorkspaceFile(path)
              if (!direct.ok) continue
              const parsed = parseJsonText(direct.text)
              if (parsed !== null && typeof parsed.sessionId === 'string') boundFromSidecar = parsed
              break
            }
            if (boundFromSidecar !== null) {
              setBinding(boundFromSidecar)
              log('绑定：' + shortId(boundFromSidecar.sessionId) + '（sidecar）')
            } else {
              setBinding(null)
            }
            const controlId = pickControlSession(rows, boundFromSidecar?.sessionId ?? '', rootCwd)
            setControlSessionId(controlId)
            log('指令通道会话：' + (controlId === '' ? '无' : shortId(controlId)))

            const loadedArtifacts = await loadArtifacts(controlId)
            log('产物：' + loadedArtifacts.items.length + ' 项')
            const prefix = (() => {
              const norm = (value) => String(value || '').replace(/\\/g, '/').replace(/\/+$/, '')
              const repo = norm(loadedArtifacts.repo)
              const c = norm(sessionCwdOf(preferred))
              if (repo !== '' && c !== '' && repo.startsWith(c + '/')) return repo.slice(c.length + 1) + '/'
              if (/gzhflow[\\/]?$/.test(c)) return ''
              return 'gzhflow/'
            })()
            setRepoRoot(loadedArtifacts.repo)
            setReadPrefix(prefix)
            await loadState(prefix, controlId)
            await loadDraft(prefix, controlId)
            const bindingData = await loadBinding(controlId)
            const boundId = (boundFromSidecar?.sessionId ?? '') || bindingData?.binding?.sessionId || ''
            await loadTrace(boundId !== '' ? boundId : readId)
          } else {
            setStateError('没有可用会话，无法读取工作区文件')
            log('没有可用会话')
          }
        } catch (error) {
          log('刷新异常：' + formatError(error))
        } finally {
          setBusy(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [loadArtifacts, loadState, loadDraft, loadBinding, loadTrace, log])

      React.useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      React.useEffect(() => {
        // 看历史会话时用 override，否则看绑定会话
        const target = traceSessionId !== '' ? traceSessionId : binding?.sessionId ?? readSessionId
        if (target !== undefined && target !== '') {
          loadTrace(target)
        } else {
          setEvents([])
        }
      }, [binding?.sessionId, traceSessionId, readSessionId, loadTrace])

      React.useEffect(() => {
        if (article !== null && stageNo === 0) setStageNo(article.defaultStage || 2)
      }, [article, stageNo])

      React.useEffect(() => {
        if (!followOn || traceSessionId !== '' || binding?.sessionId === undefined || binding.sessionId === '') {
          setFollowMode('off')
          return
        }
        if (remote?.session === undefined || typeof remote.session.follow !== 'function') {
          setFollowMode('poll')
          return
        }
        let closed = false
        const controller = new AbortController()
        setFollowMode('live')
        ;(async () => {
          try {
            for await (const frame of remote.session.follow({ address: { kind: 'session', sessionId: binding.sessionId }, assistantStream: true, maxMessages: 200 }, controller.signal)) {
              if (closed) return
              if (frame?.type === 'snapshot' && Array.isArray(frame.records)) {
                setEvents(eventsFromRecords(frame.records))
              } else if (frame?.type === 'event' && frame.event !== undefined) {
                setEvents((prev) => mergeEvent(prev, frame.event))
              }
            }
            if (!closed) setFollowMode('poll')
          } catch (error) {
            if (!closed) {
              setFollowMode('poll')
              log('follow 不可用，退化为 2s 轮询：' + formatError(error))
            }
          }
        })()
        return () => {
          closed = true
          try {
            controller.abort()
          } catch {}
        }
      }, [followOn, binding?.sessionId, traceSessionId, remote, log])

      React.useEffect(() => {
        if (!followOn || followMode !== 'poll' || binding?.sessionId === undefined || binding.sessionId === '') return
        const timer = setInterval(() => loadTrace(binding.sessionId), 2000)
        return () => clearInterval(timer)
      }, [followOn, followMode, binding?.sessionId, loadTrace])

      React.useEffect(() => {
        if (autoScrollRef.current && traceEndRef.current !== null) {
          traceEndRef.current.scrollTop = traceEndRef.current.scrollHeight
        }
      }, [events])

      function stageDef(stage) {
        return STAGES[Math.max(1, Math.min(7, stage || 1)) - 1]
      }

      const loadDoc = React.useCallback(
        async (path) => {
          const result = await readArtifact(path)
          setDocs((prev) => ({ ...prev, [path]: result }))
          return result
        },
        [readArtifact],
      )

      const loadStageDocs = React.useCallback(
        async (stage) => {
          const def = stageDef(stage)
          for (const id of def.artifactIds) {
            const item = artifacts.find((entry) => entry.id === id)
            if (item === undefined) continue
            const result = await readArtifact(item.path)
            setDocs((prev) => ({ ...prev, [item.path]: result }))
          }
        },
        [artifacts, readArtifact],
      )

      React.useEffect(() => {
        if (stageNo > 0) loadStageDocs(stageNo)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [stageNo, artifacts.map((item) => item.path + ':' + item.mtimeMs).join('|')])

      React.useEffect(() => {
        if (view !== 'libraries') return
        for (const lib of LIBRARIES) {
          if (docs[lib.path] === undefined) loadDoc(lib.path)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [view])

      // ---------------- 派生状态 ----------------
      const boundSession = binding !== null ? sessions.find((row) => sessionIdOf(row) === binding.sessionId) : undefined
      const boundSessionMissing = binding !== null && boundSession === undefined
      const articleMatches = bindingInfo?.match === true
      const bindingReady = binding !== null && articleMatches && !boundSessionMissing && readSessionId !== ''
      const bindingBlockReason = (() => {
        if (binding === null) return '还没有绑定会话'
        if (boundSessionMissing) return '绑定的会话不在会话列表里（可能已归档/删除）'
        if (!articleMatches) return 'state.md 当前篇与绑定时不一致'
        if (readSessionId === '') return '没有可用会话'
        return ''
      })()

      const traceRows = traceRowsFromEvents(events)
      const stats = traceStats(traceRows, events)
      const draftStatsValue = draft === null ? null : draftStats(draft.body)
      const gateViz = gateAggregate(gate)
      const currentStage = stageNo || article?.defaultStage || 2
      const doneCount = article === null ? 0 : article.doneStages.size
      const progress = Math.round((doneCount / 7) * 100)
      const target = article === null ? null : parseTargetDate(article.targetDate)
      const repoLabel = String(repoRoot || '').replace(/^\/Users\/[^/]+/, '~')

      const filters = [
        { id: 'all', label: '全部' },
        { id: 'tool', label: '工具' },
        { id: 'file', label: '文件' },
        { id: 'error', label: '失败' },
        { id: 'review', label: '审阅' },
        { id: 'decision', label: '决策' },
        { id: 'user', label: '用户' },
        { id: 'say', label: '发言' },
        { id: 'system', label: '系统' },
      ]
      const filterMatches = (row) => {
        if (traceFilter === 'all') return true
        if (traceFilter === 'tool') return row.kind === 'tool' || row.kind === 'result'
        if (traceFilter === 'file') return row.file === true
        if (traceFilter === 'error') return row.error === true
        if (traceFilter === 'review') return row.kind === 'review'
        if (traceFilter === 'decision') return row.decision === true
        if (traceFilter === 'user') return row.kind === 'user'
        if (traceFilter === 'say') return row.kind === 'say' || row.kind === 'decision'
        if (traceFilter === 'system') return row.kind === 'system' || row.kind === 'command' || row.kind === 'turn'
        return true
      }
      const FILTER_CASES = {
        tool: (row) => row.kind === 'tool' || row.kind === 'result',
        file: (row) => row.file === true,
        error: (row) => row.error === true,
        review: (row) => row.kind === 'review',
        decision: (row) => row.decision === true,
        user: (row) => row.kind === 'user',
        say: (row) => row.kind === 'say' || row.kind === 'decision',
        system: (row) => row.kind === 'system' || row.kind === 'command' || row.kind === 'turn',
      }
      const filterCount = (id) => (id === 'all' ? traceRows.length : traceRows.filter(FILTER_CASES[id] ?? (() => true)).length)
      const visibleRows = traceRows.filter(filterMatches)

      const workspaceRoot = String(repoRoot || '').replace(/[\\/]gzhflow[\\/]?$/, '')
      const candidates = sessions
        .filter((row) => {
          const cwd = sessionCwdOf(row)
          if (cwd.includes('/default-workspace')) return false
          if (row.origin === 'subagent' || row.parentSessionId !== undefined) return false
          if (row.projections?.values?.subagent !== undefined && row.projections?.values?.subagent !== null) return false
          if (workspaceRoot !== '' && cwd !== workspaceRoot && cwd !== repoRoot && !cwd.startsWith(workspaceRoot + '/')) return false
          if (sessionFilter.trim() !== '') {
            const haystack = (sessionTitleOf(row) + ' ' + String(sessionIdOf(row) ?? '') + ' ' + cwd).toLowerCase()
            if (!haystack.includes(sessionFilter.trim().toLowerCase())) return false
          }
          return true
        })
        .sort((a, b) => {
          const ar = a.running === true ? 1 : 0
          const br = b.running === true ? 1 : 0
          if (ar !== br) return br - ar
          return Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0)
        })

      const artifactById = (id) => artifacts.find((item) => item.id === id)

      // 键盘快捷键：g+数字切页、r 刷新、a 通过、b 退回、? 帮助
      const [showHelp, setShowHelp] = React.useState(false)
      React.useEffect(() => {
        const onKey = (event) => {
          const target = event.target
          const tag = target === null || target === undefined ? '' : String(target.tagName ?? '').toLowerCase()
          if (tag === 'input' || tag === 'textarea' || (target !== null && target !== undefined && target.isContentEditable === true)) return
          if (event.metaKey || event.ctrlKey || event.altKey) return
          const key = String(event.key ?? '').toLowerCase()
          if (key === 'g') {
            pendingG.current = true
            window.setTimeout(() => { pendingG.current = false }, 900)
            return
          }
          if (pendingG.current) {
            pendingG.current = false
            const index = Number(key)
            if (index >= 1 && index <= views.length) {
              setView(views[index - 1].id)
              event.preventDefault()
            }
            return
          }
          if (key === '?') {
            setShowHelp((value) => !value)
            event.preventDefault()
            return
          }
          if (key === 'r' && !event.shiftKey) {
            refresh()
            event.preventDefault()
            return
          }
          if (key === 'a' && bindingReady) {
            setPassConfirm(true)
            event.preventDefault()
            return
          }
          if (key === 'b' && bindingReady) {
            setReturnOpen(true)
            event.preventDefault()
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [bindingReady, refresh])


      // ---------------- 动作 ----------------
      async function runGate(targetName) {
        setGateBusy(true)
        setGate({ target: targetName, status: 'running' })
        const result = await execCommand('/gzh-gate ' + targetName + ' --json')
        const data = parseJsonText(result.text)
        if (data !== null) {
          setGate({ target: targetName, status: 'done', at: Date.now(), exit: data.exit, payload: data, data: data.data ?? null, raw: data.raw ?? null, human: result.text })
        } else {
          setGate({ target: targetName, status: 'done', at: Date.now(), exit: null, payload: null, data: null, raw: null, human: result.text })
        }
        setGateBusy(false)
        log('/gzh-gate ' + targetName + ' → ' + (data?.exit ?? '?') + '（' + (data?.data === undefined || data?.data === null ? '人类输出' : 'JSON') + '）')
      }

      async function runLayout() {
        if (readSessionId === '') return
        setLayoutBusy(true)
        setLayoutResult('生成中…')
        const theme = layoutTheme.trim() === '' ? 'zen' : layoutTheme.trim()
        const result = await execCommand('/gzh-layout ' + theme + ' --json')
        const data = parseJsonText(result.text)
        if (data !== null && data.ok === true) {
          setLayoutResult('已生成：' + String(data.output ?? '（脚本未报告路径）') + '\n' + String(data.text ?? ''))
          log('排版 HTML 已生成（' + theme + '）')
          await loadArtifacts(readSessionId)
          setDocs({})
        } else {
          setLayoutResult(data !== null ? '生成失败（exit ' + String(data.exit ?? '?') + '）：' + String(data.text ?? data.code ?? '') : result.text)
        }
        setLayoutBusy(false)
      }

      async function runPublishDry() {
        if (readSessionId === '') return
        setPublishBusy(true)
        setPublishResult({ status: 'running' })
        const result = await execCommand('/gzh-publish --dry-run --json')
        const data = parseJsonText(result.text)
        setPublishResult({ at: Date.now(), payload: data, text: result.text })
        log('发布 dry-run → ' + (data?.ok === true ? '通过' : '未通过'))
        setPublishBusy(false)
      }

      async function bindTo(row) {
        const id = sessionIdOf(row)
        if (id === undefined) return
        const controlId = pickControlSession(sessions, String(id), workspaceRoot)
        const result = await execCommand('/gzh-bind ' + String(id) + ' --json', controlId)
        const data = parseJsonText(result.text)
        if (data !== null && data.ok === true) {
          setBinding(data.binding ?? null)
          setBindingInfo(data)
          setBindingError('')
          setSwapPicker(false)
          setPassConfirm(false)
          setReturnOpen(false)
          setControlSessionId(controlId)
          log('已绑定会话 ' + String(id) + '（指令通道 ' + shortId(controlId) + '）')
          showToast('已绑定会话 ' + shortId(String(id)))
        } else {
          setBindingError(clip(data?.error ?? result.text, 240))
          log('绑定失败：' + clip(result.text, 240))
        }
      }

      async function cancelRun() {
        if (binding === null || remote?.session?.cancel === undefined) {
          log('取消不可用：未绑定会话或 session.cancel 缺失')
          return
        }
        try {
          const result = await remote.session.cancel({ sessionId: binding.sessionId })
          log(result.ok ? '已请求取消当前 turn' : '取消失败：' + formatError(result.error))
          showToast(result.ok ? '已请求取消当前 turn' : '取消失败')
        } catch (error) {
          log('取消异常：' + formatError(error))
        }
      }

      async function unbind() {
        const result = await execCommand('/gzh-bind clear --json')
        const data = parseJsonText(result.text)
        if (data !== null && data.ok === true) {
          setBinding(null)
          setBindingInfo(null)
          setBindingError('')
          setEvents([])
          setControlSessionId(pickControlSession(sessions, '', workspaceRoot))
          log('已解除绑定')
          showToast('已解除绑定')
        } else {
          setBindingError(clip(result.text, 240))
        }
      }

      async function sendPrompt(kind) {
        if (!bindingReady || binding === null) return
        const topic = article?.topic || ''
        const text =
          kind === 'pass'
            ? '【工作台审阅·通过】当前篇「' + topic + '」的全文已通过审阅。请按 SKILL.md 继续推进到下一阶段：先读 state.md 确认当前阶段与 run step，更新 state.md 的阶段字段，然后执行下一阶段工作；仍按 strict 模式，产出后把全文或结果输出给我确认。'
            : '【工作台审阅·退回】当前篇「' + topic + '」的全文退回。审阅意见：' + (returnNote.trim() === '' ? '请对照体检报告和 SKILL.md 的要求修改这一版。' : returnNote.trim()) + ' 请按意见修改 generated/draft.md，改完把全文输出给我看；不要推进 state.md 的阶段，改完停在当前阶段等确认。'
        if (typeof remote?.session?.prompt !== 'function') {
          setReceipt({ ok: false, at: Date.now(), error: 'remote.session.prompt 不可用', text })
          return
        }
        setPromptBusy(true)
        const requestId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2)
        try {
          const result = await remote.session.prompt({
            sessionId: binding.sessionId,
            requestId,
            mode: 'queue',
            content: [{ type: 'text', text }],
            clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          if (result.ok) {
            setReceipt({ ok: true, at: Date.now(), text, requestId })
            log('审阅指令已排队（' + requestId + '）')
            showToast('审阅指令已排队')
            setTimeout(() => loadTrace(binding.sessionId), 1200)
            setTimeout(() => {
              loadState()
              loadArtifacts()
              loadDraft()
            }, 4000)
          } else {
            setReceipt({ ok: false, at: Date.now(), error: formatError(result.error), text })
            log('审阅指令失败：' + formatError(result.error))
          }
        } catch (error) {
          setReceipt({ ok: false, at: Date.now(), error: formatError(error), text })
          log('审阅指令异常：' + formatError(error))
        } finally {
          setPromptBusy(false)
          setPassConfirm(false)
          setReturnOpen(false)
        }
      }

      async function copyText(text, note) {
        try {
          await navigator.clipboard.writeText(String(text || ''))
          log('已复制到剪贴板（' + String(text || '').length + ' 字符）')
          showToast(note ?? '已复制到剪贴板')
        } catch (error) {
          log('复制失败：' + formatError(error))
          showToast('复制失败')
        }
      }

      // 记一笔：追加到 assets/inbox.md 的「未处理」区
      async function saveNote() {

        const text = noteDraft.trim()
        if (text === '') return
        const payload = text.replace(/^记一笔[：:]\s*/, '')
        if (payload === '') return
        setNoteBusy(true)
        setNoteError('')
        const result = await execCommand('/gzh-note ' + payload + (noteSource.trim() === '' ? '' : ' --source ' + noteSource.trim()))
        const data = parseJsonText(result.text)
        if (data !== null && data.ok === true) {
          setNoteDraft('')
          log('已写入 inbox：' + payload)
          showToast('已写进 inbox')
          await loadDoc('assets/inbox.md')
        } else {
          const raw = clip(data?.error ?? result.text, 240)
          // 宿主命令是启动时注册的：插件刚更新时需要重启 DSH 才认新命令
          const needsRestart = /gzh-note|unknown|not found|找不到|命令失败/i.test(String(raw))
          setNoteError(needsRestart ? raw + '　（如果提示命令不存在，重启一次 DSH 让宿主命令生效）' : raw)
          log('写入 inbox 失败：' + clip(result.text, 240))
        }
        setNoteBusy(false)
      }


      // 把一条中文指令排进绑定会话
      async function queuePrompt(text, label) {
        if (!bindingReady || binding === null) return { ok: false, error: '写操作未就绪：先绑定会话' }
        if (typeof remote?.session?.prompt !== 'function') return { ok: false, error: 'remote.session.prompt 不可用' }
        const requestId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : String(Date.now()) + '-' + Math.random().toString(16).slice(2)
        try {
          const result = await remote.session.prompt({
            sessionId: binding.sessionId,
            requestId,
            mode: 'queue',
            content: [{ type: 'text', text }],
            clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          if (result.ok) {
            log((label ?? '指令') + '已排队（' + requestId + '）')
            showToast((label ?? '指令') + '已排队')
            setTimeout(() => loadTrace(binding.sessionId), 1200)
            setTimeout(() => {
              loadState()
              loadArtifacts()
              loadDraft()
            }, 4000)
            return { ok: true }
          }
          return { ok: false, error: formatError(result.error) }
        } catch (error) {
          return { ok: false, error: formatError(error) }
        }
      }

      // 断点续跑：让 Agent 按 state.md 的 run step 继续
      async function resumeRun() {
        if (article === null) return
        const step = article.runStep || ('阶段 ' + CIRCLED[currentStage - 1])
        const text =
          '【工作台·继续】按 state.md 的 run step（' + step + '）继续推进这一篇：先读 state.md 确认当前阶段与 run step，再按 SKILL.md 的流程做这一步；产出后把结果给我审阅，不要越过 ①②③ 阶段的停靠点。'
        setPromptBusy(true)
        const result = await queuePrompt(text, '续跑指令')
        if (!result.ok) setReceipt({ ok: false, at: Date.now(), error: result.error, text })
        setPromptBusy(false)
      }

      // 新写一篇：开一个专用会话并把启动指令发过去（state.md 由 Agent 自己改）
      async function startNewArticle() {
        const topic = newTopic.trim()
        if (topic === '') return
        setNewBusy(true)
        setNewError('')
        try {
          if (typeof remote?.session?.create !== 'function') {
            setNewError('这个 DSH 版本没有 session/create，无法从工作台开新会话。')
            setNewBusy(false)
            return
          }
          const cwd = repoRoot !== '' ? repoRoot : workspaceRoot
          const created = await remote.session.create({ cwd })
          if (!created.ok) {
            setNewError('创建会话失败：' + formatError(created.error))
            setNewBusy(false)
            return
          }
          const sessionId = created.value?.sessionId
          if (typeof sessionId !== 'string' || sessionId === '') {
            setNewError('创建会话没有返回 sessionId。')
            setNewBusy(false)
            return
          }
          if (typeof remote.session.rename === 'function') {
            try {
              await remote.session.rename({ sessionId, title: topic })
            } catch {}
          }
          const requestId =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : String(Date.now())
          const prompt =
            '【工作台·新写一篇】主题：' +
            topic +
            '\n\n按 gzhflow 的 SKILL.md 七阶段流程开一篇新文章：\n' +
            '1. 先读 state.md：把「当前篇」切到这个主题（主题 / 开写日期 / 模式 strict / run step ①素材 / 已完成 清空），其他区不要动。\n' +
            '2. 阶段①先读 assets/inbox.md 命中素材，命中就直接用，没命中再问我。\n' +
            '3. 素材先行：写正文之前先把锚点清单给我看，不要直接开写。\n' +
            '4. ①②③ 阶段完成后必须输出全文给我审阅，不要自动往下推。\n' +
            '5. 不要编造我没给的经历、场景和细节。\n' +
            '6. 发布只推草稿箱，永不自动发布。'
          const sent = await remote.session.prompt({
            sessionId,
            requestId,
            mode: 'queue',
            content: [{ type: 'text', text: prompt }],
            clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })
          if (!sent.ok) {
            setNewError('会话已建好，但启动指令发送失败：' + formatError(sent.error))
            setNewBusy(false)
            return
          }
          log('新会话已启动：' + shortId(sessionId) + '（' + topic + '）')
          showToast('新会话已启动，去侧栏看')
          setNewTopic('')
          setNewOpen(false)
          await refresh()
        } catch (error) {
          setNewError(formatError(error))
        }
        setNewBusy(false)
      }

      // 显式推送：两次点击确认后才真推草稿箱
      async function runPublishPush() {
        setPushBusy(true)
        const result = await execCommand('/gzh-publish --confirm --json')
        const data = parseJsonText(result.text)
        setPushResult({ at: Date.now(), payload: data, text: result.text })
        log('推送草稿箱 → ' + (data?.ok === true ? '成功' : '失败：' + String(data?.code ?? '')))
        showToast(data?.ok === true ? '已推送到草稿箱' : '推送未成功：' + String(data?.code ?? '未知'))
        setPushBusy(false)
        setPushConfirm(false)
      }

      // ---------------- 文档渲染 ----------------
      function artifactMeta(item) {
        return h('div', { className: 'gzw-dim' }, item.path + '　' + humanBytes(item.bytes) + '　' + formatWhen(item.mtimeMs) + (item.label ? '　·　' + item.label : ''))
      }

      function renderDoc(item, mode) {
        const doc = docs[item.path]
        if (doc === undefined) return h('div', { className: 'gzw-empty' }, h('div', { className: 'gzw-empty-text' }, '读取中…'))
        if (doc.ok !== true) return h('div', { className: 'gzw-error' }, '读取失败：' + String(doc.error || ''))
        if (mode === 'html') {
          return h(
            'div',
            { className: 'gzw-phone' },
            h('div', { className: 'gzw-phone-top' }, h('div', { className: 'gzw-phone-notch' })),
            h('div', { className: 'gzw-phone-screen' }, h('iframe', { srcDoc: doc.text, sandbox: '', title: item.path })),
            h('div', { className: 'gzw-phone-label' }, '只读预览 · 不执行脚本'),
          )
        }
        if (mode === 'json') {
          let pretty = doc.text
          try {
            pretty = JSON.stringify(JSON.parse(doc.text), null, 2)
          } catch {}
          return h('pre', { className: 'gzw-log', style: { maxHeight: '420px', overflow: 'auto' } }, pretty)
        }
        return h('div', { className: 'gzw-paper' }, h(MarkdownView, { text: doc.text }))
      }

      function renderArtifactEntry(item) {
        return h(
          'div',
          { className: 'gzw-art', key: item.id },
          h('div', { className: 'gzw-art-ico ' + (item.kind || 'file') }, h(Icon, { name: KIND_ICON[item.kind] ?? 'file', size: 14 })),
          h(
            'div',
            { className: 'gzw-art-main' },
            h('div', { className: 'gzw-art-name' }, h('span', { className: 'nm' }, ARTIFACT_LABELS[item.id] ?? item.id), h('span', { className: 'gzw-stage-pill' }, item.stage)),
            h('div', { className: 'gzw-art-sub' }, item.path + '　' + humanBytes(item.bytes) + '　' + relTime(item.mtimeMs)),
          ),
          h(
            'div',
            { className: 'gzw-art-tail' },
            h(Btn, { size: 'sm', variant: 'ghost', icon: 'arrow', onClick: () => jumpToStage(item.stage) }, '查看'),
          ),
        )
      }

      function renderArtifactBlock(id, mode) {
        const item = artifactById(id)
        if (item === undefined) return h(Empty, { icon: 'file', title: '（还没有『' + (ARTIFACT_LABELS[id] ?? id) + '』产物）', text: '这一阶段的产物还没生成。' })
        return h('div', { key: id }, artifactMeta(item), renderDoc(item, mode))
      }

      function jumpToStage(stage) {
        const no = stageIndexFrom(String(stage)) ?? 1
        setStageNo(no)
        setView('stage')
        window.setTimeout(() => {
          const root = document.querySelector('.gzw-root')
          if (root !== null) root.scrollTo({ top: 0, behavior: 'smooth' })
        }, 30)
      }

      // 从体检明细跳到正文某一行
      function jumpToLine(line) {
        if (typeof line !== 'number' || line <= 0) return
        setHighlightLine(line)
        setStageNo(draft !== null ? 2 : currentStage)
        setView('stage')
        window.setTimeout(() => {
          const node = document.querySelector('.gzw-root [data-line="' + line + '"]')
          if (node !== null) node.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }, 120)
      }

      // ---------------- 审阅 ----------------
      function renderReview() {
        const targetName = binding === null ? '' : sessionTitleOf(boundSession)
        if (!bindingReady) {
          return h(
            'div',
            { className: 'gzw-review locked' },
            h(
              'div',
              { className: 'gzw-review-main' },
              h('div', { className: 'gzw-review-title' }, h(Icon, { name: 'alert', size: 15 }), '写操作已锁定'),
              h('div', { className: 'gzw-review-sub' }, bindingBlockReason + '。到「绑定」页把这篇文章绑到一个专用会话，通过 / 退回按钮才会启用。'),
            ),
            h('div', { className: 'gzw-review-actions' }, h(Btn, { variant: 'ghost', icon: 'link', onClick: () => setView('binding') }, '去绑定')),
          )
        }
        if (passConfirm) {
          return h(
            'div',
            { className: 'gzw-review' },
            h(
              'div',
              { className: 'gzw-review-main' },
              h('div', { className: 'gzw-review-title' }, h(Icon, { name: 'check', size: 15 }), '确认通过这一版？'),
              h('div', { className: 'gzw-review-sub' }, '指令发给「' + targetName + '」（' + shortId(binding.sessionId) + '）。Agent 收到后会更新 state.md 并进入下一阶段。'),
            ),
            h(
              'div',
              { className: 'gzw-review-actions' },
              h(Btn, { variant: 'ghost', onClick: () => setPassConfirm(false), disabled: promptBusy }, '取消'),
              h(Btn, { variant: 'brand', icon: 'send', onClick: () => sendPrompt('pass'), disabled: promptBusy }, promptBusy ? '发送中…' : '确认通过并发送'),
            ),
          )
        }
        if (returnOpen) {
          return h(
            'div',
            { className: 'gzw-review' },
            h(
              'div',
              { className: 'gzw-review-main' },
              h('div', { className: 'gzw-review-title' }, h(Icon, { name: 'x', size: 15 }), '退回改稿'),
              h('div', { style: { marginTop: '8px' } }, h('textarea', { className: 'gzw-textarea', value: returnNote, placeholder: '附一句意见（可留空）：例如第二段太像总结，改成具体场景；结尾不要劝人。', onChange: (event) => setReturnNote(event.target.value) })),
            ),
            h(
              'div',
              { className: 'gzw-review-actions' },
              h(Btn, { variant: 'ghost', onClick: () => setReturnOpen(false), disabled: promptBusy }, '取消'),
              h(Btn, { variant: 'brand', icon: 'send', onClick: () => sendPrompt('return'), disabled: promptBusy }, promptBusy ? '发送中…' : '确认退回并发送'),
            ),
          )
        }
        return h(
          'div',
          { className: 'gzw-review' },
          h(
            'div',
            { className: 'gzw-review-main' },
            h('div', { className: 'gzw-review-title' }, h(Icon, { name: 'shield', size: 15 }), '待你审阅这一版'),
            h('div', { className: 'gzw-review-sub' }, draft === null ? '还没读到 generated/draft.md' : (draft.meta.title || '（无标题）') + '　·　目标会话「' + targetName + '」'),
          ),
          h(
            'div',
            { className: 'gzw-review-actions' },
            h(Btn, { variant: 'ghost', icon: 'x', onClick: () => setReturnOpen(true), disabled: promptBusy }, '退回改稿'),
            h(Btn, { variant: 'brand', icon: 'check', onClick: () => setPassConfirm(true), disabled: promptBusy }, '通过，进下一阶段'),
          ),
        )
      }

      function renderReceipt() {
        if (receipt === null) return null
        return h(
          'div',
          { className: 'gzw-receipt ' + (receipt.ok ? 'ok' : 'bad') },
          h('div', { className: receipt.ok ? 'gzw-ok' : 'gzw-error' }, receipt.ok ? '审阅指令已排队（' + formatWhen(receipt.at) + '）' : '发送失败（' + formatWhen(receipt.at) + '）：' + String(receipt.error || '')),
          h('details', { className: 'gzw-details' }, h('summary', {}, '查看发送的原文'), h('pre', { className: 'gzw-log', style: { marginTop: '6px' } }, String(receipt.text || ''))),
        )
      }

      // ---------------- 首次使用引导 ----------------
      function renderSetupGuide() {
        const steps = [
          {
            title: '1. 复制配置模板',
            body: '把 config/*.example.yaml 复制成 config/*.yaml，填你自己的文风、主题与发布凭证。',
            cmd: 'cp config/*.example.yaml config/',
          },
          {
            title: '2. 跑一次自检',
            body: '确认工具链、配置与密钥占位符没问题（仓库脚本，不联网）。',
            cmd: 'python scripts/validate_repo.py',
          },
          {
            title: '3. 绑定一个会话',
            body: '在「绑定」页把这一篇绑到专属会话，通过 / 退回才会生效。',
            cmd: null,
          },
        ]
        return h(
          Card,
          { title: '先把工作台接上', icon: 'alert', sub: repoRoot === '' ? '还没找到 gzhflow 仓库' : stateError || '当前篇还没读到' },
          h(
            'div',
            { className: 'gzw-stack' },
            ...steps.map((step) =>
              h(
                'div',
                { className: 'gzw-lib-item', key: step.title },
                h('span', { className: 'gzw-lib-bullet' }),
                h(
                  'div',
                  { className: 'gzw-lib-body' },
                  h('div', { className: 'gzw-lib-text' }, h('b', {}, step.title), '　' + step.body),
                  step.cmd === null
                    ? null
                    : h(
                        'div',
                        { className: 'gzw-row tight', style: { marginTop: '6px' } },
                        h('code', { className: 'gzw-mono', style: { padding: '2px 7px', borderRadius: '5px', background: 'var(--gzw-surface-2)' } }, step.cmd),
                        h(Btn, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => copyText(step.cmd, '命令已复制') }, '复制'),
                      ),
                ),
              ),
            ),
          ),
        )
      }

      function renderOnboarding() {
        if (onboarded) return null
        return h(
          Card,
          { title: '第一次用？三十秒看懂这个面板', icon: 'book', sub: '看完就收起', actions: [h(Btn, { size: 'sm', variant: 'ghost', icon: 'check', onClick: dismissOnboarding }, '知道了')] },
          h(
            'div',
            { className: 'gzw-help-grid' },
            ...[
              ['总览', '当前篇、七阶段进度、下一步动作、四个真指标'],
              ['阶段', '这一阶段做什么、有什么产物、可跑的动作'],
              ['轨迹', 'Agent 干了什么：命令、工具、审阅往返与失败'],
              ['产物', '七阶段产物清单、产出时间线与预览'],
              ['库', 'inbox / voice / lessons / 手改记录，只读 + 记一笔'],
              ['绑定', '把这篇绑到专属会话，通过 / 退回才会生效'],
            ].map((row) =>
              h('div', { className: 'gzw-help-row', key: row[0] }, h('span', { className: 'gzw-kbd' }, row[0]), h('span', {}, row[1])),
            ),
          ),
        )
      }

      // ---------------- 动作条：断点续跑 / 新写一篇 ----------------
      function renderActionBar() {
        const runStep = article?.runStep ?? ''
        const doneList = article === null ? '' : Array.from(article.doneStages).sort((a, b) => a - b).map((no) => CIRCLED[no - 1]).join(' ')
        const resumeReady = bindingReady && article !== null
        return h(
          'div',
          { className: 'gzw-actionbar' },
          h(
            'div',
            { className: 'gzw-actionbar-main' },
            h('div', { className: 'gzw-eyebrow' }, '断点续跑'),
            h(
              'div',
              { className: 'gzw-actionbar-title' },
              runStep === '' ? '还没读到 run step' : '当前停在 ' + runStep,
            ),
            h(
              'div',
              { className: 'gzw-actionbar-sub' },
              doneList === '' ? 'state.md 里没有「已完成」清单' : '已完成 ' + doneList + '　·　' + (article?.mode ? '模式 ' + article.mode : ''),
            ),
          ),
          h(
            'div',
            { className: 'gzw-actionbar-actions' },
            h(Btn, { icon: 'play', variant: 'brand', onClick: () => resumeRun(), disabled: !resumeReady || promptBusy }, promptBusy ? '发送中…' : '让 Agent 继续这一步'),
            h(Btn, { icon: 'plus', variant: 'ghost', onClick: () => setNewOpen((value) => !value) }, newOpen ? '收起' : '新写一篇'),
          ),
          newOpen ? renderNewArticle() : null,
        )
      }

      function renderNewArticle() {
        return h(
          'div',
          { className: 'gzw-new' },
          h(
            'div',
            { className: 'gzw-new-main' },
            h('div', { className: 'gzw-eyebrow', style: { marginBottom: '6px' } }, '新写一篇'),
            h('div', { className: 'gzw-dim', style: { marginBottom: '8px', lineHeight: 1.7 } }, '工作台只负责开一个专用会话并把启动指令发过去；state.md 由 Agent 自己改，工作台不碰。'),
            h('input', { className: 'gzw-input', value: newTopic, placeholder: '主题：例如「AI 搜索这一年」', onChange: (event) => setNewTopic(event.target.value) }),
          ),
          h(
            'div',
            { className: 'gzw-new-side' },
            h(Btn, { variant: 'brand', wide: true, icon: 'send', onClick: () => startNewArticle(), disabled: newBusy || newTopic.trim() === '' }, newBusy ? '创建中…' : '创建会话并启动'),
            newError === '' ? null : h('div', { className: 'gzw-error', style: { marginTop: '8px' } }, newError),
          ),
        )
      }

      // ---------------- 当前篇 ----------------
      function renderHero() {
        const stage = currentStage
        const meta = STAGE_META[stage - 1]
        const d = draftStatsValue
        const nextMeta = STAGE_META[Math.min(6, stage)] ?? null
        const chips = []
        if (article !== null) {
          if (article.mode) chips.push(h('span', { className: 'gzw-chip' }, '模式 ', h('b', {}, article.mode)))
          if (article.status) chips.push(h('span', { className: 'gzw-chip' + (article.status === 'run' ? ' warn' : '') }, '状态 ', h('b', {}, article.status)))
          if (article.startDate) chips.push(h('span', { className: 'gzw-chip' }, h(Icon, { name: 'clock', size: 12 }), '开写 ', h('b', {}, article.startDate)))
          if (target !== null) {
            chips.push(
              h(
                'span',
                { className: 'gzw-chip' + (target.days >= 0 && target.days <= 2 ? ' danger' : '') },
                h(Icon, { name: 'clock', size: 12 }),
                '目标 ',
                h('b', {}, target.label),
                target.days >= 0 ? '　剩 ' + target.days + ' 天' : '　已超 ' + Math.abs(target.days) + ' 天',
              ),
            )
          }
        }
        chips.push(
          h(
            'span',
            { className: 'gzw-chip ' + (bindingReady ? 'accent' : 'warn') },
            h(Icon, { name: bindingReady ? 'link' : 'alert', size: 12 }),
            bindingReady ? '会话已绑定 ' + shortId(binding.sessionId) : '未绑定会话',
          ),
        )

        return h(
          'div',
          { className: 'gzw-hero' },
          h(
            'div',
            { className: 'gzw-hero-main' },
            h(
              'div',
              { style: { minWidth: 0 } },
              h(
                'div',
                { className: 'gzw-hero-eyebrow' },
                h('span', { className: 'gzw-hero-dot' }),
                h('span', { className: 'gzw-hero-stage' }, '当前篇 · 阶段 ' + CIRCLED[stage - 1] + ' ' + meta.name),
              ),
              h('h1', { className: 'gzw-topic' }, article === null ? 'state.md 未读到当前篇' : article.topic || '（state.md 未写主题）'),
              article === null
                ? h('div', { className: 'gzw-topic-sub' }, stateError || '检查 gzhflow 仓库路径与绑定会话的工作目录。')
                : h('div', { className: 'gzw-topic-sub' }, meta.desc),
              h('div', { className: 'gzw-chips' }, ...chips),
              h(
                'div',
                { className: 'gzw-hero-facts' },
                h(Fact, { k: '正文', v: d === null ? '—' : num(d.chars) + ' 字' }),
                h(Fact, { k: '段落', v: d === null ? '—' : String(d.paragraphs) }),
                h(Fact, { k: '阅读', v: d === null ? '—' : d.readMinutes + ' 分钟' }),
                h(Fact, { k: '轨迹', v: stats.total + ' 步' }),
              ),
            ),
            h(
              'div',
              { className: 'gzw-hero-side' },
              h(
                Ring,
                { value: doneCount, max: 7, size: 88, stroke: 7 },
                h(
                  'div',
                  { className: 'gzw-ring-center' },
                  h('div', { className: 'gzw-ring-value' }, doneCount, h('span', {}, '/7')),
                  h('div', { className: 'gzw-ring-label' }, '阶段完成'),
                ),
              ),
              h('div', { className: 'gzw-next' }, nextMeta === null ? '最后一阶段' : '下一阶段', h('br'), h('b', {}, nextMeta === null ? meta.name : CIRCLED[nextMeta.no - 1] + ' ' + nextMeta.name)),
            ),
          ),
          renderStageFlow(),
        )
      }

      // ---------------- 阶段流水线 ----------------
      function renderStageFlow() {
        const steps = STAGE_META.map((item, index) => {
          const done = article !== null && article.doneStages.has(item.no)
          const active = currentStage === item.no
          const produced = STAGES[item.no - 1].artifactIds.map((id) => artifactById(id)).filter(Boolean).length
          return h(
            'button',
            {
              key: 's-' + item.no,
              type: 'button',
              className: 'gzw-flow-step' + (done ? ' done' : '') + (active ? ' active' : ''),
              onClick: () => jumpToStage(item.no),
              title: '阶段 ' + CIRCLED[index] + ' ' + item.name + '：' + item.desc,
            },
            index < STAGE_META.length - 1 ? h('span', { className: 'gzw-flow-link' + (done ? ' done' : '') }) : null,
            h('span', { className: 'gzw-flow-node' }, done && !active ? h(Icon, { name: 'check', size: 13 }) : item.no),
            h('span', { className: 'gzw-flow-name' }, item.name),
            h(
              'span',
              { className: 'gzw-flow-dots' },
              ...STAGES[item.no - 1].artifactIds.map((id, dotIndex) =>
                h('i', { key: 'd-' + item.no + '-' + dotIndex, className: dotIndex < produced ? 'on' : '' }),
              ),
            ),
          )
        })
        return h(
          'div',
          { className: 'gzw-flow' },
          h(
            'div',
            { className: 'gzw-flow-head' },
            h('span', { className: 'gzw-eyebrow' }, '七阶段进度'),
            h('span', { className: 'gzw-dim' }, doneCount + ' / 7 已完成　·　' + artifacts.length + ' 项产物　·　点任一阶段切换'),
          ),
          h('div', { className: 'gzw-flow-track' }, ...steps),
          h('div', { className: 'gzw-flow-bar' }, h('span', { style: { width: Math.round((doneCount / 7) * 100) + '%' } })),
        )
      }

      // ---------------- 关键指标 ----------------
      function renderKpis() {
        const d = draftStatsValue
        const gateInfo = gateViz
        const lastArtifact = artifacts.length > 0 ? artifacts[artifacts.length - 1] : null
        const card = (icon, tone, label, value, unit, sub, viz, onJump) =>
          h(
            'div',
            { className: 'gzw-kpi', onClick: onJump, style: onJump === undefined ? undefined : { cursor: 'pointer' } },
            onJump === undefined ? null : h('span', { className: 'gzw-kpi-action' }, '查看 →'),
            h('div', { className: 'gzw-kpi-head' }, h('span', { className: 'gzw-kpi-icon ' + (tone ?? '') }, h(Icon, { name: icon, size: 13 })), h('span', {}, label)),
            h('div', { className: 'gzw-kpi-value' }, value, unit === undefined ? null : h('span', { className: 'unit' }, unit)),
            h('div', { className: 'gzw-kpi-sub' }, sub),
            h('div', { className: 'gzw-kpi-viz' }, viz),
          )
        return h(
          'div',
          { className: 'gzw-kpis' },
          card(
            'pen',
            '',
            '正文体量',
            d === null ? '—' : num(d.chars),
            '字',
            d === null ? '还没读到草稿' : d.paragraphs + ' 段 · ' + d.readMinutes + ' 分钟读完',
            d === null ? h('div', { className: 'gzw-dim' }, '等 Agent 写完这一版') : h(RhythmStrip, { values: d.rhythm }),
            () => jumpToStage(2),
          ),
          card(
            'spark',
            'decision',
            'AI 味体检',
            gateInfo === null ? '未跑' : gateInfo.running ? '…' : gateInfo.failed ? '失败' : String(gateInfo.score ?? '—'),
            gateInfo === null ? null : gateInfo.running || gateInfo.failed ? null : '/100',
            gateInfo === null
              ? '还没跑体检'
              : gateInfo.failed
                ? String(gateInfo.reason || '未能运行')
                : gateInfo.running
                  ? '正在跑 ai_flavor_score.py'
                  : 'FAIL ' + (gateInfo.fails?.length ?? 0) + ' · WARN ' + (gateInfo.warns?.length ?? 0),
            gateInfo === null || gateInfo.groups === undefined || gateInfo.groups.length === 0
              ? h('div', { className: 'gzw-dim' }, gateInfo === null ? '点卡片跑体检' : '没有命中项')
              : h(RuleBars, { rows: gateInfo.groups.slice(0, 3) }),
            () => setView('stage'),
          ),
          card(
            'layers',
            'warn',
            '已产出',
            artifacts.length,
            '项产物',
            lastArtifact === null ? 'generated/ 还是空的' : '最近：' + (ARTIFACT_LABELS[lastArtifact.id] ?? lastArtifact.id) + '　' + relTime(lastArtifact.mtimeMs),
            h(
              'div',
              { style: { display: 'flex', gap: '3px', width: '100%' }, 'aria-label': '各阶段产物覆盖' },
              ...STAGE_META.map((item) => {
                const has = STAGES[item.no - 1].artifactIds.some((id) => artifactById(id) !== undefined)
                return h('span', {
                  key: 'a' + item.no,
                  title: item.name + (has ? '：已有产物' : '：还没有产物'),
                  style: {
                    flex: '1 1 0',
                    height: '5px',
                    borderRadius: '3px',
                    background: has ? 'var(--gzw-accent)' : 'var(--gzw-line-soft)',
                    opacity: has ? 0.85 : 1,
                  },
                })
              }),
            ),
            () => setView('artifacts'),
          ),
          card(
            'grid',
            'info',
            'Agent 轨迹',
            stats.total,
            '步',
            stats.total === 0 ? '还没绑会话，轨迹不可用' : stats.turns + ' 轮 · ' + stats.tools + ' 次工具 · ' + stats.errors + ' 次失败',
            stats.total === 0
              ? h('div', { className: 'gzw-dim' }, '去绑定页选一个会话')
              : h(Sparkline, { values: stats.series.values, height: 26 }),
            () => setView('trace'),
          ),
        )
      }

      // ---------------- 体检可视化 ----------------
      function renderGateViz() {
        if (gate === null) {
          const d = draftStatsValue
          return h(
            'div',
            { className: 'gzw-grid even', style: { gap: 'var(--gzw-s4)', alignItems: 'start' } },
            h(
              'div',
              {},
              h('div', { className: 'gzw-eyebrow' }, '还没跑体检 · 这一版能先看的'),
              d === null
                ? h('div', { className: 'gzw-dim', style: { marginTop: '8px' } }, '读不到草稿，没有可算的指标。')
                : h(
                    'div',
                    { className: 'gzw-metrics', style: { marginTop: '10px' } },
                    h(Metric, { k: '句子数', v: num(d.sentences), hint: '平均 ' + d.avgSentence + ' 字/句' }),
                    h(Metric, { k: '长段峰值', v: d.longest, suffix: '字', hint: '超过 200 字考虑拆开' }),
                    h(Metric, { k: '阅读时长', v: d.readMinutes, suffix: '分钟', hint: d.chars + ' 字 · ' + d.paragraphs + ' 段' }),
                  ),
              h('div', { className: 'gzw-dim', style: { marginTop: '10px', lineHeight: 1.7 } }, 'ai_flavor_score.py 会把「像机写的」句子挑出来当提示；FAIL 要改，WARN 只供人工判断。'),
            ),
            h(
              'div',
              { style: { border: '1px solid var(--gzw-line-soft)', borderRadius: 'var(--gzw-r3)', padding: 'var(--gzw-s4)', background: 'var(--gzw-surface-sunken)' } },
              h('div', { className: 'gzw-empty-art', style: { width: '44px', height: '44px', borderRadius: 'var(--gzw-r3)', margin: '0 auto' } }, h(Icon, { name: 'spark', size: 20, stroke: 1.1 })),
              h('div', { className: 'gzw-dim', style: { textAlign: 'center', margin: '10px 0 12px', lineHeight: 1.6 } }, '本地脚本，不联网'),
              h(Btn, { variant: 'brand', wide: true, icon: 'spark', onClick: () => runGate('draft'), disabled: gateBusy || readSessionId === '' }, gateBusy ? '体检中…' : '跑 AI 味体检'),
            ),
          )
        }
        const info = gateViz
        if (info.running) return h('div', { className: 'gzw-row' }, h('span', { className: 'gzw-status busy' }, h('span', { className: 'gzw-status-dot' }), '正在跑 ai_flavor_score.py…'))
        if (info.failed) return h('div', { className: 'gzw-note danger' }, '未能运行：' + String(info.reason || ''))
        if (info.raw !== undefined) return h('pre', { className: 'gzw-log', style: { maxHeight: '240px', overflow: 'auto' } }, info.raw)

        if (info.target === 'html') {
          const errors = info.errors ?? []
          const warns = info.warns ?? []
          return h(
            'div',
            {},
            h(
              'div',
              { className: 'gzw-row', style: { gap: 'var(--gzw-s2)' } },
              h('span', { className: 'gzw-chip ' + (errors.length > 0 ? 'danger' : 'accent') }, h('b', {}, errors.length), ' ERROR'),
              h('span', { className: 'gzw-chip warn' }, h('b', {}, warns.length), ' WARN'),
              h('span', { className: 'gzw-chip' }, 'span leaf ', h('b', {}, String(info.spanLeafCount ?? '?'))),
            ),
            errors.length + warns.length === 0
              ? h('div', { className: 'gzw-ok', style: { marginTop: '10px' } }, '没有发现结构问题，可以粘贴到公众号。')
              : h(
                  'div',
                  { className: 'gzw-issues' },
                  ...errors.concat(warns).map((entry, index) =>
                    h(
                      'div',
                      { className: 'gzw-issue' + (errors.includes(entry) ? ' fail' : ''), key: 'g' + index },
                      h('span', { className: 'ln' }, 'L' + String(entry?.line ?? '?')),
                      h('span', {}, h('span', { className: 'rule' }, String(entry?.rule ?? '')), h('span', { className: 'tx' }, clip(String(entry?.message ?? entry?.text ?? ''), 180))),
                    ),
                  ),
                ),
          )
        }

        const fails = info.fails ?? []
        const warns = info.warns ?? []
        const groups = info.groups ?? []
        const d = draftStatsValue
        const dashBase = info.stats === null || info.stats === undefined ? null : Number(info.stats.dashesPerK ?? 0)
        const issueRows = groups.flatMap((group) =>
          group.entries.map((entry) => ({
            line: entry?.line ?? 0,
            rule: group.rule,
            text: clip(String(entry?.text ?? entry?.message ?? ''), 160),
            fail: entry.fail === true,
          })),
        )
        return h(
          'div',
          {},
          h(
            'div',
            { className: 'gzw-gate' },
            h(ScoreGauge, {
              score: info.score,
              size: 132,
              cap: fails.length === 0 ? 'FAIL 清零' : fails.length + ' 项 FAIL',
              tone: fails.length > 0 ? 'danger' : warns.length > 0 ? 'warn' : 'accent',
            }),
            h(
              'div',
              { className: 'gzw-gate-side' },
              h(
                'div',
                { className: 'gzw-row tight' },
                h('span', { className: 'gzw-chip ' + (fails.length > 0 ? 'danger' : 'accent') }, h('b', {}, fails.length), ' FAIL'),
                h('span', { className: 'gzw-chip warn' }, h('b', {}, warns.length), ' WARN'),
                h('span', { className: 'gzw-chip' }, '共 ', h('b', {}, info.hits), ' 条提示'),
              ),
              h(RuleBars, { rows: groups, total: fails.length + warns.length }),
            ),
          ),
          h(
            'div',
            { className: 'gzw-metrics', style: { marginTop: 'var(--gzw-s4)' } },
            dashBase === null ? null : h(Metric, { k: '破折号 / 千字', v: dashBase.toFixed(2), hint: '人类基准约 0.80' }),
            info.stats === null || info.stats === undefined ? null : h(Metric, { k: '句子数', v: num(Number(info.stats.sentences ?? 0)), hint: '平均 ' + (d === null ? '—' : d.avgSentence) + ' 字/句' }),
            d === null ? null : h(Metric, { k: '长段峰值', v: d.longest, suffix: ' 字', hint: '超过 200 字考虑拆开' }),
            d === null ? null : h(Metric, { k: '阅读时长', v: d.readMinutes, suffix: ' 分钟', hint: d.chars + ' 字' }),
          ),
          issueRows.length === 0
            ? null
            : h(
                'details',
                { className: 'gzw-details', open: true, style: { marginTop: 'var(--gzw-s4)' } },
                h('summary', {}, issueRows.length + ' 条明细（点一条定位到正文）'),
                h(
                  'div',
                  { className: 'gzw-issues' },
                  ...issueRows.map((row, index) =>
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'gzw-issue' + (row.fail ? ' fail' : ''),
                        key: 'i' + index,
                        onClick: () => jumpToLine(row.line),
                      },
                      h('span', { className: 'ln' }, 'L' + String(row.line)),
                      h('span', {}, h('span', { className: 'rule' }, row.rule), h('span', { className: 'tx' }, row.text)),
                    ),
                  ),
                ),
              ),
        )
      }

      // ---------------- 阶段内容 ----------------
      function excerpt(body, count) {
        const blocks = String(body || '')
          .split(/\n{2,}/)
          .map((block) => block.trim())
          .filter((block) => block !== '' && !/^!\[/.test(block))
        return blocks.slice(0, count).join('\n\n')
      }

      function renderDraftPaper(limit) {
        if (draft === null) {
          return h(Empty, { icon: 'pen', title: '读不到 generated/draft.md', text: draftError || '等 Agent 写完这一版再来看。' })
        }
        const body = limit === undefined ? draft.body : excerpt(draft.body, limit)
        return h(
          'div',
          { className: 'gzw-paper' },
          h(
            'div',
            { className: 'gzw-paper-head' },
            h(
              'div',
              { style: { minWidth: 0, flex: 1 } },
              h('div', { className: 'gzw-paper-title' }, draft.meta.title || '（frontmatter 无 title）'),
              h('div', { className: 'gzw-paper-meta' }, [draft.meta.author, draft.meta.genre, draft.meta.description].filter(Boolean).join('　·　') || draft.path),
            ),
            h(Btn, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => copyText(draft.body, '正文已复制') }, '复制'),
          ),
          h(MarkdownView, { text: body, highlight: highlightLine, offset: draft.offset }),
        )
      }

      function renderManifest() {
        const item = artifactById('manifest')
        if (item === undefined) return h(Empty, { icon: 'image', title: '还没有配图 manifest', text: '配图阶段由 Agent 生成 generated/manifest.json 与预算单。' })
        const doc = docs[item.path]
        let manifest = null
        if (doc !== undefined && doc.ok === true) {
          try {
            manifest = JSON.parse(doc.text)
          } catch {}
        }
        const images = Array.isArray(manifest?.images) ? manifest.images : []
        const budget = artifactById('budget')
        const spent = Number(manifest?.budget?.spent ?? 0)
        const estimated = Number(manifest?.budget?.estimated ?? 0)
        const limit = Number(manifest?.budget?.limit ?? 0) || 1
        const ratio = Math.min(100, Math.round((estimated / limit) * 100))
        return h(
          'div',
          {},
          manifest === null
            ? h(Empty, { icon: 'image', title: 'manifest 读取中或解析失败', text: doc === undefined ? '正在读取 ' + item.path : String(doc.error || 'generated/manifest.json 不是合法 JSON') })
            : h(
                'div',
                { className: 'gzw-images' },
                ...images.map((image, index) =>
                  h(
                    'div',
                    { className: 'gzw-image', key: String(image.id ?? index) },
                    h(
                      'div',
                      { className: 'gzw-image-thumb' },
                      h('div', { className: 'gzw-image-deco' }),
                      h(Icon, { name: 'image', size: 26, stroke: 1.3 }),
                      h('span', { className: 'gzw-image-ratio' }, String(image.ratio ?? '')),
                      h(
                        'span',
                        { className: 'gzw-image-state ' + String(image.status ?? 'pending') },
                        h('i'),
                        image.status === 'done' ? '已生成' : image.status === 'running' ? '生成中' : '待生成',
                      ),
                    ),
                    h(
                      'div',
                      { className: 'gzw-image-body' },
                      h('div', { className: 'gzw-image-role' }, String(image.role ?? image.id ?? '')),
                      h(
                        'div',
                        { className: 'gzw-image-meta' },
                        h('span', { className: 'gzw-tag' }, String(image.id ?? '')),
                        h('span', { className: 'gzw-tag' }, String(image.quality ?? '—')),
                        image.width ? h('span', { className: 'gzw-tag' }, String(image.width) + '×' + String(image.height)) : null,
                      ),
                    ),
                  ),
                ),
              ),
          h(
            'div',
            { className: 'gzw-budget' },
            h('div', { className: 'gzw-row', style: { justifyContent: 'space-between', marginBottom: '7px' } },
              h('span', { className: 'gzw-muted' }, '预算占用'),
              h('span', { className: 'gzw-dim' }, '预估 ¥' + estimated.toFixed(2) + '　已花 ¥' + spent.toFixed(2) + '　上限 ¥' + limit.toFixed(2)),
            ),
            h(
              'div',
              { className: 'gzw-budget-track' },
              h('span', { className: 'gzw-budget-fill', style: { width: Math.max(2, ratio) + '%' } }),
            ),
            h(
              'div',
              { className: 'gzw-budget-legend' },
              h('span', {}, h('i', { style: { background: 'var(--gzw-accent)' } }), '预估占用 ' + ratio + '%'),
              h('span', {}, h('i', { style: { background: 'var(--gzw-ink-3)', opacity: 0.4 } }), '剩余 ¥' + (limit - estimated).toFixed(2)),
            ),
          ),
          budget === undefined
            ? null
            : h('div', { style: { marginTop: '16px' } }, h('div', { className: 'gzw-dim', style: { marginBottom: '6px' } }, '预算单：' + budget.path), renderArtifactBlock('budget', 'md')),
        )
      }

      function renderPublish() {
        const item = artifactById('publish-dry')
        const payload = publishResult?.payload ?? null
        const push = pushResult?.payload ?? null
        const coverMissing = !draft?.meta?.coverImage
        const checks = [
          { title: '标题', sub: 'frontmatter.title / state.md 主题', value: draft?.meta?.title || '', state: draft?.meta?.title ? 'ok' : 'todo' },
          { title: '封面图', sub: 'frontmatter.coverImage', value: draft?.meta?.coverImage || '没有封面就推不了', state: coverMissing ? 'warn' : 'ok' },
          { title: '排版 HTML', sub: 'generated/*_排版_*.html', value: item === undefined ? '未生成' : item.path, state: item === undefined ? 'todo' : 'ok' },
          { title: '作者 / 摘要', sub: 'author · description', value: [draft?.meta?.author, draft?.meta?.description ? '有摘要' : ''].filter(Boolean).join(' · '), state: draft?.meta?.author ? 'ok' : 'todo' },
          { title: '推送通道', sub: '个人主体只能推草稿箱，发布在手机上手动点', value: '显式推送 · 需二次确认', state: 'warn' },
        ]
        return h(
          'div',
          { className: 'gzw-stack' },
          h(
            'div',
            { className: 'gzw-note plain' },
            '发布永不自动：这里只能「推草稿箱」（draft/add），最终发布仍然要在公众号助手 App 里手动点。',
          ),
          h(CheckList, { checks }),
          h(
            'div',
            { className: 'gzw-row' },
            h(Btn, { variant: 'brand', icon: 'shield', onClick: () => runPublishDry(), disabled: publishBusy || readSessionId === '' }, publishBusy ? 'dry-run 中…' : '跑发布 dry-run'),
            h('span', { className: 'gzw-dim' }, '只检查参数和文件，不取 token、不推送。'),
          ),
          pushConfirm
            ? h(
                'div',
                { className: 'gzw-review' },
                h(
                  'div',
                  { className: 'gzw-review-main' },
                  h('div', { className: 'gzw-review-title' }, h(Icon, { name: 'alert', size: 15 }), '确认推到草稿箱？'),
                  h('div', { className: 'gzw-review-sub' }, '会真的调用微信接口：上传封面、创建草稿。凭据只留在宿主，不会下发浏览器。'),
                ),
                h(
                  'div',
                  { className: 'gzw-review-actions' },
                  h(Btn, { variant: 'ghost', onClick: () => setPushConfirm(false), disabled: pushBusy }, '取消'),
                  h(Btn, { variant: 'brand', icon: 'send', onClick: () => runPublishPush(), disabled: pushBusy }, pushBusy ? '推送中…' : '确认推送'),
                ),
              )
            : h(
                'div',
                { className: 'gzw-row' },
                h(Btn, { icon: 'send', onClick: () => setPushConfirm(true), disabled: pushBusy || readSessionId === '' }, '推草稿箱'),
                h('span', { className: 'gzw-dim' }, '需要再点一次确认；没有封面会先被拦下。'),
              ),
          payload === null
            ? publishResult?.status === 'running'
              ? h('div', { className: 'gzw-muted' }, '运行中…')
              : null
            : h(
                'div',
                { className: 'gzw-receipt ' + (payload.ok === true ? 'ok' : 'bad') },
                h('div', { className: payload.ok === true ? 'gzw-ok' : 'gzw-warn' }, payload.ok === true ? 'dry-run 通过（' + formatWhen(publishResult.at) + '）' : 'dry-run 未通过（' + formatWhen(publishResult.at) + '）：' + String(payload.code || '')),
                h('pre', { className: 'gzw-log', style: { marginTop: '8px', maxHeight: '220px', overflow: 'auto' } }, String(payload.text || publishResult.text || '')),
              ),
          push === null
            ? null
            : h(
                'div',
                { className: 'gzw-receipt ' + (push.ok === true ? 'ok' : 'bad') },
                h('div', { className: push.ok === true ? 'gzw-ok' : 'gzw-error' }, push.ok === true ? '已推送到草稿箱（' + formatWhen(pushResult.at) + '）' : '推送失败（' + formatWhen(pushResult.at) + '）：' + String(push.code || push.message || '')),
                h('pre', { className: 'gzw-log', style: { marginTop: '8px', maxHeight: '220px', overflow: 'auto' } }, String(push.text || pushResult.text || '')),
              ),
        )
      }

      // ---------------- 阶段工作区 ----------------
      const STAGE_TONE_CLASS = { accent: '', amber: 'warn', violet: 'decision', blue: 'info', rose: 'danger' }

      function renderStageNav() {
        return h(
          'div',
          { className: 'gzw-stage-nav' },
          ...STAGE_META.map((item) =>
            h(
              'button',
              {
                key: 'n-' + item.no,
                type: 'button',
                className: currentStage === item.no ? 'on' : '',
                onClick: () => setStageNo(item.no),
                title: item.desc,
              },
              CIRCLED[item.no - 1] + ' ' + item.name,
            ),
          ),
        )
      }

      function renderStageContent(stage) {
        const meta = STAGE_META[stage - 1]
        const d = draftStatsValue
        const stageArtifacts = STAGES[stage - 1].artifactIds.map((id) => artifactById(id)).filter((item) => item !== undefined)
        const toneClass = STAGE_TONE_CLASS[meta.tone] ?? ''
        const headActions = [
          h(Btn, { key: 'refresh', size: 'sm', variant: 'ghost', icon: 'refresh', onClick: () => { loadArtifacts(); loadState(); loadDraft(); loadStageDocs(stage) }, disabled: busy }, '刷新产物'),
        ]

        const body =
          stage === 1
            ? [
                h(
                  'div',
                  { className: 'gzw-note plain', style: { marginBottom: 'var(--gzw-s4)' } },
                  '本阶段产出「素材锚点清单」：从访谈/资料里挑出值得写的点，定下素材边界。清单还没生成时，先让 Agent 在会话里出这一版。',
                ),
                renderArtifactBlock('anchors', 'md'),
              ]
            : stage === 2 || stage === 3
              ? [
                  h(
                    'div',
                    { className: 'gzw-stack' },
                    h(
                      'div',
                      { className: 'gzw-row between' },
                      h('span', { className: 'gzw-muted' }, stage === 2 ? '全文只读预览；通过 / 退回在下方审阅条里。' : '同一份草稿的体检视角：通过 / 退回在下方审阅条里。'),
                      h(
                        'div',
                        { className: 'gzw-row tight' },
                        h(Btn, { size: 'sm', onClick: () => runGate('draft'), disabled: gateBusy || readSessionId === '', icon: 'spark' }, gateBusy ? '体检中…' : '跑 AI 味体检'),
                        h(Btn, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => copyText(draft?.body ?? '', '正文已复制') }, '复制全文'),
                      ),
                    ),
                    gate?.target === 'draft' ? h('div', { className: 'gzw-card quiet' }, renderGateViz()) : null,
                    d === null ? null : h('div', { className: 'gzw-card quiet' }, h('div', { className: 'gzw-eyebrow', style: { marginBottom: 'var(--gzw-s3)' } }, '句长分布'), h(SentenceHistogram, { buckets: d.buckets })),
                    renderDraftPaper(),
                  ),
                ]
              : stage === 4
                ? [renderManifest()]
                : stage === 5
                  ? [
                      h(
                        'div',
                        { className: 'gzw-layout' },
                        (() => {
                          const item = artifactById('layout')
                          if (item === undefined) return h(Empty, { icon: 'layout', title: '还没有排版 HTML', text: '先把 generated/draft.md 排成公众号格式，再去手机预览里过一遍。', action: h(Btn, { size: 'sm', icon: 'layout', onClick: () => runLayout(), disabled: layoutBusy }, layoutBusy ? '生成中…' : '生成排版') })
                          return h('div', {}, artifactMeta(item), gate?.target === 'html' ? h('div', { className: 'gzw-card quiet', style: { marginTop: '10px' } }, renderGateViz()) : null, h('div', { style: { marginTop: '12px' } }, renderDoc(item, 'html')))
                        })(),
                        h(
                          'div',
                          { className: 'gzw-stack' },
                          h(
                            'div',
                            { className: 'gzw-tviz' },
                            h('div', { className: 'gzw-tviz-label' }, h(Icon, { name: 'layout', size: 12 }), '生成排版'),
                            h(
                              'div',
                              { className: 'gzw-row tight' },
                              h('input', { className: 'gzw-input sm', value: layoutTheme, placeholder: 'zen', onChange: (event) => setLayoutTheme(event.target.value) }),
                              h(Btn, { size: 'sm', variant: 'brand', onClick: () => runLayout(), disabled: layoutBusy || readSessionId === '' }, layoutBusy ? '生成中…' : '生成'),
                            ),
                            h('div', { className: 'gzw-dim' }, 'md2wechat.py --theme ' + (layoutTheme || 'zen') + ' --enhance'),
                          ),
                          h(
                            'div',
                            { className: 'gzw-tviz' },
                            h('div', { className: 'gzw-tviz-label' }, h(Icon, { name: 'shield', size: 12 }), '排版校验'),
                            h('div', { className: 'gzw-tviz-value' }, artifactById('layout') === undefined ? '—' : '可校验'),
                            h(Btn, { size: 'sm', wide: true, onClick: () => runGate('html'), disabled: gateBusy || artifactById('layout') === undefined }, '跑 validate_gzh_html.py'),
                          ),
                          h(
                            'div',
                            { className: 'gzw-tviz' },
                            h('div', { className: 'gzw-tviz-label' }, h(Icon, { name: 'copy', size: 12 }), '导出'),
                            h('div', { className: 'gzw-dim' }, '排版稿是自包含 HTML，可直接全选复制进公众号编辑器。'),
                            h(Btn, { size: 'sm', wide: true, icon: 'copy', onClick: () => copyText(docs[artifactById('layout')?.path]?.text ?? '', 'HTML 已复制') }, '复制 HTML'),
                          ),
                          layoutResult === '' ? null : h('pre', { className: 'gzw-log', style: { maxHeight: '160px', overflow: 'auto' } }, layoutResult),
                        ),
                      ),
                    ]
                  : stage === 6
                    ? [renderPublish()]
                    : [
                        h(
                          'div',
                          { className: 'gzw-grid even' },
                          h(Card, { title: '发文日志', icon: 'book', sub: 'assets/log.md', className: 'quiet' }, renderArtifactBlock('log', 'md')),
                          h(Card, { title: '决策记录', icon: 'chart', sub: 'generated/决策日志.md', className: 'quiet' }, renderArtifactBlock('decisions', 'md')),
                        ),
                      ]

        return h(
          'div',
          { className: 'gzw-sec' },
          h(
            'div',
            { className: 'gzw-card' },
            h(
              'div',
              { className: 'gzw-stage-head' },
              h('div', { className: 'gzw-stage-mark ' + toneClass }, h(Icon, { name: meta.icon, size: 20, stroke: 1.2 })),
              h(
                'div',
                { style: { flex: 1, minWidth: '220px' } },
                h('div', { className: 'gzw-eyebrow' }, '阶段 ' + CIRCLED[stage - 1] + ' / 共 7'),
                h('div', { className: 'gzw-stage-title' }, meta.name),
                h('div', { className: 'gzw-stage-desc' }, meta.desc),
              ),
              h('div', { className: 'gzw-row tight' }, ...headActions),
            ),
            renderStageNav(),
            h(
              'div',
              { className: 'gzw-stat-strip' },
              h(Stat, { k: '正文', v: d === null ? '—' : num(d.chars), suffix: '字' }),
              h(Stat, { k: '段落', v: d === null ? '—' : d.paragraphs }),
              h(Stat, { k: '句数', v: d === null ? '—' : d.sentences }),
              h(Stat, { k: '长句', v: d === null ? '—' : d.longest, suffix: '字' }),
              h(Stat, { k: '预计阅读', v: d === null ? '—' : d.readMinutes, suffix: '分钟' }),
              h(Stat, { k: '本阶段产物', v: stageArtifacts.length + '/' + STAGES[stage - 1].artifactIds.length }),
            ),
            ...body,
          ),
        )
      }

      // ---------------- 轨迹 ----------------
      // ---------------- 轨迹 ----------------
      function renderTraceView() {
        const kindOrder = [
          { key: 'tool', label: '工具调用', color: 'var(--gzw-info)' },
          { key: 'say', label: '助手发言', color: 'var(--gzw-accent)' },
          { key: 'user', label: '用户消息', color: 'var(--gzw-decision)' },
          { key: 'decision', label: '决策', color: 'var(--gzw-warn)' },
          { key: 'review', label: '审阅指令', color: 'color-mix(in srgb,var(--gzw-accent) 55%,var(--gzw-decision))' },
          { key: 'result', label: '工具结果', color: 'var(--gzw-decision)' },
          { key: 'system', label: '系统 / 轮次', color: 'var(--gzw-ink-3)' },
        ]
        const segments = kindOrder
          .map((item) => ({ ...item, value: stats.byKind[item.key] ?? 0 }))
          .filter((item) => item.value > 0)
        const otherCount = Object.keys(stats.byKind).reduce((sum, key) => {
          if (kindOrder.some((item) => item.key === key)) return sum
          return sum + stats.byKind[key]
        }, 0)
        if (otherCount > 0) segments.push({ key: 'other', label: '其他', color: 'var(--gzw-line)', value: otherCount })

        const summary =
          stats.total === 0
            ? null
            : h(
                'div',
                { className: 'gzw-traceviz' },
                h(
                  'div',
                  { className: 'gzw-tviz' },
                  h('div', { className: 'gzw-tviz-label' }, h(Icon, { name: 'grid', size: 12 }), '节奏'),
                  h('div', { className: 'gzw-tviz-value' }, stats.total, h('small', {}, '步可见')),
                  h(Sparkline, { values: stats.series.values, height: 44 }),
                  h('div', { className: 'gzw-dim' }, stats.turns + ' 轮 turn　·　' + stats.tools + ' 次工具调用'),
                ),
                h(
                  'div',
                  { className: 'gzw-tviz' },
                  h('div', { className: 'gzw-tviz-label' }, h(Icon, { name: 'layers', size: 12 }), '构成'),
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: 'var(--gzw-s4)' } },
                    h(Donut, { segments, size: 74 }, h('div', { style: { textAlign: 'center' } }, h('div', { style: { fontSize: '15px', fontWeight: 650, lineHeight: 1.1 } }, stats.total), h('div', { className: 'gzw-ring-label' }, '步'))),
                    h(
                      'div',
                      { className: 'gzw-legend', style: { flex: 1, minWidth: 0 } },
                      ...segments.slice(0, 6).map((item) => h('div', { className: 'gzw-legend-item', key: item.key }, h('i', { style: { background: item.color } }), h('span', {}, item.label), h('b', {}, item.value))),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'gzw-tviz' },
                  h('div', { className: 'gzw-tviz-label' }, h(Icon, { name: 'alert', size: 12 }), '需要留意'),
                  h('div', { className: 'gzw-tviz-value' }, stats.errors, h('small', {}, '次失败')),
                  h(
                    'div',
                    { className: 'gzw-legend' },
                    h('div', { className: 'gzw-legend-item' }, h('i', { style: { background: 'var(--gzw-warn)' } }), h('span', {}, '决策捕获'), h('b', {}, stats.decisions)),
                    h('div', { className: 'gzw-legend-item' }, h('i', { style: { background: 'var(--gzw-accent)' } }), h('span', {}, '审阅往返'), h('b', {}, stats.reviews)),
                    h('div', { className: 'gzw-legend-item' }, h('i', { style: { background: 'var(--gzw-info)' } }), h('span', {}, '文件操作'), h('b', {}, filterCount('file'))),
                  ),
                ),
              )

        const toolRank = stats.tools > 0 ? h(Card, { title: '工具调用 Top', icon: 'grid', sub: '这一轮 Agent 实际调了哪些工具' }, h(ToolRank, { rows: traceRows })) : null

        return h(
          'div',
          { className: 'gzw-sec' },
          summary,
          toolRank,
          h(
            'div',
            { className: 'gzw-card' },
            h(
              'div',
              { className: 'gzw-card-head' },
              h(
                'div',
                { className: 'gzw-card-head-main' },
                h('div', { className: 'gzw-card-title' }, h('span', { className: 'gzw-card-ico' }, h(Icon, { name: 'history', size: 15 })), '操作时间线'),
                h(
                  'div',
                  { className: 'gzw-card-sub' },
                  traceSessionId !== ''
                    ? '历史会话 ' + shortId(traceSessionId) + '　·　只读回放，不跟随'
                    : binding === null
                      ? '未绑定专用会话，轨迹不可用'
                      : '会话 ' + shortId(binding.sessionId) + '　·　' + (followMode === 'live' ? '实时跟随中' : followMode === 'poll' ? '2 秒轮询' : '已暂停'),
                ),
              ),
              h(
                'div',
                { className: 'gzw-card-actions' },
                traceSessionId !== ''
                  ? h(Btn, { size: 'sm', icon: 'link', variant: 'ghost', onClick: () => setTraceSessionId('') }, '回到绑定会话')
                  : h(Btn, { size: 'sm', icon: followOn ? 'pause' : 'play', variant: 'ghost', onClick: () => setFollowOn((value) => !value) }, followOn ? '暂停跟随' : '开始跟随'),
                h(Btn, { size: 'sm', icon: 'refresh', variant: 'ghost', onClick: () => loadTrace(binding?.sessionId ?? readSessionId), disabled: (binding?.sessionId ?? readSessionId) === '' }, '立即刷新'),
                h(Btn, { size: 'sm', icon: 'x', variant: 'ghost', onClick: () => cancelRun(), disabled: !bindingReady }, '停止 turn'),
              ),
            ),
            h(
              'div',
              { className: 'gzw-filters' },
              ...filters.map((filter) =>
                h(
                  'button',
                  { key: filter.id, type: 'button', className: 'gzw-filter' + (traceFilter === filter.id ? ' on' : ''), onClick: () => setTraceFilter(filter.id) },
                  filter.label,
                  h('span', { className: 'c' }, filterCount(filter.id)),
                ),
              ),
            ),
            traceError !== '' ? h('div', { className: 'gzw-error', style: { marginTop: 'var(--gzw-s3)' } }, traceError) : null,
            traceSessionId === '' && (binding === null || binding.sessionId === '')
              ? h(Empty, { icon: 'link', title: '未绑定会话', text: '绑定后这里显示该会话的实时步骤：用户消息、工具调用、审阅往返与失败。', action: h(Btn, { size: 'sm', onClick: () => setView('binding') }, '去绑定') })
              : visibleRows.length === 0
                ? h(Empty, { icon: 'grid', title: '当前筛选下没有事件', text: stats.total === 0 ? '这个会话还没有产生可显示的步骤。' : '换个筛选，或等 Agent 继续跑。' })
                : h(
                    'div',
                    { className: 'gzw-timeline', ref: traceEndRef, onScroll: (event) => {
                      const el = event.currentTarget
                      autoScrollRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
                    }, style: { maxHeight: '620px', overflow: 'auto' } },
                    ...visibleRows.map((row, index) =>
                      h(
                        'div',
                        { className: 'gzw-tl-row', key: String(index) },
                        h('div', { className: 'gzw-tl-time' }, row.time),
                        h('div', { className: 'gzw-tl-rail' }, h('div', { className: 'gzw-tl-node ' + (row.error ? 'error' : row.kind) })),
                        h('div', { className: 'gzw-tl-body' }, h(Clamp, { row })),
                      ),
                    ),
                  ),
          ),
        )
      }

      // ---------------- 四库与复盘 ----------------
      const LIBRARIES = [
        { id: 'inbox', label: 'inbox', title: '素材收件箱', path: 'assets/inbox.md', icon: 'note', tone: 'accent', hint: '还没被任何文章用过的念头；说「记一笔」会落在这里' },
        { id: 'voice', label: 'voice', title: '文风基准', path: 'assets/voice.md', icon: 'pen', tone: 'decision', hint: '写这一篇时遵守的语气与节奏' },
        { id: 'lessons', label: 'lessons', title: '经验沉淀', path: 'assets/lessons.md', icon: 'book', tone: 'warn', hint: '踩过的坑与有效的做法' },
        { id: 'learned', label: 'learned-edits', title: '手改记录', path: 'assets/learned-edits.md', icon: 'history', tone: 'info', hint: '机器稿 → 人改稿的差异，阶段⑦回写用' },
      ]

      function parseInbox(text) {
        const sections = { '未处理': [], '已用': [], '沉淀': [] }
        let current = ''
        for (const raw of String(text || '').split('\n')) {
          const line = raw.trim()
          const head = /^##\s*(.+?)\s*$/.exec(line)
          if (head !== null) {
            current = head[1]
            continue
          }
          if (!line.startsWith('- ')) continue
          if (sections[current] === undefined) continue
          sections[current].push(line.slice(2))
        }
        return sections
      }

      function renderLibraries() {
        const docsByLib = {}
        for (const lib of LIBRARIES) docsByLib[lib.id] = docs[lib.path]
        const history = candidates.slice(0, 8)
        return h(
          'div',
          { className: 'gzw-sec' },
          h(
            'div',
            { className: 'gzw-grid even' },
            ...LIBRARIES.map((lib) => {
              const doc = docsByLib[lib.id]
              const missing = doc !== undefined && doc.ok !== true
              const body = (() => {
                if (doc === undefined) return h(Skeleton, { height: 96 })
                if (missing) return h(Empty, { icon: lib.icon, title: '读不到 ' + lib.path, text: String(doc.error || '文件可能还不存在（新 clone 的个人数据不会入库）') })
                if (lib.id === 'inbox') {
                  const sections = parseInbox(doc.text)
                  const hasAny = Object.values(sections).some((list) => list.length > 0)
                  if (!hasAny) return h(Empty, { icon: 'note', title: 'inbox 还是空的', text: '在下面写一条，或对 Agent 说「记一笔：……」——它会落进「未处理」区。', action: h(Btn, { size: 'sm', icon: 'plus', onClick: () => setNoteDraft((value) => (value === '' ? '记一笔：' : value)) }, '写一条') })
                  return h(
                    'div',
                    {},
                    ...Object.keys(sections).map((name) =>
                      h(
                        'div',
                        { key: name, style: { marginBottom: 'var(--gzw-s3)' } },
                        h('div', { className: 'gzw-eyebrow', style: { marginBottom: '6px' } }, name + '（' + sections[name].length + '）'),
                        sections[name].length === 0
                          ? h('div', { className: 'gzw-dim' }, '空')
                          : h(
                              'div',
                              {},
                              ...sections[name].map((entry, index) =>
                                h(
                                  'div',
                                  { className: 'gzw-lib-item', key: name + index },
                                  h('span', { className: 'gzw-lib-bullet' + (name === '沉淀' ? ' decision' : name === '已用' ? '' : ' warn') }),
                                  h(
                                    'div',
                                    { className: 'gzw-lib-body' },
                                    h('div', { className: 'gzw-lib-text' }, entry),
                                  ),
                                ),
                              ),
                            ),
                      ),
                    ),
                  )
                }
                const text = String(doc.text || '')
                if (text.trim() === '') return h(Empty, { icon: lib.icon, title: '这个库还是空的', text: lib.hint })
                return h(
                  'div',
                  { style: { maxHeight: '280px', overflow: 'auto', paddingRight: '4px' } },
                  h(MarkdownView, { text }),
                )
              })()
              return h(
                Card,
                { key: lib.id, title: lib.title, icon: lib.icon, sub: lib.path + '　·　' + lib.hint },
                body,
              )
            }),
          ),
          renderNoteComposer(),
          h(
            Card,
            { title: '历史文章', icon: 'history', sub: '工作区里的历史会话：点「看轨迹」在工作台里回放，不新建真源' },
            history.length === 0
              ? h(Empty, { icon: 'history', title: '这个工作区还没有别的会话', text: '每写一篇就会有一个专属会话；它们会出现在这里。' })
              : h(
                  'div',
                  { className: 'gzw-arts' },
                  ...history.map((row) => {
                    const id = String(sessionIdOf(row) ?? '')
                    const isBound = binding !== null && binding.sessionId === id
                    const isViewing = traceSessionId === id
                    return h(
                      'div',
                      { className: 'gzw-art' + (isViewing ? ' on' : ''), key: 'h-' + id },
                      h('div', { className: 'gzw-avatar' }, initialOf(sessionTitleOf(row))),
                      h(
                        'div',
                        { className: 'gzw-art-main' },
                        h('div', { className: 'gzw-art-name' }, h('span', { className: 'nm' }, sessionTitleOf(row)), isBound ? h('span', { className: 'gzw-stage-pill' }, '当前绑定') : null),
                        h('div', { className: 'gzw-art-sub' }, shortId(id) + '　' + relTime(row.updatedAt)),
                      ),
                      h(
                        'div',
                        { className: 'gzw-art-tail' },
                        h(Btn, {
                          size: 'sm',
                          variant: isViewing ? 'ghost' : undefined,
                          icon: 'history',
                          onClick: () => {
                            setTraceSessionId(id)
                            setView('trace')
                          },
                        }, isViewing ? '正在看' : '看轨迹'),
                      ),
                    )
                  }),
                ),
          ),
        )
      }

      function renderNoteComposer() {
        const busy = noteBusy
        return h(
          Card,
          { title: '记一笔', icon: 'note', sub: '追加到 assets/inbox.md 的「未处理」区；工作台只按区追加，不改其他内容' },
          h(
            'div',
            { className: 'gzw-row', style: { alignItems: 'flex-start', gap: 'var(--gzw-s2)' } },
            h(
              'div',
              { style: { flex: 1, minWidth: 0 } },
              h('textarea', {
                className: 'gzw-textarea',
                value: noteDraft,
                placeholder: '记一笔：……',
                onChange: (event) => setNoteDraft(event.target.value),
              }),
            ),
            h(
              'div',
              { className: 'gzw-stack', style: { gap: 'var(--gzw-s2)', width: '160px' } },
              h('input', { className: 'gzw-input', value: noteSource, placeholder: '来源（随手记/读到某处/聊天）', onChange: (event) => setNoteSource(event.target.value) }),
              h(Btn, { variant: 'brand', wide: true, icon: 'plus', onClick: () => saveNote(), disabled: busy || noteDraft.trim() === '' }, busy ? '写入中…' : '写进 inbox'),
            ),
          ),
          noteError === '' ? null : h('div', { className: 'gzw-error', style: { marginTop: 'var(--gzw-s2)' } }, noteError),
        )
      }

      // ---------------- 产物库 ----------------
      function renderArtifactsView() {
        if (artifacts.length === 0) {
          return h(Card, { title: '产物库', icon: 'layers', sub: 'generated/ 与 assets/log.md' }, h(Empty, { icon: 'layers', title: '还没有任何产物', text: 'Agent 每完成一个阶段，产物就会出现在这里，可以直接预览。' }))
        }
        return h(ArtifactExplorer, { items: artifacts, docs, onRead: loadDoc, onCopy: copyText, onJump: jumpToStage })
      }

      // ---------------- 绑定 ----------------
      function renderBindingView() {
        const head = h(
          'span',
          { className: 'gzw-chip ' + (bindingReady ? 'accent' : 'amber') },
          h(Icon, { name: bindingReady ? 'link' : 'alert', size: 12 }),
          bindingReady ? '写操作就绪' : bindingBlockReason,
        )
        const list = h(
          'div',
          {},
          h(
            'div',
            { className: 'gzw-row', style: { marginBottom: '8px' } },
            h('input', { className: 'gzw-input', placeholder: '按标题 / 会话 id 过滤', value: sessionFilter, onChange: (event) => setSessionFilter(event.target.value) }),
            h('span', { className: 'gzw-dim' }, candidates.length + ' 个候选'),
          ),
          h(
            'div',
            { className: 'gzw-sessions' },
            (showAllSessions ? candidates : candidates.slice(0, 8)).map((row) => {
              const id = String(sessionIdOf(row) ?? '')
              const isBound = binding !== null && binding.sessionId === id
              return h(
                'div',
                { className: 'gzw-session' + (isBound ? ' bound' : ''), key: id || Math.random() },
                h('div', { className: 'gzw-avatar' }, initialOf(sessionTitleOf(row))),
                h(
                  'div',
                  { className: 'gzw-session-main' },
                  h('div', { className: 'gzw-session-title' }, row.running === true ? h('span', { className: 'dot' }) : null, sessionTitleOf(row)),
                  h('div', { className: 'gzw-session-sub' }, shortId(id) + '　' + relTime(row.updatedAt)),
                ),
                isBound
                  ? h('span', { className: 'gzw-chip accent' }, '当前绑定')
                  : h(Btn, { size: 'sm', onClick: () => bindTo(row) }, '绑定'),
              )
            }),
          ),
          candidates.length > 8
            ? h('div', { style: { marginTop: '8px' } }, h(Btn, { size: 'sm', variant: 'ghost', onClick: () => setShowAllSessions((value) => !value) }, showAllSessions ? '收起' : '显示全部 ' + candidates.length + ' 个'))
            : null,
        )

        if (binding === null) {
          return h(
            'div',
            { className: 'gzw-sec' },
            h(
              Card,
              {
                title: '会话绑定',
                icon: 'link',
                sub: '工作台只对这一篇的专用会话做写操作（通过 / 退回）。',
                actions: [head],
              },
              h('div', { className: 'gzw-note', style: { marginBottom: '14px' } }, '选一个会话绑定；建议把会话标题改成文章标题，之后在侧边栏一眼能认出。绑定记录写在 gzhflow/generated/.gzh-workbench/run.json，不含业务状态。'),
              list,
            ),
          )
        }

        return h(
          'div',
          { className: 'gzw-sec' },
          h(
            Card,
            {
              title: '会话绑定',
              icon: 'link',
              sub: '绑定与 state.md 当前篇的对应关系',
              actions: [head],
            },
            h(
              'div',
              { className: 'gzw-gate', style: { gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', alignItems: 'start' } },
              h(
                'div',
                { className: 'gzw-kv', style: { display: 'grid', gridTemplateColumns: 'max-content minmax(0,1fr)', gap: '4px 14px', fontSize: '12.5px' } },
                h('span', { className: 'gzw-dim' }, '会话'),
                h('span', {}, sessionTitleOf(boundSession) + '（' + shortId(binding.sessionId) + '）'),
                h('span', { className: 'gzw-dim' }, '工作目录'),
                h('span', { className: 'gzw-mono', title: boundSession !== undefined ? sessionCwdOf(boundSession) : '' }, boundSession !== undefined ? sessionCwdOf(boundSession) || '(未提供)' : '(会话不在列表里)'),
                h('span', { className: 'gzw-dim' }, '绑定时'),
                h('span', {}, formatWhen(Date.parse(binding.boundAt)) || String(binding.boundAt || '')),
                h('span', { className: 'gzw-dim' }, '文章'),
                h('span', {}, clip(String(binding.topic || '（无）'), 90)),
              ),
              h(
                'div',
                {},
                h(
                  'div',
                  { className: 'gzw-note ' + (articleMatches ? '' : 'amber') },
                  articleMatches ? '绑定与 state.md 当前篇一致，写操作开启。' : 'state.md 当前篇已变或未读到，写操作已禁用。绑定时主题：' + clip(String(binding.topic || '（无）'), 80),
                ),
                h(
                  'div',
                  { className: 'gzw-row', style: { marginTop: '10px' } },
                  h(Btn, { size: 'sm', icon: 'refresh', variant: 'ghost', onClick: () => loadBinding() }, '刷新绑定'),
                  h(Btn, { size: 'sm', variant: 'ghost', icon: 'link', onClick: () => setSwapPicker((value) => !value) }, swapPicker ? '取消换绑' : '换绑'),
                  h(Btn, { size: 'sm', variant: 'danger', icon: 'x', onClick: unbind }, '解除绑定'),
                ),
              ),
            ),
            bindingError !== '' ? h('div', { className: 'gzw-error', style: { marginTop: '10px' } }, bindingError) : null,
            swapPicker ? h('div', { style: { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gzw-line-soft)' } }, list) : null,
          ),
        )
      }

      // ---------------- 顶栏 ----------------
      const views = [
        { id: 'overview', label: '总览' },
        { id: 'stage', label: '阶段', count: currentStage },
        { id: 'trace', label: '轨迹', count: stats.total },
        { id: 'artifacts', label: '产物', count: artifacts.length },
        { id: 'libraries', label: '库' },
        { id: 'binding', label: '绑定' },
      ]

      const header = h(
        'div',
        { className: 'gzw-top' },
        h(
          'div',
          { className: 'gzw-top-inner' },
          h(
            'div',
            { className: 'gzw-brand' },
            h('div', { className: 'gzw-logo' }, h(Icon, { name: 'pen', size: 16, stroke: 1.3 })),
            h(
              'div',
              { className: 'gzw-brand-text' },
              h('div', { className: 'gzw-brand-title' }, '公众号工作台'),
              h('div', { className: 'gzw-brand-meta' }, 'gzhflow · seven stages'),
            ),
          ),
          h(
            'div',
            { className: 'gzw-nav', role: 'tablist' },
            ...views.map((item) =>
              h(
                'button',
                { key: item.id, type: 'button', role: 'tab', 'aria-selected': view === item.id, className: 'gzw-tab' + (view === item.id ? ' on' : ''), onClick: () => setView(item.id) },
                item.label,
                item.count === undefined ? null : h('span', { className: 'gzw-tab-count' }, String(item.count)),
              ),
            ),
          ),
          h(
            'div',
            { className: 'gzw-context' },
            h(
              'div',
              { style: { minWidth: 0 } },
              h('div', { className: 'gzw-context-title gzw-truncate' }, article === null ? 'state.md 未读到当前篇' : article.topic || '（state.md 未写主题）'),
              h('div', { className: 'gzw-context-meta' }, '阶段 ' + CIRCLED[currentStage - 1] + ' ' + STAGE_META[currentStage - 1].name + '　·　' + doneCount + '/7 阶段　·　' + artifacts.length + ' 项产物'),
            ),
          ),
          h(
            'div',
            { className: 'gzw-top-right' },
            h(
              'span',
              { className: 'gzw-status' + (busy ? ' busy' : binding === null || !followOn ? ' paused' : '') },
              h('span', { className: 'gzw-status-dot' }),
              busy ? '刷新中' : binding === null ? '未绑定' : followMode === 'live' ? '实时跟随' : followMode === 'poll' ? '轮询中' : '已暂停',
            ),
            h('button', { type: 'button', className: 'gzw-icon-btn', title: '刷新全部（r）', onClick: refresh, disabled: busy }, h(Icon, { name: 'refresh', size: 15 })),
          ),
        ),
      )

      const footer = h(
        'div',
        { className: 'gzw-footer' },
        h('span', { className: 'repo', title: repoRoot }, repoRoot === '' ? 'gzhflow 仓库未定位' : repoLabel),
        h('span', { className: 'gzw-spacer' }),
        h(Btn, { size: 'sm', variant: 'ghost', icon: 'shield', onClick: async () => {
          const result = await execCommand('/gzh-env')
          log('命令 /gzh-env 返回:\n' + result.text)
          showToast('环境自检已写入诊断日志')
        }, disabled: readSessionId === '' }, '环境自检'),
        h(Btn, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => copyText(logs.join('\n'), '诊断日志已复制') }, '复制诊断'),
        h(Btn, { size: 'sm', variant: 'ghost', icon: 'refresh', onClick: refresh, disabled: busy }, busy ? '刷新中…' : '刷新状态'),
      )

      return h(
        'div',
        { className: 'gzw-root' },
        h('style', {}, css),
        header,
        h(
          'div',
          { className: 'gzw-content' },
          view === 'overview'
            ? h(
                'div',
                { className: 'gzw-sec' },
                renderHero(),
                repoRoot === '' || stateError !== '' ? renderSetupGuide() : null,
                renderActionBar(),
                renderKpis(),
                renderReview(),
                receipt === null ? null : renderReceipt(),
                renderOnboarding(),
                h(
                  'div',
                  { className: 'gzw-grid' },
                  h(
                    'div',
                    { className: 'gzw-stack' },
                    h(
                      Card,
                      {
                        title: '全文预览',
                        icon: 'book',
                        sub: draft === null ? '还没有草稿' : (draft.meta.genre || '正文') + '　·　' + (draftStatsValue === null ? '' : num(draftStatsValue.chars) + ' 字'),
                        actions: [
                          h(Btn, { key: 'gate', size: 'sm', icon: 'spark', onClick: () => runGate('draft'), disabled: gateBusy || readSessionId === '' }, gateBusy ? '体检中…' : '体检'),
                          h(Btn, { key: 'open', size: 'sm', variant: 'ghost', icon: 'arrow', onClick: () => jumpToStage(draft === null ? 2 : 3) }, '去审阅'),
                        ],
                      },
                      draft === null
                        ? h(Empty, { icon: 'pen', title: '读不到 generated/draft.md', text: draftError || '等 Agent 写完这一版再来看。', action: h(Btn, { size: 'sm', onClick: () => loadDraft() }, '重新读取') })
                        : h('div', {}, h(MarkdownView, { text: excerpt(draft.body, 4) }), h('div', { className: 'gzw-row', style: { marginTop: '12px' } }, h(Btn, { size: 'sm', variant: 'ghost', icon: 'arrow', onClick: () => jumpToStage(3) }, '读全文'))),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'gzw-stack' },
                    h(Card, { title: 'AI 味体检', icon: 'spark', sub: gate === null ? '还没跑 · 下面是这一版可算的文本指标' : formatWhen(gate.at) + ' 的结果' }, renderGateViz()),
                    h(
                      Card,
                      {
                        title: '产物',
                        icon: 'layers',
                        sub: artifacts.length === 0 ? '还没有产物' : artifacts.length + ' 项',
                        actions: [h(Btn, { key: 'all', size: 'sm', variant: 'ghost', icon: 'arrow', onClick: () => setView('artifacts') }, '全部')],
                      },
                      artifacts.length === 0
                        ? h(Empty, { icon: 'layers', title: 'generated/ 还是空的', text: '工作台只是控制面：产物由 Agent 写进仓库，这里只负责读和展示。' })
                        : h('div', { className: 'gzw-arts' }, ...artifacts.slice(0, 6).map(renderArtifactEntry)),
                    ),
                  ),
                ),
              )
            : view === 'stage'
              ? renderStageContent(currentStage)
              : h('div', { className: 'gzw-sec' }, view === 'trace' ? renderTraceView() : view === 'artifacts' ? renderArtifactsView() : view === 'libraries' ? renderLibraries() : renderBindingView()),
          footer,
          h(
            'details',
            { className: 'gzw-details', style: { padding: '0 4px' } },
            h('summary', {}, '诊断日志（' + logs.length + ' 条）'),
            h('pre', { className: 'gzw-log gzw-logs' }, logs.slice(-120).join('\n')),
            bindingError !== '' ? h('div', { className: 'gzw-error' }, bindingError) : null,
            artifactsError !== '' ? h('div', { className: 'gzw-error' }, artifactsError) : null,
            stateError !== '' ? h('div', { className: 'gzw-error' }, stateError) : null,
          ),
        ),
        h(Toast, { text: toast }),
        showHelp
          ? h(
              'div',
              { className: 'gzw-help', onClick: () => setShowHelp(false) },
              h(
                'div',
                { className: 'gzw-help-card', onClick: (event) => event.stopPropagation() },
                h('div', { className: 'gzw-card-title', style: { marginBottom: 'var(--gzw-s3)' } }, '快捷键'),
                h(
                  'div',
                  { className: 'gzw-help-grid' },
                  ...[
                    ['g 然后 1–6', '切到总览 / 阶段 / 轨迹 / 产物 / 库 / 绑定'],
                    ['r', '刷新全部数据'],
                    ['a', '通过当前这一版（需先绑定会话）'],
                    ['b', '退回改稿（需先绑定会话）'],
                    ['?', '打开 / 关闭这张表'],
                  ].map((row) =>
                    h('div', { className: 'gzw-help-row', key: row[0] }, h('span', { className: 'gzw-kbd' }, row[0]), h('span', {}, row[1])),
                  ),
                ),
              ),
            )
          : null,
      )
    }

    // -----------------------------------------------------------------------
    // 产物浏览（独立组件：选中态只影响这一块）
    // -----------------------------------------------------------------------
    function ArtifactExplorer({ items, docs, onRead, onCopy, onJump }) {
      const [selected, setSelected] = React.useState('')
      const active = items.some((item) => item.id === selected) ? selected : items.length > 0 ? items[0].id : ''
      const item = items.find((entry) => entry.id === active)

      React.useEffect(() => {
        if (item !== undefined) onRead(item.path)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [item?.path, item?.mtimeMs])

      if (item === undefined) return null
      const doc = docs[item.path]
      const maxBytes = Math.max(1, ...items.map((entry) => Number(entry.bytes) || 0))

      const body = (() => {
        if (doc === undefined) return h('div', { style: { padding: 'var(--gzw-s5)' } }, h(Skeleton, { height: 180 }))
        if (doc.ok !== true) return h(Empty, { icon: 'alert', title: '读取失败', text: readErrorText(doc.error) })
        if (item.kind === 'html') {
          return h(
            'div',
            { className: 'gzw-phone' },
            h('div', { className: 'gzw-phone-top' }, h('div', { className: 'gzw-phone-notch' })),
            h('div', { className: 'gzw-phone-screen' }, h('iframe', { srcDoc: doc.text, sandbox: '', title: item.path })),
            h('div', { className: 'gzw-phone-label' }, '只读预览 · 不执行脚本'),
          )
        }
        if (item.kind === 'json') {
          let pretty = doc.text
          try {
            pretty = JSON.stringify(JSON.parse(doc.text), null, 2)
          } catch {}
          return h('pre', { className: 'gzw-log', style: { maxHeight: '560px', overflow: 'auto' } }, pretty)
        }
        return h('div', { className: 'gzw-paper' }, h(MarkdownView, { text: doc.text }))
      })()

      const grouped = STAGE_META.map((stage) => ({
        stage,
        list: items.filter((entry) => stageIndexFrom(String(entry.stage)) === stage.no),
      })).filter((group) => group.list.length > 0)

      return h(
        'div',
        { className: 'gzw-layout' },
        h(
          'div',
          { className: 'gzw-card' },
          h(
            'div',
            { className: 'gzw-card-head' },
            h(
              'div',
              { className: 'gzw-card-head-main' },
              h('div', { className: 'gzw-card-title' }, h('span', { className: 'gzw-card-ico' }, h(Icon, { name: KIND_ICON[item.kind] ?? 'file', size: 15 })), ARTIFACT_LABELS[item.id] ?? item.id),
              h('div', { className: 'gzw-card-sub' }, item.path + '　' + humanBytes(item.bytes) + '　' + formatWhen(item.mtimeMs)),
            ),
            h(
              'div',
              { className: 'gzw-card-actions' },
              h(Btn, { size: 'sm', variant: 'ghost', icon: 'arrow', onClick: () => onJump(item.stage) }, '去阶段'),
              h(Btn, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => onCopy(doc?.text ?? '', '已复制产物内容') }, '复制'),
            ),
          ),
          body,
        ),
        h(
          'div',
          { className: 'gzw-card quiet' },
          h('div', { className: 'gzw-card-head' }, h('div', { className: 'gzw-card-head-main' }, h('div', { className: 'gzw-card-title' }, '全部产物'), h('div', { className: 'gzw-card-sub' }, items.length + ' 项 · 按阶段分组 · 条长表示大小'))),
          h(ArtifactTimeline, { items }),
          ...grouped.map((group) =>
            h(
              'div',
              { key: 'g-' + group.stage.no, style: { marginBottom: 'var(--gzw-s3)' } },
              h('div', { className: 'gzw-eyebrow', style: { marginBottom: '6px' } }, '阶段 ' + CIRCLED[group.stage.no - 1] + ' ' + group.stage.name),
              h(
                'div',
                { className: 'gzw-arts' },
                ...group.list.map((entry) =>
                  h(
                    'div',
                    {
                      className: 'gzw-art' + (entry.id === active ? ' on' : ''),
                      key: entry.id,
                      onClick: () => setSelected(entry.id),
                    },
                    h('div', { className: 'gzw-art-ico ' + (entry.kind || 'file') }, h(Icon, { name: KIND_ICON[entry.kind] ?? 'file', size: 13 })),
                    h(
                      'div',
                      { className: 'gzw-art-main' },
                      h('div', { className: 'gzw-art-name' }, h('span', { className: 'nm' }, ARTIFACT_LABELS[entry.id] ?? entry.id)),
                      h('div', { className: 'gzw-art-sub' }, entry.path + '　' + humanBytes(entry.bytes) + '　' + relTime(entry.mtimeMs)),
                    ),
                    h(
                      'div',
                      { className: 'gzw-art-tail' },
                      h('span', { className: 'gzw-sizebar', title: humanBytes(entry.bytes) }, h('span', { style: { width: Math.max(3, ((Number(entry.bytes) || 0) / maxBytes) * 100) + '%' } })),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      )
    }

    function Clamp({ row }) {
      const [open, setOpen] = React.useState(false)
      const [clipped, setClipped] = React.useState(false)
      const ref = React.useRef(null)
      React.useLayoutEffect(() => {
        const el = ref.current
        if (el === null) return
        setClipped(el.scrollHeight > el.clientHeight + 2)
      }, [row.text, open])
      const hasRaw = row.raw !== null && row.raw !== undefined && row.raw !== ''
      return h(
        React.Fragment,
        null,
        h('div', { className: 'gzw-tl-line' }, h('span', { className: 'gzw-tl-kind ' + (row.error ? 'error' : row.kind) }, row.label)),
        h(
          'div',
          { className: 'gzw-tl-text' + (open ? ' open' : ''), ref },
          row.text,
          clipped && !open ? h('span', { className: 'gzw-tl-toggle', onClick: () => setOpen(true) }, '展开') : null,
        ),
        open && hasRaw ? h('pre', { className: 'gzw-log', style: { marginTop: '6px', maxHeight: '240px', overflow: 'auto' } }, row.raw) : null,
        open ? h('div', { style: { marginTop: '4px' } }, h(Btn, { size: 'sm', variant: 'ghost', onClick: () => setOpen(false) }, '收起')) : null,
      )
    }

    const KIND_ICON = { md: 'file', json: 'grid', html: 'layout', txt: 'file', file: 'file' }

    function panelGlyph(size) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true },
        h('path', { d: 'M4.2 5.6h15.6v9.2H9.4l-3.7 3.3v-3.3H4.2z', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round' }),
        h('path', { d: 'M8 8.6h8M8 11.2h5.4', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }),
        h('circle', { cx: 18.4, cy: 15.4, r: 2.1, fill: 'currentColor', opacity: 0.7 }),
      )
    }

    function PanelIcon({ size, active }) {
      return h('span', { style: { display: 'inline-flex', color: active ? 'inherit' : 'currentColor' } }, panelGlyph(size ?? 18))
    }

    return {
      inject: ['slots', 'layout', 'locale', 'remote', 'remote.session', 'remote.workspaceFiles', 'remote.commands'],
      apply(ctx) {
        serviceCtx = ctx
        ctx.effect(
          () =>
            ctx.locale.register('gzhWorkbench', {
              zh: {
                'panel.title': '公众号工作台',
                'meta.title': '公众号工作台',
                'meta.description': 'gzhflow 微信公众号内容工作流控制台：七阶段进度、全文审阅、AI 味体检与 Agent 操作轨迹。',
              },
              en: {
                'panel.title': 'WeChat workbench',
                'meta.title': 'WeChat workbench',
                'meta.description': 'Control surface for the gzhflow WeChat Official Account workflow: stage progress, full-text review, AI-flavor gate, and agent trace.',
              },
            }),
          'gzh-workbench: locale',
        )
        const t = ctx.locale.bind('gzhWorkbench')
        ctx.effect(
          () => ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'gzh-workbench' }, Workbench)),
          'gzh-workbench: main panel',
        )
        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.panellist', () =>
              ctx.slots.register(
                {
                  name: 'sidebar.panellist',
                  id: 'gzh-workbench',
                  order: 12,
                  label: () => t('panel.title'),
                },
                PanelIcon,
              ),
            ),
          'gzh-workbench: sidebar entry',
        )
      },
    }
  },
})
