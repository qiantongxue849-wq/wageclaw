> 历史文档：以下描述属于轻量化改造前的版本。当前功能与架构以 README.md 和 docs/ARCHITECTURE.md 为准。

# 登录与自动更新配置

## 0. 本地测试登录

当前 `electron/app-config.json` 已经打开：

```json
"localTestAuth": true
```

当 `supabaseUrl` 和 `supabaseAnonKey` 为空时，应用会进入本地测试登录模式。这个模式不会连接云端，登录页可以点击“使用本地测试账号进入”，也可以用任意邮箱 + 6 位以上密码登录。

本地测试用户 ID 会按邮箱稳定生成，所以本地业务数据仍然会按账号隔离。正式接入 Supabase 或准备发版时，请把它改为：

```json
"localTestAuth": false
```

也可以用环境变量临时开启：

```powershell
$env:WAGECLAW_LOCAL_TEST_AUTH="1"
npm run electron
```

## 1. 配置 Supabase 登录

应用只使用 Supabase Auth 做注册、登录和会话校验。工资、账本、心愿和桌宠数据仍保存在本机 `localStorage`，存储键会按 Supabase 用户 ID 隔离。

1. 在 Supabase 创建项目。
2. 打开 `Authentication -> Sign In / Providers -> Email`，启用邮箱密码登录。
3. 测试阶段可以先关闭邮箱确认；正式上线建议开启邮箱确认并配置 SMTP。
4. 在 `Project Settings -> API Keys` 复制 Project URL 和 publishable/anon key。
5. 编辑 `electron/app-config.json`：

```json
{
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "supabaseAnonKey": "YOUR_PUBLISHABLE_OR_ANON_KEY",
  "localTestAuth": false,
  "updateUrl": "https://downloads.example.com/wageclaw",
  "updateChannel": "latest"
}
```

不要把 Supabase `service_role` 或 `sb_secret_...` key 放进桌面应用。客户端只能使用 publishable/anon key。

开发环境也可以使用环境变量覆盖配置：

```powershell
$env:WAGECLAW_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:WAGECLAW_SUPABASE_ANON_KEY="YOUR_PUBLISHABLE_OR_ANON_KEY"
npm run electron
```

登录会话会用 Electron `safeStorage` 加密后保存在系统用户目录。退出登录只删除会话，不删除该账号的本机业务数据。

## 2. 配置自动更新

当前实现使用 `electron-updater` 的 generic provider。启动 3 秒后会自动检查；发现新版本时显示确认框，用户点击“一键更新”后自动下载并重启安装。

1. 将 `electron/app-config.json` 中的 `updateUrl` 改为 HTTPS 静态下载目录。
2. 同步修改 `package.json` 里的 `build.publish[0].url`。
3. 每次发布前递增 `package.json` 的 `version`。
4. Windows 执行 `npm run dist:win`。
5. 将安装包、`.blockmap` 和 `latest.yml` 一起上传到 `updateUrl` 对应目录。

示例目录：

```text
https://downloads.example.com/wageclaw/latest.yml
https://downloads.example.com/wageclaw/忍了吧 WageClaw Setup 0.3.1.exe
https://downloads.example.com/wageclaw/忍了吧 WageClaw Setup 0.3.1.exe.blockmap
```

打包后的 `resources/app-config.json` 也可以覆盖构建时配置，便于不同发布环境使用不同 Supabase 项目或下载地址。

生产发布应为 Windows 和 macOS 安装包配置代码签名，否则系统安全提示会影响安装体验，macOS 自动更新也无法作为正式发布方案可靠运行。
