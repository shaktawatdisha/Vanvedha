"""
Usage:
    python manage.py seed_products
    python manage.py seed_products --clear   # wipe existing products first

Depends on categories from `seed_categories` and (optionally) tags from
`seed_tags` — any tag referenced here that doesn't exist yet is created
on the fly.
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.catalog.models import Category, Product, ProductVariant, Tag


PRODUCTS = [
    # ── Whole Spices ─────────────────────────────────────────────────────────
    {
        "name": "Ceylon Cinnamon Sticks",
        "sku": "WHL-001",
        "category": "Whole Spices",
        "description": "True Ceylon cinnamon sticks with a delicate, sweet flavour and thin layers.",
        "ingredients": "100% natural Ceylon cinnamon bark (Cinnamomum verum)",
        "origin": "Sri Lanka",
        "is_organic": False,
        "is_featured": True,
        "tags": ["Whole", "Imported", "Aromatic", "Bestseller", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 50, "unit": "g", "price": "80.00", "mrp": "100.00", "stock": 120, "is_default": True},
            {"weight": 100, "unit": "g", "price": "150.00", "mrp": "190.00", "stock": 80},
            {"weight": 250, "unit": "g", "price": "350.00", "mrp": "440.00", "stock": 40},
        ],
    },
    {
        "name": "Whole Cloves",
        "sku": "WHL-002",
        "category": "Whole Spices",
        "description": "Premium whole cloves with high eugenol content for intense aroma and flavour.",
        "ingredients": "100% natural cloves (Syzygium aromaticum)",
        "origin": "Kerala, India",
        "is_organic": False,
        "is_featured": True,
        "tags": ["Whole", "Aromatic", "Bestseller", "Single-Origin", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 50, "unit": "g", "price": "70.00", "mrp": "90.00", "stock": 130, "is_default": True},
            {"weight": 100, "unit": "g", "price": "130.00", "mrp": "165.00", "stock": 90},
            {"weight": 250, "unit": "g", "price": "310.00", "mrp": "395.00", "stock": 50},
        ],
    },
    {
        "name": "Whole Nutmeg",
        "sku": "WHL-003",
        "category": "Whole Spices",
        "description": "Whole nutmeg kernels for freshly grated spice in baked goods and warm beverages.",
        "ingredients": "100% natural nutmeg (Myristica fragrans)",
        "origin": "Kerala, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Whole", "Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 50, "unit": "g", "price": "65.00", "mrp": "80.00", "stock": 100, "is_default": True},
            {"weight": 100, "unit": "g", "price": "120.00", "mrp": "150.00", "stock": 70},
        ],
    },

    # ── Ground Spices ────────────────────────────────────────────────────────
    {
        "name": "Turmeric Powder",
        "sku": "GRD-001",
        "category": "Ground Spices",
        "description": "Bright-yellow turmeric powder with 3%+ curcumin content for colour and health benefits.",
        "ingredients": "100% pure turmeric powder (Curcuma longa)",
        "origin": "Erode, Tamil Nadu, India",
        "is_organic": True,
        "is_featured": True,
        "tags": ["Ground", "Organic", "Bestseller", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "42.00", "mrp": "55.00", "stock": 200, "is_default": True},
            {"weight": 250, "unit": "g", "price": "95.00", "mrp": "125.00", "stock": 150},
            {"weight": 500, "unit": "g", "price": "180.00", "mrp": "235.00", "stock": 90},
        ],
    },
    {
        "name": "Red Chili Powder",
        "sku": "GRD-002",
        "category": "Ground Spices",
        "description": "Fiery red chili powder ground from selected Byadagi and Guntur chilies.",
        "ingredients": "100% natural red chili powder (Capsicum annuum)",
        "origin": "Andhra Pradesh, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Ground", "Spicy", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "48.00", "mrp": "60.00", "stock": 200, "is_default": True},
            {"weight": 250, "unit": "g", "price": "108.00", "mrp": "138.00", "stock": 140},
            {"weight": 500, "unit": "g", "price": "205.00", "mrp": "260.00", "stock": 80},
        ],
    },
    {
        "name": "Coriander Powder",
        "sku": "GRD-003",
        "category": "Ground Spices",
        "description": "Finely milled coriander powder with a mild, citrusy warmth for everyday cooking.",
        "ingredients": "100% natural coriander powder (Coriandrum sativum)",
        "origin": "Madhya Pradesh, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Ground", "Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "38.00", "mrp": "48.00", "stock": 180, "is_default": True},
            {"weight": 250, "unit": "g", "price": "85.00", "mrp": "108.00", "stock": 120},
        ],
    },

    # ── Spice Blends & Masalas ──────────────────────────────────────────────
    {
        "name": "Garam Masala",
        "sku": "BLD-001",
        "category": "Spice Blends & Masalas",
        "description": "Authentic North Indian garam masala blend with 12 hand-selected whole spices.",
        "ingredients": "Coriander, cumin, black pepper, cardamom, cloves, cinnamon, bay leaf, mace, nutmeg, star anise, black cardamom, fennel",
        "origin": "India",
        "is_organic": False,
        "is_featured": True,
        "tags": ["Blend", "Bestseller", "Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "75.00", "mrp": "95.00", "stock": 180, "is_default": True},
            {"weight": 250, "unit": "g", "price": "170.00", "mrp": "215.00", "stock": 120},
            {"weight": 500, "unit": "g", "price": "320.00", "mrp": "405.00", "stock": 70},
        ],
    },
    {
        "name": "Curry Powder",
        "sku": "BLD-002",
        "category": "Spice Blends & Masalas",
        "description": "Classic Madras curry powder — a versatile blend for curries, sauces and marinades.",
        "ingredients": "Coriander, cumin, turmeric, chili, black pepper, curry leaves, mustard, fenugreek",
        "origin": "India",
        "is_organic": False,
        "is_featured": True,
        "tags": ["Blend", "Bestseller", "Spicy", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "55.00", "mrp": "70.00", "stock": 180, "is_default": True},
            {"weight": 250, "unit": "g", "price": "125.00", "mrp": "160.00", "stock": 120},
            {"weight": 500, "unit": "g", "price": "235.00", "mrp": "300.00", "stock": 70},
        ],
    },
    {
        "name": "Biryani Masala",
        "sku": "BLD-003",
        "category": "Spice Blends & Masalas",
        "description": "Hyderabadi-style biryani masala blend with whole and ground spices for restaurant-grade flavour.",
        "ingredients": "Cardamom, cloves, cinnamon, star anise, bay leaf, mace, dried chili, coriander, cumin",
        "origin": "Hyderabad, India",
        "is_organic": False,
        "is_featured": True,
        "tags": ["Blend", "Bestseller", "Aromatic", "Spicy", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "85.00", "mrp": "108.00", "stock": 150, "is_default": True},
            {"weight": 250, "unit": "g", "price": "195.00", "mrp": "245.00", "stock": 100},
        ],
    },

    # ── Seeds ────────────────────────────────────────────────────────────────
    {
        "name": "Cumin Seeds",
        "sku": "SED-001",
        "category": "Seeds",
        "description": "Premium whole cumin seeds with a warm, earthy aroma. Sourced from Rajasthan, India.",
        "ingredients": "100% natural cumin seeds (Cuminum cyminum)",
        "origin": "Rajasthan, India",
        "is_organic": True,
        "is_featured": True,
        "tags": ["Organic", "Bestseller", "Aromatic", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "45.00", "mrp": "55.00", "stock": 200, "is_default": True},
            {"weight": 250, "unit": "g", "price": "100.00", "mrp": "125.00", "stock": 150},
            {"weight": 500, "unit": "g", "price": "190.00", "mrp": "240.00", "stock": 100},
        ],
    },
    {
        "name": "Coriander Seeds",
        "sku": "SED-002",
        "category": "Seeds",
        "description": "Fresh, citrusy coriander seeds ideal for tempering and spice blends.",
        "ingredients": "100% natural coriander seeds (Coriandrum sativum)",
        "origin": "Madhya Pradesh, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "35.00", "mrp": "45.00", "stock": 180, "is_default": True},
            {"weight": 250, "unit": "g", "price": "80.00", "mrp": "100.00", "stock": 120},
            {"weight": 500, "unit": "g", "price": "150.00", "mrp": "190.00", "stock": 80},
        ],
    },
    {
        "name": "Fennel Seeds",
        "sku": "SED-003",
        "category": "Seeds",
        "description": "Sweet and aromatic fennel seeds used in cooking and as a mouth freshener.",
        "ingredients": "100% natural fennel seeds (Foeniculum vulgare)",
        "origin": "Gujarat, India",
        "is_organic": True,
        "is_featured": False,
        "tags": ["Organic", "Aromatic", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "40.00", "mrp": "50.00", "stock": 160, "is_default": True},
            {"weight": 250, "unit": "g", "price": "90.00", "mrp": "115.00", "stock": 100},
        ],
    },

    # ── Herbs & Leaves ───────────────────────────────────────────────────────
    {
        "name": "Dried Bay Leaves",
        "sku": "HRB-001",
        "category": "Herbs & Leaves",
        "description": "Aromatic dried Indian bay leaves (tejpatta) for biryanis, soups and slow-cooked dishes.",
        "ingredients": "100% natural bay leaves (Cinnamomum tamala)",
        "origin": "Uttarakhand, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 50, "unit": "g", "price": "25.00", "mrp": "35.00", "stock": 200, "is_default": True},
            {"weight": 100, "unit": "g", "price": "45.00", "mrp": "60.00", "stock": 150},
        ],
    },
    {
        "name": "Dried Curry Leaves",
        "sku": "HRB-002",
        "category": "Herbs & Leaves",
        "description": "Sun-dried curry leaves that retain their signature nutty, citrusy fragrance.",
        "ingredients": "100% natural curry leaves (Murraya koenigii)",
        "origin": "Tamil Nadu, India",
        "is_organic": True,
        "is_featured": False,
        "tags": ["Organic", "Aromatic", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 30, "unit": "g", "price": "30.00", "mrp": "40.00", "stock": 180, "is_default": True},
            {"weight": 100, "unit": "g", "price": "85.00", "mrp": "110.00", "stock": 100},
        ],
    },
    {
        "name": "Dried Oregano",
        "sku": "HRB-003",
        "category": "Herbs & Leaves",
        "description": "Greek mountain oregano with robust, peppery flavour for pizzas, pastas and grills.",
        "ingredients": "100% natural dried oregano (Origanum vulgare)",
        "origin": "Greece",
        "is_organic": True,
        "is_featured": False,
        "tags": ["Organic", "Imported", "Aromatic", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 30, "unit": "g", "price": "45.00", "mrp": "58.00", "stock": 150, "is_default": True},
            {"weight": 100, "unit": "g", "price": "130.00", "mrp": "165.00", "stock": 80},
        ],
    },

    # ── Roots & Rhizomes ─────────────────────────────────────────────────────
    {
        "name": "Dry Ginger",
        "sku": "ROT-001",
        "category": "Roots & Rhizomes",
        "description": "Sun-dried whole ginger with an intense, spicy warmth. Great for teas and curries.",
        "ingredients": "100% natural dry ginger (Zingiber officinale)",
        "origin": "Kerala, India",
        "is_organic": True,
        "is_featured": True,
        "tags": ["Organic", "Bestseller", "Spicy", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "60.00", "mrp": "75.00", "stock": 120, "is_default": True},
            {"weight": 250, "unit": "g", "price": "140.00", "mrp": "175.00", "stock": 80},
        ],
    },
    {
        "name": "Turmeric Fingers",
        "sku": "ROT-002",
        "category": "Roots & Rhizomes",
        "description": "High-curcumin whole turmeric fingers from Erode. Vibrant colour and earthy flavour.",
        "ingredients": "100% natural turmeric rhizome (Curcuma longa)",
        "origin": "Erode, Tamil Nadu, India",
        "is_organic": True,
        "is_featured": True,
        "tags": ["Organic", "Bestseller", "Single-Origin", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "50.00", "mrp": "65.00", "stock": 150, "is_default": True},
            {"weight": 250, "unit": "g", "price": "115.00", "mrp": "145.00", "stock": 100},
            {"weight": 500, "unit": "g", "price": "220.00", "mrp": "280.00", "stock": 60},
        ],
    },
    {
        "name": "Dried Galangal",
        "sku": "ROT-003",
        "category": "Roots & Rhizomes",
        "description": "Sliced dried galangal root with a sharp, citrusy-pine flavour used in Thai curries and soups.",
        "ingredients": "100% natural galangal root (Alpinia galanga)",
        "origin": "Thailand",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Imported", "Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 50, "unit": "g", "price": "55.00", "mrp": "70.00", "stock": 90, "is_default": True},
            {"weight": 100, "unit": "g", "price": "100.00", "mrp": "128.00", "stock": 60},
        ],
    },

    # ── Peppercorns & Chilies ────────────────────────────────────────────────
    {
        "name": "Black Pepper Whole",
        "sku": "PEP-001",
        "category": "Peppercorns & Chilies",
        "description": "Bold Malabar black pepper berries with sharp pungency and complex heat.",
        "ingredients": "100% natural black pepper (Piper nigrum)",
        "origin": "Wayanad, Kerala, India",
        "is_organic": True,
        "is_featured": True,
        "tags": ["Organic", "Bestseller", "Whole", "Spicy", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "90.00", "mrp": "115.00", "stock": 150, "is_default": True},
            {"weight": 250, "unit": "g", "price": "210.00", "mrp": "265.00", "stock": 100},
            {"weight": 500, "unit": "g", "price": "400.00", "mrp": "510.00", "stock": 60},
        ],
    },
    {
        "name": "Kashmiri Red Chili Whole",
        "sku": "PEP-002",
        "category": "Peppercorns & Chilies",
        "description": "Vibrant red Kashmiri chilies offering brilliant colour with mild heat.",
        "ingredients": "100% natural Kashmiri red chili (Capsicum annuum)",
        "origin": "Kashmir, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Whole", "Spicy", "Single-Origin", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "55.00", "mrp": "70.00", "stock": 160, "is_default": True},
            {"weight": 250, "unit": "g", "price": "125.00", "mrp": "160.00", "stock": 110},
        ],
    },
    {
        "name": "White Peppercorns",
        "sku": "PEP-003",
        "category": "Peppercorns & Chilies",
        "description": "Sun-dried white peppercorns with a sharper, more fermented heat than black pepper.",
        "ingredients": "100% natural white pepper (Piper nigrum)",
        "origin": "Sarawak, Malaysia",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Whole", "Spicy", "Imported", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 100, "unit": "g", "price": "110.00", "mrp": "140.00", "stock": 90, "is_default": True},
            {"weight": 250, "unit": "g", "price": "255.00", "mrp": "325.00", "stock": 60},
        ],
    },

    # ── Exotic & Rare Spices ─────────────────────────────────────────────────
    {
        "name": "Kashmir Saffron",
        "sku": "EXO-001",
        "category": "Exotic & Rare Spices",
        "description": "Grade-A Kashmiri Mongra saffron threads with rich colour and honeyed floral aroma.",
        "ingredients": "100% pure saffron stigmas (Crocus sativus)",
        "origin": "Pampore, Kashmir, India",
        "is_organic": True,
        "is_featured": True,
        "tags": ["Organic", "Premium", "Bestseller", "Single-Origin", "Non-GMO", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 1, "unit": "g", "price": "350.00", "mrp": "450.00", "stock": 80, "is_default": True},
            {"weight": 2, "unit": "g", "price": "680.00", "mrp": "870.00", "stock": 50},
            {"weight": 5, "unit": "g", "price": "1600.00", "mrp": "2050.00", "stock": 20},
        ],
    },
    {
        "name": "Star Anise",
        "sku": "EXO-002",
        "category": "Exotic & Rare Spices",
        "description": "Whole star anise pods with intense liquorice aroma, perfect for broths and masalas.",
        "ingredients": "100% natural star anise (Illicium verum)",
        "origin": "China",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Imported", "Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 50, "unit": "g", "price": "55.00", "mrp": "70.00", "stock": 120, "is_default": True},
            {"weight": 100, "unit": "g", "price": "100.00", "mrp": "130.00", "stock": 80},
        ],
    },
    {
        "name": "Mace Blades",
        "sku": "EXO-003",
        "category": "Exotic & Rare Spices",
        "description": "Delicate orange-red mace blades with warm, nutmeg-like fragrance for biryanis and desserts.",
        "ingredients": "100% natural mace (Myristica fragrans)",
        "origin": "Kerala, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Premium", "Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 25, "unit": "g", "price": "90.00", "mrp": "115.00", "stock": 80, "is_default": True},
            {"weight": 50, "unit": "g", "price": "170.00", "mrp": "215.00", "stock": 50},
        ],
    },

    # ── Salts ────────────────────────────────────────────────────────────────
    {
        "name": "Himalayan Pink Salt",
        "sku": "SLT-001",
        "category": "Salts",
        "description": "Mineral-rich pink rock salt hand-mined from ancient Himalayan deposits.",
        "ingredients": "100% natural Himalayan pink salt",
        "origin": "Punjab Region, Himalayas",
        "is_organic": False,
        "is_featured": True,
        "tags": ["Bestseller", "Single-Origin", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 250, "unit": "g", "price": "60.00", "mrp": "75.00", "stock": 200, "is_default": True},
            {"weight": 500, "unit": "g", "price": "110.00", "mrp": "140.00", "stock": 140},
            {"weight": 1000, "unit": "g", "price": "200.00", "mrp": "255.00", "stock": 80},
        ],
    },
    {
        "name": "Black Salt (Kala Namak)",
        "sku": "SLT-002",
        "category": "Salts",
        "description": "Pungent, sulphurous black salt widely used in chaats, raitas and digestive blends.",
        "ingredients": "100% natural black rock salt",
        "origin": "Uttar Pradesh, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 250, "unit": "g", "price": "45.00", "mrp": "58.00", "stock": 170, "is_default": True},
            {"weight": 500, "unit": "g", "price": "85.00", "mrp": "108.00", "stock": 110},
        ],
    },
    {
        "name": "Rock Salt (Sendha Namak)",
        "sku": "SLT-003",
        "category": "Salts",
        "description": "Unrefined crystal rock salt traditionally used during fasting and festive cooking.",
        "ingredients": "100% natural rock salt",
        "origin": "Rajasthan, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 250, "unit": "g", "price": "35.00", "mrp": "45.00", "stock": 200, "is_default": True},
            {"weight": 500, "unit": "g", "price": "65.00", "mrp": "85.00", "stock": 140},
        ],
    },

    # ── Gift & Sampler Packs ─────────────────────────────────────────────────
    {
        "name": "Classic Masala Gift Box",
        "sku": "GFT-001",
        "category": "Gift & Sampler Packs",
        "description": "A curated gift box of five bestselling masala blends, packaged for gifting.",
        "ingredients": "Garam masala, curry powder, biryani masala, chana masala, chaat masala",
        "origin": "India",
        "is_organic": False,
        "is_featured": True,
        "tags": ["Gift Pack", "Bestseller", "Blend", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 500, "unit": "g", "price": "450.00", "mrp": "575.00", "stock": 60, "is_default": True},
        ],
    },
    {
        "name": "Whole Spice Sampler Set",
        "sku": "GFT-002",
        "category": "Gift & Sampler Packs",
        "description": "A tin set of six premium whole spices for the home cook who likes to grind fresh.",
        "ingredients": "Cinnamon sticks, cloves, black peppercorns, green cardamom, star anise, bay leaves",
        "origin": "India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Gift Pack", "Whole", "Aromatic", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 300, "unit": "g", "price": "380.00", "mrp": "485.00", "stock": 50, "is_default": True},
        ],
    },
    {
        "name": "South Indian Spice Kit",
        "sku": "GFT-003",
        "category": "Gift & Sampler Packs",
        "description": "Everything needed for authentic South Indian cooking — sambar powder, rasam powder and more.",
        "ingredients": "Sambar powder, rasam powder, curry leaves, mustard seeds, urad dal",
        "origin": "Tamil Nadu, India",
        "is_organic": False,
        "is_featured": False,
        "tags": ["Gift Pack", "Blend", "Vegan", "Gluten-Free"],
        "variants": [
            {"weight": 400, "unit": "g", "price": "320.00", "mrp": "410.00", "stock": 45, "is_default": True},
        ],
    },
]


def make_slug(name):
    base = slugify(name)
    slug, n = base, 1
    while Product.objects.filter(slug=slug).exists():
        slug = f'{base}-{n}'
        n += 1
    return slug


def make_tag_slug(name):
    base = slugify(name)
    slug, n = base, 1
    while Tag.objects.filter(slug=slug).exists():
        slug = f'{base}-{n}'
        n += 1
    return slug


class Command(BaseCommand):
    help = 'Seed the database with 30 sample spice products across the 10 catalog categories'

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

                tag_objs = []
                for tag_name in data.get('tags', []):
                    tag, _ = Tag.objects.get_or_create(
                        name=tag_name,
                        defaults={'slug': make_tag_slug(tag_name)},
                    )
                    tag_objs.append(tag)
                if tag_objs:
                    product.tags.set(tag_objs)
                    self.stdout.write(f'    Tags: {", ".join(data["tags"])}')
            else:
                skipped_total += 1
                self.stdout.write(f'  Skipped (exists): {data["name"]}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. Created {created_total} products, skipped {skipped_total}.'
            )
        )
