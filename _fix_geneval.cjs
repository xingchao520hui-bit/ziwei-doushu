const h = require('fs').readFileSync('ziwei-metis-unified.html', 'utf8');

// 找 generateEvaluation 函数定义
const defStart = h.indexOf('function generateEvaluation');
console.log('defStart:', defStart);

// 找函数结束（括号匹配）
let depth = 0, started = false;
let defEnd = defStart;
for (let i = defStart + 28; i < h.length; i++) {
  if (h[i] === '{') { depth++; started = true; }
  else if (h[i] === '}') { depth--; }
  if (started && depth === 0) { defEnd = i + 1; break; }
}
console.log('defEnd:', defEnd, 'length:', defEnd - defStart);

// 提取函数
const funcBody = h.substring(defStart, defEnd);
console.log('\n函数前50字:', funcBody.substring(0, 50));
console.log('函数后50字:', funcBody.slice(-50));

// 找 Script #2 的 </script> 结束位置（在 Script #3 开始之前）
const script3Start = h.indexOf('<script', 1650000); // Script #3 开始位置附近
const script2End = h.lastIndexOf('</script>', script3Start);
console.log('\nScript #2 </script> 位置:', script2End);

// 方案：把 generateEvaluation 插入到 Script #2 的 </script> 之前
const newH = h.substring(0, script2End) + '\n\n' + funcBody + '\n' + h.substring(script2End);

// 验证
const s3check = newH.indexOf('function generateEvaluation');
const s3scripts = newH.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
console.log('\n新文件中 generateEvaluation 位置:', s3check);

// 检查新 Script #2 是否有语法错误
const m2 = newH.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
try {
  new Function(m2[2].replace(/<\/?script[^>]*>/g, ''));
  console.log('✓ 新 Script #2 语法正确');
} catch(e) {
  console.log('✗ 新 Script #2 语法错误:', e.message.substring(0,200));
}

require('fs').writeFileSync('ziwei-metis-unified.html', newH);
console.log('\n已写入，大小:', newH.length);
