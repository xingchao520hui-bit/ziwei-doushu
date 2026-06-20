// build-v4.js — Embed ziwei-app.html completely in Tab 1 (dark theme preserved)
// Scoped CSS + JS adapted to client-side engine. Tab 2 = Metis hepan.

const fs = require('fs');
const path = require('path');
const dir = __dirname;

// ---- READ SOURCES ----
const appHTML = fs.readFileSync(path.join(dir, 'ziwei-app.html'), 'utf-8');
const metisHTML = fs.readFileSync(path.join(dir, 'ziwei-hepan-metis.html'), 'utf-8');

// ---- EXTRACT APP PARTS ----
const cssS = appHTML.indexOf('<style>') + 7;
const cssE = appHTML.indexOf('</style>');
const appCSS = appHTML.slice(cssS, cssE);

const bodyS = appHTML.indexOf('<body>') + 6;
const bodyE = appHTML.indexOf('<script>');
const appBody = appHTML.slice(bodyS, bodyE);

const jsS = appHTML.indexOf('<script>') + 8;
const jsE = appHTML.lastIndexOf('</script>');
const appJS = appHTML.slice(jsS, jsE);

// ---- SCOPE APP CSS with .app-dark prefix ----
function scopeCSS(css, prefix) {
  // Split into rules, handling @media / @keyframes blocks
  let result = '';
  let depth = 0;
  let buffer = '';
  let inComment = false;
  
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    const ch2 = css.slice(i, i + 2);
    
    if (ch2 === '/*' && !inComment) { inComment = true; buffer += ch2; i++; continue; }
    if (ch2 === '*/' && inComment) { inComment = false; buffer += ch2; i++; continue; }
    
    if (inComment) { buffer += ch; continue; }
    
    if (ch === '{') {
      depth++;
      buffer += ch;
      if (depth === 1) {
        // At the start of a style block, check if we're inside @media/@keyframes
        // The selector text is in buffer before the '{'
        // We need to prefix the selector
        let selEnd = buffer.lastIndexOf('{');
        let sel = buffer.slice(0, selEnd).trim();
        let rest = buffer.slice(selEnd);
        
        // Don't prefix @media/@keyframes/@font-face rules themselves
        if (sel.startsWith('@media') || sel.startsWith('@keyframes') || 
            sel.startsWith('@-webkit-') || sel.startsWith('@font-face') ||
            sel.startsWith('@supports') || sel.startsWith('@import')) {
          // Keep as-is, prefix selectors inside later
        } else if (sel.length > 0) {
          // Prefix each selector in comma-separated list
          let parts = sel.split(',').map(s => {
            s = s.trim();
            if (s.startsWith('@')) return s;
            if (s.startsWith(':root')) {
              // Convert :root styles to .app-dark
              return s.replace(':root', prefix);
            }
            if (s.startsWith('html') || s.startsWith('body')) {
              // body → .app-dark, html → .app-dark
              return s.replace(/^html/, prefix).replace(/^body/, prefix);
            }
            if (s.startsWith('*') && s.length === 1) {
              return prefix + ' ' + s;
            }
            return prefix + ' ' + s;
          }).join(', ');
          
          // Replace the selector part
          let selStart = buffer.lastIndexOf('{');
          buffer = parts + rest;
        }
      }
    } else if (ch === '}') {
      depth--;
      buffer += ch;
      if (depth === 0) {
        // End of a top-level block
        result += buffer;
        buffer = '';
      }
    } else {
      buffer += ch;
    }
  }
  
  // Any remaining buffer
  if (buffer.trim()) result += buffer;
  return result;
}

const scopedCSS = scopeCSS(appCSS, '.app-dark');

// ---- ADAPT APP JS: replace fetch('/api/chart') with client engine ----
function adaptAppJS(js) {
  // Replace the getChart function
  js = js.replace(
    /async function getChart\s*\(\s*\)\s*\{[\s\S]*?^\}/m,
    `async function getChart() {
  var y = parseInt(document.getElementById('year').value);
  var m = parseInt(document.getElementById('month').value);
  var d = parseInt(document.getElementById('day').value);
  var h = parseInt(document.getElementById('hour').value);
  var mi = parseInt(document.getElementById('minute').value) || 0;
  var g = document.getElementById('gender').value;
  var lng = parseFloat(document.getElementById('lng').value) || 120;
  if (!window.Ziwei || !window.Ziwei.computeChart) {
    // Fallback to server API for localhost
    var res = await fetch('/api/chart', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({year:y, month:m, day:d, hour:h, minute:mi, gender:g, lng:lng})
    });
    return await res.json();
  }
  return window.Ziwei.computeChart(y, m, d, h, mi, g, lng);
}`
  );
  
  // Remove any window.onload/init that auto-fires (we'll trigger manually)
  js = js.replace(/window\.onload\s*=\s*function[\s\S]*?\}/, '// window.onload removed (tab init handles it)\nfunction appInit() {');
  
  // Replace document.addEventListener('DOMContentLoaded'...)
  js = js.replace(/document\.addEventListener\s*\(\s*'DOMContentLoaded'\s*,[\s\S]*?\}\)\s*;/, '// DOMContentLoaded removed (tab init handles it)');
  
  return js;
}

const adaptedJS = adaptAppJS(appJS);

