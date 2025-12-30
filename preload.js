const { contextBridge, ipcRenderer } = require('electron');

// 暴露 IPC API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 代理请求（AI 模型调用）
  proxy: (data) => ipcRenderer.invoke('api:proxy', data),
  
  // 翻译请求
  translate: (data) => ipcRenderer.invoke('api:translate', data),
  
  // 生成图片
  generateImage: (data) => ipcRenderer.invoke('api:generate-image', data),
});

