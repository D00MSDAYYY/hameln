#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_LOG="$BACKEND_DIR/backend.log"
FRONTEND_LOG="$FRONTEND_DIR/frontend.log"
BACKEND_PORT=8000
FRONTEND_PORT=5173

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Starting Event Manager (backend + frontend)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ---------- Check prerequisites ----------
echo -e "${YELLOW}[1/5] Checking environment...${NC}"
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}Error: python3 not found. Please install Python 3.${NC}"
    exit 1
fi
if ! command -v node &>/dev/null; then
    echo -e "${RED}Error: Node.js not found. Please install Node.js.${NC}"
    exit 1
fi
if ! command -v npm &>/dev/null; then
    echo -e "${RED}Error: npm not found. Please install npm.${NC}"
    exit 1
fi
echo -e "  python3:  $(python3 --version 2>&1)"
echo -e "  node:     $(node -v 2>&1)"
echo -e "  npm:      $(npm -v 2>&1)"
echo ""

# Function to check if a port is in use
port_in_use() {
    local port=$1
    if command -v lsof &>/dev/null; then
        lsof -i :"$port" -sTCP:LISTEN -t &>/dev/null
    elif command -v ss &>/dev/null; then
        ss -tuln | grep -q ":$port "
    elif command -v netstat &>/dev/null; then
        netstat -tuln | grep -q ":$port "
    else
        echo -e "${RED}No tool to check ports (lsof, ss, netstat). Please install lsof.${NC}"
        exit 1
    fi
}

# Function to get the PID of a process listening on a port
get_pid_by_port() {
    local port=$1
    if command -v lsof &>/dev/null; then
        lsof -i :"$port" -sTCP:LISTEN -t 2>/dev/null
    elif command -v ss &>/dev/null; then
        ss -tlnp | grep ":$port " | grep -oP 'pid=\K[0-9]+'
    elif command -v netstat &>/dev/null; then
        netstat -tlnp | grep ":$port " | awk '{print $NF}' | grep -oP '[0-9]+'
    fi
}

# ---------- Backend setup ----------
echo -e "${YELLOW}[2/5] Setting up backend...${NC}"
cd "$BACKEND_DIR"
if [ ! -d ".env" ]; then
    echo "  Creating Python virtual environment .env..."
    python3 -m venv .env
fi
source .env/bin/activate

echo "  Installing Python dependencies (fastapi, uvicorn, pydantic)..."
pip install fastapi uvicorn[standard] pydantic sqlmodel pydantic_visible_fields

echo "  Python dependencies already installed."
fi
if [ ! -f "main.py" ]; then
    echo -e "${RED}Error: main.py not found in $BACKEND_DIR${NC}"
    exit 1
fi
echo ""

# ---------- Frontend setup ----------
echo -e "${YELLOW}[3/5] Setting up frontend...${NC}"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "  Installing npm packages..."
    npm install --silent
else
    echo "  npm packages already installed."
fi
echo ""

# ---------- Port check ----------
echo -e "${YELLOW}[4/5] Checking ports...${NC}"
for port in $BACKEND_PORT $FRONTEND_PORT; do
    service_name="Backend"
    [ $port -eq $FRONTEND_PORT ] && service_name="Frontend"
    if port_in_use $port; then
        echo -e "  Port ${port} (${service_name}) is already in use."
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
done
echo ""

# ---------- Start servers ----------
echo -e "${GREEN}[5/5] Starting servers...${NC}"

# Backend
echo -e "  Launching backend (uvicorn) on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
source .env/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo -n "  Waiting for backend to be ready"
for i in {1..10}; do
    if port_in_use $BACKEND_PORT; then
        echo -e " ${GREEN}✓ ready${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
if ! port_in_use $BACKEND_PORT; then
    echo -e "\n${RED}Error: backend did not start within 10 seconds.${NC}"
    echo "Last 10 lines of log:"
    tail -n 10 "$BACKEND_LOG"
    exit 1
fi

# Frontend
echo -e "  Launching frontend (Vite) on port $FRONTEND_PORT..."
cd "$FRONTEND_DIR"
nohup npm run dev -- --host > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
echo -n "  Waiting for frontend to be ready"
for i in {1..10}; do
    if port_in_use $FRONTEND_PORT; then
        echo -e " ${GREEN}✓ ready${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
if ! port_in_use $FRONTEND_PORT; then
    echo -e "\n${RED}Error: frontend did not start within 10 seconds.${NC}"
    echo "Last 10 lines of log:"
    tail -n 10 "$FRONTEND_LOG"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Both servers started successfully!${NC}"
echo -e "${GREEN}  Backend:  http://<IP>:$BACKEND_PORT${NC}"
echo -e "${GREEN}  Frontend: http://<IP>:$FRONTEND_PORT${NC}"
echo -e "${GREEN}  Backend log:  $BACKEND_LOG${NC}"
echo -e "${GREEN}  Frontend log: $FRONTEND_LOG${NC}"
echo -e "${GREEN}========================================${NC}"