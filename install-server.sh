#!/usr/bin/env bash
# Usta Production Server Installer
# Run as root on Ubuntu 22.04+
# Usage: bash install-server.sh <server-ip-or-domain> [email-for-ssl]
set -euo pipefail

REPO="https://github.com/DilyorbekAbdujabborov/usta-prod.git"
INSTALL_DIR="/root/usta_prod"
SERVER="${1:-}"
CERTBOT_EMAIL="${2:-}"

DB_NAME="usta"
DB_USER="usta"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

if [ -z "$SERVER" ]; then
  info "Usage: bash install-server.sh <server-ip-or-domain> [email-for-ssl]"
  info "Example: bash install-server.sh 123.123.123.123"
  info "Example: bash install-server.sh mydomain.com admin@mydomain.com"
  exit 1
fi

[ "$(id -u)" = "0" ] || fail "Run as root"

# Detect IP or domain
if [[ "$SERVER" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  IS_IP=true
  PROTO="http"
  # A Secure cookie is never sent back over plain HTTP, so leaving these on
  # would lock you out of /admin/ on an IP-only deploy.
  SECURE_COOKIES=False
  NGINX_SERVER_NAME="_"
  ALLOWED_HOSTS="localhost,127.0.0.1,$SERVER"
  SITE_ORIGINS="http://$SERVER"
  info "Server type: IP ($SERVER) — HTTP only (no SSL)"
else
  IS_IP=false
  PROTO="https"
  SECURE_COOKIES=True
  NGINX_SERVER_NAME="$SERVER www.$SERVER"
  ALLOWED_HOSTS="localhost,127.0.0.1,$SERVER,www.$SERVER"
  SITE_ORIGINS="https://$SERVER,https://www.$SERVER"
  info "Server type: Domain ($SERVER) — with SSL"
fi

ENV_PROD="$INSTALL_DIR/usta-backend/.env.prod"
SQLITE_DB="$INSTALL_DIR/usta-backend/db.sqlite3"
SQLITE_DUMP="$INSTALL_DIR/usta-backend/sqlite-export.json"

info "===== Usta Production Setup ====="
info "Server: $SERVER"
info "Protocol: $PROTO"
info "Install dir: $INSTALL_DIR"
echo ""

# ── 1. System packages ──────────────────────────────────────────────
info "[1/12] Installing system packages..."
apt-get update -qq
apt-get install -y -qq nginx python3 python3-venv python3-pip \
  postgresql postgresql-contrib libpq-dev \
  git curl sudo ca-certificates gnupg openssl
if [ "$IS_IP" = false ]; then
  apt-get install -y -qq certbot python3-certbot-nginx
fi

# Node.js from NodeSource (Ubuntu's own nodejs is too old). 22 is the floor:
# @vitejs/plugin-react declares engines.node ">=22.12.0".
# The build uses npm, which ships with nodejs. Yarn 1 cannot install this
# dependency tree at all: vitest peer-depends on vite and its linker aborts
# with "could not find a copy of vite to link in node_modules/vitest".
# Removing the apt packages below anyway — "apt-get install yarn" pulls in
# cmdtest, an unrelated Python tool that hijacks /usr/bin/yarn, and an
# earlier version of this script installed it.
for pkg in yarn cmdtest; do
  if dpkg -s "$pkg" >/dev/null 2>&1; then
    info "Removing apt package '$pkg' (cmdtest hijacks /usr/bin/yarn)..."
    apt-get remove -y -qq "$pkg"
  fi
done

NODE_MAJOR_REQUIRED=22
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

info "node $(node --version) / npm $(npm --version)"
ok "System packages installed"

# ── 2. Clone repo ───────────────────────────────────────────────────
info "[2/12] Cloning repository..."
if [ -d "$INSTALL_DIR" ]; then
  info "Directory exists, pulling latest..."
  cd "$INSTALL_DIR" && git pull
else
  git clone "$REPO" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"
ok "Repository cloned"

# ── 3. Backend .env (development defaults) ──────────────────────────
info "[3/12] Configuring backend environment..."
# .env stays the unmodified template. Everything production-specific goes into
# .env.prod in step 6, which core/settings.py loads afterwards with
# override=True — no fragile sed against a file whose placeholders may change.
if [ ! -f "$INSTALL_DIR/usta-backend/.env" ]; then
  cp "$INSTALL_DIR/usta-backend/.env.example" "$INSTALL_DIR/usta-backend/.env"
  ok ".env created from .env.example"
else
  info ".env already exists, leaving it alone"
fi

# ── 4. Frontend .env ────────────────────────────────────────────────
info "[4/12] Configuring frontend environment..."
# The frontend treats VITE_API_BASE_URL as an ORIGIN and appends /api itself
# (src/lib/api.ts: fetch(`${API_BASE}/api${path}`)). Putting /api here produced
# requests to /api/api/... and a 404 on every call. Empty means same-origin,
# which is what nginx serves - and it keeps working over both http and https
# without the value having to match the scheme.
cat > "$INSTALL_DIR/ustalaruz/.env" <<EOF
VITE_API_BASE_URL=
EOF
ok "Frontend .env configured (same-origin API)"

# ── 5. Python virtual environment ───────────────────────────────────
info "[5/12] Setting up Python virtual environment..."
python3 -m venv "$INSTALL_DIR/usta-backend/venv"
source "$INSTALL_DIR/usta-backend/venv/bin/activate"
pip install --upgrade pip -q
pip install -r "$INSTALL_DIR/usta-backend/requirements.txt" -q
pip install gunicorn -q
ok "Python venv ready"

# ── 6. Export existing SQLite data ──────────────────────────────────
# Must run before .env.prod exists, because that file is what switches
# DB_TYPE to postgres. Skipped once the dump is on disk so a re-run can't
# overwrite a good export with an empty one.
info "[6/12] Checking for existing SQLite data..."
# A leftover db.sqlite3 is not evidence that SQLite is in use — .env may
# already point at Postgres, in which case that file is a stale dev artefact
# and importing it would add rows the live database never had.
PRIOR_DB_TYPE=$(grep -m1 '^DB_TYPE=' "$INSTALL_DIR/usta-backend/.env" 2>/dev/null | cut -d= -f2- || true)
if [ -n "${PRIOR_DB_TYPE:-}" ] && [ "$PRIOR_DB_TYPE" != "sqlite" ]; then
  info ".env already uses '$PRIOR_DB_TYPE' — skipping the SQLite export"
elif [ -f "$SQLITE_DB" ] && [ ! -f "$ENV_PROD" ] && [ ! -f "$SQLITE_DUMP" ]; then
  info "SQLite database found — exporting before the switch to Postgres..."
  cd "$INSTALL_DIR/usta-backend"
  # contenttypes/permissions are recreated by migrate; re-importing them
  # collides with the fresh rows. Sessions and admin history aren't worth
  # the natural-key trouble.
  DB_TYPE=sqlite python manage.py dumpdata \
    --natural-foreign --natural-primary --indent 2 \
    -e contenttypes -e auth.permission -e sessions -e admin.logentry \
    -o "$SQLITE_DUMP" || fail "dumpdata failed — not touching the database"
  chmod 600 "$SQLITE_DUMP"
  ok "Exported to $SQLITE_DUMP ($(wc -c <"$SQLITE_DUMP") bytes)"
  cd "$INSTALL_DIR"
else
  info "Nothing to export (no db.sqlite3, or already migrated)"
fi

# ── 7. Postgres database ────────────────────────────────────────────
info "[7/12] Provisioning Postgres..."
systemctl enable --now postgresql

env_get() { grep -m1 "^$1=" "$2" 2>/dev/null | cut -d= -f2- || true; }

ADOPTED_DB=false
if [ -f "$ENV_PROD" ] && grep -q '^DB_PASSWORD=' "$ENV_PROD"; then
  # Re-run: keep using whatever the last run settled on. Rotating the password
  # or switching databases here would lock Django out of its own data.
  DB_NAME=$(env_get DB_NAME "$ENV_PROD")
  DB_USER=$(env_get DB_USER "$ENV_PROD")
  DB_PASSWORD=$(env_get DB_PASSWORD "$ENV_PROD")
  ADOPTED_DB=true
  info "Reusing the database named in .env.prod: $DB_NAME (user $DB_USER)"
else
  # First run against a server that was already deployed by hand: .env may
  # point at a populated Postgres database. Provisioning a fresh empty one and
  # pointing Django at it looks exactly like total data loss, so adopt it.
  EXISTING_DB_TYPE=$(env_get DB_TYPE "$INSTALL_DIR/usta-backend/.env")
  EXISTING_DB_NAME=$(env_get DB_NAME "$INSTALL_DIR/usta-backend/.env")
  if [ -n "$EXISTING_DB_NAME" ] && [ "${EXISTING_DB_TYPE:-sqlite}" != "sqlite" ]; then
    DB_NAME="$EXISTING_DB_NAME"
    DB_USER=$(env_get DB_USER "$INSTALL_DIR/usta-backend/.env")
    DB_PASSWORD=$(env_get DB_PASSWORD "$INSTALL_DIR/usta-backend/.env")
    ADOPTED_DB=true
    info "Adopting the Postgres database already configured in .env: $DB_NAME (user $DB_USER)"
  else
    DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
    info "No existing Postgres config — provisioning $DB_NAME"
  fi
fi

# Passwords go in over stdin, never as an argv the whole box can read in ps.
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
  sudo -u postgres psql -q <<SQL
CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
SQL
  ok "Postgres role '$DB_USER' created"
elif [ "$ADOPTED_DB" = true ]; then
  info "Postgres role '$DB_USER' already exists — leaving its password alone"
else
  # Covers a role left over from an earlier install whose password we lost.
  sudo -u postgres psql -q <<SQL
ALTER ROLE $DB_USER PASSWORD '$DB_PASSWORD';
SQL
  info "Postgres role '$DB_USER' already exists — password reset to match .env.prod"
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  # -O makes the role the database owner, which is what grants it CREATE on
  # schema public (Postgres 15+ revoked that from PUBLIC).
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
  ok "Database '$DB_NAME' created"
else
  info "Database '$DB_NAME' already exists"
fi

# ── 8. Production environment overrides ─────────────────────────────
info "[8/12] Writing .env.prod..."
if [ -f "$ENV_PROD" ] && grep -q '^DJANGO_SECRET_KEY=' "$ENV_PROD"; then
  # Rotating the key would invalidate every session, CSRF token, JWT and
  # pending password-reset code, so keep the one already in use.
  DJANGO_SECRET=$(grep -m1 '^DJANGO_SECRET_KEY=' "$ENV_PROD" | cut -d= -f2-)
  info "Keeping the existing DJANGO_SECRET_KEY"
else
  DJANGO_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
  info "Generated a new DJANGO_SECRET_KEY"
fi

# Preserve VAPID_PUBLIC_KEY across re-runs: it is the public half of
# vapid_private.pem, and every push subscription in the database is bound to
# it. Step 10 appends it the first time.
VAPID_PUBLIC_KEY_LINE=""
if [ -f "$ENV_PROD" ] && grep -q '^VAPID_PUBLIC_KEY=' "$ENV_PROD"; then
  VAPID_PUBLIC_KEY_LINE=$(grep -m1 '^VAPID_PUBLIC_KEY=' "$ENV_PROD")
fi

cat > "$ENV_PROD" <<EOF
# Generated by install-server.sh — production overrides.
# core/settings.py loads this after .env with override=True, so these win.
# Gitignored. Do not commit; do not paste its contents anywhere.
DJANGO_SECRET_KEY=$DJANGO_SECRET
DEBUG=False
ALLOWED_HOSTS=$ALLOWED_HOSTS
SECURE_COOKIES=$SECURE_COOKIES
CSRF_TRUSTED_ORIGINS_EXTRA=$SITE_ORIGINS
CORS_ALLOWED_ORIGINS_EXTRA=$SITE_ORIGINS
DB_TYPE=postgres
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432
$VAPID_PUBLIC_KEY_LINE
EOF
chmod 600 "$ENV_PROD"
ok ".env.prod written (DEBUG=False, Postgres, secure cookies=$SECURE_COOKIES)"

# ── 9. Django setup ─────────────────────────────────────────────────
info "[9/12] Running migrations and collecting static files..."
cd "$INSTALL_DIR/usta-backend"
source venv/bin/activate
mkdir -p logs
python manage.py migrate
python manage.py createcachetable

# Import the SQLite export exactly once. Marker file rather than a row count,
# because a partially loaded fixture must not be replayed on top of itself.
if [ -f "$SQLITE_DUMP" ] && [ ! -f "$SQLITE_DUMP.loaded" ]; then
  info "Importing SQLite export into Postgres..."
  python manage.py loaddata "$SQLITE_DUMP" \
    || fail "loaddata failed. Postgres is migrated but empty; the export is still at $SQLITE_DUMP and db.sqlite3 is untouched."
  touch "$SQLITE_DUMP.loaded"
  ok "Data imported"
fi

python manage.py collectstatic --noinput --clear
cd "$INSTALL_DIR"
ok "Django ready"

# ── 10. Web push VAPID key ──────────────────────────────────────────
info "[10/12] Checking web push VAPID key..."
cd "$INSTALL_DIR/usta-backend"
if [ ! -f vapid_private.pem ]; then
  warn "vapid_private.pem missing — generating a new keypair."
  warn "Push subscriptions made with an older key will stop working. If you"
  warn "still have the original .pem, stop now, copy it to"
  warn "$INSTALL_DIR/usta-backend/vapid_private.pem and re-run."
  openssl ecparam -name prime256v1 -genkey -noout -out vapid_private.pem
  chmod 600 vapid_private.pem
  source venv/bin/activate
  VAPID_PUB=$(python - <<'PY'
import base64
from cryptography.hazmat.primitives import serialization

with open('vapid_private.pem', 'rb') as fh:
    key = serialization.load_pem_private_key(fh.read(), password=None)
raw = key.public_key().public_bytes(
    serialization.Encoding.X962,
    serialization.PublicFormat.UncompressedPoint,
)
print(base64.urlsafe_b64encode(raw).rstrip(b'=').decode())
PY
)
  [ -n "$VAPID_PUB" ] || fail "Could not derive the VAPID public key"
  # settings.py serves this to the frontend via /api/push/public-key/
  sed -i '/^VAPID_PUBLIC_KEY=/d' "$ENV_PROD"
  echo "VAPID_PUBLIC_KEY=$VAPID_PUB" >> "$ENV_PROD"
  ok "VAPID keypair generated"
else
  info "vapid_private.pem already present"
fi
cd "$INSTALL_DIR"

# ── 11. Frontend build ──────────────────────────────────────────────
info "[11/12] Building frontend..."
cd "$INSTALL_DIR/ustalaruz"
# package-lock.json is gitignored, so whatever is on disk was resolved on
# whoever's machine ran npm install last. A lockfile from another OS pins the
# wrong native optional deps (@tailwindcss/oxide, rollup) and they end up
# missing here - that is the "npm native binding" failure this script used to
# work around. Resolving fresh on the target machine avoids it outright.
rm -rf node_modules yarn.lock package-lock.json
# Not piped into tail: this takes minutes, and buffering the output makes the
# installer look hung.
info "Running npm install (this takes a few minutes)..."
npm install --no-audit --no-fund
node -e "require('@tailwindcss/oxide')" \
  || fail "Native binding @tailwindcss/oxide missing after npm install"
npm run build
[ -f dist/index.html ] || fail "Frontend build produced no dist/index.html"
cd "$INSTALL_DIR"
ok "Frontend built"

# ── 12. Nginx + Gunicorn ────────────────────────────────────────────
info "[12/12] Configuring Nginx and Gunicorn..."

# Nginx workers run as www-data and cannot traverse a 0700 /root, which makes
# every request for the SPA, /static/ and /media/ a 403. The project lives
# under /root, so /root itself has to be traversable.
if [ "$(stat -c '%a' /root)" != "755" ]; then
  warn "chmod 755 /root — anything else under /root becomes world-readable too."
  chmod 755 /root
fi
chmod 755 "$INSTALL_DIR" "$INSTALL_DIR/ustalaruz" "$INSTALL_DIR/usta-backend"
chmod -R a+rX "$INSTALL_DIR/ustalaruz/dist" "$INSTALL_DIR/usta-backend/staticfiles"
[ -d "$INSTALL_DIR/usta-backend/media" ] && chmod -R a+rX "$INSTALL_DIR/usta-backend/media"
# The secrets stay unreadable regardless of the above.
chmod 600 "$ENV_PROD" "$INSTALL_DIR/usta-backend/.env"

sed -e "s|/root/usta_prod|$INSTALL_DIR|g" \
    -e "s|server_name _;|server_name $NGINX_SERVER_NAME;|" \
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

cat > /etc/systemd/system/usta-gunicorn.service <<UNIT
[Unit]
Description=Usta Django Gunicorn
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$INSTALL_DIR/usta-backend
EnvironmentFile=$INSTALL_DIR/usta-backend/.env
EnvironmentFile=-$INSTALL_DIR/usta-backend/.env.prod
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

# ── SSL ─────────────────────────────────────────────────────────────
if [ "$IS_IP" = false ]; then
  if [ -n "$CERTBOT_EMAIL" ]; then
    info "Requesting a Let's Encrypt certificate for $SERVER..."
    CERT_DOMAINS=(-d "$SERVER")
    # Asking for a hostname with no DNS record fails the whole request.
    if getent hosts "www.$SERVER" >/dev/null 2>&1; then
      CERT_DOMAINS+=(-d "www.$SERVER")
    else
      info "www.$SERVER does not resolve — requesting the bare domain only"
    fi
    certbot --nginx -n --agree-tos -m "$CERTBOT_EMAIL" --redirect \
      "${CERT_DOMAINS[@]}" || warn "certbot failed — site is up on HTTP; see the output above"
  else
    warn "No SSL: pass an email as the 2nd argument to request a certificate,"
    warn "or run: certbot --nginx -d $SERVER"
  fi
fi

# ── Cleanup ─────────────────────────────────────────────────────────
# Everything below is a download cache: apt's .deb archive, npm's package
# tarballs, pip's wheel cache. All of it refills on demand, and on a
# small VPS it adds up to more than the deploy itself.
info "Clearing download caches..."
DISK_BEFORE=$(df --output=avail -m / | tail -1 | tr -d ' ')

apt-get clean
apt-get autoremove -y -qq
npm cache clean --force >/dev/null 2>&1 || true
"$INSTALL_DIR/usta-backend/venv/bin/pip" cache purge >/dev/null 2>&1 || true
rm -rf /root/.cache/pip /root/.cache/yarn /root/.npm/_cacache 2>/dev/null || true

# node_modules is ~500 MB and step 11 deletes it on every run anyway, so it is
# only worth keeping if you rebuild the frontend by hand between deploys.
if [ "${CLEAN_NODE_MODULES:-0}" = "1" ]; then
  info "CLEAN_NODE_MODULES=1 — removing ustalaruz/node_modules"
  info "(a manual 'npm run build' will need 'npm install' first)"
  rm -rf "$INSTALL_DIR/ustalaruz/node_modules"
fi

DISK_AFTER=$(df --output=avail -m / | tail -1 | tr -d ' ')
ok "Caches cleared — $(( DISK_AFTER - DISK_BEFORE )) MB freed, ${DISK_AFTER} MB available"

# ── Verification ────────────────────────────────────────────────────
echo ""
info "Django deployment checks:"
cd "$INSTALL_DIR/usta-backend"
source venv/bin/activate
python manage.py check --deploy 2>&1 | tail -20 || true

# Pointing at the wrong database is silent otherwise: everything migrates,
# every service starts, and the site just has no users in it.
echo ""
info "Database in use:"
python manage.py shell -c "
from django.conf import settings
from django.contrib.auth import get_user_model
d = settings.DATABASES['default']
n = get_user_model().objects.count()
print(f\"  {d['ENGINE'].rsplit('.', 1)[-1]}: {d['NAME']} on {d.get('HOST') or 'local'}\")
print(f'  users: {n}')
print('  WARNING: no users — is this the database you expected?' if n == 0 else '')
" 2>&1 | tail -5
cd "$INSTALL_DIR"

echo ""
# Sent with the deploy's own Host header: server_name is the domain, so a
# request for "localhost" lands in whatever other server block is default and
# 404s there no matter how healthy this site is.
info "Local HTTP check (Host: $SERVER):"
probe() {
  printf '  %-22s %s\n' "$1" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $SERVER" "http://127.0.0.1$1" || echo 'no answer')"
}
probe /
probe /api/version
probe /admin/
probe /static/admin/css/base.css
echo "  gunicorn on :8000      $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/api/version || echo 'not listening')"

# ── Done ────────────────────────────────────────────────────────────
echo ""
ok "====== Setup complete ======"
ok "App is running at: $PROTO://$SERVER"
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
echo "  4. Production settings live in usta-backend/.env.prod (chmod 600)."
echo "     Edit that file, not .env, then: systemctl restart usta-gunicorn"
if [ -f "$SQLITE_DUMP.loaded" ]; then
  echo ""
  echo "  5. Data was imported from SQLite. Once you have verified the site,"
  echo "     delete the export (it contains user data in plain text):"
  echo "     rm $SQLITE_DUMP $SQLITE_DUMP.loaded"
fi
