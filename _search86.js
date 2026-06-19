const { astro } = require('iztro');
const { computeCompat } = require('C:/Users/LENOVO/Desktop/项目/紫薇skills/合盘/hepan-cli/src/engine/computeCompat');
const fs = require('fs');

function hourToBranch(h) { return (h === 23 || h === 0) ? 0 : Math.ceil(h / 2); }
function makeChart(year, month, day, hour, gender) {
  const a = astro.bySolar(`${year}-${month}-${day}`, hourToBranch(hour), gender === 'male' ? 0 : 1, true, 'zh-CN');
  return {
    birth_info: { solar_date: `${year}-${month}-${day}` },
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
const SEARCH_YEARS = process.argv[2] ? [parseInt(process.argv[2])] : [1986,1987,1988,1989];

let best = { score: 0 };
const tops = [];
const t0 = Date.now();

for (const year of SEARCH_YEARS) {
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 28; day++) {
      for (const hour of HOURS) {
        for (const gender of ['male', 'female']) {
          try {
            const r = computeCompat(chartA, makeChart(year, month, day, hour, gender), { rule_version: 'compat/v1' });
            if (r && r.score > best.score) {
              best = { score: r.score, year, month, day, hour, gender,
                dims: r.dimensions.map(d => `${d.id}=${d.score.toFixed(1)}/${d.max}`) };
              console.log(`🆕 ${best.score}分 | ${year}/${month}/${day} ${hour}h ${gender} | ${best.dims.join(' | ')}`);
            }
            if (r && r.score >= 75) {
              tops.push({ score: r.score, year, month, day, hour, gender,
                dims: r.dimensions.map(d => `${d.id}=${d.score.toFixed(1)}`),
              });
            }
          } catch(e) {}
        }
      }
    }
  }
  console.log(`${year} ✓ | 最高: ${best.score}分 | ${((Date.now()-t0)/1000).toFixed(0)}s`);
}

tops.sort((a,b)=>b.score-a.score);
console.log(`\n===== 最高 ${best.score}分 =====`);
tops.slice(0, 10).forEach((t, i) => console.log(`#${i+1} ${t.score}分 | ${t.year}/${t.month}/${t.day} ${t.hour}h ${t.gender} | ${t.dims.join(' | ')}`));
