from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, RawMaterialLotViewSet, ProcessingBatchViewSet, BarcodeLookupView

router = DefaultRouter()
router.register('suppliers',  SupplierViewSet,        basename='supplier')
router.register('raw-lots',   RawMaterialLotViewSet,  basename='raw-lot')
router.register('batches',    ProcessingBatchViewSet,  basename='batch')

urlpatterns = router.urls + [
    path('lookup/', BarcodeLookupView.as_view(), name='barcode-lookup'),
]
