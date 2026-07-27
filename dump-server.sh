#!/usr/bin/env bash
# Collect the deployed server's configuration and health into server-dump.md.
#
# Run as root on the server:
#   cd /root/usta_prod && bash dump-server.sh
#
# THIS REPOSITORY IS PUBLIC. Secret values are redacted here by allowlist -
# only variables known to be non-sensitive are printed with their values,
# everything else is reported as <set> or <empty>. Log excerpts are scrubbed
# for tokens and client IPs. Even so, the dump describes your infrastructure
# (package versions, paths, open ports). Review server-dump.md before you
# commit it, and prefer pasting it into a chat over pushing it if you can.
set -uo pipefail

INSTALL_DIR="${INSTALL_DIR:-/root/usta_prod}"
OUT="$INSTALL_DIR/server-dump.md"
BACKEND="$INSTALL_DIR/usta-backend"

[ "$(id -u)" = "0" ] || { echo "Run as root"; exit 1; }

# Env variables safe to print verbatim. Anything not listed is masked, so a
# newly added secret is redacted by default rather than leaked by default.
SAFE_KEYS="DEBUG DB_TYPE DB_HOST DB_PORT DB_NAME DB_USER ALLOWED_HOSTS
SECURE_COOKIES CSRF_TRUSTED_ORIGINS_EXTRA CORS_ALLOWED_ORIGINS_EXTRA
ESKIZ_SENDER VITE_API_BASE_URL"

dump_env() {
  local file="$1"
  [ -f "$file" ] || { echo "(not present)"; return; }
  SAFE="$SAFE_KEYS" awk -F= '
    BEGIN { n = split(ENVIRON["SAFE"], a, /[ \t\n]+/); for (i = 1; i <= n; i++) if (a[i] != "") safe[a[i]] = 1 }
    /^[[:space:]]*#/ || /^[[:space:]]*$/ { next }
    /=/ {
      key = $1
      val = substr($0, index($0, "=") + 1)
      if (key in safe)        print key "=" val
      else if (val == "")     print key "=<empty>"
      else                    print key "=<set:" length(val) " chars>"
      next
    }
    { print "(unparsed line)" }
  ' "$file"
}

# Tracebacks under DEBUG=True and request logs can carry tokens, phone numbers
# and client addresses. Mask long opaque strings, JWTs and IPv4 addresses.
scrub() {
  sed -E \
    -e 's/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/<jwt>/g' \
    -e 's/\b[0-9]{1,3}(\.[0-9]{1,3}){3}\b/<ip>/g' \
    -e 's/\+?998[0-9]{9}/<phone>/g' \
    -e 's/(password|passwd|secret|token|api[_-]?key|authorization)([="'"'"':[:space:]]+)[^[:space:],;"'"'"')]+/\1\2<redacted>/gI' \
    -e 's/\b[A-Za-z0-9_-]{32,}\b/<opaque>/g'
}

section() { printf '\n## %s\n\n' "$1" >>"$OUT"; }
fence()   { printf '```\n' >>"$OUT"; }
run()     { fence; { eval "$1"; } >>"$OUT" 2>&1; fence; }

: >"$OUT"
{
  echo "# Server dump"
  echo
  echo "Generated: $(date -u '+%Y-%m-%d %H:%M:%SZ') (UTC)"
  echo "Host: $(hostname)"
  echo
  echo "Secret values are redacted by allowlist; log excerpts are scrubbed."
} >>"$OUT"

section "System"
run '. /etc/os-release; echo "os: $PRETTY_NAME"; echo "kernel: $(uname -r)"; echo "arch: $(uname -m)"; echo "cpus: $(nproc)"; free -h | head -2; df -h / | tail -1'

section "Versions"
run 'echo "node:    $(node -v 2>&1)"
echo "npm:     $(npm -v 2>&1)"
echo "yarn:    $(yarn -v 2>&1)"
echo "python:  $(python3 -V 2>&1)"
echo "nginx:   $(nginx -v 2>&1)"
echo "psql:    $(psql --version 2>&1)"
echo "certbot: $(certbot --version 2>&1)"
echo "git head: $(git -C '"$INSTALL_DIR"' rev-parse --short HEAD 2>&1) $(git -C '"$INSTALL_DIR"' log -1 --format=%cd --date=short 2>&1)"'

section "Services"
run 'for s in usta-gunicorn nginx postgresql; do printf "%-16s %s / %s\n" "$s" "$(systemctl is-enabled $s 2>&1)" "$(systemctl is-active $s 2>&1)"; done
echo
systemctl status usta-gunicorn --no-pager -l 2>&1 | head -15'

