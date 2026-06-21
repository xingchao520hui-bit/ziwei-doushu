// _fix_4x4.cjs — 将 renderPalaceGrid 从九宫格改为标准4×4紫微斗数排盘
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'ziwei-metis-unified.html');
let html = fs.readFileSync(filePath, 'utf-8');

// 标记：第二个 renderPalaceGrid（实际被调用的那个）
const marker = "function renderPalaceGrid(d, ming, shen) {\n  var html = '';\n  html += '<div class=\"l-card l-card-wide l-chart\"><div class=\"l-chart-title\">命盘十二宫</div>'";

const startIdx = html.indexOf(marker);
if (startIdx === -1) {
  // 尝试 \r\n 版本
  const marker2 = marker.replace(/\n/g, '\r\n');
  const startIdx2 = html.indexOf(marker2);
  if (startIdx2 === -1) {
    console.error('❌ Cannot find renderPalaceGrid start');
    process.exit(1);
  }
  console.log('Found at (\\r\\n):', startIdx2);
  replaceAt(startIdx2);
} else {
  console.log('Found at (\\n):', startIdx);
  replaceAt(startIdx);
}

function replaceAt(startIdx) {
  // 找到函数结尾: 下一个 function 定义之前
  const endMarker = "\nfunction renderOneCell(";
  let endIdx = html.indexOf(endMarker, startIdx);
  if (endIdx === -1) {
    endIdx = html.indexOf("\r\nfunction renderOneCell(", startIdx);
  }
  if (endIdx === -1) {
    console.error('❌ Cannot find renderOneCell after renderPalaceGrid');
    process.exit(1);
  }

  console.log('Replacing from', startIdx, 'to', endIdx, '(' + (endIdx - startIdx) + ' bytes)');

  const newFn = `function renderPalaceGrid(d, ming, shen) {
  var html = '';
  html += '<div class="l-card l-card-wide l-chart"><div class="l-chart-title">命盘十二宫</div>';

  var luckyStars = ['天魁','天钺','左辅','右弼','文昌','文曲','禄存','天马','解神'];
  var evilStars  = ['擎羊','陀罗','火星','铃星','地空','地劫','天空'];

  function getPalace(name) { return d.palaces.find(function(p){ return p.name === name; }); }

  var pMing = getPalace('命宫');
  var pXiongdi = getPalace('兄弟');
  var pFuqi = getPalace('夫妻');
  var pZinv = getPalace('子女');
  var pCaifu = getPalace('财帛');
  var pJieyi = getPalace('疾厄');
  var pQianyi = getPalace('迁移');
  var pJiaoyou = getPalace('交友');
  var pGuanlu = getPalace('官禄');
  var pTianzhai = getPalace('田宅');
  var pFude = getPalace('福德');
  var pFumu = getPalace('父母');

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
    (pMing ? '<div class="l-center-ming">命主 ' + (info.mingZhu||'') + ' 命宫 ' + (pMing.branch||'') + '</div>' : '') +
    (shen ? '<div class="l-center-shen">身主 ' + (info.shenZhu||'') + ' 身宫 ' + (shen.branch||'') + '</div>' : '') +
    '</td></tr></table>';

  function cellTd(p) {
    if (!p) return '<td class="l-cell l-empty"></td>';
    var isMing = p.name === '命宫';
    var isShen = !!p.isBodyPalace;
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
  html += '<tr>' + cellTd(pMing) + cellTd(pXiongdi) + cellTd(pFuqi) + cellTd(pZinv) + '</tr>';
  html += '<tr>' + cellTd(pCaifu) + '<td colspan="2" rowspan="2" class="l-center">' + centerHtml + '</td>' + cellTd(pJieyi) + '</tr>';
  html += '<tr>' + cellTd(pFumu) + cellTd(pQianyi) + '</tr>';
  html += '<tr>' + cellTd(pFude) + cellTd(pTianzhai) + cellTd(pGuanlu) + cellTd(pJiaoyou) + '</tr>';
  html += '</table></div>';
  return html;
}`;

  html = html.substring(0, startIdx) + newFn + html.substring(endIdx);
  fs.writeFileSync(filePath, html, 'utf-8');
  console.log('✅ Done! File size:', html.length, 'bytes');
}
