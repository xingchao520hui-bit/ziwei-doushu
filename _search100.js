// 定向搜索：找 B 夫妻宫主星=机月同梁组，最大化总分
// 固定 A: 1999-02-17 男 亥时

const http = require('http');

const HOURS = [0,2,4,6,8,10,12,14,16,18,20,22];
const YEARS = Array.from({length: 21}, (_,i) => 1985+i);

function api(params) {
  const qs = Object.entries(params).map(([k,v]) => k+'='+v).join('&');
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3211/hepan?' + qs, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('t/o')); });
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function search() {
  // 先全量扫描每日（1985-2005，每天，每性别，每时辰）
  // 但太多了(21×365×12×2=183960)，只做定向
  // 改为：2000条定向扫描
  
  const top = [];
  let done = 0;
  
  // Phase 1: 密集扫 1990-1999 年，全12个月，选多一些日
  const denseSamples = [];
  for (const year of [1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000]) {
    for (const month of [1,2,3,4,5,6,7,8,9,10,11,12]) {
      for (const day of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28]) {
        for (const hour of HOURS) {
          for (const gender of ['male', 'female']) {
            denseSamples.push({ year, month, day, hour, gender });
          }
        }
      }
    }
  }
  
  console.log(`定向搜索: ${denseSamples.length} 组合 (11年×12月×28日×12时×2性)`);
  let total = denseSamples.length;
  
  const BATCH = 10;
  for (let i = 0; i < denseSamples.length; i += BATCH) {
    const batch = denseSamples.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(b => api({
      a_year:1999, a_month:2, a_day:17, a_hour:22, a_gender:'male',
      b_year:b.year, b_month:b.month, b_day:b.day, b_hour:b.hour, b_gender:b.gender,
    })));
    
    for (let j = 0; j < results.length; j++) {
      done++;
      const r = results[j];
      if (r.status !== 'fulfilled' || !r.value?.data) continue;
      
      const d = r.value.data;
      const score = d.score;
      const b = batch[j];
      
      // Check star group
      const starDim = d.dimensions.find(d => d.id === 'star_harmony');
      const starHits = d.hits.filter(h => h.dimension === 'star_harmony');
      const starEvidence = starHits[0]?.evidence;
      
      if (score >= 75) {
        top.push({
          score, b, star: starDim?.score?.toFixed(1),
          groups: starEvidence?.groups || [],
          dims: d.dimensions.map(d => `${d.id}=${d.score.toFixed(1)}`),
        });
        top.sort((a,b) => b.score - a.score);
        if (top.length > 20) top.length = 20;
      }
    }
    
    if (done % 1000 === 0) {
      console.log(`进度: ${done}/${total} | 当前最高: ${top[0]?.score || '-'}`);
      if (top.length > 0) console.log('  TOP3:', top.slice(0,3).map(t => `${t.score}分 ${t.b.year}/${t.b.month}/${t.b.day} ${t.b.hour}h ${t.b.gender}`).join(' | '));
    }
    
    if (i + BATCH < denseSamples.length) await delay(10);
  }
  
  console.log('\n========== TOP 20 (>=75分) ==========');
  top.forEach((t, i) => {
    console.log(`#${i+1} ${t.score}分 | B: ${t.b.year}/${t.b.month}/${t.b.day} ${t.b.hour}h ${t.b.gender}`);
    console.log(`  星组: ${t.groups.join(' vs ')} | 维度: ${t.dims.join(', ')}`);
  });
}

search().catch(console.error);
