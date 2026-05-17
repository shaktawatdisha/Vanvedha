from django.shortcuts import get_object_or_404
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
import django_filters
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.models import User, VendorProfile, DeliveryAgentProfile, Role
from apps.accounts.serializers import UserSerializer
from apps.orders.models import Order, OrderItem
from apps.catalog.models import Product, ProductVariant, ProductImage, Category, Tag
from apps.coupons.models import Coupon
from apps.reviews.models import Review

from .permissions import IsAdminRole
from .serializers import (
    AdminUserListSerializer, AdminUserDetailSerializer,
    AdminVendorSerializer, AdminDeliveryAgentSerializer,
    AdminDashboardSerializer,
)


# ── Admin Login ────────────────────────────────────────────────────────────────

class AdminLoginView(APIView):
    """Dedicated login endpoint — only allows ADMIN role users."""
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'Account is deactivated.'}, status=status.HTTP_403_FORBIDDEN)

        if user.role != Role.ADMIN:
            return Response({'detail': 'Access denied. Admin accounts only.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


# ── Dashboard ─────────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        data = {
            'total_users':               User.objects.count(),
            'total_customers':           User.objects.customers().count(),
            'total_vendors':             User.objects.vendors().count(),
            'total_delivery_agents':     User.objects.delivery_agents().count(),
            'pending_vendor_approvals':  VendorProfile.objects.filter(is_approved=False).count(),
            'active_users':              User.objects.filter(is_active=True).count(),
            'inactive_users':            User.objects.filter(is_active=False).count(),
            'verified_users':            User.objects.filter(is_verified=True).count(),
        }
        return Response(AdminDashboardSerializer(data).data)


# ── User Management ───────────────────────────────────────────────────────────

class AdminUserFilter(django_filters.FilterSet):
    role = django_filters.CharFilter(lookup_expr='iexact')

    class Meta:
        model  = User
        fields = ['role', 'is_active', 'is_verified']


class AdminUserListView(generics.ListAPIView):
    permission_classes  = [IsAdminRole]
    serializer_class    = AdminUserListSerializer
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class     = AdminUserFilter
    search_fields       = ['email', 'first_name', 'last_name', 'phone']
    ordering_fields     = ['date_joined', 'email', 'role']
    ordering            = ['-date_joined']

    def get_queryset(self):
        return User.objects.exclude(is_superuser=True)


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class   = AdminUserDetailSerializer
    queryset           = User.objects.all()
    lookup_field       = 'id'

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class AdminUserActivateView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, id):
        user = get_object_or_404(User, id=id)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'detail': f'User {user.email} activated.'})


