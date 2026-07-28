# Usta — Google Play'ga chiqarish qo'llanmasi (PWA → AAB)

Bu ilova (Usta) — Vite bilan qurilgan React PWA (Progressive Web App), native Android
ilova emas. Play Market'ga chiqarish uchun uni **TWA (Trusted Web Activity)** texnologiyasi
orqali yupqa Android qobiqqa o'raymiz: foydalanuvchi ochganda haqiqiy Chrome brauzeri
ustaga.uz saytini to'liq ekranli (adres satrisiz) ko'rsatadi, lekin Play Store'da alohida
ilova sifatida turadi. Bu bir xil kodni ikki marta yozmasdan eng tez va ishonchli yo'l.

Ikkita yo'l bor — birini tanlang:

- **A) PWABuilder (tavsiya etiladi, kompyuteringizga hech narsa o'rnatmaysiz)**
- **B) Bubblewrap CLI (lokal, to'liq nazorat, Android Studio/JDK talab qiladi)**

---

## 0-qadam: Oldindan tayyor bo'lishi kerak narsalar

- [x] Sayt production'da ishlayapti: `https://mastergroup.uz`
- [x] `manifest.json` to'g'ri (tekshirildi — `name`, `short_name`, `icons` 192x192 va 512x512 mavjud)
- [ ] **Google Play Console akkaunti** — https://play.google.com/console — bir martalik $25
      to'lov (agar hali ochilmagan bo'lsa)
- [ ] Ilova nomi, qisqa va to'liq tavsif (o'zbek tilida), maxfiylik siyosati URL manzili
      (Play Store **majburiy** talab qiladi — pastda shablon bor)
