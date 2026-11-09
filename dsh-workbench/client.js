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
   gzhflow 工作台 · 设计系统 v4「编辑台」
   取自 Claude 的气质而不是皮肤：暖纸底、墨色字、陶土色只做状态与焦点、
   正文用宋体读、控件用无衬线、数字等宽。区块靠留白与 1px 细线分层，
   只有真正需要框的东西（稿纸、手机、弹层）才有边框和阴影。
   ========================================================================== */
.gzw-root{
  /* ---- 与宿主同一套语义色：页面 / 表面 / 描边 / 文字全部取 DSH 别名，
         不引入第二种品牌色；深浅色由宿主主题自动切换。 ---- */
  --gzw-page:var(--dsw-alias-bg-base);
  --gzw-surface:var(--dsw-alias-bg-layer-1);
  --gzw-surface-2:var(--dsw-alias-interactive-bg-hover);
  --gzw-surface-3:var(--dsw-alias-interactive-bg-active);
  --gzw-line:var(--dsw-alias-border-l2);
  --gzw-line-soft:color-mix(in srgb,var(--dsw-alias-border-l2) 62%,transparent);
  --gzw-line-strong:color-mix(in srgb,var(--dsw-alias-label-primary) 20%,transparent);

  --gzw-ink:var(--dsw-alias-label-primary);
  --gzw-ink-2:var(--dsw-alias-label-secondary);
  --gzw-ink-3:var(--dsw-alias-label-tertiary);

  /* ---- 强调色就是宿主的墨色：只表达当前位置，不做装饰 ---- */
  --gzw-accent:var(--dsw-alias-brand-primary);
  --gzw-accent-strong:var(--dsw-alias-brand-primary);
  --gzw-accent-soft:var(--dsw-alias-interactive-bg-hover-accent);
  --gzw-accent-line:color-mix(in srgb,var(--dsw-alias-label-primary) 22%,transparent);

  /* ---- 状态色从宿主状态令牌派生，深浅色自动跟随 ---- */
  --gzw-ok:color-mix(in srgb,var(--dsw-alias-state-success-primary) 72%,var(--dsw-alias-label-primary));
  --gzw-ok-soft:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent);
  --gzw-warn:color-mix(in srgb,var(--dsw-alias-state-warn-label) 78%,var(--dsw-alias-label-primary));
  --gzw-warn-soft:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 14%,transparent);
  --gzw-warn-line:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 30%,transparent);
  --gzw-danger:color-mix(in srgb,var(--dsw-alias-state-error-primary) 78%,var(--dsw-alias-label-primary));
  --gzw-danger-soft:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);
  --gzw-danger-line:color-mix(in srgb,var(--dsw-alias-state-error-primary) 26%,transparent);
  --gzw-info:var(--dsw-alias-link);
  --gzw-info-soft:color-mix(in srgb,var(--dsw-alias-link) 12%,transparent);
  --gzw-info-line:color-mix(in srgb,var(--dsw-alias-link) 26%,transparent);
  --gzw-tool:color-mix(in srgb,var(--dsw-alias-link) 46%,var(--gzw-ink-2));
  --gzw-decision:color-mix(in srgb,var(--dsw-alias-state-done-primary) 74%,var(--dsw-alias-label-primary));
  --gzw-decision-soft:color-mix(in srgb,var(--dsw-alias-state-done-primary) 10%,transparent);

  --gzw-shadow-sm:var(--dsw-shadow-lv1);
  --gzw-shadow-md:var(--dsw-shadow-lv2);
  --gzw-shadow-lg:var(--dsw-shadow-lv3);

  /* ---- 尺度 ---- */
  --gzw-s1:4px; --gzw-s2:8px; --gzw-s3:12px; --gzw-s4:16px; --gzw-s5:20px;
  --gzw-s6:24px; --gzw-s7:28px; --gzw-s8:32px; --gzw-s10:40px; --gzw-s12:48px;
  --gzw-font:var(--dsw-font-family);
  --gzw-serif:"Songti SC","STSong","Source Han Serif SC","Noto Serif CJK SC","SimSun","Georgia","Times New Roman",serif;
  --gzw-mono:var(--ds-font-family-code,"SF Mono",ui-monospace,Menlo,monospace);
  --gzw-dur:160ms;
  --gzw-ease:cubic-bezier(.2,0,0,1);

  height:100%;
  overflow:auto;
  box-sizing:border-box;
  display:flex;
  flex-direction:column;
  background:var(--gzw-page);
  color:var(--gzw-ink);
  font-family:var(--gzw-font);
  font-size:13.5px;
  line-height:1.6;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}
.gzw-root *{box-sizing:border-box}
.gzw-root button{font-family:inherit;color:inherit}
.gzw-root ::selection{background:var(--gzw-accent-soft);color:var(--gzw-ink)}
.gzw-root :focus-visible{outline:2px solid var(--gzw-accent);outline-offset:2px;border-radius:6px}
.gzw-root input,.gzw-root textarea{font-family:inherit}

/* ============================ 排版 ============================ */
.gzw-label{font-size:11px;line-height:16px;letter-spacing:.08em;color:var(--gzw-ink-3);font-weight:600}
.gzw-meta{font-size:12.5px;line-height:19px;color:var(--gzw-ink-2)}
.gzw-dim{font-size:11.5px;line-height:18px;color:var(--gzw-ink-3)}
.gzw-mono{font-family:var(--gzw-mono);font-size:11.5px;line-height:18px;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.gzw-num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.gzw-muted{color:var(--gzw-ink-2);font-size:13px;line-height:1.7}
.gzw-error{color:var(--gzw-danger);font-size:12.5px;line-height:1.7}
.gzw-warn{color:var(--gzw-warn);font-size:12.5px;line-height:1.7}
.gzw-ok{color:var(--gzw-ok);font-size:12.5px;line-height:1.7}
.gzw-row{display:flex;align-items:center;gap:var(--gzw-s2);flex-wrap:wrap}
.gzw-row.tight{gap:var(--gzw-s1)}
.gzw-row.between{justify-content:space-between}
.gzw-spacer{flex:1}
.gzw-truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ============================ 顶栏 ============================ */
.gzw-top{
  flex:none;position:sticky;top:0;z-index:30;
  background:color-mix(in srgb,var(--gzw-page) 82%,transparent);
  backdrop-filter:blur(20px) saturate(140%);
  -webkit-backdrop-filter:blur(20px) saturate(140%);
  border-bottom:1px solid var(--gzw-line-soft);
}
.gzw-top-inner{
  max-width:1200px;margin:0 auto;padding:0 var(--gzw-s8);
  height:56px;display:flex;align-items:center;gap:var(--gzw-s7);
}
.gzw-brand{display:flex;align-items:center;gap:9px;flex:none}
.gzw-logo{
  width:24px;height:24px;border-radius:7px;display:grid;place-items:center;
  color:var(--gzw-ink);background:var(--gzw-surface-2);border:1px solid var(--gzw-line-soft);flex:none;
}
.gzw-brand-title{font-size:13px;font-weight:600;letter-spacing:.005em;white-space:nowrap}
.gzw-brand-sub{font-family:var(--gzw-mono);font-size:10.5px;color:var(--gzw-ink-3);letter-spacing:0;margin-left:1px}

.gzw-nav{display:flex;align-items:center;gap:22px;height:100%}
.gzw-tab{
  appearance:none;border:0;background:transparent;color:var(--gzw-ink-2);
  font-size:13px;line-height:20px;padding:0;height:100%;cursor:pointer;position:relative;
  display:inline-flex;align-items:center;gap:5px;white-space:nowrap;
  transition:color var(--gzw-dur) var(--gzw-ease);
}
.gzw-tab:hover{color:var(--gzw-ink)}
.gzw-tab.on{color:var(--gzw-ink);font-weight:600}
.gzw-tab.on::after{content:"";position:absolute;left:0;right:0;bottom:15px;height:2px;background:var(--gzw-accent);border-radius:2px}
.gzw-tab-count{font-family:var(--gzw-mono);font-size:10.5px;color:var(--gzw-ink-3);font-variant-numeric:tabular-nums}
.gzw-tab.on .gzw-tab-count{color:var(--gzw-accent)}

.gzw-top-right{margin-left:auto;display:flex;align-items:center;gap:var(--gzw-s2);flex:none}
.gzw-status{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--gzw-ink-3);white-space:nowrap;padding:4px 2px}
.gzw-status-dot{width:6px;height:6px;border-radius:50%;background:var(--gzw-ok);flex:none}
.gzw-status.busy .gzw-status-dot{animation:gzw-pulse 1.6s var(--gzw-ease) infinite}
.gzw-status.paused .gzw-status-dot{background:var(--gzw-ink-3)}
.gzw-status.warn .gzw-status-dot{background:var(--gzw-warn)}
@keyframes gzw-pulse{0%,100%{opacity:1}50%{opacity:.3}}
.gzw-icon-btn{
  appearance:none;width:30px;height:30px;display:grid;place-items:center;
  border-radius:8px;border:1px solid transparent;background:transparent;color:var(--gzw-ink-3);cursor:pointer;
  transition:background var(--gzw-dur) var(--gzw-ease),color var(--gzw-dur) var(--gzw-ease),border-color var(--gzw-dur) var(--gzw-ease);
}
.gzw-icon-btn:hover{color:var(--gzw-ink);background:var(--gzw-surface-2);border-color:var(--gzw-line-soft)}
.gzw-icon-btn[disabled]{opacity:.35;cursor:default}

/* ============================ 页面骨架 ============================ */
.gzw-content{max-width:1200px;width:100%;margin:0 auto;padding:0 var(--gzw-s8) 72px;flex:1 0 auto}
.gzw-sec{display:flex;flex-direction:column}
.gzw-panel{border-top:1px solid var(--gzw-line-soft);padding:var(--gzw-s6) 0}
.gzw-panel:first-child{border-top:0;padding-top:0}
.gzw-panel-head{display:flex;align-items:center;gap:var(--gzw-s3);margin-bottom:var(--gzw-s4);min-height:22px}
.gzw-panel-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;letter-spacing:.005em}
.gzw-panel-title .gzw-panel-ico{color:var(--gzw-ink-3);display:inline-flex}
.gzw-panel-sub{font-size:11.5px;color:var(--gzw-ink-3)}
.gzw-panel-actions{margin-left:auto;display:flex;align-items:center;gap:var(--gzw-s2)}
.gzw-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,1fr);gap:var(--gzw-s9,40px);align-items:start}
.gzw-grid.even{grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gzw-s8)}
.gzw-grid.three{grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gzw-s7)}
.gzw-stack{display:flex;flex-direction:column;gap:var(--gzw-s6);min-width:0}

/* ============================ 报头 ============================ */
.gzw-pagehead{display:flex;gap:var(--gzw-s10);align-items:flex-start;padding:var(--gzw-s10) 0 var(--gzw-s6)}
.gzw-ph-main{min-width:0;flex:1}
.gzw-eyebrow{
  display:flex;align-items:center;gap:8px;margin-bottom:14px;
  font-size:11px;line-height:16px;letter-spacing:.09em;color:var(--gzw-ink-3);
}
.gzw-eyebrow b{color:var(--gzw-accent);font-weight:600;letter-spacing:.06em}
.gzw-eyebrow-dot{width:5px;height:5px;border-radius:50%;background:var(--gzw-accent);flex:none}
.gzw-eyebrow-sep{color:var(--gzw-line-strong)}
.gzw-ptitle{
  margin:0;font-family:var(--gzw-serif);font-size:30px;line-height:1.42;font-weight:600;
  letter-spacing:.005em;color:var(--gzw-ink);max-width:24em;text-wrap:balance;
}
.gzw-ptitle.sm{font-size:23px;line-height:1.45;letter-spacing:.01em;max-width:32em}
.gzw-psub{margin-top:10px;font-size:13px;color:var(--gzw-ink-2);line-height:1.75;max-width:46em}
.gzw-pmeta{display:flex;align-items:center;gap:var(--gzw-s2) var(--gzw-s3);flex-wrap:wrap;margin-top:18px;font-size:12px;color:var(--gzw-ink-3)}
.gzw-pmeta b{color:var(--gzw-ink-2);font-weight:500}
.gzw-pmeta-sep{width:3px;height:3px;border-radius:50%;background:var(--gzw-line-strong);flex:none}
.gzw-ph-side{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:9px;text-align:right;padding-top:6px;min-width:120px}
.gzw-next{font-size:12.5px;color:var(--gzw-ink-3);white-space:nowrap}
.gzw-next b{color:var(--gzw-ink-2);font-weight:600;margin-left:2px}


/* ============================ 进度轨 ============================ */
.gzw-stageblock{padding:var(--gzw-s2) 0 var(--gzw-s5);border-bottom:1px solid var(--gzw-line-soft)}
.gzw-rail{display:flex;align-items:stretch;gap:10px;width:100%}
.gzw-rail-step{
  appearance:none;background:transparent;border:0;padding:0;cursor:pointer;
  display:flex;flex-direction:column;gap:9px;flex:1 1 0;min-width:0;text-align:left;
}
.gzw-rail-bar{height:2px;border-radius:2px;background:var(--gzw-surface-3);transition:background var(--gzw-dur) var(--gzw-ease)}
.gzw-rail-step.done .gzw-rail-bar{background:color-mix(in srgb,var(--gzw-accent) 46%,transparent)}
.gzw-rail-step.active .gzw-rail-bar{background:var(--gzw-accent);height:3px;margin-top:-.5px}
.gzw-rail-name{
  font-size:12px;line-height:16px;color:var(--gzw-ink-3);white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;transition:color var(--gzw-dur) var(--gzw-ease);
}
.gzw-rail-step.done .gzw-rail-name{color:var(--gzw-ink-2)}
.gzw-rail-step.active .gzw-rail-name{color:var(--gzw-ink);font-weight:600}
.gzw-rail-step:hover .gzw-rail-name{color:var(--gzw-ink)}
.gzw-rail-meta{display:flex;align-items:center;gap:var(--gzw-s3);margin-top:12px;font-size:11.5px;color:var(--gzw-ink-3)}

/* ============================ 命令条 ============================ */
.gzw-toolbar{
  display:flex;align-items:center;gap:var(--gzw-s2);flex-wrap:wrap;
  padding:var(--gzw-s4) 0 var(--gzw-s5);
}
.gzw-toolbar-state{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--gzw-ink-3);white-space:nowrap}

