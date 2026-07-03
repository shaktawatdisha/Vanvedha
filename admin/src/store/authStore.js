import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      permissions: null,
      isAuthenticated: false,

      setAuth: (user, access, refresh, permissions = null) => {
        localStorage.setItem('admin_access_token', access);
        localStorage.setItem('admin_refresh_token', refresh);
        set({ user, permissions, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        set({ user: null, permissions: null, isAuthenticated: false });
      },
    }),
    {
      name: 'admin-auth-store',
      partialize: (state) => ({ user: state.user, permissions: state.permissions, isAuthenticated: state.isAuthenticated }),
    }
  )
);
