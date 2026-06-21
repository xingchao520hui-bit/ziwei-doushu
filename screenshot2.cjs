// screenshot2.cjs — 用 Playwright 填表+截图
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const url = 'http://localhost:3211/ziwei-metis-unified.html';
const outPath = path.join(__dirname, 'screenshot_result.png');

// 用 Edge 无头截图，先等页面加载
const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outPath}" --window-size=1400,1000 --run-all-compositor-stages-before-draw "${url}"`;
console.log('执行截图...');

try {
  execSync(cmd, { timeout: 30000 });
  
  if (fs.existsSync(outPath)) {
    const stats = fs.statSync(outPath);
    console.log('截图成功:', outPath, stats.size, 'bytes');
  } else {
    console.log('截图文件未生成');
  }
} catch(e) {
  console.log('截图失败:', e.message);
}
