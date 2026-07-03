"""
Usage:
    python manage.py seed_categories
    python manage.py seed_categories --clear   # wipe existing categories first
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.catalog.models import Category


CATEGORIES = [
    # (name, description)
    ("Whole Spices", "Unground whole spices that retain maximum flavour until use"),
    ("Ground Spices", "Finely milled single spices ready to cook with"),
    ("Spice Blends & Masalas", "Multi-spice blends crafted for specific dishes and cuisines"),
    ("Seeds", "Aromatic culinary seeds used whole or toasted"),
    ("Herbs & Leaves", "Dried aromatic leaves and herbs"),
    ("Roots & Rhizomes", "Dried roots and rhizomes prized for pungency and colour"),
    ("Peppercorns & Chilies", "Peppercorns and dried chilies for heat and pungency"),
    ("Exotic & Rare Spices", "Rare, high-value spices sourced in limited quantities"),
    ("Salts", "Natural and mineral-rich culinary salts"),
    ("Gift & Sampler Packs", "Curated spice collections and gift boxes"),
]


def make_slug(name):
    base = slugify(name)
    slug, n = base, 1
    while Category.objects.filter(slug=slug).exists():
        slug = f'{base}-{n}'
        n += 1
    return slug


class Command(BaseCommand):
    help = 'Seed the database with 10 flat product categories'

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

        for name, description in CATEGORIES:
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={'slug': make_slug(name), 'description': description},
            )
            if created:
                created_total += 1
                self.stdout.write(f'  Created: {name}')
            else:
                self.stdout.write(f'  Skipped (exists): {name}')

        self.stdout.write(self.style.SUCCESS(f'\nDone. Created {created_total} categories.'))
