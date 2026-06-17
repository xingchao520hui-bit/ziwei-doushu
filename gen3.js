/**
 * 生成3个命盘PDF
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const people = [
  { name: '丙曜启明', year: 2002, month: 12, day: 12, hour: 22, gender: 'male' },
  { name: '洛星TN的朋友', year: 2006, month: 2, day: 3, hour: 11, gender: 'male' },
  { name: '乐多多', year: 2000, month: 12, day: 9, hour: 17, gender: 'male' }
];

const OUTPUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\微信';

async function generatePDF(person) {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600 });

  const url = `http://localhost:3211/ziwei-app.html?year=${person.year}&month=${person.month}&day=${person.day}&hour=${person.hour}&gender=${person.gender}&print=1`;
  console.log(`正在生成: ${person.name}`);
  console.log(`URL: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const safeName = person.name.replace(/[\\\/:\*?"<>\|]/g, '_');
  const outputPath = path.join(OUTPUT_DIR, `${safeName}_${person.year}年.pdf`);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });

  await browser.close();
  console.log(`✅ 已生成: ${outputPath}`);
  return outputPath;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`开始生成 ${people.length} 个命盘PDF...\n`);

  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    console.log(`[${i + 1}/${people.length}] ${person.name}`);
    try {
      await generatePDF(person);
    } catch (error) {
      console.error(`❌ 生成失败: ${person.name}`);
      console.error(`   错误: ${error.message}`);
    }
  }

  console.log('\n=== 生成完成 ===');
  console.log(`输出目录: ${OUTPUT_DIR}`);
}

main().catch(console.error);
