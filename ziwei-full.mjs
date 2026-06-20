/**
 * 紫微斗数全功能浏览器引擎 - 排盘 + 合盘
 * Bundle this with esbuild for in-browser use
 */
import { astro } from 'iztro';
import { Solar } from 'lunar-javascript';
import { computeCompat } from './hepan-browser.mjs';

// ====== UTILS ======
function hourToBranch(h) {
  if (h === 23 || h === 0) return 0;
  return Math.ceil(h / 2);
}

function trueSolarOffset(longitude) {
  return Math.round((longitude - 120) * 4);
}

function getAdjustedTime(hour, minute, longitude) {
  const clockMinutes = hour * 60 + minute;
  const offset = trueSolarOffset(longitude);
  const adjustedMin = clockMinutes + offset;
  let adjustedHour = Math.floor(adjustedMin / 60);
  if (adjustedHour >= 24) adjustedHour -= 24;
  if (adjustedHour < 0) adjustedHour += 24;
  const adjustedMinute = ((adjustedMin % 60) + 60) % 60;
  const branch = hourToBranch(adjustedHour);
  const branchNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const shiChen = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  return {
    adjustedHour, adjustedMinute, branch,
    branchName: branchNames[branch], shiChen: shiChen[branch],
    offset, changed: hourToBranch(hour) !== branch
  };
}

// ====== 排盘 ======
function computeChart(year, month, day, hour, minute, gender, longitude) {
  const adj = getAdjustedTime(hour, minute || 0, longitude);
  const hourIndex = adj.branch;
  const solarDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const genderChar = gender === 'male' || gender === '男' ? '男' : '女';
  const astrolabe = astro.bySolar(solarDate, hourIndex, genderChar, true, 'zh-CN');
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  const palaces = astrolabe.palaces.map(p => {
    const stars = [];
    (p.majorStars || []).forEach(s => stars.push({ name: s.name, type: 'major', brightness: s.brightness || '平', siHua: s.mutagen || null }));
    (p.minorStars || []).forEach(s => stars.push({ name: s.name, type: 'minor', brightness: s.light || '平', siHua: null }));
    (p.adjectiveStars || []).forEach(s => stars.push({ name: s.name, type: 'minor', brightness: '平', siHua: null }));
    return { branch: p.earthlyBranch, stem: p.heavenlyStem, name: p.name, stars, daXianAge: p.decadal ? p.decadal.range : null, isBodyPalace: p.isBodyPalace || false };
  });

  const daXians = palaces.filter(p => p.daXianAge).sort((a, b) => a.daXianAge[0] - b.daXianAge[0])
    .map(p => ({ startAge: p.daXianAge[0], endAge: p.daXianAge[1], palaceName: p.name, palaceBranch: p.branch }));

  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - year;
  let bodyPalace = null;
  for (const p of astrolabe.palaces) { if (p.isBodyPalace) { bodyPalace = p; break; } }
  const mingPalace = astrolabe.palaces.find(p => p.name === '命宫');

  const siHuaStars = {};
  palaces.forEach(p => { p.stars.forEach(s => { if (s.siHua) siHuaStars[s.siHua] = s.name; }); });

  let currentDaXian = null;
  for (const dx of daXians) { if (currentAge >= dx.startAge && currentAge <= dx.endAge) { currentDaXian = dx; break; } }

  return {
    year, month, day, hour, minute, gender: genderChar, longitude,
    adjustedHour: adj.adjustedHour, adjustedBranch: adj.branchName,
    shiChen: adj.shiChen, trueSolarOffset: adj.offset, branchChanged: adj.changed,
    solarDate, lunarDate: `${lunar.getYear()}年${lunar.getMonth()}月${lunar.getDay()}日`,
    zodiac: lunar.getYearShengXiao(), fiveElementsClass: astrolabe.fiveElementsClass,
    soul: astrolabe.soul, body: astrolabe.body,
    mingPalace: mingPalace ? { name: mingPalace.name, branch: mingPalace.earthlyBranch, stem: mingPalace.heavenlyStem, heavenlyStem: mingPalace.heavenlyStem ? parseInt(mingPalace.heavenlyStem) : 0 } : null,
    bodyPalace: bodyPalace ? { name: bodyPalace.name, branch: bodyPalace.earthlyBranch } : null,
    siHuaStars, palaces, daXians, currentAge, currentDaXian
  };
}

