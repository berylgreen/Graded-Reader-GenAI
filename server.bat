@echo off
setlocal EnableDelayedExpansion

set LOG_FILE=app.log
set PID_FILE=app.pid

set ACTION=%1

if "%ACTION%"=="start" goto start
if "%ACTION%"=="stop" goto stop
if "%ACTION%"=="restart" goto restart
if "%ACTION%"=="status" goto status

echo 用法: server.bat {start^|stop^|restart^|status}
goto :eof

:start
if exist "%PID_FILE%" (
    set /p CUR_PID=<"%PID_FILE%"
    tasklist /FI "PID eq !CUR_PID!" 2>NUL | find /I "!CUR_PID!" >NUL
    if not errorlevel 1 (
        echo 系统已经在运行中，PID: !CUR_PID!
        goto :eof
    ) else (
        echo 发现无效的 PID 文件，正在清理...
        del "%PID_FILE%"
    )
)

echo 正在启动 Graded Reader GenAI 系统...

if not exist "node_modules" (
    echo 未找到 node_modules，正在安装依赖 ^(npm install^)...
    call npm install
)

if not exist ".env.local" (
    echo 警告: 未找到 .env.local 文件，请确保已配置环境变量。
)

:: 使用 PowerShell 在后台启动并获取真实 PID
powershell -NoProfile -Command "$proc = Start-Process npm.cmd -ArgumentList 'run', 'dev' -WindowStyle Hidden -PassThru -RedirectStandardOutput '%LOG_FILE%' -RedirectStandardError '%LOG_FILE%'; Set-Content -Path '%PID_FILE%' -Value $proc.Id"

if exist "%PID_FILE%" (
    set /p NEW_PID=<"%PID_FILE%"
    echo 系统已在后台启动，PID: !NEW_PID!
    echo 日志将写入到 %LOG_FILE%
) else (
    echo 启动失败，请检查是否缺少依赖。
)
goto :eof

:stop
if not exist "%PID_FILE%" (
    echo 系统当前未运行 ^(未找到 %PID_FILE% 文件^)。
    goto :eof
)

set /p CUR_PID=<"%PID_FILE%"
tasklist /FI "PID eq !CUR_PID!" 2>NUL | find /I "!CUR_PID!" >NUL
if not errorlevel 1 (
    echo 正在停止系统 ^(PID !CUR_PID!^)...
    taskkill /F /T /PID !CUR_PID! >NUL 2>&1
    echo 系统已成功停止。
) else (
    echo 进程 !CUR_PID! 未运行。
)

del "%PID_FILE%" >NUL 2>&1
goto :eof

:status
if exist "%PID_FILE%" (
    set /p CUR_PID=<"%PID_FILE%"
    tasklist /FI "PID eq !CUR_PID!" 2>NUL | find /I "!CUR_PID!" >NUL
    if not errorlevel 1 (
        echo 系统正在运行中，PID: !CUR_PID!
    ) else (
        echo 系统未运行 ^(发现无效的 PID 文件^)。
    )
) else (
    echo 系统未运行。
)
goto :eof

:restart
call :stop
:: 等待1秒
ping 127.0.0.1 -n 2 >NUL
call :start
goto :eof
