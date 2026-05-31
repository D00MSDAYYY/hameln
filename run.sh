#!/usr/bin/env bash
# Адаптировано для Debian

# Если скрипт запущен через sh (dash), перезапускаем себя через bash
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
for arg in "$@"; do
    case $arg in
        --force)
            FORCE=true
            shift
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

echo -e "${GREEN}========================================${NC}"
if [ "$FORCE" = true ]; then
    echo -e "${GREEN}   Starting Event Manager (FORCE MODE)${NC}"
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

# Если Conda активна, но её Python сломан — деактивируем
if [[ -n "${CONDA_PREFIX:-}" ]] && ! python_sqlite_works "${CONDA_PREFIX}/bin/python"; then
    echo -e "  ${YELLOW}Conda Python has a broken sqlite3 module (likely due to xz backdoor).${NC}"
    echo -e "  ${YELLOW}Deactivating Conda and falling back to system Python...${NC}"
    
    conda deactivate 2>/dev/null || true
    unset CONDA_PREFIX
    export PATH=$(echo "$PATH" | tr ':' '\n' | grep -v "conda" | tr '\n' ':')
    
    echo -e "  ${GREEN}Conda deactivated. Now using: $(which python3)${NC}"
elif [[ -n "${CONDA_PREFIX:-}" ]]; then
    echo -e "  ${GREEN}Conda is active and sqlite3 works (good). Keeping Conda.${NC}"
else
    echo -e "  ${GREEN}No active Conda environment. Using: $(which python3)${NC}"
fi

# Определяем системный Python
SYSTEM_PYTHON=$(which python3)
if ! python_sqlite_works "$SYSTEM_PYTHON"; then
    echo -e "${RED}Error: The system Python ($SYSTEM_PYTHON) also has a broken sqlite3 module.${NC}"
    echo -e "Please fix your Python installation or reinstall Miniconda as described earlier."
    exit 1
fi
echo -e "  Using Python for venv: $SYSTEM_PYTHON ($($SYSTEM_PYTHON --version))"
echo ""

# ---------- Check prerequisites ----------
echo -e "${YELLOW}[2/8] Checking environment...${NC}"

# Python
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}Error: python3 not found. Please install Python 3: sudo apt install python3 python3-venv python3-pip${NC}"
    exit 1
fi
# python3-venv (Debian often missing)
if ! python3 -c "import venv" &>/dev/null; then
    echo -e "${RED}Error: python3-venv module not found. Install it: sudo apt install python3-venv${NC}"
    exit 1
fi

# Node.js & npm
if ! command -v node &>/dev/null; then
    echo -e "${RED}Error: Node.js not found. Please install Node.js from https://nodejs.org or using 'sudo apt install nodejs npm'${NC}"
    exit 1
fi
if ! command -v npm &>/dev/null; then
    echo -e "${RED}Error: npm not found. Please install npm: sudo apt install npm${NC}"
    exit 1
fi
echo -e "  node:     $(node -v 2>&1)"
echo -e "  npm:      $(npm -v 2>&1)"
echo ""

# ---------- Port check function (Debian-friendly) ----------
port_in_use() {
    local port=$1
    # ss is standard on Debian
    if command -v ss &>/dev/null; then
        ss -tuln | grep -q ":$port "
    elif command -v netstat &>/dev/null; then
        netstat -tuln | grep -q ":$port "
    elif command -v lsof &>/dev/null; then
        lsof -i :"$port" -sTCP:LISTEN -t &>/dev/null
    else
        # fallback: try to connect using bash's /dev/tcp
        (echo > /dev/tcp/localhost/$port) &>/dev/null
        return $?
    fi
}

get_pid_by_port() {
    local port=$1
    if command -v ss &>/dev/null; then
        ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+'
    elif command -v netstat &>/dev/null; then
        netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $NF}' | grep -oP '[0-9]+'
    elif command -v lsof &>/dev/null; then
        lsof -i :"$port" -sTCP:LISTEN -t 2>/dev/null
    fi
}

# ---------- Redis Setup & Flush (Debian: apt install redis-server) ----------
echo -e "${YELLOW}[3/8] Checking & Flushing Redis...${NC}"
if ! command -v redis-server &>/dev/null; then
    echo -e "${RED}Error: redis-server is not installed.${NC}"
    echo -e "Please install it: sudo apt install redis-server"
    echo -e "Then start: sudo systemctl enable redis-server && sudo systemctl start redis-server"
    exit 1
fi

