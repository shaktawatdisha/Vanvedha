from django.contrib import admin
from mptt.admin import DraggableMPTTAdmin
from .models import Category, Tag, Product, ProductVariant, ProductImage


@admin.register(Category)
class CategoryAdmin(DraggableMPTTAdmin):
    list_display = ('tree_actions', 'indented_title', 'slug', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ('weight', 'unit', 'price', 'mrp', 'stock', 'is_default')


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary', 'sort_order')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'is_organic', 'is_featured', 'avg_rating', 'is_active')
    list_filter = ('category', 'is_organic', 'is_featured', 'is_active')
    search_fields = ('name', 'sku', 'description')
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ('tags',)
    inlines = [ProductVariantInline, ProductImageInline]

    actions = ['mark_featured', 'unmark_featured']

    def mark_featured(self, request, queryset):
        queryset.update(is_featured=True)
    mark_featured.short_description = 'Mark selected as featured'

    def unmark_featured(self, request, queryset):
        queryset.update(is_featured=False)
    unmark_featured.short_description = 'Remove featured from selected'
