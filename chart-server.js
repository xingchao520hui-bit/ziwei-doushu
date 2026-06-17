/**
 * 紫微斗数排盘 HTTP 服务器
 * 接收出生参数，返回 JSON 格式命盘数据 + 静态文件
 * 
 * 启动: node chart-server.js
 * 端口: 3211
 * 前端: http://localhost:3211/ziwei-app.html
 */
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { astro } = require('iztro');
const { Solar } = require('lunar-javascript');

// ========== 会话 & 计费系统 ==========
const sessions = new Map(); // sessionId -> { credits, freeUsed, createdAt, lastMsg }
const ADMIN_KEY = 'ziwei2026'; // 管理员密钥

function getSession(sid) {
  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomUUID();
    sessions.set(sid, { credits: 0, freeMsgs: 3, createdAt: Date.now(), history: [] });
  }
  return { id: sid, data: sessions.get(sid) };
}

function countSentences(text) {
  // 按中英文句号、感叹号、问号、换行切分，过滤空
  const raw = text.split(/[。！？!?\n]+/).filter(s => s.trim().length > 0);
  // 合并过短的碎片（逗号分隔的从句不算独立句）
  const merged = [];
  let buf = '';
  for (const s of raw) {
    buf += (buf ? '' : '') + s;
    if (buf.length >= 8) { merged.push(buf.trim()); buf = ''; }
  }
  if (buf.trim()) merged.push(buf.trim());
  return merged.length || 1;
}

const MIME = {
  '.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript',
  '.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.svg':'image/svg+xml'
};

function hourToBranch(h) {
  if (h === 23 || h === 0) return 0;  // 子时
  return Math.ceil(h / 2);
}

