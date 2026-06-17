const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 人员数据（补全新信息：缺性别的默认女，D律跳过）
const people = [
  { name: '沐沐', gender: 'female', year: 1993, month: 8, day: 31, hour: 12, minute: 28 },
  { name: '一颗香菇', gender: 'female', year: 1998, month: 11, day: 27, hour: 20, minute: 0 },
  { name: '接地气儿', gender: 'male', year: 1990, month: 10, day: 16, hour: 10, minute: 0 },
  { name: 'Cccccelia', gender: 'female', year: 1997, month: 8, day: 24, hour: 8, minute: 30 },
  { name: 'Jin', gender: 'female', year: 1985, month: 11, day: 27, hour: 6, minute: 0 },
  { name: '小甜豆豆', gender: 'female', year: 1995, month: 7, day: 17, hour: 14, minute: 0 },
  // D律 缺时辰，跳过
  { name: '曲中意', gender: 'female', year: 2002, month: 8, day: 9, hour: 23, minute: 28 },
  { name: '明日香', gender: 'female', year: 2000, month: 9, day: 11, hour: 6, minute: 12 },
  { name: '术木14', gender: 'female', year: 1998, month: 5, day: 31, hour: 6, minute: 0 },
  { name: '一个馒头撑一年', gender: 'male', year: 2000, month: 8, day: 14, hour: 6, minute: 15 },
  { name: 'momo男', gender: 'male', year: 1993, month: 10, day: 3, hour: 1, minute: 50 },
  { name: 'momo女', gender: 'female', year: 1993, month: 12, day: 13, hour: 9, minute: 15 },
  { name: 'Lily', gender: 'female', year: 1998, month: 7, day: 19, hour: 17, minute: 30 },
  { name: '青', gender: 'female', year: 1986, month: 12, day: 26, hour: 8, minute: 30 },
  { name: '樾问拾晴', gender: 'female', year: 1980, month: 4, day: 14, hour: 22, minute: 0 },
  { name: '一起来养生', gender: 'female', year: 1992, month: 1, day: 17, hour: 5, minute: 30 },
];

const outputDir = 'C:\\Users\\LENOVO\\Desktop\\案例\\小红书';
const serverUrl = 'http://localhost:3211';

// 时辰转换
function hourToIndex(hour) {
  if (hour >= 23 || hour < 1) return 0;  // 子时
  if (hour >= 1 && hour < 3) return 1;    // 丑时
  if (hour >= 3 && hour < 5) return 2;    // 寅时
  if (hour >= 5 && hour < 7) return 3;    // 卯时
  if (hour >= 7 && hour < 9) return 4;    // 辰时
  if (hour >= 9 && hour < 11) return 5;   // 巳时
  if (hour >= 11 && hour < 13) return 6;  // 午时
  if (hour >= 13 && hour < 15) return 7;  // 未时
  if (hour >= 15 && hour < 17) return 8;  // 申时
  if (hour >= 17 && hour < 19) return 9;  // 酉时
  if (hour >= 19 && hour < 21) return 10; // 戌时
  if (hour >= 21 && hour < 23) return 11; // 亥时
  return 0;
}

async function generatePDFs() {
  console.log(`开始生成 ${people.length} 个命盘PDF...`);
  
  for (const p of people) {
    const hourIndex = hourToIndex(p.hour);
    const url = `${serverUrl}/chart?year=${p.year}&month=${p.month}&day=${p.day}&hour=${hourIndex}&gender=${p.gender}`;
    
    console.log(`\n处理: ${p.name} (${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute})`);
    console.log(`  URL: ${url}`);
    
    // 这里需要调用浏览器打印PDF
    // 暂时先输出URL，手动打开后打印
    console.log(`  请手动打开以上URL，打印为PDF，保存为: ${p.name}.pdf`);
  }
  
  console.log('\n所有命盘URL已生成，请手动打开每个URL并打印为PDF。');
}

generatePDFs().catch(console.error);
