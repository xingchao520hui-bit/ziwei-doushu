const { astro } = require('iztro');
const { Solar } = require('lunar-javascript');
const { computeCompat } = require('C:\\Users\\LENOVO\\Desktop\\紫薇skills\\合盘\\hepan-cli\\src\\engine\\computeCompat');

function hourToBranch(h) {
  if (h === 23 || h === 0) return 0;
  return Math.ceil(h / 2);
}

/**
 * 将 iztro 命盘转换为合盘引擎需要的格式（简化版，用于测试）
 */
function convertToHepanFormat(astrolabe, year, month, day, hour, gender) {
  const hourIndex = hourToBranch(hour);
  const dizhiNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const shiChen = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  
  // 转换12宫
  const palaces = astrolabe.palaces.map((p, idx) => {
    const major_stars = [];
    const minor_stars = [];
    const adjective_stars = [];
    
    (p.majorStars || []).forEach(s => {
      major_stars.push({ 
        name: s.name, 
        type: 'major', 
        brightness: s.brightness || '平', 
        mutagen: s.mutagen || null 
      });
    });
    
    (p.minorStars || []).forEach(s => {
      const type = ['禄存'].includes(s.name) ? 'lucun' : 
                   ['左辅','右弼','文昌','文曲','天魁','天钺'].includes(s.name) ? 'soft' :
                   ['擎羊','陀罗','火星','铃星','地空','地劫'].includes(s.name) ? 'tough' :
                   ['红鸾','天喜','咸池','天姚'].includes(s.name) ? 'flower' : 'minor';
      minor_stars.push({ 
        name: s.name, 
        type, 
        brightness: s.light || '平', 
        mutagen: s.mutagen || null 
      });
    });
    
    (p.adjectiveStars || []).forEach(s => {
      adjective_stars.push({ 
        name: s.name, 
        type: 'adjective', 
        brightness: null, 
        mutagen: null 
      });
    });
    
    return {
      index: idx,
      name: p.name,
      earthly_branch: p.earthlyBranch,
      heavenly_stem: p.heavenlyStem || '',
      major_stars: major_stars,
      minor_stars: minor_stars,
      adjective_stars: adjective_stars,
      changsheng12: '',
      boshi12: '',
      jiangqian12: '',
      suiqian12: '',
      decadal: p.decadal ? { range: p.decadal.range || [0, 0] } : null,
      ages: p.decadal ? [p.decadal.range[0], p.decadal.range[0]+12, p.decadal.range[0]+24] : [],
      yearly: []
    };
  });
  
  // 找身宫
  let bodyPalace = null;
  for (let i = 0; i < astrolabe.palaces.length; i++) {
    const p = astrolabe.palaces[i];
    if (p.isBodyPalace) {
      bodyPalace = p;
      break;
    }
  }
  
  return {
    birth_info: {
      solar_date: `${year}-${month}-${day}`,
      lunar_date: '',
      chinese_date: '',
      time: shiChen[hourIndex] || '子时',
      time_range: '',
      sign: '',
      zodiac: lunar.getYearShengXiao(),
      gender: gender === 'male' ? '男' : '女',
      birth_place: null,
      true_solar_time: null
    },
    soul_palace: {
      earthly_branch: astrolabe.palaces.find(p => p.name === '命宫')?.earthlyBranch || '子',
      soul: astrolabe.soul,
      index: astrolabe.palaces.findIndex(p => p.name === '命宫'),
      name: '命宫'
    },
    body_palace: {
      earthly_branch: bodyPalace?.earthlyBranch || '',
      body: astrolabe.body
    },
    five_elements_class: astrolabe.fiveElementsClass,
    palaces: palaces
  };
}

// 测试
const a_year = 1993, a_month = 5, a_day = 3, a_hour = 12, a_gender = 'male';
const b_year = 1988, b_month = 6, b_day = 20, b_hour = 14, b_gender = 'female';

const a_hourIndex = hourToBranch(a_hour);
const a_solarDate = `${a_year}-${a_month.toString().padStart(2,'0')}-${a_day.toString().padStart(2,'0')}`;
const a_astrolabe = astro.bySolar(a_solarDate, a_hourIndex, '男', true, 'zh-CN');

const b_hourIndex = hourToBranch(b_hour);
const b_solarDate = `${b_year}-${b_month.toString().padStart(2,'0')}-${b_day.toString().padStart(2,'0')}`;
const b_astrolabe = astro.bySolar(b_solarDate, b_hourIndex, '女', true, 'zh-CN');

const chart_a = convertToHepanFormat(a_astrolabe, a_year, a_month, a_day, a_hour, a_gender);
const chart_b = convertToHepanFormat(b_astrolabe, b_year, b_month, b_day, b_hour, b_gender);

console.log('转换完成，开始计算合盘...');
console.log('chart_a 命宫:', chart_a.palaces.find(p => p.name === '命宫')?.major_stars.map(s => s.name));
console.log('chart_b 命宫:', chart_b.palaces.find(p => p.name === '命宫')?.major_stars.map(s => s.name));

try {
  const result = computeCompat(chart_a, chart_b, {
    rule_version: 'compat/v1',
    reference_year: 2026
  });
  
  console.log('\n✅ 合盘计算成功！');
  console.log('总分:', result.score);
  console.log('各维度:');
  result.dimensions.forEach(d => {
    console.log(`  ${d.id}: ${d.score}/${d.max}`);
  });
} catch (e) {
  console.error('❌ 失败:', e.message);
  console.error(e.stack);
}
