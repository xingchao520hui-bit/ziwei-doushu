const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  // 先确认服务器是否运行
  try {
    await page.goto('http://localhost:3211/ziwei-metis-unified.html', { timeout: 10000 });
  } catch(e) {
    console.log('服务器不可用，尝试 GitHub Pages');
    await page.goto('https://xingchao520hui-bit.github.io/ziwei-doushu/ziwei-metis-unified.html', { timeout: 30000 });
  }
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_initial.png', fullPage: false });
  console.log('初始页面截图: screenshot_initial.png');
  
  // 填写表单 - 找到输入框
  const yearSelect = page.locator('select').first();
  const inputs = page.locator('input[type="number"], input[type="text"], select');
  const count = await inputs.count();
  console.log('找到表单元素:', count);
  
  // 打印页面上所有select的选项
  for (let i = 0; i < Math.min(count, 10); i++) {
    const tag = await inputs.nth(i).evaluate(el => el.tagName + ':' + el.name + ':' + el.id);
    console.log('元素', i, tag);
  }
  
  await browser.close();
})();
