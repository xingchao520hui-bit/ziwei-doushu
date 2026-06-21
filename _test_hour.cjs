const {astro}=require('iztro');
console.log('=== 测试 hourIndex 对 命宫 的影响 ===');
for(let h=0;h<=12;h++){
    try{
        const d=astro.bySolar('1999-02-17',h,'男',true,'zh-CN');
        const ming=d.palaces.find(p=>p.name==='命宫');
        console.log('hourIndex='+h+' → 命宫:'+ming.earthlyBranch+ming.heavenlyStem);
    }catch(e){console.log('hourIndex='+h+' ERROR:'+e.message);}
}
console.log('');
console.log('=== 期望结果：命宫=丁卯 ===');
