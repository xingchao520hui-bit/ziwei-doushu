$FILE_PATH = "C:\Users\LENOVO\Desktop\项目\ZIWEI-~1\ZIWEI-~2\ziwei-metis-unified.html"
$bytes = [IO.File]::ReadAllBytes($FILE_PATH)
$encoding = New-Object System.Text.UTF8Encoding $false
$content = $encoding.GetString($bytes)
$ORIG_LEN = $content.Length
Write-Output "Read: $ORIG_LEN bytes"

# Fix 1: Tab bar
$oldTB = "<button class=`"tab-btn active`" data-tab=`"single`" onclick=`"switchTab('single')`">单人起盘</button>`n  <button class=`"tab-btn`" data-tab=`"hepan`" onclick=`"switchTab('hepan')`">双人合盘</button>"
$newTB = "<button class=`"tab-btn active`" data-tab=`"single`" onclick=`"switchTab('single')`">单人起盘</button>`n<button class=`"tab-btn`" data-tab=`"hepan`" onclick=`"switchTab('hepan')`">双人合盘</button>`n<button class=`"tab-btn`" data-tab=`"account`" onclick=`"switchTab('account')`">账户</button>"
if($content.Contains($oldTB)) {
    $content = $content.Replace($oldTB, $newTB)
    Write-Output "[OK] Fix 1"
} else {
    Write-Output "[ERR] Fix 1"
    exit 1
}

# Fix 2: switchTab
$oldST = "function switchTab(tab){`n  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});`n  document.getElementById('tab-single').style.display=tab==='single'?'block':'none';`n  document.getElementById('tab-hepan').style.display=tab==='hepan'?'block':'none';`n}"
$newST = "function switchTab(tab){`n  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});`n  document.getElementById('tab-single').style.display=tab==='single'?'block':'none';`n  document.getElementById('tab-hepan').style.display=tab==='hepan'?'block':'none';`n  var acc=document.getElementById('tab-account');`n  if(acc){acc.style.display=tab==='account'?'block':'none';}`n  if(tab==='account'){updateVipStatusUI&&updateVipStatusUI();}`n}"
if($content.Contains($oldST)) {
    $content = $content.Replace($oldST, $newST)
    Write-Output "[OK] Fix 2"
} else {
    Write-Output "[ERR] Fix 2"
    exit 1
}

# Fix 3: tab-account div
$NL = [char]10
$closeIdx = $content.IndexOf("</div>$NL$NL<script>")
if($closeIdx -lt 0) {
    Write-Output "[ERR] Fix 3: close pattern not found"
    exit 1
}
$insIdx = $closeIdx + 6

