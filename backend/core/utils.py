import uuid
from datetime import date


def generate_order_number():
    """Generate order number like VV-2024-00001."""
    year = date.today().year
    unique = str(uuid.uuid4().int)[:5]
    return f'VV-{year}-{unique}'
