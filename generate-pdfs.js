const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// 13个信息完整的人（跳过了缺性别的4、6、10号，以及缺时辰的7号）
const people = [
  { name: '沐沐', gender: 'female', year: 1993, month: 8, day: 31, hour: 12 },
  { name: '一颗香菇', gender: 'female', year: 1998, month: 11, day: 27, hour: 20 },
  { name: '接地气儿', gender: 'male', year: 1990, month: 10, day: 16, hour: 10 },
  { name: 'Jin', gender: 'female', year: 1985, month: 11, day: 27, hour: 6 },
  { name: '曲中意', gender: 'female', year: 2002, month: 8, day: 9, hour: 23 },
  { name: '明日香', gender: 'female', year: 2000, month: 9, day: 11, hour: 6 },
  { name: '一个馒头撑一年', gender: 'male', year: 2000, month: 8, day: 14, hour: 6 },
  { name: 'momo男', gender: 'male', year: 1993, month: 10, day: 3, hour: 1 },
  { name: 'momo女', gender: 'female', year: 1993, month: 12, day: 13, hour: 9 },
  { name: 'Lily', gender: 'female', year: 1998, month: 7, day: 19, hour: 17 },
  { name: '青', gender: 'female', year: 1986, month: 12, day: 26, hour: 8 },
  { name: '樾问拾晴', gender: 'female', year: 1980, month: 4, day: 14, hour: 22 },
  { name: '一起来养生', gender: 'female', year: 1992, month: 1, day: 17, hour: 5 },
];

const outputDir = 'C:\\Users\\LENOVO\\Desktop\\案例\\小红书';
const serverUrl = 'http://localhost:3212';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function generatePDFs() {
  console.log(`开始生成 ${people.length} 个命盘PDF...`);
  console.log('输出目录:', outputDir);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-settings-window', '--disable-extensions'],
  });

  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const url = `${serverUrl}/?year=${p.year}&month=${p.month}&day=${p.day}&hour=${p.hour}&gender=${p.gender}`;
    const outputPath = path.join(outputDir, `${p.name}.pdf`);

    console.log(`\n[${i+1}/${people.length}] ${p.name} (${p.year}-${p.month}-${p.day} ${p.hour}:00)`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 2000 });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.result-area.show', { timeout: 15000 });
      // 额外等待渲染完成
      await new Promise(r => setTimeout(r, 3500));
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
      });
      console.log(`  ✅ 已保存: ${p.name}.pdf`);
    } catch (e) {
      console.error(`  ❌ 失败: ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n✅ 全部完成！共生成 ${people.length} 个PDF`);
  console.log('保存位置:', outputDir);
}

generatePDFs().catch(console.error);
