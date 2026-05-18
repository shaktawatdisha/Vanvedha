import { create } from 'zustand';
import { cartApi } from '../api/cart';

export const useCartStore = create((set, get) => ({
  items: [],
  subtotal: 0,
  shipping_charge: 0,
  total: 0,
  coupon_code: null,
  loading: false,

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  setCart: (cart) => set({
    items: cart.items || [],
    subtotal: cart.subtotal || 0,
    shipping_charge: cart.shipping_charge || 0,
    total: cart.total || 0,
    coupon_code: cart.coupon_code || null,
  }),

  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await cartApi.getCart();
      get().setCart(res.data);
    } catch {
      // ignore — unauthenticated users may get errors
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (variantId, quantity) => {
    const res = await cartApi.addItem({ variant_id: variantId, quantity });
    get().setCart(res.data);
  },

  updateItem: async (variantId, quantity) => {
    const res = await cartApi.updateItem(variantId, { quantity });
    get().setCart(res.data);
  },

  removeItem: async (variantId) => {
    await cartApi.removeItem(variantId);
    await get().fetchCart();
  },

  applyCoupon: async (code) => {
    const res = await cartApi.applyCoupon(code);
    get().setCart(res.data);
  },

  removeCoupon: async () => {
    const res = await cartApi.removeCoupon();
    get().setCart(res.data);
  },

  clearLocal: () => set({ items: [], subtotal: 0, shipping_charge: 0, total: 0, coupon_code: null }),
}));
