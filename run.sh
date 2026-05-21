#!/usr/bin/env bash
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

# ---------- Check prerequisites ----------
echo -e "${YELLOW}[1/6] Checking environment...${NC}"
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
        # Fallback: try to connect via bash tcp redirection
        (echo > /dev/tcp/localhost/$port) &>/dev/null
        return $?
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

# ---------- Redis Setup & Flush ----------
echo -e "${YELLOW}[2/6] Checking & Flushing Redis...${NC}"
if ! command -v redis-server &>/dev/null; then
    echo -e "${RED}Error: redis-server is not installed.${NC}"
    echo -e "Please install it:"
    echo -e "  macOS: brew install redis"
    echo -e "  Linux: sudo apt install redis-server"
    echo -e "  Docker: docker run -d -p 6379:6379 redis"
    exit 1
fi

if redis-cli ping &>/dev/null; then
    echo -e "  ${GREEN}Redis is running on port $REDIS_PORT.${NC}"
    echo -n "  Flushing all Redis data (sessions)... "
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}Failed (might require password or different config)${NC}"
    fi
else
    echo -e "  Redis is not running. Attempting to start..."
    # Try standard start methods
    if command -v brew &>/dev/null && brew services list | grep -q redis; then
        brew services start redis
    elif command -v systemctl &>/dev/null; then
        sudo systemctl start redis-server || sudo systemctl start redis
    elif command -v redis-server &>/dev/null; then
        # Start in background if no service manager found
        redis-server --daemonize yes
    else
        echo -e "${RED}Could not start Redis automatically.${NC}"
        exit 1
    fi
    
    # Wait for Redis to start
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
        exit 1
    fi
    
    # Flush after start just in case
    redis-cli FLUSHDB > /dev/null 2>&1 || true
fi
echo ""

# ---------- Backend setup ----------
echo -e "${YELLOW}[3/6] Setting up backend...${NC}"
cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
    echo "  Creating Python virtual environment .venv..."
    python3 -m venv .venv
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
echo -e "${YELLOW}[4/6] Setting up frontend...${NC}"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "  Installing npm packages..."
    npm install --silent
else
    echo "  npm packages already installed."
fi
echo ""

# ---------- Port check (Backend & Frontend) ----------
echo -e "${YELLOW}[5/6] Checking ports ($BACKEND_PORT, $FRONTEND_PORT)...${NC}"
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
echo -e "${GREEN}[6/6] Starting servers...${NC}"

# Backend
echo -e "  Launching backend (uvicorn) on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
source .venv/bin/activate
# Ensure log file exists
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
for i in {1..15}; do
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