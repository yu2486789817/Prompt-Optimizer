const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { setupIpcHandlers } = require('./electron-ipc');

const isDev = process.env.NEXT_ELECTRON_DEV === '1';
const nextPort = process.env.PORT || 3000;
const nextUrl = `http://localhost:${nextPort}`;
let nextProcess;

function getAppRoot() {
  // In dev, use repo root; in packaged mode, app code lives under resources.
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname);
}

function startNextServer() {
  const appRoot = getAppRoot();
  const nextBin =
    process.platform === 'win32'
      ? path.join(appRoot, 'node_modules', '.bin', 'next.cmd')
      : path.join(appRoot, 'node_modules', '.bin', 'next');
  const script = isDev ? 'dev' : 'start';

  try {
    nextProcess = spawn(nextBin, [script, '-p', String(nextPort)], {
      cwd: appRoot,
      env: { ...process.env, PORT: String(nextPort) },
      stdio: 'inherit',
      shell: process.platform === 'win32' // helps with spaces in paths
    });
  } catch (err) {
    console.error('Failed to spawn Next.js process', err);
    throw err;
  }

  nextProcess.on('error', err => {
    console.error('Next.js process error', err);
    if (!app.isQuiting) {
      app.quit();
    }
  });

  nextProcess.on('exit', () => {
    if (!app.isQuiting) {
      app.quit();
    }
  });
}

function waitForNextReady(retries = 60, intervalMs = 300) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts += 1;
      const req = http.get(nextUrl, res => {
        res.destroy();
        resolve();
      });
      req.on('error', () => {
        if (attempts >= retries) {
          reject(new Error('Next.js server did not start in time'));
          return;
        }
        setTimeout(check, intervalMs);
      });
    };
    check();
  });
}

function createWindow() {
  const appRoot = getAppRoot();
  
  // 在打包模式下，preload.js 在 asar 中，路径需要特殊处理
  let preloadPath;
  if (app.isPackaged) {
    // 打包后，preload.js 在 resources/app.asar 或 resources/app 中
    // 尝试多个可能的路径
    const possiblePaths = [
      path.join(appRoot, 'preload.js'),
      path.join(process.resourcesPath, 'app', 'preload.js'),
      path.join(__dirname, 'preload.js')
    ];
    
    const fs = require('fs');
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        preloadPath = possiblePath;
        console.log('Preload file found at:', preloadPath);
        break;
      }
    }
    
    if (!preloadPath) {
      console.error('Preload file not found! Tried paths:', possiblePaths);
      console.error('App root:', appRoot);
      console.error('Resources path:', process.resourcesPath);
      console.error('__dirname:', __dirname);
      // 使用第一个路径作为后备
      preloadPath = possiblePaths[0];
    }
  } else {
    // 开发模式
    preloadPath = path.join(__dirname, 'preload.js');
    console.log('Preload file (dev):', preloadPath);
  }
  
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      // 允许在开发模式下打开开发者工具
      webSecurity: true
    }
  });
  
  // 临时：在打包模式下也打开开发者工具以便调试（生产环境可以移除）
  // 可以通过环境变量控制：ELECTRON_OPEN_DEVTOOLS=1
  if (process.env.ELECTRON_OPEN_DEVTOOLS === '1' || !app.isPackaged) {
    win.webContents.openDevTools();
  }
  
  // 监听页面加载完成，检查 window.electron 是否可用
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      console.log('window.electron available:', typeof window.electron !== 'undefined');
      if (typeof window.electron === 'undefined') {
        console.error('ERROR: window.electron is not defined! Preload script may not have loaded correctly.');
        alert('错误：Electron IPC 未正确加载。请检查控制台日志。');
      }
    `).catch(err => console.error('Failed to execute debug script:', err));
  });
  
  // 监听 preload 错误
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload error:', preloadPath, error);
  });

  // 在打包模式下加载静态文件，开发模式下加载开发服务器
  if (app.isPackaged) {
    // 加载静态导出的 out 目录下的 index.html
    // 在打包模式下，out 目录应该在 resources/app 下
    const indexPath = path.join(appRoot, 'out', 'index.html');
    console.log('Loading index.html from:', indexPath);
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      // 如果失败，尝试使用 __dirname
      const fallbackPath = path.join(__dirname, 'out', 'index.html');
      console.log('Trying fallback path:', fallbackPath);
      win.loadFile(fallbackPath).catch(err2 => {
        console.error('Fallback also failed:', err2);
      });
    });
  } else {
    // 开发模式：启动 Next.js 服务器并加载
    win.loadURL(nextUrl);
  }
}

async function boot() {
  // 设置 IPC 处理器
  try {
    setupIpcHandlers();
    console.log('IPC handlers setup completed');
  } catch (error) {
    console.error('Failed to setup IPC handlers:', error);
    app.quit();
    return;
  }

  // 只有在开发模式或非打包模式下才启动 Next.js 服务器
  if (!app.isPackaged) {
    try {
      startNextServer();
      await waitForNextReady().catch(err => {
        console.warn('Next.js readiness check timed out/failed', err);
        return null;
      });
    } catch (err) {
      console.error('Boot error', err);
      app.quit();
      return;
    }
  }

  createWindow();
}

app.whenReady().then(() => {
  boot();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function cleanup() {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill('SIGINT');
  }
}

app.on('before-quit', () => {
  app.isQuiting = true;
  cleanup();
});

process.on('SIGINT', () => {
  app.quit();
});

process.on('SIGTERM', () => {
  app.quit();
});

process.on('exit', () => {
  cleanup();
});
