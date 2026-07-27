from django.db import migrations


CATEGORIES = [
    ('plumbing', 'Santexnik', 'bg-blue-50 text-blue-600', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1', 1),
    ('electrician', 'Elektrik', 'bg-amber-50 text-amber-600', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e', 2),
    ('construction', 'Qurilish', 'bg-orange-50 text-orange-600', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd', 3),
    ('ac', 'Konditsioner', 'bg-cyan-50 text-cyan-600', 'https://images.unsplash.com/photo-1585338107529-13afc5f02586', 4),
    ('welding', 'Payvandchi', 'bg-red-50 text-red-600', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122', 5),
    ('carpenter', 'Duradgor', 'bg-amber-100 text-amber-800', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88', 6),
    ('painter', "Bo'yoqchi", 'bg-purple-50 text-purple-600', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f', 7),
    ('cleaning', 'Tozalash', 'bg-blue-50 text-blue-600', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 8),
    ('internet', 'Internet', 'bg-indigo-50 text-indigo-600', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8', 9),
    ('computer', 'Kompyuter', 'bg-slate-50 text-slate-700', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b', 10),
    ('camera', 'Kamera', 'bg-rose-50 text-rose-600', 'https://images.unsplash.com/photo-1557597774-9d273605dfa9', 11),
    ('tv', 'Televizor', 'bg-sky-50 text-sky-600', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575', 12),
    ('it', 'IT xizmatlari', 'bg-brand/10 text-brand', 'https://images.unsplash.com/photo-1605379399642-870262d3d051', 13),
    ('locksmith', 'Qulfchi', 'bg-gray-50 text-gray-600', '', 14),
    ('IT xizmatlari', 'IT xizmatlari (eski)', 'bg-brand/10 text-brand', 'https://images.unsplash.com/photo-1605379399642-870262d3d051', 15),
]


def populate_categories(apps, schema_editor):
    Category = apps.get_model('categories', 'Category')
    for cat_id, name, color, image, sort_order in CATEGORIES:
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


def reverse_populate_categories(apps, schema_editor):
    Category = apps.get_model('categories', 'Category')
    Category.objects.filter(id__in=[c[0] for c in CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(populate_categories, reverse_populate_categories),
    ]
