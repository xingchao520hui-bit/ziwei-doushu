# ==== Fix 1: Update Tab Bar ====
$content = [IO.File]::ReadAllText("C:\Users\LENOVO\Desktop\项目\ziwei-doushu-main\ziwei-doushu-fresh\ziwei-metis-unified.html")

$oldTabBar = @'
<button class="tab-btn active" data-tab="single" onclick="switchTab('single')">单人起盘</button>
  <button class="tab-btn" data-tab="hepan" onclick="switchTab('hepan')">双人合盘</button>
'@

$newTabBar = @'
<button class="tab-btn active" data-tab="single" onclick="switchTab('single')">单人起盘</button>
<button class="tab-btn" data-tab="hepan" onclick="switchTab('hepan')">双人合盘</button>
<button class="tab-btn" data-tab="account" onclick="switchTab('account')">账户</button>
'@

$content = $content.Replace($oldTabBar, $newTabBar)

# ==== Fix 2: Update switchTab function ====
$oldSwitchTab = @'
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});
  document.getElementById('tab-single').style.display=tab==='single'?'block':'none';
  document.getElementById('tab-hepan').style.display=tab==='hepan'?'block':'none';
}
'@

$newSwitchTab = @'
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});
  document.getElementById('tab-single').style.display=tab==='single'?'block':'none';
  document.getElementById('tab-hepan').style.display=tab==='hepan'?'block':'none';
  document.getElementById('tab-account').style.display=tab==='account'?'block':'none';
}
'@

$content = $content.Replace($oldSwitchTab, $newSwitchTab)

