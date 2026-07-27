import os
import random
import uuid
import hashlib
import datetime
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from categories.models import Category
from masters.models import Master
from orders.models import Order
from applications.models import Application
from payments.models import Payment
from messages_app.models import Conversation, Message, Ticket, TicketMessage
from marketplace.models import Ad, Tariff
from push_notifications.models import WebPushDevice

User = get_user_model()

REGIONS = [
    'Toshkent viloyati', 'Andijon viloyati', 'Buxoro viloyati',
    'Fargʻona viloyati', 'Jizzax viloyati', 'Xorazm viloyati',
    'Namangan viloyati', 'Navoiy viloyati', 'Qashqadaryo viloyati',
    'Qoraqalpogʻiston', 'Samarqand viloyati', 'Sirdaryo viloyati',
    'Surxondaryo viloyati'
]

DISTRICTS = {
    'Toshkent viloyati': ['Yangiyoʻl', 'Chirchiq', 'Oʻrtachirchiq', 'Piskent', 'Qibray', 'Parkent', 'Boʻka', 'Ohangaron', 'Boʻstonliq', 'Yuqorichirchiq'],
    'Andijon viloyati': ['Andijon shahar', 'Asaka', 'Xonobod', 'Jalaquduq', 'Shahrixon', 'Oltinkoʻl', 'Paxtaobod', ' Baliqchi'],
    'Buxoro viloyati': ['Buxoro shahar', 'Kogon', 'Gʻijduvon', 'Olot', 'Peshku', 'Qorakoʻl', 'Jondor', 'Romitan'],
    'Fargʻona viloyati': ['Fargʻona shahar', 'Margʻilon', 'Qoʻqon', 'Quva', 'Rishton', 'Soʻx', 'Toshloq', 'Uchkoʻprik', 'Oʻzbekiston'],
    'Jizzax viloyati': ['Jizzax shahar', 'Doʻstlik', 'Forish', 'Gʻallaorol', 'Mirzachoʻl', 'Paxtakor', 'Yangiobod', 'Zafarobod', 'Baxmal', 'Sharof Rashidov'],
    'Xorazm viloyati': ['Urganch shahar', 'Xiva', 'Gurlan', 'Hazorasp', 'Shovot', 'Yangibozor', 'Tuproqqalʼa', 'Qoʻshkoʻpir'],
    'Namangan viloyati': ['Namangan shahar', 'Norin', 'Kosonsoy', 'Toʻraqoʻrgʻon', 'Uchqoʻrgʻon', 'Chortoq', 'Yangiqoʻrgʻon', 'Pop', 'Uychi', 'Norin'],
    'Navoiy viloyati': ['Navoiy shahar', 'Zarafshon', 'Karmana', 'Konimex', 'Navbahor', 'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq', 'Xatirchi'],
    'Qashqadaryo viloyati': ['Qarshi shahar', 'Shahrisabz', 'Dehqonobod', 'Gʻuzor', 'Kasbi', 'Kitob', 'Koson', 'Mirishkor', 'Muborak', 'Nishon', 'Chiroqchi', 'Yakkabogʻ'],
    'Qoraqalpogʻiston': ['Nukus shahar', 'Beruniy', 'Ellikqalʼa', 'Kegeyli', 'Moʻynoq', 'Nukus', 'Qoʻngʻirot', 'Qoraoʻzak', 'Shumanay', 'Taxtakoʻpir', 'Toʻrtkoʻl', 'Xoʻjayli', 'Chimboy', 'Boʻzatov'],
    'Samarqand viloyati': ['Samarqand shahar', 'Kattaqoʻrgʻon', 'Urgut', 'Ishtixon', 'Jomboy', 'Narpay', 'Nurobod', 'Oqdaryo', 'Paxtachi', 'Payariq', 'Qoʻshrabot', 'Raxmonov', 'Sugdiyona', 'Toyloq'],
    'Sirdaryo viloyati': ['Guliston shahar', 'Boyovut', 'Sardoba', 'Shirin', 'Yangiyer', 'Oqoltin', 'Sayxunobod', 'Xovos', 'Sirdaryo'],
    'Surxondaryo viloyati': ['Termiz shahar', 'Denov', 'Jarqoʻrgʻon', 'Qiziriq', 'Qumqoʻrgʻon', 'Muzrabot', 'Oltinsoy', 'Sariosiyo', 'Sherobod', 'Shoʻrchi', 'Angor', 'Bandixon', 'Boysun', 'Termiz']
}

