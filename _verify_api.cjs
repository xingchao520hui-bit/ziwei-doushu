const http = require('http');
const fs = require('fs');

// 用 Edge DevTools Protocol (CDP) 来自动化
// 先启动一个带调试端口的 Edge，然后连接

const { execSync } = require('child_process');

// 检查是否有可用的 CDP 端点
async function screenshotWithCDP() {
  // 使用 puppeteer-core 连接到已有的 Edge 或启动新的
  try {
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: false,
      args: ['--remote-debugging-port=9222', '--no-first-run', '--no-default-browser-check']
    });
    // ...
  } catch(e) {
    console.log('puppeteer-core not available');
  }
}

// 更简单的方法：创建一个临时 HTML 页面来自动填表并跳转
const autoFillHTML = `<!DOCTYPE html>
<html><body>
<script>
setTimeout(() => {
  // 打开目标页面并在新窗口中自动填表
  const win = window.open('http://localhost:3211/ziwei-metis-unified.html', '_blank');
  setTimeout(() => {
    // 由于跨域无法直接操作，我们用另一种方式
  }, 3000);
}, 1000);
</script>
<p>请手动在打开的窗口中查看效果...</p>
</body></html>`;

console.log('CDP方式需要额外依赖。改用最简单的方式：直接用 Node.js fetch API 调用排盘接口验证后端是否正常工作。');

// 验证后端 API 是否正常
fetch('http://localhost:3211/chart?year=1999&month=2&day=17&hour=23&min=0&gender=m&name=测试&city=北京')
  .then(r => r.json())
  .then(d => {
    console.log('\n✓ 后端API正常！');
    console.log('命宫地支:', d.ming?.branch || d.palaces?.[0]?.branch);
    console.log('宫位数:', d.palaces?.length);
    
    // 保存结果用于检查
    fs.writeFileSync('_api_test.json', JSON.stringify(d, null, 2));
    console.log('完整数据已保存到 _api_test.json');
  })
  .catch(err => {
    console.log('✗ 后端API错误:', err.message);
    console.log('请确认已运行: node chart-server.js');
  });