# ==== Fix 3: Add tab-account div (after tab-hepan close, before scripts) ====
# Find the </div> that closes tab-hepan (followed by <script>)
$pattern = '(\</div>\s*\r?\n<script>\s*\(\(\)\=\>\{[\s\S]*?if\(window\.Ziwei\)return;)'
$match = [regex]::Match($content, $pattern)
if($match.Success) {
    $insertPos = $match.Index + $match.Length
    $accountTabHTML = @'


<!-- Tab 3: Account / Pricing -->
<div id="tab-account" style="display:none;background:#FFFBF5;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;padding:48px 20px 60px">
  <div style="max-width:720px;margin:0 auto">
    <div style="text-align:center;margin-bottom:40px">
      <div style="font-family:'Songti SC','Noto Serif CJK SC','SimSun',serif;font-size:32px;font-weight:700;color:#1C1C1C">QClaw <span style="color:#5A8F7B">紫微斗数</span></div>
      <div style="margin-top:8px;font-size:15px;color:#999">缘分天定，命盘自知</div>
    </div>

    <h2 style="text-align:center;font-size:22px;font-weight:700;color:#1C1C1C;margin-bottom:8px">选择适合您的版本</h2>
    <p style="text-align:center;color:#999;font-size:14px;margin-bottom:36px">免费体验基础功能，专业版解锁完整分析</p>

    <!-- Pricing Cards -->
    <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-bottom:48px">

      <!-- Free Plan -->
      <div style="background:#FFF;border:1px solid #EDE8DD;border-radius:16px;padding:32px 28px;width:300px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">
        <div style="font-size:14px;font-weight:600;color:#666;margin-bottom:12px">免费版</div>
        <div style="font-size:36px;font-weight:700;color:#1C1C1C;margin-bottom:4px">¥0</div>
        <div style="font-size:13px;color:#999;margin-bottom:24px">永久免费</div>
        <ul style="list-style:none;padding:0;margin:0 0 28px 0">
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>单人造盘（基础版）</li>
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>十二宫星曜速览</li>
          <li style="padding:7px 0;font-size:13px;color:#999;display:flex;align-items:center;gap:8px"><span style="color:#CCC">−</span>深层分析解读</li>
          <li style="padding:7px 0;font-size:13px;color:#999;display:flex;align-items:center;gap:8px"><span style="color:#CCC">−</span>大限流年分析</li>
          <li style="padding:7px 0;font-size:13px;color:#999;display:flex;align-items:center;gap:8px"><span style="color:#CCC">−</span>姻缘财运专项</li>
          <li style="padding:7px 0;font-size:13px;color:#999;display:flex;align-items:center;gap:8px"><span style="color:#CCC">−</span>健康预警提示</li>
          <li style="padding:7px 0;font-size:13px;color:#999;display:flex;align-items:center;gap:8px"><span style="color:#CCC">−</span>双人合盘分析</li>
        </ul>
        <button onclick="switchTab('single')" style="width:100%;padding:12px;border:1px solid #EDE8DD;border-radius:10px;background:#FFF;color:#666;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">免费体验</button>
      </div>

      <!-- Pro Plan -->
      <div style="background:#FFF;border:2px solid #C9A84C;border-radius:16px;padding:32px 28px;width:300px;box-shadow:0 4px 24px rgba(201,168,76,0.15);position:relative">
        <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#C9A84C,#E8C84A);color:#FFF;font-size:12px;font-weight:700;padding:4px 16px;border-radius:999px;white-space:nowrap">限时优惠</div>
        <div style="font-size:14px;font-weight:600;color:#C9A84C;margin-bottom:12px;margin-top:8px">专业版</div>
        <div style="font-size:36px;font-weight:700;color:#1C1C1C;margin-bottom:4px">¥148 <span style="font-size:14px;font-weight:400;color:#999">/ 年</span></div>
        <div style="font-size:13px;color:#999;margin-bottom:24px">解锁全部高级功能</div>
        <ul style="list-style:none;padding:0;margin:0 0 28px 0">
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>单人造盘（完整版）</li>
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>十二宫深层分析解读</li>
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>大限流年详细解读</li>
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>姻缘财运专项分析</li>
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>健康预警提示</li>
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>前世因果解读</li>
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>双人合盘分析</li>
          <li style="padding:7px 0;font-size:13px;color:#666;display:flex;align-items:center;gap:8px"><span style="color:#5A8F7B">✓</span>综合建议与开运指南</li>
        </ul>
        <button onclick="showVipModal()" style="width:100%;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,#C9A84C,#E8C84A);color:#FFF;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.02em">开通专业版</button>
        <p style="text-align:center;font-size:11px;color:#C9A84C;margin-top:10px">有效期 内含3次免费解读</p>
      </div>

    </div>

    <!-- VIP Status -->
    <div id="vipStatusBox" style="display:none;background:#FFF;border:2px solid #C9A84C;border-radius:16px;padding:28px;max-width:500px;margin:0 auto;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">👑</div>
      <h3 style="font-size:18px;font-weight:700;color:#1C1C1C;margin-bottom:6px">专业版已开通</h3>
      <p style="font-size:13px;color:#666;margin-bottom:4px">您已是专业版用户</p>
      <p style="font-size:12px;color:#999" id="vipExpireText"></p>
      <button onclick="switchTab('single')" style="margin-top:16px;padding:10px 28px;border:1px solid #EDE8DD;border-radius:10px;background:#FFF;color:#666;font-size:14px;cursor:pointer;font-family:inherit">去排盘</button>
    </div>

    <!-- How to unlock -->
    <div style="background:#FFF;border:1px solid #EDE8DD;border-radius:16px;padding:28px;max-width:500px;margin:0 auto">
      <h3 style="font-size:16px;font-weight:700;color:#1C1C1C;margin-bottom:16px;text-align:center">如何开通专业版？</h3>
      <ol style="padding-left:20px;margin:0;font-size:13px;color:#666;line-height:2">
        <li>点击上方「开通专业版」按钮</li>
        <li>微信 / 支付宝扫码支付 ¥148</li>
        <li>截图联系客服获取解锁码</li>
        <li>在弹窗中输入解锁码即可使用</li>
      </ol>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #EDE8DD;text-align:center">
        <p style="font-size:12px;color:#999;margin-bottom:8px">遇到问题？</p>
        <a href="javascript:void(0)" onclick="showVipModal()" style="font-size:13px;color:#5A8F7B;text-decoration:none;font-weight:600">联系客服获取帮助 →</a>
      </div>
    </div>

  </div>
</div>

'@
    $content = $content.Insert($insertPos, $accountTabHTML)
    Write-Output "[OK] Added tab-account div"
} else {
    Write-Output "[ERROR] Could not find tab-hepan close pattern"
    Write-Output $content.Substring(37990, 50)
}

