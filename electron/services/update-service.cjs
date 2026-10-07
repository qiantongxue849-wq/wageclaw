function createUpdateService(config, sendStatus, dependencies = {}) {
  const app = dependencies.app || require("electron").app;
  const createUpdater = dependencies.createUpdater || (options => {
    const { NsisUpdater, MacUpdater, AppImageUpdater } = require("electron-updater");
    if (process.platform === "win32") return new NsisUpdater(options);
    if (process.platform === "darwin") return new MacUpdater(options);
    return new AppImageUpdater(options);
  });
  let updater = null;
  let installRequested = false;
  let checkPromise = null;
  let startupTimer = null;
  let intervalTimer = null;
  let installTimer = null;
  const notifiedVersions = new Set();
  let state = {
    status: config.updateUrl ? "idle" : "disabled",
    currentVersion: app.getVersion(),
    availableVersion: "",
    progress: 0,
    message: config.updateUrl ? "" : "未配置更新地址"
  };

  function publish(patch = {}) {
    state = { ...state, ...patch };
    sendStatus(state);
    return state;
  }

  function getState() {
    return state;
  }

  function initialize() {
    if (updater) return state;
    if (!app.isPackaged || !config.updateUrl) {
      return publish({
        status: !config.updateUrl ? "disabled" : "dev",
        message: !config.updateUrl ? "未配置更新地址" : "开发模式不检查更新"
      });
    }

    const updaterOptions = {
      provider: "generic",
      url: config.updateUrl,
      channel: config.updateChannel || "latest",
      useMultipleRangeRequest: false
    };

    updater = createUpdater(updaterOptions);

    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;

    updater.on("checking-for-update", () => {
      publish({ status: "checking", message: "正在检查新版本", progress: 0 });
    });
    updater.on("update-available", (info) => {
      publish({
        status: "available",
        availableVersion: info.version || "",
        message: `发现新版本 ${info.version || ""}`
      });
      if (info.version && !notifiedVersions.has(info.version)) {
        notifiedVersions.add(info.version);
        try { dependencies.notifyAvailable?.(state); } catch { /* Tray still shows the update. */ }
      }
    });
    updater.on("update-not-available", () => {
      publish({
        status: "current",
        availableVersion: "",
        message: "当前已是最新版本",
        progress: 0
      });
    });
    updater.on("download-progress", (progress) => {
      publish({
        status: "downloading",
        progress: Math.max(0, Math.min(100, Number(progress.percent) || 0)),
        message: "正在下载更新"
      });
    });
    updater.on("update-downloaded", (info) => {
      publish({
        status: "downloaded",
        availableVersion: info.version || state.availableVersion,
        progress: 100,
        message: "更新已下载，正在重启安装"
      });
      if (installRequested) {
        installTimer = setTimeout(() => updater.quitAndInstall(false, true), 500);
      }
    });
    updater.on("error", (error) => {
      installRequested = false;
      publish({
        status: "error",
        message: error?.message || "检查更新失败",
        progress: 0
      });
    });

    startupTimer = setTimeout(() => { void checkForUpdates(); }, 15 * 1000);
    intervalTimer = setInterval(() => { void checkForUpdates(); }, 6 * 60 * 60 * 1000);
    startupTimer.unref?.();
    intervalTimer.unref?.();
    return publish({ status: "idle", message: "" });
  }

  function checkForUpdates() {
    if (checkPromise) return checkPromise;
    if (!updater || ["available", "downloading", "downloaded"].includes(state.status)) return Promise.resolve(state);
    checkPromise = Promise.resolve().then(() => updater.checkForUpdates()).catch(error => {
      publish({ status: "error", message: error?.message || "检查更新失败", progress: 0 });
    }).then(() => state).finally(() => { checkPromise = null; });
    return checkPromise;
  }

  async function downloadAndInstall() {
    if (!updater || state.status !== "available") return state;
    installRequested = true;
    publish({ status: "downloading", message: "正在下载更新", progress: 0 });
    try { await updater.downloadUpdate(); }
    catch (error) {
      installRequested = false;
      publish({ status: "error", message: error?.message || "下载更新失败", progress: 0 });
    }
    return state;
  }

  function stop() {
    clearTimeout(startupTimer);
    clearInterval(intervalTimer);
    clearTimeout(installTimer);
  }

  return {
    initialize,
    getState,
    checkForUpdates,
    downloadAndInstall,
    stop
  };
}

module.exports = { createUpdateService };
