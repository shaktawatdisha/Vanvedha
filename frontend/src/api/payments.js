import api from './axios';

export const paymentsApi = {
  initiate: (orderNumber, gateway) => api.post('/payments/initiate/', { order_number: orderNumber, gateway }),
  verifyStripe: (paymentIntentId) => api.post('/payments/verify/stripe/', { payment_intent_id: paymentIntentId }),
};
