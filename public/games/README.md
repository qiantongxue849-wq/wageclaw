# 忍了吧的小窗街机

十款游戏按需打开，在主窗口内容区运行。退出时销毁 iframe，不保留后台游戏循环。小游戏得分仅用于游戏，不计入工资。

| 菜单名称 | 上游／玩法 | 本地目录 |
| --- | --- | --- |
| 坦克大战 | TANK BATTLE 90，保留原游戏 | tank |
| 丛林突击 | Contra Code，魂斗罗式横版射击 | contra |
| 跳跃冒险 | LittleJS Jumpman，马里奥式跳跃 | arcade/games/jumpman.html |
| 炸弹迷宫 | LittleJS Blastman，炸弹人式迷宫 | arcade/games/blastman.html |
| 雷霆战机 | LittleJS Powerwing，横版飞机射击 | arcade/games/powerwing.html |
| 极速赛车 | LittleJS Speedway，街机赛车 | arcade/games/speedway.html |
| 吃豆迷宫 | LittleJS Maze Munch，吃豆与幽灵追逐 | arcade/games/pucMan.html |
| 青蛙过河 | LittleJS Froggit，躲车与浮木闯关 | arcade/games/froggit.html |
| 西洋跳棋 | GameBox Checkers，保留电脑与双人对弈 | gb/checkers |
| 五子棋 | 本项目新增，本地 AI／双人／悔棋 | gomoku |

## 来源与许可

- [LittleJS Arcade](https://github.com/KilledByAPixel/LittleJSArcade)，固定版本 `140e4d511e0001052133fdadb61cb63b85577165`。六款游戏、共享引擎和辅助代码均为 MIT，完整许可见 `arcade/LICENSE`。未使用仓库中的 Twemoji 字体。
- [Contra Code](https://github.com/yangyue1974/contra-code)，固定版本 `78bfec6137d92dd56d56bb088a0ee057ccf2c62a`。MIT，完整许可见 `contra/LICENSE`。修改后的 TypeScript 源码保留在 `contra/src`，预编译浏览器入口为 `contra/game.js`。
- [TANK BATTLE 90](https://github.com/phanngoc/tank-battle-90)，MIT，原作者声明保留在 `tank/index.html`。
- GameBox Checkers 的完整 MIT 许可保留在 `gb/LICENSE.md`。
- 五子棋源码是 `gomoku/game.js`，许可见 `gomoku/LICENSE`。

这些是开源同类玩法，并非任天堂、Konami、SNK 等厂商原版游戏或 ROM。

## 小窗适配

- LittleJS 的 `pocket.js` 和 `pocket.css` 提供中文开场、静音、暂停和结束弹窗；关闭引擎的系统全屏入口。六款游戏分别调整了计分栏尺寸。迷宫两款将棋盘与信息栏分开，射击和跳跃保留画面比例。
- Contra 使用 420px 高的虚拟画布，按窗口比例调整宽度，避免直接使用 151px 高画布导致关卡与角色比例失衡；计分文字按小窗加大。图片缩至最多 512px。去掉远端排行榜与背景音乐依赖，保留本机得分和合成音效，默认静音。
- 跳棋去掉远端字体与代码展示面板，棋盘和操作区左右布局。
- 五子棋使用自适应画布，鼠标和键盘均可落子，电脑优先处理直接获胜和防守威胁。

主窗口由 `src/lite/BreakCorner.vue` 托管，默认游戏内容区约 287×151，上方 32px 保留返回与系统窗口操作区域。