# ==== Fix 4: Add Hepan form init + HepanSubmit handler to the app script ====
# Find the switchTab function in the app script (second <script> tag) and add code after it
$oldSwitchTab2 = @'
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});
  document.getElementById('tab-single').style.display=tab==='single'?'block':'none';
  document.getElementById('tab-hepan').style.display=tab==='hepan'?'block':'none';
}
'@

$newSwitchTab2 = @'
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});
  document.getElementById('tab-single').style.display=tab==='single'?'block':'none';
  document.getElementById('tab-hepan').style.display=tab==='hepan'?'block':'none';
  var acc=document.getElementById('tab-account');
  if(acc){acc.style.display=tab==='account'?'block':'none';}
  if(tab==='account'){updateVipStatusUI();}
}
'@

if($content.Contains($oldSwitchTab2)) {
    $content = $content.Replace($oldSwitchTab2, $newSwitchTab2)
    Write-Output "[OK] Updated switchTab in app script"
} else {
    Write-Output "[WARN] Did not find oldSwitchTab2 pattern in content"
}

# ==== Fix 5: Add Hepan form population and event listeners ====
# Find the end of the Toggle groups section and add Hepan init after it
$toggleEnd = @'
// ===== Toggle groups =====
document.querySelectorAll('.l-toggle').forEach(function(g){
  g.querySelectorAll('button').forEach(function(b){
    b.addEventListener('click',function(){
      g.querySelectorAll('button').forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
    });
  });
});
'@

$hepanInit = @'
// ===== Toggle groups =====
document.querySelectorAll('.l-toggle').forEach(function(g){
  g.querySelectorAll('button').forEach(function(b){
    b.addEventListener('click',function(){
      g.querySelectorAll('button').forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
    });
  });
});

// ===== Hepan Form Population =====
function populateHepanSelects(){
  var yearRange = function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    for(var y=2010;y>=1900;y--){var o=document.createElement('option');o.value=y;o.textContent=y;sel.appendChild(o);}
  };
  var monthRange = function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    for(var m=1;m<=12;m++){var o=document.createElement('option');o.value=m;o.textContent=m+'月';sel.appendChild(o);}
  };
  var dayRange = function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    for(var d=1;d<=31;d++){var o=document.createElement('option');o.value=d;o.textContent=d+'日';sel.appendChild(o);}
  };
  var hourRange = function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    var labels=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    for(var h=0;h<=22;h+=2){var o=document.createElement('option');o.value=h;o.textContent=h+'时 · '+labels[h/2];sel.appendChild(o);}
  };
  var minuteRange = function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    for(var m=0;m<=59;m++){var o=document.createElement('option');o.value=m;o.textContent=(m<10?'0':'')+m+'分';sel.appendChild(o);}
  };
  yearRange('yearA'); monthRange('monthA'); dayRange('dayA'); hourRange('hourA'); minuteRange('minuteA');
  yearRange('yearB'); monthRange('monthB'); dayRange('dayB'); hourRange('hourB'); minuteRange('minuteB');
}

