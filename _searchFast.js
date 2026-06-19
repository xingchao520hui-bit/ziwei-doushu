const { astro } = require('iztro');
const { computeCompat } = require('C:/Users/LENOVO/Desktop/项目/紫薇skills/合盘/hepan-cli/src/engine/computeCompat');
const fs = require('fs');

function hourToBranch(h) { return (h === 23 || h === 0) ? 0 : Math.ceil(h / 2); }
function makeChart(year, month, day, hour, gender) {
  const dateStr = `${year}-${month}-${day}`;
  const a = astro.bySolar(dateStr, hourToBranch(hour), gender === 'male' ? 0 : 1, true, 'zh-CN');
  return {
    birth_info: { solar_date: dateStr },
    palace_mapping: { soul: 0, parents: 1, mind: 2, property: 3, career: 4, friends: 5, health: 6, children: 7, spouse: 8, siblings: 9, essence: 10, face: 11 },
    palaces: a.palaces.map(p => ({
      name: p.name, earthly_branch: p.earthlyBranch,
      major_stars: (p.majorStars || []).map(s => ({ name: s.name, type: 'major', brightness: s.brightness || '平', mutagen: s.mutagen || null })),
      minor_stars: (p.minorStars || []).map(s => ({ name: s.name, type: 'minor', brightness: s.light || '平', mutagen: null })),
      adjective_stars: (p.adjectiveStars || []).map(s => ({ name: s.name, type: 'adjective', brightness: s.light || '平', mutagen: null })),
    })),
  };
}

const chartA = makeChart(1999, 2, 17, 22, 'male');
const HOURS = [0,2,4,6,8,10,12,14,16,18,20,22];
const out = [];

function report(msg) { console.log(msg); fs.appendFileSync(__dirname + '/_search_result.txt', msg + '\n'); }

const t0 = Date.now();
let best = { score: 0 };
let done = 0;
const total = 5 * 12 * 28 * 12 * 2;

report(`搜索: 1985-1989 全日期 | ${total} 组合 | ${new Date().toISOString()}`);

for (const year of [1985, 1986, 1987, 1988, 1989]) {
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 28; day++) {
      for (const hour of HOURS) {
        for (const gender of ['male', 'female']) {
          try {
            const r = computeCompat(chartA, makeChart(year, month, day, hour, gender), { rule_version: 'compat/v1' });
            done++;
            if (r && r.score > best.score) {
              best = { score: r.score, year, month, day, hour, gender,
                dims: r.dimensions.map(d => `${d.id}=${d.score.toFixed(1)}/${d.max}`) };
              report(`🆕 ${best.score}分 | ${year}/${month}/${day} ${hour}h ${gender} | ${best.dims.join(' | ')}`);
              out.push({ ...best });
            }
          } catch(e) {}
        }
      }
    }
  }
  report(`${year} ✓ | ${(done/total*100).toFixed(1)}% | 最高: ${best.score}分`);
}

const s = ((Date.now() - t0) / 1000).toFixed(1);
report(`\n⚡ ${s}s | ${(total/s/1000).toFixed(1)}K/s | 最高: ${best.score}分`);
out.sort((a,b)=>b.score-a.score);
out.slice(0, 20).forEach((t, i) => report(`#${i+1} ${t.score}分 | ${t.year}/${t.month}/${t.day} ${t.hour}h ${t.gender} | ${t.dims.join(' | ')}`));
console.log('DONE');