- [ ] Store ikonkasi 512×512, feature graphic 1024×500, kamida 2 ta skrinshot (telefon o'lchamida)

> **MUHIM — imzolash kaliti (signing key):** quyidagi ikkala usulda ham bir marta
> "upload key" (keystore fayl + parol) yaratiladi. **Bu faylni yo'qotmang.** Agar
> yo'qotsangiz, ilovangizni Play Store'da hech qachon yangilay olmaysiz (yangi ilova
> sifatida qayta joylashtirishga to'g'ri keladi, eski o'rnatishlar yangilanmaydi).
> Faylni (`android.keystore` yoki `*.jks`) parol bilan birga xavfsiz joyda (parol
> menejeri + zaxira nusxa) saqlang. Google Play App Signing yoqilgan bo'lsa (standart),
> bu — faqat *upload* kaliti, lekin baribir yo'qotilsa muammo tug'diradi.

---

## A) PWABuilder orqali (eng oson, hech narsa o'rnatilmaydi)

1. Brauzerda oching: **https://www.pwabuilder.com**
2. "Enter your URL" maydoniga kiriting: `https://mastergroup.uz`
3. "Start" bosing — PWABuilder manifest, service worker va ikonkalarni tekshiradi va
   ballar beradi (Manifest / Service Worker / Security).
   - Service Worker yo'qligi haqida ogohlantirishi mumkin — bu **AAB yaratishga
     to'sqinlik qilmaydi**, faqat offline-rejim bo'lmaydi (foydalanuvchi internetsiz
     ochsa, oq ekran ko'radi). Keyinchalik qo'shish mumkin (pastdagi "Keyingi qadamlar"ga
     qarang).
4. "Package for stores" → **Android** ni tanlang.
5. Sozlamalar oynasida:
   - **Package ID**: `app.vercel.ustalar_sand.twa` (yoki xohlagan teskari-domen shakli — bir marta
     tanlangach o'zgartirib bo'lmaydi, chunki bu Play Store'dagi ilovangizning doimiy
     identifikatori)
   - **App name**: `Usta`
   - **Signing key**: "Create new" ni tanlang → PWABuilder avtomatik keystore yaratadi
     va sizga yuklab beradi (`signing.keystore` + `signing-key-info.txt` parollar bilan).
     **Ularni darhol xavfsiz joyga ko'chiring.**
6. "Generate" bosing → bir necha soniyadan so'ng `.zip` yuklanadi, ichida:
   - `app-release-bundle.aab` — Play Console'ga yuklaydigan asosiy fayl
   - `assetlinks.json` — quyidagi 1-qadamda saytga qo'yish kerak bo'lgan fayl
   - `signing.keystore` va parollar

### Digital Asset Links (majburiy — aks holda ilova brauzer chizig'i bilan ochiladi)

PWABuilder bergan `assetlinks.json` faylini loyihaga qo'shing:

```bash
mkdir -p public/.well-known
cp ~/Downloads/assetlinks.json public/.well-known/assetlinks.json
git add public/.well-known/assetlinks.json
git commit -m "Add Digital Asset Links for TWA verification"
```

Keyin qayta deploy qiling (`vercel --prod`) va tekshiring:

```bash
curl https://mastergroup.uz/.well-known/assetlinks.json
```

JSON qaytishi kerak (bo'sh yoki 404 bo'lsa — TWA ochilganda adres satri ko'rinaveradi).

---

## B) Bubblewrap CLI orqali (lokal, Android Studio kerak)

Agar to'liq nazorat kerak bo'lsa yoki offline build qilmoqchi bo'lsangiz:

```bash
# Talablar: Node.js (bor), JDK 17, Android SDK (Bubblewrap avtomatik o'rnatib beradi)
npm install -g @bubblewrap/cli

bubblewrap init --manifest https://mastergroup.uz/manifest.json
# Savollarga javob bering: package ID (app.vercel.ustalar_sand.twa), keystore parolini yarating

bubblewrap build
# Natija: ./app-release-bundle.aab
```

`assetlinks.json` shu jarayonda avtomatik generatsiya qilinadi — uni ham yuqoridagi
kabi `public/.well-known/assetlinks.json` ga qo'yib, qayta deploy qiling.

---

## 1-qadam: Play Console'da ilova yaratish

1. https://play.google.com/console → **Create app**
2. Nomi: `Usta`, til: O'zbekcha, turi: App, bepul/pullik: Bepul
3. **Store listing** to'ldiring:
   - Qisqa tavsif (80 belgi): masalan _"Uyingiz uchun professional ustalarni toping"_
   - To'liq tavsif: `index.html`dagi meta description'ga asoslanib yozing
   - Ikonka 512×512, feature graphic 1024×500, skrinshotlar (kamida 2 ta, telefon)
4. **Privacy Policy URL** — majburiy. Agar hali yo'q bo'lsa, saytga `/privacy` sahifasi
   qo'shish yoki tez sozlanadigan xizmat (masalan Termly, iubenda) ishlatish kerak.
5. **Content rating** so'rovnomasini to'ldiring (bu ilova uchun odatda "Everyone").
6. **App content** bo'limida: Data safety formasi (qaysi ma'lumotlar yig'iladi — telefon
   raqami, ism kabi) to'ldirilishi shart.

## 2-qadam: AAB yuklash

1. **Release → Production → Create new release**
2. `app-release-bundle.aab` faylini yuklang
3. Release notes yozing (masalan: _"Birinchi versiya"_)
4. **Internal testing** track'da avval sinab ko'rish tavsiya etiladi (production'ga
   to'g'ridan-to'g'ri chiqarishdan oldin) — bu darhol chiqadi, review kutmaydi.
5. Production'ga yuborilgandan so'ng Google tekshiruvi odatda **bir necha soatdan
   2-3 kungacha** davom etadi.

---

## Keyingi qadamlar (ilova sifatini oshirish, majburiy emas)

- **Service Worker qo'shish** — offline holatda oq ekran o'rniga keshlangan sahifa
  ko'rsatish uchun. `public/sw.js` avval mavjud edi, o'chirilgan (git tarixida bor) —
  qayta tiklab, `vite-plugin-pwa` orqali avtomatlashtirish mumkin.
- **App bundle versiyasini oshirish** — har yangi yuklashda `versionCode`ni bittaga
  oshirish kerak (Bubblewrap/PWABuilder buni `twa-manifest.json`da saqlaydi).
- **Push xabarnoma** — hozir yo'q; kerak bo'lsa Firebase Cloud Messaging TWA bilan
  birga ulanadi, lekin bu alohida ish hajmi.

---

## Tezkor tekshiruv ro'yxati (deploy qilishdan oldin)

```bash
curl -s https://mastergroup.uz/manifest.json | head -c 200
curl -s -o /dev/null -w "%{http_code}\n" https://mastergroup.uz/.well-known/assetlinks.json
```

Ikkalasi ham to'g'ri javob qaytarsa — AAB Play Console'ga yuklashga tayyor.