function mapBrightness(b) {
  if (!b) return '平';
  if (b === '庙' || b === '旺') return '旺';
  if (b === '得' || b === '利') return '利';
  if (b === '陷' || b === '不') return '陷';
  return '平';
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
        
        // 主星
        (p.majorStars || []).forEach(s => {
          stars.push({
            name: s.name,
            type: 'major',
            brightness: mapBrightness(s.brightness),
            siHua: s.mutagen || null
          });
        });
        
        // 辅星（吉星+煞星）
        (p.minorStars || []).forEach(s => {
          stars.push({
            name: s.name,
            type: 'minor',
            brightness: mapBrightness(s.light),
            siHua: null
          });
        });
        
        // 小星/杂耀
        (p.adjectiveStars || []).forEach(s => {
          stars.push({
            name: s.name,
            type: 'minor',
            brightness: '平',
            siHua: null
          });
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
      
      // 大限
      const daXians = palaces
        .filter(p => p.daXianAge)
        .sort((a, b) => a.daXianAge[0] - b.daXianAge[0])
        .map(p => ({
          startAge: p.daXianAge[0],
          endAge: p.daXianAge[1],
          palaceName: p.name,
          palaceBranch: p.branch
        }));
      
      const dizhiNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
      const currentYear = new Date().getFullYear();
      const currentAge = currentYear - year;
      
      const result = {
        birth: { year, month, day, hour, gender: q.gender },
        lunar: {
          yearName: lunar.getYearInGanZhi(),
          monthName: lunar.getMonthInChinese(),
          dayName: lunar.getDayInChinese()
        },
        info: {
          wuxingJu: astrolabe.fiveElementsClass,
          mingZhu: astrolabe.soul,
          shenZhu: astrolabe.body,
          hourBranch: dizhiNames[hourIndex]
        },
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
  
  // 逐年回溯 API（返回从出生到现在的每年流年数据）
  if (parsed.pathname === '/past-years') {
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
      const solarDate = `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
      const astrolabe = astro.bySolar(solarDate, hourIndex, gender, true, 'zh-CN');
      const currentYear = new Date().getFullYear();
      
      // 大限数据：与/chart端点一致，从palace.decadal.range直接取
      const dizhiNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      const daXians = [];
      for (let i = 0; i < astrolabe.palaces.length; i++) {
        const p = astrolabe.palaces[i];
        if (p.decadal && p.decadal.range) {
          daXians.push({ palaceName: p.name, startAge: p.decadal.range[0], endAge: p.decadal.range[1], index: i });
        }
      }
      daXians.sort((a, b) => a.startAge - b.startAge);
      
      const yearlyData = [];
      for (let y = year; y <= currentYear; y++) {
        const targetDate = `${y}-7-1`;
        const h = astrolabe.horoscope(targetDate, hourIndex);
        const nominalAge = y - year + 1;
        
        // 流年宫位
        const yPal = astrolabe.palaces[h.yearly.index];
        const yPalName = h.yearly.palaceNames[0];
        const yPalStars = yPal ? {
          major: (yPal.majorStars || []).map(s => s.name + (s.mutagen ? '(化'+s.mutagen+')' : '')),
          minor: (yPal.minorStars || []).map(s => s.name),
          adjective: (yPal.adjectiveStars || []).map(s => s.name)
        } : { major: [], minor: [], adjective: [] };
        
        // 流年四化
        
        // 大限所在宫位：用原局大限表查找nominalAge落在哪个区间（与/chart一致）
        const currentDaXian = daXians.find(dx => nominalAge >= dx.startAge && nominalAge <= dx.endAge);
        const dPalName = currentDaXian ? currentDaXian.palaceName : '';
        const dMutagen = h.decadal ? (h.decadal.mutagen || {}) : {};
        const isFirstYear = currentDaXian ? (nominalAge === currentDaXian.startAge) : false;
        const isLastYear = currentDaXian ? (nominalAge === currentDaXian.endAge) : false;
        
        // 流年四化：严格按年干查四化表（4颗星全取），在原局命盘中定位星曜所在宫位
        const yearStemIndex = ((y - 4) % 10 + 10) % 10;
        // 四化规则表：年干 -> {星名: 四化类型}
        const mutagenRules = {
          0: {破军:'化禄',武曲:'化权',廉贞:'化科',紫微:'化忌'}, // 甲
          1: {紫微:'化禄',天机:'化权',文昌:'化科',太阳:'化忌'}, // 乙
          2: {天同:'化禄',巨门:'化权',天梁:'化科',廉贞:'化忌'}, // 丙
          3: {太阴:'化禄',贪狼:'化权',天同:'化科',巨门:'化忌'}, // 丁
          4: {贪狼:'化禄',太阴:'化权',天机:'化科',天同:'化忌'}, // 戊
          5: {武曲:'化禄',贪狼:'化权',太阴:'化科',天机:'化忌'}, // 己
          6: {天梁:'化禄',紫微:'化权',武曲:'化科',廉贞:'化忌'}, // 庚
          7: {巨门:'化禄',天机:'化权',天梁:'化科',太阳:'化忌'}, // 辛
          8: {天同:'化禄',贪狼:'化权',天机:'化科',武曲:'化忌'}, // 壬
          9: {天机:'化禄',巨门:'化权',紫微:'化科',天梁:'化忌'}, // 癸
        };
        const yearMutagenMap = mutagenRules[yearStemIndex] || {};
        const sihuaDetails = [];
        // 流年四化严格按年干取4颗星（不依赖iztro的mutagen，它有遗漏）
        for (const [starName, type] of Object.entries(yearMutagenMap)) {
          let foundPalace = null;
          let foundPalaceIndex = -1;
          for (let pi = 0; pi < astrolabe.palaces.length; pi++) {
            const p = astrolabe.palaces[pi];
            const found = (p.majorStars || []).find(function(s) { return s.name === starName; }) || (p.minorStars || []).find(function(s) { return s.name === starName; });
            if (found) { foundPalace = p.name; foundPalaceIndex = pi; break; }
          }
          if (foundPalace) {
            sihuaDetails.push({ star: starName, type: type, palace: foundPalace, palaceIndex: foundPalaceIndex });
          }
        }
        
        // 小限所在宫位
        const aPal = astrolabe.palaces[h.age.index];
        const aPalName = h.age.palaceNames[0];
        const aPalStars = aPal ? {
          major: (aPal.majorStars || []).map(s => s.name + (s.mutagen ? '(化'+s.mutagen+')' : '')),
          minor: (aPal.minorStars || []).map(s => s.name)
        } : { major: [], minor: [] };
        
        yearlyData.push({
          year: y,
          age: nominalAge,
          decadalPalace: dPalName,
          decadalMutagen: dMutagen,
          isFirstYear: isFirstYear,
          isLastYear: isLastYear,
          yearlyPalace: yPalName,
          yearlyPalaceBranch: h.yearly.earthlyBranch,
          yearlyMutagen: Object.keys(yearMutagenMap),
          sihuaDetails: sihuaDetails,
          yearlyStars: { major: yPalStars.major, minor: yPalStars.minor, adjective: yPalStars.adjective },
          agePalace: aPalName,
          agePalaceBranch: h.age.earthlyBranch
        });
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ years: yearlyData }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // ── 获取/创建会话 ──
  if (parsed.pathname === '/api/session' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { sessionId } = JSON.parse(body || '{}');
      const s = getSession(sessionId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ sessionId: s.id, credits: s.data.credits, freeMsgs: s.data.freeMsgs }));
    });
    return;
  }
  
  // ── 管理员充值 ──
  if (parsed.pathname === '/api/recharge' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { adminKey, sessionId, amount, note } = JSON.parse(body || '{}');
        if (adminKey !== ADMIN_KEY) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '密钥错误' }));
          return;
        }
        if (!sessions.has(sessionId)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '会话不存在' }));
          return;
        }
        const s = sessions.get(sessionId);
        s.credits += (amount || 1);
        s.rechargeNote = note || '';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sessionId, credits: s.credits }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  // ── 云上传（命盘→小程序）──
  if (parsed.pathname === '/api/cloud-upload' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { chartData } = JSON.parse(body || '{}');
        if (!chartData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '无命盘数据' }));
          return;
        }
        // 生成命盘摘要 MD
        const name = chartData.name || '未知';
        const gender = chartData.gender || '未知';
        const birth = chartData.birth || '未知';
        const md = '# ' + name + ' 紫微斗数命盘\n\n- 性别：' + gender + '\n- 生辰：' + birth + '\n- 命宫主星：' + (chartData.mingGong || '') + '\n- 身宫：' + (chartData.shenGong || '') + '\n- 五行局：' + (chartData.wuXingJu || '') + '\n\n> 上传自紫微斗数小程序\n';
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const tmpFile = path.join(os.tmpdir(), 'zw_' + Date.now() + '.md');
        fs.writeFileSync(tmpFile, md, 'utf8');
        // 调用云上传脚本
        const { execSync } = require('child_process');
        const home = os.homedir();
        const script = path.join(home, '.qclaw', 'skills', 'cloud-upload-backup', 'scripts', 'windows', 'cloud_backup.cmd');
        let result;
        try {
          result = execSync('cmd /c "' + script + '" upload --local-path "' + tmpFile + '"', { encoding: 'utf8', timeout: 30000 });
          console.log('[CLOUD] upload result:', result);
          // 清理临时文件
          try { fs.unlinkSync(tmpFile); } catch (_) {}
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: result.trim() || '上传完成，请在小程序中查看' }));
        } catch (e) {
          try { fs.unlinkSync(tmpFile); } catch (_) {}
          console.error('[CLOUD] upload error:', e.message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: '命盘已保存，请稍后在小程序中查看。或截图当前页面发送给客服。' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '请求格式错误' }));
      }
    });
    return;
  }
  
  // ── 管理员页面 ──
  if (parsed.pathname === '/admin') {
    const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>充值管理</title>
<style>body{font-family:sans-serif;max-width:520px;margin:40px auto;padding:20px;background:#1a1a2e;color:#e0e0e0;border-radius:12px}
h2{color:#f0c040}input,button{width:100%;padding:10px;margin:6px 0;border-radius:6px;border:none;font-size:15px}
button{background:#f0c040;color:#1a1a2e;font-weight:bold;cursor:pointer}.ok{color:#4ecdc4}.err{color:#ff6b6b}
#list{margin-top:16px;font-size:13px;line-height:1.8}</style></head><body>
<h2>🔮 命理对话 · 充值管理</h2>
<p>密钥: <input id="key" type="password" value="${ADMIN_KEY}" /></p>
<p>会话ID: <input id="sid" placeholder="粘贴用户发来的会话ID" /></p>
<p>充值句数: <input id="amt" type="number" value="10" min="1" /></p>
<p>备注: <input id="note" placeholder="可选" /></p>
<button onclick="recharge()">💰 确认充值</button>
<button onclick="refresh()" style="background:#555;color:#fff;margin-top:4px">🔄 刷新会话列表</button>
<div id="msg"></div><div id="list"></div>
<script>
async function recharge(){
  const r=await fetch('/api/recharge',{method:'POST',body:JSON.stringify({
    adminKey:document.getElementById('key').value,
    sessionId:document.getElementById('sid').value.trim(),
    amount:parseInt(document.getElementById('amt').value)||1,
    note:document.getElementById('note').value
  })});
  const d=await r.json();
  document.getElementById('msg').innerHTML=r.ok
    ?\`<span class="ok">✅ 充值成功！当前余额: \${d.credits}句</span>\`
    :\`<span class="err">❌ \${d.error}</span>\`;
  refresh();
}
async function refresh(){
  const r=await fetch('/api/sessions?key='+document.getElementById('key').value);
  const d=await r.json();
  if(d.error){document.getElementById('list').innerHTML='<span class="err">'+d.error+'</span>';return}
  document.getElementById('list').innerHTML='<h4>活跃会话 ('+d.count+')</h4>'+d.sessions.map(s=>\`<div>🆔 \${s.id.slice(0,8)}... │ 💰 \${s.credits}句 │ 🆓 剩\${s.freeMsgs}次 │ ⏰ \${new Date(s.createdAt).toLocaleTimeString()}</div>\`).join('');
}
refresh();
</script></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    res.end(html);
    return;
  }
  
  // ── 会话列表（管理员）──
  if (parsed.pathname === '/api/sessions') {
    const q = url.parse(req.url, true).query;
    if (q.key !== ADMIN_KEY) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '密钥错误' }));
      return;
    }
    const list = [];
    sessions.forEach((v, k) => list.push({ id: k, credits: v.credits, freeMsgs: v.freeMsgs, createdAt: v.createdAt }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: list.length, sessions: list.sort((a,b) => b.createdAt - a.createdAt) }));
    return;
  }
  
  // ── AI 对话代理（转发到 DeepSeek）──
  if (parsed.pathname === '/api/ai-chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { chartData, messages, sessionId } = JSON.parse(body);
        const s = getSession(sessionId);
        
        // 余额预检：免费次数用完且余额为0则直接拒绝
        if (s.data.freeMsgs <= 0 && s.data.credits <= 0) {
          res.writeHead(402, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: '余额不足',
            sessionId: s.id.substring(0, 8),
            credits: 0,
            needRecharge: true,
            message: '💎 3次免费额度已用完，请充值（¥1/句）。充值后告知管理员以下会话ID：' + s.id.substring(0, 8)
          }));
          return;
        }
        
        // 精简命盘数据（只保留AI分析需要的核心信息）
        // 地支顺序表：用于算对宫和三方四正
        const DIZHI_ORDER = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
        
        const slim = {
          出生: chartData.birth || chartData.info,
          命宫: null, 身宮: null, 五行局: chartData.info?.element,
          四化: chartData.info?.sihua || [],
          十二宫: []
        };
        
        if (chartData.palaces) {
          // 先建地支→宫位条目的映射
          const branchMap = {};
          const palaceEntries = [];
          
          chartData.palaces.forEach(p => {
            const entry = {
              宮位: p.name, 地支: p.branch, 天干: p.stem || '',
              主星: [], 辅星: [], 杂曜: [], 亮度: {}
            };
            if (p.isBodyPalace) slim.身宮 = p.name;
            (p.stars || []).forEach(s => {
              if (s.type === 'major') {
                const starName = s.siHua ? `${s.name}(化${s.siHua})` : s.name;
                entry.主星.push(starName);
                entry.亮度[s.name] = s.brightness || '平';
                if (!slim.命宮 && p.name.includes('命')) slim.命宮 = entry;
              } else if (s.type === 'minor') {
                entry.辅星.push(s.name);
              } else {
                entry.杂曜.push(s.name);
              }
            });
            palaceEntries.push(entry);
            if (p.branch) branchMap[p.branch] = entry;
          });
          
          // 为每个宫位算出对宫和三方四正
          palaceEntries.forEach(entry => {
            const idx = DIZHI_ORDER.indexOf(entry.地支);
            if (idx === -1) return;
            
            // 对宫 = 地支差6位
            const oppBranch = DIZHI_ORDER[(idx + 6) % 12];
            const oppPalace = branchMap[oppBranch];
            entry.对宫 = oppPalace ? `${oppPalace.宮位}(${oppBranch}) [主星:${(oppPalace.主星||[]).join(',')||'无'}]` : '?';
            
            // 三方 = 本宫 + 地支差4位 + 地支差8位（三合局）
            const tri1 = DIZHI_ORDER[(idx + 4) % 12];
            const tri2 = DIZHI_ORDER[(idx + 8) % 12];
            const triPalace1 = branchMap[tri1];
            const triPalace2 = branchMap[tri2];
            entry.三方 = [
              entry.宮位,
              triPalace1 ? `${triPalace1.宮位}(${tri1})` : '?',
              triPalace2 ? `${triPalace2.宮位}(${tri2})` : '?'
            ];
            
            // 三方四正 = 三方 + 对宫
            entry.三方四正 = [
              { 宫: entry.宮位, 支: entry.地支, 星: entry.主星.join(',') || '无' },
              triPalace1 ? { 宫: triPalace1.宮位, 支: tri1, 星: triPalace1.主星.join(',') || '无' } : null,
              triPalace2 ? { 宫: triPalace2.宮位, 支: tri2, 星: triPalace2.主星.join(',') || '无' } : null,
              oppPalace ? { 宫: oppPalace.宮位, 支: oppBranch, 星: oppPalace.主星.join(',') || '无' } : null
            ].filter(Boolean);
          });
          
          slim.十二宫 = palaceEntries;
        }
        
        // 大限信息（只取当前大限）
        const now = new Date();
        const currentYear = now.getFullYear();
        const birthYear = parseInt(chartData.birth?.year || chartData.birth);
        const currentAge = currentYear - birthYear;
        
        let daXianInfo = '';
        if (chartData.palaces && chartData.palaces[0]?.daXian !== undefined) {
          // 大限数据在palace中
          const bodyIdx = chartData.palaces.findIndex(p => p.isBodyPalace) || 0;
          for (let i = 0; i < 10; i++) {
            const ds = (bodyIdx + i) * 10 + 1;
            const de = (bodyIdx + i + 1) * 10;
            if (currentAge >= ds && currentAge <= de) {
              daXianInfo = `${chartData.palaces[(bodyIdx + i) % 12].name}宫大限(${ds}-${de}岁)`;
            }
          }
        }
        
        // 流年数据：只取最近5年
        let recentYears = [];
        if (chartData.pastYears && Array.isArray(chartData.pastYears)) {
          recentYears = chartData.pastYears
            .filter(y => y.year >= currentYear - 4 && y.year <= currentYear)
            .map(y => ({
              年份: y.year, 虚岁: y.age,
              大限宫: y.decadalPalace, 流年宫: y.yearlyPalace,
              流年四化: (y.sihuaDetails || []).map(s => `${s.star}${s.type}在${s.palace}`)
            }));
        }
        
        // 当前年份信息（解决DeepSeek不知道现在是2026的问题）
        const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
        const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
        const curStemIdx = (currentYear - 4) % 10;
        const curBranchIdx = (currentYear - 4) % 12;
        const curYearGZ = TIAN_GAN[curStemIdx] + DI_ZHI[curBranchIdx];
        
        // 当前流年详情（干支法：流年命宫 = 该年地支所在原局宫位）
        let curYearFlow = '';
        if (chartData.palaces && recentYears.length > 0) {
          const branchName = {};
          chartData.palaces.forEach(p => { if (p.branch) branchName[p.branch] = p.name; });
          const curBranch = DI_ZHI[curBranchIdx];
          const classicalYearly = branchName[curBranch] || '?';
          const cy = recentYears.find(y => y.年份 === currentYear);
          if (cy) curYearFlow = `今年流年命宫落在原局${classicalYearly}（大限${cy.大限宫}），流年四化：${cy.流年四化.join('、')}`;
        }
        
        // 流年十二宫对照表（让AI学会定位流年宫位和对宫）
        let curYearTransit = '';
        if (chartData.palaces) {
          const DIZHI_ORDER = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
          const YR_PALACE_NAMES = ['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫'];
          // 地支→原局宫位名
          const branchName = {};
          chartData.palaces.forEach(p => { if (p.branch) branchName[p.branch] = p.name; });
          const curBranch = DI_ZHI[curBranchIdx];
          const baseIdx = DIZHI_ORDER.indexOf(curBranch);
          if (baseIdx !== -1) {
            const lines = [];
            for (let i = 0; i < 12; i++) {
              const natalBranch = DIZHI_ORDER[(baseIdx + i) % 12];
              const natalPalace = branchName[natalBranch] || '?';
              // 对宫 = 相隔6位
              const oppBranch = DIZHI_ORDER[(baseIdx + i + 6) % 12];
              const oppPalace = branchName[oppBranch] || '?';
              const key = [0,2,4,5,6,8].includes(i) ? ' ★' : ''; // 命/夫/财/疾/迁/官
              lines.push(`流年${YR_PALACE_NAMES[i]}=原局${natalPalace}(${natalBranch}), 对宫=原局${oppPalace}(${oppBranch})${key}`);
            }
            curYearTransit = '今年流年十二宫对照表：\n' + lines.join('\n');
          }
        }
        
        // 构建系统提示 - 温柔大哥哥风格
        const systemPrompt = `今天是${currentYear}年（农历${curYearGZ}年）。${curYearFlow ? '\n' + curYearFlow : ''}
${curYearTransit ? '\n' + curYearTransit + '\n' : ''}
你是一位年轻温柔的命理师，像知心大哥哥。你来帮人看盘不是炫技，是真心想帮对方。

## 你的风格
- 自然聊天口气，不要"批曰"、不要写诗、不要书面语
- 温柔，照顾对方的情绪，能感受到对方问话背后的担忧和期待
- 每个回答都要**引用命盘里具体的星曜和宫位**来佐证，不要说空话
- 如果对方问得笼统(比如"我感情怎么样")，先点出命盘里感情相关的关键星曜配置，再给出具体判断
- 给对方力量感——即便格局有挑战，也告诉他怎么化解、优势在哪

## 流年宫位定位规则（严格遵守）
1. 流年命宫 = 该年地支所在的原局宫位。例：2026丙午年地支午，流年命宫就在原局午宫。
2. 十二宫固定顺序（逆时针）：命宫→兄弟→夫妻→子女→财帛→疾厄→迁移→交友→官禄→田宅→福德→父母
3. 以流年命宫为起点，按上述顺序依次排流年十二宫
4. 对宫 = 本宫往后数第6个位置（命↔迁、兄↔交、夫↔官、子↔田、财↔福、疾↔父）
5. 流年重点宫位：流年命宫、流年夫妻宫、流年官禄宫、流年财帛宫、流年疾厄宫、流年迁移宫
6. 流年分析时，必看该流年宫位的原局星曜+原局三方四正+流年四化引动

## 必须做到
1. **三方四正必看**：分析任何宫位时，必须同时看它的三方四正（数据里已标出）。比如看事业，不光看官禄宫，还要看它的对宫（夫妻宫）和三合位（财帛宫、命宫），综合分析。
2. **对宫是镜子**：对宫是当前宫的映射和补充，比如夫妻宫对宫是官禄宫（事业影响感情）、命宫对宫是迁移宫（外人眼里的你）。回答时必须提到相关对宫。
3. 流年和大限必须结合命盘说，别孤立讲。流年要看流年宫位+该宫的三方四正。
4. 回答时引用2-3个具体的星曜/宫位/四化，比如"你夫妻宫坐天同太阴，但对面官禄宫七杀冲照，感情容易因事业压力被挤到一边"
5. 结尾留一句温暖的话，让人觉得被理解

## 严禁
- 笼统的套话（如"命格不凡""贵人相助"等不结合具体星曜的空话）
- **绝对禁止编造对宫、三方四正关系**——直接引用数据里的对宫/三方四正字段
- 超过8句话的长篇大论
- 吓唬对方（客观但不制造焦虑）

命盘：${JSON.stringify(slim)}
当前：${daXianInfo}
近五年流年：${JSON.stringify(recentYears)}`;
        
        console.log('[AI] system prompt size:', systemPrompt.length, 'bytes');

        const chatMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ];

        const aiResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-632abca52b624b90972df038db26ade9'
          },
          body: JSON.stringify({
            model: 'deepseek-v4-pro',
            messages: chatMessages,
            thinking: { type: 'enabled' },
            reasoning_effort: 'medium',
            max_tokens: 800
          })
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          throw new Error('DeepSeek API error: ' + aiResp.status + ' ' + errText);
        }

        const aiData = await aiResp.json();
        const reply = aiData.choices?.[0]?.message?.content || '（系统暂无法推算，请稍后再试）';
        
        // 计费：前3次提问免费（每次1句计），之后¥1/句
        const totalSentences = countSentences(reply);
        let freeSentences = 0;
        let chargedSentences = 0;
        
        console.log('[BILL] freeMsgs:', s.data.freeMsgs, 'credits:', s.data.credits, 'totalSentences:', totalSentences);
        
        if (s.data.freeMsgs > 0) {
          // 还有免费次数：本次1句免费
          freeSentences = 1;
          s.data.freeMsgs -= 1;
          // 超出的句数扣费
          if (totalSentences > 1) {
            chargedSentences = totalSentences - 1;
            const deduct = Math.min(chargedSentences, s.data.credits);
            s.data.credits -= deduct;
            chargedSentences = deduct;
          }
          console.log('[BILL] FREE MSG used, remaining freeMsgs:', s.data.freeMsgs, 'charged:', chargedSentences);
        } else {
          // 无免费次数：全部按句收费
          chargedSentences = totalSentences;
          const deduct = Math.min(chargedSentences, s.data.credits);
          s.data.credits -= deduct;
          chargedSentences = deduct;
          console.log('[BILL] ALL CHARGED:', chargedSentences);
        }
        
        s.data.history.push({ time: Date.now(), lastMsg: messages[messages.length-1]?.content?.substring(0, 30), sentences: totalSentences, charged: chargedSentences });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          reply: reply,
          billing: { sentences: totalSentences, free: freeSentences, charged: chargedSentences, remaining: s.data.credits, freeMsgsRemaining: s.data.freeMsgs, sessionId: s.id }
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  // 静态文件服务

  let filePath = parsed.pathname === '/' ? '/ziwei-app.html' : parsed.pathname;
  let fullPath = path.join(__dirname, filePath);
  
  const ext = path.extname(fullPath);
  const mime = MIME[ext] || 'text/plain';
  
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
  console.log(`紫微斗数排盘服务已启动: http://localhost:${PORT}`);
  console.log(`测试: http://localhost:${PORT}/chart?year=1999&month=2&day=17&hour=22&gender=male`);
});
