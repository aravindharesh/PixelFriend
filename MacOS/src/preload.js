const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pixelFriend', {
  getState: () => ipcRenderer.invoke('get-state'),
  save: value => ipcRenderer.invoke('save-settings', value),
  action: value => ipcRenderer.send('action', value),
  onState: callback => ipcRenderer.on('state', (_, value) => callback(value)),
  onReminder: callback => ipcRenderer.on('reminder', (_, value) => callback(value))
});
