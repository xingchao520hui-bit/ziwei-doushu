/**
 * 追加生成：奶黄包一只
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\微信';
const SERVER_URL = 'http://localhost:3211';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const person = { name: '奶黄包一只', year: 1997, month: 5, day: 17, hour: 14, gender: 'female' };

async function generate() {
  const url = `${SERVER_URL}/?year=${person.year}&month=${person.month}&day=${person.day}&hour=${person.hour}&gender=${person.gender}&print=1`;
  const outputPath = path.join(OUT_DIR, `${person.name}.pdf`);

  console.log(`📌 生成中: ${person.name} (${person.year}-${person.month}-${person.day} ${person.hour}:00 ${person.gender})`);

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
    console.log(`✅ 已保存: ${person.name}.pdf (${size}KB)`);
  } catch (e) {
    console.error(`❌ 失败: ${e.message}`);
  } finally {
    await page.close();
    await browser.close();
  }
}

generate();
