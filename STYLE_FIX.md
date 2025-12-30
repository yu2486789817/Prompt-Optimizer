# 样式修复说明

## 问题
打包后的应用样式完全丢失，这是因为 Next.js 静态导出时资源路径使用了绝对路径（`/_next/static/...`），在 Electron 的 `file://` 协议下无法正确加载。

## 解决方案

### 1. 已修复的配置
在 `next.config.js` 中添加了：
```javascript
assetPrefix: './',
basePath: '',
```
这会让 Next.js 使用相对路径生成资源链接。

### 2. 重新构建步骤

**重要：** 需要重新构建才能生效！

```bash
# 1. 清理旧的构建文件
rm -rf out
# Windows PowerShell:
Remove-Item -Recurse -Force out

# 2. 重新构建 Next.js 静态文件
npm run build:next

# 3. 重新打包 Electron 应用
npm run electron:pack
```

### 3. 验证修复

构建完成后，检查 `out/index.html` 文件：
- CSS 链接应该是：`href="./_next/static/css/..."`（相对路径）
- JS 链接应该是：`src="./_next/static/chunks/..."`（相对路径）

如果看到 `href="/_next/..."`（绝对路径），说明配置没有生效，需要检查 `next.config.js`。

### 4. 如果问题仍然存在

如果重新构建后样式仍然有问题，请检查：

1. **Electron 开发者工具**：
   - 在 `electron-main.js` 中添加 `win.webContents.openDevTools()` 来打开开发者工具
   - 查看 Console 和 Network 标签，看是否有资源加载错误

2. **路径问题**：
   - 确认 `out` 目录在打包后的正确位置
   - 检查 `electron-main.js` 中的 `getAppRoot()` 函数是否正确

3. **CSP 问题**：
   - 如果使用了 Content Security Policy，可能需要调整策略以允许加载本地资源

## 临时调试方法

在 `electron-main.js` 的 `createWindow()` 函数中添加：

```javascript
// 开发模式下打开开发者工具
if (!app.isPackaged) {
  win.webContents.openDevTools();
}
```

这样可以查看控制台错误和网络请求。

