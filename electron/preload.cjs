const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("wageclawDesktop", {
  focusScreen: (screen) => ipcRenderer.invoke("wageclaw:focus-screen", screen),
  openMainPanel: () => ipcRenderer.invoke("wageclaw:open-main-panel"),
  togglePet: (enabled) => ipcRenderer.invoke("wageclaw:toggle-pet", enabled),
  closeMainWindow: () => ipcRenderer.send("wageclaw:close-main-window"),
   minimizeMainWindow: () => ipcRenderer.send("wageclaw:minimize-main-window"),
   maximizeMainWindow: () => ipcRenderer.send("wageclaw:maximize-main-window"),
  petCommand: (payload) => ipcRenderer.invoke("wageclaw:pet-command", payload),
  triggerBlackout: (payload) => ipcRenderer.invoke("wageclaw:trigger-blackout", payload),
  petRicochet: () => ipcRenderer.invoke("wageclaw:pet-ricochet"),
  petStorm: () => ipcRenderer.invoke("wageclaw:pet-storm"),
  petNuke: () => ipcRenderer.invoke("wageclaw:pet-nuke"),
  petResize: (width, height) => ipcRenderer.invoke("wageclaw:pet-resize", { width, height }),
  showPet: () => ipcRenderer.invoke("wageclaw:show-pet"),
  petDragStart: () => {},
  petDragMove: (dx, dy) => ipcRenderer.send("wageclaw:pet-drag", { dx, dy }),
  petDragEnd: () => {},
  petHitTest: (interactive) => ipcRenderer.send("wageclaw:pet-hit-test", Boolean(interactive)),
  onNavigate: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on("wageclaw:navigate", listener);
    return () => ipcRenderer.removeListener("wageclaw:navigate", listener);
  },
  onPetCommand: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on("wageclaw:pet-command", listener);
    return () => ipcRenderer.removeListener("wageclaw:pet-command", listener);
  },
  onMainVisibility: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on("wageclaw:main-visibility", listener);
    return () => ipcRenderer.removeListener("wageclaw:main-visibility", listener);
  }
});
