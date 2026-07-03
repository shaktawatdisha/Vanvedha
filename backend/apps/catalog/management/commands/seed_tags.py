"""
Usage:
    python manage.py seed_tags
    python manage.py seed_tags --clear   # wipe existing tags first
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.catalog.models import Tag


TAGS = [
    "Organic",
    "Bestseller",
    "New Arrival",
    "Whole",
    "Ground",
    "Blend",
    "Vegan",
    "Gluten-Free",
    "Non-GMO",
    "Premium",
    "Imported",
    "Single-Origin",
    "Gift Pack",
    "Spicy",
    "Aromatic",
]


def make_slug(name):
    base = slugify(name)
    slug, n = base, 1
    while Tag.objects.filter(slug=slug).exists():
        slug = f'{base}-{n}'
        n += 1
    return slug


class Command(BaseCommand):
    help = 'Seed the database with default product tags'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing tags before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = Tag.objects.count()
            Tag.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {count} existing tags.'))

        created_total = 0

        for name in TAGS:
            tag, created = Tag.objects.get_or_create(
                name=name,
                defaults={'slug': make_slug(name)},
            )
            if created:
                created_total += 1
                self.stdout.write(f'  Created: {name}')
            else:
                self.stdout.write(f'  Skipped (exists): {name}')

        self.stdout.write(self.style.SUCCESS(f'\nDone. Created {created_total} tags.'))
