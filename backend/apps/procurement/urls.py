from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, RawMaterialLotViewSet, ProcessingBatchViewSet, barcode_lookup

router = DefaultRouter()
router.register('suppliers',  SupplierViewSet,        basename='supplier')
router.register('raw-lots',   RawMaterialLotViewSet,  basename='raw-lot')
router.register('batches',    ProcessingBatchViewSet,  basename='batch')

urlpatterns = router.urls + [
    path('lookup/', barcode_lookup, name='barcode-lookup'),
]
