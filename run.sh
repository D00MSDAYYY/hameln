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

# ---------- Parse Arguments ----------
FORCE=false
RESET=false
usage() {
    echo "Usage: ./run.sh [--force] [--reset]"
}

for arg in "$@"; do
    case $arg in
        --force)
            FORCE=true
            ;;
        --reset)
            RESET=true
            ;;
        *)
            echo -e "${RED}Unknown argument: $arg${NC}"
            usage
            exit 1
            ;;
    esac
done

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_LOG="$BACKEND_DIR/backend.log"
FRONTEND_LOG="$FRONTEND_DIR/frontend.log"
BACKEND_PORT=8000
FRONTEND_PORT=5173
REDIS_PORT=6379
BACKEND_APP="main.py"

echo -e "${GREEN}========================================${NC}"
if [ "$FORCE" = true ]; then
    echo -e "${GREEN}   Starting Event Manager (FORCE MODE)${NC}"
elif [ "$RESET" = true ]; then
    echo -e "${GREEN}   Starting Event Manager (RESET MODE)${NC}"
else
    echo -e "${GREEN}   Starting Event Manager${NC}"
fi
echo -e "${GREEN}   (Redis + Backend + Frontend)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ---------- Function: test if a given python has working sqlite3 ----------
python_sqlite_works() {
    local python_bin="$1"
    "$python_bin" -c "import sqlite3; sqlite3.connect(':memory:')" 2>/dev/null
}

# ---------- CHECK & FIX BROKEN CONDA / SQLITE ----------
echo -e "${YELLOW}[1/8] Checking for Conda Python / SQLite issues...${NC}"
if [[ -n "${CONDA_PREFIX:-}" ]] && ! python_sqlite_works "${CONDA_PREFIX}/bin/python"; then
    echo -e "  ${YELLOW}Conda Python has a broken sqlite3 module. Deactivating...${NC}"
    conda deactivate 2>/dev/null || true
    unset CONDA_PREFIX
    export PATH=$(echo "$PATH" | tr ':' '\n' | grep -v "conda" | tr '\n' ':')
    echo -e "  ${GREEN}Conda deactivated. Now using: $(which python3)${NC}"
elif [[ -n "${CONDA_PREFIX:-}" ]]; then
    echo -e "  ${GREEN}Conda is active and sqlite3 works.${NC}"
else
    echo -e "  ${GREEN}No active Conda. Using: $(which python3)${NC}"
fi

SYSTEM_PYTHON=$(which python3)
if ! python_sqlite_works "$SYSTEM_PYTHON"; then
    echo -e "${RED}Error: System Python has broken sqlite3.${NC}"
    exit 1
fi
echo -e "  Using Python for venv: $SYSTEM_PYTHON ($($SYSTEM_PYTHON --version))"
echo ""

# ---------- Check prerequisites ----------
echo -e "${YELLOW}[2/8] Checking environment...${NC}"
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}Error: python3 not found.${NC}"
    exit 1
fi
if ! command -v node &>/dev/null; then
    echo -e "${RED}Error: Node.js not found.${NC}"
    exit 1
fi
if ! command -v npm &>/dev/null; then
    echo -e "${RED}Error: npm not found.${NC}"
    exit 1
fi
echo -e "  node:     $(node -v 2>&1)"
echo -e "  npm:      $(npm -v 2>&1)"
echo ""

# ---------- Port check function (works on macOS & Linux) ----------
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
    # macOS
    if command -v lsof &>/dev/null; then
        lsof -i :"$port" -sTCP:LISTEN -t 2>/dev/null
    # Linux with ss
    elif command -v ss &>/dev/null; then
        ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' 2>/dev/null
    # Linux with netstat
    elif command -v netstat &>/dev/null; then
        netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $NF}' | grep -oE '[0-9]+'
    fi
}

# ---------- Redis Setup ----------
echo -e "${YELLOW}[3/8] Checking Redis...${NC}"
if ! command -v redis-server &>/dev/null; then
    echo -e "${RED}Error: redis-server not installed.${NC}"
    echo "Install:  macOS: brew install redis"
    echo "          Debian: sudo apt install redis-server"
    exit 1
fi

if redis-cli ping &>/dev/null; then
    echo -e "  ${GREEN}Redis running on port $REDIS_PORT.${NC}"
    echo -n "  Flushing Redis... "
    redis-cli flushdb > /dev/null 2>&1 && echo -e "${GREEN}OK${NC}" || echo -e "${RED}Failed${NC}"
else
    echo -e "  Redis not running. Starting..."
    if command -v brew &>/dev/null && brew services list | grep -q redis; then
        brew services start redis
    elif command -v systemctl &>/dev/null; then
        sudo systemctl start redis-server || sudo systemctl start redis
    else
        redis-server --daemonize yes
    fi
    sleep 2
    if ! redis-cli ping &>/dev/null; then
        echo -e "${RED}Error: Redis failed to start.${NC}"
        exit 1
    fi
    redis-cli flushdb > /dev/null 2>&1 || true
fi
echo ""

# ---------- Backend setup ----------
echo -e "${YELLOW}[4/8] Setting up backend...${NC}"
cd "$BACKEND_DIR"