CATEGORIES = [
    {'id': 'plumbing', 'name': 'Santexnik', 'color': '#3B82F6', 'image': 'https://img.icons8.com/fluency/96/plumbing.png', 'sort_order': 1},
    {'id': 'electrician', 'name': 'Elektrik', 'color': '#F59E0B', 'image': 'https://img.icons8.com/fluency/96/electricity.png', 'sort_order': 2},
    {'id': 'construction', 'name': 'Qurilish', 'color': '#EF4444', 'image': 'https://img.icons8.com/fluency/96/construction.png', 'sort_order': 3},
    {'id': 'ac', 'name': 'Konditsioner', 'color': '#06B6D4', 'image': 'https://img.icons8.com/fluency/96/air-conditioner.png', 'sort_order': 4},
    {'id': 'welding', 'name': 'Payvandchi', 'color': '#8B5CF6', 'image': 'https://img.icons8.com/fluency/96/welding.png', 'sort_order': 5},
    {'id': 'painter', 'name': "Bo'yoqchi", 'color': '#EC4899', 'image': 'https://img.icons8.com/fluency/96/paint-roller.png', 'sort_order': 6},
    {'id': 'cleaning', 'name': 'Tozalash', 'color': '#10B981', 'image': 'https://img.icons8.com/fluency/96/cleaning.png', 'sort_order': 7},
    {'id': 'internet', 'name': 'Internet', 'color': '#6366F1', 'image': 'https://img.icons8.com/fluency/96/wifi.png', 'sort_order': 8},
    {'id': 'carpenter', 'name': 'Duradgor', 'color': '#92400E', 'image': 'https://img.icons8.com/fluency/96/saw.png', 'sort_order': 9},
    {'id': 'locksmith', 'name': 'Qulfchi', 'color': '#6B7280', 'image': 'https://img.icons8.com/fluency/96/lock.png', 'sort_order': 10},
]

AD_GRADIENTS = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
]

TARIFF_NAMES = ['Oddiy', 'Standart', 'Premium', 'VIP', 'Biznes']

UZBEK_NAMES = [
    'Anvar', 'Bekzod', 'Dilshod', 'Eldor', 'Farrux', 'Gulnora', 'Humoyun',
    'Ilhom', 'Jamshid', 'Kamola', 'Laziz', 'Muhammad', 'Nigora', 'Oybek',
    'Polat', 'Qobil', 'Ravshan', 'Sevara', 'Tohir', 'Ulugbek', 'Valijon',
    'Xurshid', 'Yulduz', 'Zafar', 'Abdulloh', 'Botir', 'Charos', 'Doniyor',
    'Elmurod', 'Fotima', 'Gulruh', 'Husan', 'Iroda', 'Jahongir', 'Karima',
    'Lobar', 'Mirzo', 'Nodir', 'Olim', 'Parvin', 'Rustam', 'Sardor',
    'Turgun', 'Umid', 'Farangiz', 'Xusan', 'Yoqub', 'Zamira', 'Aziz', 'Barno'
]

UZBEK_BIOS = [
    "5 yillik tajribaga ega usta",
    "10 yildan ortiq tajriba bilan sifatli xizmat",
    "Professional usta, tez va sifatli ishlayman",
    "Har qanday murakkablikdagi ishlarni bajaraman",
    "Uy sharoitida ta'mirlash ishlari bo'yicha mutaxassis",
    "Mijozlar bilan samimiy munosabatda ishlayman",
    "Bepul maslahat va sifatli xizmat kafolati",
    "Ko'p yillik tajriba va zamonaviy uskunalar bilan ishlayman",
    "Har doim o'z vaqtida va aniq ishlayman",
    "Sifatli materiallardan foydalanib ta'mirlash ishlarini bajaraman",
    "Har bir ishga individual yondashish",
    "Kafolatli va ishonchli xizmat ko'rsataman",
    "Mijozlar talabiga mos ravishda sifatli xizmat",
    "Tez va sifatli, arzon narxlar",
    "Kelishilgan muddatda ishni topshirish kafolati",
    "Zamonaviy texnologiyalar bilan ishlayman",
    "Har qanday buyurtmani bajarishga tayyorman",
]

