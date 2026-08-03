#!/usr/bin/env bash
# OurID Passport Wrapper (FastAPI) installer
# Run as root on the same server as install-server.sh, after that script has
# already installed nginx/certbot/proxy_params.
# Usage: bash install-id-passport.sh [email-for-ssl]
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$REPO_DIR/id-passport"
DOMAIN="id.mastergroup.uz"
CERTBOT_EMAIL="${1:-}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

[ "$(id -u)" = "0" ] || fail "Run as root"
[ -d "$APP_DIR" ] || fail "Not found: $APP_DIR"

info "===== id.mastergroup.uz (OurID Passport Wrapper) Setup ====="

# ── 1. System packages ──────────────────────────────────────────────
info "[1/5] Installing system packages..."
apt-get update -qq
apt-get install -y -qq nginx python3 python3-venv python3-pip certbot python3-certbot-nginx

# ── 2. Python virtual environment ───────────────────────────────────
info "[2/5] Setting up Python virtual environment..."
python3 -m venv "$APP_DIR/venv"
source "$APP_DIR/venv/bin/activate"
pip install --upgrade pip -q
pip install -r "$APP_DIR/requirements.txt" -q
ok "Python venv ready"

# ── 3. Environment file + API key ───────────────────────────────────
info "[3/5] Configuring environment file..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  info "  -> Created $APP_DIR/.env from example (edit TARGET_URL if needed)"
fi

if ! grep -q "^API_KEY_HASH=.\+" "$APP_DIR/.env"; then
  API_KEY="$(openssl rand -hex 32)"
  API_KEY_HASH="$(printf '%s' "$API_KEY" | sha256sum | cut -d' ' -f1)"
  if grep -q "^API_KEY_HASH=" "$APP_DIR/.env"; then
    sed -i "s|^API_KEY_HASH=.*|API_KEY_HASH=$API_KEY_HASH|" "$APP_DIR/.env"
  else
    echo "API_KEY_HASH=$API_KEY_HASH" >> "$APP_DIR/.env"
  fi
  warn "Generated a new API key - save this now, it is shown only once and"
  warn "cannot be recovered from the hash stored in .env:"
  echo ""
  echo "  X-API-Key: $API_KEY"
  echo ""
fi

# ── 4. Nginx site ────────────────────────────────────────────────────
info "[4/5] Configuring Nginx..."
cp "$REPO_DIR/id_nginx.conf" /etc/nginx/sites-available/id-passport
if [ ! -f /etc/nginx/sites-enabled/id-passport ]; then
  ln -s /etc/nginx/sites-available/id-passport /etc/nginx/sites-enabled/
fi
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
ok "Nginx configured"

# ── 5. systemd service ───────────────────────────────────────────────
info "[5/5] Creating systemd service..."
cat > /etc/systemd/system/id-passport.service <<UNIT
[Unit]
Description=OurID Passport Wrapper (FastAPI/uvicorn)
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --workers 2
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable id-passport
systemctl restart id-passport
ok "id-passport service started on :8001"

# ── SSL ──────────────────────────────────────────────────────────────
if [ -n "$CERTBOT_EMAIL" ]; then
  info "Requesting SSL cert for $DOMAIN..."
  certbot --nginx -n --agree-tos -m "$CERTBOT_EMAIL" --redirect -d "$DOMAIN" \
    || warn "certbot failed — site is up on HTTP; run manually: certbot --nginx -d $DOMAIN"
else
  warn "No email given — skipping SSL. Run: certbot --nginx -d $DOMAIN"
fi

echo ""
ok "===== Done ====="
echo "  Check: curl -H 'Host: $DOMAIN' http://127.0.0.1/api/get-passport-data"
echo "  Logs:  journalctl -u id-passport -n 50 --no-pager"
