#!/usr/bin/env bash
# Works on macOS and Debian/Ubuntu

# If run with 'sh', re-execute with bash
if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

KEEP_REDIS=false
for arg in "$@"; do
    case $arg in
        --keep-redis)
            KEEP_REDIS=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown argument: $arg${NC}"
            echo "Usage: ./stop.sh [--keep-redis]"
            exit 1
            ;;
    esac
done

BACKEND_PORT=8000
FRONTEND_PORT=5173
REDIS_PORT=6379

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   Stopping Event Manager${NC}"
if [ "$KEEP_REDIS" = true ]; then
    echo -e "${YELLOW}   (Backend + Frontend, keeping Redis)${NC}"
else
    echo -e "${YELLOW}   (Redis + Backend + Frontend)${NC}"
fi
echo -e "${YELLOW}========================================${NC}"
echo ""

port_in_use() {
    local port=$1
    if command -v lsof &>/dev/null; then
        lsof -i :"$port" -sTCP:LISTEN -t &>/dev/null
    elif command -v ss &>/dev/null; then
        ss -tuln | grep -q ":$port "
    elif command -v netstat &>/dev/null; then
        netstat -tuln | grep -q ":$port "
    else
        (echo > /dev/tcp/localhost/$port) &>/dev/null
    fi
}

get_pid_by_port() {
    local port=$1
    if command -v lsof &>/dev/null; then
        lsof -i :"$port" -sTCP:LISTEN -t 2>/dev/null
    elif command -v ss &>/dev/null; then
        ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' 2>/dev/null || true
    elif command -v netstat &>/dev/null; then
        netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $NF}' | grep -oE '[0-9]+' || true
    fi
}

stop_port() {
    local port=$1
    local service_name=$2
    local pids

    if ! port_in_use "$port"; then
        echo -e "  ${service_name} (port $port): ${YELLOW}not running${NC}"
        return 0
    fi

    pids=$(get_pid_by_port "$port" | sort -u || true)
    if [ -z "$pids" ]; then
        echo -e "  ${service_name} (port $port): ${RED}port is busy, PID not detected${NC}"
        return 1
    fi

    echo -n "  Stopping ${service_name} (port $port)... "
    for pid in $pids; do
        kill "$pid" 2>/dev/null || true
    done

    sleep 1

    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    done

    sleep 1

    if port_in_use "$port"; then
        echo -e "${RED}failed${NC}"
        return 1
    fi

    echo -e "${GREEN}stopped${NC}"
}

stop_redis() {
    if ! command -v redis-cli &>/dev/null; then
        echo -e "  Redis: ${YELLOW}redis-cli not found, skipping${NC}"
        return 0
    fi

    if ! redis-cli ping &>/dev/null; then
        echo -e "  Redis (port $REDIS_PORT): ${YELLOW}not running${NC}"
        return 0
    fi

    echo -n "  Stopping Redis (port $REDIS_PORT)... "
    if command -v brew &>/dev/null && brew services list 2>/dev/null | grep -q '^redis '; then
        brew services stop redis >/dev/null 2>&1 || redis-cli shutdown >/dev/null 2>&1 || true
    elif command -v systemctl &>/dev/null; then
        sudo systemctl stop redis-server >/dev/null 2>&1 || sudo systemctl stop redis >/dev/null 2>&1 || redis-cli shutdown >/dev/null 2>&1 || true
    else
        redis-cli shutdown >/dev/null 2>&1 || true
    fi

    sleep 1

    if redis-cli ping &>/dev/null; then
        echo -e "${RED}failed${NC}"
        return 1
    fi

    echo -e "${GREEN}stopped${NC}"
}

stop_port "$BACKEND_PORT" "Backend (uvicorn)"
stop_port "$FRONTEND_PORT" "Frontend (Vite)"

if [ "$KEEP_REDIS" = true ]; then
    echo -e "  Redis (port $REDIS_PORT): ${YELLOW}kept running${NC}"
else
    stop_redis
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Event Manager stopped${NC}"
echo -e "${GREEN}========================================${NC}"