# Build account tab with proper UTF-8 encoding (avoid here-strings)
$at = [char]10 + [char]10 + "<!-- Tab 3: Account / Pricing -->
<div id=`"tab-account`" style=`"display:none;background:#FFFBF5;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;padding:48px 20px 60px`">
  <div style=`"max-width:720px;margin:0 auto`">
    <div style=`"text-align:center;margin-bottom:40px`">
      <div style=`"font-family:'Songti SC','Noto Serif CJK SC','SimSun',serif;font-size:32px;font-weight:700;color:#1C1C1C`">QClaw <span style=`"color:#5A8F7B`">紫微斗数</span></div>
      <div style=`"margin-top:8px;font-size:15px;color:#999`">缘分天定，命盘自知</div>
    </div>
    <h2 style=`"text-align:center;font-size:22px;font-weight:700;color:#1C1C1C;margin-bottom:8px`">选择适合您的版本</h2>
    <p style=`"text-align:center;color:#999;font-size:14px;margin-bottom:36px`">免费体验基础功能，专业版解锁完整分析</p>
    <div style=`"display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-bottom:48px`">

      <div style=`"background:#FFF;border:1px solid #EDE8DD;border-radius:16px;padding:32px 28px;width:300px;box-shadow:0 2px 8px rgba(0,0,0,0.04)`">
        <div style=`"font-size:14px;font-weight:600;color:#666;margin-bottom:12px`">免费版</div>
        <div style=`"font-size:36px;font-weight:700;color:#1C1C1C;margin-bottom:4px`">¥0</div>
        <div style=`"font-size:13px;color:#999;margin-bottom:24px`">永久免费</div>
        <ul style=`"list-style:none;padding:0;margin:0 0 28px 0`">
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 单人造盘（基础版）</li>
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 十二宫星曜速览</li>
          <li style=`"padding:7px 0;font-size:13px;color:#BBB`">— 深层分析解读</li>
          <li style=`"padding:7px 0;font-size:13px;color:#BBB`">— 大限流年分析</li>
          <li style=`"padding:7px 0;font-size:13px;color:#BBB`">— 双人合盘分析</li>
        </ul>
        <button onclick=`"switchTab('single')`" style=`"width:100%;padding:12px;border:1px solid #EDE8DD;border-radius:10px;background:#FFF;color:#666;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit`">免费体验</button>
      </div>

      <div style=`"background:#FFF;border:2px solid #C9A84C;border-radius:16px;padding:32px 28px;width:300px;box-shadow:0 4px 24px rgba(201,168,76,0.15);position:relative`">
        <div style=`"position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#C9A84C,#E8C84A);color:#FFF;font-size:12px;font-weight:700;padding:4px 16px;border-radius:999px;white-space:nowrap`">限时优惠</div>
        <div style=`"font-size:14px;font-weight:600;color:#C9A84C;margin-bottom:12px;margin-top:8px`">专业版</div>
        <div style=`"font-size:36px;font-weight:700;color:#1C1C1C;margin-bottom:4px`">¥148 <span style=`"font-size:14px;font-weight:400;color:#999`">/ 年</span></div>
        <div style=`"font-size:13px;color:#999;margin-bottom:24px`">解锁全部高级功能</div>
        <ul style=`"list-style:none;padding:0;margin:0 0 28px 0`">
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 单人造盘（完整版）</li>
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 十二宫深层分析解读</li>
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 大限流年详细解读</li>
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 姻缘财运专项分析</li>
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 健康预警提示</li>
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 前世因果解读</li>
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 双人合盘分析</li>
          <li style=`"padding:7px 0;font-size:13px;color:#666`">✓ 综合建议与开运指南</li>
        </ul>
        <button onclick=`"showVipModal()`" style=`"width:100%;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,#C9A84C,#E8C84A);color:#FFF;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.02em`">开通专业版</button>
        <p style=`"text-align:center;font-size:11px;color:#C9A84C;margin-top:10px`">有效期1年 内含3次免费解读</p>
      </div>

    </div>

    <div id=`"vipStatusBox`" style=`"display:none;background:#FFF;border:2px solid #C9A84C;border-radius:16px;padding:28px;max-width:500px;margin:0 auto;text-align:center`">
      <div style=`"font-size:40px;margin-bottom:8px`">👑</div>
      <h3 style=`"font-size:18px;font-weight:700;color:#1C1C1C;margin-bottom:6px`">专业版已开通</h3>
      <p style=`"font-size:13px;color:#666;margin-bottom:4px`">您已是专业版用户</p>
      <p style=`"font-size:12px;color:#999`" id=`"vipExpireText`"></p>
      <button onclick=`"switchTab('single')`" style=`"margin-top:16px;padding:10px 28px;border:1px solid #EDE8DD;border-radius:10px;background:#FFF;color:#666;font-size:14px;cursor:pointer;font-family:inherit`">去排盘</button>
    </div>

    <div style=`"background:#FFF;border:1px solid #EDE8DD;border-radius:16px;padding:28px;max-width:500px;margin:0 auto`">
      <h3 style=`"font-size:16px;font-weight:700;color:#1C1C1C;margin-bottom:16px;text-align:center`">如何开通专业版？</h3>
      <ol style=`"padding-left:20px;margin:0;font-size:13px;color:#666;line-height:2`">
        <li>点击上方「开通专业版」按钮</li>
        <li>微信 / 支付宝扫码支付 ¥148</li>
        <li>截图联系客服获取解锁码</li>
        <li>在弹窗中输入解锁码即可使用</li>
      </ol>
      <div style=`"margin-top:16px;padding-top:16px;border-top:1px solid #EDE8DD;text-align:center`">
        <p style=`"font-size:12px;color:#999;margin-bottom:8px`">遇到问题？</p>
        <a href=`"javascript:void(0)`" onclick=`"showVipModal()`" style=`"font-size:13px;color:#5A8F7B;text-decoration:none;font-weight:600`">联系客服获取帮助 →</a>
      </div>
    </div>
  </div>
