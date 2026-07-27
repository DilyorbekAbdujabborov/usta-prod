# Server dump

Generated: 2026-07-27 15:47:02Z (UTC)
Host: vps10845.eskiz.uz

Secret values are redacted by allowlist; log excerpts are scrubbed.

## System

```
os: Ubuntu 24.04.4 LTS
kernel: 6.8.0-111-generic
arch: x86_64
cpus: 1
               total        used        free      shared  buff/cache   available
Mem:           961Mi       378Mi       253Mi        25Mi       530Mi       582Mi
/dev/vda2        20G  8.7G   10G  47% /
```

## Versions

```
node:    v22.23.1
npm:     10.9.8
yarn:    1.22.22
python:  Python 3.12.3
nginx:   nginx version: nginx/1.24.0 (Ubuntu)
psql:    psql (PostgreSQL) 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
certbot: certbot 2.9.0
git head: 73af3a1 2026-07-27
```

## Services

```
usta-gunicorn    not-found / inactive
nginx            enabled / active
postgresql       enabled / active

Unit usta-gunicorn.service could not be found.
```

## Listening ports

```
State  Recv-Q Send-Q Local Address:Port Peer Address:PortProcess                                                   
LISTEN 0      200        127.0.0.1:5432      0.0.0.0:*    users:(("postgres",pid=33374,fd=6))                      
LISTEN 0      4096         0.0.0.0:22        0.0.0.0:*    users:(("sshd",pid=40984,fd=3),("systemd",pid=1,fd=207)) 
LISTEN 0      4096      127.0.0.54:53        0.0.0.0:*    users:(("systemd-resolve",pid=20157,fd=17))              
LISTEN 0      511          0.0.0.0:80        0.0.0.0:*    users:(("nginx",pid=11319,fd=5),("nginx",pid=11318,fd=5))
LISTEN 0      4096   127.0.0.53%lo:53        0.0.0.0:*    users:(("systemd-resolve",pid=20157,fd=15))              
LISTEN 0      4096            [::]:22           [::]:*    users:(("sshd",pid=40984,fd=4),("systemd",pid=1,fd=212)) 
LISTEN 0      511             [::]:80           [::]:*    users:(("nginx",pid=11319,fd=6),("nginx",pid=11318,fd=6))
```

## Filesystem permissions

```
755 root:root /
700 root:root /root
755 root:root /root/usta_prod
755 root:root /root/usta_prod/ustalaruz
stat: cannot statx '/root/usta_prod/ustalaruz/dist': No such file or directory
755 root:root /root/usta_prod/usta-backend
755 root:root /root/usta_prod/usta-backend/staticfiles
stat: cannot statx '/root/usta_prod/usta-backend/media': No such file or directory
644 root:root /root/usta_prod/usta-backend/.env
600 root:root /root/usta_prod/usta-backend/.env.prod

nginx worker user: user www-data;
```

## Backend .env (redacted)

```
DEBUG=True
TELEGRAM_BOT_TOKEN=<set:46 chars>
TELEGRAM_ADMIN_CHAT_ID=<set:14 chars>
TELEGRAM_WEBHOOK_PATH=<set:32 chars>
TELEGRAM_WEBHOOK_SECRET=<set:43 chars>
ESKIZ_EMAIL=<set:28 chars>
ESKIZ_PASSWORD=<set:40 chars>
ESKIZ_SENDER=4546
DB_TYPE=postgresql
DB_NAME=ustabackend
DB_USER=ustabackenduser
DB_PASSWORD=<set:12 chars>
DB_HOST=localhost
DB_PORT=5432
```

## Backend .env.prod (redacted)

```
DJANGO_SECRET_KEY=<set:67 chars>
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,mastergroup.uz,www.mastergroup.uz
SECURE_COOKIES=True
CSRF_TRUSTED_ORIGINS_EXTRA=https://mastergroup.uz,https://www.mastergroup.uz
CORS_ALLOWED_ORIGINS_EXTRA=https://mastergroup.uz,https://www.mastergroup.uz
DB_TYPE=postgres
DB_NAME=usta
DB_USER=usta
DB_PASSWORD=<set:32 chars>
DB_HOST=localhost
DB_PORT=5432
VAPID_PUBLIC_KEY=<set:87 chars>
```

## Frontend .env

```
VITE_API_BASE_URL=https://mastergroup.uz/api
```

## Secret files present

