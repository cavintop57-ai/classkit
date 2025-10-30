const { contextBridge, ipcRenderer } = require('electron');

// 안전하게 renderer에 API 노출
contextBridge.exposeInMainWorld('electron', {
  onToggleMode: (callback) => {
    ipcRenderer.on('toggle-mode', (event, type) => callback(type));
  }
});



