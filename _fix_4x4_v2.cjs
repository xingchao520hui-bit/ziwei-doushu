// _fix_4x4_v2.cjs — 修正4×4排盘：以命宫地支为起点正确排列12宫
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'ziwei-metis-unified.html');
let html = fs.readFileSync(filePath, 'utf-8');

// 地支顺序（顺时针）：子丑寅卯辰巳午未申酉戌亥
// 紫微斗数十二宫固定对应：命宫起始，逆时针
// 宫位名称的固定顺序（从命宫开始逆时针）：
// 命宫→兄弟→夫妻→子女→财帛→疾厄→迁移→交友→官禄→田宅→福德→父母
// 这就是 iztro 的 palaceOrder

// 标准4×4表格位置（从截图确认）：
//   [0]       [1]       [2]       [3]
//   命宫      兄弟      夫妻      子女
//   [4]       [5~8中宫]          [9]
//   财帛                         疾厄
//   [10]      [11]      [12]      [13]
//   父母      福德      田宅      官禄  ← 这行缺交友！
//
// 但用户要的是包含全部12宫。看参考图实际布局：
//   Row0: 命宫  兄弟  夫妻  子女     (4宫)
//   Row1: 财帛  [中宫2x2]  疾厄    (2宫+中宫)
//   Row2: 父母           迁移       (2宫)
//   Row3: 福德  田宅  官禄  交友     (4宫)
// 总计: 4+2+2+4=12宫 ✓ 全部包含！

// 问题：当前代码可能把宫位放错了格子
// 需要确认：不是按宫名硬编码位置，而是按"命宫在哪"来决定整体旋转
// 但实际上紫微斗数4×4格式是固定的——命宫永远在左上角位置
// 因为表格本身就是按"命宫在左上"设计的

// 让我重新检查当前 renderPalaceGrid 的代码
const startMarker = "function renderPalaceGrid(d, ming, shen) {\n  var html = '';\n  html += '<div class=\"l-card l-card-wide l-chart\"><div class=\"l-chart-title\">命盘十二宫</div>'";
let startIdx = html.indexOf(startMarker);
if (startIdx === -1) {
  const m2 = startMarker.replace(/\n/g, '\r\n');
  startIdx = html.indexOf(m2);
}
if (startIdx === -1) {
  console.error('Cannot find renderPalaceGrid');
  process.exit(1);
}

const endMarker1 = "\nfunction renderOneCell(";
const endMarker2 = "\r\nfunction renderOneCell(";
let endIdx = html.indexOf(endMarker1, startIdx);
if (endIdx === -1) endIdx = html.indexOf(endMarker2, startIdx);
if (endIdx === -1) {
  console.error('Cannot find end');
  process.exit(1);
}

console.log('Current function at', startIdx, '-', endIdx, '(' + (endIdx-startIdx) + ' bytes)');
console.log('---CURRENT CODE---');
console.log(html.substring(startIdx, endIdx));

// 新版本：确保12宫全部正确放置
const newFn = `function renderPalaceGrid(d, ming, shen) {
  var html = '';
  html += '<div class="l-card l-card-wide l-chart"><div class="l-chart-title">命盘十二宫</div>';

  var luckyStars = ['天魁','天钺','左辅','右弼','文昌','文曲','禄存','天马','解神'];
  var evilStars  = ['擎羊','陀罗','火星','铃星','地空','地劫','天空'];

  function getPalace(name) { return d.palaces.find(function(p){ return p.name === name; }); }

  // 标准4×4紫微斗数排盘（12宫全含）
  // Row0: 命宫 兄弟 夫妻 子女
  // Row1: 财帛 [中宫colspan=2 rowspan=2] 疾厄
  // Row2: 父母                 迁移
  // Row3: 福德 田宅 官禄 交友
  var cells = {
    r0c0: getPalace('命宫'),
    r0c1: getPalace('兄弟'),
    r0c2: getPalace('夫妻'),
    r0c3: getPalace('子女'),
    r1c0: getPalace('财帛'),
    r1c3: getPalace('疾厄'),
    r2c0: getPalace('父母'),
    r2c3: getPalace('迁移'),
    r3c0: getPalace('福德'),
    r3c1: getPalace('田宅'),
    r3c2: getPalace('官禄'),
    r3c3: getPalace('交友')   // 交友宫在这里！
  };

  // 中宫信息
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
    '<div>钟表时间 ' + (birth.year||'') + '.' + (birth.month||'') + '.' + (birth.day||'') + ' ' + (birth.hour||'') + ':00</div>' +
    (lunarInfo ? '<div>农历时间 ' + lunarInfo + '</div>' : '') +
    '</div>' +
    (cells.r0c0 ? '<div class="l-center-ming">命主 ' + (info.mingZhu||'') + ' 命宫 ' + (cells.r0c0.branch||'') + '</div>' : '') +
    (shen ? '<div class="l-center-shen">身主 ' + (info.shenZhu||'') + ' 身宫 ' + (shen.branch||'') + '</div>' : '') +
    '</td></tr></table>';

  // 渲染单个宫位TD
  function cellTd(p) {
    if (!p) return '<td class="l-cell l-empty"></td>';
    var isMing = p.name === '命宫';
    var isShen = !!p.isBodyPalace;
    var cls = 'l-cell';
    if (isMing) cls += ' ming';
    if (isShen && !isMing) cls += ' shen';
    var h = '<td class="' + cls + '">';
    // 大限年龄
    if (p.daXianAge) h += '<div class="l-daxian-top">' + p.daXianAge[0] + '-' + p.daXianAge[1] + '岁</div>';
    // 星曜
    h += '<div class="l-pstars">';
    (p.stars||[]).forEach(function(s) {
      var cl = '';
      if (s.type === 'major') cl = 'mj';
      else if (luckyStars.indexOf(s.name) > -1) cl = 'lk';
      else if (evilStars.indexOf(s.name) > -1) cl = 'el';
      h += '<span class="' + cl + '">' + starName(s) + '</span>';
    });
    h += '</div>';
    // 底部：干支+宫名
    h += '<div class="l-pbottom">';
    h += '<span class="l-pstembranch">' + (p.stem||'') + (p.branch||'') + '</span>';
    h += '<span class="l-pname2">' + p.name + '</span>';
    if (isMing) h += ' <span class="l-pbadge l-pbadge-m">命</span>';
    if (isShen && !isMing) h += ' <span class="l-pbadge l-pbadge-s">身</span>';
    h += '</div>';
    h += '</td>';
    return h;
  }

  // 4×4表格输出
  html += '<table class="l-zwtable">';
  // Row0
  html += '<tr>' + cellTd(cells.r0c0) + cellTd(cells.r0c1) + cellTd(cells.r0c2) + cellTd(cells.r0c3) + '</tr>';
  // Row1
  html += '<tr>' + cellTd(cells.r1c0) + '<td colspan="2" rowspan="2" class="l-center">' + centerHtml + '</td>' + cellTd(cells.r1c3) + '</tr>';
  // Row2
  html += '<tr>' + cellTd(cells.r2c0) + cellTd(cells.r2c3) + '</tr>';
  // Row3
  html += '<tr>' + cellTd(cells.r3c0) + cellTd(cells.r3c1) + cellTd(cells.r3c2) + cellTd(cells.r3c3) + '</tr>';
  html += '</table></div>';
  return html;
}`;

html = html.substring(0, startIdx) + newFn + html.substring(endIdx);
fs.writeFileSync(filePath, html, 'utf-8');
console.log('✅ Done! File size:', html.length, 'bytes');
