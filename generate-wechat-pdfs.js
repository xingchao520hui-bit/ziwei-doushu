/**
 * 批量生成微信案例PDF - 专业版
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// 8个人的出生信息
const people = [
  { name: 'AAA肯德基疯狂星期四代吃', year: 2001, month: 10, day: 7, hour: 4, gender: 'male' },
  { name: '未留名', year: 2001, month: 8, day: 21, hour: 0, gender: 'female' },
  { name: 'Z', year: 1996, month: 5, day: 10, hour: 6, gender: 'female' },
  { name: 'Ruby', year: 2002, month: 1, day: 21, hour: 13, gender: 'female' },
  { name: '十六都行', year: 1992, month: 3, day: 22, hour: 11, gender: 'male' },
  { name: '天坛头像', year: 2003, month: 6, day: 4, hour: 14, gender: 'male' },
  { name: '千古之秋', year: 2000, month: 5, day: 20, hour: 8, gender: 'male' },
  { name: '扁羽', year: 2004, month: 2, day: 5, hour: 7, gender: 'female' }
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
  
  // 等待排盘完成
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 生成PDF文件名（安全文件名）
  const safeName = person.name.replace(/[\\\/:*?"<>|]/g, '_');
  const outputPath = path.join(OUTPUT_DIR, `${safeName}_${person.year}年.pdf`);
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    }
  });
  
  await browser.close();
  console.log(`✅ 已生成: ${outputPath}`);
  return outputPath;
}

async function main() {
  // 创建输出文件夹
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ 创建文件夹: ${OUTPUT_DIR}`);
  }
  
  console.log(`开始批量生成 ${people.length} 个命盘PDF...`);
  console.log(`输出目录: ${OUTPUT_DIR}\n`);
  
  const results = [];
  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    console.log(`[${i + 1}/${people.length}] ${person.name}`);
    
    try {
      const pdfPath = await generatePDF(person);
      results.push({ name: person.name, status: 'success', path: pdfPath });
    } catch (error) {
      console.error(`❌ 生成失败: ${person.name}`);
      console.error(`   错误: ${error.message}`);
      results.push({ name: person.name, status: 'error', error: error.message });
    }
  }
  
  console.log('\n=== 生成完成 ===');
  console.log(`成功: ${results.filter(r => r.status === 'success').length}`);
  console.log(`失败: ${results.filter(r => r.status === 'error').length}`);
  console.log(`\n输出目录: ${OUTPUT_DIR}`);
}

main().catch(console.error);
