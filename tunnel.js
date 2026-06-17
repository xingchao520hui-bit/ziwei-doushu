// 内网穿透脚本 - 使用 cloudflared（Cloudflare Tunnel）
// 如果 cloudflared 不可用，改用 localtunnel API 直连

const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 3211;

// 方案1: 尝试用 cloudflared（Cloudflare免费隧道）
function tryCloudflared() {
  const cfPath = path.join(__dirname, 'cloudflared.exe');
  if (fs.existsSync(cfPath)) {
    console.log('[*] 找到 cloudflared，启动隧道...');
    startCloudflared(cfPath);
    return true;
  }
  
  // 尝试下载 cloudflared
  console.log('[*] 正在下载 cloudflared...');
  try {
    const url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
    execSync(`curl -L -o "${cfPath}" "${url}"`, { timeout: 60000 });
    if (fs.existsSync(cfPath)) {
      console.log('[+] 下载完成！');
      startCloudflared(cfPath);
      return true;
    }
  } catch (e) {
    console.log('[!] cloudflared 下载失败:', e.message);
  }
  return false;
}

function startCloudflared(cfPath) {
  const proc = spawn(cfPath, ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: 'inherit'
  });
  proc.on('error', (e) => console.log('[!] 启动失败:', e.message));
}

// 方案2: 使用 bore.pub（Rust写的免费内网穿透，无需注册）
function tryBore() {
  const borePath = path.join(__dirname, 'bore.exe');
  if (fs.existsSync(borePath)) {
    console.log('[*] 找到 bore，启动隧道...');
    const proc = spawn(borePath, ['local', String(PORT), '--to', 'bore.pub'], {
      stdio: 'inherit'
    });
    proc.on('error', (e) => console.log('[!] 启动失败:', e.message));
    return true;
  }
  
  console.log('[*] 正在下载 bore...');
  try {
    const url = 'https://github.com/ekzhang/bore/releases/latest/download/bore-windows-x64.exe';
    execSync(`curl -L -o "${borePath}" "${url}"`, { timeout: 60000 });
    if (fs.existsSync(borePath)) {
      console.log('[+] 下载完成！启动隧道...');
      const proc = spawn(borePath, ['local', String(PORT), '--to', 'bore.pub'], {
        stdio: 'inherit'
      });
      proc.on('error', (e) => console.log('[!] 启动失败:', e.message));
      return true;
    }
  } catch (e) {
    console.log('[!] bore 下载失败:', e.message);
  }
  return false;
}

// 方案3: 使用 npx localtunnel（需要npm）
function tryLocaltunnel() {
  console.log('[*] 尝试 npx localtunnel...');
  try {
    const proc = spawn('npx', ['localtunnel', '--port', String(PORT)], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    proc.on('error', (e) => console.log('[!] 启动失败:', e.message));
    return true;
  } catch (e) {
    console.log('[!] localtunnel 启动失败:', e.message);
    return false;
  }
}

// 按优先级尝试
console.log(`[*] 目标：将 localhost:${PORT} 暴露到公网`);
console.log('[*] 正在尝试可用的内网穿透方案...\n');

if (!tryCloudflared()) {
  if (!tryBore()) {
    if (!tryLocaltunnel()) {
      console.log('\n[!] 所有方案都失败了。请手动安装以下任一工具：');
      console.log('    1. cloudflared: https://github.com/cloudflare/cloudflared/releases');
      console.log('    2. bore: https://github.com/ekzhang/bore/releases');
      console.log('    3. 或者运行: npm install -g localtunnel && lt --port 3211');
    }
  }
}