if redis-cli ping &>/dev/null; then
    echo -e "  ${GREEN}Redis is running on port $REDIS_PORT.${NC}"
    echo -n "  Flushing all Redis data (sessions)... "
    if redis-cli flushdb > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}Failed (might require password or different config)${NC}"
    fi
else
    echo -e "  Redis is not running. Attempting to start..."
    # Debian with systemd
    if command -v systemctl &>/dev/null; then
        sudo systemctl start redis-server 2>/dev/null || sudo systemctl start redis 2>/dev/null || true
    else
        redis-server --daemonize yes 2>/dev/null || true
    fi
    
    echo -n "  Waiting for Redis to accept connections"
    for i in {1..10}; do
        if port_in_use $REDIS_PORT; then
            echo -e " ${GREEN}✓ ready${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done
    
    if ! redis-cli ping &>/dev/null; then
        echo -e "\n${RED}Error: Redis failed to start on port $REDIS_PORT.${NC}"
        echo "Try manual: sudo systemctl start redis-server"
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
            echo -e "  ${YELLOW}Existing .venv has a broken Python (sqlite3 issue). Recreating...${NC}"
            NEED_RECREATE=true
        else
            echo -e "  ${GREEN}Existing .venv looks healthy.${NC}"
        fi
    else
        echo -e "  ${YELLOW}Existing .venv is missing Python binary. Recreating...${NC}"
        NEED_RECREATE=true
    fi
fi

if [ ! -d ".venv" ] || [ "$NEED_RECREATE" = true ]; then
    if [ -d ".venv" ]; then
        rm -rf .venv
    fi
    echo "  Creating Python virtual environment .venv using $SYSTEM_PYTHON..."
    "$SYSTEM_PYTHON" -m venv .venv
fi

source .venv/bin/activate

echo "  Installing Python dependencies..."
pip install -r requirements.txt --quiet

if [ ! -f "main.py" ]; then
    echo -e "${RED}Error: main.py not found in $BACKEND_DIR${NC}"
    exit 1
fi
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

# ---------- Port check (Backend & Frontend) ----------
echo -e "${YELLOW}[6/8] Checking ports ($BACKEND_PORT, $FRONTEND_PORT)...${NC}"
for port in $BACKEND_PORT $FRONTEND_PORT; do
    service_name="Backend"
    [ $port -eq $FRONTEND_PORT ] && service_name="Frontend"
    if port_in_use $port; then
        echo -e "  Port ${port} (${service_name}) is already in use."
        
        if [ "$FORCE" = true ]; then
            echo -e "  ${YELLOW}--force flag detected. Killing process automatically.${NC}"
            pid=$(get_pid_by_port $port)
            if [ -n "$pid" ]; then
                kill "$pid" 2>/dev/null && echo "  Process PID $pid killed."
                sleep 1
            fi
        else
            read -p "  Kill the process on port $port? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                pid=$(get_pid_by_port $port)
                if [ -n "$pid" ]; then
                    kill "$pid" 2>/dev/null && echo "  Process PID $pid killed."
                    sleep 1
                fi
            else
                echo -e "${RED}  Cannot continue, port $port is in use.${NC}"
                exit 1
            fi
        fi
    fi
done
echo ""

# ---------- Start servers ----------
echo -e "${GREEN}[7/8] Starting servers...${NC}"

# Backend
echo -e "  Launching backend (uvicorn) on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
source .venv/bin/activate
touch "$BACKEND_LOG"
nohup uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo -n "  Waiting for backend to be ready"
for i in {1..15}; do
    if port_in_use $BACKEND_PORT; then
        echo -e " ${GREEN}✓ ready${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
if ! port_in_use $BACKEND_PORT; then
    echo -e "\n${RED}Error: backend did not start within 15 seconds.${NC}"
    echo "Last 10 lines of log:"
    tail -n 10 "$BACKEND_LOG"
    exit 1
fi

# Frontend
echo -e "  Launching frontend (Vite) on port $FRONTEND_PORT..."
cd "$FRONTEND_DIR"
touch "$FRONTEND_LOG"
nohup npm run dev -- --host > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
echo -n "  Waiting for frontend to be ready"
for i in {1..5}; do
    if port_in_use $FRONTEND_PORT; then
        echo -e " ${GREEN}✓ ready${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
if ! port_in_use $FRONTEND_PORT; then
    echo -e "\n${RED}Error: frontend did not start within 15 seconds.${NC}"
    echo "Last 10 lines of log:"
    tail -n 10 "$FRONTEND_LOG"
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