SENTENCE_TEMPLATES = [
    "Xizmat sifatli bajarildi",
    "Mijoz mamnun holda ketdi",
    "Barcha ishlar o'z vaqtida tugatildi",
    "Sifat va tezlik kafolatlanadi",
    "Mijoz bilan kelishilgan narx saqlandi",
    "Ish jarayoni to'liq nazorat qilindi",
    "Barcha talablar bajarildi",
    "Mijoz tavsiyasi bilan ish olib borildi",
    "Ishonchli va sifatli xizmat ko'rsatildi",
    "Mijoz uchun qulay vaqtda ish bajarildi",
    "Bepul maslahat berildi",
    "Ish sifatidan mijoz qoniqdi",
    "Muntazam ravishda sifat nazorati o'tkazildi",
    "Barcha detal va ehtiyot qismlar almashtirildi",
    "Kelishilgan muddatda ish topshirildi",
    "Xizmat ko'rsatish davomida mijoz bilan hamkorlik qilindi",
    "Yangi jihozlar bilan sifatli xizmat ko'rsatildi",
]

SERVICE_TEXT_TEMPLATES = [
    "Santexnika ishlari, quvurlarni almashtirish va ta'mirlash",
    "Elektr simlarini o'tkazish va ta'mirlash ishlari",
    "Uy va kvartiralarda kapital ta'mirlash xizmati",
    "Konditsionerlarni o'rnatish va tozalash",
    "Payvandlash ishlari, metall konstruksiyalar yasash",
    "Bo'yoq ishlari, devor va shiftlarni bo'yash",
    "Turar joy va ofislarni professional tozalash",
    "Internet va tarmoq qurilmalarini sozlash",
    "Mebel yasash va ta'mirlash xizmatlari",
    "Qulf va eshik tutqichlarini ta'mirlash va almashtirish",
    "Sanitariya jihozlarini o'rnatish va sozlash",
    "Yoritish tizimlarini o'rnatish va ta'mirlash",
    "Devor va pollarni tekislash va gipsokarton ishlari",
]

WORDS = [
    'sifatli', 'tez', 'arzon', 'ishonchli', 'professional', 'malakali', 'tajribali',
    'yaxshi', 'zo\'r', 'ajoyib', 'bepul', 'kafolatli', 'muntazam', 'qulay',
    'xizmat', 'ta\'mirlash', 'o\'rnatish', 'tozalash', 'sozlash', 'yasash',
    'almashtirish', 'tekshirish', 'bajarish', 'berish', 'olish', 'qilish',
    'mijoz', 'usta', 'buyurtma', 'ish', 'vaqt', 'muddat', 'narx', 'sifat',
    'natija', 'kafolat', 'shartnoma', 'kelishuv', 'murojaat', 'taklif',
    'uy', 'kvartira', 'ofis', 'do\'kon', 'ombor', 'bog\'', 'hovli',
    'oshxona', 'hammom', 'koridor', 'xona', 'tom', 'devor', 'pol', 'ship',
    'quvur', 'sim', 'rozetka', 'kran', 'rakovina', 'hammom', 'dush', 'tualet',
    'konditsioner', 'ventilyator', 'isitish', 'sovitish', 'nasos', 'motor',
    'eshik', 'deraza', 'panjara', 'zulfin', 'qulf', 'tutqich', 'qo\'l',
    'mebel', 'javon', 'stol', 'stul', 'shkaf', 'karavot', 'divan',
    'bo\'yoq', 'shpaklyovka', 'gips', 'sement', 'qum', 'yog\'och', 'metall',
    'plastik', 'keramika', 'steklo', 'mozaika', 'panel', 'oboy',
    'dastur', 'sozlama', 'tarmoq', 'internet', 'wifi', 'router', 'kabel',
]

def create_categories():
    categories = []
    for cat in CATEGORIES:
        category, _ = Category.objects.update_or_create(
            id=cat['id'],
            defaults={
                'name': cat['name'],
                'color': cat['color'],
                'image': cat['image'],
                'sort_order': cat['sort_order'],
                'is_active': True,
            }
        )
        categories.append(category)
    return categories

