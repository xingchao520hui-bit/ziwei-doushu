const puppeteer = require('puppeteer-core');
const path = require('path');

const EXECUTABLE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function generatePDF(url, outputPath) {
  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    // Wait for analysis to complete (result area shows)
    try {
      await page.waitForSelector('#result.show, .result-area.show, .result.show', { timeout: 20000 });
    } catch(e) {}
    await new Promise(r => setTimeout(r, 3000));
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    console.log('✅ ' + outputPath);
  } finally {
    await browser.close();
  }
}

async function main() {
  const BASE = 'http://localhost:3211';
  const OUT = 'C:\\Users\\LENOVO\\Desktop\\案例\\微信\\';

  // 1. 团团 1997/3/27 17:30 男
  await generatePDF(`${BASE}/ziwei-app.html?name=团团&year=1997&month=3&day=27&hour=18&gender=male&print=1`,
    path.join(OUT, '团团.pdf'));

  // 2. 周周 2003/3/6 01:16 女
  await generatePDF(`${BASE}/ziwei-app.html?name=周周&year=2003&month=3&day=6&hour=2&gender=female&print=1`,
    path.join(OUT, '周周.pdf'));

  // 3. 董志娟 1986/5/18 18:00 女
  await generatePDF(`${BASE}/ziwei-app.html?name=董志娟&year=1986&month=5&day=18&hour=18&gender=female&print=1`,
    path.join(OUT, '董志娟.pdf'));

  // 4. 如 2004/11/1 01:40 女 (吃瓜版)
  await generatePDF(`${BASE}/ziwei-fun.html?name=如&year=2004&month=11&day=1&hour=2&gender=female&print=1`,
    path.join(OUT, '如_吃瓜版.pdf'));

  // 5. 地山谦 2003/6/3 14:30 男
  await generatePDF(`${BASE}/ziwei-app.html?name=地山谦&year=2003&month=6&day=3&hour=14&gender=male&print=1`,
    path.join(OUT, '地山谦.pdf'));

  // 6. F 1999/11/15 13:00 女
  await generatePDF(`${BASE}/ziwei-app.html?name=F&year=1999&month=11&day=15&hour=13&gender=female&print=1`,
    path.join(OUT, 'F.pdf'));

  // 7. Y 2006/7/29 13:00 女
  await generatePDF(`${BASE}/ziwei-app.html?name=Y&year=2006&month=7&day=29&hour=13&gender=female&print=1`,
    path.join(OUT, 'Y.pdf'));

  console.log('\n🎉 全部完成！');
}

main().catch(console.error);
