from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.admin.permissions import IsAdminRole
from .models import Supplier, RawMaterialLot, ProcessingBatch
from .serializers import SupplierSerializer, RawMaterialLotSerializer, ProcessingBatchSerializer
from .services import confirm_batch


@api_view(['GET'])
@permission_classes([IsAdminRole])
def barcode_lookup(request):
    """
    GET /api/v1/procurement/lookup/?barcode=RAW-XXXXXXXXXX
    Searches both raw lots and processing batches and returns whichever matches.
    """
    code = request.query_params.get('barcode', '').strip().upper()
    if not code:
        return Response({'detail': 'barcode query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

    lot = RawMaterialLot.objects.select_related('supplier').filter(barcode=code).first()
    if lot:
        return Response({
            'type':   'raw_lot',
            'record': RawMaterialLotSerializer(lot).data,
        })

    batch = (
        ProcessingBatch.objects
        .select_related('output_variant__product')
        .prefetch_related('raw_usages__raw_lot__supplier')
        .filter(barcode=code)
        .first()
    )
    if batch:
        return Response({
            'type':   'processing_batch',
            'record': ProcessingBatchSerializer(batch).data,
        })

    return Response({'detail': f'No record found for barcode "{code}".'}, status=status.HTTP_404_NOT_FOUND)


class SupplierViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class   = SupplierSerializer
    queryset           = Supplier.objects.all()
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['name', 'phone']
    ordering_fields    = ['name', 'created_at']
    ordering           = ['name']


class RawMaterialLotViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class   = RawMaterialLotSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['supplier', 'spice_type']
    search_fields      = ['barcode', 'notes']
    ordering_fields    = ['purchase_date', 'quantity_kg', 'quantity_remaining_kg']
    ordering           = ['-purchase_date']

    def get_queryset(self):
        return RawMaterialLot.objects.select_related('supplier').all()


class ProcessingBatchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class   = ProcessingBatchSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status', 'output_variant']
    search_fields      = ['barcode', 'notes']
    ordering_fields    = ['processed_date', 'created_at']
    ordering           = ['-processed_date']

    def get_queryset(self):
        return (
            ProcessingBatch.objects
            .select_related('output_variant__product')
            .prefetch_related('raw_usages__raw_lot')
            .all()
        )

    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm(self, request, pk=None):
        batch = self.get_object()
        try:
            confirm_batch(batch)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(batch).data)
