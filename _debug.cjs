const h = require('fs').readFileSync('ziwei-metis-unified.html', 'utf8');
const callPos = 1645983;
const defPos = 1658320;

// 从调用位置往前找最近的 function 声明
let chunk = h.substring(Math.max(0, callPos - 8000), callPos + 30);
let lastFn = chunk.lastIndexOf('function ');
if (lastFn > -1) {
  console.log('调用所在函数:', chunk.substring(lastFn, lastFn + 80));
}

// 检查 generateEvaluation 定义前是否有闭合的大括号把它关在某个作用域里
let between = h.substring(callPos, defPos);
console.log('\n调用→定义之间:');
console.log('  } 数量:', (between.match(/\}/g) || []).length);
console.log('  { 数量:', (between.match(/\{/g) || []).length);

// 检查是否在 script 标签内
let scriptBeforeCall = h.lastIndexOf('<script', callPos);
let scriptCloseBeforeCall = h.lastIndexOf('</script>', callPos);
console.log('\n最近 <script:', scriptBeforeCall);
console.log('最近 </script> 在调用前:', scriptCloseBeforeCall);
console.log('调用在 script 内?', scriptBeforeCall > scriptCloseBeforeCall);

// 检查定义的script标签
let scriptBeforeDef = h.lastIndexOf('<script', defPos);
let scriptCloseBeforeDef = h.lastIndexOf('</script>', defPos);
console.log('\n定义 最近 <script:', scriptBeforeDef);
console.log('定义 最近 </script> 在定义前:', scriptCloseBeforeDef);
console.log('定义在 script 内?', scriptBeforeDef > scriptCloseBeforeDef);

// 关键：调用和定义是否在同一个 script 块？
console.log('\n同一script块?', scriptBeforeCall === scriptBeforeDef && scriptBeforeCall > (scriptCloseBeforeCall || -1));
