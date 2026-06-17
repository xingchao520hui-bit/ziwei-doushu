/**
 * 紫微斗数排盘 + 合盘服务器（简化测试版）
 */
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { astro } = require('iztro');
const { Solar } = require('lunar-javascript');

// 加载合盘引擎
let computeCompat = null;
try {
  const hepan = require('C:\\Users\\LENOVO\\Desktop\\紫薇skills\\合盘\\hepan-cli\\src\\engine\\computeCompat');
  computeCompat = hepan.computeCompat;
  console.log('✅ 合盘引擎加载成功');
} catch (e) {
  console.error('❌ 合盘引擎加载失败:', e.message);
}

function hourToBranch(h) {
  if (h === 23 || h === 0) return 0;
  return Math.ceil(h / 2);
}

function convertToHepanFormat(astrolabe, year, month, day, hour, gender) {
  const hourIndex = hourToBranch(hour);
  const dizhiNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const shiChen = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  
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
  
  let bodyPalace = null;
  for (let i = 0; i < astrolabe.palaces.length; i++) {
    if (astrolabe.palaces[i].isBodyPalace) {
      bodyPalace = astrolabe.palaces[i];
      break;
    }
  }
  
  return {
    birth_info: {
      solar_date: `${year}-${month}-${day}`,
      time: shiChen[hourIndex] || '子时',
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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsed = url.parse(req.url, true);
  
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', hepan_loaded: computeCompat !== null }));
    return;
  }
  
  if (parsed.pathname === '/chart') {
    // 正确实现排盘接口
    const year = parseInt(parsed.query.year);
    const month = parseInt(parsed.query.month);
    const day = parseInt(parsed.query.day);
    const hour = parseInt(parsed.query.hour);
    const gender = parsed.query.gender || 'male';
    
    // 参数验证
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour)) {
      res.writeHead(400, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(JSON.stringify({ error: '出生信息不完整或无效' }));
      return;
    }
    
    try {
      const hourIndex = hourToBranch(hour);
      const solarDate = `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
      const gender_cn = gender === 'male' ? '男' : '女';
      const astrolabe = astro.bySolar(solarDate, hourIndex, gender_cn, true, 'zh-CN');
      
      const chartData = convertToHepanFormat(astrolabe, year, month, day, hour, gender);
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(JSON.stringify({ success: true, data: chartData }));
    } catch (e) {
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(JSON.stringify({ error: e.message, stack: e.stack }));
    }
    return;
  }
  
  if (parsed.pathname === '/hepan') {
    if (!computeCompat) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '合盘引擎未加载' }));
      return;
    }
    
    // 从查询参数读取数据
    const a_year = parseInt(parsed.query.a_year);
    const a_month = parseInt(parsed.query.a_month);
    const a_day = parseInt(parsed.query.a_day);
    const a_hour = parseInt(parsed.query.a_hour);
    const a_gender = parsed.query.a_gender || 'male';
    
    const b_year = parseInt(parsed.query.b_year);
    const b_month = parseInt(parsed.query.b_month);
    const b_day = parseInt(parsed.query.b_day);
    const b_hour = parseInt(parsed.query.b_hour);
    const b_gender = parsed.query.b_gender || 'female';
    
    // 参数验证
    if (isNaN(a_year) || isNaN(a_month) || isNaN(a_day) || isNaN(a_hour)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '第一人出生信息不完整或无效' }));
      return;
    }
    
    if (isNaN(b_year) || isNaN(b_month) || isNaN(b_day) || isNaN(b_hour)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '第二人出生信息不完整或无效' }));
      return;
    }
    
    try {
      const a_hourIndex = hourToBranch(a_hour);
      const a_solarDate = `${a_year}-${a_month.toString().padStart(2,'0')}-${a_day.toString().padStart(2,'0')}`;
      const a_gender_cn = a_gender === 'male' ? '男' : '女';
      const a_astrolabe = astro.bySolar(a_solarDate, a_hourIndex, a_gender_cn, true, 'zh-CN');
      
      const b_hourIndex = hourToBranch(b_hour);
      const b_solarDate = `${b_year}-${b_month.toString().padStart(2,'0')}-${b_day.toString().padStart(2,'0')}`;
      const b_gender_cn = b_gender === 'male' ? '男' : '女';
      const b_astrolabe = astro.bySolar(b_solarDate, b_hourIndex, b_gender_cn, true, 'zh-CN');
      
      const chart_a = convertToHepanFormat(a_astrolabe, a_year, a_month, a_day, a_hour, a_gender);
      const chart_b = convertToHepanFormat(b_astrolabe, b_year, b_month, b_day, b_hour, b_gender);
      
      const result = computeCompat(chart_a, chart_b, {
        rule_version: 'compat/v1',
        reference_year: 2026
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message, stack: e.stack }));
    }
    return;
  }
  
  // 静态文件服务
  let filePath = parsed.pathname === '/' ? '/ziwei-app.html' : parsed.pathname;
  let fullPath = path.join(__dirname, filePath);
  
  const ext = path.extname(fullPath);
  const mime = {
    '.html': 'text/html;charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json'
  }[ext] || 'text/plain';
  
  try {
    const content = fs.readFileSync(fullPath);
    res.writeHead(200, {'Content-Type': mime});
    res.end(content);
    return;
  } catch(e) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not found: ' + filePath);
  }
});

const PORT = 3211;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`服务器启动: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`合盘测试: http://localhost:${PORT}/hepan`);
});

server.on('error', (e) => {
  console.error('服务器错误:', e.message);
});
