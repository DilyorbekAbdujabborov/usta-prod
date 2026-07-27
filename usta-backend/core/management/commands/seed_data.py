from django.core.management.base import BaseCommand
import seed_mock


class Command(BaseCommand):
    help = 'Seed database with mock data'

    def handle(self, *args, **options):
        seed_mock.run()
