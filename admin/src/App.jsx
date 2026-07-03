import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute      from './components/ProtectedRoute';
import LoginPage           from './pages/LoginPage';
import DashboardPage       from './pages/DashboardPage';
import UsersPage           from './pages/UsersPage';
import StaffPermissionsPage from './pages/StaffPermissionsPage';
import DeliveryAgentsPage  from './pages/DeliveryAgentsPage';
import OrdersPage          from './pages/OrdersPage';
import ProductsPage        from './pages/ProductsPage';
import CategoriesPage      from './pages/CategoriesPage';
import TagsPage            from './pages/TagsPage';
import CouponsPage         from './pages/CouponsPage';
import ReviewsPage              from './pages/ReviewsPage';
import SuppliersPage           from './pages/SuppliersPage';
import RawLotsPage             from './pages/RawLotsPage';
import ProcessingBatchesPage   from './pages/ProcessingBatchesPage';
import BarcodeLookupPage       from './pages/BarcodeLookupPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected admin routes — ProtectedRoute renders Sidebar + Outlet */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/users"           element={<UsersPage />} />
            <Route path="/staff-permissions" element={<StaffPermissionsPage />} />
            <Route path="/delivery-agents" element={<DeliveryAgentsPage />} />
            <Route path="/orders"          element={<OrdersPage />} />
            <Route path="/products"        element={<ProductsPage />} />
            <Route path="/categories"      element={<CategoriesPage />} />
            <Route path="/tags"            element={<TagsPage />} />
            <Route path="/coupons"         element={<CouponsPage />} />
            <Route path="/reviews"                    element={<ReviewsPage />} />
            <Route path="/raw-material/suppliers"     element={<SuppliersPage />} />
            <Route path="/raw-material/raw-lots"      element={<RawLotsPage />} />
            <Route path="/raw-material/batches"       element={<ProcessingBatchesPage />} />
            <Route path="/raw-material/scan"          element={<BarcodeLookupPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
