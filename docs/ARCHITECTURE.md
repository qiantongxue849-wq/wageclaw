# WageClaw V2 桌宠架构

## 桌面生命周期

`electron/main.cjs` 启动独立的 `desktop-store.cjs` 与 `desktop-service.cjs`，随后恢复桌宠和托盘。已配置时不会打开详情面板。

首次迁移时，隐藏的 `?view=bootstrap` 页面读取既有 localStorage 当前档案，提交给主进程校验并写入 `wageclaw-desktop-v2.json`。原始记录保留在原位置及桌面备份记录中。迁移完成后销毁 bootstrap 窗口。损坏数据进入恢复界面，不自动覆盖。

`?view=pet` 是唯一常驻视图，Canvas 绘制当前桌宠帧；通过像素透明度与窗口鼠标忽略能力处理命中区域。单击等待 450ms 区分双击，超过 6px 视为拖动。气泡是按需创建的独立窗口，无内容时销毁，避免扩大桌宠的透明阻挡区域。

`?view=main` 是详情面板，双击、气泡或托盘按需创建；关闭即销毁。面板不承担后台调度。`?view=pet-preview` 仅为浏览器视觉预览。

`?view=hover` 是悬停信息卡，同样按需创建：鼠标进入桌宠可点击像素区时建窗，离开 320ms 后销毁；浮层自身可悬停，移入时取消销毁。定位优先桌宠上方，气泡占位时让到下方。它只读快照，不参与调度。

桌宠形象由 `pet.style` 决定，五套可选；每套 10 种模样。`petStage()` 在上班后把两档进度相加：每 20 次互动一档，从上班时刻起每满一小时再一档，上限第 10 种。休息日和上班前固定第 1 种，下班后小时不再增加。`petAssets.ts` 把合图切片（`{url, sx}`）与独立图（`{url, cell}`）两种素材归一成同一 `PetFrame`，Canvas 侧无需分支。

## 领域与存储

- `src/lite/model.ts`：版本 2 配置、排班与桌宠／播报偏好清洗；`activeShift` 决定某天用常规还是夏季作息。
- `src/lite/calendar.ts`：收入、工作日历、发薪与假期纯函数；`petStage()` 按当天互动次数和上班后的整小时数输出 1–10 种模样，`recordPetInteraction()` 记下一次陪伴。
- `src/lite/broadcast.ts`：候选内容、每日配额、冷却、关键节点与下次调度。随机间隔 10–20 分钟，每日上限 32 条、两条之间至少 10 分钟，收工节点前后 15 分钟让位。
- `src/lite/petAssets.ts`：五套形象的素材寻址与阶段夹取，输出统一帧描述。
- `scripts/build-core.mjs`：将领域逻辑编译成主进程可用的 CommonJS，构建和测试前自动执行。输出不手工修改。
- `electron/desktop-store.cjs`：配置、播报记录和迁移来源；临时文件写入后原子替换，重置／导入前备份。
- `electron/desktop-service.cjs`：唯一调度实例、当前气泡和系统暂停状态，面板关闭不影响服务。
- `src/lite/useLite.ts`：桌面通过桥接保存，浏览器通过 localStorage 适配器保存；相同快照不替换正在编辑的设置。

按下一个事件设置单次定时器，最长每分钟校验一次时间变化；没有逐秒后台收入累加。可见面板才逐秒刷新数字。桌宠通常静止，每 45～90 秒播放一次约 8 FPS 的短动作。锁屏／休眠暂停调度与动画，唤醒重新安排，过期提醒不补发。

## 平台层

`app-windows.cjs` 管理透明桌宠、气泡、详情窗口和多屏位置夹取。`app-tray.cjs` 提供查看、播报、安静、设置和隐藏／退出。`app-ipc.cjs` 校验发送者并限制敏感操作为详情面板。预加载仅暴露 `wageclawLite` 接口。

当前仍使用 Electron。共享领域模块和平台接口已分离，但没有完成 Tauri 移植；原生透明点击、多屏与系统行为必须分平台实测。

## 验证入口

- `npm run check`：静态检查、类型、领域与主进程服务测试、生产构建。
- `scripts/verify-lite.mjs`：既有浏览器面板回归。
- `scripts/verify-pet.mjs`：隔离 Electron 档案，手势、窗口销毁、重启、隐私及短时资源采样。
- `scripts/verify-pet-features.mjs`：形象切换（五套指纹互不相同）、十阶进化（固定时钟后重载取六个时点）、夏季作息改阶段、悬停浮层创建与销毁。
- 最新结果及未验证项目见 `DESKTOP_PET_V2_VERIFICATION.md`。
