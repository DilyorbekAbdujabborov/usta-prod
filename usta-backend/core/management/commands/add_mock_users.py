import random
import datetime

from django.core.management.base import BaseCommand
from django.db import IntegrityError

import seed_mock
from categories.models import Category
from masters.models import Master


class Command(BaseCommand):
    help = (
        "Add N mock demo users (clients/masters) without touching any existing "
        "data. Safe to run against production — unlike seed_data, this never "
        "deletes anything."
    )

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=20, help='How many mock users to add (default 20)')

    def handle(self, *args, **options):
        count = options['count']
        categories = list(Category.objects.all())
        if not categories:
            categories = seed_mock.create_categories()

        users = []
        for _ in range(count):
            for _attempt in range(5):
                try:
                    role = random.choices(['client', 'master'], weights=[65, 35])[0]
                    user = seed_mock.User.objects.create_user(
                        phone=seed_mock.random_phone(),
                        name=random.choice(seed_mock.UZBEK_NAMES),
                        password='password123',
                        role=role,
                        balance=random.randint(0, 2000000),
                    )
                    users.append(user)
                    break
                except IntegrityError:
                    continue

        masters = []
        for user in users:
            if user.role != 'master':
                continue
            region = random.choice(seed_mock.REGIONS)
            masters.append(Master.objects.create(
                user=user,
                category_id=random.choice(categories),
                avatar_url=f"https://i.pravatar.cc/300?img={random.randint(1, 70)}",
                bio=random.choice(seed_mock.UZBEK_BIOS),
                specialty=random.choice(categories).name,
                services=random.choice(seed_mock.SERVICE_TEXT_TEMPLATES),
                rating=round(random.uniform(3.5, 5.0), 2),
                reviews_count=random.randint(0, 60),
                experience=random.randint(1, 20),
                price=random.randint(50000, 1500000),
                region=region,
                district=seed_mock.random_district(region),
                is_active=True,
                verified=random.random() > 0.3,
            ))

        self.stdout.write(self.style.SUCCESS(
            f"Qo'shildi: {len(users)} ta foydalanuvchi ({len(masters)} ta usta). "
            f"Mavjud ma'lumotlar tegilmadi."
        ))
