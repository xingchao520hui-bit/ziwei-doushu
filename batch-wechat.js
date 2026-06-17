/**
 * 批量生成 专业版PDF — 微信"紫薇c"群13人
 * 输出目录：C:\Users\LENOVO\Desktop\案例\微信
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\微信';
const SERVER_URL = 'http://localhost:3211';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// 13人数据（公历，时辰已转换为24小时制）
const people = [
  { name: '淡川',           year: 1998, month: 5,  day: 19, hour: 11, gender: 'male' },
  { name: '逗号',           year: 1995, month: 2,  day: 20, hour: 5,  gender: 'male' },  // （逗号）简化
  { name: 'WntogeTop',      year: 2003, month: 7,  day: 14, hour: 13, gender: 'female' },
  { name: '庭前树下',       year: 1997, month: 9,  day: 13, hour: 22, gender: 'female' },  // 亥时 21-23 → 22
  { name: 'nh',             year: 2001, month: 6,  day: 28, hour: 15, gender: 'female' },
  { name: '王鑫',           year: 1990, month: 4,  day: 15, hour: 8,  gender: 'male' },   // 辰时 7-9 → 8
  { name: 'Wei Ying',       year: 1989, month: 8,  day: 11, hour: 12, gender: 'female' },  // 午时 11-13 → 12
  { name: '雲海',           year: 1992, month: 2,  day: 11, hour: 17, gender: 'male' },
  { name: '杨灿娟',         year: 1992, month: 1,  day: 17, hour: 5,  gender: 'female' },
  { name: '廿卜',           year: 1998, month: 5,  day: 18, hour: 17, gender: 'female' },
  { name: '熊-jub',         year: 1992, month: 7,  day: 29, hour: 12, gender: 'female' },  // 🐻'จุ๊บ 简化
  { name: '董鸣',           year: 1988, month: 1,  day: 1,  hour: 12, gender: 'male' },
  { name: 'Bering',         year: 2002, month: 9,  day: 19, hour: 11, gender: 'female' },
];

// 文件名安全化
function safeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '');
}

async function generatePDFs() {
  console.log('🚀 批量生成微信"紫薇c"群13人专业版PDF...\n');
  console.log('📁 输出目录:', OUT_DIR);
  console.log('🌐 服务器:', SERVER_URL, '\n');

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log('✅ 已创建输出目录');
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  let success = 0;
  let skip = 0;
  let fail = 0;

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const url = `${SERVER_URL}/?year=${p.year}&month=${p.month}&day=${p.day}&hour=${p.hour}&gender=${p.gender}&print=1`;
    const safeName = safeFileName(p.name);
    const outputPath = path.join(OUT_DIR, `${safeName}.pdf`);

    // 跳过已存在的文件
    if (fs.existsSync(outputPath)) {
      const stat = fs.statSync(outputPath);
      if (stat.size > 10000) {
        console.log(`[${i+1}/${people.length}] 跳过（已存在）: ${p.name}`);
        skip++;
        continue;
      }
    }

    console.log(`[${i+1}/${people.length}] 生成中: ${p.name} (${p.year}-${p.month}-${p.day} ${p.hour}:00 ${p.gender})`);

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
      success++;
    } catch (e) {
      console.error(`  ❌ 失败: ${e.message}`);
      fail++;
    } finally {
      await page.close();
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();

  console.log('\n========================================');
  console.log(`🎉 完成！成功: ${success}，跳过: ${skip}，失败: ${fail}`);
  console.log('========================================');
}

generatePDFs().catch(console.error);
