import api from './axios';

export const cartApi = {
  getCart:      () => api.get('/cart/'),
  addItem:      (data) => api.post('/cart/items/', data),
  updateItem:   (variantId, data) => api.patch(`/cart/items/${variantId}/`, data),
  removeItem:   (variantId) => api.delete(`/cart/items/${variantId}/`),
  clearCart:    () => api.delete('/cart/clear/'),
  applyCoupon:  (coupon_code) => api.post('/cart/coupon/', { coupon_code }),
  removeCoupon: () => api.delete('/cart/coupon/'),
};
