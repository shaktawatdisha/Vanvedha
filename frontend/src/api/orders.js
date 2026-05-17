import api from './axios';

export const ordersApi = {
  createOrder: (data) => api.post('/orders/', data),
  getOrders:   () => api.get('/orders/'),
  getOrder:    (orderNumber) => api.get(`/orders/${orderNumber}/`),
  cancelOrder: (orderNumber) => api.post(`/orders/${orderNumber}/cancel/`),
};
