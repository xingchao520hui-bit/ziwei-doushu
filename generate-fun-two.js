const puppeteer = require('puppeteer-core');
const path = require('path');

const users = [
  { name: '千古之秋', year: 2000, month: 5, day: 20, hour: 8, gender: 'male' },
  { name: '横', year: 2002, month: 7, day: 16, hour: 10, gender: 'male' }
];

const OUTPUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\微信修改';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const u of users) {
    const url = `http://localhost:3211/ziwei-fun.html?year=${u.year}&month=${u.month}&day=${u.day}&hour=${u.hour}&gender=${u.gender}&print=1`;
    console.log(`Generating for ${u.name}: ${url}`);
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for analysis to complete (wait for result area to show)
    await page.waitForSelector('#result.show', { timeout: 30000 });
    // Additional wait for charts to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const filePath = path.join(OUTPUT_DIR, `${u.name}.pdf`);
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });
    
    console.log(`  → Saved: ${filePath}`);
    await page.close();
  }

  await browser.close();
  console.log('Done!');
})();
