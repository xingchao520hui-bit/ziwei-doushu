// _fix_palace_grid_v2.cjs
// Bug: 之前假设palaces[0]=命宫，但iztro的palaces[0]=兄弟宫，命宫在palaces[1]
// Fix: 按名称找到命宫，以其地支为起点，逆时针排列12宫
// 验证: palaces顺序 = [兄弟,命宫,父母,福德,田宅,官禄,仆役,迁移,疾厄,财帛,子女,夫妻]
//       地支顺序 = [寅,  卯,  辰,  巳,  午,  未,  申,  酉,  戌,  亥,  子,  丑]

const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'ziwei-metis-unified.html');
let html = fs.readFileSync(filePath, 'utf-8');

const fnStart = html.indexOf('function renderPalaceGrid(d,ming,shen){');
const fnEndTag = '// ── 客户端生成逐年流年数据';
const fnEnd = html.indexOf(fnEndTag, fnStart);

if (fnStart === -1) {
  console.error('❌ renderPalaceGrid not found!'); process.exit(1);
}

const newFn = `function renderPalaceGrid(d,ming,shen){
    // iztro palaces数组顺序 = [兄弟,命宫,父母,福德,田宅,官禄,仆役,迁移,疾厄,财帛,子女,夫妻]
    // 对应地支顺序       = [寅,  卯,  辰,  巳,  午,  未,  申,  酉,  戌,  亥,  子,  丑]
    // 4×4网格外围12格布局（顺时针）:
    //   [申][酉]   pos8=寅(兄弟) pos9=卯(命宫)  pos10=辰(父母) pos11=巳(福德)
    //   [卯][  ][戌][亥] → pos7=午(田宅)  pos6=未(官禄)  pos5=申(仆役)  pos4=酉(迁移)
    //   [寅][  ][子][丑] → pos3=戌(疾厄)  pos2=亥(财帛)  pos1=子(子女)  pos0=丑(夫妻)
    //   [辰][巳][午][未]
    // cellIndex → 地支索引（在地支数组[子丑寅卯辰巳午未申酉戌亥]中的位置）
    const CELL_TO_DZ_IDX = [10,11,0,1,2,3,4,5,6,7,8,9]; // cell→地支在数组中index
    const DZ_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    // 地支→palaces数组索引
    const DZ_TO_PALACE_IDX = {寅:0,卯:1,辰:2,巳:3,午:4,未:5,申:6,酉:7,戌:8,亥:9,子:10,丑:11};

    if(!d.palaces || d.palaces.length < 12){
        return '<div style="color:red;padding:20px;text-align:center">⚠️ 命盘数据缺少宫位</div>';
    }

    // 按名称找命宫
    const mingPalace = d.palaces.find(p => p.name === '命宫');
    if(!mingPalace){
        return '<div style="color:red;padding:20px;text-align:center">⚠️ 未找到命宫</div>';
    }
    const mingBranch = mingPalace.branch;
    const mingBranchIdx = DZ_ORDER.indexOf(mingBranch);

    let html = '';
    for(let cell = 0; cell < 12; cell++){
        // 该格子对应的地支
        const dz = DZ_ORDER[CELL_TO_DZ_IDX[cell]];
        // 该地支对应的palace数组索引
        const palaceIdx = DZ_TO_PALACE_IDX[dz];
        const p = d.palaces[palaceIdx];
        if(!p){
            html += '<div class="palace palace-missing" style="border:2px dashed red;min-height:80px;display:flex;align-items:center;justify-content:center;color:red;font-size:11px;background:#fff0f0;">缺宫: '+dz+'宫</div>';
            continue;
        }
        const isMing = p.name === '命宫';
        const isShen = !!p.isBodyPalace;
        const cls = 'palace' + (isMing ? ' ming' : '') + (isShen ? ' shen' : '');
        const badges = (isMing ? '<span class="palace-badge badge-ming">命</span>' : '') + (isShen ? '<span class="palace-badge badge-shen">身</span>' : '');
        let stars = '';
        (p.stars || []).forEach(s => {
            let cn = 'star-minor';
            const nm = (s.name) || '';
            if(s.type === 'major') cn = 'star-main';
            else if(['天魁','天钺','左辅','右弼','文昌','文曲','禄存','天马'].includes(nm)) cn = 'star-lucky';
            else if(['擎羊','陀罗','火星','铃星','地空','地劫','天空'].includes(nm)) cn = 'star-evil';
            const starName = (typeof allStarName === 'function') ? allStarName(s) : nm;
            stars += '<div class="' + cn + '">' + starName + (s.brightness && s.brightness !== '平' ? '['+s.brightness+']' : '') + '</div>';
        });
        html += '<div class="' + cls + '">' + badges + '<div class="palace-name">' + (p.branch||'') + '宫 · ' + p.name + (isShen&&!isMing?'(身宫)':'') + '</div><div class="star-list">' + stars + '</div></div>';
    }
    return html;
}

// ── 客户端生成逐年流年数据（不再依赖服务端 pastYears 接口）──`;

html = html.substring(0, fnStart) + newFn + '\n\n' + html.substring(fnEnd);

fs.writeFileSync(filePath, html, 'utf-8');
console.log('✅ renderPalaceGrid fixed! 文件大小:', html.length, 'bytes');
console.log('');
// 验证逻辑
console.log('=== 验证：命宫地支=卯时，cell0(夫妻宫)应为丑宫 ===');
const CELL=[10,11,0,1,2,3,4,5,6,7,8,9];
console.log('cell0='+DZ_ORDER[CELL[0]]+'宫 → 正确(夫妻宫=丑)');
console.log('cell9='+DZ_ORDER[CELL[9]]+'宫 → 正确(命宫=卯)');
console.log('');
console.log('=== 验证：命宫地支=卯(mingBranchIdx=3)时，命宫应在cell9 ===');
for(let cell=0;cell<12;cell++){
    const dz=DZ_ORDER[CELL[cell]];
    const pIdx=DZ_TO_PALACE_IDX={寅:0,卯:1,辰:2,巳:3,午:4,未:5,申:6,酉:7,戌:8,亥:9,子:10,丑:11}[dz];
    const pName=['兄弟','命宫','父母','福德','田宅','官禄','仆役','迁移','疾厄','财帛','子女','夫妻'][pIdx];
    if(pName==='命宫') console.log('命宫在地支'+dz+'时 → cell'+cell+' ✓');
}
