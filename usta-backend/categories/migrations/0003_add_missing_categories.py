from django.db import migrations


MISSING_CATEGORIES = [
    ('locksmith', 'Qulfchi', 'bg-gray-50 text-gray-600', '', 14),
    ('IT xizmatlari', 'IT xizmatlari (eski)', 'bg-brand/10 text-brand', 'https://images.unsplash.com/photo-1605379399642-870262d3d051', 15),
]


def add_missing_categories(apps, schema_editor):
    Category = apps.get_model('categories', 'Category')
    for cat_id, name, color, image, sort_order in MISSING_CATEGORIES:
        Category.objects.update_or_create(
            id=cat_id,
            defaults={
                'name': name,
                'color': color,
                'image': image,
                'sort_order': sort_order,
                'is_active': True,
            }
        )


def reverse_add_missing_categories(apps, schema_editor):
    Category = apps.get_model('categories', 'Category')
    Category.objects.filter(id__in=[c[0] for c in MISSING_CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0002_populate_categories'),
    ]

    operations = [
        migrations.RunPython(add_missing_categories, reverse_add_missing_categories),
    ]
