const h = require('fs').readFileSync('ziwei-metis-unified.html', 'utf8');
const m = h.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
const s3 = m[3].replace(/<\/?script[^>]*>/g, '');

try {
  new Function(s3);
} catch (e) {
  console.log('错误信息:', e.message);
  // 显示脚本内容的前2000字符
  console.log('\n--- Script #3 内容 (前2000字) ---');
  console.log(s3.substring(0, 2000));
  console.log('\n--- Script #3 内容 (后1000字) ---');
  console.log(s3.substring(s3.length - 1000));
}
