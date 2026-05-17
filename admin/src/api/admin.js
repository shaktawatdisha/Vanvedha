import api from './axios';

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard/'),

  // Users
  getUsers:       (params) => api.get('/admin/users/', { params }),
  activateUser:   (id) => api.post(`/admin/users/${id}/activate/`),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate/`),
  verifyUser:     (id) => api.post(`/admin/users/${id}/verify/`),
  changeRole:     (id, role) => api.patch(`/admin/users/${id}/change-role/`, { role }),

  // Vendors
  getVendors:    (params) => api.get('/admin/vendors/', { params }),
  approveVendor: (id) => api.post(`/admin/vendors/${id}/approve/`),
  rejectVendor:  (id) => api.post(`/admin/vendors/${id}/reject/`),

  // Delivery agents
  getDeliveryAgents:   (params) => api.get('/admin/delivery-agents/', { params }),
  updateDeliveryAgent: (id, data) => api.patch(`/admin/delivery-agents/${id}/`, data),

  // Orders
  getOrders:     (params) => api.get('/admin/orders/', { params }),
  getOrder:      (orderNumber) => api.get(`/admin/orders/${orderNumber}/`),
  updateOrderStatus: (orderNumber, status) => api.patch(`/admin/orders/${orderNumber}/status/`, { status }),

  // Categories
  getCategories:    (params) => api.get('/admin/categories/', { params }),
  createCategory:   (data)   => api.post('/admin/categories/', data),
  updateCategory:   (id, data) => api.patch(`/admin/categories/${id}/`, data),
  deleteCategory:   (id)     => api.delete(`/admin/categories/${id}/`),

  // Tags
  getTags:   (params)   => api.get('/admin/tags/', { params }),
  createTag: (data)     => api.post('/admin/tags/', data),
  updateTag: (id, data) => api.patch(`/admin/tags/${id}/`, data),
  deleteTag: (id)       => api.delete(`/admin/tags/${id}/`),

  // Products
  getProducts:     (params) => api.get('/admin/products/', { params }),
  createProduct:   (data)   => api.post('/admin/products/', data),
  getProduct:      (id)     => api.get(`/admin/products/${id}/`),
  updateProduct:   (id, data) => api.patch(`/admin/products/${id}/`, data),
  deleteProduct:   (id)     => api.delete(`/admin/products/${id}/`),
  toggleFeatured:  (id)     => api.patch(`/admin/products/${id}/toggle-featured/`),
  getProductTags:  (id)          => api.get(`/admin/products/${id}/tags/`),
  setProductTags:  (id, tagIds)  => api.patch(`/admin/products/${id}/tags/`, { tag_ids: tagIds }),

  // Variants
  getVariants:     (productId)           => api.get(`/admin/products/${productId}/variants/`),
  createVariant:   (productId, data)     => api.post(`/admin/products/${productId}/variants/`, data),
  updateVariant:   (productId, id, data) => api.patch(`/admin/products/${productId}/variants/${id}/`, data),
  deleteVariant:   (productId, id)       => api.delete(`/admin/products/${productId}/variants/${id}/`),

  // Product images
  getImages:       (productId)           => api.get(`/admin/products/${productId}/images/`),
  uploadImage:     (productId, formData) => api.post(`/admin/products/${productId}/images/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateImage:     (productId, id, data) => api.patch(`/admin/products/${productId}/images/${id}/`, data),
  deleteImage:     (productId, id)       => api.delete(`/admin/products/${productId}/images/${id}/`),
  setPrimaryImage: (productId, id)       => api.post(`/admin/products/${productId}/images/${id}/set-primary/`),

  // Coupons
  getCoupons:    (params) => api.get('/admin/coupons/', { params }),
  createCoupon:  (data) => api.post('/admin/coupons/', data),
  updateCoupon:  (id, data) => api.patch(`/admin/coupons/${id}/`, data),
  deleteCoupon:  (id) => api.delete(`/admin/coupons/${id}/`),

  // Reviews
  getReviews:     (params) => api.get('/admin/reviews/', { params }),
  approveReview:  (id) => api.post(`/admin/reviews/${id}/approve/`),
  rejectReview:   (id) => api.post(`/admin/reviews/${id}/reject/`),
};
