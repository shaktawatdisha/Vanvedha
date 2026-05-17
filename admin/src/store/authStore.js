import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, access, refresh) => {
        localStorage.setItem('admin_access_token', access);
        localStorage.setItem('admin_refresh_token', refresh);
        set({ user, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'admin-auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
