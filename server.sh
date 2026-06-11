#!/bin/bash

# 定义日志文件和PID文件
LOG_FILE="app.log"
PID_FILE="app.pid"

start() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
            echo "系统已经在运行中，PID: $PID"
            return 1
        else
            echo "发现无效的 PID 文件，正在清理..."
            rm "$PID_FILE"
        fi
    fi

    echo "正在启动 Graded Reader GenAI 系统..."

    # 如果 node_modules 不存在，则安装依赖
    if [ ! -d "node_modules" ]; then
        echo "未找到 node_modules，正在安装依赖 (npm install)..."
        npm install
    fi

    # 检查环境变量文件
    if [ ! -f ".env.local" ]; then
        echo "警告: 未找到 .env.local 文件，请确保已配置环境变量。"
    fi

    # 在后台启动应用
    nohup npm run dev > "$LOG_FILE" 2>&1 &
    PID=$!

    # 保存进程号
    echo $PID > "$PID_FILE"

    echo "系统已在后台启动，PID: $PID"
    echo "日志将写入到 $LOG_FILE"
    echo "可以使用命令查看日志: tail -f $LOG_FILE"
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "系统当前未运行 (未找到 $PID_FILE 文件)。"
        return 0
    fi

    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null; then
        echo "正在停止系统 (PID $PID)..."
        kill "$PID"
        
        # 等待进程完全退出
        while ps -p "$PID" > /dev/null; do
            sleep 1
        done
        
        echo "系统已成功停止。"
    else
        echo "进程 $PID 未运行。"
    fi

    # 清理 PID 文件
    rm -f "$PID_FILE"
}

status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
            echo "系统正在运行中，PID: $PID"
            return 0
        else
            echo "系统未运行 (发现无效的 PID 文件)。"
            return 1
        fi
    else
        echo "系统未运行。"
        return 1
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        start
        ;;
    status)
        status
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
esac

exit 0
