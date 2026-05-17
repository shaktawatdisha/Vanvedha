from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            'success': False,
            'errors': response.data,
            'status_code': response.status_code,
        }

    return response


class InsufficientStockError(Exception):
    def __init__(self, variant):
        self.variant = variant
        super().__init__(f'Insufficient stock for {variant}')


class CouponError(Exception):
    pass
