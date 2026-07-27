#!/usr/bin/env bash
# Usta Production Server Installer
# Run as root on Ubuntu 22.04+
# Usage: bash install-server.sh
set -euo pipefail

REPO="https://github.com/DilyorbekAbdujabborov/usta-prod.git"
INSTALL_DIR="/root/usta_prod"
DOMAIN="${1:-your-domain.com}"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

info "===== Usta Production Server Setup ====="
info "Domain: $DOMAIN"
info "Install dir: $INSTALL_DIR"
echo ""

# ── 1. System packages ──────────────────────────────────────────────
info "[1/9] Installing system packages..."
apt-get update -qq
apt-get install -y -qq nginx python3 python3-venv python3-pip \
  nodejs npm certbot python3-certbot-nginx git curl libpq-dev
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
  sed -i "s/your-domain.com/$DOMAIN/g" "$INSTALL_DIR/usta-backend/.env"
  ok ".env created with random secret key"
else
  info ".env already exists, skipping"
fi

# ── 4. Frontend .env ────────────────────────────────────────────────
info "[4/9] Configuring frontend environment..."
cat > "$INSTALL_DIR/ustalaruz/.env" <<EOF
VITE_API_BASE_URL=https://$DOMAIN/api
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
npm install
npm run build
cd "$INSTALL_DIR"
ok "Frontend built"

# ── 8. Nginx configuration ──────────────────────────────────────────
info "[8/9] Configuring Nginx..."
sed "s|your-domain.com|$DOMAIN|g; s|/root/usta_prod|$INSTALL_DIR|g" \
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
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  1. SSL certificate (HTTPS):"
echo "     certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "  2. Create superuser:"
echo "     cd $INSTALL_DIR/usta-backend && source venv/bin/activate && python manage.py createsuperuser"
echo ""
echo "  3. Check service status:"
echo "     systemctl status usta-gunicorn --no-pager -l"
echo "     systemctl status nginx --no-pager -l"
echo ""
echo "  4. View logs:"
echo "     tail -f $INSTALL_DIR/usta-backend/logs/gunicorn_error.log"
echo ""
echo "  5. Edit environment variables:"
echo "     nano $INSTALL_DIR/usta-backend/.env"