/* ============================ 控件 ============================ */
.gzw-btn{
  appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;
  border:1px solid var(--gzw-line-strong);background:var(--gzw-surface);color:var(--gzw-ink);
  border-radius:8px;height:30px;padding:0 12px;font-size:12.5px;font-weight:500;line-height:1;cursor:pointer;white-space:nowrap;
  transition:background var(--gzw-dur) var(--gzw-ease),border-color var(--gzw-dur) var(--gzw-ease),color var(--gzw-dur) var(--gzw-ease),opacity var(--gzw-dur) var(--gzw-ease);
}
.gzw-btn:hover:not([disabled]){background:var(--gzw-surface-2);border-color:var(--gzw-line-strong)}
.gzw-btn:active:not([disabled]){transform:translateY(.5px)}
.gzw-btn[disabled]{opacity:.4;cursor:default}
.gzw-btn.brand{background:var(--dsw-alias-button-primary-fill);border-color:transparent;color:var(--dsw-alias-label-primary-foreground);font-weight:600}
.gzw-btn.brand:hover:not([disabled]){background:var(--dsw-alias-button-primary-hover);border-color:transparent}
.gzw-btn.danger{color:var(--gzw-danger);border-color:var(--gzw-danger-line);background:transparent}
.gzw-btn.danger:hover:not([disabled]){background:var(--gzw-danger-soft)}
.gzw-btn.ghost{border-color:transparent;background:transparent;color:var(--gzw-ink-2)}
.gzw-btn.ghost:hover:not([disabled]){background:var(--gzw-surface-2);color:var(--gzw-ink);border-color:transparent}
.gzw-btn.sm{height:26px;padding:0 9px;font-size:11.5px;border-radius:7px;gap:5px}
.gzw-btn.wide{width:100%}
.gzw-btn-ico{display:inline-flex;opacity:.85}
.gzw-btn.brand .gzw-btn-ico{opacity:.95}

.gzw-chip{
  display:inline-flex;align-items:center;gap:5px;border:1px solid var(--gzw-line-soft);
  background:var(--gzw-surface-2);border-radius:6px;padding:1px 7px;
  font-size:11px;line-height:17px;color:var(--gzw-ink-2);white-space:nowrap;font-weight:500;
}
.gzw-chip b{color:var(--gzw-ink);font-weight:600}
.gzw-chip.accent{background:var(--gzw-accent-soft);color:var(--gzw-accent-strong);border-color:transparent}
.gzw-chip.accent b{color:inherit}
.gzw-chip.warn{background:var(--gzw-warn-soft);color:var(--gzw-warn);border-color:transparent}
.gzw-chip.danger{background:var(--gzw-danger-soft);color:var(--gzw-danger);border-color:transparent}
.gzw-chip.info{background:var(--gzw-info-soft);color:var(--gzw-info);border-color:transparent}
.gzw-chip.decision{background:var(--gzw-decision-soft);color:var(--gzw-decision);border-color:transparent}

.gzw-seg{display:inline-flex;gap:2px;padding:3px;border-radius:10px;background:var(--gzw-surface-2);border:1px solid var(--gzw-line-soft)}
.gzw-seg button{
  appearance:none;border:0;background:transparent;color:var(--gzw-ink-3);cursor:pointer;
  font-size:12px;line-height:18px;padding:3px 11px;border-radius:7px;white-space:nowrap;
  transition:background var(--gzw-dur) var(--gzw-ease),color var(--gzw-dur) var(--gzw-ease),box-shadow var(--gzw-dur) var(--gzw-ease);
}
.gzw-seg button:hover{color:var(--gzw-ink-2)}
.gzw-seg button.on{background:var(--gzw-surface);color:var(--gzw-ink);font-weight:600;box-shadow:var(--gzw-shadow-sm)}

.gzw-input,.gzw-textarea{
  width:100%;border:1px solid var(--gzw-line-strong);border-radius:8px;
  background:var(--gzw-surface);color:var(--gzw-ink);
  padding:6px 10px;font-size:12.5px;line-height:20px;outline:none;
  transition:border-color var(--gzw-dur) var(--gzw-ease),box-shadow var(--gzw-dur) var(--gzw-ease);
}
.gzw-input:focus,.gzw-textarea:focus{border-color:var(--gzw-accent-line);box-shadow:0 0 0 3px var(--gzw-accent-soft)}
.gzw-input::placeholder,.gzw-textarea::placeholder{color:var(--gzw-ink-3)}
.gzw-textarea{min-height:64px;resize:vertical;line-height:1.7}
.gzw-input.sm{width:112px;padding:4px 9px}

.gzw-note{
  border:1px solid var(--gzw-line-soft);background:var(--gzw-surface-2);
  border-radius:10px;padding:11px 14px;
  font-size:12.5px;line-height:1.7;color:var(--gzw-ink-2);
}
.gzw-note.warn{border-color:var(--gzw-warn-line);background:var(--gzw-warn-soft);color:var(--gzw-ink-2)}
.gzw-note.danger{border-color:var(--gzw-danger-line);background:var(--gzw-danger-soft);color:var(--gzw-ink-2)}
.gzw-note.plain{border-color:var(--gzw-line-soft);background:var(--gzw-surface-2);color:var(--gzw-ink-2)}

.gzw-divider{height:1px;background:var(--gzw-line-soft);margin:var(--gzw-s4) 0}

/* ============================ 指标条 ============================ */
.gzw-strip{display:flex;align-items:flex-start;flex-wrap:wrap;gap:0}
.gzw-strip-item{padding:1px var(--gzw-s5);border-left:1px solid var(--gzw-line-soft);min-width:0}
.gzw-strip-item:first-child{padding-left:0;border-left:0}
.gzw-strip-k{font-size:11px;line-height:16px;letter-spacing:.03em;color:var(--gzw-ink-3)}
.gzw-strip-v{font-size:21px;font-weight:600;letter-spacing:-.015em;font-variant-numeric:tabular-nums;font-feature-settings:"tnum";line-height:1.25;margin-top:5px;white-space:nowrap}
.gzw-strip-v small{font-size:11.5px;font-weight:500;color:var(--gzw-ink-3);margin-left:3px;letter-spacing:0}
.gzw-strip-sub{font-size:11px;line-height:17px;color:var(--gzw-ink-3);margin-top:2px;white-space:nowrap}
.gzw-statblock{padding:var(--gzw-s4) 0}

/* ============================ 稿纸 ============================ */
.gzw-sheet{
  max-width:820px;
  background:var(--gzw-surface);
  border:1px solid var(--gzw-line);border-radius:14px;
  padding:var(--gzw-s8) var(--gzw-s10);box-shadow:var(--gzw-shadow-sm);
}
.gzw-sheet-head{margin-bottom:var(--gzw-s5);padding-bottom:var(--gzw-s4);border-bottom:1px solid var(--gzw-line-soft)}
.gzw-sheet-title{font-family:var(--gzw-serif);font-size:21px;font-weight:600;letter-spacing:.01em;line-height:1.5;margin-bottom:6px}
.gzw-sheet-meta{font-size:11.5px;color:var(--gzw-ink-3);line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.gzw-md{font-size:13.5px;line-height:1.85;color:var(--gzw-ink-2)}
.gzw-sheet .gzw-md{font-family:var(--gzw-serif);font-size:16.5px;line-height:2.05;letter-spacing:.008em;color:var(--gzw-ink)}
.gzw-md-p{margin:0 0 13px}
.gzw-sheet .gzw-md-p{margin:0 0 20px;text-align:justify}
.gzw-md-p:last-child{margin-bottom:0}
.gzw-md-p.hit,.gzw-md-q.hit{background:var(--gzw-warn-soft);border-radius:4px;box-shadow:0 0 0 6px var(--gzw-warn-soft)}
.gzw-md-h{font-weight:600;margin:26px 0 10px;line-height:1.5;letter-spacing:.005em;color:var(--gzw-ink)}
.gzw-sheet .gzw-md-h{font-family:var(--gzw-serif);letter-spacing:.01em}
.gzw-md-h:first-child{margin-top:0}
.gzw-md-h1{font-size:20px}
.gzw-md-h2{font-size:17px}
.gzw-md-h3{font-size:15.5px}
.gzw-md-h4{font-size:14px}
.gzw-md-q{border-left:2px solid var(--gzw-accent-line);margin:0 0 13px;padding:2px 0 2px 14px;color:var(--gzw-ink-2)}
.gzw-md-ul{margin:0 0 13px;padding-left:20px}
.gzw-md-ul li{margin-bottom:5px}
.gzw-md-ul li::marker{color:var(--gzw-ink-3)}
.gzw-md-code{margin:0 0 13px;padding:12px 14px;border-radius:9px;background:var(--gzw-surface-2);overflow:auto;font-family:var(--gzw-mono);font-size:11.5px;line-height:1.75;color:var(--gzw-ink-2)}
.gzw-md code{font-family:var(--gzw-mono);font-size:.86em;padding:1px 5px;border-radius:4px;background:var(--gzw-surface-2);color:var(--gzw-accent-strong)}
.gzw-md-hr{border:none;border-top:1px solid var(--gzw-line-soft);margin:24px 0}
.gzw-md-tablewrap{overflow-x:auto;margin:0 0 13px;border:1px solid var(--gzw-line-soft);border-radius:9px}
.gzw-md-table{width:100%;border-collapse:collapse;font-size:12px;line-height:1.7}
.gzw-md-table th,.gzw-md-table td{padding:7px 11px;border-bottom:1px solid var(--gzw-line-soft);white-space:nowrap}
.gzw-md-table th{background:var(--gzw-surface-2);color:var(--gzw-ink-2);font-weight:600;font-size:11px}
.gzw-md-table tr:last-child td{border-bottom:0}
.gzw-md-table td{color:var(--gzw-ink-2)}
.gzw-md strong{font-weight:600;color:var(--gzw-ink)}
.gzw-md a{color:var(--gzw-accent-strong);text-decoration:none;border-bottom:1px solid var(--gzw-accent-line)}

/* ============================ 图表 ============================ */
.gzw-hist{display:flex;align-items:flex-end;gap:var(--gzw-s4);height:124px;padding-top:var(--gzw-s2)}
.gzw-hist-col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;height:100%;min-width:0}
.gzw-hist-track{display:flex;align-items:flex-end;justify-content:center;width:100%;height:76px}
.gzw-hist-bar{width:min(100%,38px);flex:none;border-radius:3px 3px 0 0;background:color-mix(in srgb,var(--gzw-accent) 16%,transparent);border-top:2px solid var(--gzw-accent);min-height:2px;transition:height var(--gzw-dur) var(--gzw-ease)}
.gzw-hist-bar.long{border-top-color:var(--gzw-warn);background:var(--gzw-warn-soft)}
.gzw-hist-label{font-size:10.5px;color:var(--gzw-ink-3);white-space:nowrap;font-variant-numeric:tabular-nums}
.gzw-hist-count{font-size:11.5px;color:var(--gzw-ink-2);font-variant-numeric:tabular-nums;font-weight:600}

.gzw-rhythm{display:flex;align-items:flex-end;gap:3px;height:44px;position:relative;padding-top:4px}
.gzw-rhythm-bar{flex:1;min-width:2px;background:color-mix(in srgb,var(--gzw-accent) 26%,transparent);border-radius:2px 2px 0 0}
.gzw-rhythm-bar.over{background:color-mix(in srgb,var(--gzw-warn) 40%,transparent)}
.gzw-rhythm-line{position:absolute;left:0;right:0;border-top:1px dashed var(--gzw-warn-line)}
.gzw-rhythm-cap{display:flex;justify-content:space-between;gap:12px;margin-top:8px;font-size:11px;color:var(--gzw-ink-3);line-height:1.5}

.gzw-bars{display:flex;flex-direction:column;gap:9px;min-width:0}
.gzw-bar-row{display:grid;grid-template-columns:minmax(72px,128px) minmax(0,1fr) 68px;align-items:center;gap:var(--gzw-s3);font-size:11.5px}
.gzw-grid.three .gzw-bar-row{grid-template-columns:minmax(60px,92px) minmax(0,1fr) 44px;gap:var(--gzw-s2)}
.gzw-bar-label{color:var(--gzw-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gzw-bar-track{display:block;height:5px;border-radius:999px;background:var(--gzw-surface-3);overflow:hidden}
.gzw-bar-fill{display:block;height:100%;border-radius:999px;background:var(--gzw-warn);opacity:.8;transition:width var(--gzw-dur) var(--gzw-ease)}
.gzw-bar-fill.fail{background:var(--gzw-danger)}
.gzw-bar-fill.info{background:var(--gzw-info);opacity:.5}
.gzw-bar-fill.tool{background:var(--gzw-tool);opacity:.75}
.gzw-bar-count{text-align:right;color:var(--gzw-ink-2);font-variant-numeric:tabular-nums;font-family:var(--gzw-mono);font-size:11px}
.gzw-bar-count small{color:var(--gzw-ink-3)}

.gzw-gauge{position:relative;display:grid;place-items:center}
.gzw-gauge-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}
.gzw-gauge-value{font-size:30px;font-weight:600;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1}
.gzw-gauge-cap{font-size:10.5px;letter-spacing:.06em;color:var(--gzw-ink-3);max-width:92px;text-align:center;line-height:1.4}
.gzw-gauge-scale{display:flex;justify-content:space-between;width:100%;font-size:10.5px;color:var(--gzw-ink-3);margin-top:6px;font-variant-numeric:tabular-nums}

/* 事件分桶柱 */
.gzw-mbars{display:flex;align-items:flex-end;gap:2px;margin-top:4px}
.gzw-mbars-col{flex:1 1 0;height:100%;display:flex;align-items:flex-end;min-width:2px}
.gzw-mbars-bar{display:block;width:100%;min-height:3px;border-radius:2px 2px 0 0;background:color-mix(in srgb,var(--gzw-ink) 30%,transparent);transition:background var(--gzw-dur) var(--gzw-ease)}
.gzw-mbars-col:hover .gzw-mbars-bar{background:var(--gzw-ink)}
.gzw-mbars-bar.zero{background:var(--gzw-surface-3)}

/* 体检：窄栏里纵向排，分数在上、规则在下 */
.gzw-gate{display:flex;flex-direction:column;gap:var(--gzw-s4)}
.gzw-gate-score{display:flex;align-items:center;gap:20px}
.gzw-gate-meta{display:flex;flex-direction:column;gap:8px;min-width:0}
.gzw-gate .gzw-gauge-scale{max-width:120px}
/* 构成：一条堆叠带 + 图例 */
.gzw-compose{display:flex;flex-direction:column;gap:12px}
.gzw-compose-bar{display:flex;height:10px;border-radius:999px;overflow:hidden;background:var(--gzw-surface-3)}
.gzw-compose-bar i{display:block;height:100%;min-width:2px}
.gzw-legend{display:flex;flex-wrap:wrap;gap:6px 18px}
.gzw-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--gzw-ink-2);white-space:nowrap}
.gzw-legend-dot{width:7px;height:7px;border-radius:2px;flex:none}
.gzw-legend-num{font-family:var(--gzw-mono);font-size:10.5px;color:var(--gzw-ink-3);font-variant-numeric:tabular-nums}

