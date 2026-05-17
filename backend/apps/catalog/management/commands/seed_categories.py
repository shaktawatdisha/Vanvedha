"""
Usage:
    python manage.py seed_categories
    python manage.py seed_categories --clear   # wipe existing categories first
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.catalog.models import Category


CATEGORIES = [
    # (name, description, [children])

    # 1. Based on Plant Part
    ("Spices by Plant Part", "Categorization based on part of plant used", [
        ("Seeds", "Cumin, coriander, fennel, mustard seeds"),
        ("Roots", "Ginger, turmeric"),
        ("Bark", "Cinnamon and similar bark spices"),
        ("Leaves", "Bay leaf, curry leaves"),
        ("Flowers", "Cloves, saffron"),
        ("Fruits", "Black pepper, cardamom"),
    ]),

    # 2. Based on Flavor Profile
    ("Spices by Flavor", "Categorization based on taste and flavor profile", [
        ("Hot & Spicy", "Chili, black pepper, mustard"),
        ("Sweet", "Cinnamon, nutmeg, cardamom"),
        ("Earthy", "Cumin, turmeric"),
        ("Aromatic", "Cloves, star anise"),
        ("Tangy", "Amchur, sumac"),
    ]),

    # 3. Based on Cuisine
    ("Spices by Cuisine", "Categorization based on regional usage", [
        ("Indian Spices", "Turmeric, cumin, garam masala"),
        ("Mediterranean Spices", "Oregano, thyme, rosemary"),
        ("Asian Spices", "Star anise, lemongrass, Sichuan pepper"),
        ("Mexican Spices", "Paprika, cumin, chili powder"),
    ]),

    # 4. Based on Usage Form
    ("Spices by Form", "Categorization based on physical form", [
        ("Whole Spices", "Cloves, cardamom pods, cinnamon sticks"),
        ("Ground Spices", "Turmeric powder, chili powder"),
        ("Blended Spices", "Garam masala, curry powder"),
    ]),

    # 5. Based on Function in Cooking
    ("Spices by Function", "Categorization based on cooking role", [
        ("Base Flavor", "Cumin, mustard seeds"),
        ("Coloring Agents", "Turmeric, paprika"),
        ("Aroma Enhancers", "Cardamom, cloves"),
        ("Heat Providers", "Chili, black pepper"),
    ]),
]


def make_slug(name):
    base = slugify(name)
    slug, n = base, 1
    while Category.objects.filter(slug=slug).exists():
        slug = f'{base}-{n}'
        n += 1
    return slug


class Command(BaseCommand):
    help = 'Seed the database with default product categories'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing categories before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = Category.objects.count()
            Category.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {count} existing categories.'))

        created_total = 0

        for name, description, children in CATEGORIES:
            parent, created = Category.objects.get_or_create(
                name=name,
                defaults={'slug': make_slug(name), 'description': description},
            )
            if created:
                created_total += 1
                self.stdout.write(f'  Created: {name}')
            else:
                self.stdout.write(f'  Skipped (exists): {name}')

            for child_name, child_desc in children:
                child, child_created = Category.objects.get_or_create(
                    name=child_name,
                    defaults={
                        'slug':        make_slug(child_name),
                        'description': child_desc,
                        'parent':      parent,
                    },
                )
                if child_created:
                    created_total += 1
                    self.stdout.write(f'    Created: {child_name}')
                else:
                    self.stdout.write(f'    Skipped (exists): {child_name}')

        self.stdout.write(self.style.SUCCESS(f'\nDone. Created {created_total} categories.'))


