/**
 * 批量生成专业版PDF（微信新13人）
 * 使用 puppeteer-core 连接 Edge 浏览器
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\微信';
const SERVER_URL = 'http://localhost:3211';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// 13人数据（全部阳历）
const people = [
  { name: '千古之秋', year: 2000, month: 5, day: 20, hour: 8, gender: 'male', note: '西安' },
  { name: '橙子', year: 1990, month: 12, day: 31, hour: 15, gender: 'female', note: '辽宁沈阳' },
  { name: '秘密', year: 2003, month: 6, day: 25, hour: 13, gender: 'female', note: '上海高桥镇' },
  { name: 'W', year: 2003, month: 5, day: 30, hour: 20, gender: 'female', note: '福建福州' },
  { name: '李', year: 2001, month: 8, day: 30, hour: 11, gender: 'male', note: '安徽芜湖' },
  { name: 'lucky', year: 1998, month: 11, day: 14, hour: 6, gender: 'female', note: '' },
  { name: '盐粒花生米', year: 1994, month: 8, day: 27, hour: 5, gender: 'female', note: '辽宁本溪' },
  { name: '吖', year: 2001, month: 6, day: 7, hour: 5, gender: 'female', note: '广东汕头' },
  { name: '青栀无梦', year: 1998, month: 11, day: 30, hour: 19, gender: 'female', note: '天津' },
  { name: '娜娜', year: 1988, month: 8, day: 19, hour: 8, gender: 'female', note: '' },
  { name: '小桐', year: 1993, month: 1, day: 9, hour: 0, gender: 'female', note: '天津' },
  { name: '一溪云', year: 2000, month: 11, day: 30, hour: 10, gender: 'female', note: '湖北大冶市, 取9-11点中间值10点' },
];

async function generatePDFs() {
  console.log('🚀 批量生成专业版PDF（微信新13人）...\n');
  console.log('📁 输出目录:', OUT_DIR);
  console.log('🌐 服务器:', SERVER_URL, '\n');

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  let success = 0, fail = 0;

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const url = `${SERVER_URL}/ziwei-app.html?year=${p.year}&month=${p.month}&day=${p.day}&hour=${p.hour}&gender=${p.gender}`;
    const safeName = p.name.replace(/[\\/:*?"<>|]/g, '_');
    const outputPath = path.join(OUT_DIR, `${safeName}.pdf`);

    if (fs.existsSync(outputPath)) {
      const stat = fs.statSync(outputPath);
      if (stat.size > 10000) {
        console.log(`[${i+1}/${people.length}] 跳过（已存在）: ${p.name}`);
        success++;
        continue;
      }
    }

    console.log(`[${i+1}/${people.length}] 生成中: ${p.name} (${p.year}-${p.month}-${p.day} ${p.hour}:00 ${p.gender})`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 3000 });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      // 等待排盘结果出现
      await page.waitForSelector('#result.show, .result-area, #result', { timeout: 20000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 5000));

      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
      });
      const size = Math.round(fs.statSync(outputPath).size / 1024);
      console.log(`  ✅ ${safeName}.pdf (${size}KB)`);
      success++;
    } catch (e) {
      console.error(`  ❌ 失败: ${e.message}`);
      fail++;
    } finally {
      await page.close();
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  await browser.close();
  console.log(`\n🎉 完成！成功 ${success}，失败 ${fail}，共 ${people.length} 人`);
}

generatePDFs().catch(console.error);
