const { app } = require("electron");
const { NsisUpdater, MacUpdater, AppImageUpdater } = require("electron-updater");

function createUpdateService(config, sendStatus) {
  let updater = null;
  let installRequested = false;
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

    if (process.platform === "win32") updater = new NsisUpdater(updaterOptions);
    else if (process.platform === "darwin") updater = new MacUpdater(updaterOptions);
    else updater = new AppImageUpdater(updaterOptions);

    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = true;

    updater.on("checking-for-update", () => {
      publish({ status: "checking", message: "正在检查新版本", progress: 0 });
    });
    updater.on("update-available", (info) => {
      publish({
        status: "available",
        availableVersion: info.version || "",
        message: `发现新版本 ${info.version || ""}`
      });
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
        setTimeout(() => updater.quitAndInstall(false, true), 500);
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

    return publish({ status: "idle", message: "" });
  }

  async function checkForUpdates() {
    if (!updater) return state;
    await updater.checkForUpdates();
    return state;
  }

  async function downloadAndInstall() {
    if (!updater || state.status !== "available") return state;
    installRequested = true;
    publish({ status: "downloading", message: "正在下载更新", progress: 0 });
    await updater.downloadUpdate();
    return state;
  }

  return {
    initialize,
    getState,
    checkForUpdates,
    downloadAndInstall
  };
}

module.exports = { createUpdateService };
