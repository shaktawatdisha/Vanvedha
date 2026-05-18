"""
Cart service backed by Redis.

Cart key:
  - Anonymous:      cart:session:{session_key}
  - Authenticated:  cart:user:{user_id}

Cart value (Redis hash):
  items -> JSON string: {variant_id: quantity, ...}
  coupon_code -> string
"""
from django.core.cache import cache
from django.conf import settings
from apps.catalog.models import ProductVariant


CART_TTL = getattr(settings, 'CART_TTL_SECONDS', 60 * 60 * 24 * 7)


def _cart_key(request):
    if request.user.is_authenticated:
        return f'cart:user:{request.user.id}'
    return f'cart:session:{request.session.session_key or _ensure_session(request)}'


def _ensure_session(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


def _get_raw_cart(key):
    data = cache.get(key)
    if data is None:
        return {'items': {}, 'coupon_code': None}
    return data


def _save_cart(key, cart):
    cache.set(key, cart, CART_TTL)


def get_cart(request):
    key = _cart_key(request)
    raw = _get_raw_cart(key)
    variant_ids = list(raw['items'].keys())
    variants = {
        str(v.id): v
        for v in ProductVariant.objects.filter(id__in=variant_ids)
        .select_related('product')
        .prefetch_related('product__images')
    }
    items = []
    subtotal = 0
    for vid, qty in raw['items'].items():
        variant = variants.get(vid)
        if not variant:
            continue
        line_total = variant.price * qty
        subtotal += line_total
        primary_image = (
            variant.product.images.filter(is_primary=True).first()
            or variant.product.images.first()
        )
        image_url = request.build_absolute_uri(primary_image.image.url) if primary_image else None
        items.append({
            'variant_id': vid,
            'product_name': variant.product.name,
            'variant_label': f'{variant.weight}{variant.unit}',
            'price': float(variant.price),
            'mrp': float(variant.mrp),
            'quantity': qty,
            'line_total': float(line_total),
            'stock': variant.stock,
            'image_url': image_url,
        })

    shipping = 0 if subtotal >= settings.FREE_SHIPPING_THRESHOLD else settings.SHIPPING_CHARGE
    total = subtotal + shipping

    return {
        'items': items,
        'coupon_code': raw.get('coupon_code'),
        'subtotal': float(subtotal),
        'shipping_charge': float(shipping),
        'total': float(total),
        'item_count': len(items),
    }


def add_item(request, variant_id, quantity):
    key = _cart_key(request)
    cart = _get_raw_cart(key)
    vid = str(variant_id)
    current_qty = cart['items'].get(vid, 0)
    cart['items'][vid] = current_qty + quantity
    _save_cart(key, cart)


def update_item(request, variant_id, quantity):
    key = _cart_key(request)
    cart = _get_raw_cart(key)
    vid = str(variant_id)
    if quantity <= 0:
        cart['items'].pop(vid, None)
    else:
        cart['items'][vid] = quantity
    _save_cart(key, cart)


def remove_item(request, variant_id):
    key = _cart_key(request)
    cart = _get_raw_cart(key)
    cart['items'].pop(str(variant_id), None)
    _save_cart(key, cart)


def clear_cart(request):
    key = _cart_key(request)
    cache.delete(key)


def apply_coupon(request, coupon_code):
    key = _cart_key(request)
    cart = _get_raw_cart(key)
    cart['coupon_code'] = coupon_code
    _save_cart(key, cart)


def remove_coupon(request):
    key = _cart_key(request)
    cart = _get_raw_cart(key)
    cart['coupon_code'] = None
    _save_cart(key, cart)


def merge_carts(request, session_key):
    """Merge anonymous session cart into authenticated user cart on login."""
    session_cart_key = f'cart:session:{session_key}'
    user_cart_key = f'cart:user:{request.user.id}'

    session_cart = _get_raw_cart(session_cart_key)
    user_cart = _get_raw_cart(user_cart_key)

    for vid, qty in session_cart['items'].items():
        user_cart['items'][vid] = user_cart['items'].get(vid, 0) + qty

    _save_cart(user_cart_key, user_cart)
    cache.delete(session_cart_key)
