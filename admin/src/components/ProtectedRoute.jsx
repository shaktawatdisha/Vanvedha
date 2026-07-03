import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar from './Sidebar';
import { ADMIN_ONLY_PATHS, moduleForPath, canViewModule, firstAllowedPath } from '../constants/permissions';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user            = useAuthStore((s) => s.user);
  const permissions     = useAuthStore((s) => s.permissions);
  const location         = useLocation();

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'STAFF')) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'STAFF') {
    const isAdminOnly = ADMIN_ONLY_PATHS.some((p) => location.pathname.startsWith(p));
    const module = moduleForPath(location.pathname);
    const allowed = !isAdminOnly && module && canViewModule(permissions, module);

    if (!allowed) {
      const fallback = firstAllowedPath(permissions);
      if (fallback && fallback !== location.pathname) {
        return <Navigate to={fallback} replace />;
      }
      if (!fallback) {
        return (
          <div className="flex h-screen items-center justify-center bg-stone-100 text-center px-4">
            <div>
              <p className="text-lg font-bold text-stone-800">No modules assigned</p>
              <p className="text-sm text-stone-500 mt-1">Ask an admin to assign you a staff permission template.</p>
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