class AdminUserDeactivateView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, id):
        user = get_object_or_404(User, id=id)
        if user.is_superuser:
            return Response(
                {'detail': 'Cannot deactivate a superuser.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'detail': f'User {user.email} deactivated.'})


class AdminUserVerifyView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, id):
        user = get_object_or_404(User, id=id)
        user.is_verified = True
        user.save(update_fields=['is_verified'])
        return Response({'detail': f'User {user.email} marked as verified.'})


class AdminChangeRoleView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, id):
        user = get_object_or_404(User, id=id)
        new_role = request.data.get('role')
        if new_role not in Role.values:
            return Response(
                {'role': f'Invalid role. Choices: {Role.values}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.is_superuser:
            return Response(
                {'detail': 'Cannot change role of a superuser.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        user.role = new_role
        user.is_staff = new_role == Role.ADMIN
        user.save(update_fields=['role', 'is_staff'])
        return Response({'detail': f'Role updated to {new_role} for {user.email}.'})


# ── Vendor Management ─────────────────────────────────────────────────────────

class AdminVendorListView(generics.ListAPIView):
    permission_classes  = [IsAdminRole]
    serializer_class    = AdminVendorSerializer
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields    = ['is_approved']
    search_fields       = ['shop_name', 'user__email', 'gstin']

    def get_queryset(self):
        return VendorProfile.objects.select_related('user').order_by('-created_at')


class AdminVendorDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class   = AdminVendorSerializer
    queryset           = VendorProfile.objects.select_related('user')

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class AdminVendorApproveView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        vendor = get_object_or_404(VendorProfile, pk=pk)
        vendor.is_approved = True
        vendor.save(update_fields=['is_approved'])
        return Response({'detail': f'Vendor "{vendor.shop_name}" approved.'})


class AdminVendorRejectView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        vendor = get_object_or_404(VendorProfile, pk=pk)
        vendor.is_approved = False
        vendor.save(update_fields=['is_approved'])
        return Response({'detail': f'Vendor "{vendor.shop_name}" rejected.'})


# ── Delivery Agent Management ─────────────────────────────────────────────────

class AdminDeliveryAgentListView(generics.ListAPIView):
    permission_classes  = [IsAdminRole]
    serializer_class    = AdminDeliveryAgentSerializer
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields    = ['vehicle_type', 'is_available']
    search_fields       = ['user__email', 'vehicle_number', 'current_zone']

    def get_queryset(self):
        return DeliveryAgentProfile.objects.select_related('user').order_by('-created_at')


class AdminDeliveryAgentDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminRole]
    serializer_class   = AdminDeliveryAgentSerializer
    queryset           = DeliveryAgentProfile.objects.select_related('user')

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


# ── Order Management ───────────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['order_number', 'user__email', 'user__first_name']
    filterset_fields = ['status']
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.select_related('user').all()

    def get_serializer_class(self):
        from rest_framework import serializers
        class S(serializers.ModelSerializer):
            user_email = serializers.CharField(source='user.email', read_only=True)
            user_name = serializers.CharField(source='user.full_name', read_only=True)
            item_count = serializers.SerializerMethodField()
            def get_item_count(self, obj):
                return obj.items.count()
            class Meta:
                model = Order
                fields = ['id', 'order_number', 'user_email', 'user_name', 'status', 'total_amount', 'item_count', 'created_at']
        return S


class AdminOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminRole]
    lookup_field = 'order_number'

    def get_queryset(self):
        return Order.objects.prefetch_related('items').select_related('user')

    def get_serializer_class(self):
        from rest_framework import serializers
        class ItemS(serializers.ModelSerializer):
            class Meta:
                model = OrderItem
                fields = ['id', 'product_name', 'variant_label', 'quantity', 'unit_price', 'total_price']
        class S(serializers.ModelSerializer):
            user_email = serializers.CharField(source='user.email', read_only=True)
            user_name = serializers.CharField(source='user.full_name', read_only=True)
            items = ItemS(many=True, read_only=True)
            class Meta:
                model = Order
                fields = ['id', 'order_number', 'user_email', 'user_name', 'status', 'subtotal', 'discount_amount', 'shipping_charge', 'tax_amount', 'total_amount', 'shipping_address', 'notes', 'estimated_delivery', 'items', 'created_at']
        return S


class AdminOrderUpdateStatusView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)
        new_status = request.data.get('status')
        valid = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'detail': f'Invalid status. Choose from: {valid}'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save(update_fields=['status'])
        return Response({'order_number': order.order_number, 'status': order.status})


# ── Product Management ─────────────────────────────────────────────────────────

class AdminCategoryListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return Category.objects.prefetch_related('children').order_by('name')

    def get_serializer_class(self):
        from rest_framework import serializers
        from django.utils.text import slugify

        if self.request.method == 'POST':
            class CreateS(serializers.ModelSerializer):
                slug = serializers.SlugField(required=False, allow_blank=True)
                class Meta:
                    model = Category
                    fields = ['name', 'slug', 'description', 'parent']
                def create(self, validated_data):
                    if not validated_data.get('slug'):
                        base = slugify(validated_data['name'])
                        slug, n = base, 1
                        while Category.objects.filter(slug=slug).exists():
                            slug = f'{base}-{n}'; n += 1
                        validated_data['slug'] = slug
                    return super().create(validated_data)
            return CreateS

        class ListS(serializers.ModelSerializer):
            parent_name   = serializers.CharField(source='parent.name', read_only=True, default=None)
            product_count = serializers.SerializerMethodField()
            child_count   = serializers.SerializerMethodField()
            def get_product_count(self, obj): return obj.products.count()
            def get_child_count(self, obj): return obj.children.count()
            class Meta:
                model = Category
                fields = ['id', 'name', 'slug', 'description', 'parent', 'parent_name',
                          'product_count', 'child_count']
        return ListS


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return Category.objects.prefetch_related('children')

    def get_serializer_class(self):
        from rest_framework import serializers
        class S(serializers.ModelSerializer):
            parent_name   = serializers.CharField(source='parent.name', read_only=True, default=None)
            product_count = serializers.SerializerMethodField()
            def get_product_count(self, obj): return obj.products.count()
            class Meta:
                model = Category
                fields = ['id', 'name', 'slug', 'description', 'parent', 'parent_name', 'product_count']
        return S

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class AdminProductListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'sku']
    filterset_fields = ['category', 'is_featured', 'is_organic']

    def get_queryset(self):
        return Product.objects.select_related('category').prefetch_related('variants', 'images', 'tags').all()

    def get_serializer_class(self):
        from rest_framework import serializers
        from django.utils.text import slugify

        if self.request.method == 'POST':
            class CreateS(serializers.ModelSerializer):
                slug = serializers.SlugField(required=False, allow_blank=True)
                class Meta:
                    model = Product
                    fields = ['id', 'name', 'slug', 'sku', 'category', 'description',
                              'ingredients', 'origin', 'is_organic', 'is_featured']
                    read_only_fields = ['id']
                def create(self, validated_data):
                    if not validated_data.get('slug'):
                        base = slugify(validated_data['name'])
                        slug, n = base, 1
                        while Product.objects.filter(slug=slug).exists():
                            slug = f'{base}-{n}'; n += 1
                        validated_data['slug'] = slug
                    return super().create(validated_data)
            return CreateS

        class ListS(serializers.ModelSerializer):
            category_name = serializers.CharField(source='category.name', read_only=True)
            variant_count = serializers.SerializerMethodField()
            min_price     = serializers.SerializerMethodField()
            primary_image = serializers.SerializerMethodField()
            def get_variant_count(self, obj): return obj.variants.count()
            def get_min_price(self, obj):
                v = obj.variants.order_by('price').first()
                return str(v.price) if v else None
            def get_primary_image(self, obj):
                img = next((i for i in obj.images.all() if i.is_primary), None) or obj.images.first()
                if img:
                    request = self.context.get('request')
                    return request.build_absolute_uri(img.image.url) if request else img.image.url
                return None
            tags = serializers.SerializerMethodField()
            def get_tags(self, obj):
                return [{'id': t.id, 'name': t.name, 'slug': t.slug} for t in obj.tags.all()]
            class Meta:
                model = Product
                fields = ['id', 'name', 'slug', 'sku', 'category_name', 'is_featured',
                          'is_organic', 'avg_rating', 'review_count', 'variant_count', 'min_price',
                          'primary_image', 'tags', 'created_at']
        return ListS


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    queryset = Product.objects.select_related('category').prefetch_related('variants', 'images', 'tags')

    def get_serializer_class(self):
        from rest_framework import serializers

        class VariantS(serializers.ModelSerializer):
            class Meta:
                model = ProductVariant
                fields = ['id', 'weight', 'unit', 'price', 'mrp', 'stock', 'low_stock_threshold', 'is_default']

        class ImageS(serializers.ModelSerializer):
            image_url = serializers.SerializerMethodField()
            def get_image_url(self, obj):
                request = self.context.get('request')
                return request.build_absolute_uri(obj.image.url) if request else obj.image.url
            class Meta:
                model = ProductImage
                fields = ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order']

        class S(serializers.ModelSerializer):
            category_name = serializers.CharField(source='category.name', read_only=True)
            variants = VariantS(many=True, read_only=True)
            images   = ImageS(many=True, read_only=True)
            tags     = serializers.SerializerMethodField()
            def get_tags(self, obj):
                return [{'id': t.id, 'name': t.name, 'slug': t.slug} for t in obj.tags.all()]
            class Meta:
                model = Product
                fields = ['id', 'name', 'slug', 'sku', 'category', 'category_name', 'description',
                          'ingredients', 'origin', 'is_organic', 'is_featured',
                          'avg_rating', 'review_count', 'variants', 'images', 'tags', 'created_at']
        return S

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class AdminProductTagsView(APIView):
    """GET current tags / PATCH to set tags on a product."""
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        from apps.catalog.serializers import TagSerializer
        return Response(TagSerializer(product.tags.all(), many=True).data)

    def patch(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        tag_ids = request.data.get('tag_ids', [])
        product.tags.set(tag_ids)
        from apps.catalog.serializers import TagSerializer
        return Response(TagSerializer(product.tags.all(), many=True).data)


class AdminProductVariantListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    pagination_class   = None

    def get_queryset(self):
        return ProductVariant.objects.filter(product_id=self.kwargs['product_pk'])

    def get_serializer_class(self):
        from rest_framework import serializers
        class S(serializers.ModelSerializer):
            class Meta:
                model = ProductVariant
                fields = ['id', 'weight', 'unit', 'price', 'mrp', 'stock', 'low_stock_threshold', 'is_default']
        return S

    def perform_create(self, serializer):
        product = get_object_or_404(Product, pk=self.kwargs['product_pk'])
        serializer.save(product=product)


class AdminProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return ProductVariant.objects.filter(product_id=self.kwargs['product_pk'])

    def get_serializer_class(self):
        from rest_framework import serializers
        class S(serializers.ModelSerializer):
            class Meta:
                model = ProductVariant
                fields = ['id', 'weight', 'unit', 'price', 'mrp', 'stock', 'low_stock_threshold', 'is_default']
        return S

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class AdminProductToggleFeaturedView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        product.is_featured = not product.is_featured
        product.save(update_fields=['is_featured'])
        return Response({'id': str(product.id), 'is_featured': product.is_featured})


# ── Coupon Management ──────────────────────────────────────────────────────────

class AdminCouponListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return Coupon.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        from rest_framework import serializers
        class S(serializers.ModelSerializer):
            class Meta:
                model = Coupon
                fields = ['id', 'code', 'description', 'discount_type', 'discount_value', 'min_order_value', 'max_discount', 'usage_limit', 'used_count', 'valid_from', 'valid_until', 'is_single_use', 'created_at']
        return S


class AdminCouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return Coupon.objects.all()

    def get_serializer_class(self):
        from rest_framework import serializers
        class S(serializers.ModelSerializer):
            class Meta:
                model = Coupon
                fields = ['id', 'code', 'description', 'discount_type', 'discount_value', 'min_order_value', 'max_discount', 'usage_limit', 'used_count', 'valid_from', 'valid_until', 'is_single_use']
        return S


# ── Review Management ──────────────────────────────────────────────────────────

class AdminReviewListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_approved', 'rating']

    def get_queryset(self):
        return Review.objects.select_related('user', 'product').all().order_by('-created_at')

    def get_serializer_class(self):
        from rest_framework import serializers
        class S(serializers.ModelSerializer):
            user_email = serializers.CharField(source='user.email', read_only=True)
            product_name = serializers.CharField(source='product.name', read_only=True)
            class Meta:
                model = Review
                fields = ['id', 'user_email', 'product_name', 'rating', 'title', 'body', 'is_approved', 'created_at']
        return S


class AdminReviewApproveView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        review.is_approved = True
        review.save(update_fields=['is_approved'])
        return Response({'id': review.id, 'is_approved': True})


class AdminReviewRejectView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        review.is_approved = False
        review.save(update_fields=['is_approved'])
        return Response({'id': review.id, 'is_approved': False})


# ── Product Image Management ───────────────────────────────────────────────────

def _image_serializer_class(context=None):
    """Returns a shared ProductImage serializer class."""
    from rest_framework import serializers

    class S(serializers.ModelSerializer):
        image_url = serializers.SerializerMethodField()

        def get_image_url(self, obj):
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url

        class Meta:
            model = ProductImage
            fields = ['id', 'image', 'image_url', 'alt_text', 'is_primary', 'sort_order']
            extra_kwargs = {'image': {'write_only': True, 'required': False}}

    return S


class AdminProductImageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_pk']).order_by('sort_order', 'id')

    def get_serializer_class(self):
        from rest_framework import serializers

        class S(serializers.ModelSerializer):
            image_url = serializers.SerializerMethodField()

            def get_image_url(self, obj):
                request = self.context.get('request')
                return request.build_absolute_uri(obj.image.url) if request else obj.image.url

            class Meta:
                model = ProductImage
                fields = ['id', 'image', 'image_url', 'alt_text', 'is_primary', 'sort_order']
                extra_kwargs = {'image': {'write_only': True}}

        return S

    def perform_create(self, serializer):
        product = get_object_or_404(Product, pk=self.kwargs['product_pk'])
        # If no images exist yet, make this one primary
        is_first = not ProductImage.objects.filter(product=product).exists()
        serializer.save(product=product, is_primary=is_first)


class AdminProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_pk'])

    def get_serializer_class(self):
        from rest_framework import serializers

        class S(serializers.ModelSerializer):
            image_url = serializers.SerializerMethodField()

            def get_image_url(self, obj):
                request = self.context.get('request')
                return request.build_absolute_uri(obj.image.url) if request else obj.image.url

            class Meta:
                model = ProductImage
                fields = ['id', 'image', 'image_url', 'alt_text', 'is_primary', 'sort_order']
                extra_kwargs = {'image': {'write_only': True, 'required': False}}

        return S

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class AdminProductSetPrimaryImageView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, product_pk, pk):
        product = get_object_or_404(Product, pk=product_pk)
        image = get_object_or_404(ProductImage, pk=pk, product=product)
        ProductImage.objects.filter(product=product).update(is_primary=False)
        image.is_primary = True
        image.save(update_fields=['is_primary'])
        return Response({'id': image.id, 'is_primary': True})


