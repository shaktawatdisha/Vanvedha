import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute      from './components/ProtectedRoute';
import LoginPage           from './pages/LoginPage';
import DashboardPage       from './pages/DashboardPage';
import UsersPage           from './pages/UsersPage';
import VendorsPage         from './pages/VendorsPage';
import DeliveryAgentsPage  from './pages/DeliveryAgentsPage';
import OrdersPage          from './pages/OrdersPage';
import ProductsPage        from './pages/ProductsPage';
import CategoriesPage      from './pages/CategoriesPage';
import TagsPage            from './pages/TagsPage';
import CouponsPage         from './pages/CouponsPage';
import ReviewsPage         from './pages/ReviewsPage';

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
            <Route path="/vendors"         element={<VendorsPage />} />
            <Route path="/delivery-agents" element={<DeliveryAgentsPage />} />
            <Route path="/orders"          element={<OrdersPage />} />
            <Route path="/products"        element={<ProductsPage />} />
            <Route path="/categories"      element={<CategoriesPage />} />
            <Route path="/tags"            element={<TagsPage />} />
            <Route path="/coupons"         element={<CouponsPage />} />
            <Route path="/reviews"         element={<ReviewsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
