/**
 * 单独生成 2个专业版PDF
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\小红书';
const SERVER_URL = 'http://localhost:3211';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const people = [
  { name: 'Miraitowa-', year: 2005, month: 12, day: 2, hour: 16, gender: 'female' },
  { name: '木木14', year: 1998, month: 5, day: 31, hour: 6, gender: 'female' },
];

async function generatePDFs() {
  console.log('🚀 生成 2个专业版PDF...\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const url = `${SERVER_URL}/?year=${p.year}&month=${p.month}&day=${p.day}&hour=${p.hour}&gender=${p.gender}&print=1`;
    const safeName = p.name.replace(/[\\/:*?"<>|]/g, '_');
    const outputPath = path.join(OUT_DIR, `${safeName}.pdf`);

    // 先删掉旧文件
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch(e) {}
    }

    console.log(`[${i+1}/2] 生成中: ${p.name} (${p.year}-${p.month}-${p.day} ${p.hour}:00 ${p.gender})`);

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
      console.log(`  ✅ 已保存: ${safeName}.pdf (${size}KB)`);
    } catch (e) {
      console.error(`  ❌ 失败: ${e.message}`);
    } finally {
      await page.close();
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
  console.log('\n🎉 完成！');
}

generatePDFs().catch(console.error);
