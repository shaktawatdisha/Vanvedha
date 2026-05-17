import api from './axios';

export const authApi = {
  // Dedicated admin-only login — rejects non-ADMIN roles server-side
  login:   (data) => api.post('/admin/login/', data),
  logout:  (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
};