</div>
"

$content = $content.Insert($insIdx, $at)
Write-Output "[OK] Fix 3: tab-account inserted at $insIdx"

# Fix 4: Hepan JS
$hjs = @"

"@ + @'
// ===== Hepan Form Population =====
function populateHepanSelects(){
  function yr(id){var s=document.getElementById(id);if(!s)return;for(var y=2010;y>=1900;y--){var o=document.createElement('option');o.value=y;o.textContent=y;s.appendChild(o);}}
  function mo(id){var s=document.getElementById(id);if(!s)return;for(var m=1;m<=12;m++){var o=document.createElement('option');o.value=m;o.textContent=m+'月';s.appendChild(o);}}
  function dy(id){var s=document.getElementById(id);if(!s)return;for(var d=1;d<=31;d++){var o=document.createElement('option');o.value=d;o.textContent=d+'日';s.appendChild(o);}}
  function hr(id){var s=document.getElementById(id);if(!s)return;var lbs=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];for(var h=0;h<=22;h+=2){var o=document.createElement('option');o.value=h;o.textContent=h+'时 · '+lbs[h/2];s.appendChild(o);}}
  function mn(id){var s=document.getElementById(id);if(!s)return;for(var m=0;m<=59;m++){var o=document.createElement('option');o.value=m;o.textContent=(m<10?'0':'')+m+'分';s.appendChild(o);}}
  yr('yearA');mo('monthA');dy('dayA');hr('hourA');mn('minuteA');
  yr('yearB');mo('monthB');dy('dayB');hr('hourB');mn('minuteB');
}

