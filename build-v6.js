const fs = require('fs');
const base = __dirname;

// Read extracted parts
const appJS = fs.readFileSync(base + '/_app_fn.js', 'utf8');
let hepanBody = fs.readFileSync(base + '/_hepan_body.html', 'utf8');
const hepanJS = fs.readFileSync(base + '/_hepan_js.js', 'utf8');
const hepanCSS = fs.readFileSync(base + '/_hepan_css.css', 'utf8');

// Remove original render(d) from appJS
const renderStart = appJS.indexOf('\nfunction render(d){');
const renderPalaceStart = appJS.indexOf('\nfunction renderPalaceGrid');
let appJSnoRender;
if (renderStart > -1 && renderPalaceStart > renderStart) {
  appJSnoRender = appJS.substring(0, renderStart) + '\n' + appJS.substring(renderPalaceStart);
} else {
  appJSnoRender = appJS;
}
console.log('appJS length:', appJS.length, '->', appJSnoRender.length);

// Read new render
const newRender = fs.readFileSync(base + '/_render_new.js', 'utf8');

// Read the LEE CSS from a separate file (or write it inline)
const LEE_CSS = fs.readFileSync(base + '/_lee_css.css', 'utf8');

// Remove hepan header from body
const headerIdx = hepanBody.indexOf('<header class="metis-header"');
if (headerIdx > -1) {
  const headerEnd = hepanBody.indexOf('</header>', headerIdx) + 10;
  hepanBody = hepanBody.substring(0, headerIdx) + hepanBody.substring(headerEnd);
}

// ============================================================
// Assemble final page using concatenation (NOT template literals!)
// ============================================================
let out = '';

out += '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n';
out += '<meta charset="UTF-8">\n';
out += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
out += '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n';
out += '<meta http-equiv="Pragma" content="no-cache">\n';
out += '<meta http-equiv="Expires" content="0">\n';
out += '<title>QClaw 紫微斗数 · 排盘 & 合盘</title>\n';
out += '<style>\n';
out += '*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}\n';
out += '\n';
out += '/* Tab Bar */\n';
out += '.tab-bar{display:flex;justify-content:center;gap:0;background:#1a1a2e;padding:0;position:sticky;top:0;z-index:1000;border-bottom:1px solid #333}\n';
out += '.tab-btn{padding:14px 32px;font-size:15px;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:transparent;border:none;color:#999;cursor:pointer;transition:.2s;border-bottom:2px solid transparent}\n';
out += '.tab-btn:hover{color:#c8a96e}\n';
out += '.tab-btn.active{color:#c8a96e;border-bottom-color:#c8a96e}\n';
out += '\n';
out += '/* Tab 1: lee.locker style */\n';
out += LEE_CSS;
out += '\n';
out += '/* Tab 2: Hepan */\n';
out += '#tab-hepan{display:none;--bg:#fafafa;--text:#1a1a1a;--text-muted:#6b6b6b;--text-light:#999;--accent:#2563eb;--accent-light:#3b82f6;--border:#e5e5e5;--card-bg:linear-gradient(180deg,rgba(255,255,255,0.92) 0%,rgba(255,255,255,0.8) 100%);--card-shadow:0 4px 24px rgba(0,0,0,0.05);--card-border:0.5px solid rgba(0,0,0,0.2);--input-bg:#fafafa;--input-border:1px solid #ddd}\n';
out += '#tab-hepan .tab-single{background:#fafafa}\n';
out += hepanCSS;
out += '\n';
out += '</style>\n';
out += '</head>\n';
out += '<body>\n';

// Tab bar
out += '<div class="tab-bar">\n';
out += '  <button class="tab-btn active" data-tab="single" onclick="switchTab(\'single\')">单人起盘</button>\n';
out += '  <button class="tab-btn" data-tab="hepan" onclick="switchTab(\'hepan\')">双人合盘</button>\n';
out += '</div>\n';
out += '\n';

