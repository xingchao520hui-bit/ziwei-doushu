// _patch_3x3.cjs — 将4×4宫位布局改为3×3九宫格
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ziwei-metis-unified.html');
let html = fs.readFileSync(filePath, 'utf8');

// 新的3×3九宫格 renderPalaceGrid
const newRenderPalaceGrid = `// ===== 3×3 九宫格 renderPalaceGrid =====
function renderPalaceGrid(d, ming, shen) {
  var html = '';
  html += '<div class="l-card l-card-wide l-chart"><div class="l-chart-title">命盘十二宫</div>';

  var luckyStars = ['天魁','天钺','左辅','右弼','文昌','文曲','禄存','天马','解神'];
  var evilStars  = ['擎羊','陀罗','火星','铃星','地空','地劫'];

  var palaceOrder = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'];

  var nameToPalace = {};
  d.palaces.forEach(function(p){ nameToPalace[p.name] = p; });

  // 九宫格9个位置，每格1-2宫，12宫全展示
  //  0  1  2
  //  7  8  3   中宫=8
  //  6  5  4
  var cellMap = [
    ['命宫','兄弟'],
    ['夫妻','子女'],
    ['财帛','疾厄'],
    ['迁移','交友'],
    ['官禄','田宅'],
    ['福德','父母'],
    null,
    null,
    'CENTER'
  ];

  var mingPalace = nameToPalace['命宫'] || {};
  var mingStars = (mingPalace.stars || []).filter(function(s){return s.type==='major';}).map(function(s){return s.name;}).join('、');
  var wuxing = d.fiveElements || (ming && ming.wuxing) || '水二局';
  var gender = (d.birth && d.birth.gender === 'male') ? '阳男' : '阴女';
  var birthTime = [d.birth.yearName, d.birth.monthName, d.birth.dayName].filter(Boolean).join('年').replace(/^|年/g, function(m){return m?'年':'';}) + '日';

  var centerHtml = '<div class="l-center-info">' +
    '<div class="l-center-stars">' + (mingStars||'天同') + '</div>' +
    '<div class="l-center-wx">' + wuxing + '</div>' +
    '<div class="l-center-gender">' + gender + '</div>' +
    '<div class="l-center-time">' + (d.birth.yearName||'') + '年' + (d.birth.monthName||'') + '月' + (d.birth.dayName||'') + '日</div>' +
    '<div class="l-center-mz">命主:' + (ming&&ming.mingzhu||'贪狼') + '</div>' +
    '<div class="l-center-sz">身主:' + (shen&&shen.shenzhu||'天相') + '</div>' +
    '</div>';

  function nineCell(p1name, p2name) {
    var p1 = p1name ? nameToPalace[p1name] : null;
    var p2 = p2name ? nameToPalace[p2name] : null;
    var cls = 'l-cell l-cell-nine';
    if (p1 && ming && p1.name === ming.name) cls += ' ming';
    else if (p1 && shen && p1.name === shen.name) cls += ' shen';

    var h = '<div class="' + cls + '">';
    if (p1) {
      var s1 = (p1.stars||[]).map(function(x){return x.name;}).join('、')||'无';
      h += '<div class="l-nine-group"><div class="l-nine-title">'+p1.name+'</div><div class="l-nine-stars">'+s1+'</div><div class="l-nine-branch">'+p1.branch+'</div></div>';
    }
    if (p2) {
      h += '<div class="l-nine-sep"></div>';
      var s2 = (p2.stars||[]).map(function(x){return x.name;}).join('、')||'无';
      h += '<div class="l-nine-group"><div class="l-nine-title">'+p2.name+'</div><div class="l-nine-stars">'+s2+'</div><div class="l-nine-branch">'+p2.branch+'</div></div>';
    }
    return h + '</div>';
  }

  // 生成9格HTML
  var cells = [];
  for (var i = 0; i < 9; i++) {
    if (i === 8) {
      cells[8] = '<div class="l-cell l-cell-center">' + centerHtml + '</div>';
    } else if (cellMap[i]) {
      cells[i] = nineCell(cellMap[i][0], cellMap[i][1]);
    } else {
      cells[i] = '<div class="l-cell l-cell-nine l-cell-empty"><div class="l-nine-title">—</div></div>';
    }
  }

  html += '<div class="l-3x3-grid">';
  html += '<div class="l-grid-row">' + cells[0] + cells[1] + cells[2] + '</div>';
  html += '<div class="l-grid-row">' + cells[7] + cells[8] + cells[3] + '</div>';
  html += '<div class="l-grid-row">' + cells[6] + cells[5] + cells[4] + '</div>';
  html += '</div></div>';
  return html;
}`;

const newCSS = `
/* 3×3 九宫格 */
.l-3x3-grid{display:flex;flex-direction:column;gap:5px;margin:0 auto;width:fit-content}
.l-grid-row{display:flex;gap:5px}
.l-cell-nine{width:145px;min-height:130px;border:1.5px solid #C4A97D;border-radius:8px;background:#FFFEF8;padding:7px;display:flex;flex-direction:column;gap:0;font-size:12px;overflow:hidden}
.l-cell-nine.ming{background:linear-gradient(135deg,#FFF0E6,#FFE0C8);border-color:#D4956A}
.l-cell-nine.shen{background:linear-gradient(135deg,#EDE7F6,#E8D5F5);border-color:#B39DDB}
.l-cell-center{width:145px;min-height:130px;border:2px solid #D4A574;border-radius:8px;background:linear-gradient(145deg,#FFF8E1,#FFE9C4);padding:8px;display:flex;align-items:center;justify-content:center}
.l-center-info{text-align:center}
.l-center-stars{font-size:16px;font-weight:bold;color:#8B2500;margin-bottom:4px}
.l-center-wx{font-size:12px;color:#6B4E31;margin-bottom:3px;font-weight:500}
.l-center-gender{font-size:11px;color:#9B8B7A;margin-bottom:2px}
.l-center-time{font-size:10px;color:#9B8B7A;margin-bottom:3px}
.l-center-mz,.l-center-sz{font-size:10px;color:#8B7355;text-align:left}
.l-nine-group{flex:1;min-height:0}
.l-nine-title{font-size:11px;font-weight:bold;color:#5D3A1A;margin-bottom:2px}
.l-nine-stars{font-size:11px;color:#8B4513;line-height:1.35;word-break:break-all}
.l-nine-branch{font-size:10px;color:#9B8B7A;margin-top:1px}
.l-nine-sep{height:1px;background:#D8C8A8;margin:4px 0}
.l-cell-empty{background:#F8F4EE;justify-content:center;align-items:center}
`;

// 1. 注入CSS
if (!html.includes('.l-3x3-grid')) {
  html = html.replace(/(<\/style>)/, newCSS + '\n$1');
}

// 2. 替换函数
var marker = '// ===== LEE.LOCKER STYLE RENDER =====';
var markerIdx = html.indexOf(marker);
if (markerIdx === -1) { console.log('❌ 未找到函数标记'); process.exit(1); }

// 找 renderOneCell 开始（函数结束）
var endMarker = '\r\nfunction renderOneCell';
var endIdx = html.indexOf(endMarker, markerIdx);
if (endIdx === -1) { console.log('❌ 未找到 renderOneCell'); process.exit(1); }

var before = html.slice(0, markerIdx);
var after = html.slice(endIdx);
html = before + newRenderPalaceGrid + after;

fs.writeFileSync(filePath, html, 'utf8');
console.log('✅ 3×3 九宫格补丁已应用，文件已保存');
