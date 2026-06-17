/**
 * 紫微斗数排盘工具 - 命令行版本
 * 使用 iztro + lunar-javascript 精确计算
 * 
 * 用法: node chart-cli.js 1999 2 17 22 male
 */
const { astro } = require('iztro');
const { Solar } = require('lunar-javascript');

const [,, year, month, day, hour, gender] = process.argv;

if (!year) {
  console.log('用法: node chart-cli.js <年> <月> <日> <时:0-23> <性别:male/female>');
  console.log('示例: node chart-cli.js 1999 2 17 22 male');
  process.exit(1);
}

const birthYear = parseInt(year);
const birthMonth = parseInt(month);
const birthDay = parseInt(day);
const birthHour = parseInt(hour);
const birthGender = gender === 'male' ? '男' : '女';

// 时辰转换 (24小时制 -> 12时辰地支索引)
// 子(0):23-01  丑(1):01-03  寅(2):03-05  卯(3):05-07
// 辰(4):07-09  巳(5):09-11  午(6):11-13  未(7):13-15
// 申(8):15-17  酉(9):17-19  戌(10):19-21 亥(11):21-23
function hourToBranch(h) {
  if (h === 23 || h === 0) return 0;  // 子时
  return Math.ceil(h / 2);
}

const hourIndex = hourToBranch(birthHour);
console.log(`时辰索引: ${hourIndex} (${['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][hourIndex]}时)`);

// 排盘
const solarDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
console.log(`排盘日期: ${solarDate}`);

const astrolabe = astro.bySolar(solarDate, hourIndex, birthGender, true, 'zh-CN');

// 基本信息
console.log('\n========== 基本信息 ==========');
const solar = Solar.fromYmd(birthYear, birthMonth, birthDay);
const lunar = solar.getLunar();
console.log(`阳历: ${birthYear}年${birthMonth}月${birthDay}日 ${birthHour}时`);
console.log(`农历: ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`);
console.log(`八字: ${lunar.getYearInGanZhi()} ${lunar.getMonthInGanZhi()} ${lunar.getDayInGanZhi()} ${lunar.getTimeInGanZhi()}`);
console.log(`五行局: ${astrolabe.fiveElementsClass}`);
console.log(`命主: ${astrolabe.soul}`);
console.log(`身主: ${astrolabe.body}`);

// 十二宫
console.log('\n========== 十二宫 ==========');
const dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

astrolabe.palaces.forEach((p, i) => {
  console.log(`\n[${p.earthlyBranch}宫] ${p.name} (天干: ${p.heavenlyStem})`);
  console.log(`  身宫: ${p.isBodyPalace ? '是' : '否'}`);
  
  if (p.decadal) {
    console.log(`  大限: ${p.decadal.range[0]}~${p.decadal.range[1]}岁`);
  }
  
  // 主星
  if (p.majorStars && p.majorStars.length > 0) {
    console.log('  主星:');
    p.majorStars.forEach(s => {
      const extras = [];
      if (s.brightness) extras.push(s.brightness);
      if (s.mutagen) extras.push(s.mutagen);
      console.log(`    ${s.name}${extras.length > 0 ? '[' + extras.join(',') + ']' : ''}`);
    });
  }
  
  // 辅星
  if (p.minorStars && p.minorStars.length > 0) {
    console.log('  辅星:');
    p.minorStars.forEach(s => {
      console.log(`    ${s.name}${s.scope ? '[' + s.scope + ']' : ''}${s.light ? '[' + s.light + ']' : ''}`);
    });
  }
  
  // 杂耀
  if (p.adjectiveStars && p.adjectiveStars.length > 0) {
    const names = p.adjectiveStars.map(s => s.name).join(', ');
    console.log(`  小星: ${names}`);
  }
});

// 四化
console.log('\n========== 四化 ==========');
if (astrolabe.horoscope) {
  ['heavenlyStem', 'earthlyBranch', 'ruYi', 'tianShang', 'tianShi', 'tianXing'].forEach(k => {
    if (astrolabe.horoscope[k]) {
      console.log(`${k}: ${JSON.stringify(astrolabe.horoscope[k])}`);
    }
  });
}

console.log('\n========== 完成 ==========');
