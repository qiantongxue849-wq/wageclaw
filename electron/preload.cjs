const { contextBridge, ipcRenderer } = require('electron');
const subscribe = (channel, callback) => {
  const listener = (_, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};
contextBridge.exposeInMainWorld('wageclawLite', {
  bootstrap: payload => ipcRenderer.invoke('pet:bootstrap', payload),
  getSnapshot: () => ipcRenderer.invoke('pet:get'),
  saveSettings: settings => ipcRenderer.invoke('pet:save', settings),
  resetSettings: () => ipcRenderer.invoke('pet:reset'),
  importBackup: () => ipcRenderer.invoke('pet:import'),
  onSnapshot: callback => subscribe('pet:snapshot', callback),
  openMain: screen => ipcRenderer.invoke('lite:open-main', screen),
  windowControls: process.platform === 'win32',
  getWindowState: () => ipcRenderer.invoke('lite:window-state'),
  windowAction: action => ipcRenderer.invoke('lite:window-action', action),
  onWindowState: callback => subscribe('lite:window-state', callback),
  quiet: mode => ipcRenderer.invoke('pet:quiet', mode),
  interact: action => ipcRenderer.invoke('pet:interact', action),
  setPetBond: (bondDate, bondCount) => ipcRenderer.invoke('pet:bond', { bondDate, bondCount }),
  report: topic => ipcRenderer.invoke('pet:manual', topic),
  dismiss: () => ipcRenderer.invoke('pet:dismiss'),
  hoverBubble: hovered => ipcRenderer.invoke('pet:hover', hovered),
  hoverCard: (show, delay) => ipcRenderer.invoke('pet:hovercard', { show: show !== false, delay }),
  fitPopup: size => ipcRenderer.invoke('pet:fit-popup', size),
  panelBusy: busy => ipcRenderer.invoke('pet:busy', busy),
  petMenu: () => ipcRenderer.invoke('pet:menu'),
  hitTest: interactive => ipcRenderer.invoke('pet:hit', interactive),
  drag: payload => ipcRenderer.send('pet:drag', payload),
  onAnimate: callback => subscribe('pet:animate', callback),
  onPaused: callback => subscribe('pet:paused', callback),
  onNavigate: callback => subscribe('lite:navigate', callback),
  exportBackup: () => ipcRenderer.invoke('lite:export'),
  getUpdateState: () => ipcRenderer.invoke('lite:update-state'),
  checkForUpdates: () => ipcRenderer.invoke('lite:update-check'),
  installUpdate: () => ipcRenderer.invoke('lite:update-install'),
  onUpdate: callback => subscribe('lite:update', callback)
});
