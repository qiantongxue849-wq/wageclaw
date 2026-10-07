# 应用与通知区域图标

2026-09-30 使用 imagegen 内置工具生成，透明背景。源图分别为 `app-icon-source.png`、`tray-icon-source.png`，原始生成图保留在 Codex 生成目录。`npm run icons` 将源图转换为 512px PNG 和包含 16、20、24、32、40、48、64、128、256px 的 ICO。

- `app-icon.ico`：Windows exe、安装／卸载程序、桌面快捷方式和任务栏。`app-icon.png`：Electron 窗口与跨平台应用图标。
- `tray-icon.ico`：Windows 托盘。`tray-icon.png`：同一图标的 PNG 版本。

桌面图标最终生成提示词：

> Use case: logo-brand. Asset type: Windows desktop application icon for a small Chinese desktop companion app named WageClaw / 忍了吧. Create ONE polished square icon, frontal centered view. A very simple adorable calm capybara FACE with tiny rounded ears, sleepy closed eyes and a broad soft muzzle, flat cream and warm dark-brown shapes on a rich terracotta-orange rounded-square tile. A single tiny sage-green leaf on the capybara's head evokes relaxation. Warm cozy stationery aesthetic matching a cream/brown desktop UI. Bold clean outlines, crisp vector-like geometry, generous silhouette, high contrast and recognizable at 32 pixels. Minimal subtle depth, no fine textures. Tile fills 90 percent of the square, transparent outside rounded corners. No text, no lettering, no watermark, no extra objects, no mockup, no scene, no perspective. Produce an actual usable standalone app icon with transparent outer background.

托盘图标最终编辑提示词（以桌面图标为参考）：

> Edit this application icon into ONE simplified Windows notification-area / system tray icon. Preserve the same capybara identity: rounded ears, sleepy calm closed eyes, broad pale muzzle, one green leaf. Remove the orange rounded-square background entirely: only the centered capybara head remains, surrounded by actual transparent pixels. Make the silhouette bold and compact, with thick dark-brown outline, flat warm cream fill and green leaf, no soft shadows, no texture, no cheeks, very few internal lines, readable at 16 and 20 pixels on both dark and light taskbars. Large centered head occupies about 90 percent of square canvas. No text, no tile, no multiple variants, no scene, no watermark. This is a separate usable production tray icon, not a mockup.

源图生成后，脚本仅进行尺寸转换和 ICO 编码。历史 `app-icon-source.jpg` 保留，不再作为当前图标的输入。
