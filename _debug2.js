const {astro}=require('iztro');
const a=astro.bySolar("1999-2-17", 11, 0, true, 'zh-CN');
console.log('Palaces:', a.palaces?.length);
if (a.palaces) {
  const p=a.palaces[0];
  console.log('Keys:', Object.keys(p).join(', '));
  console.log('name:', p.name, '| earthlyBranch:', p.earthlyBranch);
  console.log('majorStars:', JSON.stringify(p.majorStars?.map(s=>s.name)));
  console.log('minorStars:', JSON.stringify(p.minorStars?.slice(0,3)?.map(s=>s.name)));
}
