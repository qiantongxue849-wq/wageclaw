# 桌面端自动发布与更新

当前实现先覆盖 Windows x64 NSIS 安装版。仓库的实际发布分支是 `lite`。

## GitHub Releases（当前选择）

已在本机配置 `origin` 的两个 push URL：Gitee 和 GitHub。日常在 `lite` 上完成开发后，`git push origin lite` 会依次同步两端，GitHub 接收到代码即运行流水线。无需再次手工添加远端或 push URL。

使用现有公开仓库 `qiantongxue849-wq/wageclaw`，新增 `lite` 分支作为发布入口，保留原来的 `vue` 分支。GitHub Releases 存放安装包，更新目录固定为：

`https://github.com/qiantongxue849-wq/wageclaw/releases/latest/download`

仓库 Actions variables 设置 `WAGECLAW_RELEASE_PROVIDER=github`、`WAGECLAW_RELEASE_ENABLED=true` 和上述 `WAGECLAW_UPDATE_URL` 即可。此路径不需要 OSS 或额外 AccessKey，deploy-github 仅使用当次任务的 `GITHUB_TOKEN`，在该 job 授予 `contents: write`。

`scripts/publish-github.py` 在校验本地包后创建草稿 Release，上传安装包、blockmap 和版本清单，再校验 GitHub 返回的大小及 SHA-256，全部成功后才公开并设为 Latest。版本清单中的安装包使用固定 tag 的绝对地址，避免用户稍后接受更新时 `latest` 已指向另一版导致旧包 404。发布 tag 为 `desktop-v版本号`，精确关联触发流水线的 commit。失败时草稿不会触发客户端更新；发新 commit 获得新版本后重试，不覆盖同版本文件。

GitHub 下载速度取决于用户网络。下面 OSS 部分为可选迁移方案；切换时要考虑已安装版本中的更新地址，并保持原地址可用。

```mermaid
flowchart LR
  A[本地开发并 push 到 lite] --> B[GitHub Actions 检查]
  B --> C[生成递增版本的 Windows 安装包]
  C --> D[上传 GitHub Release 或 OSS]
  D --> E[检查公开下载地址]
  E --> F[最后发布 latest.yml]
  F --> G[桌面端启动后及每 6 小时检查]
  G --> H[系统通知和托盘更新入口]
  H --> I[用户点击下载并重启安装]
```

## 已实现

- `.github/workflows/desktop.yml`：`lite` push/PR 自动运行 `npm ci`、lint、类型检查、测试和前端构建。只有 `lite` 的 push/手动运行可发布，PR 不接触发布密钥。
- 发布开关默认关闭。设置 `WAGECLAW_RELEASE_ENABLED=true` 后，检查成功才构建并部署。
- `scripts/prepare-release.mjs`：发布版本为源版本的 patch 加 `GITHUB_RUN_NUMBER`。例如源版本 `0.3.1`、运行编号 `42`，安装包版本为 `0.3.43`。只修改 CI 临时检出的 package 和 lockfile，不自动提交版本号。
- 发布配置中的更新地址同时写入 builder 配置和安装包外部 `resources/app-config.json`。项目里的本地配置仍适用于手工构建。
- `scripts/publish-oss.py`：校验安装包 SHA-512、大小和文件名；先上传不可变版本文件、确认公开下载可用，最后写入 `latest.yml`。失败不切换更新清单，旧版更新源继续可用。拒绝旧版本覆盖新版；相同运行重试只能复用字节一致的安装包。
- 桌面端启动 15 秒后检查，再每 6 小时检查。离线失败会在下次检查重试，不影响桌宠。单次运行中同版本只发一次系统通知；系统禁用通知时，托盘仍有入口。用户选择更新之后才下载并重启安装。

## OSS 可选接入

### 1. GitHub 运行 CI，Gitee 保留源码

当前 origin 是 `https://gitee.com/qiantongxue/wageclaw.git`，GitHub Actions 不会因为向 Gitee push 而启动。需要创建对应的 GitHub 仓库，并把完整 `lite` 分支同步过去。先检查准备提交的文件；当前工作区已有多项未提交功能和资源，本实现未替你提交、推送或修改 remote。

添加 GitHub remote 后，可让一次 `git push origin lite` 同时推到两端（以下 GitHub 地址需要换成你自己的）：

```powershell
git remote add github https://github.com/YOUR_ACCOUNT/wageclaw.git
git push github lite
git remote set-url --add --push origin https://gitee.com/qiantongxue/wageclaw.git
git remote set-url --add --push origin https://github.com/YOUR_ACCOUNT/wageclaw.git
git remote get-url --push --all origin
```

Git 的多个 push URL 是依次推送，不保证两端同时成功；以 GitHub 接收到的 commit 和 Actions 结果为发布依据。也可单独 `git push github lite`。如果要完全保留 Gitee，可在 Gitee CI/Jenkins 的 Windows agent 复用检查和打包命令、在部署 agent 复用 OSS 脚本；需要自行接入触发器并提供单调递增的 `GITHUB_RUN_NUMBER`。本仓库没有假定 Gitee 可直接执行 `.github/workflows`。

### 2. 准备 OSS 下载目录

示例：bucket `your-download-bucket`，对象目录 `wageclaw/windows`，公开 HTTPS 地址 `https://downloads.example.com/wageclaw/windows`。公开 URL 必须映射到这个对象目录；也可以使用可公开访问的 OSS HTTPS bucket 域名。CI 写权限与客户端公开读权限分开配置。

需要公开读取以下文件，并保留历史安装包和 blockmap：