// ===== Hepan Submit Handler =====
function doHepanSubmit(){
  var btn = document.getElementById('hepanSubmit');
  var status = document.getElementById('hepanStatus');
  if(!btn || !status) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>分析中...';
  status.className = 'hepan-status show';
  status.textContent = '正在读取甲方命盘...';

  var err = function(msg){
    status.textContent = msg;
    status.className = 'hepan-status show error';
    btn.disabled = false;
    btn.textContent = '开始合盘分析';
  };

  try {
    var yA = parseInt(document.getElementById('yearA').value);
    var mA = parseInt(document.getElementById('monthA').value);
    var dA = parseInt(document.getElementById('dayA').value);
    var hA = parseInt(document.getElementById('hourA').value);
    var minA = parseInt(document.getElementById('minuteA').value) || 0;
    var calA = document.querySelector('#tab-hepan [data-person="A"].active') ?
               document.querySelector('#tab-hepan [data-person="A"].active').dataset.cal : 'solar';
    var genderA = 'male';

    var yB = parseInt(document.getElementById('yearB').value);
    var mB = parseInt(document.getElementById('monthB').value);
    var dB = parseInt(document.getElementById('dayB').value);
    var hB = parseInt(document.getElementById('hourB').value);
    var minB = parseInt(document.getElementById('minuteB').value) || 0;
    var calB = document.querySelector('#tab-hepan [data-person="B"].active') ?
               document.querySelector('#tab-hepan [data-person="B"].active').dataset.cal : 'solar';
    var genderB = 'male';

    if(!yA || !mA || !dA || isNaN(hA)){ err('请完善甲方出生信息'); return; }
    if(!yB || !mB || !dB || isNaN(hB)){ err('请完善乙方出生信息'); return; }

    if(!window.Ziwei || !window.Ziwei.computeChart){
      err('引擎加载中，请稍后刷新重试'); btn.disabled=false; btn.textContent='开始合盘分析'; return;
    }

    status.textContent = '正在计算甲方命盘...';

    var chartA = window.Ziwei.computeChart({
      year: yA, month: mA, day: dA, hour: hA, minute: minA,
      gender: genderA, isSolar: calA === 'solar'
    });

    status.textContent = '正在读取乙方命盘...';
    var chartB = window.Ziwei.computeChart({
      year: yB, month: mB, day: dB, hour: hB, minute: minB,
      gender: genderB, isSolar: calB === 'solar'
    });

    status.textContent = '正在分析合盘数据...';
    var hepanResult = window.Ziwei.computeHepan(chartA, chartB);

    status.textContent = '正在渲染结果...';

    // Render score card
    var scoreCard = document.getElementById('scoreCard');
    if(scoreCard) {
      var score = hepanResult.score || 0;
      var label = score >= 80 ? '天命难违' : score >= 65 ? '良缘佳配' : score >= 50 ? '中吉之缘' : score >= 35 ? '需多磨合' : '各有天命';
      var color = score >= 80 ? '#C9A84C' : score >= 65 ? '#5A8F7B' : score >= 50 ? '#5A8FBF' : '#999';
      scoreCard.innerHTML = '<div style="text-align:center;padding:32px">' +
        '<div style="font-size:14px;color:#999;margin-bottom:8px">缘分指数</div>' +
        '<div style="font-size:72px;font-weight:700;color:'+color+';line-height:1;margin-bottom:8px">'+score+'</div>' +
        '<div style="font-size:16px;color:#666;font-weight:600;margin-bottom:4px">'+label+'</div>' +
        '<div style="font-size:12px;color:#999">'+hepanResult.label+'</div></div>';
    }

    // Render dual charts (simple)
    var dualSection = document.getElementById('chartDualSection');
    if(dualSection){
      var dzOrder=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      var renderMini = function(chart, label){
        var h='<div style="flex:1;min-width:280px"><h3 style="text-align:center;font-size:14px;color:#666;margin-bottom:12px">'+label+'</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px">';
        dzOrder.forEach(function(dz){
          var p = chart.palaces.find(function(x){return x.branch===dz;});
          if(!p) return;
          var isMing = p.name==='命宫';
          h += '<div style="background:'+(isMing?'#FFF5F5':'#F8F5EE')+';border:'+(isMing?'1px solid #FECACA':'1px solid transparent')+';border-radius:7px;padding:8px 6px;min-height:80px">' +
            '<div style="font-size:12px;font-weight:600;color:#333;margin-bottom:4px">'+p.name+'</div>';
          p.stars.slice(0,4).forEach(function(s){
            h += '<div style="font-size:11px;color:#666;line-height:1.5">'+s.name+'</div>';
          });
          h += '</div>';
        });
        h += '</div></div>';
        return h;
      };
      dualSection.innerHTML = '<div style="display:flex;gap:20px;flex-wrap:wrap;margin:20px 0">'+renderMini(chartA,'甲方命盘')+renderMini(chartB,'乙方命盘')+'</div>';
    }

    // Render analysis
    var analysisSection = document.getElementById('analysisSection');
    if(analysisSection && hepanResult.analysis){
      var html = '<div style="max-width:600px;margin:0 auto;padding:20px">';
      if(hepanResult.analysis.dimensions){
        hepanResult.analysis.dimensions.forEach(function(dim){
          html += '<div style="background:#FFF;border:1px solid #EDE8DD;border-radius:12px;padding:20px;margin-bottom:16px">' +
            '<h4 style="font-size:15px;font-weight:700;color:#1C1C1C;margin-bottom:10px">'+dim.name+'</h4>' +
            '<p style="font-size:13px;color:#666;line-height:1.8">'+dim.desc+'</p>' +
            '<div style="margin-top:10px;font-size:12px;color:#999">得分: '+dim.score+' / 100</div></div>';
        });
      }
      if(hepanResult.analysis.summary){
        html += '<div style="background:#FFF;border:1px solid #EDE8DD;border-radius:12px;padding:20px;margin-bottom:16px">' +
          '<h4 style="font-size:15px;font-weight:700;color:#1C1C1C;margin-bottom:10px">综合建议</h4>' +
          '<p style="font-size:13px;color:#666;line-height:1.8">'+hepanResult.analysis.summary+'</p></div>';
      }
      html += '</div>';
      analysisSection.innerHTML = html;
    }

    document.getElementById('resultsSection').style.display='block';
    status.className = 'hepan-status';
    btn.disabled = false;
    btn.innerHTML = '开始合盘分析';
    document.getElementById('resultsSection').scrollIntoView({behavior:'smooth'});

  } catch(e) {
    err('合盘分析失败: ' + e.message);
    console.error(e);
  }
}

// Wire up hepanSubmit button
document.addEventListener('DOMContentLoaded', function(){
  populateHepanSelects();
  var btn = document.getElementById('hepanSubmit');
  if(btn){ btn.addEventListener('click', doHepanSubmit); }
});

// ===== VIP Status UI updater =====
function updateVipStatusUI(){
  var box = document.getElementById('vipStatusBox');
  if(!box) return;
  if(isVip()){
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}
'@

if($content.Contains($toggleEnd)) {
    $content = $content.Replace($toggleEnd, $hepanInit)
    Write-Output "[OK] Added Hepan form population and event listeners"
} else {
    Write-Output "[WARN] Could not find toggleEnd pattern, trying alternate..."
    # Try without trailing semicolons/newlines
    $altPattern = "document.querySelectorAll('.l-toggle').forEach"
    $altIdx = $content.IndexOf($altPattern)
    Write-Output "l-toggle at: $altIdx"
}

# Save
$content | [IO.File]::WriteAllText("C:\Users\LENOVO\Desktop\项目\ziwei-doushu-main\ziwei-doushu-fresh\ziwei-metis-unified.html", [Text.Encoding]::UTF8)
Write-Output "[DONE] File saved"
Write-Output "Final length: $($content.Length)"
