// 修复 ziwei-metis-unified.html 的 getChart 函数
// 移除有问题的嵌入引擎调用，直接使用服务器API

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ziwei-metis-unified.html');
let html = fs.readFileSync(filePath, 'utf8');

// 找到第二个 getChart 函数（页面用的那个）的位置
const firstGetChart = html.indexOf('function getChart(){');
const secondGetChart = html.indexOf('function getChart(){', firstGetChart + 1);

if (secondGetChart === -1) {
    console.log('ERROR: 找不到第二个 getChart 函数');
    process.exit(1);
}

console.log('第一个 getChart 位置:', firstGetChart);
console.log('第二个 getChart 位置:', secondGetChart);

// 新的 getChart 函数（直接用服务器，移除嵌入引擎）
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

  var lng=120;
  if(location){
    var match=matchLocation(location);
    if(match){lng=match.lng;
      document.getElementById('s-truesolar').style.display='block';
      document.getElementById('s-truesolar').textContent='已匹配: '+match.name+' (经度 '+lng.toFixed(2)+'°E)';
    }
  }

  // 直接调用服务器API（端口3211）
  var params='year='+year+'&month='+month+'&day='+day+'&hour='+hour+'&minute='+minute+'&gender='+gender+'&isSolar=true'+(lng&&lng!==120?'&longitude='+lng:'');

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
    showError('排盘失败: '+e.message+'\\n请确认服务已启动: node chart-server.js');
  });
}`;

// 用新函数替换第二个 getChart
const beforeSecond = html.substring(0, secondGetChart);
// 找第二个 getChart 的结束位置（下一个顶层函数之前）
let endPos = html.indexOf('\nfunction ', secondGetChart + 10);
if (endPos === -1) endPos = html.indexOf('\nconst ', secondGetChart + 10);
if (endPos === -1) endPos = html.indexOf('\nvar ', secondGetChart + 10);
if (endPos === -1) endPos = secondGetChart + 5000;

const afterSecond = html.substring(endPos);

// 组装新文件
let newHtml = beforeSecond + newGetChart + afterSecond;

// 验证替换成功
if (newHtml === html) {
    console.log('ERROR: 替换没有生效');
    process.exit(1);
}

// 验证不再有 "内嵌引擎" 的调用
if (newHtml.indexOf('window.Ziwei.computeChart') !== -1) {
    console.log('WARNING: window.Ziwei.computeChart 仍然存在于文件中');
}

// 备份
fs.writeFileSync(filePath + '.bak2', html);
console.log('备份已保存到: ' + filePath + '.bak2');

// 写入
fs.writeFileSync(filePath, newHtml, 'utf8');
console.log('修复完成！');
console.log('文件大小:', fs.statSync(filePath).size, 'bytes');
