/**
 * Browser bundle entry point - exports chart computation for in-browser use
 */
import { astro } from 'iztro';
import { Solar } from 'lunar-javascript';

function hourToBranch(h) {
  if (h === 23 || h === 0) return 0;
  return Math.ceil(h / 2);
}

/**
 * Compute true solar time offset in minutes
 */
function trueSolarOffset(longitude) {
  return Math.round((longitude - 120) * 4);
}

/**
 * Get adjusted birth hour + branch for true solar time
 */
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
    adjustedHour,
    adjustedMinute,
    branch,
    branchName: branchNames[branch],
    shiChen: shiChen[branch],
    offset,
    changed: hourToBranch(hour) !== branch
  };
}

/**
 * Compute full chart data (equivalent to /chart API)
 */
function computeChart(year, month, day, hour, minute, gender, longitude) {
  // Apply true solar time correction
  const adj = getAdjustedTime(hour, minute || 0, longitude);
  const hourIndex = adj.branch;
  
  const solarDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const genderChar = gender === 'male' || gender === '男' ? '男' : '女';
  const astrolabe = astro.bySolar(solarDate, hourIndex, genderChar, true, 'zh-CN');
  
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  
  // Build palaces with stars
  const palaces = astrolabe.palaces.map(p => {
    const stars = [];
    (p.majorStars || []).forEach(s => {
      stars.push({ name: s.name, type: 'major', brightness: s.brightness || '平', siHua: s.mutagen || null });
    });
    (p.minorStars || []).forEach(s => {
      stars.push({ name: s.name, type: 'minor', brightness: s.light || '平', siHua: null });
    });
    (p.adjectiveStars || []).forEach(s => {
      stars.push({ name: s.name, type: 'minor', brightness: '平', siHua: null });
    });
    return {
      branch: p.earthlyBranch,
      stem: p.heavenlyStem,
      name: p.name,
      stars: stars,
      daXianAge: p.decadal ? p.decadal.range : null,
      isBodyPalace: p.isBodyPalace || false
    };
  });
  
  // DaXian timeline
  const daXians = palaces.filter(p => p.daXianAge)
    .sort((a, b) => a.daXianAge[0] - b.daXianAge[0])
    .map(p => ({
      startAge: p.daXianAge[0],
      endAge: p.daXianAge[1],
      palaceName: p.name,
      palaceBranch: p.branch
    }));
  
  const dizhiNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - year;
  
  // Get body palace info
  let bodyPalace = null;
  for (const p of astrolabe.palaces) {
    if (p.isBodyPalace) { bodyPalace = p; break; }
  }
  
  // Get soul/heavenly stem
  const mingPalace = astrolabe.palaces.find(p => p.name === '命宫');
  
  // SiHua (四化)
  const siHuaStars = {};
  palaces.forEach(p => {
    p.stars.forEach(s => {
      if (s.siHua) {
        siHuaStars[s.siHua] = s.name;
      }
    });
  });
  
  // Find current daXian
  let currentDaXian = null;
  for (const dx of daXians) {
    if (currentAge >= dx.startAge && currentAge <= dx.endAge) {
      currentDaXian = dx;
      break;
    }
  }
  
  return {
    year, month, day, hour, minute, gender: genderChar, longitude,
    adjustedHour: adj.adjustedHour,
    adjustedBranch: adj.branchName,
    shiChen: adj.shiChen,
    trueSolarOffset: adj.offset,
    branchChanged: adj.changed,
    solarDate,
    lunarDate: `${lunar.getYear()}年${lunar.getMonth()}月${lunar.getDay()}日`,
    zodiac: lunar.getYearShengXiao(),
    fiveElementsClass: astrolabe.fiveElementsClass,
    soul: astrolabe.soul,
    body: astrolabe.body,
    mingPalace: mingPalace ? {
      name: mingPalace.name,
      branch: mingPalace.earthlyBranch,
      stem: mingPalace.heavenlyStem,
      heavenlyStem: mingPalace.heavenlyStem ? parseInt(mingPalace.heavenlyStem) : 0
    } : null,
    bodyPalace: bodyPalace ? {
      name: bodyPalace.name,
      branch: bodyPalace.earthlyBranch
    } : null,
    siHuaStars,
    palaces,
    daXians,
    currentAge,
    currentDaXian
  };
}

// Export globally
window.Ziwei = {
  computeChart,
  getAdjustedTime,
  trueSolarOffset,
  hourToBranch,
  DZ_ORDER: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  GAN: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
};
