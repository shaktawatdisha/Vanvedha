import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  coupon: null,

  setCart: (cart) => set({ items: cart.items || [], total: cart.total || 0, coupon: cart.coupon || null }),

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  clearLocal: () => set({ items: [], total: 0, coupon: null }),
}));
