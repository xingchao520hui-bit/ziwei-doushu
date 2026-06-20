// build-unified.js v2 — Assemble unified page with Node.js (UTF-8 safe)
// Inline hepan form, no external extraction needed.

const fs = require('fs');
const path = require('path');
const dir = __dirname;

// ---- READ SOURCES ----
const appHTML = fs.readFileSync(path.join(dir, 'ziwei-app.html'), 'utf-8');
const metisHTML = fs.readFileSync(path.join(dir, 'ziwei-hepan-metis.html'), 'utf-8');

// ---- METIS CSS ----
const ms = metisHTML.indexOf('<style>') + 7;
const me = metisHTML.indexOf('</style>');
const metisCSS = metisHTML.slice(ms, me);

// ---- METIS HEADER ----
const hs = metisHTML.indexOf('<header');
const he = metisHTML.indexOf('</header>') + 9;
const metisHeader = metisHTML.slice(hs, he);

// ---- APP CSS + BODY + JS ----
const as = appHTML.indexOf('<style>') + 7;
const ae = appHTML.indexOf('</style>');
const appCSS = appHTML.slice(as, ae);
const ab = appHTML.indexOf('</style>') + 8;
const ase_idx = appHTML.indexOf('<script>');
const appBody = appHTML.slice(ab, ase_idx);

// App JS: last <script> block (the big analysis engine)
const lastScriptIdx = appHTML.lastIndexOf('<script>');
const lastScriptEnd = appHTML.lastIndexOf('</script>');
let appJS = appHTML.slice(lastScriptIdx + 8, lastScriptEnd);

// ---- ADAPT APP JS (DOM IDs + engine) ----
const idMap = {
  'location': 's-location', 'longitude': 's-lng', 'geocodeMsg': 's-status',
  'result': 's-result', 'year': 's-year', 'month': 's-month', 'day': 's-day',
  'hour': 's-hour', 'minute': 's-minute', 'gender': 's-gender'
};
for (const [oldId, newId] of Object.entries(idMap)) {
  appJS = appJS.replace(new RegExp(`getElementById\\('${oldId}'\\)`, 'g'), `getElementById('${newId}')`);
}
// Export CITY_LNG
appJS = appJS.replace('const CITY_LNG', 'window._CITY_LNG = CITY_LNG; const CITY_LNG');

// Replace getChart() with client engine call
const getChartRe = /async function getChart\s*\(\)\s*\{[\s\S]*?let result\s*=\s*await[\s\S]*?return result;?\s*\}/;
const getChartNew = `async function getChart() {
  var y = parseInt(document.getElementById('s-year').value);
  var m = parseInt(document.getElementById('s-month').value);
  var d = parseInt(document.getElementById('s-day').value);
  var h = parseInt(document.getElementById('s-hour').value);
  var mi = parseInt(document.getElementById('s-minute').value) || 0;
  var g = document.getElementById('s-gender').value;
  var lng = parseFloat(document.getElementById('s-lng').value) || 120;
  if (!window.Ziwei || !window.Ziwei.computeChart) {
    throw new Error('Ziwei engine not loaded. Please hard-refresh (Ctrl+Shift+R).');
  }
  return window.Ziwei.computeChart(y, m, d, h, mi, g, lng);
}`;
appJS = appJS.replace(getChartRe, getChartNew);

// ---- HEPAN JS (extract from metis page) ----
let hJsStart = metisHTML.indexOf('async function doHepan()');
if (hJsStart < 0) hJsStart = metisHTML.indexOf('function doHepan()');
// Go backwards to find the <script> tag
let scriptStart = metisHTML.lastIndexOf('<script>', hJsStart);
let scriptEnd = metisHTML.indexOf('</script>', hJsStart);
let hepanJS = metisHTML.slice(scriptStart + 8, scriptEnd);

