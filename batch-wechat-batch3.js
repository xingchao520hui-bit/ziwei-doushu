/**
 * 追加生成：微信"紫薇c"群 第三批（8人）
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\微信';
const SERVER_URL = 'http://localhost:3211';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const people = [
  { name: '不要摆烂', year: 2004, month: 11, day: 1,  hour: 1,  gender: 'female' },
  { name: 'V-依宸',   year: 1992, month: 5,  day: 24, hour: 10, gender: 'female' },
  { name: '鲸鱼',     year: 1986, month: 5,  day: 18, hour: 18, gender: 'female' },
  { name: '岸芷汀兰', year: 1998, month: 5,  day: 31, hour: 6,  gender: 'female' },
  { name: '林競輝M',  year: 1997, month: 9,  day: 11, hour: 21, gender: 'male'   },
  { name: 'SanFrancisco', year: 1996, month: 5, day: 29, hour: 1, gender: 'male' },
  { name: '美鱼',     year: 1993, month: 5,  day: 25, hour: 2,  gender: 'female' },
  { name: 'Kenny代发', year: 2012, month: 11, day: 8,  hour: 16, gender: 'female' },
];

async function generate(person) {
  const url = `${SERVER_URL}/?year=${person.year}&month=${person.month}&day=${person.day}&hour=${person.hour}&gender=${person.gender}&print=1`;
  const outputPath = path.join(OUT_DIR, `${person.name}.pdf`);

  console.log(`[生成中] ${person.name} (${person.year}-${person.month}-${person.day} ${person.hour}:00 ${person.gender})`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 3000 });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.result-area, .result', { timeout: 20000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 5000));

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
    });

    const size = Math.round(fs.statSync(outputPath).size / 1024);
    console.log(`  ✅ ${person.name}.pdf (${size}KB)`);
  } catch (e) {
    console.error(`  ❌ 失败: ${e.message}`);
  } finally {
    await page.close();
    await browser.close();
  }
}

(async () => {
  console.log(`🚀 批量生成第三批（8人）...\n`);
  for (const p of people) {
    await generate(p);
  }
  console.log(`\n🎉 第三批完成！`);
})();