```text
wageclaw/windows/
  latest.yml
  WageClaw-Setup-0.3.43.exe
  WageClaw-Setup-0.3.43.exe.blockmap
  WageClaw-Setup-0.3.44.exe
  WageClaw-Setup-0.3.44.exe.blockmap
```

OSS 已通过脚本设置：版本文件缓存一年；`latest.yml` 为 `no-store, no-cache, must-revalidate`。如果接了 CDN，额外给 `*/latest.yml` 配置零缓存并确保不覆盖源站这些响应头。新文件不能被负缓存拦住。下载站需支持 HEAD、GET 和 Range；不要启用会要求登录或拒绝 Electron 请求的防盗链规则。

### 3. 配置 GitHub Actions

在 GitHub 仓库的 Settings → Secrets and variables → Actions 添加 Repository variables：

| 名称 | 示例/要求 |
| --- | --- |
| `WAGECLAW_RELEASE_ENABLED` | 接通前为 `false`；准备好后设为 `true` |
| `WAGECLAW_UPDATE_URL` | `https://downloads.example.com/wageclaw/windows`，固定长期有效的目录地址 |
| `OSS_ENDPOINT` | `https://oss-cn-hangzhou.aliyuncs.com`，按 bucket 实际地域填写 |
| `OSS_BUCKET` | `your-download-bucket` |
| `OSS_PREFIX` | `wageclaw/windows`，与公开 URL 对应 |

添加 Repository secrets：`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`。使用只能读写上述发布目录的 RAM 身份；无需 bucket 管理或删除权限。密钥只给 deploy 步骤，不写入安装包。

切换 OSS 时还需设置 `WAGECLAW_RELEASE_PROVIDER=oss`；其余情况下执行 GitHub 发布。

创建 GitHub Environment `desktop-production`，将部署分支限制为 `lite`。若希望提交后全自动上线，不设置 required reviewers；若团队需要发布审核，可在这个 Environment 设置审核人。启用仓库 Actions 即可。

当前脚本没有往 CI 注入热点 API key，默认安装版仍使用本地播报；和更新功能无关。如果后续要统一提供热点，应沿用单独的热点服务方案。

### 4. 第一次安装与验收

1. 提交完整功能代码、资源、本次工作流和脚本到 GitHub `lite`，将发布开关改为 `true`，在 Actions 手动运行一次工作流或再次 push。
2. 确认 check、package、deploy 全部成功；可在运行记录下载 `windows-update` artifact。公开访问 `WAGECLAW_UPDATE_URL/latest.yml`，确认能读取版本和安装包地址。
3. 安装这一版 NSIS 包。核实安装目录 `resources/app-config.json` 是真实的更新地址。
4. 再提交一次改动并 push，确认发布版本严格增大。已安装客户端在启动约 15 秒后或下一次 6 小时检查时收到提示；也可以去设置 → 数据与更新手动检查。
5. 点击“安装更新”，确认下载、重启、版本变化，以及工资设置、桌宠偏好、本地存档仍保留。尚未点击时不应下载或重启。

已经发给用户的 `0.3.1` 若更新地址为空，不能通过新服务器远程补上地址；需先引导他们手工安装一次接入更新地址的新版本。更新提醒采用客户端轮询，用户离线或应用未运行时不会立即收到；启动后联网会检查。

## 日常开发

在开发分支写功能，运行 `npm run check`，合并到 `lite` 后 `git push origin lite`（已配置双 push URL 时）即可。仅 `git commit` 不会触发云端 CI。

同一工作流的运行编号包括失败与 PR，因此版本号可能跳号，属于正常情况。重跑同一编号会沿用版本：若重新构建产生不同字节，OSS 发布会拒绝覆盖；修复后发一个新 commit 获得新编号。不要删除重建工作流以重置编号，也不要降低源版本；接近 Windows 版本分量 65535 时提升源 minor 版本。服务器始终检查并拒绝倒退。

不要用旧包覆盖已发布的版本文件。需要回退功能时，将回退代码作为更高版本发布。客户端保留原来的更新地址，因此下载域名和目录要长期保留；迁移需保持旧域名代理/可用，直到客户端完成迁移。

## 当前验证边界

本地覆盖了后台检查、并发请求、重复提醒、离线恢复、用户确认安装、版本生成、上传顺序、坏包拒绝、失败保留旧清单和版本倒退拒绝。接通仓库和 OSS 后仍需做上述两版本真实安装验收；本地测试无法确认你的 CDN、GitHub 权限或系统通知设置。

2026-10-07 本地验证：`npm run check` 通过（104 项测试），OSS 发布脚本 7 项测试通过；使用隔离输出和测试更新地址实际生成了 Windows NSIS 安装包、blockmap 与 `latest.yml`，校验安装包 SHA-512/大小成功，包内 runtime 和 builder 更新地址一致。未安装测试包、未上传 OSS、未触发远端 Actions。

现有 Windows 打包配置未启用代码签名；此实现沿用它，下载站依赖 HTTPS 和发布目录权限，用户安装时可能遇到 Windows 信誉提示。正式签名可以作为后续接入项。macOS 自动更新要求签名，且要独立构建 ZIP 和 `latest-mac.yml`；本次没有启用 macOS 发布。

参考：[electron-builder v26 自动更新](https://www.electron.build/v26/docs/features/auto-update/)、[generic 发布配置](https://www.electron.build/v26/docs/publish/)、[GitHub Actions 工作流](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)、[OSS PutObject 和缓存响应头](https://help.aliyun.com/en/oss/developer-reference/putobject)。