// ===== Hepan Submit =====
function doHepanSubmit(){
  var btn=document.getElementById('hepanSubmit');
  var status=document.getElementById('hepanStatus');
  if(!btn||!status)return;
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span>分析中...';
  status.className='hepan-status show';status.textContent='正在读取甲方命盘...';
  function err(msg){status.textContent=msg;status.className='hepan-status show error';btn.disabled=false;btn.textContent='开始合盘分析';}
  try{
    var yA=parseInt(document.getElementById('yearA').value)||0;
    var mA=parseInt(document.getElementById('monthA').value)||0;
    var dA=parseInt(document.getElementById('dayA').value)||0;
    var hA=parseInt(document.getElementById('hourA').value);
    var minA=parseInt(document.getElementById('minuteA').value)||0;
    var yB=parseInt(document.getElementById('yearB').value)||0;
    var mB=parseInt(document.getElementById('monthB').value)||0;
    var dB=parseInt(document.getElementById('dayB').value)||0;
    var hB=parseInt(document.getElementById('hourB').value);
    var minB=parseInt(document.getElementById('minuteB').value)||0;
    if(!yA||!mA||!dA||isNaN(hA)){err('请完善甲方出生信息');return;}
    if(!yB||!mB||!dB||isNaN(hB)){err('请完善乙方出生信息');return;}
    if(!window.Ziwei||!window.Ziwei.computeChart){err('引擎加载中，请稍后刷新重试');btn.disabled=false;btn.textContent='开始合盘分析';return;}
    status.textContent='正在计算甲方命盘...';
    var chartA=window.Ziwei.computeChart({year:yA,month:mA,day:dA,hour:hA,minute:minA,gender:'male',isSolar:true});
    status.textContent='正在读取乙方命盘...';
    var chartB=window.Ziwei.computeChart({year:yB,month:mB,day:dB,hour:hB,minute:minB,gender:'male',isSolar:true});
    status.textContent='正在分析合盘数据...';
    var hepanResult=window.Ziwei.computeHepan(chartA,chartB);
    var score=hepanResult.score||0;
    var label=score>=80?'天命难违':score>=65?'良缘佳配':score>=50?'中吉之缘':score>=35?'需多磨合':'各有天命';
    var color=score>=80?'#C9A84C':score>=65?'#5A8F7B':score>=50?'#5A8FBF':'#999';
    var sc=document.getElementById('scoreCard');
    if(sc)sc.innerHTML='<div style="text-align:center;padding:32px"><div style="font-size:14px;color:#999;margin-bottom:8px">缘分指数</div><div style="font-size:72px;font-weight:700;color:'+color+';line-height:1;margin-bottom:8px">'+score+'</div><div style="font-size:16px;color:#666;font-weight:600;margin-bottom:4px">'+label+'</div><div style="font-size:12px;color:#999">'+(hepanResult.label||'')+'</div></div>';
    var ds=document.getElementById('chartDualSection');
    if(ds){
      var dz=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      function mini(chart,ttl){
        var h='<div style="flex:1;min-width:280px"><h3 style="text-align:center;font-size:14px;color:#666;margin-bottom:12px">'+ttl+'</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px">';
        dz.forEach(function(b){
          var p=chart.palaces.find(function(x){return x.branch===b;});
          if(!p)return;
          var m=p.name==='命宫';
          h+='<div style="background:'+(m?'#FFF5F5':'#F8F5EE')+';border:'+(m?'1px solid #FECACA':'1px solid transparent')+';border-radius:7px;padding:8px 6px;min-height:80px"><div style="font-size:12px;font-weight:600;color:#333;margin-bottom:4px">'+p.name+'</div>';
          p.stars.slice(0,4).forEach(function(s){h+='<div style="font-size:11px;color:#666;line-height:1.5">'+s.name+'</div>';});
          h+='</div>';
        });
        return h+'</div></div>';
      }
      ds.innerHTML='<div style="display:flex;gap:20px;flex-wrap:wrap;margin:20px 0">'+mini(chartA,'甲方命盘')+mini(chartB,'乙方命盘')+'</div>';
    }
    var an=document.getElementById('analysisSection');
    if(an&&hepanResult.analysis){
      var html='<div style="max-width:600px;margin:0 auto;padding:20px">';
      if(hepanResult.analysis.dimensions){
        hepanResult.analysis.dimensions.forEach(function(d){
          html+='<div style="background:#FFF;border:1px solid #EDE8DD;border-radius:12px;padding:20px;margin-bottom:16px"><h4 style="font-size:15px;font-weight:700;color:#1C1C1C;margin-bottom:10px">'+d.name+'</h4><p style="font-size:13px;color:#666;line-height:1.8">'+d.desc+'</p><div style="margin-top:10px;font-size:12px;color:#999">得分: '+d.score+' / 100</div></div>';
        });
      }
      if(hepanResult.analysis.summary){
        html+='<div style="background:#FFF;border:1px solid #EDE8DD;border-radius:12px;padding:20px"><h4 style="font-size:15px;font-weight:700;color:#1C1C1C;margin-bottom:10px">综合建议</h4><p style="font-size:13px;color:#666;line-height:1.8">'+hepanResult.analysis.summary+'</p></div>';
      }
      html+='</div>';
      an.innerHTML=html;
    }
    document.getElementById('resultsSection').style.display='block';
    status.className='hepan-status';
    btn.disabled=false;btn.textContent='开始合盘分析';
    document.getElementById('resultsSection').scrollIntoView({behavior:'smooth'});
  } catch(e){ err('合盘分析失败: '+e.message);console.error(e); }
}

document.addEventListener('DOMContentLoaded',function(){
  populateHepanSelects();
  var btn=document.getElementById('hepanSubmit');
  if(btn){btn.addEventListener('click',doHepanSubmit);}
});

function updateVipStatusUI(){
  var box=document.getElementById('vipStatusBox');
  if(box){box.style.display=isVip()?'block':'none';}
}
'@

$newST2 = "function switchTab(tab){`n  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});`n  document.getElementById('tab-single').style.display=tab==='single'?'block':'none';`n  document.getElementById('tab-hepan').style.display=tab==='hepan'?'block':'none';`n  var acc=document.getElementById('tab-account');`n  if(acc){acc.style.display=tab==='account'?'block':'none';}`n  if(tab==='account'){updateVipStatusUI&&updateVipStatusUI();}`n}"
if($content.Contains($newST2)) {
    $content = $content.Replace($newST2, $newST2 + $hjs)
    Write-Output "[OK] Fix 4: Hepan JS appended"
} else {
    Write-Output "[ERR] Fix 4"
    exit 1
}

# Save
$utf8 = New-Object System.Text.UTF8Encoding $false
$bytes_out = $utf8.GetBytes($content)
[IO.File]::WriteAllBytes($FILE_PATH, $bytes_out)
Write-Output "[DONE] $($ORIG_LEN) -> $($content.Length) bytes (+$($content.Length - $ORIG_LEN))"
