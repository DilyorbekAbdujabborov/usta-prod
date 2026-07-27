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
│   ├── .env                   # Dev shabloni (gitdan tashqari)
│   ├── .env.prod              # Production overrides — install-server.sh yozadi
│   ├── .env.example           # .env uchun namuna
│   ├── vapid_private.pem      # Web push maxfiy kaliti (gitdan tashqari)
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
├── dump-server.sh             # Server holatini server-dump.md ga yig'adi (maxfiy qiymatlar redaksiya qilinadi)
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
| `install-server.sh` | Serverda root bo'lib ishga tushiriladi. Node, Postgres, Nginx, venv, Django, frontend build, systemd, SSL — hammasini avtomatik sozlaydi |
| `usta_nginx.conf` | Nginx virtual host shabloni. `server_name` va yo'llarni script o'zi almashtiradi |
| `usta-backend/gunicorn.conf.py` | Gunicorn worker, port, log sozlamalari |
| `usta-backend/.env` | Dev shabloni. Production da buni tahrirlamang |
| `usta-backend/.env.prod` | Production qiymatlari (`chmod 600`). `settings.py` uni `.env` dan keyin `override=True` bilan yuklaydi, ya'ni shu fayl ustun |
| `ustalaruz/.env` | `VITE_API_BASE_URL` — backend API manzili |
| `usta-backend/requirements.txt` | Python paketlar ro'yxati |
| `ustalaruz/package.json` | Frontend paketlar ro'yxati |

## Serverda ishga tushirish

```bash
git clone https://github.com/DilyorbekAbdujabborov/usta-prod.git /root/usta_prod
cd /root/usta_prod

# Domain + SSL (2-argument = Let's Encrypt uchun email)
bash install-server.sh your-domain.com admin@your-domain.com

# Yoki faqat IP (HTTP, SSL yo'q)
bash install-server.sh 123.123.123.123
```

Script idempotent — qayta ishga tushirsa bo'ladi. `DJANGO_SECRET_KEY`, `DB_PASSWORD` va
`VAPID_PUBLIC_KEY` mavjud `.env.prod` dan qayta o'qiladi, almashtirilmaydi (aks holda
barcha sessiya, JWT va push obunalari kuyadi).

## install-server.sh nimani avtomatik sozlaydi

| Narsa | Tafsilot |
|---|---|
| Node.js | NodeSource 22.x. `apt install yarn` **ishlatilmaydi** — u cmdtest paketi, JS yarn emas |
| Postgres | `usta` DB va `usta` role, random parol `.env.prod` ga yoziladi |
| SQLite → Postgres | `db.sqlite3` bor bo'lsa `dumpdata` bilan eksport, migratsiyadan keyin `loaddata`. Bir marta, marker fayl orqali |
| `DEBUG` | `.env.prod` da `False` |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1,<server>` (+ `www.`) |
| `CSRF_TRUSTED_ORIGINS` | Server origini `CSRF_TRUSTED_ORIGINS_EXTRA` orqali qo'shiladi — aks holda HTTPS da admin login CSRF xatosi beradi |
| Cookie secure | Domainda yoniq; IP-deploy da o'chiriladi, chunki HTTP da brauzer Secure cookie yubormaydi va admin panelga kirish imkonsiz bo'ladi |
| Web push | `vapid_private.pem` yo'q bo'lsa generatsiya qilinadi, public half `.env.prod` ga yoziladi |
| `/root` ruxsati | `chmod 755` — nginx `www-data` bo'lib ishlaydi va `0700 /root` orqali `dist/`, `static/`, `media/` ga kira olmaydi (403). Loyiha `/root` da turgani uchun shart |
| SSL | Email berilsa `certbot --nginx --redirect`. `www.` DNS'i yo'q bo'lsa faqat asosiy domen so'raladi |
| Cache tozalash | Oxirida apt/yarn/npm/pip download cachelari o'chiriladi, qancha joy bo'shagani yoziladi. `CLEAN_NODE_MODULES=1` bersangiz `node_modules` ham o'chadi |
| Tekshirish | Oxirida `manage.py check --deploy` va `/`, `/api/`, `/admin/` uchun HTTP kod |

## Server holatini yig'ish

```bash
cd /root/usta_prod && bash dump-server.sh
```

`server-dump.md` yaratadi: versiyalar, servislar, nginx/systemd config, ruxsatlar,
`check --deploy`, DB jadval sanoqlari, HTTP kodlar, scrub qilingan loglar.

**Repo public.** Maxfiy qiymatlar allowlist bo'yicha redaksiya qilinadi — faqat
xavfsiz deb belgilangan kalitlar (`DEBUG`, `DB_HOST`, `ALLOWED_HOSTS` va h.k.)
qiymati bilan chiqadi, qolgani `<set:N chars>` bo'ladi. Loglardan JWT, IP, telefon
va parollar maskalanadi. Shunga qaramay commit qilishdan oldin o'zingiz ko'rib chiqing.

## Frontend bog'liqliklari

Loyiha Vercel + serverless (Neon/Drizzle/Express) dan Django backendga ko'chgan.
Ishlatilmay qolgan paketlar olib tashlangan: `@google/genai`,
`@neondatabase/serverless`, `bcryptjs`, `cookie`, `dotenv`, `drizzle-orm`,
`express`, `jsonwebtoken`, `web-push`, `react-is`, `@vercel/node`, `autoprefixer`,
`drizzle-kit`, `esbuild`, `tsx` va ularning `@types/*` fayllari. `db/` papkasi
mavjud bo'lmagani uchun `drizzle.config.ts` va `db:*` skriptlari ham o'chirildi.
