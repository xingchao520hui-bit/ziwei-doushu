// build-v5.js — Fix: expose getChart/onLocationInput/geocodeLocation to window scope
// Fix: replace DOMContentLoaded with direct call
// Fix: move app header into Tab 1, dark theme tab bar

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

// ---- SCOPE APP CSS ----
function scopeCSS(css, prefix) {
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
        let selEnd = buffer.lastIndexOf('{');
        let sel = buffer.slice(0, selEnd).trim();
        let rest = buffer.slice(selEnd);

        if (sel.startsWith('@media') || sel.startsWith('@keyframes') ||
            sel.startsWith('@-webkit-') || sel.startsWith('@font-face') ||
            sel.startsWith('@supports') || sel.startsWith('@import')) {
          // keep as-is
        } else if (sel.length > 0) {
          let parts = sel.split(',').map(s => {
            s = s.trim();
            if (s.startsWith('@')) return s;
            if (s.startsWith(':root')) return s.replace(':root', prefix);
            if (s.startsWith('html') || s.startsWith('body')) return s.replace(/^html/, prefix).replace(/^body/, prefix);
            if (s === '*') return prefix + ' ' + s;
            return prefix + ' ' + s;
          }).join(', ');
          let selStart = buffer.lastIndexOf('{');
          buffer = parts + rest;
        }
      }
    } else if (ch === '}') {
      depth--;
      buffer += ch;
      if (depth === 0) { result += buffer; buffer = ''; }
    } else {
      buffer += ch;
    }
  }
  if (buffer.trim()) result += buffer;
  return result;
}

const scopedCSS = scopeCSS(appCSS, '.app-dark');

// ---- ADAPT APP JS ----
function adaptAppJS(js) {
  // 1. Replace getChart() to use client engine first, server API fallback
  const getChartNew = `async function getChart(){
  var y=parseInt(document.getElementById('year').value);
  var m=parseInt(document.getElementById('month').value);
  var d=parseInt(document.getElementById('day').value);
  var h=parseInt(document.getElementById('hour').value);
  var mi=parseInt(document.getElementById('minute').value)||0;
  var g=document.getElementById('gender').value;
  var lng=parseFloat(document.getElementById('longitude').value)||120;
  if(window.Ziwei&&window.Ziwei.computeChart){
    try{
      var result=window.Ziwei.computeChart(y,m,d,h,mi,g,lng);
      if(!result||result.error){throw new Error(result.error||'排盘失败')}
      renderAnalysis(result);
      return;
    }catch(e){
      console.warn('Client engine failed, fallback to server:',e.message);
    }
  }
  // Fallback to server API`;
  
  js = js.replace(
    /async function getChart\(\)\{[\s\S]*?btn\.disabled=false;btn\.textContent='开始排盘'/,
    getChartNew
  );

  // 2. Replace window.addEventListener('DOMContentLoaded' → manual init
  js = js.replace(
    /window\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{[\s\S]*?getChart\(\);[\s\S]*?\}\);?/,
    `// DOMContentLoaded replaced by manual init in build-v5
window.initAppDark = function(){
  const params=new URLSearchParams(location.search);
  if(params.has('year'))document.getElementById('year').value=params.get('year');
  if(params.has('month'))document.getElementById('month').value=params.get('month');
  if(params.has('day'))document.getElementById('day').value=params.get('day');
  if(params.has('hour'))document.getElementById('hour').value=params.get('hour');
  if(params.has('gender'))document.getElementById('gender').value=params.get('gender');
};`
  );

  // 3. Expose critical functions to window (needed by inline onclick/oninput)
  // getChart, onLocationInput, geocodeLocation are used in the HTML
  js += '\nwindow.getChart=getChart;\n';
  js += 'if(typeof onLocationInput==="function")window.onLocationInput=onLocationInput;\n';
  js += 'if(typeof geocodeLocation==="function")window.geocodeLocation=geocodeLocation;\n';

  return js;
}

const adaptedJS = adaptAppJS(appJS);

