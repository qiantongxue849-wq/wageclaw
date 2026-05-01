# 忍了吧 WageClaw

一个零依赖的产品概念原型，把 PRD 先落成可直接打开的单页 Web 演示。

## 现在有什么

- 基础资料设置：称呼、工资、心愿礼物、今日被折磨分钟
- “忍耐账户”：额度领取、月度收支概览、记账筛选、心愿碎片购买点亮、快捷入口跳转
- “情绪补给仓”：商城货架、背包、最近使用记录、按分类筛选采购
- “怨气桌宠”：把糟心事炼成怨气，用怨气或忍耐额度买供品滋养桌宠
- 桌宠互动扩展：召唤、摸头/戳脸/揉肚/捏角/拽尾、连点炸毛、怨气追逐、怨气修炼、黑屏结界
- 本地桌面对练：`W/A/S/D` 移动，`J/K/I/L` 招式、`Shift` 格挡、`Q/E` 闪身，并预留联机预演入口
- AI 职场忍者三段式回复生成
- 匿名“忍界大赏”信息流
- 多端推送文案和桌面悬浮挂件预览
- 右上角悬浮账户：显示额度、心愿点亮、距离下班、距离周六/假期倒计时，并集成桌宠功能入口
- 统一列表分页：商城、背包、使用记录、记账本、桌宠供品、桌宠日志、社区信息流默认每页 10 条
- 基础设置：个人资料、浅色/深色主题、上下班时间、自然日/工作日模式、小窗默认首页

## 怎么看

直接在浏览器打开 `index.html` 即可。

如果你想用本地服务打开，也可以在当前目录运行：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。

## Electron 版本

- 已生成：`release/mac-arm64/WageClawElectron.app`
- 可分发压缩包：`release/WageClawElectron-0.2.1-arm64-mac.zip`
- 已生成 dmg：`release/WageClawElectron-0.2.1-arm64.dmg`
- 技术路线：`Electron + electron-builder`
- 主窗口和挂件窗口都是独立 Electron BrowserWindow
- 重新构建可运行：

```bash
PATH=$(pwd):$PATH ./node_modules/.bin/electron-builder --mac zip
```

- 本机如果需要重新构建 `dmg`，请走已经修好的 ad-hoc Node 链路：

```bash
PATH=$(pwd):$PATH .tools/node-adhoc/bin/node node_modules/electron-builder/cli.js --mac dmg
```

## 下一步建议

1. 接入真实账号体系和目标数据存储。
2. 把 AI 忍者接到语音转写和 LLM 服务。
3. 完善 Electron 桌面端的安装、更新和签名流程。
4. 补上移动端语音对话和匿名社区发布流程。
