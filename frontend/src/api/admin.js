import api from './axios';

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard/'),

  // Users
  getUsers:       (params) => api.get('/admin/users/', { params }),
  getUser:        (id) => api.get(`/admin/users/${id}/`),
  updateUser:     (id, data) => api.patch(`/admin/users/${id}/`, data),
  activateUser:   (id) => api.post(`/admin/users/${id}/activate/`),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate/`),
  verifyUser:     (id) => api.post(`/admin/users/${id}/verify/`),
  changeRole:     (id, role) => api.patch(`/admin/users/${id}/change-role/`, { role }),

  // Tags
  getTags:   (params)    => api.get('/admin/tags/', { params }),
  createTag: (data)      => api.post('/admin/tags/', data),
  updateTag: (id, data)  => api.patch(`/admin/tags/${id}/`, data),
  deleteTag: (id)        => api.delete(`/admin/tags/${id}/`),

  // Vendors
  getVendors:      (params) => api.get('/admin/vendors/', { params }),
  getVendor:       (id) => api.get(`/admin/vendors/${id}/`),
  updateVendor:    (id, data) => api.patch(`/admin/vendors/${id}/`, data),
  approveVendor:   (id) => api.post(`/admin/vendors/${id}/approve/`),
  rejectVendor:    (id) => api.post(`/admin/vendors/${id}/reject/`),

  // Delivery agents
  getDeliveryAgents:    (params) => api.get('/admin/delivery-agents/', { params }),
  getDeliveryAgent:     (id) => api.get(`/admin/delivery-agents/${id}/`),
  updateDeliveryAgent:  (id, data) => api.patch(`/admin/delivery-agents/${id}/`, data),

  // User addresses (admin view)
  getUserAddresses: (id) => api.get(`/admin/users/${id}/addresses/`),
};