// ---- EXTRACT METIS PARTS ----
const mCSSs = metisHTML.indexOf('<style>') + 7;
const mCSSee = metisHTML.indexOf('</style>');
const metisCSS = metisHTML.slice(mCSSs, mCSSee);

const hS = metisHTML.indexOf('<header');
const hE = metisHTML.indexOf('</header>') + 9;
const metisHeader = metisHTML.slice(hS, hE);

const mS = hE;
const mE = metisHTML.indexOf('<script src="ziwei-full-engine.js">');
const metisMain = metisHTML.slice(mS, mE);

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
/* ===== METIS DESIGN SYSTEM (Tab 2 only) ===== */
${metisCSS}

/* ===== TAB BAR (both tabs, neutral) ===== */
.tab-bar{display:flex;justify-content:center;gap:0;margin:0;border-bottom:2px solid #333;background:#1a1a2e;position:relative;z-index:10}
.tab-btn{padding:14px 48px;font-size:16px;font-weight:600;background:none;border:none;cursor:pointer;color:#888;position:relative;transition:color .2s;letter-spacing:0.05em;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif}
.tab-btn:hover{color:#c8a96e}
.tab-btn.active{color:#c8a96e}
.tab-btn.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:#c8a96e;border-radius:1px}
.tab-panel{display:none}.tab-panel.active{display:block}

/* ===== TAB 1: APP DARK THEME (scoped) ===== */
${scopedCSS}

@media(max-width:680px){
  .tab-btn{padding:12px 28px;font-size:14px}
}
</style>
</head>
<body>

<!-- ===== TAB BAR (shared, dark style to match app) ===== -->
<div class="tab-bar">
  <button class="tab-btn active" id="tab-single" onclick="switchTab('single')">单人起盘</button>
  <button class="tab-btn" id="tab-hepan" onclick="switchTab('hepan')">双人合盘</button>
</div>

<!-- ===== TAB 1: COMPLETE DARK THEME APP ===== -->
<div class="tab-panel active" id="panel-single">
  <div class="app-dark">
    ${appBody}
  </div>
</div>

<!-- ===== TAB 2: METIS HEPAN ===== -->
<div class="tab-panel" id="panel-hepan">
${metisHeader}
${metisMain}
  <div class="metis-footer" style="text-align:center;padding:40px;color:var(--text-light);font-size:13px;border-top:1px solid var(--border)">Metis · 紫微斗数 · 仅供娱乐参考</div>
</div>

<script src="ziwei-full-engine.js"></script>

<script>
// ===== TAB 1: APP DARK-THEME JS (exposed to window for onclick/oninput) =====
${adaptedJS}
// Init on tab switch
window._appDarkInited = false;
window.initAppDarkTab = function(){
  if(window._appDarkInited) return;
  window._appDarkInited = true;
  if(typeof initAppDark === 'function') initAppDark();
};
</script>

<script>
// ===== TAB 2: HEPAN JS =====
(function(){
'use strict';
${hepanJS}
})();
</script>

<script>
// ===== TAB SWITCHER =====
window.switchTab = function(tab){
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active')});
  document.getElementById('panel-'+tab).classList.add('active');
  document.getElementById('tab-'+tab).classList.add('active');
  // Init tab content on first visit
  if(tab==='single'&&typeof initAppDarkTab==='function')setTimeout(initAppDarkTab,50);
};
// Init dark tab on page load if active
setTimeout(function(){if(typeof initAppDarkTab==='function')initAppDarkTab();},100);
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
  ['initAppDark', result.includes('initAppDarkTab')],
  ['window.getChart', result.includes('window.getChart=getChart')],
  ['window.onLocationInput', result.includes('window.onLocationInput')],
  ['window.geocodeLocation', result.includes('window.geocodeLocation')],
  ['no IIFE around app JS', !result.match(/\(function\s*\(\s*\)\s*\{[^}]*window\.getChart=getChart/)] // appJS not wrapped
];

let allOK = true;
checks.forEach(([name, ok]) => {
  console.log((ok ? '✓' : '✗') + ' ' + name);
  if (!ok) allOK = false;
});
if (allOK) console.log('\n✓ All checks passed');
else console.log('\n✗ Some checks failed');
