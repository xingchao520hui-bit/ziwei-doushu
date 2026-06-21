const fs = require('fs');
const html = fs.readFileSync('ziwei-metis-unified.html', 'utf8');

console.log('文件大小:', html.length, '字符');

// 关键函数存在性
const checks = [
    'function pn(',
    'function render(',
    'function showError(',
    'function getChart(){',
    'function renderPalaceGrid(',
    'function starName(',
];
checks.forEach(k => {
    const pos = html.indexOf(k);
    console.log(k + ' 位置: ' + pos + (pos === -1 ? ' ❌ 不存在' : ' ✓'));
});

// render 函数体内的 pn 调用
const renderPos = html.indexOf('function render(');
const renderPos2 = html.indexOf('function render(', renderPos + 1);
console.log('\n第一个 render: ' + renderPos);
console.log('第二个 render: ' + renderPos2);

if (renderPos !== -1) {
    // 找 render 函数体结束
    let end = html.indexOf('\nfunction ', renderPos + 10);
    if (end === -1) end = html.indexOf('\nvar ', renderPos + 10);
    if (end === -1) end = html.indexOf('\nconst ', renderPos + 10);
    const body = html.substring(renderPos, end);
    console.log('第一个 render 体长度:', body.length, '字符');
    
    const pnCount = (body.match(/pn\(/g) || []).length;
    console.log('第一个 render 内 pn 调用次数:', pnCount);
    
    // 找 renderPalaceGrid 调用
    if (body.indexOf('renderPalaceGrid') !== -1) {
        console.log('✓ 第一个 render 调用 renderPalaceGrid');
    } else {
        console.log('✗ 第一个 render 未调用 renderPalaceGrid');
    }
}

if (renderPos2 !== -1) {
    let end2 = html.indexOf('\nfunction ', renderPos2 + 10);
    const body2 = html.substring(renderPos2, end2);
    console.log('\n第二个 render 体长度:', body2.length, '字符');
    const pnCount2 = (body2.match(/pn\(/g) || []).length;
    console.log('第二个 render 内 pn 调用次数:', pnCount2);
}

// 找页面的 getChart（第二个 getChart）
const gc1 = html.indexOf('function getChart(){');
const gc2 = html.indexOf('function getChart(){', gc1 + 1);
console.log('\n=== 页面级 getChart (第二个) ===');
console.log('位置:', gc2);
if (gc2 !== -1) {
    const gcEnd = html.indexOf('\nfunction showError(', gc2);
    const gcBody = html.substring(gc2, gcEnd);
    if (gcBody.indexOf('render(') !== -1) console.log('✓ 调用 render()');
    if (gcBody.indexOf('renderPalaceGrid') !== -1) console.log('✓ 调用 renderPalaceGrid()');
    if (gcBody.indexOf('localhost:3211') !== -1) console.log('✓ 调用服务器 API');
    if (gcBody.indexOf('window.Ziwei') !== -1) console.log('⚠ 调用 window.Ziwei (应移除)');
    console.log('内容预览:', gcBody.substring(0, 300));
}
