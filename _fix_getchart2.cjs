const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ziwei-metis-unified.html');
let html = fs.readFileSync(filePath, 'utf8');

// 找第二个 getChart 函数（页面级）
const gc1 = html.indexOf('function getChart(){');
const gc2 = html.indexOf('function getChart(){', gc1 + 1);

if (gc2 === -1) {
    console.log('ERROR: 找不到第二个 getChart');
    process.exit(1);
}

// 找结束位置
const gcEnd = html.indexOf('\nfunction showError(', gc2);
console.log('第二个 getChart: ' + gc2 + ' - ' + gcEnd + ' (长度 ' + (gcEnd - gc2) + ')');

// 新的 getChart：直接调用服务器 API，移除所有 window.Ziwei 调用
const newGetChart = `function getChart(){
  var year=parseInt(document.getElementById('s-year').value);
  var month=parseInt(document.getElementById('s-month').value);
  var day=parseInt(document.getElementById('s-day').value);
  var hour=parseInt(document.getElementById('s-hour').value);
  var minute=parseInt(document.getElementById('s-minute').value)||0;
  var genderGroup=document.getElementById('s-gender');
  var gender=genderGroup.querySelector('.active').dataset.v;
  var location=document.getElementById('s-location').value.trim();

  if(!year||!month||!day){showError('请填写完整的出生日期');return;}

  document.getElementById('s-loading').classList.add('show');
  document.getElementById('s-error').classList.remove('show');
  document.getElementById('s-result').classList.remove('show');
  document.getElementById('s-submit').disabled=true;

  // 直接调用服务器 API（端口3211）
  var params='year='+year+'&month='+month+'&day='+day+'&hour='+hour+'&minute='+minute+'&gender='+gender+'&isSolar=true';
  fetch('http://localhost:3211/chart?'+params)
  .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
  .then(function(d){
    document.getElementById('s-loading').classList.remove('show');
    document.getElementById('s-submit').disabled=false;
    render(d);
  })
  .catch(function(e){
    document.getElementById('s-loading').classList.remove('show');
    document.getElementById('s-submit').disabled=false;
    showError('排盘失败: '+e.message+'<br>请确认已启动服务器：<b>node chart-server.js</b>');
  });
}
`;

const before = html.substring(0, gc2);
const after = html.substring(gcEnd);
const newHtml = before + newGetChart + after;

if (newHtml === html) {
    console.log('ERROR: 替换未生效');
    process.exit(1);
}

// 备份
fs.writeFileSync(filePath + '.bak4', html);
console.log('备份: ' + filePath + '.bak4');

fs.writeFileSync(filePath, newHtml, 'utf8');
console.log('修复完成！');
console.log('文件大小: ' + fs.statSync(filePath).size + ' bytes');

// 验证
const html2 = fs.readFileSync(filePath, 'utf8');
const gc2new = html2.indexOf('function getChart(){', html2.indexOf('function getChart(){') + 1);
const ge2 = html2.indexOf('\nfunction showError(', gc2new);
const body = html2.substring(gc2new, ge2);
if (body.indexOf('window.Ziwei') !== -1) {
    console.log('⚠ 警告: window.Ziwei 仍然存在于页面 getChart');
} else {
    console.log('✓ window.Ziwei 已从页面 getChart 移除');
}
if (body.indexOf('localhost:3211') !== -1) {
    console.log('✓ 服务器 API 调用存在');
}
if (body.indexOf('render(') !== -1) {
    console.log('✓ render() 调用存在');
}
