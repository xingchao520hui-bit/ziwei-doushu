// build-v3.js — Rebuild metis-unified: start from hepan-metis, add Metis-style single-chart tab
// Key principle: NO dark theme CSS. Everything uses Metis design system.

const fs = require('fs');
const path = require('path');
const dir = __dirname;

// ---- READ SOURCES ----
const metisHTML = fs.readFileSync(path.join(dir, 'ziwei-hepan-metis.html'), 'utf-8');
const appHTML = fs.readFileSync(path.join(dir, 'ziwei-app.html'), 'utf-8');

// ---- EXTRACT METIS PARTS ----
// CSS
const ms = metisHTML.indexOf('<style>') + 7;
const me = metisHTML.indexOf('</style>');
const metisCSS = metisHTML.slice(ms, me);

// Header HTML
const hs = metisHTML.indexOf('<header');
const he = metisHTML.indexOf('</header>') + 9;
const metisHeader = metisHTML.slice(hs, he);

// Main content between header close and script
const mainStart = he;
const mainEnd = metisHTML.indexOf('<script src="ziwei-full-engine.js">');
const metisMain = metisHTML.slice(mainStart, mainEnd);

// Hepan JS (after engine script tag, the main function block)
const jEnd = metisHTML.indexOf('<script src="ziwei-full-engine.js">');
const jStart = metisHTML.indexOf('<script>', jEnd);
const jClose = metisHTML.indexOf('</script>', jStart);
const hepanJS = metisHTML.slice(jStart + 8, jClose);

// ---- EXTRACT APP ANALYSIS JS (FUNCTIONS ONLY, NO CSS NO HTML) ----
// Find the analysis module section — starts around getPalaceStarMeaning
let aJS = appHTML;

// Strip everything before the first major analysis function
const analysisStart = aJS.indexOf('// 各宫星曜含义解析');
if (analysisStart < 0) {
  // fallback: start from getPalaceStarMeaning
  const alt = aJS.indexOf('function getPalaceStarMeaning(');
  if (alt > 0) aJS = aJS.slice(alt - 100);
} else {
  aJS = aJS.slice(analysisStart);
}

// Strip everything after the last useful function
const analysisEnd = aJS.lastIndexOf('function renderComprehensiveAdvice(');
if (analysisEnd > 0) {
  // Find closing brace of this function
  let depth = 0, idx = analysisEnd;
  for (; idx < aJS.length; idx++) {
    if (aJS[idx] === '{') depth++;
    if (aJS[idx] === '}') { depth--; if (depth === 0) break; }
  }
  aJS = aJS.slice(0, idx + 1);
}

// Wrap in a helper that accepts chart data
let adaptedAppJS = `
// ===== SINGLE-CHART ANALYSIS ENGINE (adapted from ziwei-app.html) =====

// Adapted getChart: uses client Ziwei engine instead of fetch API
async function getChartSingle() {
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
}

${aJS}
`;

// ---- BUILD SINGLE-CHART FORM (METIS STYLE) ----
const singleForm = `
    <div class="heming-person-card" style="max-width:520px;margin:0 auto">
      <div class="person-label">&#x1F52E; 出生信息</div>
      <div class="form-grid">
        <div class="form-field"><label>出生年份</label><input type="number" id="s-year" value="1999" min="1900" max="2100"></div>
        <div class="form-field"><label>月份</label><input type="number" id="s-month" value="6" min="1" max="12"></div>
        <div class="form-field"><label>日期</label><input type="number" id="s-day" value="18" min="1" max="31"></div>
        <div class="form-field"><label>时 (0-23)</label><input type="number" id="s-hour" value="8" min="0" max="23"></div>
        <div class="form-field"><label>分</label><input type="number" id="s-minute" value="0" min="0" max="59"></div>
        <div class="form-field"><label>性别</label><select id="s-gender"><option value="male" selected>男</option><option value="female">女</option></select></div>
        <div class="form-field"><label>出生地</label>
          <div class="inline-row"><input type="text" id="s-location" placeholder="城市名"><button type="button" onclick="lookupCitySingle()">&#x1F50D;</button></div>
        </div>
        <div class="form-field"><label>经度</label><input type="number" id="s-lng" value="120" min="73" max="135" step="0.01"></div>
        <div class="form-field"><label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px">
          <input type="checkbox" id="s-ts" onchange="showTSInfoSingle()"> 真太阳时</label>
        </div>
      </div>
      <div class="ts-info" id="s-tsinfo"></div>
    </div>
    <div style="text-align:center">
      <button class="btn-hepan-action" id="btn-single" onclick="doSingleChart()">&#x1F52E; 开 始 排 盘</button>
    </div>
    <div class="status-msg" id="s-status"></div>
    <div id="s-result"></div>`;

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
/* ===== METIS DESIGN SYSTEM ===== */
${metisCSS}

