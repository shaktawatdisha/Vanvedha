import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      isAuthenticated: false,

      setAuth: (user, access, refresh) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        set({ user, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      // Role helpers
      isAdmin:         (state) => state.user?.role === 'ADMIN',
      isVendor:        (state) => state.user?.role === 'VENDOR',
      isDeliveryAgent: (state) => state.user?.role === 'DELIVERY',
    }),
    { name: 'auth-store', partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }) }
  )
);
