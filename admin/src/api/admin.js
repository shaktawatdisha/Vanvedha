import api from './axios';

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard/'),

  // Users
  getUsers:       (params) => api.get('/admin/users/', { params }),
  activateUser:   (id) => api.post(`/admin/users/${id}/activate/`),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate/`),
  verifyUser:     (id) => api.post(`/admin/users/${id}/verify/`),
  changeRole:     (id, role) => api.patch(`/admin/users/${id}/change-role/`, { role }),
  getStaffProfile:    (id)       => api.get(`/admin/users/${id}/staff-profile/`),
  assignStaffProfile: (id, data) => api.patch(`/admin/users/${id}/staff-profile/`, data),

  // Staff permissions
  getStaffModules:      ()            => api.get('/admin/staff-modules/'),
  getStaffPermissions:  (params)      => api.get('/admin/permission-templates/', { params }),
  getStaffPermission:   (id)          => api.get(`/admin/permission-templates/${id}/`),
  createStaffPermission: (data)       => api.post('/admin/permission-templates/', data),
  updateStaffPermission: (id, data)   => api.patch(`/admin/permission-templates/${id}/`, data),
  deleteStaffPermission: (id)         => api.delete(`/admin/permission-templates/${id}/`),

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

  // Procurement — Suppliers
  getSuppliers:    (params) => api.get('/procurement/suppliers/', { params }),
  createSupplier:  (data)   => api.post('/procurement/suppliers/', data),
  updateSupplier:  (id, data) => api.patch(`/procurement/suppliers/${id}/`, data),
  deleteSupplier:  (id)     => api.delete(`/procurement/suppliers/${id}/`),

  // Procurement — Raw Material Lots
  getRawLots:    (params) => api.get('/procurement/raw-lots/', { params }),
  createRawLot:  (data)   => api.post('/procurement/raw-lots/', data),
  updateRawLot:  (id, data) => api.patch(`/procurement/raw-lots/${id}/`, data),
  deleteRawLot:  (id)     => api.delete(`/procurement/raw-lots/${id}/`),

  // Procurement — Processing Batches
  getBatches:     (params) => api.get('/procurement/batches/', { params }),
  createBatch:    (data)   => api.post('/procurement/batches/', data),
  updateBatch:    (id, data) => api.patch(`/procurement/batches/${id}/`, data),
  deleteBatch:    (id)     => api.delete(`/procurement/batches/${id}/`),
  confirmBatch:   (id)     => api.post(`/procurement/batches/${id}/confirm/`),

  // Barcode lookup (searches both raw lots and processing batches)
  barcodeLookup: (barcode) => api.get('/procurement/lookup/', { params: { barcode } }),

  // Payroll — Staff Salaries
  getStaffSalaries:   (params)   => api.get('/payroll/salaries/', { params }),
  createStaffSalary:  (data)     => api.post('/payroll/salaries/', data),
  updateStaffSalary:  (id, data) => api.patch(`/payroll/salaries/${id}/`, data),
  deleteStaffSalary:  (id)       => api.delete(`/payroll/salaries/${id}/`),

  // Payroll — Salary Payments
  getSalaryPayments:     (params)   => api.get('/payroll/payments/', { params }),
  createSalaryPayment:   (data)     => api.post('/payroll/payments/', data),
  updateSalaryPayment:   (id, data) => api.patch(`/payroll/payments/${id}/`, data),
  deleteSalaryPayment:   (id)       => api.delete(`/payroll/payments/${id}/`),
  markSalaryPaymentPaid: (id)       => api.post(`/payroll/payments/${id}/mark-paid/`),
  generatePayroll:       (month)    => api.post('/payroll/payments/generate/', { month }),
};