VENV_PYTHON="$BACKEND_DIR/.venv/bin/python"
NEED_RECREATE=false

if [ -d ".venv" ]; then
    if [ -f "$VENV_PYTHON" ]; then
        if ! python_sqlite_works "$VENV_PYTHON"; then
            echo -e "  ${YELLOW}Broken .venv detected. Recreating...${NC}"
            NEED_RECREATE=true
        else
            echo -e "  ${GREEN}Existing .venv healthy.${NC}"
        fi
    else
        NEED_RECREATE=true
    fi
fi

if [ ! -d ".venv" ] || [ "$NEED_RECREATE" = true ]; then
    [ -d ".venv" ] && rm -rf .venv
    echo "  Creating virtual environment..."
    "$SYSTEM_PYTHON" -m venv .venv
fi

source .venv/bin/activate
echo "  Installing Python dependencies..."
pip install -r requirements.txt --quiet

if [ ! -f "main.py" ]; then
    echo -e "${RED}Error: main.py not found in $BACKEND_DIR${NC}"
    exit 1
fi

echo "  Checking backend app..."
"$VENV_PYTHON" -m py_compile main.py
echo ""

# ---------- Frontend setup ----------
echo -e "${YELLOW}[5/8] Setting up frontend...${NC}"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "  Installing npm packages..."
    npm install --silent
else
    echo "  npm packages already installed."
fi
echo ""

# ---------- Port killing with --force ----------
echo -e "${YELLOW}[6/8] Checking ports ($BACKEND_PORT, $FRONTEND_PORT)...${NC}"
for port in $BACKEND_PORT $FRONTEND_PORT; do
    service_name="Backend"
    [ $port -eq $FRONTEND_PORT ] && service_name="Frontend"
    if port_in_use "$port"; then
        echo -e "  Port ${port} (${service_name}) is already in use."
        if [ "$FORCE" = true ]; then
            echo -e "  ${YELLOW}--force: killing process on port $port${NC}"
            pid=$(get_pid_by_port "$port")
            if [ -n "$pid" ]; then
                kill -9 "$pid" 2>/dev/null && echo "  Killed PID $pid"
                sleep 1
            else
                echo -e "  ${YELLOW}Could not detect PID, skipping.${NC}"
            fi
        else
            read -p "  Kill the process on port $port? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                pid=$(get_pid_by_port "$port")
                [ -n "$pid" ] && kill "$pid" 2>/dev/null && sleep 1
            else
                echo -e "${RED}Port $port is busy, cannot continue.${NC}"
                exit 1
            fi
        fi
    fi
done
echo ""

# ---------- Optional full local reset ----------
if [ "$RESET" = true ]; then
    echo -e "${YELLOW}[reset] Removing local runtime state...${NC}"
    rm -f "$BACKEND_DIR/hameln.db"
    rm -f "$BACKEND_LOG" "$FRONTEND_LOG"
    rm -rf "$FRONTEND_DIR/dist"
    echo -e "  ${GREEN}Local database, logs and frontend build removed.${NC}"
    echo ""
fi

# ---------- Start servers ----------
echo -e "${GREEN}[7/8] Starting servers...${NC}"

# Backend
echo -e "  Launching backend on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
source .venv/bin/activate
touch "$BACKEND_LOG"
nohup "$VENV_PYTHON" "$BACKEND_APP" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo -n "  Waiting for backend"
for i in {1..15}; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "\n${RED}Error: backend process exited during startup.${NC}"
        tail -n 20 "$BACKEND_LOG"
        exit 1
    fi
    if port_in_use "$BACKEND_PORT"; then
        echo -e " ${GREEN}✓ ready${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
if ! port_in_use "$BACKEND_PORT"; then
    echo -e "\n${RED}Error: backend did not start within 15 seconds.${NC}"
    tail -n 20 "$BACKEND_LOG"
    exit 1
fi

# Frontend
echo -e "  Launching frontend on port $FRONTEND_PORT..."
cd "$FRONTEND_DIR"
touch "$FRONTEND_LOG"
nohup npm run dev -- --host > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
echo -n "  Waiting for frontend"
for i in {1..15}; do
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "\n${RED}Error: frontend process exited during startup.${NC}"
        tail -n 20 "$FRONTEND_LOG"
        exit 1
    fi
    if port_in_use "$FRONTEND_PORT"; then
        echo -e " ${GREEN}✓ ready${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
if ! port_in_use "$FRONTEND_PORT"; then
    echo -e "\n${RED}Error: frontend did not start within 15 seconds.${NC}"
    tail -n 20 "$FRONTEND_LOG"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All services started successfully!${NC}"
echo -e "${GREEN}  Redis:    localhost:$REDIS_PORT (Flushed)${NC}"
echo -e "${GREEN}  Backend:  http://localhost:$BACKEND_PORT${NC}"
echo -e "${GREEN}  Frontend: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${GREEN}  Backend log:  $BACKEND_LOG${NC}"
echo -e "${GREEN}  Frontend log: $FRONTEND_LOG${NC}"
echo -e "${GREEN}========================================${NC}"