// ---- HEPAN FORM (inline, Metis style) ----
const hepanForm = `
    <div class="heming-dual-form">
      <div class="heming-person-card">
        <div class="person-label">&#x1F9D1; 甲方 A</div>
        <div class="form-grid">
          <div class="form-field"><label>出生年份</label><input type="number" id="a-year" value="1999" min="1900" max="2100"></div>
          <div class="form-field"><label>月份</label><input type="number" id="a-month" value="2" min="1" max="12"></div>
          <div class="form-field"><label>日期</label><input type="number" id="a-day" value="17" min="1" max="31"></div>
          <div class="form-field"><label>时 (0-23)</label><input type="number" id="a-hour" value="22" min="0" max="23"></div>
          <div class="form-field"><label>分</label><input type="number" id="a-minute" value="0" min="0" max="59"></div>
          <div class="form-field"><label>性别</label><select id="a-gender"><option value="male">男</option><option value="female" selected>女</option></select></div>
          <div class="form-field"><label>出生地</label>
            <div class="inline-row"><input type="text" id="a-location" placeholder="城市名"><button type="button" onclick="lookupCity('a')">&#x1F50D;</button></div>
          </div>
          <div class="form-field"><label>经度</label><input type="number" id="a-lng" value="120" min="73" max="135" step="0.01"></div>
          <div class="form-field"><label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px">
            <input type="checkbox" id="a-ts" onchange="showTSInfo('a')"> 真太阳时</label>
          </div>
        </div>
        <div class="ts-info" id="a-tsinfo"></div>
      </div>
      <div class="heming-person-card">
        <div class="person-label">&#x1F9D1; 乙方 B</div>
        <div class="form-grid">
          <div class="form-field"><label>出生年份</label><input type="number" id="b-year" value="1999" min="1900" max="2100"></div>
          <div class="form-field"><label>月份</label><input type="number" id="b-month" value="6" min="1" max="12"></div>
          <div class="form-field"><label>日期</label><input type="number" id="b-day" value="18" min="1" max="31"></div>
          <div class="form-field"><label>时 (0-23)</label><input type="number" id="b-hour" value="8" min="0" max="23"></div>
          <div class="form-field"><label>分</label><input type="number" id="b-minute" value="0" min="0" max="59"></div>
          <div class="form-field"><label>性别</label><select id="b-gender"><option value="male" selected>男</option><option value="female">女</option></select></div>
          <div class="form-field"><label>出生地</label>
            <div class="inline-row"><input type="text" id="b-location" placeholder="城市名"><button type="button" onclick="lookupCity('b')">&#x1F50D;</button></div>
          </div>
          <div class="form-field"><label>经度</label><input type="number" id="b-lng" value="120" min="73" max="135" step="0.01"></div>
          <div class="form-field"><label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px">
            <input type="checkbox" id="b-ts" onchange="showTSInfo('b')"> 真太阳时</label>
          </div>
        </div>
        <div class="ts-info" id="b-tsinfo"></div>
      </div>
    </div>
    <div style="text-align:center">
      <button class="btn-hepan-action" id="btn-hepan" onclick="doHepan()">&#x2764; 开 始 合 盘</button>
    </div>
    <div class="status-msg" id="h-status"></div>`;

// ---- BUILD ----
const unifiedHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>紫微斗数 · Metis</title>
<style>
/* ===== METIS DESIGN ===== */
${metisCSS}

/* ===== TAB BAR ===== */
.tab-bar{display:flex;justify-content:center;gap:0;margin-bottom:32px;border-bottom:2px solid var(--border)}
.tab-btn{padding:14px 48px;font-size:16px;font-weight:600;background:none;border:none;cursor:pointer;color:var(--text-muted);position:relative;transition:color .2s;letter-spacing:0.05em;font-family:inherit}
.tab-btn:hover{color:var(--text)}
.tab-btn.active{color:var(--accent)}
.tab-btn.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--accent);border-radius:1px}
.tab-panel{display:none}.tab-panel.active{display:block}

/* ===== SINGLE CHART AREA (app dark theme) ===== */
.single-chart-area{font-family:'Microsoft YaHei','SimSun',serif}
${appCSS}

