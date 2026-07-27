#!/usr/bin/env bash
# Usta Production Server Installer
# Run as root on Ubuntu 22.04+
# Usage: bash install-server.sh <server-ip-or-domain>
set -euo pipefail

REPO="https://github.com/DilyorbekAbdujabborov/usta-prod.git"
INSTALL_DIR="/root/usta_prod"
SERVER="${1:-}"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

if [ -z "$SERVER" ]; then
  info "Usage: bash install-server.sh <server-ip-or-domain>"
  info "Example: bash install-server.sh 123.123.123.123"
  info "Example: bash install-server.sh mydomain.com"
  exit 1
fi

# Detect IP or domain
if [[ "$SERVER" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  IS_IP=true
  PROTO="http"
  info "Server type: IP ($SERVER) — HTTP only (no SSL)"
else
  IS_IP=false
  PROTO="https"
  info "Server type: Domain ($SERVER) — with SSL"
fi

info "===== Usta Production Setup ====="
info "Server: $SERVER"
info "Protocol: $PROTO"
info "Install dir: $INSTALL_DIR"
echo ""

# ── 1. System packages ──────────────────────────────────────────────
info "[1/9] Installing system packages..."
apt-get update -qq
apt-get install -y -qq nginx python3 python3-venv python3-pip \
  git curl ca-certificates gnupg libpq-dev
if [ "$IS_IP" = false ]; then
  apt-get install -y -qq certbot python3-certbot-nginx
fi

# Node.js 20 from NodeSource (Ubuntu's own nodejs is too old for Vite 6).
# Do NOT use "apt-get install yarn" — on Debian/Ubuntu that package is
# cmdtest, an unrelated Python tool that hijacks /usr/bin/yarn.
for pkg in yarn cmdtest; do
  if dpkg -s "$pkg" >/dev/null 2>&1; then
    info "Removing apt package '$pkg' (cmdtest hijacks /usr/bin/yarn)..."
    apt-get remove -y -qq "$pkg"
  fi
done

NODE_MAJOR_REQUIRED=20
node_major=0
if command -v node >/dev/null 2>&1; then
  node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
fi
if [ "$node_major" -lt "$NODE_MAJOR_REQUIRED" ]; then
  info "Installing Node.js ${NODE_MAJOR_REQUIRED}.x from NodeSource (found major: $node_major)..."
  # Ubuntu's npm/libnode-dev packages own files that NodeSource's nodejs also
  # ships (e.g. /usr/share/man/man1/npm.1.gz), so dpkg aborts unless they go
  # first. NodeSource nodejs bundles its own npm.
  for pkg in npm libnode-dev nodejs-doc; do
    if dpkg -s "$pkg" >/dev/null 2>&1; then
      info "Removing conflicting apt package '$pkg'..."
      apt-get remove -y -qq "$pkg"
    fi
  done
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR_REQUIRED}.x" | bash -
  apt-get install -y -qq nodejs
fi

# Real yarn, via npm (which ships with NodeSource nodejs)
if ! yarn --version >/dev/null 2>&1; then
  npm install -g --silent yarn
fi
info "node $(node --version) / npm $(npm --version) / yarn $(yarn --version)"
ok "System packages installed"

# ── 2. Clone repo ───────────────────────────────────────────────────
info "[2/9] Cloning repository..."
if [ -d "$INSTALL_DIR" ]; then
  info "Directory exists, pulling latest..."
  cd "$INSTALL_DIR" && git pull
else
  git clone "$REPO" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"
ok "Repository cloned"

# ── 3. Backend .env ─────────────────────────────────────────────────
info "[3/9] Configuring backend environment..."
if [ ! -f "$INSTALL_DIR/usta-backend/.env" ]; then
  cp "$INSTALL_DIR/usta-backend/.env.example" "$INSTALL_DIR/usta-backend/.env"
  DJANGO_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
  sed -i "s/change-me-to-a-real-secret-key/$DJANGO_SECRET/" "$INSTALL_DIR/usta-backend/.env"
  sed -i "s/your-domain.com/$SERVER/g" "$INSTALL_DIR/usta-backend/.env"
  ok ".env created with random secret key"
else
  info ".env already exists, updating ALLOWED_HOSTS..."
  sed -i "s/ALLOWED_HOSTS=.*/ALLOWED_HOSTS=localhost,127.0.0.1,$SERVER/" "$INSTALL_DIR/usta-backend/.env"
fi

# ── 4. Frontend .env ────────────────────────────────────────────────
info "[4/9] Configuring frontend environment..."
cat > "$INSTALL_DIR/ustalaruz/.env" <<EOF
VITE_API_BASE_URL=$PROTO://$SERVER/api
EOF
ok "Frontend .env configured"

# ── 5. Python virtual environment ───────────────────────────────────
info "[5/9] Setting up Python virtual environment..."
python3 -m venv "$INSTALL_DIR/usta-backend/venv"
source "$INSTALL_DIR/usta-backend/venv/bin/activate"
pip install --upgrade pip -q
pip install -r "$INSTALL_DIR/usta-backend/requirements.txt" -q
pip install gunicorn -q
ok "Python venv ready"

# ── 6. Django setup ─────────────────────────────────────────────────
info "[6/9] Running Django migrations and collecting static files..."
cd "$INSTALL_DIR/usta-backend"
source venv/bin/activate
mkdir -p logs
python manage.py migrate --run-syncdb
python manage.py createcachetable || true
python manage.py collectstatic --noinput --clear
cd "$INSTALL_DIR"
ok "Django ready"

# ── 7. Frontend build ───────────────────────────────────────────────
info "[7/9] Building frontend..."
cd "$INSTALL_DIR/ustalaruz"
# Clean install on the target platform. yarn ignores package-lock.json, which
# is what we want: that lockfile can pin native optional deps
# (@tailwindcss/oxide, rollup) for a different OS/arch. Leave it on disk so
# `git pull` on step 2 stays clean.
rm -rf node_modules yarn.lock
yarn install --non-interactive 2>&1 | tail -20
node -e "require('@tailwindcss/oxide')" \
  || fail "Native binding @tailwindcss/oxide missing after yarn install"
yarn build 2>&1
[ -f dist/index.html ] || fail "Frontend build produced no dist/index.html"
cd "$INSTALL_DIR"
ok "Frontend built"

# ── 8. Nginx configuration ──────────────────────────────────────────
info "[8/9] Configuring Nginx..."
sed "s|/root/usta_prod|$INSTALL_DIR|g" \
  "$INSTALL_DIR/usta_nginx.conf" > /etc/nginx/sites-available/usta

if [ -f /etc/nginx/sites-enabled/default ]; then
  rm /etc/nginx/sites-enabled/default
fi
if [ ! -f /etc/nginx/sites-enabled/usta ]; then
  ln -s /etc/nginx/sites-available/usta /etc/nginx/sites-enabled/
fi

# Ensure proxy_params exists
if [ ! -f /etc/nginx/proxy_params ]; then
  cat > /etc/nginx/proxy_params <<'EOF'
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
EOF
fi

nginx -t || fail "Nginx config test failed"
systemctl restart nginx
ok "Nginx configured and running"

# ── 9. Gunicorn systemd service ─────────────────────────────────────
info "[9/9] Creating Gunicorn systemd service..."
cat > /etc/systemd/system/usta-gunicorn.service <<UNIT
[Unit]
Description=Usta Django Gunicorn
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$INSTALL_DIR/usta-backend
EnvironmentFile=$INSTALL_DIR/usta-backend/.env
ExecStart=$INSTALL_DIR/usta-backend/venv/bin/gunicorn \\
  --config $INSTALL_DIR/usta-backend/gunicorn.conf.py
ExecReload=/bin/kill -s HUP \$MAINPID
ExecStop=/bin/kill -s TERM \$MAINPID
Restart=on-failure
RestartSec=5
StandardOutput=append:$INSTALL_DIR/usta-backend/logs/gunicorn_access.log
StandardError=append:$INSTALL_DIR/usta-backend/logs/gunicorn_error.log

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable usta-gunicorn
systemctl restart usta-gunicorn
ok "Gunicorn service started"

# ── Done ────────────────────────────────────────────────────────────
echo ""
ok "====== Setup complete ======"
ok "App is running at: http://$SERVER"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  1. Create superuser:"
echo "     cd $INSTALL_DIR/usta-backend && source venv/bin/activate && python manage.py createsuperuser"
echo ""
echo "  2. Check service status:"
echo "     systemctl status usta-gunicorn --no-pager -l"
echo "     systemctl status nginx --no-pager -l"
echo ""
echo "  3. View logs:"
echo "     tail -f $INSTALL_DIR/usta-backend/logs/gunicorn_error.log"
echo ""
echo "  4. Edit environment variables:"
echo "     nano $INSTALL_DIR/usta-backend/.env"
if [ "$IS_IP" = false ]; then
  echo ""
  echo "  5. SSL certificate:"
  echo "     certbot --nginx -d $SERVER -d www.$SERVER"
fi