/* ===== TAB BAR ===== */
.tab-bar{display:flex;justify-content:center;gap:0;margin-bottom:32px;border-bottom:2px solid var(--border)}
.tab-btn{padding:14px 48px;font-size:16px;font-weight:600;background:none;border:none;cursor:pointer;color:var(--text-muted);position:relative;transition:color .2s;letter-spacing:0.05em;font-family:inherit}
.tab-btn:hover{color:var(--text)}
.tab-btn.active{color:var(--accent)}
.tab-btn.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--accent);border-radius:1px}
.tab-panel{display:none}.tab-panel.active{display:block}

/* ===== SINGLE CHART RESULT STYLING (METIS THEME) ===== */
.single-result{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif}
.single-result .chart-section{margin-bottom:20px}
.single-result h2{font-size:20px;font-weight:700;color:var(--text);margin:20px 0 12px;border-bottom:1px solid var(--border);padding-bottom:8px}
.single-result h3{font-size:16px;font-weight:600;color:var(--text);margin:16px 0 8px}
.single-result .chart-palace-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin:16px 0;background:var(--border);border-radius:8px;overflow:hidden}
.single-result .chart-palace-grid .cp-cell{background:#fff;padding:10px 8px;font-size:11px;line-height:1.6;min-height:60px}
.single-result .cp-cell .cn{color:var(--text-light);font-size:10px;margin-bottom:2px}
.single-result .cp-cell .cs{font-weight:600;color:var(--accent)}
.single-result table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
.single-result th,.single-result td{border:1px solid var(--border);padding:8px 12px;text-align:left}
.single-result th{background:var(--input-bg);font-weight:600}
.single-result .highlight{color:var(--accent);font-weight:600}
@media(max-width:680px){
  .tab-btn{padding:12px 28px;font-size:14px}
  .single-result .chart-palace-grid{grid-template-columns:repeat(2,1fr)}
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
${singleForm}
</div>

<!-- ===== TAB 2: HEPAN ===== -->
<div class="tab-panel" id="panel-hepan">
${metisMain}
</div>

</div><!-- page-container -->
<div class="metis-footer" style="text-align:center;padding:40px;color:var(--text-light);font-size:13px;border-top:1px solid var(--border)">Metis · 紫微斗数 · 仅供娱乐参考</div>
</main>

<script src="ziwei-full-engine.js"></script>

<script>
// ===== SINGLE CHART LOGIC =====
(function(){
'use strict';

// Export CITY_LNG for use by other scripts
window._CITY_LNG = window._CITY_LNG || {};

// City lookup for single chart
window.lookupCitySingle = function() {
  var input = document.getElementById('s-location');
  var lngField = document.getElementById('s-lng');
  var city = (input.value || '').trim();
  if (!city) return;
  var found = false;
  if (window._CITY_DB) {
    for (var i = 0; i < window._CITY_DB.length; i++) {
      if (window._CITY_DB[i].name.indexOf(city) !== -1) {
        lngField.value = window._CITY_DB[i].lng;
        window._CITY_LNG[city] = window._CITY_DB[i].lng;
        found = true;
        break;
      }
    }
  }
  var info = document.getElementById('s-tsinfo');
  if (found) {
    info.textContent = city + ' 经度 ' + lngField.value + '°E';
  } else {
    info.textContent = '未找到城市，请手动输入经度（默认120°E）';
  }
};

// Show true solar time info
window.showTSInfoSingle = function() {
  var info = document.getElementById('s-tsinfo');
  var lng = parseFloat(document.getElementById('s-lng').value) || 120;
  if (document.getElementById('s-ts').checked) {
    var offset = Math.round((lng - 120) * 4);
    var sign = offset >= 0 ? '+' : '';
    info.textContent = '真太阳时偏移 ' + sign + offset + ' 分钟（经度 ' + lng + '°E）';
  } else {
    info.textContent = '';
  }
};

// Do single chart
window.doSingleChart = async function() {
  var btn = document.getElementById('btn-single');
  var st = document.getElementById('s-status');
  var result = document.getElementById('s-result');

  btn.disabled = true;
  btn.textContent = '排盘中...';
  st.textContent = '正在计算...';
  st.style.color = 'var(--text-muted)';
  result.innerHTML = '';

  try {
    var data = await getChartSingle();
    if (!data || !data.palaces) throw new Error('排盘返回数据为空');

    renderSingleChart(data);
    st.textContent = '排盘完成';
    st.style.color = 'var(--accent)';
  } catch (e) {
    st.textContent = '错误: ' + e.message;
    st.style.color = 'red';
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = '\\u{1F52E} 开 始 排 盘';
  }
};

// Render single chart result
function renderSingleChart(d) {
  var out = [];
  out.push('<div class="single-result">');

  // Basic info
  out.push('<div class="result-card"><h3>基本信息</h3>');
  out.push('<table><tr><th>公历</th><td>' + (d.birth || {}).solar || d.solar || '-' + '</td>');
  out.push('<th>农历</th><td>' + (d.lunar || '-') + '</td></tr>');
  out.push('<tr><th>时辰</th><td>' + (d.birth || {}).branch || '-' + '</td>');
  out.push('<th>性别</th><td>' + ((d.birth || {}).gender === 'female' ? '女' : '男') + '</td></tr></table></div>');

  // 12 palaces
  if (d.palaces) {
    out.push('<div class="result-card"><h3>十二宫</h3>');
    out.push('<div class="chart-palace-grid">');
    var pnames = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'];
    for (var pi = 0; pi < 12; pi++) {
      var pd = d.palaces[pi] || {};
      var stars = (pd.major || []).concat(pd.minor || []).slice(0, 6);
      out.push('<div class="cp-cell"><div class="cn">' + pnames[pi] + '</div>');
      out.push('<div class="cs">' + stars.join(' ') + '</div></div>');
    }
    out.push('</div></div>');
  }

  // Analysis - call adapted functions if available
  if (typeof renderAnalysis === 'function') {
    try {
      out.push(renderAnalysis(d));
    } catch(e) {
      out.push('<div class="result-card"><p style="color:red">分析出错: ' + e.message + '</p></div>');
    }
  }

  out.push('</div>');
  document.getElementById('s-result').innerHTML = out.join('\n');
}

${adaptedAppJS}

})();
</script>

<script>
// ===== HEPAN TAB LOGIC =====
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
};
</script>

</body>
</html>`;

const outPath = path.join(dir, 'ziwei-metis-unified.html');
fs.writeFileSync(outPath, result, 'utf-8');
console.log('Written:', outPath, '(' + (result.length / 1024).toFixed(1) + ' KB)');

// Validate
if (result.includes('子') && result.includes('丑') && result.includes('寅')) {
  console.log('Chinese chars: OK');
} else {
  console.log('WARNING: Chinese may be corrupted');
}

// Quick checks
console.log('Has Metis CSS:', result.includes('--bg:#fafafa'));
console.log('Has single form:', result.includes('s-year'));
console.log('Has hepan form:', result.includes('a-year'));
console.log('Has engine:', result.includes('ziwei-full-engine.js'));
console.log('Has tab switcher:', result.includes('switchTab'));
console.log('Has adapted app JS:', result.includes('getChartSingle'));
