/**
 * 批量生成 吃瓜版PDF
 * 13人命盘数据 -> 打开浏览器 -> 打印PDF -> 保存到目录
 */
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Lunar } = require('lunar-javascript');

const OUT_DIR = 'C:\\Users\\LENOVO\\Desktop\\案例\\小红书';

// 确保输出目录存在
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 13人数据
const people = [
  { name: '啊呀呀的一二三四五', year: 1990, month: 4, day: 15, hour: 8, gender: 'female', lunar: false },
  { name: '菜菜不菜', year: 1993, month: 10, day: 9, hour: 8, gender: 'female', lunar: true, lunarYear: 1993, lunarMonth: 8, lunarDay: 24 },
  { name: '爱游泳的大黑羊', year: 1995, month: 2, day: 20, hour: 5, gender: 'female', lunar: false },
  { name: '欢欢的手作小铺', year: 1992, month: 2, day: 11, hour: 17, gender: 'female', lunar: false },
  { name: '小红薯6231C861', year: 1992, month: 8, day: 7, hour: 4, gender: 'female', lunar: true, lunarYear: 1992, lunarMonth: 7, lunarDay: 9 },
  { name: '浚川', year: 1998, month: 5, day: 19, hour: 11, gender: 'male', lunar: false },
  { name: 'betty', year: 1999, month: 11, day: 15, hour: 13, gender: 'female', lunar: false },
  { name: '幸运锦鲤', year: 1999, month: 11, day: 3, hour: 6, gender: 'female', lunar: false },
  { name: '云吃吃（前进版）', year: 2004, month: 11, day: 1, hour: 0, gender: 'female', lunar: true, lunarYear: 2004, lunarMonth: 9, lunarDay: 19 },
  { name: 'Conócete a ti mismo', year: 2003, month: 7, day: 14, hour: 13, gender: 'female', lunar: false },
  { name: '红鲤鱼与绿鲤鱼与驴', year: 1998, month: 10, day: 21, hour: 16, gender: 'female', lunar: false },
  { name: 'Miraitowa-', year: 2005, month: 12, day: 2, hour: 16, gender: 'female', lunar: false },
  { name: '木木14', year: 1998, month: 5, day: 31, hour: 6, gender: 'female', lunar: false },
];

// 农历转公历
function lunarToSolar(lunarYear, lunarMonth, lunarDay) {
  const lunar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
  const solar = lunar.getSolar();
  return {
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay()
  };
}

// 生成PDF的函数（使用Edge浏览器 --print-to-pdf）
function generatePDF(name, year, month, day, hour, gender, index, total) {
  return new Promise((resolve, reject) => {
    const safeName = name.replace(/[\\/:*?"<>|]/g, '_');
    const pdfPath = path.join(OUT_DIR, `${safeName}.pdf`);
    
    // 如果PDF已存在，跳过
    if (fs.existsSync(pdfPath)) {
      console.log(`[${index}/${total}] 跳过（已存在）: ${name}`);
      resolve(pdfPath);
      return;
    }
    
    console.log(`[${index}/${total}] 生成中: ${name} (${year}-${month}-${day} ${hour}:00 ${gender})`);
    
    // 构建URL参数
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
      day: day.toString(),
      hour: hour.toString(),
      gender: gender
    });
    const url = `http://localhost:3211/ziwei-fun.html?${params.toString()}`;
    
    // 使用Edge浏览器打印PDF
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--print-to-pdf="' + pdfPath + '"',
      '--print-to-pdf-no-header',
      url
    ];
    
    const proc = spawn(edgePath, args, { detached: true, stdio: 'ignore' });
    proc.unref();
    
    // 等待PDF生成（最多30秒）
    let waited = 0;
    const check = setInterval(() => {
      waited += 1000;
      if (fs.existsSync(pdfPath)) {
        clearInterval(check);
        console.log(`  ✅ 已保存: ${safeName}.pdf`);
        resolve(pdfPath);
      } else if (waited > 30000) {
        clearInterval(check);
        console.log(`  ⚠️ 超时: ${name}`);
        resolve(null);
      }
    }, 1000);
  });
}

// 主函数
async function main() {
  console.log('🚀 开始批量生成PDF...\n');
  console.log(`📁 输出目录: ${OUT_DIR}\n`);
  
  const total = people.length;
  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    
    // 农历转换
    let year = p.year, month = p.month, day = p.day, hour = p.hour;
    if (p.lunar) {
      const solar = lunarToSolar(p.lunarYear, p.lunarMonth, p.lunarDay);
      year = solar.year; month = solar.month; day = solar.day;
      console.log(`  [农历转公历] ${p.lunarYear}-${p.lunarMonth}-${p.lunarDay} → ${year}-${month}-${day}`);
    }
    
    await generatePDF(p.name, year, month, day, hour, p.gender, i + 1, total);
    
    // 每个之间等待2秒，避免浏览器冲突
    if (i < people.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log('\n🎉 全部完成！');
}

main().catch(console.error);
