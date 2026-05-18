from django.urls import path
from .views import (
    AdminLoginView,
    AdminDashboardView,
    AdminUserListView, AdminUserDetailView,
    AdminUserActivateView, AdminUserDeactivateView,
    AdminUserVerifyView, AdminChangeRoleView, AdminUserAddressesView,
    AdminVendorListView, AdminVendorDetailView,
    AdminVendorApproveView, AdminVendorRejectView,
    AdminDeliveryAgentListView, AdminDeliveryAgentDetailView,
    AdminOrderListView, AdminOrderDetailView, AdminOrderUpdateStatusView,
    AdminCategoryListView, AdminCategoryDetailView,
    AdminTagListCreateView, AdminTagDetailView,
    AdminProductListView, AdminProductDetailView,
    AdminProductTagsView,
    AdminProductVariantListCreateView, AdminProductVariantDetailView,
    AdminProductToggleFeaturedView,
    AdminProductImageListCreateView, AdminProductImageDetailView, AdminProductSetPrimaryImageView,
    AdminCouponListView, AdminCouponDetailView,
    AdminReviewListView, AdminReviewApproveView, AdminReviewRejectView,
)

urlpatterns = [
    # Admin auth
    path('login/',                                         AdminLoginView.as_view(),                        name='admin-login'),

    # Dashboard
    path('dashboard/',                                     AdminDashboardView.as_view(),                    name='admin-dashboard'),

    # User management
    path('users/',                                         AdminUserListView.as_view(),                     name='admin-user-list'),
    path('users/<uuid:id>/',                               AdminUserDetailView.as_view(),                   name='admin-user-detail'),
    path('users/<uuid:id>/activate/',                      AdminUserActivateView.as_view(),                 name='admin-user-activate'),
    path('users/<uuid:id>/deactivate/',                    AdminUserDeactivateView.as_view(),               name='admin-user-deactivate'),
    path('users/<uuid:id>/verify/',                        AdminUserVerifyView.as_view(),                   name='admin-user-verify'),
    path('users/<uuid:id>/change-role/',                   AdminChangeRoleView.as_view(),                   name='admin-change-role'),
    path('users/<uuid:id>/addresses/',                     AdminUserAddressesView.as_view(),                name='admin-user-addresses'),

    # Vendor management
    path('vendors/',                                       AdminVendorListView.as_view(),                   name='admin-vendor-list'),
    path('vendors/<int:pk>/',                              AdminVendorDetailView.as_view(),                 name='admin-vendor-detail'),
    path('vendors/<int:pk>/approve/',                      AdminVendorApproveView.as_view(),                name='admin-vendor-approve'),
    path('vendors/<int:pk>/reject/',                       AdminVendorRejectView.as_view(),                 name='admin-vendor-reject'),

    # Delivery agent management
    path('delivery-agents/',                               AdminDeliveryAgentListView.as_view(),            name='admin-delivery-list'),
    path('delivery-agents/<int:pk>/',                      AdminDeliveryAgentDetailView.as_view(),          name='admin-delivery-detail'),

    # Order management
    path('orders/',                                        AdminOrderListView.as_view(),                    name='admin-order-list'),
    path('orders/<str:order_number>/',                     AdminOrderDetailView.as_view(),                  name='admin-order-detail'),
    path('orders/<str:order_number>/status/',              AdminOrderUpdateStatusView.as_view(),            name='admin-order-status'),

    # Category CRUD
    path('categories/',                                    AdminCategoryListView.as_view(),                 name='admin-category-list'),
    path('categories/<int:pk>/',                           AdminCategoryDetailView.as_view(),               name='admin-category-detail'),

    # Tag CRUD
    path('tags/',                                          AdminTagListCreateView.as_view(),                name='admin-tag-list'),
    path('tags/<int:pk>/',                                 AdminTagDetailView.as_view(),                    name='admin-tag-detail'),

    # Product CRUD + variants
    path('products/',                                      AdminProductListView.as_view(),                  name='admin-product-list'),
    path('products/<uuid:pk>/',                            AdminProductDetailView.as_view(),                name='admin-product-detail'),
    path('products/<uuid:pk>/toggle-featured/',            AdminProductToggleFeaturedView.as_view(),        name='admin-product-toggle-featured'),
    path('products/<uuid:pk>/tags/',                       AdminProductTagsView.as_view(),                  name='admin-product-tags'),
    path('products/<uuid:product_pk>/variants/',                        AdminProductVariantListCreateView.as_view(),    name='admin-variant-list'),
    path('products/<uuid:product_pk>/variants/<int:pk>/',               AdminProductVariantDetailView.as_view(),        name='admin-variant-detail'),

    # Product images
    path('products/<uuid:product_pk>/images/',                          AdminProductImageListCreateView.as_view(),      name='admin-image-list'),
    path('products/<uuid:product_pk>/images/<int:pk>/',                 AdminProductImageDetailView.as_view(),          name='admin-image-detail'),
    path('products/<uuid:product_pk>/images/<int:pk>/set-primary/',     AdminProductSetPrimaryImageView.as_view(),      name='admin-image-set-primary'),

    # Coupon management
    path('coupons/',                                       AdminCouponListView.as_view(),                   name='admin-coupon-list'),
    path('coupons/<int:pk>/',                              AdminCouponDetailView.as_view(),                 name='admin-coupon-detail'),

    # Review management
    path('reviews/',                                       AdminReviewListView.as_view(),                   name='admin-review-list'),
    path('reviews/<int:pk>/approve/',                      AdminReviewApproveView.as_view(),                name='admin-review-approve'),
    path('reviews/<int:pk>/reject/',                       AdminReviewRejectView.as_view(),                 name='admin-review-reject'),
]