// Tab 1: Single Chart
out += '<!-- Tab 1: Single Chart -->\n';
out += '<div class="tab-single" id="tab-single">\n';
out += '  <div class="l-header">\n';
out += '    <div class="l-logo">QClaw · <span>紫微斗数</span></div>\n';
out += '    <div class="l-sub">AI 斗数排盘 — 提供准确的紫微斗数命盘排盘，支持真太阳时校正</div>\n';
out += '  </div>\n';
out += '\n';
out += '  <div class="l-card">\n';
out += '    <div class="l-field"><label>姓名</label><input type="text" class="l-input" id="s-name" placeholder="请输入姓名（选填）" style="width:100%"></div>\n';
out += '    <div class="l-row">\n';
out += '      <div class="l-field" style="flex:1"><label>性别</label>\n';
out += '        <div class="l-toggle" id="s-gender"><button class="active" data-v="male">男</button><button data-v="female">女</button></div>\n';
out += '      </div>\n';
out += '      <div class="l-field" style="flex:1"><label>历法</label>\n';
out += '        <div class="l-toggle" id="s-calendar"><button class="active" data-v="solar">公历</button><button data-v="lunar">农历</button></div>\n';
out += '      </div>\n';
out += '    </div>\n';
out += '    <div class="l-field"><label>出生日期</label>\n';
out += '      <div class="l-row">\n';
out += '        <input type="number" class="l-input" id="s-year" placeholder="年" min="1900" max="2100" style="flex:2">\n';
out += '        <input type="number" class="l-input" id="s-month" placeholder="月" min="1" max="12" style="flex:1">\n';
out += '        <input type="number" class="l-input" id="s-day" placeholder="日" min="1" max="31" style="flex:1">\n';
out += '      </div>\n';
out += '    </div>\n';
out += '    <div class="l-row">\n';
out += '      <div class="l-field" style="flex:1"><label>出生时辰</label>\n';
out += '        <div class="l-row">\n';
out += '          <select class="l-select" id="s-hour"><option value="0">0时·子</option><option value="2">2时·丑</option><option value="4">4时·寅</option><option value="6">6时·卯</option><option value="8">8时·辰</option><option value="10">10时·巳</option><option value="12" selected>12时·午</option><option value="14">14时·未</option><option value="16">16时·申</option><option value="18">18时·酉</option><option value="20">20时·戌</option><option value="22">22时·亥</option></select>\n';
out += '          <input type="number" class="l-input" id="s-minute" placeholder="分" min="0" max="59" style="max-width:70px">\n';
out += '        </div>\n';
out += '      </div>\n';
out += '    </div>\n';
out += '    <div class="l-field" style="position:relative"><label>出生地点</label>\n';
out += '      <input type="text" class="l-input" id="s-location" placeholder="输入城市名，如：北京、深圳" style="width:100%" autocomplete="off">\n';
out += '      <div class="l-suggest-box" id="s-suggestions"></div>\n';
out += '    </div>\n';
out += '    <div id="s-truesolar" style="display:none;font-size:12px;color:var(--accent);text-align:center;margin-top:6px"></div>\n';
out += '    <button class="l-btn" id="s-submit" onclick="getChart()">排 盘</button>\n';
out += '  </div>\n';
out += '\n';
out += '  <div class="l-loading" id="s-loading">⏳ 正在排盘，请稍候...</div>\n';
out += '  <div class="l-error" id="s-error"></div>\n';
out += '  <div class="l-result" id="s-result"></div>\n';
out += '</div>\n';
out += '\n';

// Tab 2: Hepan
out += '<!-- Tab 2: Hepan -->\n';
out += '<div class="tab-single" id="tab-hepan">\n';
out += '  <div class="l-header" style="padding:20px">\n';
out += '    <div class="l-logo">QClaw · <span>双人合盘</span></div>\n';
out += '    <div class="l-sub">输入双方信息，查看缘分指数与合盘分析</div>\n';
out += '  </div>\n';
out += hepanBody;
out += '\n';
out += '</div>\n';
out += '\n';

// Script: Engine CDN
out += '<script>\n';
out += '(function(){\n';
out += '  if(window.Ziwei)return;\n';
out += '  var s=document.createElement(\'script\');\n';
out += '  s.src=\'https://cdn.jsdelivr.net/gh/xingchao520hui-bit/ziwei-doushu@master/ziwei-full-engine.js\';\n';
out += '  s.onerror=function(){var s2=document.createElement(\'script\');s2.src=\'https://raw.githubusercontent.com/xingchao520hui-bit/ziwei-doushu/master/ziwei-full-engine.js\';document.head.appendChild(s2);};\n';
out += '  document.head.appendChild(s);\n';
out += '})();\n';
out += '</script>\n';
out += '\n';

