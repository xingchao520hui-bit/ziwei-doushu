const fs = require('fs');
const h = fs.readFileSync('ziwei-metis-unified.html', 'utf8');

console.log('文件大小:', h.length, '字符', Math.round(h.length/1024), 'KB');

// 找第二个 getChart
const gc1 = h.indexOf('function getChart(){');
const gc2 = h.indexOf('function getChart(){', gc1 + 1);
const ge2 = h.indexOf('function showError(', gc2);
const gc2body = h.substring(gc2, ge2);

console.log('\n=== 第二个 getChart ===');
console.log('window.Ziwei 出现:', gc2body.includes('window.Ziwei') ? '⚠ 是' : '✓ 否');
console.log('localhost:3211 出现:', gc2body.includes('localhost:3211') ? '✓ 是' : '✗ 否');
console.log('render() 调用:', gc2body.includes('render(') ? '✓ 是' : '✗ 否');
console.log('内嵌引擎注释:', gc2body.includes('内嵌引擎') ? '⚠ 是' : '✓ 否');

// 找 render
const rp = h.indexOf('function render(');
const re = h.indexOf('function showError(', rp);
const rbody = h.substring(rp, re);
console.log('\n=== render 函数 ===');
console.log('长度:', rbody.length, '字符');
console.log('调用 renderPalaceGrid:', rbody.includes('renderPalaceGrid') ? '✓' : '✗');
console.log('调用 pn():', rbody.includes('pn(') ? '✓' : '✗');
console.log('调用 starName():', rbody.includes('starName(') ? '✓' : '✗');

// 找 pageLevelRpg
const rpgp = h.indexOf('中文地支 → 4×4 网格');
console.log('\n=== renderPalaceGrid ===');
console.log('4×4版本存在:', rpgp !== -1 ? '✓' : '✗');

// 统计
const gcCount = (h.match(/function getChart/g) || []).length;
console.log('\n=== 统计 ===');
console.log('getChart 数量:', gcCount);
console.log('function pn:', h.includes('function pn(') ? '✓' : '✗');
console.log('function render:', h.includes('function render(') ? '✓' : '✗');
console.log('function showError:', h.includes('function showError(') ? '✓' : '✗');
