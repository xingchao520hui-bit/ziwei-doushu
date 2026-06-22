/**
 * 紫微斗数排盘 + 合盘 HTTP 服务器
 * 端口: 3211
 */
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { astro } = require('iztro');
const { Solar } = require('lunar-javascript');
const crypto = require('crypto');

// 加载合盘引擎
const { computeCompat } = require('C:/Users/LENOVO/Desktop/项目/紫薇skills/合盘/hepan-cli/src/engine/computeCompat');

const MIME = {
  '.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript',
  '.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.svg':'image/svg+xml'
};

function hourToBranch(h) {
  if (h === 23 || h === 0) return 0;
  return Math.ceil(h / 2);
}

/**
 * 将 iztro 命盘转换为合盘引擎需要的格式
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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsed = url.parse(req.url, true);
  
  // 健康检查
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // 地理编码 - 地名→经纬度（Nominatim免费API）
  if (parsed.pathname === '/geocode') {
    const q = parsed.query.q || '';
    if (!q) { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'缺少地名'})); return; }
    const https = require('https');
    const qs = encodeURIComponent(q);
    https.get({
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?q=${qs}&format=json&limit=3&accept-language=zh`,
      headers: { 'User-Agent': 'ZiweiDoushuChart/1.0' }
    }, geoRes => {
      let data = '';
      geoRes.on('data', c => data += c);
      geoRes.on('end', () => {
        res.writeHead(200, {'Content-Type':'application/json'});
        try {
          const results = JSON.parse(data);
          if (results.length === 0) {
            res.end(JSON.stringify({error:'未找到该地点，请换个关键词或手动输入经度'}));
          } else {
            res.end(JSON.stringify(results.slice(0,3).map(r => ({
              name: r.display_name,
              lon: parseFloat(r.lon),
              lat: parseFloat(r.lat),
              type: r.type
            }))));
          }
        } catch(e) {
          res.end(JSON.stringify({error:'查询失败，请手动输入经度'}));
        }
      });
    }).on('error', () => {
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error:'网络不通，请手动输入经度'}));
    });
    return;
  }
  
  // 排盘 API
  if (parsed.pathname === '/chart') {
    const q = parsed.query;
    const year = parseInt(q.year);
    const month = parseInt(q.month);
    const day = parseInt(q.day);
    const hour = parseInt(q.hour);
    const gender = q.gender === 'male' ? '男' : '女';
    
    if (!year || !month || !day || hour === undefined) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '缺少参数' }));
      return;
    }
    
    try {
      const hourIndex = hourToBranch(hour);
      const solarDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const astrolabe = astro.bySolar(solarDate, hourIndex, gender, true, 'zh-CN');
      
      const solar = Solar.fromYmd(year, month, day);
      const lunar = solar.getLunar();
      
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
      
      const daXians = palaces.filter(p => p.daXianAge).sort((a,b) => a.daXianAge[0]-b.daXianAge[0]).map(p => ({
        startAge: p.daXianAge[0], endAge: p.daXianAge[1], palaceName: p.name, palaceBranch: p.branch
      }));
      
      const dizhiNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      const currentYear = new Date().getFullYear();
      const currentAge = currentYear - year;
      
      const result = {
        birth: { year, month, day, hour, gender: q.gender },
        lunar: { yearName: lunar.getYearInGanZhi(), monthName: lunar.getMonthInChinese(), dayName: lunar.getDayInChinese() },
        info: { wuxingJu: astrolabe.fiveElementsClass, mingZhu: astrolabe.soul, shenZhu: astrolabe.body, hourBranch: dizhiNames[hourIndex] },
        palaces: palaces,
        daXians: daXians,
        currentAge: currentAge
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // 合盘 API
  if (parsed.pathname === '/hepan') {
    const q = parsed.query;
    
    // 解析两个人参数: a_year,a_month,a_day,a_hour,a_gender + b_...
    const a_year = parseInt(q.a_year);
    const a_month = parseInt(q.a_month);
    const a_day = parseInt(q.a_day);
    const a_hour = parseInt(q.a_hour);
    const a_gender = q.a_gender === 'male' ? '男' : '女';
    
    const b_year = parseInt(q.b_year);
    const b_month = parseInt(q.b_month);
    const b_day = parseInt(q.b_day);
    const b_hour = parseInt(q.b_hour);
    const b_gender = q.b_gender === 'male' ? '男' : '女';
    
    if (!a_year || !b_year) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '缺少参数，需要 a_year,a_month,a_day,a_hour,a_gender 和 b_...' }));
      return;
    }
    
    try {
      // 生成A的命盘
      const a_hourIndex = hourToBranch(a_hour);
      const a_solarDate = `${a_year}-${a_month.toString().padStart(2,'0')}-${a_day.toString().padStart(2,'0')}`;
      const a_astrolabe = astro.bySolar(a_solarDate, a_hourIndex, a_gender, true, 'zh-CN');
      
      // 生成B的命盘
      const b_hourIndex = hourToBranch(b_hour);
      const b_solarDate = `${b_year}-${b_month.toString().padStart(2,'0')}-${b_day.toString().padStart(2,'0')}`;
      const b_astrolabe = astro.bySolar(b_solarDate, b_hourIndex, b_gender, true, 'zh-CN');
      
      // 转换为合盘引擎格式
      const chart_a = convertToHepanFormat(a_astrolabe, a_year, a_month, a_day, a_hour, q.a_gender);
      const chart_b = convertToHepanFormat(b_astrolabe, b_year, b_month, b_day, b_hour, q.b_gender);
      
      // 计算合盘
      const result = computeCompat(chart_a, chart_b, {
        rule_version: 'compat/v1',
        reference_year: new Date().getFullYear()
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result }));
      
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, stack: err.stack }));
    }
    return;
  }
  
  
  // ===== AI对话 + 计费系统 =====
  
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
  const FREE_MESSAGES = 3;
  const CREDITS_PER_MSG = 1;
  const sessions = {};

  // ===== past-years =====
  if (parsed.pathname === '/past-years') {
    const q = parsed.query;
    const year = parseInt(q.year), month = parseInt(q.month), day = parseInt(q.day), hour = parseInt(q.hour);
    const gender = q.gender === 'male' ? '男' : '女';
    if (!year) { res.writeHead(400); res.end(JSON.stringify({error:'缺少参数'})); return; }

    try {
      const hourIndex = hourToBranch(hour);
      const solarDate = `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
      const astrolabe = astro.bySolar(solarDate, hourIndex, gender, true, 'zh-CN');

      const fiveElementsClass = astrolabe.fiveElementsClass;
      const soul = astrolabe.soul;
      const bodyStar = astrolabe.body;

      let bodyPalaceName = null;
      for (let pi = 0; pi < astrolabe.palaces.length; pi++) {
        if (astrolabe.palaces[pi].isBodyPalace) { bodyPalaceName = astrolabe.palaces[pi].name; break; }
      }

      const branchToPalace = {};
      for (let pi = 0; pi < astrolabe.palaces.length; pi++) {
        branchToPalace[astrolabe.palaces[pi].earthlyBranch] = astrolabe.palaces[pi].name;
      }

      const years = [];
      const currentYear = new Date().getFullYear();
      for (let y = year; y <= currentYear; y++) {
        const age = y - year;
        const targetDate = `${y}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
        const h = astrolabe.horoscope(targetDate, hourIndex);
        const yPal = astrolabe.palaces[h.yearly.index];
        const yearlyStars = (yPal.majorStars || []).map(s => ({ name: s.name, mutagen: s.mutagen || null }))
          .concat((yPal.minorStars || []).map(s => ({ name: s.name, mutagen: s.mutagen || null })));
        const dPal = astrolabe.palaces[h.decadal.index];
        years.push({
          year: y, age,
          yearlyPalaceBranch: yPal.earthlyBranch,
          yearlyPalaceName: yPal.name,
          yearlyStars,
          daXianPalaceName: dPal.name,
          daXianPalaceBranch: dPal.earthlyBranch
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ birth: { year, month, day, hour, gender: q.gender }, base: { fiveElementsClass, soul, bodyStar, bodyPalaceName, branchToPalace }, years }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (parsed.pathname === '/api/ai-chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const sessionId = payload.sessionId || crypto.randomUUID();
        if (!sessions[sessionId]) sessions[sessionId] = { createdAt: Date.now(), totalMessages: 0, credits: 0 };
        const sess = sessions[sessionId];

        let chargeable = 0;
        if (sess.totalMessages >= FREE_MESSAGES) chargeable = 1;
        sess.totalMessages++;

        if (chargeable > 0 && sess.credits < chargeable) {
          res.writeHead(402, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '积分不足', code: 'INSUFFICIENT_CREDITS', credits: sess.credits, required: chargeable }));
          return;
        }

        let answer = '';
        if (DEEPSEEK_API_KEY) {
          const messages = [
            { role: 'system', content: payload.systemPrompt || '你是温柔体贴的命理师。' },
            ...(payload.history || []),
            { role: 'user', content: payload.message }
          ];
          const dsResp = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
            body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 1200, temperature: 0.7 }),
            signal: AbortSignal.timeout(60000)
          });
          const dsJson = await dsResp.json();
          answer = dsJson.choices?.[0]?.message?.content || 'AI暂时无法回复，请稍后重试。';
        } else {
          answer = '未配置 DeepSeek API Key。';
        }

        if (chargeable > 0) sess.credits -= chargeable;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, reply: answer, sessionId, credits: sess.credits, freeRemaining: Math.max(0, FREE_MESSAGES - sess.totalMessages) }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (parsed.pathname === '/api/session' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { sessionId } = JSON.parse(body);
        const sess = sessions[sessionId];
        if (!sess) {
          const newId = crypto.randomUUID();
          sessions[newId] = { createdAt: Date.now(), totalMessages: 0, credits: 0 };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ sessionId: newId, credits: 0, freeRemaining: FREE_MESSAGES }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ sessionId, credits: sess.credits, totalMessages: sess.totalMessages, freeRemaining: Math.max(0, FREE_MESSAGES - sess.totalMessages) }));
        }
      } catch (err) { res.writeHead(400); res.end(JSON.stringify({ error: err.message })); }
    });
    return;
  }

  if (parsed.pathname === '/api/recharge' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { sessionId, amount } = JSON.parse(body);
        if (!sessions[sessionId]) { res.writeHead(404); res.end(JSON.stringify({error:'会话不存在'})); return; }
        sessions[sessionId].credits += (amount || 0);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ credits: sessions[sessionId].credits }));
      } catch (err) { res.writeHead(400); res.end(JSON.stringify({ error: err.message })); }
    });
    return;
  }

  if (parsed.pathname === '/admin') {
    const list = Object.entries(sessions).map(([id, s]) => '<tr><td>'+id.slice(0,8)+'</td><td>'+s.totalMessages+'</td><td>'+s.credits+'</td><td>'+new Date(s.createdAt).toLocaleString()+'</td></tr>').join('');
    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    res.end('<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>管理后台</title></head><body><h1>会话管理</h1><table border="1"><tr><th>ID</th><th>消息数</th><th>积分</th><th>创建时间</th></tr>'+list+'</table></body></html>');
    return;
  }

  if (parsed.pathname === '/api/sessions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Object.entries(sessions).map(([id, s]) => ({ id: id.slice(0,8), totalMessages: s.totalMessages, credits: s.credits }))));
    return;
  }
// 静态文件服务
  let filePath = parsed.pathname === '/' ? '/ziwei-app.html' : parsed.pathname;
  let fullPath = path.join(__dirname, filePath);
  
  const ext = path.extname(fullPath);
  const mime = MIME[ext] || 'text/plain';
  
  try {
    const content = fs.readFileSync(fullPath);
    const headers = { 'Content-Type': mime };
    if (ext === '.html' || ext === '.js' || ext === '.css') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }
    res.writeHead(200, headers);
    res.end(content);
    return;
  } catch(e) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not found: ' + filePath);
  }
});

const PORT = process.env.PORT || 3211;

// CORS 中间件
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`紫微斗数排盘+合盘服务已启动: http://0.0.0.0:${PORT}`);
  console.log(`排盘: http://localhost:${PORT}/chart?year=1999&month=2&day=17&hour=22&gender=male`);
  console.log(`合盘: http://localhost:${PORT}/hepan?a_year=1993&a_month=5&a_day=3&a_hour=12&a_gender=male&b_year=1988&b_month=6&b_day=20&b_hour=14&b_gender=female`);
});
