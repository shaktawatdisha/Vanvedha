import api from './axios';

export const catalogApi = {
  getCategories:  () => api.get('/catalog/categories/'),
  getCategory:    (slug) => api.get(`/catalog/categories/${slug}/`),
  getTags:        () => api.get('/catalog/tags/'),
  getProducts:    (params) => api.get('/catalog/products/', { params }),
  getFeatured:    () => api.get('/catalog/products/featured/'),
  getProduct:     (slug) => api.get(`/catalog/products/${slug}/`),
};
