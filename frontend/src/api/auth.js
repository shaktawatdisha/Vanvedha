import api from './axios';

export const authApi = {
  register:       (data) => api.post('/auth/register/', data),
  login:          (data) => api.post('/auth/login/', data),
  logout:         (refresh) => api.post('/auth/logout/', { refresh }),
  getProfile:     () => api.get('/auth/profile/'),
  updateProfile:  (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/password/change/', data),

  // Addresses
  getAddresses:      () => api.get('/auth/addresses/'),
  createAddress:     (data) => api.post('/auth/addresses/', data),
  updateAddress:     (id, data) => api.put(`/auth/addresses/${id}/`, data),
  deleteAddress:     (id) => api.delete(`/auth/addresses/${id}/`),
  setDefaultAddress: (id) => api.patch(`/auth/addresses/${id}/set-default/`),
};
