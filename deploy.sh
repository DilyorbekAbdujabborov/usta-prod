#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$REPO_DIR/usta-backend"
FRONTEND_DIR="$REPO_DIR/ustalaruz"

DOMAIN="${1:-your-domain.com}"

echo "=== Usta Production Setup ==="
echo "Repo dir: $REPO_DIR"
echo "Domain:   $DOMAIN"
echo ""

# ── 1. System dependencies ──────────────────────────────────────────
echo "[1/8] Installing system packages..."
apt-get update -qq
apt-get install -y -qq nginx python3 python3-venv python3-pip nodejs npm certbot python3-certbot-nginx

# ── 2. Logs directory ───────────────────────────────────────────────
echo "[2/8] Creating log directories..."
mkdir -p "$BACKEND_DIR/logs"

# ── 3. Python virtual environment ───────────────────────────────────
echo "[3/8] Setting up Python virtual environment..."
python3 -m venv "$BACKEND_DIR/venv"
source "$BACKEND_DIR/venv/bin/activate"
pip install --upgrade pip -q
pip install -r "$BACKEND_DIR/requirements.txt" -q
pip install gunicorn -q

# ── 4. Environment files ────────────────────────────────────────────
echo "[4/8] Configuring environment files..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo "  -> Created $BACKEND_DIR/.env from example"
    echo "  -> IMPORTANT: Edit $BACKEND_DIR/.env with real values!"
fi

# ── 5. Django setup ─────────────────────────────────────────────────
echo "[5/8] Running Django migrations and collecting static files..."
cd "$BACKEND_DIR"
source "$BACKEND_DIR/venv/bin/activate"
python manage.py migrate --run-syncdb
python manage.py createcachetable --dry-run 2>/dev/null || python manage.py createcachetable
python manage.py collectstatic --noinput --clear
cd "$REPO_DIR"

# ── 6. Frontend build ───────────────────────────────────────────────
echo "[6/8] Building frontend..."
if [ ! -f "$FRONTEND_DIR/.env" ]; then
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
fi
cd "$FRONTEND_DIR"
npm install
npm run build
cd "$REPO_DIR"

# ── 7. Nginx configuration ──────────────────────────────────────────
echo "[7/8] Configuring Nginx..."
sed "s|your-domain.com|$DOMAIN|g; s|/root/usta_prod|$REPO_DIR|g" \
    "$REPO_DIR/usta_nginx.conf" > /etc/nginx/sites-available/usta

if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

if [ ! -f /etc/nginx/sites-enabled/usta ]; then
    ln -s /etc/nginx/sites-available/usta /etc/nginx/sites-enabled/
fi

# Copy proxy_params if missing
if [ ! -f /etc/nginx/proxy_params ]; then
    cat > /etc/nginx/proxy_params <<'EOF'
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
EOF
fi

nginx -t && systemctl restart nginx
echo "  -> Nginx configured and restarted"

# ── 8. Gunicorn systemd service ─────────────────────────────────────
echo "[8/8] Creating Gunicorn systemd service..."
cat > /etc/systemd/system/usta-gunicorn.service <<UNIT
[Unit]
Description=Usta Django Gunicorn service
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/gunicorn --config $BACKEND_DIR/gunicorn.conf.py
ExecReload=/bin/kill -s HUP \$MAINPID
ExecStop=/bin/kill -s TERM \$MAINPID
Restart=on-failure
RestartSec=5
StandardOutput=append:$BACKEND_DIR/logs/gunicorn_access.log
StandardError=append:$BACKEND_DIR/logs/gunicorn_error.log

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable usta-gunicorn
systemctl restart usta-gunicorn || true

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Edit $BACKEND_DIR/.env with your real secrets"
echo "  2. Run 'certbot --nginx -d $DOMAIN -d www.$DOMAIN' for SSL"
echo "  3. Check status: systemctl status usta-gunicorn"
echo "  4. Check status: systemctl status nginx"
echo ""
echo "Project paths (update .env and nginx if moved):"
echo "  Backend: $BACKEND_DIR"
echo "  Frontend: $FRONTEND_DIR"
echo "  Nginx config: /etc/nginx/sites-available/usta"
