from .models import Coupon, CouponUsage


def validate_coupon(code, user, subtotal):
    try:
        coupon = Coupon.objects.get(code=code)
    except Coupon.DoesNotExist:
        return {'valid': False, 'error': 'Invalid coupon code.'}

    is_valid, error = coupon.is_valid()
    if not is_valid:
        return {'valid': False, 'error': error}

    if subtotal < float(coupon.min_order_value):
        return {'valid': False, 'error': f'Minimum order value is ₹{coupon.min_order_value}.'}

    if coupon.is_single_use and user.is_authenticated:
        if CouponUsage.objects.filter(coupon=coupon, user=user).exists():
            return {'valid': False, 'error': 'You have already used this coupon.'}

    discount = float(coupon.calculate_discount(subtotal))
    return {
        'valid': True,
        'coupon_id': coupon.id,
        'code': coupon.code,
        'discount_amount': discount,
        'discount_type': coupon.discount_type,
    }


def record_usage(coupon_id, user):
    coupon = Coupon.objects.get(id=coupon_id)
    CouponUsage.objects.get_or_create(coupon=coupon, user=user)
    Coupon.objects.filter(id=coupon_id).update(used_count=coupon.used_count + 1)