// ====== 合盘 (将chart转换为hepan格式) ======
function convertToHepanFormat(result, year, month, day, hour, gender) {
  const hourIndex = hourToBranch(hour);
  const shiChen = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  const palaces = result.palaces.map((p, idx) => {
    const major_stars = [], minor_stars = [], adjective_stars = [];
    p.stars.forEach(s => {
      if (s.type === 'major') {
        major_stars.push({ name: s.name, type: 'major', brightness: s.brightness || '平', mutagen: s.siHua || null });
      } else if (['禄存'].includes(s.name)) {
        minor_stars.push({ name: s.name, type: 'lucun', brightness: s.brightness || '平', mutagen: null });
      } else if (['左辅','右弼','文昌','文曲','天魁','天钺'].includes(s.name)) {
        minor_stars.push({ name: s.name, type: 'soft', brightness: s.brightness || '平', mutagen: null });
      } else if (['擎羊','陀罗','火星','铃星','地空','地劫'].includes(s.name)) {
        minor_stars.push({ name: s.name, type: 'tough', brightness: s.brightness || '平', mutagen: null });
      } else if (['红鸾','天喜','咸池','天姚'].includes(s.name)) {
        minor_stars.push({ name: s.name, type: 'flower', brightness: s.brightness || '平', mutagen: null });
      } else {
        minor_stars.push({ name: s.name, type: 'minor', brightness: s.brightness || '平', mutagen: null });
      }
    });
    return {
      index: idx, name: p.name, earthly_branch: p.branch, heavenly_stem: p.stem || '',
      major_stars, minor_stars, adjective_stars, changsheng12: '', boshi12: '', jiangqian12: '', suiqian12: '',
      decadal: p.daXianAge ? { range: p.daXianAge } : null,
      ages: p.daXianAge ? [p.daXianAge[0], p.daXianAge[0]+12, p.daXianAge[0]+24] : [],
      yearly: []
    };
  });

  const bodyPalace = result.palaces.find(p => p.isBodyPalace);
  return {
    birth_info: {
      solar_date: `${year}-${month}-${day}`, lunar_date: '', chinese_date: '',
      time: shiChen[hourIndex] || '子时', time_range: '', sign: '',
      zodiac: lunar.getYearShengXiao(), gender: gender === 'male' ? '男' : '女',
      birth_place: null, true_solar_time: null
    },
    soul_palace: {
      earthly_branch: result.palaces.find(p => p.name === '命宫')?.branch || '子',
      soul: result.soul, index: result.palaces.findIndex(p => p.name === '命宫'), name: '命宫'
    },
    body_palace: {
      earthly_branch: bodyPalace?.branch || '', body: result.body
    },
    five_elements_class: result.fiveElementsClass,
    palaces
  };
}

function computeHepan(yearA, monthA, dayA, hourA, minA, genderA, lonA, yearB, monthB, dayB, hourB, minB, genderB, lonB) {
  const chartA = computeChart(yearA, monthA, dayA, hourA, minA || 0, genderA, lonA);
  const chartB = computeChart(yearB, monthB, dayB, hourB, minB || 0, genderB, lonB);
  const hepanA = convertToHepanFormat(chartA, yearA, monthA, dayA, hourA, genderA);
  const hepanB = convertToHepanFormat(chartB, yearB, monthB, dayB, hourB, genderB);
  const compat = computeCompat(hepanA, hepanB);
  return { chartA, chartB, hepanA, hepanB, compat };
}

// ====== EXPORT ======
window.Ziwei = {
  computeChart,
  computeHepan,
  getAdjustedTime,
  trueSolarOffset,
  hourToBranch,
  DZ_ORDER: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  GAN: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
};
