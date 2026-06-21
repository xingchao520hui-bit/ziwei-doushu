const h = require('fs').readFileSync('ziwei-metis-unified.html', 'utf8');

// 找所有 script 块
const re = /<script[^>]*>/g;
let m;
const scripts = [];
while ((m = re.exec(h)) !== null) {
  const start = m.index;
  const endTag = h.indexOf('</script>', start);
  const end = endTag === -1 ? -1 : endTag + 9;
  scripts.push({ start, end: endTag, len: endTag - start });
}

console.log(`共 ${scripts.length} 个 script 块:\n`);
scripts.forEach((s, i) => {
  // 检查这个块里有什么关键函数
  const content = h.substring(s.start, s.end);
  const hasRender = content.includes('function render(');
  const hasGenEval = content.includes('function generateEvaluation');
  const hasGetChart = content.includes('function getChart');
  const hasRPG = content.includes('function renderPalaceGrid');
  console.log(`Script #${i}: pos ${s.start}-${s.end} (${s.len} chars) | render:${hasRender} genEval:${hasGenEval} getChart:${hasGetChart} rpg:${hasRPG}`);
});
