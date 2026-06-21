const fs = require('fs');
const html = fs.readFileSync('ziwei-metis-unified.html', 'utf8');

// 找第二个 getChart 的完整内容
const gc1 = html.indexOf('function getChart(){');
const gc2 = html.indexOf('function getChart(){', gc1 + 1);
const gcEnd = html.indexOf('\nfunction showError(', gc2);
const gcBody = html.substring(gc2, gcEnd);
console.log('=== 页面级 getChart 完整内容 ===');
console.log(gcBody);
