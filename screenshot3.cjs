// screenshot3.cjs — Playwright 填表+排盘+截图
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  
  const url = 'http://localhost:3211/ziwei-metis-unified.html';
  console.log('打开:', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  
  // 填入测试数据：1999-02-17 22:00 男
  await page.fill('#s-year', '1999');
  await page.fill('#s-month', '2');
  await page.fill('#s-day', '17');
  
  // 选择时辰（22:00 = 亥时）
  const hourSelect = await page.$('#s-hour');
  if (hourSelect) {
    await hourSelect.selectOption('23'); // 亥时
  }
  
  // 性别已默认男
  
  // 点击排盘按钮
  console.log('点击排盘...');
  await page.click('#s-submit');
  
  // 等待结果出现
  await page.waitForTimeout(3000);
  
  // 截图
  const outPath = __dirname + '/screenshot_result.png';
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('截图完成:', outPath);
  
  // 也截一张只看命盘区域的
  const resultEl = await page.$('#s-result');
  if (resultEl) {
    await resultEl.screenshot({ path: __dirname + '/screenshot_chart.png' });
    console.log('命盘区域截图完成');
  }
  
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
