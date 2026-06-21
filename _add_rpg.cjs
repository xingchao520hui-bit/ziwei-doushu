// 在 render 函数前插入页面级的 renderPalaceGrid（4×4 布局版本）
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ziwei-metis-unified.html');
let html = fs.readFileSync(filePath, 'utf8');

// 页面级 renderPalaceGrid（4×4 布局，参照 ChartBoard.tsx）
const pageLevelRpg = `
// ═══════════════════════════════════════════════════════════════
// 页面级 renderPalaceGrid：标准 4×4 紫微斗数命盘布局
// 解决：交友宫缺失、宫位错位问题
// ═══════════════════════════════════════════════════════════════
function renderPalaceGrid(d, ming, shen) {
  var html = '';
  html += '<div class="l-card l-card-wide l-chart"><div class="l-chart-title">命盘十二宫</div>';

  var luckyStars = ['天魁','天钺','左辅','右弼','文昌','文曲','禄存','天马','解神'];
  var evilStars  = ['擎羊','陀罗','火星','铃星','地空','地劫','天空'];

  // 用 branch 中文地支做 key 建 palace map（不依赖数组顺序）
  var palaceByBranch = {};
  (d.palaces || []).forEach(function(p){
    if(p && p.branch) palaceByBranch[p.branch] = p;
  });

  // 中文地支 → 4×4 网格 [row, col]（标准紫微斗数布局）
  // 巳午未申 = 第一行：迁移/疾厄/财帛/子女
  // 辰命宫(左) 中宫 酉交友(右)
  // 卯兄弟(左) 中宫 戌官禄(右)
  // 寅丑子亥 = 第四行：父母/福德/田宅/夫妻
  var BG = {
    '巳':[1,1], '午':[1,2], '未':[1,3], '申':[1,4],
    '辰':[2,1],                   '酉':[2,4],
    '卯':[3,1],                   '戌':[3,4],
    '寅':[4,1], '丑':[4,2], '子':[4,3], '亥':[4,4]
  };

  var rows = {};
  for(var r=1; r<=4; r++) rows[r] = {};
  Object.keys(BG).forEach(function(b){
    var pos = BG[b];
    var p = palaceByBranch[b];
    if(p) rows[pos[0]][pos[1]] = p;
  });

  var mingGong = ming || d.palaces.find(function(p){ return p.name === '命宫'; });
  var shenGong = shen || d.palaces.find(function(p){ return p.isBodyPalace || p.name === '身宫'; });

  var info = d.info || {};
  var birth = d.birth || {};
  var genderTxt = (birth.gender === 'male') ? '阳男' : '阴女';
  var wuxingJu = info.wuxingJu || d.fiveElements || '';
  var lunarInfo = '';
  if (d.lunar) {
    lunarInfo = d.lunar.yearName ? (d.lunar.yearName+d.lunar.monthName+d.lunar.dayName) : ((d.lunar.year||'')+'年'+(d.lunar.month||'')+'月'+(d.lunar.day||'')+'日');
  }

  var centerHtml = '<table style="width:100%;height:100%"><tr><td style="text-align:center;vertical-align:middle;padding:8px">' +
    '<div class="l-center-title">' + genderTxt + ' ' + wuxingJu + '</div>' +
    '<div class="l-center-time">' +
    '<div>真太阳时 ' + (birth.year||'') + '.' + (birth.month||'') + '.' + (birth.day||'') + ' ' + (birth.hour||'') + ':' + (birth.minute||'00') + '</div>' +
    (lunarInfo ? '<div>农历 ' + lunarInfo + '</div>' : '') +
    '</div>' +
    (mingGong ? '<div class="l-center-ming">命主 ' + (info.mingZhu||'') + ' 命宫 ' + (mingGong.branch||'') + '</div>' : '') +
    (shenGong ? '<div class="l-center-shen">身主 ' + (info.shenZhu||'') + ' 身宫 ' + (shenGong.branch||'') + '</div>' : '') +
    '</td></tr></table>';

  function cellTd(p) {
    if (!p) return '<td class="l-cell l-empty"></td>';
    var isMing = p.name === '命宫';
    var isShen = p.isBodyPalace || p.name === '身宫';
    var cls = 'l-cell';
    if (isMing) cls += ' ming';
    if (isShen && !isMing) cls += ' shen';
    var h = '<td class="' + cls + '">';
    if (p.daXianAge) h += '<div class="l-daxian-top">' + p.daXianAge[0] + '-' + p.daXianAge[1] + '岁</div>';
    h += '<div class="l-pstars">';
    (p.stars||[]).forEach(function(s) {
      var cl = '';
      if (s.type === 'major') cl = 'mj';
      else if (luckyStars.indexOf(s.name) > -1) cl = 'lk';
      else if (evilStars.indexOf(s.name) > -1) cl = 'el';
      h += '<span class="' + cl + '">' + starName(s) + '</span>';
    });
    h += '</div>';
    h += '<div class="l-pbottom">';
    h += '<span class="l-pstembranch">' + (p.stem||'') + (p.branch||'') + '</span>';
    h += '<span class="l-pname2">' + p.name + '</span>';
    if (isMing) h += ' <span class="l-pbadge l-pbadge-m">命</span>';
    if (isShen && !isMing) h += ' <span class="l-pbadge l-pbadge-s">身</span>';
    h += '</div>';
    h += '</td>';
    return h;
  }

  html += '<table class="l-zwtable">';
  // Row 1: 巳午未申
  html += '<tr>' + cellTd(rows[1][1]) + cellTd(rows[1][2]) + cellTd(rows[1][3]) + cellTd(rows[1][4]) + '</tr>';
  // Row 2: 辰 中宫 酉
  html += '<tr>' + cellTd(rows[2][1]) + '<td colspan="2" rowspan="2" class="l-center">' + centerHtml + '</td>' + cellTd(rows[2][4]) + '</tr>';
  // Row 3: 卯 中宫 戌
  html += '<tr>' + cellTd(rows[3][1]) + cellTd(rows[3][4]) + '</tr>';
  // Row 4: 寅丑子亥
  html += '<tr>' + cellTd(rows[4][1]) + cellTd(rows[4][2]) + cellTd(rows[4][3]) + cellTd(rows[4][4]) + '</tr>';
  html += '</table></div>';
  return html;
}

`;

const renderPos = html.indexOf('function render(');
if (renderPos === -1) {
    console.log('ERROR: 找不到 render 函数');
    process.exit(1);
}

// 在 render 函数之前插入
const beforeRender = html.substring(0, renderPos);
const afterRender = html.substring(renderPos);
const newHtml = beforeRender + pageLevelRpg + afterRender;

fs.writeFileSync(filePath + '.bak3', html);
fs.writeFileSync(filePath, newHtml, 'utf8');
console.log('renderPalaceGrid 已恢复！');
console.log('文件大小:', fs.statSync(filePath).size, 'bytes');
console.log('插入位置:', renderPos, '(相对于文件)');
