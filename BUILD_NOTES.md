# Electron 打包踩坑记录

## 打包命令

```powershell
npm run dist:win
```

启动桌面端开发环境（跳过打包）：

```powershell
npm run dev             # 终端 1: Vite 开发服务器
$env:VITE_DEV_SERVER_URL="http://127.0.0.1:5173"; npx electron .   # 终端 2: Electron
```

---

## 坑 1：Vite `base` 配置放错位置

**现象**：打包安装后运行 → 白屏闪退，没有任何 UI。

**根因**：`vite.config.ts` 里 `base: "./"` 放在了 `build: {}` 内部，Vite 不认。Vite 要求 `base` 是**顶层配置**。

```ts
// ❌ 错误
export default defineConfig({
  build: {
    base: "./"   // 放在 build 里面不生效
  }
});

// ✅ 正确
export default defineConfig({
  base: "./",     // 顶层配置
  build: {
    outDir: "dist"
  }
});
```

`base` 没生效的后果：产出 `dist/index.html` 里 JS/CSS 引用是绝对路径 `/assets/xxx.js`。Electron 打包后用 `file://` 协议加载，`/assets/` 被解析为 `file:///assets/`（系统根目录），找不到文件 → 白屏。

---

## 坑 2：Electron `setIgnoreMouseEvents(true)` 让桌宠鼠标无效

**现象**：桌宠窗口透明正常，但完全不能点击、不能拖拽。

**根因**：`createPetWindow` 里有一行 `win.setIgnoreMouseEvents(true, { forward: true })`，把整个窗口设为鼠标穿透。

**解决**：删掉这行。

---

## 坑 3：`overflow: hidden` 裁掉了桌宠对话框

**现象**：双击桌宠后对话框不显示（或被裁掉）。

**根因**：桌宠窗口的 `html`/`body` 设了 `overflow: hidden`，对话框在宠物上方超出窗口区域被裁剪。即使用 `overflow: visible` 也不够——桌宠窗口高度只有 220px，对话框需要上部约 120px 空间。

**解决**：
1. 桌宠窗口高度从 220px → 320px
2. `html`/`body`/`#app` 全部 `overflow: visible`
3. 桌宠用 `align-items: flex-end` 固定在窗口底部，上部留给对话框

---

## 坑 4：CSS 注入时机太早

**现象**：用 `webContents.insertCSS()` 清除浮宠窗口背景，但有时背景还在闪烁。

**根因**：`insertCSS` 在 `loadRenderer` 之后**立即调用**，此时页面还没加载完成。Vue 挂载后生成的背景样式会覆盖插入的 CSS。

**解决**：把 `insertCSS` 放进 `win.webContents.on("did-finish-load", ...)` 回调，确保在页面渲染完成后注入。

---

## 坑 5：浮宠窗口背景白/黑

**现象**：透明窗口背景不是纯透明，而是白色或黑色。

**根因**：多个层级都有背景色：
- `.app-root` 有多套主题背景（`data-theme` 选择器优先级高）
- `html`/`body` 默认背景
- Vue 的 `onMounted` 里用 inline style 设置透明，但 CSS 选择器优先级不够

**解决**：
1. `main.cjs` 里用 `insertCSS` + `!important` 暴力覆盖所有背景
2. 同时干掉 `.surface-grid` 和 `::before`/`::after` 伪元素

---

## 坑 6：主窗口无边框后不能拖拽

**现象**：`frame: false` 后窗口没有标题栏，无法拖动。

**解决**：CSS 中给侧边栏和标题栏加 `-webkit-app-region: drag`，按钮加 `no-drag`。

---

## 坑 7：主窗口和桌宠窗口 state 不同步

**现象**：控制台里切换了桌宠风格，桌宠窗口不更新。

**根因**：两个 `BrowserWindow` 是**独立的渲染进程**，各自有独立的 Vue 实例和 state，互不相通。

**解决**：桌宠窗口的 `onMounted` 里监听 `window.addEventListener("storage", ...)`。控制台修改 state 时会写 localStorage，桌宠窗口收到 storage 事件后自动同步。

---

## 坑 8：electron-builder 下载 Electron 二进制失败

**现象**：`npm run dist:win` 卡在 `downloading electron-v41.2.1-win32-x64.zip`，反复重试。

**原因**：GitHub 在国内网络环境下载慢。

**解决**：第一次打包需要耐心等待（143MB），下载成功后缓存到 `%LOCALAPPDATA%\electron-builder\Cache\electron\`，后续打包秒过。

---

## 关键文件清单

| 文件 | 作用 |
|------|------|
| `vite.config.ts` | `base: "./"` 必须在顶层 |
| `electron/main.cjs` | 窗口管理、IPC、打包/开发模式路由 |
| `electron/preload.cjs` | contextBridge 暴露 API |
| `package.json` | `build.win` NSIS 配置 |
| `src/composables/useWageClaw.ts` | 核心逻辑、storage 同步 |
| `src/App.vue` | UI 模板、float-only 模式 |
| `src/styles.css` | 全部样式 |