/* ============================ 列表 ============================ */
.gzw-list{display:flex;flex-direction:column}
.gzw-li{display:flex;align-items:center;gap:var(--gzw-s3);padding:10px 12px;border-bottom:1px solid var(--gzw-line-soft);min-width:0;margin:0 -8px;border-radius:8px;transition:background var(--gzw-dur) var(--gzw-ease)}
.gzw-li:last-child{border-bottom:0}
.gzw-li:hover{background:var(--gzw-surface-2)}
.gzw-li-main{flex:1;min-width:0}
.gzw-li-title{font-size:12.5px;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:6px;color:var(--gzw-ink)}
.gzw-li-sub{font-family:var(--gzw-mono);font-size:10.5px;color:var(--gzw-ink-3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gzw-li-tail{display:flex;align-items:center;gap:var(--gzw-s3);flex:none}
.gzw-sizebar{width:48px;height:3px;border-radius:999px;background:var(--gzw-surface-3);overflow:hidden;flex:none}
.gzw-sizebar span{display:block;height:100%;background:var(--gzw-accent);opacity:.55;border-radius:999px}
.gzw-pill{font-family:var(--gzw-mono);font-size:10px;line-height:16px;padding:0 5px;border-radius:5px;background:transparent;border:1px solid var(--gzw-line);color:var(--gzw-ink-3);white-space:nowrap}
.gzw-avatar{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-size:11px;font-weight:600;flex:none;color:var(--gzw-ink-2);background:var(--gzw-surface-2);border:1px solid var(--gzw-line-soft)}
.gzw-avatar.on{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}

/* ============================ 时间轴 ============================ */
.gzw-timeline{display:flex;flex-direction:column}
.gzw-tl-row{display:grid;grid-template-columns:56px 16px minmax(0,1fr);position:relative}
.gzw-tl-time{font-family:var(--gzw-mono);font-size:10px;color:var(--gzw-ink-3);padding:10px 8px 0 0;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.gzw-tl-rail{position:relative;display:flex;justify-content:center;padding-top:11px}
.gzw-tl-rail::before{content:"";position:absolute;top:0;bottom:0;width:1px;background:var(--gzw-line-soft);left:50%}
.gzw-tl-row:first-child .gzw-tl-rail::before{top:15px}
.gzw-tl-row:last-child .gzw-tl-rail::before{bottom:auto;height:15px}
.gzw-tl-node{position:relative;width:6px;height:6px;border-radius:50%;background:var(--gzw-ink-3);margin-top:3px;box-shadow:0 0 0 3px var(--gzw-page);z-index:1;flex:none}
.gzw-tl-node.user{background:var(--gzw-decision)}
.gzw-tl-node.review{background:var(--gzw-accent);box-shadow:0 0 0 3px var(--gzw-accent-soft)}
.gzw-tl-node.tool{background:var(--gzw-tool)}
.gzw-tl-node.error{background:var(--gzw-danger)}
.gzw-tl-node.decision{background:var(--gzw-warn)}
.gzw-tl-node.result{background:var(--gzw-decision)}
.gzw-tl-node.say{background:var(--gzw-accent)}
.gzw-tl-node.system,.gzw-tl-node.turn,.gzw-tl-node.command{background:var(--gzw-line-strong)}
.gzw-tl-body{padding:7px 0 13px 10px;min-width:0}
.gzw-tl-line{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px}
.gzw-tl-kind{font-size:10px;letter-spacing:.02em;line-height:16px;padding:0 6px;border-radius:5px;background:var(--gzw-surface-2);color:var(--gzw-ink-3);font-weight:500;white-space:nowrap;border:1px solid var(--gzw-line-soft)}
.gzw-tl-kind.user,.gzw-tl-kind.review,.gzw-tl-kind.say{background:var(--gzw-accent-soft);color:var(--gzw-accent-strong);border-color:transparent}
.gzw-tl-kind.tool{background:var(--gzw-surface-2);color:var(--gzw-ink-2);border-color:var(--gzw-line-soft)}
.gzw-tl-kind.error{background:var(--gzw-danger-soft);color:var(--gzw-danger);border-color:transparent}
.gzw-tl-kind.decision{background:var(--gzw-warn-soft);color:var(--gzw-warn);border-color:transparent}
.gzw-tl-kind.result{background:var(--gzw-decision-soft);color:var(--gzw-decision);border-color:transparent}
.gzw-tl-text{font-size:12px;line-height:1.72;color:var(--gzw-ink-2);word-break:break-word;white-space:pre-wrap;max-height:5.16em;overflow:hidden;position:relative}
.gzw-tl-text.open{max-height:none}
.gzw-tl-toggle{position:absolute;right:0;bottom:0;font-size:10.5px;color:var(--gzw-accent-strong);background:linear-gradient(90deg,transparent,var(--gzw-page) 42%);padding-left:22px;cursor:pointer}

/* ============================ 明细 / 问题 ============================ */
.gzw-issues{display:flex;flex-direction:column;max-height:264px;overflow:auto}
.gzw-issue{
  display:grid;grid-template-columns:44px minmax(0,1fr);gap:var(--gzw-s2);
  font-size:11.5px;line-height:1.65;padding:7px 8px;margin:0;border:0;border-bottom:1px solid var(--gzw-line-soft);
  text-align:left;width:100%;background:transparent;color:inherit;cursor:pointer;border-radius:7px;
  transition:background var(--gzw-dur) var(--gzw-ease);
}
.gzw-issue:hover{background:var(--gzw-surface-2)}
.gzw-issue .ln{color:var(--gzw-ink-3);font-family:var(--gzw-mono);font-size:10px;padding-top:2px}
.gzw-issue .rule{color:var(--gzw-warn);font-weight:600;margin-right:6px}
.gzw-issue.fail .rule{color:var(--gzw-danger)}
.gzw-issue .tx{color:var(--gzw-ink-2)}

/* ============================ 检查清单 ============================ */
.gzw-checklist{display:flex;flex-direction:column}
.gzw-check{display:flex;align-items:center;gap:var(--gzw-s3);padding:11px 0;border-bottom:1px solid var(--gzw-line-soft)}
.gzw-check:last-child{border-bottom:0}
.gzw-check-ico{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--gzw-ok-soft);color:var(--gzw-ok)}
.gzw-check-ico.todo{background:var(--gzw-surface-2);color:var(--gzw-ink-3)}
.gzw-check-ico.warn{background:var(--gzw-warn-soft);color:var(--gzw-warn)}
.gzw-check-ico.danger{background:var(--gzw-danger-soft);color:var(--gzw-danger)}
.gzw-check-main{flex:1;min-width:0}
.gzw-check-title{font-size:12.5px;line-height:1.45}
.gzw-check-sub{font-family:var(--gzw-mono);font-size:10px;color:var(--gzw-ink-3);margin-top:2px}
.gzw-check-val{font-size:11.5px;color:var(--gzw-ink-2);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--gzw-mono)}

/* ============================ 审阅条 ============================ */
.gzw-review{
  display:flex;align-items:center;gap:var(--gzw-s4);flex-wrap:wrap;
  border:1px solid var(--gzw-accent-line);background:var(--gzw-accent-soft);
  border-radius:11px;padding:13px 16px;
}
.gzw-review.locked{border-color:var(--gzw-warn-line);background:var(--gzw-warn-soft)}
.gzw-review-main{flex:1;min-width:220px}
.gzw-review-title{font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:6px;color:var(--gzw-ink)}
.gzw-review-sub{font-size:11.5px;color:var(--gzw-ink-2);margin-top:3px;line-height:1.65}
.gzw-review-actions{display:flex;gap:var(--gzw-s2);align-items:center;flex-wrap:wrap}
.gzw-receipt{margin-top:var(--gzw-s3);border:1px solid var(--gzw-line-soft);border-radius:10px;padding:12px 14px;background:var(--gzw-surface-2);font-size:12px;line-height:1.7}
.gzw-receipt.ok{border-color:var(--gzw-ok-soft);background:var(--gzw-ok-soft)}
.gzw-receipt.bad{border-color:var(--gzw-danger-line);background:var(--gzw-danger-soft)}

/* ============================ 手机预览 ============================ */
.gzw-phone{width:min(100%,330px);margin:0 auto;border-radius:32px;border:1px solid var(--gzw-line-strong);background:var(--gzw-surface-2);padding:11px 8px 9px;box-shadow:var(--gzw-shadow-lg)}
.gzw-phone-top{display:flex;justify-content:center;margin-bottom:7px}
.gzw-phone-notch{width:56px;height:4px;border-radius:99px;background:color-mix(in srgb,var(--gzw-ink-3) 32%,transparent)}
.gzw-phone-screen{height:580px;border-radius:23px;overflow:hidden;background:#fff;position:relative;box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-static-neutral-1000) 8%,transparent)}
.gzw-phone-screen iframe{width:100%;height:100%;border:0;display:block;background:#fff}
.gzw-phone-label{text-align:center;font-size:10px;color:var(--gzw-ink-3);margin-top:8px;letter-spacing:.02em}

/* ============================ 配图 ============================ */
.gzw-images{display:grid;grid-template-columns:repeat(auto-fill,minmax(184px,1fr));gap:var(--gzw-s3)}
.gzw-image{border:1px solid var(--gzw-line);border-radius:12px;overflow:hidden;background:var(--gzw-surface);display:flex;flex-direction:column;transition:box-shadow var(--gzw-dur) var(--gzw-ease)}
.gzw-image:hover{box-shadow:var(--gzw-shadow-md)}
.gzw-image-thumb{position:relative;aspect-ratio:16/10;display:grid;place-items:center;background:var(--gzw-surface-2);color:var(--gzw-ink-3);overflow:hidden}
.gzw-image-ratio{position:absolute;left:8px;top:8px;font-family:var(--gzw-mono);font-size:9.5px;line-height:15px;padding:0 5px;border-radius:5px;background:color-mix(in srgb,var(--gzw-surface) 80%,transparent);color:var(--gzw-ink-2)}
.gzw-image-state{position:absolute;right:8px;top:8px;font-size:9.5px;line-height:15px;padding:0 6px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;background:color-mix(in srgb,var(--gzw-surface) 84%,transparent);color:var(--gzw-ok)}
.gzw-image-state i{width:5px;height:5px;border-radius:50%;background:currentColor;display:block}
.gzw-image-state.running{color:var(--gzw-warn)}
.gzw-image-state.pending{color:var(--gzw-ink-3)}
.gzw-image-body{padding:9px 11px 10px;display:flex;flex-direction:column;gap:5px}
.gzw-image-role{font-size:12px;font-weight:600;line-height:1.4}
.gzw-image-meta{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.gzw-tag{display:inline-block;padding:0 5px;border-radius:4px;background:var(--gzw-surface-2);color:var(--gzw-ink-3);font-size:9.5px;line-height:16px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid var(--gzw-line-soft)}
.gzw-budget-track{height:8px;border-radius:999px;background:var(--gzw-surface-3);overflow:hidden;display:flex}
.gzw-budget-fill{height:100%;background:var(--gzw-accent);opacity:.85}
.gzw-budget-fill.spent{background:color-mix(in srgb,var(--gzw-accent) 60%,var(--gzw-warn))}
.gzw-budget-legend{display:flex;gap:var(--gzw-s4);margin-top:8px;font-size:11px;color:var(--gzw-ink-2);flex-wrap:wrap}
.gzw-budget-legend i{width:6px;height:6px;border-radius:2px;display:inline-block;margin-right:5px}

/* ============================ 两栏 / 详情 ============================ */
.gzw-split{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:var(--gzw-s8);align-items:start}
.gzw-kv{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px var(--gzw-s5);font-size:12px;line-height:1.6}
.gzw-kv dt{color:var(--gzw-ink-3)}
.gzw-kv dd{margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis}

/* ---------- 补充：详情折叠 / 筛选条 / 稿纸头 ---------- */
.gzw-details{margin-top:var(--gzw-s2)}
.gzw-details>summary{cursor:pointer;font-size:11.5px;color:var(--gzw-ink-3);user-select:none;list-style:none;display:inline-flex;align-items:center;gap:5px}
.gzw-details>summary::-webkit-details-marker{display:none}
.gzw-details>summary::before{content:"▸";font-size:9px;transition:transform var(--gzw-dur) var(--gzw-ease);display:inline-block}
.gzw-details[open]>summary::before{transform:rotate(90deg)}
.gzw-details>summary:hover{color:var(--gzw-ink)}
.gzw-filters{display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin-bottom:var(--gzw-s4)}
.gzw-filter{
  display:inline-flex;align-items:center;gap:5px;border:1px solid transparent;background:transparent;
  color:var(--gzw-ink-3);border-radius:999px;padding:3px 10px;font-size:11.5px;line-height:18px;cursor:pointer;
  transition:background var(--gzw-dur) var(--gzw-ease),color var(--gzw-dur) var(--gzw-ease),border-color var(--gzw-dur) var(--gzw-ease);
}
.gzw-filter:hover{color:var(--gzw-ink-2);background:var(--gzw-surface-2)}
.gzw-filter.on{background:var(--dsw-alias-button-primary-fill);border-color:transparent;color:var(--dsw-alias-label-primary-foreground);font-weight:500}
.gzw-filter .c{font-family:var(--gzw-mono);font-size:10px;opacity:.65}
.gzw-sheet-head{margin-bottom:var(--gzw-s5);padding-bottom:var(--gzw-s4);border-bottom:1px solid var(--gzw-line-soft)}

/* 四库：页签行 + 三栏看板 */
.gzw-tabsline{display:flex;align-items:center;gap:var(--gzw-s3);padding:0 0 var(--gzw-s5)}
.gzw-doc{max-width:760px}
.gzw-column{max-width:820px}
.gzw-newarticle{display:grid;grid-template-columns:minmax(0,560px) 168px;gap:var(--gzw-s3);align-items:end;justify-content:start;padding:var(--gzw-s2) 0 var(--gzw-s5)}
.gzw-newarticle-main{min-width:0}
.gzw-composer{display:grid;grid-template-columns:minmax(0,1fr) 216px;gap:var(--gzw-s3);align-items:start}
.gzw-composer-side{display:flex;flex-direction:column;gap:var(--gzw-s2)}
/* 四库：三栏看板 */
.gzw-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gzw-s5)}
.gzw-board-col{min-width:0;border-top:1px solid var(--gzw-line);padding-top:var(--gzw-s3)}
.gzw-board-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.gzw-board-title{font-size:11px;letter-spacing:.1em;color:var(--gzw-ink-3);font-weight:600}
.gzw-board-count{font-family:var(--gzw-mono);font-size:10.5px;color:var(--gzw-ink-3)}
.gzw-board-col .gzw-li{margin:0;padding:9px 0;border-radius:0}
.gzw-board-hint{font-size:11.5px;line-height:1.7;color:var(--gzw-ink-3);padding:4px 0 10px}

.gzw-empty-ico{display:inline-flex;color:var(--gzw-ink-3)}
.gzw-gauge-scale{display:flex;justify-content:space-between;width:100%;font-size:10.5px;color:var(--gzw-ink-3);margin-top:5px;font-variant-numeric:tabular-nums}
.gzw-rhythm-cap{display:flex;justify-content:space-between;margin-top:5px;font-size:11px;color:var(--gzw-ink-3)}

/* ============================ 空态 / 提示 ============================ */
.gzw-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:var(--gzw-s8) var(--gzw-s4);text-align:center;color:var(--gzw-ink-3)}
.gzw-empty-mark{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--gzw-surface-2);color:var(--gzw-ink-3);border:1px solid var(--gzw-line-soft)}
.gzw-empty-title{font-size:12.5px;color:var(--gzw-ink-2);font-weight:600;display:flex;align-items:center;gap:6px}
.gzw-empty-text{font-size:11.5px;max-width:38em;line-height:1.75}
.gzw-empty-action{margin-top:2px}
.gzw-skel{background:linear-gradient(90deg,var(--gzw-surface-2) 25%,var(--gzw-surface-3) 37%,var(--gzw-surface-2) 63%);background-size:400% 100%;animation:gzw-shimmer 1.4s ease infinite;border-radius:5px}
@keyframes gzw-shimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}
.gzw-toast{
  position:fixed;left:50%;bottom:var(--gzw-s6);transform:translateX(-50%);z-index:60;
  display:flex;align-items:center;gap:7px;padding:8px 15px;border-radius:999px;
  background:var(--dsw-alias-toast-bg);color:var(--dsw-alias-toast-label);font-size:12px;font-weight:500;
  box-shadow:var(--gzw-shadow-lg);animation:gzw-toast-in var(--gzw-dur) var(--gzw-ease);
}
@keyframes gzw-toast-in{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
.gzw-footer{
  flex:none;max-width:1200px;width:100%;margin:0 auto;display:flex;align-items:center;gap:var(--gzw-s3);flex-wrap:wrap;
  padding:var(--gzw-s4) var(--gzw-s8) var(--gzw-s6);border-top:1px solid var(--gzw-line-soft);
  font-size:11px;color:var(--gzw-ink-3);
}
.gzw-footer .repo{font-family:var(--gzw-mono);font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.gzw-kbd{display:inline-block;min-width:18px;text-align:center;padding:1px 5px;border-radius:4px;border:1px solid var(--gzw-line-strong);background:var(--gzw-surface-2);color:var(--gzw-ink-2);font-family:var(--gzw-mono);font-size:10px}
.gzw-help-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px var(--gzw-s6)}
.gzw-help-list{display:flex;flex-direction:column;gap:10px}
.gzw-help-row{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--gzw-ink-2);min-width:0}
.gzw-help-row .gzw-kbd{flex:none;white-space:nowrap}
.gzw-help{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:color-mix(in srgb,var(--dsw-static-neutral-1000) 34%,transparent);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.gzw-help-card{width:min(560px,92vw);border:1px solid var(--gzw-line);border-radius:16px;background:var(--gzw-surface);box-shadow:var(--gzw-shadow-lg);padding:var(--gzw-s4) var(--gzw-s5) var(--gzw-s5)}
.gzw-help-head{display:flex;align-items:center;gap:12px;margin-bottom:var(--gzw-s4)}
.gzw-help-head .gzw-icon-btn{margin-left:auto}

/* ============================ 响应式 ============================ */
.gzw-root{container-type:inline-size}
@container (max-width:1120px){
  .gzw-grid,.gzw-grid.even,.gzw-grid.three{grid-template-columns:minmax(0,1fr);gap:var(--gzw-s6)}
  .gzw-split{grid-template-columns:minmax(0,1fr)}
  .gzw-ptitle{font-size:26px}
  .gzw-sheet{padding:var(--gzw-s6) var(--gzw-s7)}
  .gzw-content{padding:0 var(--gzw-s6) 64px}
  .gzw-board{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
}
@container (max-width:860px){
  .gzw-content{padding:0 var(--gzw-s4) 56px}
  .gzw-top-inner{padding:0 var(--gzw-s4);height:auto;min-height:52px;flex-wrap:wrap;gap:var(--gzw-s3);padding-top:10px;padding-bottom:10px}
  .gzw-nav{gap:16px;height:auto}
  .gzw-tab{height:24px}
  .gzw-tab.on::after{bottom:-2px}
  .gzw-pagehead{flex-direction:column;gap:var(--gzw-s4);padding-top:var(--gzw-s6)}
  .gzw-ph-side{align-items:flex-start;text-align:left;padding-top:0;flex-direction:row;flex-wrap:wrap;gap:12px 20px}
  .gzw-ptitle{font-size:23px}
  .gzw-ptitle.sm{font-size:20px}
  .gzw-strip-item{padding:0 var(--gzw-s4)}
  .gzw-sheet{padding:var(--gzw-s5) var(--gzw-s4)}
  .gzw-sheet .gzw-md{font-size:15.5px;line-height:1.95}
  .gzw-board{grid-template-columns:minmax(0,1fr)}
  .gzw-composer{grid-template-columns:minmax(0,1fr)}
  .gzw-newarticle{grid-template-columns:minmax(0,1fr)}
  .gzw-help-grid{grid-template-columns:minmax(0,1fr)}
  .gzw-footer{padding:var(--gzw-s4)}
}
@media (prefers-reduced-motion:reduce){
  .gzw-root *{animation:none !important;transition:none !important;scroll-behavior:auto !important}
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

    // 子 Agent 的会话不是「这一篇」的专用会话：既不能当读取源，也不能当指令通道，
    // 否则会命中 session/agent-busy（subagent 需要 parent address）。
    function isSubagentRow(row) {
      if (row === null || typeof row !== 'object') return false
      if (row.origin === 'subagent') return true
      if (row.parentSessionId !== undefined && row.parentSessionId !== null) return true
      const sub = row.projections?.values?.subagent
      return sub !== undefined && sub !== null
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
    function Btn({ children, onClick, variant, icon, disabled, title, wide, size, style }) {
      const classes = ['gzw-btn']
      if (variant) classes.push(variant)
      if (wide) classes.push('wide')
      if (size) classes.push(size)
      return h(
        'button',
        { type: 'button', className: classes.join(' '), onClick, disabled: disabled === true, title, style },
        icon ? h('span', { className: 'gzw-btn-ico' }, h(Icon, { name: icon, size: 14 })) : null,
        children,
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
          h('circle', { cx: box / 2, cy: box / 2, r: radius, fill: 'none', stroke: 'var(--gzw-surface-3)', strokeWidth: weight }),
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

    // 离散事件按时间分桶：柱子比折线更诚实，也不会画成一条平线
    function MiniBars({ values, height }) {
      const list = Array.isArray(values) ? values.filter((value) => typeof value === 'number') : []
      if (list.length === 0) return null
      const box = height ?? 56
      const max = Math.max(1, ...list)
      return h(
        'div',
        { className: 'gzw-mbars', style: { height: box } },
        ...list.map((value, index) =>
          h(
            'span',
            { className: 'gzw-mbars-col', key: index, title: '第 ' + (index + 1) + ' 段 · ' + value + ' 步' },
            h('span', { className: 'gzw-mbars-bar' + (value > 0 ? '' : ' zero'), style: { height: Math.max(2, (value / max) * 100) + '%' } }),
          ),
        ),
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
              h('span', { className: 'gzw-hist-track' }, h('span', { className: 'gzw-hist-bar' + (item.long ? ' long' : ''), style: { height: Math.max(2, (item.count / max) * 100) + '%' } })),
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
            h('span', { className: 'gzw-bar-track' }, h('span', { className: 'gzw-bar-fill tool', style: { width: Math.max(4, (item.count / max) * 100) + '%' } })),
            h('span', { className: 'gzw-bar-count' }, item.count),
          ),
        ),
        h('div', { className: 'gzw-rhythm-cap' }, h('span', { className: 'gzw-dim' }, '共 ' + total + ' 次工具调用')),
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
        icon ? h('div', { className: 'gzw-empty-mark' }, h(Icon, { name: icon, size: 15 })) : null,
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
      const [libTab, setLibTab] = React.useState('inbox')
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
          // 优先走宿主命令（直读磁盘，最准）；workspaceFiles 可能有缓存，
          // 写完立刻重读时会出现「文件已改、界面还是旧的」。
          const fallback = await execCommand('/gzh-read ' + relPath + ' --json')
          const data = parseJsonText(fallback.text)
          if (data !== null && data.ok === true) {
            return { ok: true, text: String(data.text || ''), lines: data.lines, bytes: data.bytes, path: relPath }
          }
          const direct = await readWorkspaceFile(prefix + relPath)
          if (direct.ok) return { ...direct, path: relPath }
          if (!fallback.ok) return { ok: false, error: fallback.text }
          if (data === null) return { ok: false, error: '宿主读取返回不是 JSON' }
          return { ok: false, error: String(data.code || data.error || '读取失败') }
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
        const pool = rows.filter((row) => !isSubagentRow(row) && (rootCwd !== '' ? sessionCwdOf(row) === rootCwd : true))
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
          const readable = rows.filter((row) => !isSubagentRow(row))
          const preferred = readable.find((row) => sessionCwdOf(row) === rootCwd) ?? readable[0] ?? rows[0]
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
        for (const lib of LIB_TABS) {
          if (lib.path === null) continue
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
          if (isSubagentRow(row)) return false
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
        return h('div', { className: 'gzw-dim' }, item.path + '　' + humanBytes(item.bytes) + '　' + formatWhen(item.mtimeMs))
      }

      function renderDoc(item, mode) {
        const doc = docs[item.path]
        if (doc === undefined) return h(Skeleton, { height: 160 })
        if (doc.ok !== true) return h('div', { className: 'gzw-error' }, '读取失败：' + readErrorText(doc.error))
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
          return h('pre', { className: 'gzw-mono', style: { maxHeight: '420px', overflow: 'auto', whiteSpace: 'pre-wrap' } }, pretty)
        }
        return h('div', { className: 'gzw-sheet' }, h(MarkdownView, { text: doc.text }))
      }

      function renderArtifactBlock(id, mode) {
        const item = artifactById(id)
        if (item === undefined) return h(Empty, { title: '还没有「' + (ARTIFACT_LABELS[id] ?? id) + '」产物', text: '这一阶段的产物还没生成。' })
        return h('div', { key: id }, artifactMeta(item), h('div', { style: { marginTop: 'var(--gzw-s3)' } }, renderDoc(item, mode)))
      }

// ---------------- 首次使用引导 ----------------
      function renderSetupGuide() {
        const steps = [
          { title: '复制配置模板', body: '把 config/*.example.yaml 复制成 config/*.yaml，填自己的文风、主题与发布凭证。', cmd: 'cp config/*.example.yaml config/' },
          { title: '跑一次自检', body: '确认工具链、配置与密钥占位符没问题（仓库脚本，不联网）。', cmd: 'python scripts/validate_repo.py' },
          { title: '绑定一个会话', body: '在「绑定」页把这一篇绑到专属会话，通过 / 退回才会生效。', cmd: null },
        ]
        return h(
          'div',
          { className: 'gzw-panel' },
          h(
            'div',
            { className: 'gzw-panel-head' },
            h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'alert', size: 14 }), '先把工作台接上'),
            h('div', { className: 'gzw-panel-sub' }, repoRoot === '' ? '还没找到 gzhflow 仓库' : stateError || '当前篇还没读到'),
          ),
          h(
            'div',
            { className: 'gzw-list' },
            ...steps.map((step) =>
              h(
                'div',
                { className: 'gzw-li', key: step.title },
                h(
                  'div',
                  { className: 'gzw-li-main' },
                  h('div', { className: 'gzw-li-title', style: { whiteSpace: 'normal' } }, h('b', {}, step.title), '　' + step.body),
                  step.cmd === null
                    ? null
                    : h(
                        'div',
                        { className: 'gzw-row tight', style: { marginTop: '6px' } },
                        h('code', { className: 'gzw-mono', style: { padding: '2px 6px', borderRadius: '4px', background: 'var(--gzw-surface-2)' } }, step.cmd),
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
          'div',
          { className: 'gzw-panel' },
          h(
            'div',
            { className: 'gzw-panel-head' },
            h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'book', size: 14 }), '第一次用？三十秒看懂这个面板'),
            h('div', { className: 'gzw-panel-actions' }, h(Btn, { size: 'sm', variant: 'ghost', icon: 'check', onClick: dismissOnboarding }, '知道了')),
          ),
          h(
            'div',
            { className: 'gzw-help-grid' },
            ...[
              ['总览', '当前篇、七阶段进度、下一步动作、正文与体检'],
              ['阶段', '这一阶段做什么、有什么产物、可跑的动作'],
              ['轨迹', 'Agent 干了什么：命令、工具、审阅往返与失败'],
              ['产物', '七阶段产物清单、产出时间线与预览'],
              ['库', 'inbox / voice / lessons / 手改记录 / 历史会话'],
              ['绑定', '把这篇绑到专属会话，通过 / 退回才会生效'],
            ].map((row) => h('div', { className: 'gzw-help-row', key: row[0] }, h('span', { className: 'gzw-kbd' }, row[0]), h('span', {}, row[1]))),
          ),
        )
      }

// ---------------- 跳转 ----------------
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
        setStageNo(2)
        setView('stage')
        window.setTimeout(() => {
          const node = document.querySelector('.gzw-root [data-line="' + line + '"]')
          if (node !== null) node.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }, 120)
      }

      // ---------------- 页头 ----------------
      // 所有页面共用一个页头：眉标 / 标题 / 一句话说明 / 元信息 / 右侧状态。
      function pageHead({ eyebrow, title, desc, meta, side, small }) {
        const raw = (Array.isArray(eyebrow) ? eyebrow : [eyebrow]).filter((item) => item !== null && item !== undefined && item !== '')
        const hasDot = raw.length > 0 && raw[0] !== null && raw[0] !== undefined && raw[0].props !== undefined && String(raw[0].props.className || '').includes('gzw-eyebrow-dot')
        const marks = raw.length === 0 || hasDot ? raw : [h('span', { className: 'gzw-eyebrow-dot', key: 'auto-dot' }), ...raw]
        return h(
          'div',
          { className: 'gzw-pagehead' },
          h(
            'div',
            { className: 'gzw-ph-main' },
            marks.length === 0
              ? null
              : h(
                  'div',
                  { className: 'gzw-eyebrow' },
                  ...marks.flatMap((node, index) => (index === 0 ? [node] : [h('span', { className: 'gzw-eyebrow-sep', key: 'sep' + index }, '/'), node])),
                ),
            h('h1', { className: 'gzw-ptitle' + (small ? ' sm' : '') }, title),
            desc ? h('div', { className: 'gzw-psub' }, desc) : null,
            meta === null || meta === undefined || meta.length === 0 ? null : h('div', { className: 'gzw-pmeta' }, ...meta),
          ),
          side === null || side === undefined ? null : h('div', { className: 'gzw-ph-side' }, ...side),
        )
      }

      // 元信息之间统一用 3px 圆点分隔
      function metaLine(items) {
        const list = items.filter((item) => item !== null && item !== undefined && item !== false)
        return list.flatMap((node, index) => (index === 0 ? [node] : [h('span', { className: 'gzw-pmeta-sep', key: 'ms' + index }), node]))
      }

      function renderMasthead() {
        const stage = currentStage
        const meta = STAGE_META[stage - 1]
        const nextMeta = STAGE_META[Math.min(6, stage)] ?? null
        const facts = []
        if (article !== null) {
          if (article.mode) facts.push(h('span', { key: 'mode' }, '模式 ', h('b', {}, article.mode)))
          if (article.startDate) facts.push(h('span', { key: 'start' }, '开写 ', h('b', {}, article.startDate)))
          if (target !== null) facts.push(h('span', { key: 'target' }, '目标 ', h('b', {}, target.label), '（' + (target.days >= 0 ? '剩 ' + target.days + ' 天' : '已超 ' + Math.abs(target.days) + ' 天') + '）'))
          facts.push(h('span', { key: 'art' }, '产物 ', h('b', {}, artifacts.length), ' 项'))
        }
        facts.push(
          h(
            'span',
            { key: 'bind', className: 'gzw-chip ' + (bindingReady ? 'accent' : 'warn') },
            h(Icon, { name: bindingReady ? 'link' : 'alert', size: 11 }),
            bindingReady ? '已绑定 ' + shortId(binding.sessionId) : '未绑定会话',
          ),
        )
        return pageHead({
          eyebrow: [
            h('span', { className: 'gzw-eyebrow-dot', key: 'dot' }),
            h('span', { key: 'cur' }, '当前篇'),
            h('b', { key: 'stage' }, '阶段 ' + CIRCLED[stage - 1] + ' ' + meta.name),
          ],
          title: article === null ? 'state.md 未读到当前篇' : article.topic || '（state.md 未写主题）',
          desc: article === null ? stateError || '检查 gzhflow 仓库路径与绑定会话的工作目录。' : meta.desc,
          meta: metaLine(facts),
          side: [
            h('div', { className: 'gzw-next', key: 'n' }, nextMeta === null ? '已是最后一阶段' : '下一阶段 ', nextMeta === null ? null : h('b', {}, CIRCLED[nextMeta.no - 1] + ' ' + nextMeta.name)),
          ],
        })
      }

      // ---------------- 进度轨 ----------------
      function renderRail() {
        const steps = STAGE_META.map((item) => {
          const done = article !== null && article.doneStages.has(item.no)
          const active = currentStage === item.no
          return h(
            'button',
            {
              key: 'r-' + item.no,
              type: 'button',
              className: 'gzw-rail-step' + (done ? ' done' : '') + (active ? ' active' : ''),
              onClick: () => jumpToStage(item.no),
              title: item.desc,
            },
            h('span', { className: 'gzw-rail-bar' }),
            h('span', { className: 'gzw-rail-name' }, item.name),
          )
        })
        return h(
          'div',
          {},
          h('div', { className: 'gzw-rail' }, ...steps),
          h(
            'div',
            { className: 'gzw-rail-meta' },
            h('span', {}, doneCount + ' / 7 已完成'),
            h('span', { className: 'gzw-pmeta-sep' }),
            h('span', {}, artifacts.length + ' 项产物'),
          ),
        )
      }

      // ---------------- 命令条 ----------------
      function renderToolbar() {
        if (passConfirm) {
          return h(
            'div',
            { className: 'gzw-toolbar' },
            h('span', { className: 'gzw-review-title' }, h(Icon, { name: 'check', size: 14 }), '确认通过这一版？'),
            h('span', { className: 'gzw-dim' }, 'Agent 会更新 state.md 并进入下一阶段'),
            h('span', { className: 'gzw-spacer' }),
            h(Btn, { variant: 'ghost', onClick: () => setPassConfirm(false), disabled: promptBusy }, '取消'),
            h(Btn, { variant: 'brand', icon: 'send', onClick: () => sendPrompt('pass'), disabled: promptBusy }, promptBusy ? '发送中…' : '确认通过并发送'),
          )
        }
        if (returnOpen) {
          return h(
            'div',
            { className: 'gzw-toolbar', style: { alignItems: 'flex-start' } },
            h(
              'div',
              { style: { flex: 1, minWidth: '260px' } },
              h('div', { className: 'gzw-review-title' }, h(Icon, { name: 'x', size: 14 }), '退回改稿'),
              h('textarea', {
                className: 'gzw-textarea',
                value: returnNote,
                placeholder: '附一句意见（可留空）',
                style: { marginTop: '6px' },
                onChange: (event) => setReturnNote(event.target.value),
              }),
            ),
            h(
              'div',
              { className: 'gzw-row', style: { alignSelf: 'center' } },
              h(Btn, { variant: 'ghost', onClick: () => setReturnOpen(false), disabled: promptBusy }, '取消'),
              h(Btn, { variant: 'brand', icon: 'send', onClick: () => sendPrompt('return'), disabled: promptBusy }, promptBusy ? '发送中…' : '确认退回并发送'),
            ),
          )
        }
        const primary = []
        if (bindingReady) {
          primary.push(h(Btn, { key: 'pass', variant: 'brand', icon: 'check', onClick: () => setPassConfirm(true), disabled: promptBusy }, '通过，进下一阶段'))
          primary.push(h(Btn, { key: 'return', variant: 'ghost', icon: 'x', onClick: () => setReturnOpen(true), disabled: promptBusy }, '退回改稿'))
          primary.push(h(Btn, { key: 'resume', variant: 'ghost', icon: 'play', onClick: () => resumeRun(), disabled: promptBusy }, '按 run step 续跑'))
        } else {
          primary.push(h(Btn, { key: 'bind', variant: 'brand', icon: 'link', onClick: () => setView('binding') }, '绑定会话，开启写操作'))
        }
        return h(
          'div',
          {},
          h(
            'div',
            { className: 'gzw-toolbar' },
            ...primary,
            h('span', { className: 'gzw-spacer' }),
            h(Btn, { key: 'gate', variant: 'ghost', icon: 'spark', onClick: () => runGate('draft'), disabled: gateBusy || readSessionId === '' }, gateBusy ? '体检中…' : 'AI 味体检'),
            h(Btn, { key: 'new', variant: 'ghost', icon: 'plus', onClick: () => setNewOpen((value) => !value) }, '新写一篇'),
            h(
              'span',
              { className: 'gzw-toolbar-state' },
              h('span', { className: 'gzw-status-dot', style: bindingReady ? undefined : { background: 'var(--gzw-warn)' } }),
              bindingReady ? '写操作就绪' : '先绑定会话，才能通过 / 退回',
            ),
          ),
          newOpen ? renderNewArticle() : null,
        )
      }

      function renderNewArticle() {
        return h(
          'div',
          { className: 'gzw-newarticle' },
          h(
            'div',
            { className: 'gzw-newarticle-main' },
            h('div', { className: 'gzw-label', style: { marginBottom: '8px' } }, '新写一篇'),
            h('input', { className: 'gzw-input', value: newTopic, placeholder: '主题：例如「AI 搜索这一年」', onChange: (event) => setNewTopic(event.target.value) }),
            h('div', { className: 'gzw-dim', style: { marginTop: '8px' } }, '工作台只开一个专用会话并发启动指令；state.md 由 Agent 自己改。'),
          ),
          h(Btn, { variant: 'brand', wide: true, icon: 'send', onClick: () => startNewArticle(), disabled: newBusy || newTopic.trim() === '' }, newBusy ? '创建中…' : '创建并启动'),
          newError === '' ? null : h('div', { className: 'gzw-error', style: { gridColumn: '1 / -1' } }, newError),
        )
      }

      // ---------------- 指标条 ----------------
      function renderStrip() {
        const d = draftStatsValue
        const gateInfo = gateViz
        const items = [
          { k: '正文', v: d === null ? '—' : num(d.chars), unit: '字', sub: d === null ? '还没有草稿' : d.paragraphs + ' 段' },
          { k: '句数', v: d === null ? '—' : d.sentences, unit: '', sub: d === null ? '' : '平均 ' + d.avgSentence + ' 字' },
          { k: '阅读', v: d === null ? '—' : d.readMinutes, unit: '分钟', sub: d === null ? '' : '约 ' + d.chars + ' 字' },
          { k: '体检', v: gateInfo === null ? '未跑' : gateInfo.running ? '…' : gateInfo.failed ? '失败' : String(gateInfo.score ?? '—'), unit: gateInfo === null || gateInfo.running || gateInfo.failed ? '' : '/100', sub: gateInfo === null ? '还没跑' : gateInfo.failed ? '未能运行' : 'FAIL ' + (gateInfo.fails?.length ?? 0) + ' · WARN ' + (gateInfo.warns?.length ?? 0), muted: gateInfo === null || gateInfo.failed },
          { k: '产物', v: artifacts.length, unit: '项', sub: artifacts.length === 0 ? 'generated/ 空' : '最近 ' + relTime(artifacts[artifacts.length - 1].mtimeMs) },
          { k: '轨迹', v: stats.total, unit: '步', sub: stats.total === 0 ? '还没绑会话' : stats.tools + ' 工具 · ' + stats.errors + ' 失败' },
        ]
        return h(
          'div',
          { className: 'gzw-strip' },
          ...items.map((item, index) =>
            h(
              'div',
              { className: 'gzw-strip-item', key: 's' + index },
              h('div', { className: 'gzw-strip-k' }, item.k),
              h('div', { className: 'gzw-strip-v', style: item.muted ? { color: 'var(--gzw-ink-3)' } : undefined }, item.v, item.unit === '' ? null : h('small', {}, item.unit)),
              h('div', { className: 'gzw-strip-sub' }, item.sub),
            ),
          ),
        )
      }

      // ---------------- 审阅 ----------------
      function renderReview() {
        if (receipt === null) return null
        return h(
          'div',
          { className: 'gzw-receipt ' + (receipt.ok ? 'ok' : 'bad') },
          h('div', { className: receipt.ok ? 'gzw-ok' : 'gzw-error' }, receipt.ok ? '指令已排队（' + formatWhen(receipt.at) + '）' : '发送失败（' + formatWhen(receipt.at) + '）：' + String(receipt.error || '')),
          h('details', { className: 'gzw-details', style: { marginTop: '6px' } }, h('summary', { className: 'gzw-dim' }, '查看发送的原文'), h('pre', { className: 'gzw-mono', style: { marginTop: '6px', whiteSpace: 'pre-wrap' } }, String(receipt.text || ''))),
        )
      }

      // ---------------- 体检 ----------------
      function renderGateViz() {
        if (gate === null) {
          const d = draftStatsValue
          return h(
            'div',
            {},
            h('div', { className: 'gzw-dim' }, '还没跑体检。ai_flavor_score.py 会把「像机写的」句子挑出来当提示：FAIL 要改，WARN 只供人工判断。'),
            d === null
              ? null
              : h(
                  'div',
                  { className: 'gzw-strip', style: { marginTop: 'var(--gzw-s3)' } },
                  h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '句子数'), h('div', { className: 'gzw-strip-v' }, num(d.sentences)), h('div', { className: 'gzw-strip-sub' }, '平均 ' + d.avgSentence + ' 字/句')),
                  h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '长段峰值'), h('div', { className: 'gzw-strip-v' }, d.longest, h('small', {}, '字')), h('div', { className: 'gzw-strip-sub' }, '超 200 字要拆')),
                  h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '阅读'), h('div', { className: 'gzw-strip-v' }, d.readMinutes, h('small', {}, '分钟')), h('div', { className: 'gzw-strip-sub' }, d.chars + ' 字')),
                ),
          )
        }
        const info = gateViz
        if (info.running) return h('div', { className: 'gzw-status busy' }, h('span', { className: 'gzw-status-dot' }), '正在跑 ai_flavor_score.py…')
        if (info.failed) return h('div', { className: 'gzw-note danger' }, '未能运行：' + String(info.reason || ''))
        if (info.raw !== undefined) return h('pre', { className: 'gzw-mono', style: { maxHeight: '240px', overflow: 'auto', whiteSpace: 'pre-wrap' } }, info.raw)

        if (info.target === 'html') {
          const errors = info.errors ?? []
          const warns = info.warns ?? []
          return h(
            'div',
            {},
            h(
              'div',
              { className: 'gzw-row' },
              h('span', { className: 'gzw-chip ' + (errors.length > 0 ? 'danger' : '') }, h('b', {}, errors.length), ' ERROR'),
              h('span', { className: 'gzw-chip warn' }, h('b', {}, warns.length), ' WARN'),
              h('span', { className: 'gzw-chip' }, 'span leaf ', h('b', {}, String(info.spanLeafCount ?? '?'))),
            ),
            errors.length + warns.length === 0
              ? h('div', { className: 'gzw-ok', style: { marginTop: 'var(--gzw-s3)' } }, '没有发现结构问题，可以粘贴到公众号。')
              : h(
                  'div',
                  { className: 'gzw-issues', style: { marginTop: 'var(--gzw-s3)' } },
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
            h(
              'div',
              { className: 'gzw-gate-score' },
              h(ScoreGauge, {
                score: info.score,
                size: 108,
                cap: 'AI 味分',
                tone: fails.length > 0 ? 'danger' : warns.length > 0 ? 'warn' : 'accent',
              }),
            ),
            h(
              'div',
              { className: 'gzw-gate-meta' },
              h(
                'div',
                { className: 'gzw-row' },
                h('span', { className: 'gzw-chip ' + (fails.length > 0 ? 'danger' : '') }, h('b', {}, fails.length), ' FAIL'),
                h('span', { className: 'gzw-chip warn' }, h('b', {}, warns.length), ' WARN'),
              ),
              h('div', { className: 'gzw-dim' }, '共 ' + info.hits + ' 条提示 · 点下方明细可定位正文'),
            ),
            h(RuleBars, { rows: groups, total: fails.length + warns.length }),
          ),
          h(
            'div',
            { className: 'gzw-strip', style: { marginTop: 'var(--gzw-s4)' } },
            dashBase === null ? null : h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '破折号 / 千字'), h('div', { className: 'gzw-strip-v' }, dashBase.toFixed(2)), h('div', { className: 'gzw-strip-sub' }, '人类基准 0.80')),
            info.stats === null || info.stats === undefined ? null : h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '句子数'), h('div', { className: 'gzw-strip-v' }, num(Number(info.stats.sentences ?? 0))), h('div', { className: 'gzw-strip-sub' }, d === null ? '' : '平均 ' + d.avgSentence + ' 字/句')),
            d === null ? null : h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '长段峰值'), h('div', { className: 'gzw-strip-v' }, d.longest, h('small', {}, '字')), h('div', { className: 'gzw-strip-sub' }, '超 200 字要拆')),
          ),
          issueRows.length === 0
            ? null
            : h(
                'div',
                { style: { marginTop: 'var(--gzw-s4)' } },
                h('div', { className: 'gzw-label', style: { marginBottom: '6px' } }, '明细 · 点一条定位到正文'),
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

      // ---------------- 稿纸 ----------------
      function excerpt(body, count) {
        const blocks = String(body || '')
          .split(/\n{2,}/)
          .map((block) => block.trim())
          .filter((block) => block !== '' && !/^!\[/.test(block))
        return blocks.slice(0, count).join('\n\n')
      }

      function renderSheet(limit) {
        if (draft === null) {
          return h(Empty, { title: '读不到 generated/draft.md', text: draftError || '等 Agent 写完这一版再来看。', action: h(Btn, { size: 'sm', onClick: () => loadDraft() }, '重新读取') })
        }
        const body = limit === undefined ? draft.body : excerpt(draft.body, limit)
        return h(
          'div',
          { className: 'gzw-sheet' },
          h(
            'div',
            { className: 'gzw-sheet-head' },
            h('div', { className: 'gzw-sheet-title' }, draft.meta.title || '（frontmatter 无 title）'),
            h('div', { className: 'gzw-sheet-meta' }, [draft.meta.author, draft.meta.genre, draft.meta.description].filter(Boolean).join('　·　') || draft.path),
          ),
          h(MarkdownView, { text: body, highlight: highlightLine, offset: draft.offset }),
        )
      }

      // ---------------- 配图 ----------------
      function renderManifest() {
        const item = artifactById('manifest')
        if (item === undefined) return h(Empty, { title: '还没有配图 manifest', text: '配图阶段由 Agent 生成 generated/manifest.json 与预算单。' })
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
        return h(
          'div',
          {},
          manifest === null
            ? h(Empty, { title: 'manifest 读取中或解析失败', text: doc === undefined ? '正在读取 ' + item.path : String(doc.error || 'generated/manifest.json 不是合法 JSON') })
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
                      h(Icon, { name: 'image', size: 24, stroke: 1.2 }),
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
          manifest === undefined || manifest === null
            ? null
            : h(
                'div',
                { style: { marginTop: 'var(--gzw-s5)' } },
                h('div', { className: 'gzw-label', style: { marginBottom: '6px' } }, '预算'),
                h(BudgetMeter, { spent, estimated, limit }),
              ),
          budget === undefined
            ? null
            : h('div', { style: { marginTop: 'var(--gzw-s5)' } }, h('div', { className: 'gzw-label', style: { marginBottom: '6px' } }, '预算单：' + budget.path), renderArtifactBlock('budget', 'md')),
        )
      }

      // ---------------- 发布 ----------------
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
          { title: '推送通道', sub: '个人主体只能推草稿箱', value: '显式推送 · 需二次确认', state: 'warn' },
        ]
        return h(
          'div',
          {},
          h('div', { className: 'gzw-note plain', style: { marginBottom: 'var(--gzw-s4)' } }, '发布永不自动：这里只能「推草稿箱」（draft/add），最终发布仍然要在公众号助手 App 里手动点。'),
          h(CheckList, { checks }),
          h(
            'div',
            { className: 'gzw-row', style: { marginTop: 'var(--gzw-s4)' } },
            h(Btn, { variant: 'brand', icon: 'shield', onClick: () => runPublishDry(), disabled: publishBusy || readSessionId === '' }, publishBusy ? 'dry-run 中…' : '跑发布 dry-run'),
            h('span', { className: 'gzw-dim' }, '只检查参数和文件，不取 token、不推送。'),
          ),
          pushConfirm
            ? h(
                'div',
                { className: 'gzw-review', style: { marginTop: 'var(--gzw-s3)' } },
                h(
                  'div',
                  { className: 'gzw-review-main' },
                  h('div', { className: 'gzw-review-title' }, h(Icon, { name: 'alert', size: 14 }), '确认推到草稿箱？'),
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
                { className: 'gzw-row', style: { marginTop: 'var(--gzw-s3)' } },
                h(Btn, { icon: 'send', onClick: () => setPushConfirm(true), disabled: pushBusy || readSessionId === '' }, '推草稿箱'),
                h('span', { className: 'gzw-dim' }, '需要再点一次确认；没有封面会先被拦下。'),
              ),
          payload === null
            ? null
            : h(
                'div',
                { className: 'gzw-receipt ' + (payload.ok === true ? 'ok' : 'bad'), style: { marginTop: 'var(--gzw-s3)' } },
                h('div', { className: payload.ok === true ? 'gzw-ok' : 'gzw-warn' }, payload.ok === true ? 'dry-run 通过（' + formatWhen(publishResult.at) + '）' : 'dry-run 未通过：' + String(payload.code || '')),
                h('pre', { className: 'gzw-mono', style: { marginTop: '6px', maxHeight: '220px', overflow: 'auto', whiteSpace: 'pre-wrap' } }, String(payload.text || publishResult.text || '')),
              ),
          push === null
            ? null
            : h(
                'div',
                { className: 'gzw-receipt ' + (push.ok === true ? 'ok' : 'bad'), style: { marginTop: 'var(--gzw-s3)' } },
                h('div', { className: push.ok === true ? 'gzw-ok' : 'gzw-error' }, push.ok === true ? '已推送到草稿箱（' + formatWhen(pushResult.at) + '）' : '推送失败：' + String(push.code || push.message || '')),
                h('pre', { className: 'gzw-mono', style: { marginTop: '6px', maxHeight: '220px', overflow: 'auto', whiteSpace: 'pre-wrap' } }, String(push.text || pushResult.text || '')),
              ),
        )
      }

      // ---------------- 阶段 ----------------
      function renderStageContent(stage) {
        const meta = STAGE_META[stage - 1]
        const d = draftStatsValue
        const stageArtifacts = STAGES[stage - 1].artifactIds.map((id) => artifactById(id)).filter((item) => item !== undefined)
        const head = pageHead({
          eyebrow: [h('span', { key: 's' }, '七阶段'), h('b', { key: 'n' }, '阶段 ' + CIRCLED[stage - 1] + ' / 7')],
          title: meta.name,
          desc: meta.desc,
          side: [
            h('div', { className: 'gzw-dim', key: 'a' }, '本阶段产物 ' + stageArtifacts.length + ' / ' + STAGES[stage - 1].artifactIds.length),
            h(Btn, { key: 'r', size: 'sm', variant: 'ghost', icon: 'refresh', onClick: () => { loadArtifacts(); loadState(); loadDraft(); loadStageDocs(stage) }, disabled: busy }, '刷新产物'),
          ],
        })

        const hasMetrics = d !== null

        const layoutItem = artifactById('layout')
        const anchorItem = artifactById('anchors')
        let body
        if (stage === 1) {
          body = [
            h(
              'div',
              { className: 'gzw-panel', key: 'anchors' },
              h(
                'div',
                { className: 'gzw-panel-head' },
                h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'layers', size: 14 }), '素材锚点清单'),
                h('div', { className: 'gzw-panel-sub' }, anchorItem === undefined ? '从访谈 / 资料里挑出值得写的点，定下素材边界' : anchorItem.path + ' · ' + humanBytes(anchorItem.bytes)),
              ),
              h(
                'div',
                { className: 'gzw-column' },
                anchorItem === undefined
                  ? h('div', {}, h('div', { className: 'gzw-note plain', style: { marginBottom: 'var(--gzw-s5)' } }, '清单还没生成时，先让 Agent 在会话里出这一版；工作台不代写素材。'), h(Empty, { icon: 'layers', title: '还没有素材锚点清单', text: '这一阶段的产物由 Agent 写进 generated/' }))
                  : renderDoc(anchorItem, 'md'),
              ),
            ),
          ]
        } else if (stage === 2 || stage === 3) {
          const sheetBlock = h(
            'div',
            { key: 'sheet' },
            h(
              'div',
              { className: 'gzw-panel-head' },
              h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'book', size: 14 }), stage === 3 ? '草稿全文' : '全文'),
              h('div', { className: 'gzw-panel-sub' }, stage === 3 ? '去味改的是同一份 generated/draft.md' : '只读预览'),
              h(
                'div',
                { className: 'gzw-panel-actions' },
                h(Btn, { size: 'sm', variant: 'ghost', icon: 'spark', onClick: () => runGate('draft'), disabled: gateBusy || readSessionId === '' }, '体检'),
                h(Btn, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => copyText(draft?.body ?? '', '正文已复制') }, '复制'),
                h(Btn, { size: 'sm', variant: 'ghost', icon: 'arrow', onClick: () => setView('overview') }, '去总览处理'),
              ),
            ),
            renderSheet(),
          )
          const gateBlock = h(
            'div',
            { key: 'gate' },
            h(
              'div',
              { className: 'gzw-panel-head' },
              h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'spark', size: 14 }), 'AI 味体检'),
              h('div', { className: 'gzw-panel-sub' }, gate === null ? '还没跑' : formatWhen(gate.at)),
              h(
                'div',
                { className: 'gzw-panel-actions' },
                h(Btn, { size: 'sm', icon: 'spark', onClick: () => runGate('draft'), disabled: gateBusy || readSessionId === '' }, gateBusy ? '体检中…' : '跑体检'),
              ),
            ),
            renderGateViz(),
          )
          body = [
            h(
              'div',
              { className: 'gzw-panel', key: 'reading' },
              h('div', { className: 'gzw-grid' }, sheetBlock, h('div', { className: 'gzw-stack' }, gateBlock)),
            ),
            hasMetrics === false
              ? null
              : h(
                  'div',
                  { className: 'gzw-panel', key: 'metric' },
                  h(
                    'div',
                    { className: 'gzw-panel-head' },
                    h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'hash', size: 14 }), '读感'),
                    h('div', { className: 'gzw-panel-sub' }, '句长分布与段落节奏'),
                  ),
                  h(
                    'div',
                    { className: 'gzw-grid even' },
                    h('div', {}, h(SentenceHistogram, { buckets: d.buckets })),
                    h('div', {}, h(RhythmStrip, { values: d.rhythm })),
                  ),
                ),
          ]
        } else if (stage === 4) {
          body = [
            h(
              'div',
              { className: 'gzw-panel', key: 'manifest' },
              h(
                'div',
                { className: 'gzw-panel-head' },
                h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'image', size: 14 }), '配图清单'),
                h('div', { className: 'gzw-panel-sub' }, '由 Agent 生成 generated/manifest.json；工作台只读'),
              ),
              renderManifest(),
            ),
          ]
        } else if (stage === 5) {
          body = [
            h(
              'div',
              { className: 'gzw-panel', key: 'layout' },
              h(
                'div',
                { className: 'gzw-panel-head' },
                h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'layout', size: 14 }), '排版稿'),
                h('div', { className: 'gzw-panel-sub' }, layoutItem === undefined ? '还没有生成' : layoutItem.path + ' · ' + humanBytes(layoutItem.bytes)),
                h(
                  'div',
                  { className: 'gzw-panel-actions' },
                  h(Btn, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => copyText(docs[layoutItem?.path]?.text ?? '', 'HTML 已复制'), disabled: layoutItem === undefined }, '复制 HTML'),
                ),
              ),
              layoutItem === undefined
                ? h(Empty, {
                    icon: 'layout',
                    title: '还没有排版 HTML',
                    text: '先把 generated/draft.md 排成公众号格式，再去手机预览里过一遍。',
                    action: h(Btn, { size: 'sm', icon: 'layout', onClick: () => runLayout(), disabled: layoutBusy }, layoutBusy ? '生成中…' : '生成排版'),
                  })
                : h(
                    'div',
                    { className: 'gzw-split' },
                    h(
                      'div',
                      {},
                      gate?.target === 'html' ? h('div', { style: { marginBottom: 'var(--gzw-s4)' } }, renderGateViz()) : null,
                      h('div', {}, renderDoc(layoutItem, 'html')),
                    ),
                    h(
                      'div',
                      { className: 'gzw-stack' },
                      h(
                        'div',
                        {},
                        h('div', { className: 'gzw-label', style: { marginBottom: '8px' } }, '生成排版'),
                        h(
                          'div',
                          { className: 'gzw-row tight' },
                          h('input', { className: 'gzw-input sm', value: layoutTheme, placeholder: 'zen', onChange: (event) => setLayoutTheme(event.target.value) }),
                          h(Btn, { size: 'sm', variant: 'brand', onClick: () => runLayout(), disabled: layoutBusy || readSessionId === '' }, layoutBusy ? '生成中…' : '生成'),
                        ),
                        h('div', { className: 'gzw-dim', style: { marginTop: '6px' } }, 'md2wechat.py --theme ' + (layoutTheme || 'zen') + ' --enhance'),
                      ),
                      h(
                        'div',
                        {},
                        h('div', { className: 'gzw-label', style: { marginBottom: '8px' } }, '排版校验'),
                        h('div', { className: 'gzw-dim', style: { marginBottom: '8px' } }, 'validate_gzh_html.py 会检查 span leaf 结构与样式白名单。'),
                        h(Btn, { size: 'sm', icon: 'shield', onClick: () => runGate('html'), disabled: gateBusy || artifactById('layout') === undefined }, gateBusy ? '校验中…' : '跑排版校验'),
                      ),
                      layoutResult === '' ? null : h('pre', { className: 'gzw-mono', style: { maxHeight: '160px', overflow: 'auto', whiteSpace: 'pre-wrap' } }, layoutResult),
                    ),
                  ),
            ),
          ]
        } else if (stage === 6) {
          body = [
            h(
              'div',
              { className: 'gzw-panel', key: 'publish' },
              h(
                'div',
                { className: 'gzw-panel-head' },
                h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'send', size: 14 }), '发布清单'),
                h('div', { className: 'gzw-panel-sub' }, '只推草稿箱；最终发布仍在公众号助手 App 里手动点'),
              ),
              renderPublish(),
            ),
          ]
        } else {
          body = [
            h(
              'div',
              { className: 'gzw-panel', key: 'review' },
              h(
                'div',
                { className: 'gzw-grid even' },
                h('div', {}, h('div', { className: 'gzw-label', style: { marginBottom: 'var(--gzw-s2)' } }, '发文日志'), renderArtifactBlock('log', 'md')),
                h('div', {}, h('div', { className: 'gzw-label', style: { marginBottom: 'var(--gzw-s2)' } }, '决策记录'), renderArtifactBlock('decisions', 'md')),
              ),
            ),
          ]
        }

        return h(
          'div',
          { className: 'gzw-sec' },
          head,
          h('div', { className: 'gzw-stageblock' }, renderRail()),
          ...body.filter((node) => node !== null && node !== undefined),
        )
      }

      // ---------------- 轨迹 ----------------
      function renderTraceView() {
        const kindOrder = [
          { key: 'tool', label: '工具调用', color: 'var(--gzw-tool)' },
          { key: 'say', label: '助手发言', color: 'var(--gzw-accent)' },
          { key: 'user', label: '用户消息', color: 'var(--gzw-decision)' },
          { key: 'decision', label: '决策', color: 'var(--gzw-warn)' },
          { key: 'review', label: '审阅指令', color: 'var(--gzw-accent)' },
          { key: 'result', label: '工具结果', color: 'var(--gzw-decision)' },
          { key: 'system', label: '系统 / 轮次', color: 'var(--gzw-ink-3)' },
        ]
        const systemKeys = ['system', 'command', 'turn']
        const segments = kindOrder
          .map((item) => ({ ...item, value: item.key === 'system' ? systemKeys.reduce((sum, key) => sum + (stats.byKind[key] ?? 0), 0) : stats.byKind[item.key] ?? 0 }))
          .filter((item) => item.value > 0)
        const otherCount = Object.keys(stats.byKind).reduce((sum, key) => {
          if (systemKeys.includes(key) || kindOrder.some((item) => item.key === key)) return sum
          return sum + stats.byKind[key]
        }, 0)
        if (otherCount > 0) segments.push({ key: 'other', label: '其他', color: 'var(--gzw-line-strong)', value: otherCount })
        const seriesMax = Math.max(1, ...(stats.series.values ?? [1]))
        const activeFilters = filters.filter((filter) => filter.id === 'all' || filterCount(filter.id) > 0)

        const sessionLine =
          traceSessionId !== ''
            ? '历史会话 ' + shortId(traceSessionId) + ' · 只读回放'
            : binding === null
              ? '正在看工作区最近会话；绑定专用会话后才有实时跟随'
              : '会话 ' + shortId(binding.sessionId) + ' · ' + (followMode === 'live' ? '实时跟随中' : followMode === 'poll' ? '2 秒轮询' : '已暂停')

        const head = pageHead({
          eyebrow: [h('span', { key: 't' }, '会话轨迹')],
          title: 'Agent 操作轨迹',
          desc: sessionLine,
          side: [
            h(
              'div',
              { className: 'gzw-row', key: 'a', style: { justifyContent: 'flex-end' } },
              traceSessionId !== ''
                ? h(Btn, { size: 'sm', icon: 'link', variant: 'ghost', onClick: () => setTraceSessionId('') }, '回到绑定会话')
                : h(Btn, { size: 'sm', icon: followOn ? 'pause' : 'play', variant: 'ghost', onClick: () => setFollowOn((value) => !value) }, followOn ? '暂停跟随' : '开始跟随'),
              h(Btn, { size: 'sm', icon: 'refresh', variant: 'ghost', onClick: () => loadTrace(traceSessionId !== '' ? traceSessionId : (binding?.sessionId ?? readSessionId)), disabled: (binding?.sessionId ?? readSessionId) === '' }, '刷新'),
              h(Btn, { size: 'sm', icon: 'x', variant: 'ghost', onClick: () => cancelRun(), disabled: !bindingReady }, '停止 turn'),
            ),
          ],
        })

        const statPanel = h(
          'div',
          { className: 'gzw-panel' },
          h(
            'div',
            { className: 'gzw-strip' },
            h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '可见步骤'), h('div', { className: 'gzw-strip-v' }, stats.total, h('small', {}, '步')), h('div', { className: 'gzw-strip-sub' }, '本会话')),
            h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '轮次'), h('div', { className: 'gzw-strip-v' }, stats.turns, h('small', {}, '轮'))),
            h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '工具调用'), h('div', { className: 'gzw-strip-v' }, stats.tools, h('small', {}, '次'))),
            h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '失败'), h('div', { className: 'gzw-strip-v', style: stats.errors > 0 ? { color: 'var(--gzw-danger)' } : undefined }, stats.errors, h('small', {}, '次'))),
            h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '决策'), h('div', { className: 'gzw-strip-v' }, stats.decisions, h('small', {}, '条'))),
            h('div', { className: 'gzw-strip-item' }, h('div', { className: 'gzw-strip-k' }, '文件操作'), h('div', { className: 'gzw-strip-v' }, filterCount('file'), h('small', {}, '次'))),
          ),
          stats.total === 0
            ? null
            : h(
                'div',
                { className: 'gzw-grid three', style: { marginTop: 'var(--gzw-s5)' } },
                h(
                  'div',
                  {},
                  h('div', { className: 'gzw-label', style: { marginBottom: '10px' } }, '节奏 · 每段事件数'),
                  h(MiniBars, { values: stats.series.values, height: 56 }),
                  h('div', { className: 'gzw-rhythm-cap' }, h('span', { className: 'gzw-dim' }, '峰值 ' + seriesMax + ' 步'), h('span', { className: 'gzw-dim' }, (stats.series.values ?? []).length + ' 段')),
                ),
                h(
                  'div',
                  {},
                  h('div', { className: 'gzw-label', style: { marginBottom: '12px' } }, '构成 · 事件类型'),
                  segments.length === 0
                    ? h('div', { className: 'gzw-dim' }, '还没有可分类的事件。')
                    : h(
                        'div',
                        { className: 'gzw-compose' },
                        h(
                          'div',
                          { className: 'gzw-compose-bar' },
                          ...segments.map((item) => h('i', { key: item.key, title: item.label + ' · ' + item.value, style: { width: Math.max(2, (item.value / Math.max(1, stats.total)) * 100) + '%', background: item.color } })),
                        ),
                        h(
                          'div',
                          { className: 'gzw-legend' },
                          ...segments.map((item) =>
                            h(
                              'span',
                              { className: 'gzw-legend-item', key: 'lg-' + item.key },
                              h('i', { className: 'gzw-legend-dot', style: { background: item.color } }),
                              item.label,
                              h('span', { className: 'gzw-legend-num' }, item.value),
                            ),
                          ),
                        ),
                      ),
                ),
                stats.tools > 0
                  ? h(
                      'div',
                      {},
                      h('div', { className: 'gzw-label', style: { marginBottom: '10px' } }, '工具调用 Top'),
                      h(ToolRank, { rows: traceRows, limit: 4 }),
                    )
                  : null,
              ),
        )

        const timelinePanel = h(
          'div',
          { className: 'gzw-panel' },
          h(
            'div',
            { className: 'gzw-panel-head' },
            h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'clock', size: 14 }), '操作时间线'),
            h('div', { className: 'gzw-panel-sub' }, '共 ' + visibleRows.length + ' 条' + (traceFilter === 'all' ? '' : '（已筛选）')),
          ),
          h(
            'div',
            { className: 'gzw-filters' },
            ...activeFilters.map((filter) =>
              h(
                'button',
                { key: filter.id, type: 'button', className: 'gzw-filter' + (traceFilter === filter.id ? ' on' : ''), onClick: () => setTraceFilter(filter.id) },
                filter.label,
                h('span', { className: 'c' }, filterCount(filter.id)),
              ),
            ),
          ),
          traceError !== '' ? h('div', { className: 'gzw-error', style: { marginTop: 'var(--gzw-s3)' } }, traceError) : null,
          visibleRows.length === 0 && (binding === null || binding.sessionId === '')
            ? h(Empty, { icon: 'link', title: '未绑定会话', text: '绑定后这里显示该会话的实时步骤：用户消息、工具调用、审阅往返与失败。', action: h(Btn, { size: 'sm', onClick: () => setView('binding') }, '去绑定') })
            : visibleRows.length === 0
              ? h(Empty, { icon: 'list', title: '当前筛选下没有事件', text: stats.total === 0 ? '这个会话还没有产生可显示的步骤。' : '换个筛选，或等 Agent 继续跑。' })
              : h(
                  'div',
                  {
                    className: 'gzw-timeline',
                    ref: traceEndRef,
                    onScroll: (event) => {
                      const el = event.currentTarget
                      autoScrollRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
                    },
                    style: { maxHeight: '620px', overflow: 'auto' },
                  },
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
        )

        return h('div', { className: 'gzw-sec' }, head, statPanel, timelinePanel)
      }

      // ---------------- 产物 ----------------
      function renderArtifactsView() {
        const latest = artifacts.slice().sort((a, b) => b.mtimeMs - a.mtimeMs)[0]
        const head = pageHead({
          eyebrow: [h('span', { key: 'a' }, '七阶段产物')],
          title: '产物',
          desc:
            artifacts.length === 0
              ? 'Agent 每完成一个阶段，产物就会出现在这里，可以直接预览。'
              : artifacts.length + ' 项 · 最近更新 ' + relTime(latest.mtimeMs) + ' · 全部只读',
          side: [h(Btn, { key: 'r', size: 'sm', variant: 'ghost', icon: 'refresh', onClick: () => loadArtifacts(), disabled: busy }, '刷新')],
        })
        if (artifacts.length === 0) {
          return h('div', { className: 'gzw-sec' }, head, h('div', { className: 'gzw-panel' }, h(Empty, { icon: 'layers', title: '还没有任何产物', text: 'Agent 每完成一个阶段，产物就会出现在这里。' })))
        }
        return h('div', { className: 'gzw-sec' }, head, h(ArtifactExplorer, { items: artifacts, docs, onRead: loadDoc, onCopy: copyText, onJump: jumpToStage }))
      }

      // ---------------- 绑定 ----------------
      function renderBindingView() {
        const list = h(
          'div',
          {},
          h(
            'div',
            { className: 'gzw-row', style: { marginBottom: 'var(--gzw-s3)' } },
            h('input', { className: 'gzw-input', style: { maxWidth: '340px' }, placeholder: '按标题 / 会话 id 过滤', value: sessionFilter, onChange: (event) => setSessionFilter(event.target.value) }),
            h('span', { className: 'gzw-dim' }, candidates.length + ' 个候选'),
          ),
          candidates.length === 0
            ? h(Empty, { icon: 'search', title: '没有匹配的会话', text: sessionFilter.trim() === '' ? '这个工作区还没有别的会话。' : '换个关键词，或清空过滤。' })
            : h(
                'div',
                { className: 'gzw-list' },
                (showAllSessions ? candidates : candidates.slice(0, 10)).map((row) => {
                  const id = String(sessionIdOf(row) ?? '')
                  const isBound = binding !== null && binding.sessionId === id
                  return h(
                    'div',
                    { className: 'gzw-li', key: id || Math.random() },
                    h('div', { className: 'gzw-avatar' + (isBound ? ' on' : '') }, initialOf(sessionTitleOf(row))),
                    h(
                      'div',
                      { className: 'gzw-li-main' },
                      h('div', { className: 'gzw-li-title' }, row.running === true ? h('span', { className: 'gzw-status-dot', style: { background: 'var(--gzw-warn)' } }) : null, sessionTitleOf(row), isBound ? h('span', { className: 'gzw-chip accent' }, '当前绑定') : null),
                      h('div', { className: 'gzw-li-sub' }, shortId(id) + '　' + relTime(row.updatedAt)),
                    ),
                    h(
                      'div',
                      { className: 'gzw-li-tail' },
                      isBound ? h(Btn, { size: 'sm', variant: 'ghost', onClick: () => unbind }, '解除') : h(Btn, { size: 'sm', onClick: () => bindTo(row) }, '绑定'),
                    ),
                  )
                }),
              ),
          candidates.length > 10
            ? h('div', { style: { marginTop: 'var(--gzw-s3)' } }, h(Btn, { size: 'sm', variant: 'ghost', onClick: () => setShowAllSessions((value) => !value) }, showAllSessions ? '收起' : '显示全部 ' + candidates.length + ' 个'))
            : null,
        )

        const head = pageHead({
          eyebrow: [h('span', { key: 'b' }, '会话绑定')],
          title: bindingReady ? '已绑定这一篇' : '把这一篇绑到一个会话',
          desc: '绑定之后，通过 / 退回这类写操作才会对当前这一篇生效。',
          side: [
            h('span', { key: 'st', className: 'gzw-chip ' + (bindingReady ? 'accent' : 'warn') }, bindingReady ? '写操作就绪' : bindingBlockReason),
          ],
        })

        return h(
          'div',
          { className: 'gzw-sec' },
          head,
          h(
            'div',
            { className: 'gzw-panel' },
            h(
              'div',
              { className: 'gzw-panel-head' },
              h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'link', size: 14 }), binding === null ? '当前还没有绑定' : '当前绑定'),
              binding === null ? null : h('div', { className: 'gzw-panel-sub' }, '绑定时主题与 state.md 一致，写操作才会开启'),
            ),
            binding === null
              ? h('div', { className: 'gzw-note plain' }, '从下面选一个会话绑定。建议把会话标题改成文章标题，之后在侧边栏一眼能认出。')
              : h(
                  'div',
                  { className: 'gzw-split' },
                  h(
                    'dl',
                    { className: 'gzw-kv' },
                    h('dt', {}, '会话'), h('dd', {}, sessionTitleOf(boundSession) + '（' + shortId(binding.sessionId) + '）'),
                    h('dt', {}, '工作目录'), h('dd', { className: 'gzw-mono' }, boundSession !== undefined ? sessionCwdOf(boundSession) || '(未提供)' : '(会话不在列表里)'),
                    h('dt', {}, '绑定时'), h('dd', {}, formatWhen(Date.parse(binding.boundAt)) || String(binding.boundAt || '')),
                    h('dt', {}, '文章'), h('dd', {}, clip(String(binding.topic || '（无）'), 90)),
                  ),
                  h(
                    'div',
                    {},
                    h('div', { className: 'gzw-note ' + (articleMatches ? '' : 'warn') }, articleMatches ? '绑定与 state.md 当前篇一致，写操作开启。' : 'state.md 当前篇已变或未读到，写操作已禁用。绑定时主题：' + clip(String(binding.topic || '（无）'), 80)),
                    h(
                      'div',
                      { className: 'gzw-row', style: { marginTop: 'var(--gzw-s3)' } },
                      h(Btn, { size: 'sm', variant: 'ghost', icon: 'refresh', onClick: () => loadBinding() }, '刷新绑定'),
                      h(Btn, { size: 'sm', variant: 'ghost', icon: 'link', onClick: () => setSwapPicker((value) => !value) }, swapPicker ? '取消换绑' : '换绑'),
                      h(Btn, { size: 'sm', variant: 'danger', icon: 'x', onClick: unbind }, '解除绑定'),
                    ),
                  ),
                ),
            bindingError !== '' ? h('div', { className: 'gzw-error', style: { marginTop: 'var(--gzw-s3)' } }, bindingError) : null,
          ),
          h(
            'div',
            { className: 'gzw-panel' },
            h(
              'div',
              { className: 'gzw-panel-head' },
              h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'list', size: 14 }), '候选会话'),
              h('div', { className: 'gzw-panel-sub' }, '按运行中 / 最近使用排序'),
            ),
            list,
          ),
        )
      }

      // ---------------- 四库与历史 ----------------
      const LIB_TABS = [
        { id: 'inbox', label: '收件箱', path: 'assets/inbox.md', icon: 'note', title: '素材收件箱', hint: '还没被任何文章用过的念头；说「记一笔」会落在这里' },
        { id: 'voice', label: '文风', path: 'assets/voice.md', icon: 'pen', title: '文风基准', hint: '写这一篇时遵守的语气与节奏' },
        { id: 'lessons', label: '经验', path: 'assets/lessons.md', icon: 'book', title: '经验沉淀', hint: '踩过的坑与有效的做法' },
        { id: 'learned', label: '手改', path: 'assets/learned-edits.md', icon: 'history', title: '手改记录', hint: '机器稿 → 人改稿的差异，阶段⑦回写用' },
        { id: 'history', label: '历史', path: null, icon: 'history', title: '历史文章', hint: '工作区里的历史会话：点「看轨迹」在工作台里回放' },
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

      function renderLibraryBody(lib) {
        if (lib.id === 'history') {
          const history = candidates.slice(0, 10)
          if (history.length === 0) return h(Empty, { title: '这个工作区还没有别的会话', text: '每写一篇就会有一个专属会话；它们会出现在这里。' })
          return h(
            'div',
            { className: 'gzw-list' },
            ...history.map((row) => {
              const id = String(sessionIdOf(row) ?? '')
              const isBound = binding !== null && binding.sessionId === id
              const isViewing = traceSessionId === id
              return h(
                'div',
                { className: 'gzw-li', key: 'h-' + id },
                h('div', { className: 'gzw-avatar' + (isViewing ? ' on' : '') }, initialOf(sessionTitleOf(row))),
                h(
                  'div',
                  { className: 'gzw-li-main' },
                  h('div', { className: 'gzw-li-title' }, sessionTitleOf(row), isBound ? h('span', { className: 'gzw-pill' }, '当前绑定') : null),
                  h('div', { className: 'gzw-li-sub' }, shortId(id) + '　' + relTime(row.updatedAt)),
                ),
                h(
                  'div',
                  { className: 'gzw-li-tail' },
                  h(Btn, {
                    size: 'sm',
                    icon: 'history',
                    onClick: () => {
                      setTraceSessionId(id)
                      setView('trace')
                    },
                  }, isViewing ? '正在看' : '看轨迹'),
                ),
              )
            }),
          )
        }
        const doc = docs[lib.path]
        if (doc === undefined) return h(Skeleton, { height: 180 })
        if (doc.ok !== true) return h(Empty, { title: '读不到 ' + lib.path, text: readErrorText(doc.error) })
        if (lib.id === 'inbox') {
          const sections = parseInbox(doc.text)
          const hints = {
            '未处理': '还没被任何文章用过的念头；在下面写一条，或对 Agent 说「记一笔：……」',
            '已用': '被哪篇文章用了，方便回溯',
            '沉淀': '出现过两次以上的念头，说明是真关心',
          }
          return h(
            'div',
            { className: 'gzw-board' },
            ...['未处理', '已用', '沉淀'].map((name) =>
              h(
                'div',
                { className: 'gzw-board-col', key: name },
                h(
                  'div',
                  { className: 'gzw-board-head' },
                  h('span', { className: 'gzw-board-title' }, name),
                  h('span', { className: 'gzw-board-count' }, String(sections[name].length)),
                  name === '未处理'
                    ? h(Btn, { size: 'sm', variant: 'ghost', icon: 'plus', style: { marginLeft: 'auto' }, onClick: () => setNoteDraft((value) => (value === '' ? '记一笔：' : value)) }, '写一条')
                    : null,
                ),
                sections[name].length === 0
                  ? h('div', { className: 'gzw-board-hint' }, hints[name])
                  : h(
                      'div',
                      { className: 'gzw-list' },
                      ...sections[name].map((entry, index) =>
                        h(
                          'div',
                          { className: 'gzw-li', key: name + index },
                          h('span', { className: 'gzw-status-dot', style: { background: name === '沉淀' ? 'var(--gzw-decision)' : name === '已用' ? 'var(--gzw-ink-3)' : 'var(--gzw-warn)' } }),
                          h('div', { className: 'gzw-li-main' }, h('div', { className: 'gzw-li-title', style: { whiteSpace: 'normal' } }, entry)),
                        ),
                      ),
                    ),
              ),
            ),
          )
        }
        const text = String(doc.text || '')
        if (text.trim() === '') return h(Empty, { icon: 'book', title: '这个库还是空的', text: lib.hint })
        return h('div', { className: 'gzw-doc' }, h(MarkdownView, { text }))
      }

      function renderLibraries() {
        const lib = LIB_TABS.find((item) => item.id === libTab) ?? LIB_TABS[0]
        const head = pageHead({
          eyebrow: [h('span', { key: 'l' }, '四库')],
          title: lib.title,
          desc: lib.hint,
        })
        return h(
          'div',
          { className: 'gzw-sec' },
          head,
          h(
            'div',
            { className: 'gzw-tabsline' },
            h(
              'div',
              { className: 'gzw-seg' },
              ...LIB_TABS.map((item) =>
                h(
                  'button',
                  { key: item.id, type: 'button', className: libTab === item.id ? 'on' : '', onClick: () => setLibTab(item.id) },
                  item.label,
                ),
              ),
            ),
          ),
          h('div', { className: 'gzw-panel', style: { borderTop: 0, paddingTop: 0 } }, renderLibraryBody(lib)),
          lib.id === 'inbox' ? renderNoteComposer() : null,
        )
      }

      function renderNoteComposer() {
        return h(
          'div',
          { className: 'gzw-panel' },
          h(
            'div',
            { className: 'gzw-panel-head' },
            h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'note', size: 14 }), '记一笔'),
            h('div', { className: 'gzw-panel-sub' }, '追加到 assets/inbox.md 的「未处理」区；只按区追加，不改其他内容'),
          ),
          h(
            'div',
            { className: 'gzw-composer' },
            h('textarea', {
              className: 'gzw-textarea',
              value: noteDraft,
              placeholder: '记一笔：……',
              onChange: (event) => setNoteDraft(event.target.value),
            }),
            h(
              'div',
              { className: 'gzw-composer-side' },
              h('input', { className: 'gzw-input', value: noteSource, placeholder: '来源（随手记 / 读到某处）', onChange: (event) => setNoteSource(event.target.value) }),
              h(Btn, { variant: 'brand', wide: true, icon: 'plus', onClick: () => saveNote(), disabled: noteBusy || noteDraft.trim() === '' }, noteBusy ? '写入中…' : '写进 inbox'),
            ),
          ),
          noteError === '' ? null : h('div', { className: 'gzw-error', style: { marginTop: 'var(--gzw-s2)' } }, noteError),
        )
      }

      // ---------------- 顶栏 / 页脚 ----------------
      const views = [
        { id: 'overview', label: '总览' },
        { id: 'stage', label: '阶段' },
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
            h('div', { className: 'gzw-logo' }, h(Icon, { name: 'pen', size: 14, stroke: 1.2 })),
            h('span', { className: 'gzw-brand-title' }, '公众号工作台'),
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
            { className: 'gzw-top-right' },
            h(
              'span',
              { className: 'gzw-status' + (busy ? ' busy' : binding === null || !followOn ? ' paused' : '') },
              h('span', { className: 'gzw-status-dot' }),
              busy ? '刷新中' : binding === null ? '未绑定' : followMode === 'live' ? '实时跟随' : followMode === 'poll' ? '轮询中' : '已暂停',
            ),
            h('button', { type: 'button', className: 'gzw-icon-btn', title: '快捷键（?）', onClick: () => setShowHelp(true) }, h(Icon, { name: 'keyboard', size: 14 })),
            h('button', { type: 'button', className: 'gzw-icon-btn', title: '刷新全部（r）', onClick: refresh, disabled: busy }, h(Icon, { name: 'refresh', size: 14 })),
          ),
        ),
      )

      const footer = h(
        'div',
        { className: 'gzw-footer' },
        h('span', { className: 'repo', title: repoRoot }, repoRoot === '' ? 'gzhflow 仓库未定位' : repoLabel),
        h('span', { className: 'gzw-spacer' }),
        h('button', { type: 'button', className: 'gzw-icon-btn', title: '环境自检', onClick: async () => {
          const result = await execCommand('/gzh-env')
          log('命令 /gzh-env 返回:\n' + result.text)
          showToast('环境自检已写入诊断日志')
        }, disabled: readSessionId === '' }, h(Icon, { name: 'shield', size: 14 })),
        h('button', { type: 'button', className: 'gzw-icon-btn', title: '复制诊断日志', onClick: () => copyText(logs.join('\n'), '诊断日志已复制') }, h(Icon, { name: 'copy', size: 14 })),
        h('button', { type: 'button', className: 'gzw-icon-btn', title: '刷新状态（r）', onClick: refresh, disabled: busy }, h(Icon, { name: 'refresh', size: 14 })),
        h(
          'details',
          { style: { marginLeft: 'var(--gzw-s2)' } },
          h('summary', { className: 'gzw-dim', style: { cursor: 'pointer' } }, '诊断 ' + logs.length),
          h('pre', { className: 'gzw-mono', style: { marginTop: '6px', maxHeight: '240px', overflow: 'auto', whiteSpace: 'pre-wrap' } }, logs.slice(-120).join('\n')),
        ),
      )

      const overview = h(
        'div',
        { className: 'gzw-sec' },
        renderMasthead(),
        h('div', { className: 'gzw-stageblock' }, renderRail()),
        h('div', { className: 'gzw-statblock' }, renderStrip()),
        renderToolbar(),
        receipt === null ? null : renderReview(),
        repoRoot === '' || stateError !== '' ? renderSetupGuide() : null,
        h(
          'div',
          { className: 'gzw-grid' },
          h(
            'div',
            { className: 'gzw-stack' },
            h(
              'div',
              { className: 'gzw-panel' },
              h(
                'div',
                { className: 'gzw-panel-head' },
                h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'book', size: 14 }), '正文'),
                h('div', { className: 'gzw-panel-sub' }, draft === null ? '还没有草稿' : (draft.meta.genre || '正文') + ' · ' + (draftStatsValue === null ? '' : num(draftStatsValue.chars) + ' 字')),
                h(
                  'div',
                  { className: 'gzw-panel-actions' },
                  h(Btn, { size: 'sm', variant: 'ghost', icon: 'arrow', onClick: () => jumpToStage(2) }, '读全文'),
                ),
              ),
              draft === null
                ? h(Empty, { icon: 'file', title: '读不到 generated/draft.md', text: draftError || '等 Agent 写完这一版再来看。', action: h(Btn, { size: 'sm', onClick: () => loadDraft() }, '重新读取') })
                : renderSheet(4),
            ),
            h(
              'div',
              { className: 'gzw-panel' },
              h(
                'div',
                { className: 'gzw-panel-head' },
                h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'hash', size: 14 }), '读感'),
                h('div', { className: 'gzw-panel-sub' }, draftStatsValue === null ? '没有草稿' : '句长分布与段落节奏'),
              ),
              draftStatsValue === null
                ? h('div', { className: 'gzw-dim' }, '等 Agent 写完这一版再来看。')
                : h(
                    'div',
                    { className: 'gzw-grid even' },
                    h('div', {}, h(SentenceHistogram, { buckets: draftStatsValue.buckets })),
                    h('div', {}, h(RhythmStrip, { values: draftStatsValue.rhythm })),
                  ),
            ),
          ),
          h(
            'div',
            { className: 'gzw-stack' },
            h(
              'div',
              { className: 'gzw-panel' },
              h(
                'div',
                { className: 'gzw-panel-head' },
                h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'spark', size: 14 }), 'AI 味体检'),
                h('div', { className: 'gzw-panel-sub' }, gate === null ? '还没跑' : formatWhen(gate.at) + ' 的结果'),
                h(
                  'div',
                  { className: 'gzw-panel-actions' },
                  h(Btn, { size: 'sm', icon: 'spark', onClick: () => runGate('draft'), disabled: gateBusy || readSessionId === '' }, gateBusy ? '体检中…' : '跑体检'),
                ),
              ),
              renderGateViz(),
            ),
            h(
              'div',
              { className: 'gzw-panel' },
              h(
                'div',
                { className: 'gzw-panel-head' },
                h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'layers', size: 14 }), '产物'),
                h('div', { className: 'gzw-panel-sub' }, artifacts.length + ' 项'),
                h('div', { className: 'gzw-panel-actions' }, h(Btn, { size: 'sm', variant: 'ghost', onClick: () => setView('artifacts') }, '全部')),
              ),
              artifacts.length === 0
                ? h('div', { className: 'gzw-dim' }, '工作台只是控制面：产物由 Agent 写进仓库，这里只负责读和展示。')
                : h(
                    'div',
                    { className: 'gzw-list' },
                    ...artifacts.slice(0, 6).map((item) =>
                      h(
                        'div',
                        { className: 'gzw-li', key: item.id, onClick: () => jumpToStage(item.stage), style: { cursor: 'pointer' } },
                        h('div', { className: 'gzw-pill' }, item.stage),
                        h(
                          'div',
                          { className: 'gzw-li-main' },
                          h('div', { className: 'gzw-li-title' }, ARTIFACT_LABELS[item.id] ?? item.id),
                          h('div', { className: 'gzw-li-sub' }, humanBytes(item.bytes) + '　' + relTime(item.mtimeMs)),
                        ),
                      ),
                    ),
                  ),
            ),
          ),
        ),
        renderOnboarding(),
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
            ? overview
            : view === 'stage'
              ? renderStageContent(currentStage)
              : h('div', { className: 'gzw-sec' }, view === 'trace' ? renderTraceView() : view === 'artifacts' ? renderArtifactsView() : view === 'libraries' ? renderLibraries() : renderBindingView()),
        ),
        footer,
        h(Toast, { text: toast }),
        showHelp
          ? h(
              'div',
              { className: 'gzw-help', onClick: () => setShowHelp(false) },
              h(
                'div',
                { className: 'gzw-help-card', onClick: (event) => event.stopPropagation() },
                h(
                  'div',
                  { className: 'gzw-help-head' },
                  h('div', { className: 'gzw-panel-title' }, h(Icon, { name: 'keyboard', size: 14 }), '快捷键'),
                  h('button', { type: 'button', className: 'gzw-icon-btn', onClick: () => setShowHelp(false), title: '关闭' }, h(Icon, { name: 'x', size: 14 })),
                ),
                h(
                  'div',
                  { className: 'gzw-help-list' },
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
        if (doc === undefined) return h(Skeleton, { height: 220 })
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
          return h('pre', { className: 'gzw-md-code', style: { maxHeight: '560px', overflow: 'auto' } }, pretty)
        }
        return h('div', { className: 'gzw-sheet' }, h(MarkdownView, { text: doc.text }))
      })()

      const grouped = STAGE_META.map((stage) => ({
        stage,
        list: items.filter((entry) => stageIndexFrom(String(entry.stage)) === stage.no),
      })).filter((group) => group.list.length > 0)

      return h(
        'div',
        { className: 'gzw-panel', style: { borderTop: 0, paddingTop: 0 } },
        h(
          'div',
          { className: 'gzw-split' },
          h(
            'div',
            {},
            h(
              'div',
              { className: 'gzw-panel-head' },
              h('div', { className: 'gzw-panel-title' }, h(Icon, { name: KIND_ICON[item.kind] ?? 'file', size: 14 }), ARTIFACT_LABELS[item.id] ?? item.id),
              h('div', { className: 'gzw-panel-sub' }, item.path + ' · ' + humanBytes(item.bytes) + ' · ' + formatWhen(item.mtimeMs)),
              h(
                'div',
                { className: 'gzw-panel-actions' },
                h(Btn, { size: 'sm', variant: 'ghost', icon: 'arrow', onClick: () => onJump(item.stage) }, '去阶段'),
                h(Btn, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => onCopy(doc?.text ?? '', '已复制产物内容') }, '复制'),
              ),
            ),
            body,
          ),
          h(
            'div',
            {},
            h('div', { className: 'gzw-label', style: { marginBottom: '10px' } }, '按阶段 · ' + items.length + ' 项'),
            ...grouped.map((group) =>
              h(
                'div',
                { key: 'g-' + group.stage.no, style: { marginBottom: 'var(--gzw-s4)' } },
                h('div', { className: 'gzw-board-title', style: { marginBottom: '2px' } }, '阶段 ' + CIRCLED[group.stage.no - 1] + ' ' + group.stage.name),
                h(
                  'div',
                  { className: 'gzw-list' },
                  ...group.list.map((entry) =>
                    h(
                      'div',
                      {
                        className: 'gzw-li',
                        key: entry.id,
                        onClick: () => setSelected(entry.id),
                        style: { cursor: 'pointer', background: entry.id === active ? 'var(--gzw-accent-soft)' : undefined },
                      },
                      h(
                        'div',
                        { className: 'gzw-li-main' },
                        h('div', { className: 'gzw-li-title' }, ARTIFACT_LABELS[entry.id] ?? entry.id),
                        h('div', { className: 'gzw-li-sub' }, entry.path + '　' + relTime(entry.mtimeMs)),
                      ),
                      h(
                        'div',
                        { className: 'gzw-li-tail' },
                        h('span', { className: 'gzw-sizebar', title: humanBytes(entry.bytes) }, h('span', { style: { width: Math.max(3, ((Number(entry.bytes) || 0) / maxBytes) * 100) + '%' } })),
                        h('span', { className: 'gzw-mono', style: { color: 'var(--gzw-ink-3)' } }, humanBytes(entry.bytes)),
                      ),
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
        open && hasRaw ? h('pre', { className: 'gzw-mono', style: { marginTop: '6px', maxHeight: '240px', overflow: 'auto', whiteSpace: 'pre-wrap' } }, row.raw) : null,
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