section "Listening ports"
run 'ss -tlnp 2>/dev/null | head -20'

section "Filesystem permissions"
run 'stat -c "%a %U:%G %n" / /root '"$INSTALL_DIR"' '"$INSTALL_DIR"'/ustalaruz '"$INSTALL_DIR"'/ustalaruz/dist '"$BACKEND"' '"$BACKEND"'/staticfiles '"$BACKEND"'/media '"$BACKEND"'/.env '"$BACKEND"'/.env.prod 2>&1
echo
echo "nginx worker user: $(grep -m1 -E "^\s*user" /etc/nginx/nginx.conf 2>&1)"'

section "Backend .env (redacted)"
fence; dump_env "$BACKEND/.env" >>"$OUT" 2>&1; fence

section "Backend .env.prod (redacted)"
fence; dump_env "$BACKEND/.env.prod" >>"$OUT" 2>&1; fence

section "Frontend .env"
fence; dump_env "$INSTALL_DIR/ustalaruz/.env" >>"$OUT" 2>&1; fence

section "Secret files present"
run 'for f in '"$BACKEND"'/vapid_private.pem '"$BACKEND"'/db.sqlite3 '"$BACKEND"'/sqlite-export.json; do
  if [ -e "$f" ]; then echo "$(basename "$f"): present, $(stat -c "%s bytes, mode %a" "$f")"; else echo "$(basename "$f"): absent"; fi
done'

section "Nginx site config"
run 'cat /etc/nginx/sites-available/usta 2>&1; echo; echo "--- enabled sites:"; ls -l /etc/nginx/sites-enabled/ 2>&1; echo; nginx -t 2>&1'

section "Gunicorn unit"
run 'cat /etc/systemd/system/usta-gunicorn.service 2>&1'

section "Django"
run 'cd '"$BACKEND"' && source venv/bin/activate 2>/dev/null
echo "--- check --deploy:"
python manage.py check --deploy 2>&1 | head -30
echo
echo "--- unapplied migrations:"
python manage.py showmigrations --plan 2>&1 | grep -c "^\[ \]" | sed "s/^/count: /"
echo
echo "--- installed python packages:"
pip freeze 2>&1'

section "Database"
run 'cd '"$BACKEND"' && source venv/bin/activate 2>/dev/null
echo "--- engine in use:"
python -c "from django.conf import settings; import django, os; os.environ.setdefault(\"DJANGO_SETTINGS_MODULE\",\"core.settings\"); django.setup(); d=settings.DATABASES[\"default\"]; print(d[\"ENGINE\"], d.get(\"NAME\"))" 2>&1
echo
echo "--- row counts:"
python manage.py shell -c "
from django.apps import apps
for m in sorted(apps.get_models(), key=lambda m: m._meta.label):
    try:
        print(f\"{m._meta.label:<40} {m.objects.count()}\")
    except Exception as e:
        print(f\"{m._meta.label:<40} error: {type(e).__name__}\")
" 2>&1'

section "Frontend build"
run 'ls -la '"$INSTALL_DIR"'/ustalaruz/dist 2>&1 | head -20
echo
echo "--- dist size: $(du -sh '"$INSTALL_DIR"'/ustalaruz/dist 2>&1 | cut -f1)"
echo "--- assets:"
ls -S '"$INSTALL_DIR"'/ustalaruz/dist/assets 2>/dev/null | head -15'

section "HTTP probes (localhost)"
run 'for p in / /api/version /admin/ /static/admin/css/base.css /manifest.json; do
  printf "%-34s %s\n" "$p" "$(curl -s -o /dev/null -w "%{http_code} %{size_download}b" "localhost$p" 2>&1)"
done
echo
echo "--- /api/version body:"
curl -s localhost/api/version 2>&1 | head -c 400'

section "Gunicorn error log (scrubbed, last 60)"
fence; tail -60 "$BACKEND/logs/gunicorn_error.log" 2>&1 | scrub >>"$OUT"; fence

section "Nginx error log (scrubbed, last 40)"
fence; tail -40 /var/log/nginx/error.log 2>&1 | scrub >>"$OUT"; fence

section "Certificates"
run 'certbot certificates 2>&1 | head -20'

chmod 644 "$OUT"

echo
echo "Written: $OUT ($(wc -l <"$OUT") lines)"
echo
echo "REVIEW IT BEFORE COMMITTING - this repository is public:"
echo "  grep -nEi 'secret|password|token|BEGIN .*PRIVATE KEY' $OUT"
echo
echo "Then:"
echo "  cd $INSTALL_DIR && git add server-dump.md && git commit -m 'Add server dump' && git push"