/* ===== HEPAN LIGHT THEME ===== */
.hepan-area .heming-dual-form{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
@media(max-width:680px){.hepan-area .heming-dual-form{grid-template-columns:1fr}}
.hepan-area .heming-person-card{background:var(--card-bg);border:var(--card-border);border-radius:16px;padding:24px;backdrop-filter:blur(28px) saturate(190%);-webkit-backdrop-filter:blur(28px) saturate(190%);box-shadow:var(--card-shadow)}
.hepan-area .person-label{font-size:13px;font-weight:700;letter-spacing:0.15em;color:var(--text-muted);margin-bottom:20px;text-align:center}
.hepan-area .form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
.hepan-area .form-field{display:flex;flex-direction:column;gap:4px}
.hepan-area .form-field label{font-size:12px;font-weight:600;letter-spacing:0.05em;color:var(--text-muted)}
.hepan-area .form-field input,.hepan-area .form-field select{padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;background:#fafafa;color:var(--text);transition:border-color .2s}
.hepan-area .form-field input:focus,.hepan-area .form-field select:focus{outline:none;border-color:var(--accent)}
.hepan-area .inline-row{display:flex;gap:6px}
.hepan-area .inline-row input{flex:1}
.hepan-area .inline-row button{padding:10px;border:1px solid #ddd;border-radius:8px;background:var(--input-bg);cursor:pointer;font-size:14px;white-space:nowrap;transition:all .2s}
.hepan-area .inline-row button:hover{border-color:var(--accent);color:var(--accent)}
.hepan-area .btn-hepan-action{display:block;width:100%;max-width:300px;margin:28px auto 0;padding:16px;background:#000;color:#fff;border:none;border-radius:12px;font-size:17px;font-weight:700;cursor:pointer;letter-spacing:0.15em;transition:all .3s}
.hepan-area .btn-hepan-action:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(0,0,0,.25)}
.hepan-area .btn-hepan-action:disabled{opacity:.4;cursor:not-allowed;transform:none}
.hepan-area .ts-info{text-align:center;font-size:12px;color:var(--text-light);margin-top:8px}
.hepan-area .result-card{background:var(--card-bg);border:var(--card-border);border-radius:16px;padding:24px;backdrop-filter:blur(28px);box-shadow:var(--card-shadow);margin-bottom:24px}
.hepan-area .result-card h3{font-size:20px;font-weight:700;margin-bottom:16px;color:var(--text);border-bottom:1px solid var(--border);padding-bottom:12px}
.hepan-area .palace-grid-hepan{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;background:#ddd;border:2px solid var(--accent);border-radius:8px;overflow:hidden}
.hepan-area .palace-cell{background:#fff;padding:10px 8px;min-height:85px;border:1px solid var(--border);font-size:11px;line-height:1.5}
.hepan-area .palace-cell .pname{font-size:10px;color:var(--text-light);margin-bottom:3px}
.hepan-area .palace-cell .star{line-height:1.6}
.hepan-area .palace-cell .star.main-star{color:var(--accent);font-weight:600}
.hepan-area .palace-cell .star.aux-star{color:var(--text-muted)}
.hepan-area .score-hero{text-align:center;padding:20px}
.hepan-area .score-hero .big{font-size:48px;font-weight:700;color:var(--accent)}
.hepan-area .score-hero .label{font-size:14px;color:var(--text-muted);margin-top:4px}
.hepan-area .dim-row{display:flex;justify-content:space-between;align-items:center;padding:8px 16px;margin:4px 0;background:var(--input-bg);border-radius:8px}
.hepan-area .dim-row .name{font-weight:600}
.hepan-area .dim-row .val{font-weight:700;color:var(--accent)}
.hepan-area .dim-desc{font-size:12px;color:var(--text-light);padding:0 16px 8px}
@media(max-width:680px){
  .tab-btn{padding:12px 28px;font-size:14px}
  .hepan-area .palace-grid-hepan{grid-template-columns:repeat(2,1fr)}
}
</style>
</head>
<body>

${metisHeader}

<main class="main-content">

<section class="title-section">
  <div class="title-tag">ZIWEI DOUSHU</div>
  <h1 class="title-main">紫微斗数命盘分析</h1>
  <p class="title-sub">三合派技法 · 真太阳时 · 单人起盘 + 双人合盘</p>
  <div class="title-divider"></div>
</section>

<div class="page-container">

<div class="tab-bar">
  <button class="tab-btn active" id="tab-single" onclick="switchTab('single')">&#x1F52E; 单人起盘</button>
  <button class="tab-btn" id="tab-hepan" onclick="switchTab('hepan')">&#x2764; 双人合盘</button>
</div>

<!-- ===== TAB 1: SINGLE CHART ===== -->
<div class="tab-panel active" id="panel-single">
  <div class="single-chart-area">
${appBody}
  </div>
</div>

<!-- ===== TAB 2: HEPAN ===== -->
<div class="tab-panel" id="panel-hepan">
  <div class="hepan-area">
${hepanForm}
    <div id="h-result"></div>
  </div>
</div>

</div><!-- page-container -->
<div class="metis-footer" style="text-align:center;padding:40px;color:var(--text-light);font-size:13px;border-top:1px solid var(--border)">Metis · 紫微斗数 · 仅供娱乐参考</div>
</main>

<script src="ziwei-full-engine.js"></script>

<script>
(function(){
'use strict';

${appJS}

})();
</script>

<script>
(function(){
'use strict';

${hepanJS}

})();
</script>

<script>
window.switchTab = function(tab){
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active')});
  document.getElementById('panel-'+tab).classList.add('active');
  document.getElementById('tab-'+tab).classList.add('active');
};
</script>

</body>
</html>
`;

const outPath = path.join(dir, 'ziwei-metis-unified.html');
fs.writeFileSync(outPath, unifiedHTML, 'utf-8');
console.log('Written:', outPath, '(' + (unifiedHTML.length / 1024).toFixed(1) + ' KB)');

// Validate
if (unifiedHTML.includes('子') && unifiedHTML.includes('丑') && unifiedHTML.includes('寅')) {
  console.log('Chinese chars OK');
} else {
  console.log('WARNING: Chinese may be corrupted');
}