// ---- EXTRACT METIS PARTS ----
// CSS
const mCSSs = metisHTML.indexOf('<style>') + 7;
const mCSSee = metisHTML.indexOf('</style>');
const metisCSS = metisHTML.slice(mCSSs, mCSSee);

// Header
const hS = metisHTML.indexOf('<header');
const hE = metisHTML.indexOf('</header>') + 9;
const metisHeader = metisHTML.slice(hS, hE);

// Main content (hepan form)
const mS = hE;
const mE = metisHTML.indexOf('<script src="ziwei-full-engine.js">');
const metisMain = metisHTML.slice(mS, mE);

// Hepan JS
const hpS = metisHTML.indexOf('<script>', mE);
const hpE = metisHTML.indexOf('</script>', hpS);
const hepanJS = metisHTML.slice(hpS + 8, hpE);

// ---- BUILD ----
const result = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>紫微斗数 · Metis</title>
<style>
/* ===== METIS DESIGN SYSTEM (用于 Header + Tabs + 合盘) ===== */
${metisCSS}

/* ===== TAB BAR ===== */
.tab-bar{display:flex;justify-content:center;gap:0;margin-bottom:0;border-bottom:2px solid var(--border);position:relative;z-index:10}
.tab-btn{padding:14px 48px;font-size:16px;font-weight:600;background:none;border:none;cursor:pointer;color:var(--text-muted);position:relative;transition:color .2s;letter-spacing:0.05em;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif}
.tab-btn:hover{color:var(--text)}
.tab-btn.active{color:var(--accent)}
.tab-btn.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--accent);border-radius:1px}
.tab-panel{display:none}.tab-panel.active{display:block}

/* ===== TAB 1: APP DARK THEME (scoped) ===== */
${scopedCSS}

/* ===== App container reset for tab integration ===== */
.app-dark { min-height: 100vh; }

/* ===== TAB 2: HEPAN = already styled by METIS CSS ===== */

@media(max-width:680px){
  .tab-btn{padding:12px 28px;font-size:14px}
}
</style>
</head>
<body>

<!-- ===== METIS HEADER (shown on both tabs) ===== -->
<div class="metis-header-wrap">${metisHeader}</div>

<!-- ===== TAB BAR ===== -->
<div class="tab-bar">
  <button class="tab-btn active" id="tab-single" onclick="switchTab('single')">&#x1F52E; 单人起盘</button>
  <button class="tab-btn" id="tab-hepan" onclick="switchTab('hepan')">&#x2764; 双人合盘</button>
</div>

<!-- ===== TAB 1: COMPLETE ziwei-app.html (dark theme, scoped) ===== -->
<div class="tab-panel active" id="panel-single">
  <div class="app-dark">
    ${appBody}
    <!-- Result area rendered by JS -->
  </div>
</div>

<!-- ===== TAB 2: HEPAN (Metis white theme) ===== -->
<div class="tab-panel" id="panel-hepan">
${metisMain}
  <div class="metis-footer" style="text-align:center;padding:40px;color:var(--text-light);font-size:13px;border-top:1px solid var(--border)">Metis · 紫微斗数 · 仅供娱乐参考</div>
</div>

<script src="ziwei-full-engine.js"></script>

<script>
// ===== TAB 1: COMPLETE ziwei-app.js (adapted) =====
(function(){
  'use strict';
  ${adaptedJS}

  // Initialize when tab is shown
  window.appInitCalled = false;
  window.initAppTab = function() {
    if (window.appInitCalled) return;
    window.appInitCalled = true;
    if (typeof appInit === 'function') appInit();
    if (typeof loadCityDB === 'function') loadCityDB();
  };
})();
</script>

<script>
// ===== TAB 2: HEPAN JS (unchanged) =====
(function(){
  'use strict';
  ${hepanJS}
})();
</script>

<script>
// ===== TAB SWITCHER =====
(function(){
  'use strict';
  window.switchTab = function(tab){
    document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
    document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active')});
    document.getElementById('panel-'+tab).classList.add('active');
    document.getElementById('tab-'+tab).classList.add('active');
    // Init app tab on first visit
    if (tab === 'single' && typeof initAppTab === 'function') {
      setTimeout(initAppTab, 100);
    }
  };
  // Init on load
  if (typeof initAppTab === 'function') {
    setTimeout(initAppTab, 200);
  }
})();
</script>

</body>
</html>`;

const outPath = path.join(dir, 'ziwei-metis-unified.html');
fs.writeFileSync(outPath, result, 'utf-8');
console.log('Written:', outPath, '(' + (result.length / 1024).toFixed(1) + ' KB)');

// Validate
const checks = [
  ['Chinese', result.includes('紫微斗数')],
  ['app CSS scoped', result.includes('.app-dark')],
  ['app body', result.includes('id="year"')],
  ['hepan form', result.includes('id="yearA"')],
  ['engine', result.includes('ziwei-full-engine.js')],
  ['tab switch', result.includes('switchTab')],
  ['getChart adapted', result.includes('window.Ziwei')],
  ['appInit', result.includes('appInit')],
  ['no :root leak', !result.includes(':root{')],
];

let allOK = true;
checks.forEach(([name, ok]) => {
  console.log((ok ? '✅' : '❌') + ' ' + name);
  if (!ok) allOK = false;
});

if (!allOK) console.log('\n⚠ Some checks failed, review output');
else console.log('\n✅ All checks passed');
