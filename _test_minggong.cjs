// _test_minggong.cjs - 诊断命宫计算差异
const {astro} = require('iztro');

console.log('=== 目标: 文墨天机 命宫=丁卯, 身宫=丑 ===');
console.log('日期: 1999-02-17, 时间: 22:00 (亥时=hourIndex=11), 男');
console.log('');

// iztro 标准输出
const d = astro.bySolar('1999-02-17', 11, '男', true, 'zh-CN');
const ming = d.palaces.find(p => p.name === '命宫');
const shen = d.palaces.find(p => p.isBodyPalace);
console.log('iztro 命宫:', ming.heavenlyStem + ming.earthlyBranch);
console.log('iztro 身宫:', shen.name + '地支:' + shen.earthlyBranch + shen.heavenlyStem);
console.log('');

// 测试不同 hourIndex
console.log('=== hourIndex 扫描 ===');
const DZ = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
for(let h=0; h<=11; h++){
    try{
        const dd = astro.bySolar('1999-02-17', h, '男', true, 'zh-CN');
        const m = dd.palaces.find(p => p.name === '命宫');
        const s = dd.palaces.find(p => p.isBodyPalace);
        console.log('h='+h+'('+DZ[h]+'时) → 命宫:'+m.heavenlyStem+m.earthlyBranch+' 身宫:'+s.earthlyBranch+s.heavenlyStem+'('+s.name+')');
    }catch(e){}
}
console.log('');
console.log('=== 分析: 为什么 iztro 和文墨天机的命宫不同? ===');
console.log('已知: 文墨天机 命宫=丁卯, 身宫=丑');
console.log('可能原因1: iztro 的 soulIndex 公式 (月-时) vs 标准 (月+时)');
console.log('可能原因2: 时辰换算差异 (文墨天机:22:00=?时)');
console.log('可能原因3: 文墨天机使用不同的月支计算');

// 手动验证标准公式
console.log('');
console.log('=== 标准公式验证 ===');
// 农历正月地支=寅, index=2; 亥时地支=亥, index=10
const monthIdx = 2; // 正月=寅
const hourIdx = 10; // 亥时
const mingIdx = (monthIdx + hourIdx) % 12; // 12
const shenIdx = (monthIdx + hourIdx + 6) % 12; // 6
console.log('标准: 命宫idx='+mingIdx+'='+DZ[mingIdx]+'宫, 身宫idx='+shenIdx+'='+DZ[shenIdx]+'宫');
console.log('目标: 命宫=卯宫, 身宫=丑宫');