def random_phone():
    return f"+9989{random.randint(100000000, 999999999)}"

def random_district(region):
    districts = DISTRICTS.get(region, ['Markaz'])
    return random.choice(districts)

def create_users(count=50):
    users = []
    for _ in range(count):
        role = random.choices(['client', 'master', 'admin'], weights=[70, 25, 5])[0]
        user = User.objects.create_user(
            phone=random_phone(),
            name=random.choice(UZBEK_NAMES),
            password='password123',
            role=role,
            is_admin=(role == 'admin'),
            is_staff=(role == 'admin'),
            is_superuser=(role == 'admin'),
            balance=random.randint(0, 5000000),
            is_blocked=random.random() < 0.05,
        )
        users.append(user)
    return users

def create_masters(users, categories):
    masters = []
    for user in users:
        if user.role == 'master':
            region = random.choice(REGIONS)
            master = Master.objects.create(
                user=user,
                category_id=random.choice(categories),
                avatar_url=f"https://i.pravatar.cc/300?img={random.randint(1, 70)}",
                bio=random.choice(UZBEK_BIOS),
                extra_phone=random_phone() if random.random() > 0.5 else None,
                telegram=f"@{user.name.lower().replace(' ', '')}" if random.random() > 0.3 else None,
                specialty=random.choice(categories).name,
                price_comment=f"1 soat uchun {random.randint(50000, 500000)} so'm" if random.random() > 0.3 else None,
                services=random.choice(SERVICE_TEXT_TEMPLATES),
                rating=round(random.uniform(3.5, 5.0), 2),
                reviews_count=random.randint(0, 150),
                experience=random.randint(1, 30),
                price=random.randint(50000, 2000000),
                region=region,
                district=random_district(region),
                is_active=random.random() > 0.1,
                is_online=random.random() > 0.5,
                verified=random.random() > 0.3,
                premium_until=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=random.randint(-30, 365)) if random.random() > 0.5 else None,
                is_deleted=False,
            )
            masters.append(master)
    return masters

def create_applications(users, masters, categories):
    applications = []
    statuses = [Application.STATUS_PENDING, Application.STATUS_APPROVED, Application.STATUS_DECLINED]
    weights = [60, 30, 10]
    
    for user in users:
        if user.role == 'master' and random.random() > 0.3:
            region = random.choice(REGIONS)
            app = Application.objects.create(
                user=user,
                first_name=user.name.split()[0],
                last_name=user.name.split()[1] if len(user.name.split()) > 1 else '',
                phone=user.phone,
                category_id=random.choice(categories),
                region=region,
                district=random_district(region),
                experience=random.randint(1, 20),
                price=random.randint(50000, 1000000),
                bio=random.choice(UZBEK_BIOS),
                services=random.choice(SERVICE_TEXT_TEMPLATES),
                extra_phone=random_phone() if random.random() > 0.5 else None,
                price_comment=f"1 soat uchun {random.randint(50000, 500000)} so'm" if random.random() > 0.3 else None,
                avatar_url=f"https://i.pravatar.cc/300?img={random.randint(1, 70)}" if random.random() > 0.5 else None,
                status=random.choices(statuses, weights=weights)[0],
            )
            applications.append(app)
    return applications

def create_orders(users, masters, categories):
    orders = []
    statuses = [s[0] for s in Order.STATUS_CHOICES]
    weights = [30, 25, 10, 5, 20, 5]  # 6 ta status: pending, active, postponed, delayed, completed, cancelled
    
    for _ in range(100):
        clients = [u for u in users if u.role == 'client']
        if not clients:
            clients = users
        client = random.choice(clients)
        master = random.choice(masters) if masters and random.random() > 0.3 else None
        category = random.choice(categories)
        region = random.choice(REGIONS)
        
        order = Order.objects.create(
            client=client,
            master=master,
            title=f"{category.name} xizmati kerak",
            category_id=category,
            budget=random.randint(50000, 5000000),
            region=region,
            district=random_district(region),
            description=' '.join(random.choices(SENTENCE_TEMPLATES, k=random.randint(3, 6))),
            status=random.choices(statuses, weights=weights)[0],
            client_name=client.name,
            client_phone=client.phone,
        )
        orders.append(order)
    return orders

