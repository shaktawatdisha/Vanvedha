import api from './axios';

export const reviewsApi = {
  getProductReviews: (slug)        => api.get(`/reviews/products/${slug}/reviews/`),
  createReview:      (slug, data)  => api.post(`/reviews/products/${slug}/reviews/`, data),
};
