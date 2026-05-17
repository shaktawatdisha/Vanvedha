import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/layout/Navbar';
import { ProtectedRoute } from './components/ui/ProtectedRoute';

import LoginPage         from './pages/auth/LoginPage';
import RegisterPage      from './pages/auth/RegisterPage';
import LandingPage       from './pages/LandingPage';
import AllSpicesPage     from './pages/catalog/AllSpicesPage';
import ProductDetailPage from './pages/catalog/ProductDetailPage';
import ProfilePage       from './pages/profile/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-60px)] bg-[#f8f6f6]">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/"               element={<LandingPage />} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/register"       element={<RegisterPage />} />
            <Route path="/products"       element={<AllSpicesPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/cart"           element={<ProtectedRoute><div className="p-8">Cart — coming soon</div></ProtectedRoute>} />
            <Route path="/profile"        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
