from django.db import transaction
from django.db.models import F
from django.conf import settings
from core.utils import generate_order_number
from core.exceptions import InsufficientStockError
from apps.catalog.models import ProductVariant
from apps.cart import services as cart_services
from apps.coupons import services as coupon_services
from .models import Order, OrderItem, OrderStatusHistory


def create_order(request, shipping_address_data, notes='', coupon_code=None):
    cart = cart_services.get_cart(request)

    if not cart['items']:
        raise ValueError('Cart is empty.')

    subtotal = cart['subtotal']
    discount_amount = 0
    coupon_obj = None

    if coupon_code:
        result = coupon_services.validate_coupon(coupon_code, request.user, subtotal)
        if result['valid']:
            discount_amount = result['discount_amount']
            from apps.coupons.models import Coupon
            coupon_obj = Coupon.objects.get(id=result['coupon_id'])

    shipping_charge = 0 if (subtotal - discount_amount) >= settings.FREE_SHIPPING_THRESHOLD else settings.SHIPPING_CHARGE
    taxable = subtotal - discount_amount
    tax_amount = round(taxable * settings.GST_RATE, 2)
    total_amount = taxable + shipping_charge + tax_amount

    with transaction.atomic():
        # Lock and validate stock
        variant_ids = [item['variant_id'] for item in cart['items']]
        variants = {
            str(v.id): v
            for v in ProductVariant.objects.select_for_update().filter(id__in=variant_ids)
        }

        for item in cart['items']:
            variant = variants.get(item['variant_id'])
            if not variant or variant.stock < item['quantity']:
                raise InsufficientStockError(variant)

        order = Order.objects.create(
            order_number=generate_order_number(),
            user=request.user,
            subtotal=subtotal,
            discount_amount=discount_amount,
            shipping_charge=shipping_charge,
            tax_amount=tax_amount,
            total_amount=total_amount,
            coupon=coupon_obj,
            shipping_address=shipping_address_data,
            notes=notes,
        )

        for item in cart['items']:
            variant = variants[item['variant_id']]
            OrderItem.objects.create(
                order=order,
                variant=variant,
                product_name=item['product_name'],
                variant_label=item['variant_label'],
                quantity=item['quantity'],
                unit_price=item['price'],
                total_price=item['line_total'],
            )
            ProductVariant.objects.filter(id=variant.id).update(stock=F('stock') - item['quantity'])

        OrderStatusHistory.objects.create(order=order, status='PENDING', note='Order created.')

        if coupon_obj:
            coupon_services.record_usage(coupon_obj.id, request.user)

        cart_services.clear_cart(request)

    return order