def create_payments(masters):
    payments = []
    statuses = [Payment.STATUS_PENDING, Payment.STATUS_APPROVED, Payment.STATUS_REJECTED]
    weights = [50, 40, 10]
    
    tariffs = list(Tariff.objects.all())
    if not tariffs:
        tariffs = [None]
    
    for master in masters:
        if random.random() > 0.5:
            for _ in range(random.randint(1, 5)):
                tariff = random.choice(tariffs) if tariffs[0] else None
                amount = tariff.price if tariff else random.choice([150000, 300000, 500000, 1000000])
                payment = Payment.objects.create(
                    master=master,
                    package_id=tariff.id if tariff else str(random.randint(1, 4)),
                    amount=amount,
                    receipt_text=f"To'lov #{random.randint(1000, 9999)}" if random.random() > 0.3 else None,
                    proof_image_url=f"https://i.imgur.com/{random.choice(['abc', 'def', 'ghi', 'jkl'])}.jpg" if random.random() > 0.5 else None,
                    status=random.choices(statuses, weights=weights)[0],
                )
                payments.append(payment)
    return payments

def create_conversations(users, masters):
    conversations = []
    messages = []
    
    for master in masters[:20]:
        for _ in range(random.randint(1, 4)):
            client = random.choice([u for u in users if u.role == 'client'])
            conv, created = Conversation.objects.get_or_create(
                client=client,
                master=master,
                defaults={'client_unread': random.randint(0, 5), 'master_unread': random.randint(0, 5)}
            )
            conversations.append(conv)
            
            for _ in range(random.randint(2, 10)):
                sender = random.choice([client, master.user])
                msg = Message.objects.create(
                    conversation=conv,
                    sender=sender,
                    text=' '.join(random.choices(WORDS, k=random.randint(3, 15))),
                )
                messages.append(msg)
    
    return conversations, messages

ADMIN_PHONE = "+998970070707"
ADMIN_PASSWORD = "root123"

def get_or_create_admin():
    admin = User.objects.filter(phone=ADMIN_PHONE).first()
    if not admin:
        admin = User.objects.create_superuser(
            phone=ADMIN_PHONE,
            name="Admin",
            password=ADMIN_PASSWORD,
            role='admin',
        )
        print(f"   ✓ Admin yaratildi: {ADMIN_PHONE} / {ADMIN_PASSWORD}")
    else:
        if not admin.is_admin:
            admin.is_admin = True
            admin.is_superuser = True
            admin.is_staff = True
            admin.role = 'admin'
            admin.save()
        print(f"   ✓ Admin mavjud: {ADMIN_PHONE}")
    return admin


def create_tickets(users):
    tickets = []
    ticket_messages = []
    
    admin = get_or_create_admin()
    
    for user in users[:30]:
        status = random.choices([Ticket.STATUS_OPEN, Ticket.STATUS_RESOLVED], weights=[70, 30])[0]
        ticket = Ticket.objects.create(
            user=user,
            status=status,
        )
        tickets.append(ticket)
        
        for _ in range(random.randint(1, 5)):
            sender = user if random.random() > 0.5 else admin
            msg = TicketMessage.objects.create(
                ticket=ticket,
                sender=sender,
                text=' '.join(random.choices(WORDS, k=random.randint(5, 20))),
            )
            ticket_messages.append(msg)
    
    return tickets, ticket_messages

def create_ads():
    ads = []
    for i in range(10):
        ad = Ad.objects.create(
            title=f"Aksiya #{i+1}: {random.choice(['Chegirma', 'Maxsus taklif', 'Yangi xizmat', 'Bepul konsultatsiya'])}",
            discount=f"{random.randint(10, 50)}%",
            code=f"AKSIYA{random.randint(1000, 9999)}",
            bg_gradient=random.choice(AD_GRADIENTS),
        )
        ads.append(ad)
    return ads

def create_tariffs():
    tariffs = []
    for i, name in enumerate(TARIFF_NAMES):
        tariff = Tariff.objects.create(
            id=str(i + 1),
            name=name,
            price=[150000, 300000, 500000, 1000000, 2000000][i],
            months=[1, 3, 6, 12, 24][i],
            comment=f"{name} paket - {random.randint(10, 9999)} ta buyurtmagacha" if random.random() > 0.3 else None,
        )
        tariffs.append(tariff)
    return tariffs

