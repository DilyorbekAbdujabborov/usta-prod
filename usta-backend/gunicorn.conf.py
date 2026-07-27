import multiprocessing
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
timeout = 120
graceful_timeout = 30
keepalive = 5

chdir = BASE_DIR
wsgi_app = "core.wsgi:application"

accesslog = os.path.join(BASE_DIR, "logs", "gunicorn_access.log")
errorlog = os.path.join(BASE_DIR, "logs", "gunicorn_error.log")
loglevel = "info"

pidfile = os.path.join(BASE_DIR, "gunicorn.pid")

user = "root"
group = "root"

forwarded_allow_ips = "*"
proxy_protocol = False
proxy_allow_ips = "*"

raw_env = [
    f"DJANGO_SETTINGS_MODULE=core.settings",
]
