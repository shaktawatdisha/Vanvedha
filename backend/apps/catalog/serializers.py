from rest_framework import serializers
from .models import Category, Tag, Product, ProductVariant, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'children')

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_primary', 'sort_order')


class ProductVariantSerializer(serializers.ModelSerializer):
    discount_percent = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = ProductVariant
        fields = ('id', 'weight', 'unit', 'price', 'mrp', 'stock', 'is_default', 'discount_percent', 'is_in_stock')


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    default_variant = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'category', 'tags',
            'is_organic', 'is_featured', 'avg_rating', 'review_count',
            'primary_image', 'default_variant',
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return ProductImageSerializer(img, context=self.context).data if img else None

    def get_default_variant(self, obj):
        variant = obj.variants.filter(is_default=True).first() or obj.variants.first()
        return ProductVariantSerializer(variant).data if variant else None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'sku', 'category', 'tags',
            'description', 'ingredients', 'origin',
            'is_organic', 'is_featured', 'avg_rating', 'review_count',
            'meta_title', 'meta_description',
            'images', 'variants', 'created_at',
        )
