#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  MindBridge — One-Command Setup & Run Script (Mac / Linux)
#  Usage:  chmod +x scripts/setup_and_run.sh && ./scripts/setup_and_run.sh
# ═══════════════════════════════════════════════════════════════════
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

banner() { echo -e "\n${CYAN}${BOLD}$1${NC}\n"; }
ok()     { echo -e "${GREEN}✓${NC} $1"; }
warn()   { echo -e "${YELLOW}⚠${NC}  $1"; }
info()   { echo -e "  $1"; }

clear
echo -e "${CYAN}${BOLD}"
echo "  ███╗   ███╗██╗███╗   ██╗██████╗ ██████╗ ██████╗ ██╗██████╗  ██████╗ ███████╗"
echo "  ████╗ ████║██║████╗  ██║██╔══██╗██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝"
echo "  ██╔████╔██║██║██╔██╗ ██║██║  ██║██████╔╝██████╔╝██║██║  ██║██║  ███╗█████╗  "
echo "  ██║╚██╔╝██║██║██║╚██╗██║██║  ██║██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝  "
echo "  ██║ ╚═╝ ██║██║██║ ╚████║██████╔╝██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗"
echo "  ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝"
echo -e "${NC}"
echo -e "  ${BOLD}AI-Based Anonymous Chat Platform for Peer Mental Health Support${NC}"
echo ""

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Check prerequisites ───────────────────────────────────
banner "Checking prerequisites..."
command -v python3 &>/dev/null && ok "Python3 found" || { echo -e "${RED}✗ Python3 not found. Install from https://python.org${NC}"; exit 1; }
command -v node   &>/dev/null && ok "Node.js found" || { echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"; exit 1; }
command -v npm    &>/dev/null && ok "npm found"     || { echo -e "${RED}✗ npm not found.${NC}"; exit 1; }

# ── Backend setup ─────────────────────────────────────────
banner "Setting up Python backend..."
cd "$BACKEND"

if [ ! -d "venv" ]; then
  info "Creating virtual environment..."
  python3 -m venv venv
  ok "Virtual environment created"
fi

info "Activating virtual environment..."
source venv/bin/activate

info "Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet Django==4.2.9 djangorestframework==3.14.0 django-cors-headers==4.3.1 channels==4.0.0 daphne==4.0.0 whitenoise==6.6.0
ok "Python dependencies installed"

info "Running database migrations..."
python manage.py makemigrations users chat moderation dashboard --no-input 2>/dev/null || true
python manage.py makemigrations --no-input 2>/dev/null || true
python manage.py migrate --no-input
ok "Database ready (SQLite)"

info "Seeding chat rooms and sample data..."
python manage.py seed_rooms
ok "Sample data loaded"

# ── Frontend setup ────────────────────────────────────────
banner "Setting up React frontend..."
cd "$FRONTEND"

if [ ! -d "node_modules" ]; then
  info "Installing Node dependencies (this may take 1-2 minutes)..."
  npm install --silent
  ok "Node dependencies installed"
else
  ok "Node dependencies already installed"
fi

# ── Launch both servers ───────────────────────────────────
banner "Launching MindBridge..."
echo -e "  ${BOLD}Backend${NC}  → ${CYAN}http://localhost:8000${NC}  (Django API + WebSocket)"
echo -e "  ${BOLD}Frontend${NC} → ${CYAN}http://localhost:3000${NC}  (React app)"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Start backend in background
cd "$BACKEND"
source venv/bin/activate
python manage.py runserver 8000 &
BACKEND_PID=$!

# Small pause then start frontend
sleep 2
cd "$FRONTEND"
npm start &
FRONTEND_PID=$!

# Clean shutdown on Ctrl+C
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait $FRONTEND_PID
