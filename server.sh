#!/bin/bash
#
# Graded Reader GenAI 启动/停止脚本
# 用法: ./server.sh {start|stop|restart|status}
#

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_LOG="$BASE_DIR/app.log"
FRONTEND_PID_FILE="$BASE_DIR/app.pid"

# 读取 .env 配置文件
if [ -f "$BASE_DIR/.env.local" ]; then
    export $(grep -v '^#' "$BASE_DIR/.env.local" | xargs)
elif [ -f "$BASE_DIR/.env" ]; then
    export $(grep -v '^#' "$BASE_DIR/.env" | xargs)
fi

PORT="${PORT:-3000}"
export PORT="$PORT"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查进程是否存活
is_running() {
    local pid_file="$1"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# 清理指定端口上的残留进程
cleanup_port() {
    local name="$1"
    local port="$2"
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null | grep -v "^$")
    if [ -n "$pids" ]; then
        log_warn "${name}端口 $port 仍有残留进程，正在清理..."
        echo "$pids" | xargs kill 2>/dev/null
        sleep 2
        pids=$(lsof -ti :"$port" 2>/dev/null | grep -v "^$")
        if [ -n "$pids" ]; then
            log_warn "残留进程未响应，强制终止..."
            echo "$pids" | xargs kill -9 2>/dev/null
        fi
        log_info "${name}端口 $port 已清理"
    fi
}

# 启动前端
start_frontend() {
    if is_running "$FRONTEND_PID_FILE"; then
        log_warn "服务已在运行 (PID: $(cat $FRONTEND_PID_FILE))"
        return 0
    fi

    log_info "正在启动 Graded Reader GenAI 服务..."
    cd "$BASE_DIR"

    # 如果 node_modules 不存在则先安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "首次启动，正在安装前端依赖..."
        npm install >> "$FRONTEND_LOG" 2>&1
    fi

    setsid nohup npm run dev -- --host 0.0.0.0 > "$FRONTEND_LOG" 2>&1 &
    local pid=$!
    echo "$pid" > "$FRONTEND_PID_FILE"

    # 等待启动完成 (最多等待 30 秒)
    local count=0
    local max_wait=30
    while [ $count -lt $max_wait ]; do
        if curl -s http://localhost:$PORT > /dev/null 2>&1; then
            log_info "服务启动成功 (PID: $pid) — http://localhost:$PORT"
            return 0
        fi
        if ! kill -0 "$pid" 2>/dev/null; then
            log_error "服务启动失败，请查看日志: $FRONTEND_LOG"
            rm -f "$FRONTEND_PID_FILE"
            return 1
        fi
        sleep 1
        count=$((count + 1))
    done

    log_error "服务启动超时，请查看日志: $FRONTEND_LOG"
    return 1
}

# 停止服务
stop_service() {
    local name="$1"
    local pid_file="$2"
    local port="$3"

    if ! is_running "$pid_file"; then
        log_warn "${name}服务未在运行"
        rm -f "$pid_file"
        # PID 文件无效时，通过端口兜底清理
        if [ -n "$port" ]; then
            cleanup_port "$name" "$port"
        fi
        return 0
    fi

    local pid=$(cat "$pid_file")
    log_info "正在停止${name}服务 (PID: $pid)..."

    # 获取进程组 ID，终止整个进程组
    local pgid
    pgid=$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')
    if [ -n "$pgid" ] && [ "$pgid" != "0" ]; then
        kill -- -"$pgid" 2>/dev/null
    else
        pkill -P "$pid" 2>/dev/null
        kill "$pid" 2>/dev/null
    fi

    # 等待进程退出 (最多 10 秒)
    local count=0
    while [ $count -lt 10 ]; do
        if ! kill -0 "$pid" 2>/dev/null; then
            log_info "${name}服务已停止"
            rm -f "$pid_file"
            # 确认端口已释放
            if [ -n "$port" ]; then
                cleanup_port "$name" "$port"
            fi
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done

    # 强制终止
    log_warn "${name}服务未响应，强制终止..."
    if [ -n "$pgid" ] && [ "$pgid" != "0" ]; then
        kill -9 -- -"$pgid" 2>/dev/null
    else
        pkill -9 -P "$pid" 2>/dev/null
        kill -9 "$pid" 2>/dev/null
    fi
    rm -f "$pid_file"
    log_info "${name}服务已强制停止"

    # 最终端口清理
    if [ -n "$port" ]; then
        cleanup_port "$name" "$port"
    fi
}

# 查看状态
show_status() {
    echo "=========================================="
    echo "  Graded Reader GenAI 服务状态"
    echo "=========================================="

    if is_running "$FRONTEND_PID_FILE"; then
        local fpid=$(cat "$FRONTEND_PID_FILE")
        echo -e "  服务:  ${GREEN}运行中${NC} (PID: $fpid)  http://localhost:$PORT"
    else
        echo -e "  服务:  ${RED}已停止${NC}"
    fi

    echo "=========================================="
}

# 主入口
case "$1" in
    start)
        log_info "========== 启动 Graded Reader GenAI =========="
        start_frontend
        echo ""
        show_status
        ;;
    stop)
        log_info "========== 停止 Graded Reader GenAI =========="
        stop_service "应用" "$FRONTEND_PID_FILE" "$PORT"
        ;;
    restart)
        log_info "========== 重启 Graded Reader GenAI =========="
        stop_service "应用" "$FRONTEND_PID_FILE" "$PORT"
        sleep 2
        start_frontend
        echo ""
        show_status
        ;;
    status)
        show_status
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