// Script: Main JS
out += '<script>\n';
out += '// ===== Tab switching =====\n';
out += 'function switchTab(tab){\n';
out += '  document.querySelectorAll(\'.tab-btn\').forEach(function(b){b.classList.toggle(\'active\',b.dataset.tab===tab)});\n';
out += '  document.getElementById(\'tab-single\').style.display=tab===\'single\'?\'block\':\'none\';\n';
out += '  document.getElementById(\'tab-hepan\').style.display=tab===\'hepan\'?\'block\':\'none\';\n';
out += '}\n';
out += '\n';
out += '// ===== Toggle groups =====\n';
out += 'document.querySelectorAll(\'.l-toggle\').forEach(function(g){\n';
out += '  g.querySelectorAll(\'button\').forEach(function(b){\n';
out += '    b.addEventListener(\'click\',function(){\n';
out += '      g.querySelectorAll(\'button\').forEach(function(x){x.classList.remove(\'active\')});\n';
out += '      b.classList.add(\'active\');\n';
out += '    });\n';
out += '  });\n';
out += '});\n';
out += '\n';
out += '// ===== Constants =====\n';
out += 'var API=\'http://localhost:3211\';\n';
out += 'var DZ=[\'子\',\'丑\',\'寅\',\'卯\',\'辰\',\'巳\',\'午\',\'未\',\'申\',\'酉\',\'戌\',\'亥\'];\n';
out += 'var HOUR_LABELS={0:\'子\',2:\'丑\',4:\'寅\',6:\'卯\',8:\'辰\',10:\'巳\',12:\'午\',14:\'未\',16:\'申\',18:\'酉\',20:\'戌\',22:\'亥\'};\n';
out += 'var globalLaiYin=null;\n';
out += '\n';
out += '// ===== App functions (from ziwei-app.html) =====\n';
out += appJSnoRender;
out += '\n';
out += '// ===== LEE.LOCKER STYLE RENDER =====\n';
out += newRender;
out += '\n';
out += '// ===== getChart: client engine wrapper =====\n';
out += 'function getChart(){\n';
out += '  var year=parseInt(document.getElementById(\'s-year\').value);\n';
out += '  var month=parseInt(document.getElementById(\'s-month\').value);\n';
out += '  var day=parseInt(document.getElementById(\'s-day\').value);\n';
out += '  var hour=parseInt(document.getElementById(\'s-hour\').value);\n';
out += '  var minute=parseInt(document.getElementById(\'s-minute\').value)||0;\n';
out += '  var genderGroup=document.getElementById(\'s-gender\');\n';
out += '  var gender=genderGroup.querySelector(\'.active\').dataset.v;\n';
out += '  var location=document.getElementById(\'s-location\').value.trim();\n';
out += '\n';
out += '  if(!year||!month||!day){showError(\'请填写完整的出生日期\');return;}\n';
out += '\n';
out += '  document.getElementById(\'s-loading\').classList.add(\'show\');\n';
out += '  document.getElementById(\'s-error\').classList.remove(\'show\');\n';
out += '  document.getElementById(\'s-result\').classList.remove(\'show\');\n';
out += '  document.getElementById(\'s-submit\').disabled=true;\n';
out += '\n';
out += '  var lng=120;\n';
out += '  if(window.Ziwei&&location){\n';
out += '    var match=matchLocation(location);\n';
out += '    if(match){lng=match.lng;\n';
out += '      document.getElementById(\'s-truesolar\').style.display=\'block\';\n';
out += '      document.getElementById(\'s-truesolar\').textContent=\'已匹配: \'+match.name+\' (经度 \'+lng.toFixed(2)+\'°E)\';\n';
out += '    }\n';
out += '  }\n';
out += '\n';
out += '  setTimeout(function(){\n';
out += '    try{\n';
out += '      var d;\n';
out += '      if(window.Ziwei&&window.Ziwei.computeChart){\n';
out += '        var adj=window.Ziwei.getAdjustedTime(year,month,day,hour,minute,lng);\n';
out += '        d=window.Ziwei.computeChart({year:adj.year,month:adj.month,day:adj.day,hour:adj.hour,minute:adj.minute,gender:gender,location:location,isSolar:true});\n';
out += '        render(d);\n';
out += '      }else{\n';
out += '        fetch(API+\'/api/chart?\'+new URLSearchParams({year:year,month:month,day:day,hour:hour,gender:gender,isSolar:\'true\'}).toString())\n';
out += '        .then(function(r){return r.json()}).then(function(data){render(data)})\n';
out += '        .catch(function(e){showError(\'排盘服务不可用: \'+e.message)});\n';
out += '      }\n';
out += '    }catch(e){showError(\'排盘失败: \'+e.message)}\n';
out += '  },50);\n';
out += '}\n';
out += '\n';
out += 'function showError(msg){\n';
out += '  document.getElementById(\'s-loading\').classList.remove(\'show\');\n';
out += '  document.getElementById(\'s-error\').classList.add(\'show\');\n';
out += '  document.getElementById(\'s-error\').innerHTML=msg;\n';
out += '  document.getElementById(\'s-submit\').disabled=false;\n';
out += '}\n';
out += '\n';
out += '// Location input\n';
out += 'if(typeof buildCityIndex===\'function\')buildCityIndex();\n';
out += 'document.getElementById(\'s-location\').addEventListener(\'input\',function(){if(typeof onLocationInput===\'function\')onLocationInput()});\n';
out += '\n';
out += '// Hepan functions\n';
out += hepanJS;
out += '\n';
out += '</script>\n';
out += '</body>\n';
out += '</html>\n';

fs.writeFileSync(base + '/ziwei-metis-unified.html', out, 'utf8');
console.log('Built:', (out.length / 1024).toFixed(1), 'KB');
console.log('Done!');