def create_push_subscriptions(users):
    subscriptions = []
    for user in users[:20]:
        if random.random() > 0.5:
            sub = WebPushDevice.objects.create(
                user=user,
                registration_id=f"https://fcm.googleapis.com/fcm/send/{str(uuid.uuid4())}",
                p256dh=hashlib.sha256(str(random.random()).encode()).hexdigest()[:44],
                auth=hashlib.sha1(str(random.random()).encode()).hexdigest()[:27],
                browser='CHROME',
            )
            subscriptions.append(sub)
    return subscriptions

def run():
    print("🗑️  Eski ma'lumotlarni tozalash...")
    TicketMessage.objects.all().delete()
    Message.objects.all().delete()
    Conversation.objects.all().delete()
    Ticket.objects.all().delete()
    WebPushDevice.objects.all().delete()
    Payment.objects.all().delete()
    Order.objects.all().delete()
    Application.objects.all().delete()
    Master.objects.all().delete()
    Ad.objects.all().delete()
    Tariff.objects.all().delete()
    User.objects.filter(is_superuser=False).delete()
    
    print("👑 Admin foydalanuvchini yaratish/tekshirish...")
    admin = get_or_create_admin()
    
    print("📂 Kategoriyalarni yaratish...")
    categories = create_categories()
    print(f"   ✓ {len(categories)} ta kategoriya yaratildi")
    
    print("💰 Tariflarni yaratish...")
    tariffs = create_tariffs()
    print(f"   ✓ {len(tariffs)} ta tarif yaratildi")
    
    print("📢 Reklamalarni yaratish...")
    ads = create_ads()
    print(f"   ✓ {len(ads)} ta reklama yaratildi")
    
    print("👥 Foydalanuvchilarni yaratish...")
    users = create_users(50)
    users.append(admin)
    print(f"   ✓ {len(users)} ta foydalanuvchi yaratildi")
    
    print("👷 Ustalarni yaratish...")
    masters = create_masters(users, categories)
    print(f"   ✓ {len(masters)} ta usta yaratildi")
    
    print("📋 Arizalarni yaratish...")
    applications = create_applications(users, masters, categories)
    print(f"   ✓ {len(applications)} ta ariza yaratildi")
    
    print("📦 Buyurtmalarni yaratish...")
    orders = create_orders(users, masters, categories)
    print(f"   ✓ {len(orders)} ta buyurtma yaratildi")
    
    print("💳 To'lovlarni yaratish...")
    payments = create_payments(masters)
    print(f"   ✓ {len(payments)} ta to'lov yaratildi")
    
    print("💬 Suhbatlarni yaratish...")
    conversations, messages = create_conversations(users, masters)
    print(f"   ✓ {len(conversations)} ta suhbat, {len(messages)} ta xabar")
    
    print("🎫 Chiptalarni yaratish...")
    tickets, ticket_messages = create_tickets(users)
    print(f"   ✓ {len(tickets)} ta chipta, {len(ticket_messages)} ta javob")
    
    print("🔔 Push obunalarni yaratish...")
    subscriptions = create_push_subscriptions(users)
    print(f"   ✓ {len(subscriptions)} ta obuna yaratildi")
    
    print("\n✅ Barcha mock ma'lumotlar muvaffaqiyatli yaratildi!")
    print(f"\n📊 Statistika:")
    print(f"   Foydalanuvchilar: {User.objects.count()}")
    print(f"   Ustalar: {Master.objects.count()}")
    print(f"   Buyurtmalar: {Order.objects.count()}")
    print(f"   Arizalar: {Application.objects.count()}")
    print(f"   To'lovlar: {Payment.objects.count()}")
    print(f"   Suhbatlar: {Conversation.objects.count()}")
    print(f"   Xabarlar: {Message.objects.count()}")
    print(f"   Chiptalar: {Ticket.objects.count()}")
    print(f"   Reklamalar: {Ad.objects.count()}")
    print(f"   Tariflar: {Tariff.objects.count()}")
    print(f"   Push obunalar: {WebPushDevice.objects.count()}")

if __name__ == '__main__':
    run()
