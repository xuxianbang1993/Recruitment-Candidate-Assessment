const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  showConfirm: (message) => ipcRenderer.invoke('show-confirm-dialog', message),
})