```
vapid_private.pem: present, 227 bytes, mode 600
db.sqlite3: present, 393216 bytes, mode 644
sqlite-export.json: present, 8500 bytes, mode 600
```

## Nginx site config

```
cat: /etc/nginx/sites-available/usta: No such file or directory

--- enabled sites:
total 0
lrwxrwxrwx 1 root root 34 Jul 27 18:48 default -> /etc/nginx/sites-available/default

nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## Gunicorn unit

```
cat: /etc/systemd/system/usta-gunicorn.service: No such file or directory
```

## Django

```
--- check --deploy:
System check identified some issues:

WARNINGS:
?: (security.W004) You have not set a value for the SECURE_HSTS_SECONDS setting. If your entire site is served only over SSL, you may want to consider setting a value and enabling HTTP Strict Transport Security. Be sure to read the documentation first; enabling HSTS carelessly can cause serious, irreversible problems.
?: (security.W008) Your SECURE_SSL_REDIRECT setting is not set to True. Unless your site should be available over both SSL and non-SSL connections, you may want to either set this setting True or configure a load balancer or reverse-proxy server to redirect all connections to HTTPS.

System check identified 2 issues (0 silenced).

--- unapplied migrations:
count: 0

--- installed python packages:
aiohappyeyeballs==2.7.1
aiohttp==3.14.3
aiosignal==1.4.0
asgiref==3.12.1
attrs==26.1.0
certifi==2026.7.22
cffi==2.1.0
charset-normalizer==3.4.9
cryptography==49.0.0
Django==6.0.7
django-cors-headers==4.9.0
django-jazzmin==3.0.5
django-push-notifications==3.3.0
djangorestframework==3.17.1
djangorestframework_simplejwt==5.5.1
Faker==40.31.0
frozenlist==1.8.0
gunicorn==26.0.0
http_ece==1.2.1
idna==3.18
multidict==6.7.1
packaging==26.2
pillow==12.3.0
propcache==0.5.2
psycopg2-binary==2.9.12
py-vapid==1.9.4
pycparser==3.0
PyJWT==2.13.0
python-dotenv==1.2.2
pywebpush==2.3.0
requests==2.34.2
sqlparse==0.5.5
typing_extensions==4.16.0
urllib3==2.7.0
whitenoise==6.9.0
yarl==1.24.5
```

## Database

```
--- engine in use:
django.db.backends.postgresql_psycopg2 usta

--- row counts:
32 objects imported automatically (use -v 2 for details).

admin.LogEntry                           0
applications.Application                 0
auth.Group                               0
auth.Permission                          104
categories.Category                      15
contenttypes.ContentType                 26
enterprise.EnterpriseOrder               0
error_log.ErrorLog                       0
marketplace.Ad                           0
marketplace.Tariff                       0
masters.Master                           0
messages_app.Conversation                0
messages_app.Message                     0
messages_app.Ticket                      0
messages_app.TicketMessage               0
notifications.Notification               0
orders.Order                             0
payments.Payment                         0
push_notifications.APNSDevice            0
push_notifications.GCMDevice             0
push_notifications.WNSDevice             0
push_notifications.WebPushDevice         0
sessions.Session                         0
site_settings.SiteSettings               0
site_settings.SmsTemplate                12
users.User                               0
```

## Frontend build

```
ls: cannot access '/root/usta_prod/ustalaruz/dist': No such file or directory

--- dist size: du: cannot access '/root/usta_prod/ustalaruz/dist': No such file or directory
--- assets:
```

## HTTP probes (localhost)

```
/                                  200 615b
/api/version                       404 162b
/admin/                            404 162b
/static/admin/css/base.css         404 162b
/manifest.json                     404 162b

--- /api/version body:
<html>
<head><title>404 Not Found</title></head>
<body>
<center><h1>404 Not Found</h1></center>
<hr><center>nginx/1.24.0 (Ubuntu)</center>
</body>
</html>
```

## Gunicorn error log (scrubbed, last 60)

```
tail: cannot open '/root/usta_prod/usta-backend/logs/gunicorn_error.log' for reading: No such file or directory
```

## Nginx error log (scrubbed, last 40)

```
2026/07/27 18:48:26 [notice] 2203#2203: using inherited sockets from "5;6;"
```

## Certificates

```
Saving debug log to /var/log/letsencrypt/letsencrypt.log

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
No certificates found.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```
