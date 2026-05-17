import django_filters
from .models import Product, Category


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='variants__price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='variants__price', lookup_expr='lte')
    category = django_filters.CharFilter(field_name='category__slug')
    tag = django_filters.CharFilter(field_name='tags__slug')
    is_organic = django_filters.BooleanFilter()
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')

    class Meta:
        model = Product
        fields = ['is_organic', 'is_featured']

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(variants__stock__gt=0).distinct()
        return queryset
