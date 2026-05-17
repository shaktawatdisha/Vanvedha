"""
Usage:
    python manage.py seed_products
    python manage.py seed_products --clear   # wipe existing products first
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.catalog.models import Category, Product, ProductVariant


PRODUCTS = [
    # ── Spices by Plant Part ──────────────────────────────────────────────────

    # Seeds
    {
        "name": "Cumin Seeds",
        "sku": "SPP-SEED-001",
        "category": "Seeds",
        "description": "Premium whole cumin seeds with a warm, earthy aroma. Sourced from Rajasthan, India.",
        "ingredients": "100% natural cumin seeds (Cuminum cyminum)",
        "origin": "Rajasthan, India",
        "is_organic": True,
        "is_featured": True,
        "variants": [
            {"weight": 100, "unit": "g", "price": "45.00", "mrp": "55.00", "stock": 200, "is_default": True},
            {"weight": 250, "unit": "g", "price": "100.00", "mrp": "125.00", "stock": 150},
            {"weight": 500, "unit": "g", "price": "190.00", "mrp": "240.00", "stock": 100},
        ],
    },
    {
        "name": "Coriander Seeds",
        "sku": "SPP-SEED-002",
        "category": "Seeds",
        "description": "Fresh, citrusy coriander seeds ideal for tempering and spice blends.",
        "ingredients": "100% natural coriander seeds (Coriandrum sativum)",
        "origin": "Madhya Pradesh, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 100, "unit": "g", "price": "35.00", "mrp": "45.00", "stock": 180, "is_default": True},
            {"weight": 250, "unit": "g", "price": "80.00", "mrp": "100.00", "stock": 120},
            {"weight": 500, "unit": "g", "price": "150.00", "mrp": "190.00", "stock": 80},
        ],
    },
    {
        "name": "Fennel Seeds",
        "sku": "SPP-SEED-003",
        "category": "Seeds",
        "description": "Sweet and aromatic fennel seeds used in cooking and as a mouth freshener.",
        "ingredients": "100% natural fennel seeds (Foeniculum vulgare)",
        "origin": "Gujarat, India",
        "is_organic": True,
        "is_featured": False,
        "variants": [
            {"weight": 100, "unit": "g", "price": "40.00", "mrp": "50.00", "stock": 160, "is_default": True},
            {"weight": 250, "unit": "g", "price": "90.00", "mrp": "115.00", "stock": 100},
        ],
    },
    {
        "name": "Mustard Seeds",
        "sku": "SPP-SEED-004",
        "category": "Seeds",
        "description": "Bold black mustard seeds essential for South Indian tempering and pickles.",
        "ingredients": "100% natural black mustard seeds (Brassica nigra)",
        "origin": "West Bengal, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 100, "unit": "g", "price": "30.00", "mrp": "38.00", "stock": 200, "is_default": True},
            {"weight": 250, "unit": "g", "price": "68.00", "mrp": "88.00", "stock": 150},
            {"weight": 500, "unit": "g", "price": "130.00", "mrp": "165.00", "stock": 90},
        ],
    },

    # Roots
    {
        "name": "Dry Ginger",
        "sku": "SPP-ROOT-001",
        "category": "Roots",
        "description": "Sun-dried whole ginger with an intense, spicy warmth. Great for teas and curries.",
        "ingredients": "100% natural dry ginger (Zingiber officinale)",
        "origin": "Kerala, India",
        "is_organic": True,
        "is_featured": True,
        "variants": [
            {"weight": 100, "unit": "g", "price": "60.00", "mrp": "75.00", "stock": 120, "is_default": True},
            {"weight": 250, "unit": "g", "price": "140.00", "mrp": "175.00", "stock": 80},
        ],
    },
    {
        "name": "Turmeric Fingers",
        "sku": "SPP-ROOT-002",
        "category": "Roots",
        "description": "High-curcumin whole turmeric fingers from Erode. Vibrant colour and earthy flavour.",
        "ingredients": "100% natural turmeric rhizome (Curcuma longa)",
        "origin": "Erode, Tamil Nadu, India",
        "is_organic": True,
        "is_featured": True,
        "variants": [
            {"weight": 100, "unit": "g", "price": "50.00", "mrp": "65.00", "stock": 150, "is_default": True},
            {"weight": 250, "unit": "g", "price": "115.00", "mrp": "145.00", "stock": 100},
            {"weight": 500, "unit": "g", "price": "220.00", "mrp": "280.00", "stock": 60},
        ],
    },

    # Bark
    {
        "name": "Cinnamon Sticks",
        "sku": "SPP-BARK-001",
        "category": "Bark",
        "description": "True Ceylon cinnamon sticks with a delicate, sweet flavour and thin layers.",
        "ingredients": "100% natural Ceylon cinnamon bark (Cinnamomum verum)",
        "origin": "Sri Lanka",
        "is_organic": False,
        "is_featured": True,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "80.00",  "mrp": "100.00", "stock": 120, "is_default": True},
            {"weight": 100, "unit": "g", "price": "150.00", "mrp": "190.00", "stock": 80},
            {"weight": 250, "unit": "g", "price": "350.00", "mrp": "440.00", "stock": 40},
        ],
    },

    # Leaves
    {
        "name": "Dried Bay Leaves",
        "sku": "SPP-LEAF-001",
        "category": "Leaves",
        "description": "Aromatic dried Indian bay leaves (tejpatta) for biryanis, soups and slow-cooked dishes.",
        "ingredients": "100% natural bay leaves (Cinnamomum tamala)",
        "origin": "Uttarakhand, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "25.00", "mrp": "35.00", "stock": 200, "is_default": True},
            {"weight": 100, "unit": "g", "price": "45.00", "mrp": "60.00", "stock": 150},
        ],
    },
    {
        "name": "Dried Curry Leaves",
        "sku": "SPP-LEAF-002",
        "category": "Leaves",
        "description": "Sun-dried curry leaves that retain their signature nutty, citrusy fragrance.",
        "ingredients": "100% natural curry leaves (Murraya koenigii)",
        "origin": "Tamil Nadu, India",
        "is_organic": True,
        "is_featured": False,
        "variants": [
            {"weight": 30,  "unit": "g", "price": "30.00", "mrp": "40.00", "stock": 180, "is_default": True},
            {"weight": 100, "unit": "g", "price": "85.00", "mrp": "110.00", "stock": 100},
        ],
    },

    # Flowers
    {
        "name": "Whole Cloves",
        "sku": "SPP-FLOW-001",
        "category": "Flowers",
        "description": "Premium whole cloves with high eugenol content for intense aroma and flavour.",
        "ingredients": "100% natural cloves (Syzygium aromaticum)",
        "origin": "Kerala, India",
        "is_organic": False,
        "is_featured": True,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "70.00",  "mrp": "90.00",  "stock": 130, "is_default": True},
            {"weight": 100, "unit": "g", "price": "130.00", "mrp": "165.00", "stock": 90},
            {"weight": 250, "unit": "g", "price": "310.00", "mrp": "395.00", "stock": 50},
        ],
    },
    {
        "name": "Kashmir Saffron",
        "sku": "SPP-FLOW-002",
        "category": "Flowers",
        "description": "Grade-A Kashmiri Mongra saffron threads with rich colour and honeyed floral aroma.",
        "ingredients": "100% pure saffron stigmas (Crocus sativus)",
        "origin": "Pampore, Kashmir, India",
        "is_organic": True,
        "is_featured": True,
        "variants": [
            {"weight": 1,  "unit": "g", "price": "350.00",  "mrp": "450.00",  "stock": 80, "is_default": True},
            {"weight": 2,  "unit": "g", "price": "680.00",  "mrp": "870.00",  "stock": 50},
            {"weight": 5,  "unit": "g", "price": "1600.00", "mrp": "2050.00", "stock": 20},
        ],
    },

    # Fruits
    {
        "name": "Black Pepper Whole",
        "sku": "SPP-FRUT-001",
        "category": "Fruits",
        "description": "Bold Malabar black pepper berries with sharp pungency and complex heat.",
        "ingredients": "100% natural black pepper (Piper nigrum)",
        "origin": "Wayanad, Kerala, India",
        "is_organic": True,
        "is_featured": True,
        "variants": [
            {"weight": 100, "unit": "g", "price": "90.00",  "mrp": "115.00", "stock": 150, "is_default": True},
            {"weight": 250, "unit": "g", "price": "210.00", "mrp": "265.00", "stock": 100},
            {"weight": 500, "unit": "g", "price": "400.00", "mrp": "510.00", "stock": 60},
        ],
    },
    {
        "name": "Green Cardamom Pods",
        "sku": "SPP-FRUT-002",
        "category": "Fruits",
        "description": "Bold green cardamom pods bursting with sweet, eucalyptus-like fragrance.",
        "ingredients": "100% natural green cardamom (Elettaria cardamomum)",
        "origin": "Idukki, Kerala, India",
        "is_organic": False,
        "is_featured": True,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "120.00", "mrp": "150.00", "stock": 100, "is_default": True},
            {"weight": 100, "unit": "g", "price": "230.00", "mrp": "290.00", "stock": 70},
            {"weight": 250, "unit": "g", "price": "550.00", "mrp": "695.00", "stock": 30},
        ],
    },

    # ── Spices by Flavor ──────────────────────────────────────────────────────

    # Hot & Spicy
    {
        "name": "Kashmiri Red Chili Whole",
        "sku": "SPF-HOT-001",
        "category": "Hot & Spicy",
        "description": "Vibrant red Kashmiri chilies offering brilliant colour with mild heat.",
        "ingredients": "100% natural Kashmiri red chili (Capsicum annuum)",
        "origin": "Kashmir, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 100, "unit": "g", "price": "55.00", "mrp": "70.00", "stock": 160, "is_default": True},
            {"weight": 250, "unit": "g", "price": "125.00", "mrp": "160.00", "stock": 110},
        ],
    },

    # Sweet
    {
        "name": "Whole Nutmeg",
        "sku": "SPF-SWT-001",
        "category": "Sweet",
        "description": "Whole nutmeg kernels for freshly grated spice in baked goods and warm beverages.",
        "ingredients": "100% natural nutmeg (Myristica fragrans)",
        "origin": "Kerala, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "65.00",  "mrp": "80.00",  "stock": 100, "is_default": True},
            {"weight": 100, "unit": "g", "price": "120.00", "mrp": "150.00", "stock": 70},
        ],
    },

    # Earthy
    {
        "name": "Turmeric Powder",
        "sku": "SPF-ERT-001",
        "category": "Earthy",
        "description": "Bright-yellow turmeric powder with 3%+ curcumin content for colour and health benefits.",
        "ingredients": "100% pure turmeric powder (Curcuma longa)",
        "origin": "Erode, Tamil Nadu, India",
        "is_organic": True,
        "is_featured": True,
        "variants": [
            {"weight": 100, "unit": "g", "price": "42.00", "mrp": "55.00", "stock": 200, "is_default": True},
            {"weight": 250, "unit": "g", "price": "95.00", "mrp": "125.00", "stock": 150},
            {"weight": 500, "unit": "g", "price": "180.00", "mrp": "235.00", "stock": 90},
        ],
    },

    # Aromatic
    {
        "name": "Star Anise",
        "sku": "SPF-ARO-001",
        "category": "Aromatic",
        "description": "Whole star anise pods with intense liquorice aroma, perfect for broths and masalas.",
        "ingredients": "100% natural star anise (Illicium verum)",
        "origin": "China",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "55.00",  "mrp": "70.00",  "stock": 120, "is_default": True},
            {"weight": 100, "unit": "g", "price": "100.00", "mrp": "130.00", "stock": 80},
        ],
    },

    # Tangy
    {
        "name": "Amchur Powder",
        "sku": "SPF-TNG-001",
        "category": "Tangy",
        "description": "Sour dried mango powder that adds bright tanginess to chaat, curries and marinades.",
        "ingredients": "100% natural dried green mango (Mangifera indica)",
        "origin": "Uttar Pradesh, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 100, "unit": "g", "price": "38.00", "mrp": "50.00", "stock": 170, "is_default": True},
            {"weight": 250, "unit": "g", "price": "85.00", "mrp": "110.00", "stock": 100},
        ],
    },

    # ── Spices by Cuisine ─────────────────────────────────────────────────────

    # Indian Spices
    {
        "name": "Garam Masala",
        "sku": "SPC-IND-001",
        "category": "Indian Spices",
        "description": "Authentic North Indian garam masala blend with 12 hand-selected whole spices.",
        "ingredients": "Coriander, cumin, black pepper, cardamom, cloves, cinnamon, bay leaf, mace, nutmeg, star anise, black cardamom, fennel",
        "origin": "India",
        "is_organic": False,
        "is_featured": True,
        "variants": [
            {"weight": 100, "unit": "g", "price": "75.00",  "mrp": "95.00",  "stock": 180, "is_default": True},
            {"weight": 250, "unit": "g", "price": "170.00", "mrp": "215.00", "stock": 120},
            {"weight": 500, "unit": "g", "price": "320.00", "mrp": "405.00", "stock": 70},
        ],
    },

    # Mediterranean Spices
    {
        "name": "Dried Oregano",
        "sku": "SPC-MED-001",
        "category": "Mediterranean Spices",
        "description": "Greek mountain oregano with robust, peppery flavour for pizzas, pastas and grills.",
        "ingredients": "100% natural dried oregano (Origanum vulgare)",
        "origin": "Greece",
        "is_organic": True,
        "is_featured": False,
        "variants": [
            {"weight": 30,  "unit": "g", "price": "45.00", "mrp": "58.00", "stock": 150, "is_default": True},
            {"weight": 100, "unit": "g", "price": "130.00", "mrp": "165.00", "stock": 80},
        ],
    },

    # Asian Spices
    {
        "name": "Lemongrass Stalks",
        "sku": "SPC-ASN-001",
        "category": "Asian Spices",
        "description": "Dried lemongrass stalks with bright citrus notes for Thai curries and herbal teas.",
        "ingredients": "100% natural lemongrass (Cymbopogon citratus)",
        "origin": "Thailand",
        "is_organic": True,
        "is_featured": False,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "50.00", "mrp": "65.00", "stock": 120, "is_default": True},
            {"weight": 100, "unit": "g", "price": "90.00", "mrp": "115.00", "stock": 80},
        ],
    },

    # Mexican Spices
    {
        "name": "Smoked Paprika",
        "sku": "SPC-MEX-001",
        "category": "Mexican Spices",
        "description": "Spanish-style smoked paprika for BBQ rubs, stews and authentic Mexican dishes.",
        "ingredients": "100% natural smoked sweet red pepper (Capsicum annuum)",
        "origin": "Spain",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 75,  "unit": "g", "price": "85.00",  "mrp": "105.00", "stock": 130, "is_default": True},
            {"weight": 150, "unit": "g", "price": "160.00", "mrp": "200.00", "stock": 80},
        ],
    },

    # ── Spices by Form ────────────────────────────────────────────────────────

    # Whole Spices
    {
        "name": "Black Cardamom",
        "sku": "SPO-WHL-001",
        "category": "Whole Spices",
        "description": "Smoky, camphor-like black cardamom pods for biryanis and slow-cooked meat dishes.",
        "ingredients": "100% natural black cardamom (Amomum subulatum)",
        "origin": "Sikkim, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "80.00",  "mrp": "100.00", "stock": 100, "is_default": True},
            {"weight": 100, "unit": "g", "price": "150.00", "mrp": "190.00", "stock": 60},
        ],
    },

    # Ground Spices
    {
        "name": "Red Chili Powder",
        "sku": "SPO-GRD-001",
        "category": "Ground Spices",
        "description": "Fiery red chili powder ground from selected Byadagi and Guntur chilies.",
        "ingredients": "100% natural red chili powder (Capsicum annuum)",
        "origin": "Andhra Pradesh, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 100, "unit": "g", "price": "48.00", "mrp": "60.00", "stock": 200, "is_default": True},
            {"weight": 250, "unit": "g", "price": "108.00", "mrp": "138.00", "stock": 140},
            {"weight": 500, "unit": "g", "price": "205.00", "mrp": "260.00", "stock": 80},
        ],
    },

    # Blended Spices
    {
        "name": "Curry Powder",
        "sku": "SPO-BLD-001",
        "category": "Blended Spices",
        "description": "Classic Madras curry powder — a versatile blend for curries, sauces and marinades.",
        "ingredients": "Coriander, cumin, turmeric, chili, black pepper, curry leaves, mustard, fenugreek",
        "origin": "India",
        "is_organic": False,
        "is_featured": True,
        "variants": [
            {"weight": 100, "unit": "g", "price": "55.00",  "mrp": "70.00",  "stock": 180, "is_default": True},
            {"weight": 250, "unit": "g", "price": "125.00", "mrp": "160.00", "stock": 120},
            {"weight": 500, "unit": "g", "price": "235.00", "mrp": "300.00", "stock": 70},
        ],
    },

    # ── Spices by Function ────────────────────────────────────────────────────

    # Base Flavor
    {
        "name": "Fenugreek Seeds",
        "sku": "SPU-BAS-001",
        "category": "Base Flavor",
        "description": "Bitter, maple-scented fenugreek seeds for dals, pickles and spice tempering.",
        "ingredients": "100% natural fenugreek seeds (Trigonella foenum-graecum)",
        "origin": "Rajasthan, India",
        "is_organic": True,
        "is_featured": False,
        "variants": [
            {"weight": 100, "unit": "g", "price": "30.00", "mrp": "40.00", "stock": 180, "is_default": True},
            {"weight": 250, "unit": "g", "price": "68.00", "mrp": "88.00", "stock": 120},
        ],
    },

    # Coloring Agents
    {
        "name": "Annatto Seeds",
        "sku": "SPU-COL-001",
        "category": "Coloring Agents",
        "description": "Natural annatto (achiote) seeds for vibrant orange-red colour in rice and sauces.",
        "ingredients": "100% natural annatto seeds (Bixa orellana)",
        "origin": "Peru",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 50,  "unit": "g", "price": "60.00",  "mrp": "75.00",  "stock": 90,  "is_default": True},
            {"weight": 100, "unit": "g", "price": "110.00", "mrp": "140.00", "stock": 60},
        ],
    },

    # Aroma Enhancers
    {
        "name": "Mace Blades",
        "sku": "SPU-ARO-001",
        "category": "Aroma Enhancers",
        "description": "Delicate orange-red mace blades with warm, nutmeg-like fragrance for biryanis and desserts.",
        "ingredients": "100% natural mace (Myristica fragrans)",
        "origin": "Kerala, India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 25,  "unit": "g", "price": "90.00",  "mrp": "115.00", "stock": 80,  "is_default": True},
            {"weight": 50,  "unit": "g", "price": "170.00", "mrp": "215.00", "stock": 50},
        ],
    },

    # Heat Providers
    {
        "name": "Cayenne Pepper Powder",
        "sku": "SPU-HET-001",
        "category": "Heat Providers",
        "description": "Pure cayenne pepper powder with consistent, clean heat for sauces and dry rubs.",
        "ingredients": "100% natural cayenne pepper (Capsicum annuum)",
        "origin": "India",
        "is_organic": False,
        "is_featured": False,
        "variants": [
            {"weight": 75,  "unit": "g", "price": "45.00", "mrp": "58.00", "stock": 170, "is_default": True},
            {"weight": 200, "unit": "g", "price": "108.00", "mrp": "138.00", "stock": 110},
        ],
    },
]


def make_slug(name):
    from django.utils.text import slugify
    base = slugify(name)
    slug, n = base, 1
    while Product.objects.filter(slug=slug).exists():
        slug = f'{base}-{n}'
        n += 1
    return slug


class Command(BaseCommand):
    help = 'Seed the database with sample spice products for every leaf category'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing products (and their variants) before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = Product.objects.count()
            Product.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {count} existing products.'))

        created_total = 0
        skipped_total = 0

        for data in PRODUCTS:
            category_name = data['category']
            try:
                category = Category.objects.get(name=category_name)
            except Category.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'  Category not found: "{category_name}" — run seed_categories first.')
                )
                continue

            product, created = Product.objects.get_or_create(
                sku=data['sku'],
                defaults={
                    'name':             data['name'],
                    'slug':             make_slug(data['name']),
                    'category':         category,
                    'description':      data['description'],
                    'ingredients':      data['ingredients'],
                    'origin':           data['origin'],
                    'is_organic':       data['is_organic'],
                    'is_featured':      data['is_featured'],
                    'meta_title':       data['name'],
                    'meta_description': data['description'][:160],
                },
            )

            if created:
                created_total += 1
                self.stdout.write(f'  Created: {data["name"]} [{category_name}]')

                for v in data.get('variants', []):
                    ProductVariant.objects.create(
                        product=product,
                        weight=v['weight'],
                        unit=v['unit'],
                        price=v['price'],
                        mrp=v['mrp'],
                        stock=v['stock'],
                        low_stock_threshold=10,
                        is_default=v.get('is_default', False),
                    )
                    self.stdout.write(f'    Variant: {v["weight"]}{v["unit"]}')
            else:
                skipped_total += 1
                self.stdout.write(f'  Skipped (exists): {data["name"]}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. Created {created_total} products, skipped {skipped_total}.'
            )
        )
