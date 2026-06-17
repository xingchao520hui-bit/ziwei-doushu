/**
 * 批量生成 专业版PDF（主页面 http://localhost:3211/）
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { Lunar } = require('lunar-javascript');

const OUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\小红书';
const SERVER_URL = 'http://localhost:3211';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// 13人数据（公历直接用农历需要转换）
const people = [
  { name: '啊呀呀的一二三四五', year: 1990, month: 4, day: 15, hour: 8, gender: 'female' },
  { name: '菜菜不菜', year: 1993, month: 10, day: 9, hour: 8, gender: 'female', lunar: [1993, 8, 24] },
  { name: '爱游泳的大黑羊', year: 1995, month: 2, day: 20, hour: 5, gender: 'female' },
  { name: '欢欢的手作小铺', year: 1992, month: 2, day: 11, hour: 17, gender: 'female' },
  { name: '小红薯6231C861', year: 1992, month: 8, day: 7, hour: 4, gender: 'female', lunar: [1992, 7, 9] },
  { name: '浚川', year: 1998, month: 5, day: 19, hour: 11, gender: 'male' },
  { name: 'betty', year: 1999, month: 11, day: 15, hour: 13, gender: 'female' },
  { name: '幸运锦鲤', year: 1999, month: 11, day: 3, hour: 6, gender: 'female' },
  { name: '云吃吃（前进版）', year: 2004, month: 11, day: 1, hour: 0, gender: 'female', lunar: [2004, 9, 19] },
  { name: 'Conócete a ti mismo', year: 2003, month: 7, day: 14, hour: 13, gender: 'female' },
  { name: '红鲤鱼与绿鲤鱼与驴', year: 1998, month: 10, day: 21, hour: 16, gender: 'female' },
  { name: 'Miraitowa-', year: 2005, month: 12, day: 2, hour: 16, gender: 'female' },
  { name: '木木14', year: 1998, month: 5, day: 31, hour: 6, gender: 'female' },
];

function lunarToSolar(lunarYear, lunarMonth, lunarDay) {
  const lunar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
  const solar = lunar.getSolar();
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
}

async function generatePDFs() {
  console.log('🚀 批量生成专业版PDF...\n');
  console.log('📁 输出目录:', OUT_DIR);
  console.log('🌐 服务器:', SERVER_URL, '\n');

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 启动Edge浏览器（保持一个实例，反复使用）
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  for (let i = 0; i < people.length; i++) {
    const p = people[i];

    // 农历转换
    let year = p.year, month = p.month, day = p.day;
    if (p.lunar) {
      const solar = lunarToSolar(p.lunar[0], p.lunar[1], p.lunar[2]);
      year = solar.year; month = solar.month; day = solar.day;
      console.log(`  [农历→公历] ${p.lunar[0]}-${p.lunar[1]}-${p.lunar[2]} → ${year}-${month}-${day}`);
    }

    // 使用主页面（专业版），带print=1参数自动打印
    const url = `${SERVER_URL}/?year=${year}&month=${month}&day=${day}&hour=${p.hour}&gender=${p.gender}&print=1`;
    const safeName = p.name.replace(/[\\/:*?"<>|]/g, '_');
    const outputPath = path.join(OUT_DIR, `${safeName}.pdf`);

    // 如果PDF已存在，跳过
    if (fs.existsSync(outputPath)) {
      const stat = fs.statSync(outputPath);
      if (stat.size > 10000) {
        console.log(`[${i+1}/${people.length}] 跳过（已存在）: ${p.name}`);
        continue;
      }
    }

    console.log(`[${i+1}/${people.length}] 生成中: ${p.name} (${year}-${month}-${day} ${p.hour}:00 ${p.gender})`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 3000 });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      // 等待页面加载完成（查找结果区域）
      await page.waitForSelector('.result-area, .result', { timeout: 20000 }).catch(() => {});
      // 额外等待，让JavaScript执行完
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

    // 每个之间稍作等待
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
  console.log('\n🎉 全部完成！');
}

generatePDFs().catch(console.error);
