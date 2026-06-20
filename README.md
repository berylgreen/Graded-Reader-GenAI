<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Graded Reader GenAI

This repository contains the code for the Graded Reader GenAI application.
View your app in AI Studio: https://ai.studio/apps/drive/1JVOzrbJmyCOomzvQSU0oTlmg0AabIoJP

## 运行方式 (Run Locally)

**前置依赖 (Prerequisites):** Node.js >= 18.0.0

### 使用系统服务管理脚本 (推荐后台运行方式)

我们提供了统一的管理脚本，支持一键在后台启动、停止、重启和查看状态。
- **Linux / macOS**: 使用 `server.sh`
- **Windows**: 使用 `server.bat`

1. **配置环境**
   复制 `.env.example` 到 `.env.local` 并在 `.env.local` 中配置您的 API 密钥（如果还没有 `.env.local`，请创建一个，并填入相应的配置）。

2. **管理系统**
   执行以下命令来管理系统的运行状态：
   
   - **启动系统**：自动在后台启动，将日志输出至 `app.log`。
     ```bash
     # Linux / macOS
     ./server.sh start
     # Windows
     .\server.bat start
     ```
   - **停止系统**：平滑停止后台进程。
     ```bash
     # Linux / macOS
     ./server.sh stop
     # Windows
     .\server.bat stop
     ```
   - **重启系统**：先停止后再次启动。
     ```bash
     # Linux / macOS
     ./server.sh restart
     # Windows
     .\server.bat restart
     ```
   - **查看状态**：检查系统当前是否正在运行。
     ```bash
     # Linux / macOS
     ./server.sh status
     # Windows
     .\server.bat status
     ```

   *应用启动后，您可以通过 `tail -f app.log` (Linux/macOS) 或使用编辑器打开该文件来实时查看日志输出。*

### 传统开发模式运行 (前台运行)

如果您处于开发阶段并希望实时查看热更新：

1. 安装依赖：
   ```bash
   npm install
   ```
2. 运行应用：
   ```bash
   npm run dev
   ```

## 用户配置 (User Configuration)

应用程序的用户偏好设置会自动保存在根目录下的 `user_config.json` 文件中。您可以在前端页面的 "Configure Levels" 面板进行相关配置，系统会通过本地 API 将您的更改持久化保存。

主要配置项说明：
- **`currentLevel` (当前等级)**：控制生成文章的词汇和语法难度。
- **`contentType` (内容类型)**：控制生成文章的体裁。目前支持 `"fiction"`（小说/虚构类故事）和 `"non-fiction"`（非虚构类/科普纪实文章）。
- **`vocabSystem` (词汇表系统)**：使用的对标词汇标准（如 `"fry"` 词表）。
- **`schoolGradeId` (学校年级)**：匹配对应年级的阅读水平。
- **`manualKnownWords` (手动已知词汇)**：用户可手动补充已掌握的词汇，系统在生成和高亮文章时会将其作为已掌握词汇处理。

---

*This contains everything you need to run your app locally.*
