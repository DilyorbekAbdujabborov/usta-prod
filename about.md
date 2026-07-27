# Usta Production — about.md

## Loyiha tuzilishi

```
usta_prod/                     # Usta loyihasining production deploy repozitoriysi
│
├── usta-backend/              # Django backend (REST API)
│   ├── core/                  # Asosiy sozlamalar (settings, urls, wsgi)
│   ├── users/                 # Foydalanuvchilar (auth, profil)
│   ├── masters/               # Ustalar
│   ├── orders/                # Buyurtmalar
│   ├── applications/          # Ariza (usta bo'lish)
│   ├── categories/            # Kategoriyalar
│   ├── messages_app/          # Xabarlar (chat, ticketlar)
│   ├── payments/              # To'lovlar
│   ├── marketplace/           # E'lonlar va tariflar
│   ├── enterprise/            # Korporativ buyurtmalar
│   ├── push_api/              # Push-bildirishnomalar
│   ├── notifications/         # Bildirishnomalar
│   ├── site_settings/         # Admin sozlamalari (SMS shablonlari)
│   ├── error_log/             # Xatolik loglari
│   ├── messages/              # (zaxira app)
│   ├── static/                # Statik fayllar (admin logo, css)
│   ├── media/                 # Yuklangan fayllar (avatarlar, cheklar)
│   ├── manage.py              # Django boshqaruv skripti
│   ├── requirements.txt       # Python paketlar
│   ├── seed_mock.py           # Test ma'lumotlari generatori
│   ├── .env                   # Maxfiy o'zgaruvchilar (gitdan tashqari)
│   ├── .env.example           # .env uchun namuna
│   └── gunicorn.conf.py       # Gunicorn sozlamalari
│
├── ustalaruz/                 # Frontend (Vite + React + Tailwind)
│   ├── src/                   # React manba kodi
│   │   ├── components/        # UI komponentlar
│   │   ├── lib/               # Yordamchi funksiyalar (api, upload)
│   │   ├── auth/              # Autentifikatsiya provideri
│   │   └── theme/             # Mavzu (ThemeProvider)
│   ├── public/                # Statik resurslar (favicon, manifest, sw.js)
│   ├── dist/                  # Build natijasi (Nginx orqali serv qilinadi)
│   ├── package.json           # Node.js paketlar
│   ├── vite.config.ts         # Vite sozlamalari (proxy, build)
│   ├── tsconfig.json          # TypeScript sozlamalari
│   ├── drizzle.config.ts      # Drizzle ORM sozlamalari
│   └── DESIGN.md, PRODUCT.md  # Dizayn va mahsulot hujjatlari
│
├── usta_nginx.conf            # Nginx sozlamalari (proxy, static, SPA)
├── install-server.sh          # Serverni o'rnatish skripti (root da ishlaydi)
├── deploy.sh                  # Eski deploy skripti
├── about.md                   # Ushbu fayl
└── .gitignore
```

## Arxitektura

```
Internet
    │
    ▼
  Nginx (80/443)
    ├── /api/        ──proxy──► Gunicorn (8000) ──► Django
    ├── /admin/      ──proxy──► Gunicorn (8000) ──► Django
    ├── /static/     ──alias──► usta-backend/staticfiles/
    ├── /media/      ──alias──► usta-backend/media/
    └── /            ──root──► ustalaruz/dist/ (SPA, try_files)
```

## Muhim fayllar vazifasi

| Fayl | Vazifasi |
|---|---|
| `install-server.sh` | Serverda root bo'lib ishga tushiriladi. Nginx, venv, Django, frontend build, systemd service ni avtomatik sozlaydi |
| `usta_nginx.conf` | Nginx virtual host config. Domain nomini o'zgartirish kerak |
| `usta-backend/gunicorn.conf.py` | Gunicorn worker, port, log sozlamalari |
| `usta-backend/.env` | DJANGO_SECRET_KEY, DB, Telegram, SMS kalitlari |
| `ustalaruz/.env` | `VITE_API_BASE_URL` — backend API manzili |
| `usta-backend/requirements.txt` | Python paketlar ro'yxati |
| `ustalaruz/package.json` | Frontend paketlar ro'yxati |

## Serverda ishga tushirish

```bash
git clone https://github.com/DilyorbekAbdujabborov/usta-prod.git /root/usta_prod
cd /root/usta_prod
bash install-server.sh your-domain.com
```