# ── Tag Management ────────────────────────────────────────────────────────────

class AdminTagListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return Tag.objects.order_by('name')

    def get_serializer_class(self):
        from rest_framework import serializers
        from django.utils.text import slugify

        if self.request.method == 'POST':
            class CreateS(serializers.ModelSerializer):
                slug = serializers.SlugField(required=False, allow_blank=True)
                class Meta:
                    model = Tag
                    fields = ['name', 'slug']
                def create(self, validated_data):
                    if not validated_data.get('slug'):
                        base = slugify(validated_data['name'])
                        slug, n = base, 1
                        while Tag.objects.filter(slug=slug).exists():
                            slug = f'{base}-{n}'; n += 1
                        validated_data['slug'] = slug
                    return super().create(validated_data)
            return CreateS

        class ListS(serializers.ModelSerializer):
            product_count = serializers.SerializerMethodField()
            def get_product_count(self, obj):
                return obj.product_set.count()
            class Meta:
                model = Tag
                fields = ['id', 'name', 'slug', 'product_count']
        return ListS


class AdminTagDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminRole]
    queryset = Tag.objects.all()

    def get_serializer_class(self):
        from rest_framework import serializers
        from django.utils.text import slugify

        class S(serializers.ModelSerializer):
            product_count = serializers.SerializerMethodField()
            def get_product_count(self, obj):
                return obj.product_set.count()
            class Meta:
                model = Tag
                fields = ['id', 'name', 'slug', 'product_count']
        return S

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)
