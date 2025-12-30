# IPC 通信调试指南

## 问题：生成提示词时出现 "Failed to fetch" 错误

### 可能的原因

1. **preload.js 未正确加载**
   - `window.electron` 未定义
   - preload 脚本路径错误

2. **IPC 处理器未注册**
   - `electron-ipc.js` 未正确加载
   - IPC 处理器注册失败

3. **路径问题**
   - 打包后文件路径不正确
   - asar 归档中的路径问题

## 调试步骤

### 1. 打开开发者工具

在 `electron-main.js` 中，我已经添加了开发者工具支持。你可以：

**方法 1：使用环境变量**
```bash
# Windows PowerShell
$env:ELECTRON_OPEN_DEVTOOLS="1"; npm run electron:pack

# 或者在打包后的应用中，修改 electron-main.js 临时启用
```

**方法 2：临时修改代码**
在 `electron-main.js` 的 `createWindow()` 函数中，找到：
```javascript
if (process.env.ELECTRON_OPEN_DEVTOOLS === '1' || !app.isPackaged) {
  win.webContents.openDevTools();
}
```
临时改为：
```javascript
win.webContents.openDevTools(); // 总是打开
```

### 2. 检查控制台输出

打开应用后，查看控制台（Console）标签：

1. **检查 preload 加载**
   - 应该看到：`Preload file found at: ...`
   - 如果看到：`Preload file not found!`，说明路径有问题

2. **检查 window.electron**
   - 应该看到：`window.electron available: true`
   - 如果看到：`ERROR: window.electron is not defined!`，说明 preload 未正确执行

3. **检查 IPC 调用**
   - 点击生成按钮后，查看是否有错误信息
   - 查看 Network 标签（虽然 IPC 不会显示在这里）

### 3. 检查文件结构

打包后，检查以下文件是否存在：

```
resources/
  app.asar (或 app/)
    ├── preload.js          ← 必须存在
    ├── electron-main.js    ← 必须存在
    ├── electron-ipc.js     ← 必须存在
    └── out/
        └── index.html
```

### 4. 验证 IPC 处理器

在 Electron 主进程控制台（启动应用时的终端窗口）中，应该看到：
- `Preload file found at: ...`
- 没有 IPC 相关的错误

### 5. 手动测试 IPC

在渲染进程的开发者工具控制台中，运行：

```javascript
// 检查 window.electron 是否存在
console.log('electron:', window.electron);

// 测试 IPC 调用
if (window.electron) {
  window.electron.proxy({
    model: 'gemini-2.5-flash',
    apiKey: 'test',
    messages: [{ role: 'user', content: 'test' }]
  }).then(result => {
    console.log('IPC test result:', result);
  }).catch(err => {
    console.error('IPC test error:', err);
  });
}
```

## 常见问题解决

### 问题 1: preload.js 找不到

**解决方案：**
1. 确认 `package.json` 的 `files` 配置包含 `preload.js`
2. 检查 `electron-main.js` 中的路径逻辑
3. 尝试使用绝对路径

### 问题 2: window.electron 未定义

**可能原因：**
- preload.js 执行失败
- contextBridge 调用失败
- 页面在 preload 完成前就尝试访问 window.electron

**解决方案：**
1. 检查 preload.js 是否有语法错误
2. 在页面加载完成后才访问 window.electron
3. 添加延迟检查

### 问题 3: IPC 调用返回错误

**检查：**
1. 主进程控制台是否有错误
2. `electron-ipc.js` 是否正确加载
3. IPC 处理器是否正确注册

## 临时修复

如果问题持续，可以临时添加更详细的错误处理：

在 `app/page.tsx` 中，我已经添加了更好的错误处理。如果仍然失败，可以：

1. 检查错误消息的详细信息
2. 查看 Electron 主进程的控制台输出
3. 检查网络请求（虽然 IPC 不会显示在 Network 标签）

## 生产环境

调试完成后，记得：
1. 移除或禁用开发者工具的自动打开
2. 移除调试日志
3. 确保错误消息对用户友好

