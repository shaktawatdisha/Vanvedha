import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { authApi } from '../../api/auth';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try { await authApi.logout(refresh); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-[#ec4913]/10 px-6 lg:px-40 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 no-underline">
        <div className="size-9 flex items-center justify-center bg-[#ec4913]/10 rounded-xl">
          <span className="material-symbols-outlined text-[#ec4913] text-2xl">skillet</span>
        </div>
        <span className="text-slate-900 text-xl font-black tracking-tight">Vanvedha</span>
      </Link>

      {/* Desktop Nav Links */}
      <nav className="hidden md:flex items-center gap-8">
        {[
          { label: 'Shop',    to: '/products' },
          { label: 'Recipes', to: '#'         },
          { label: 'About',   to: '#'         },
          { label: 'Gifts',   to: '#'         },
        ].map(({ label, to }) => (
          <Link
            key={label}
            to={to}
            className="text-slate-700 hover:text-[#ec4913] text-sm font-semibold transition-colors no-underline"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Right Section */}
      <div className="flex items-center gap-3">

        {/* Search Bar */}
        <div className="hidden sm:flex items-center gap-2 border border-[#ec4913]/10 rounded-lg bg-[#f8f6f6] px-3 h-9">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
          <input
            className="bg-transparent text-sm outline-none placeholder:text-slate-400 w-32 lg:w-44"
            placeholder="Search spices..."
            type="text"
          />
        </div>

        {/* Cart */}
        <Link to="/cart" className="relative flex items-center justify-center size-9 rounded-lg hover:bg-[#ec4913]/10 transition-colors no-underline text-slate-700 hover:text-[#ec4913]">
          <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ec4913] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>

        {isAuthenticated ? (
          <>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center justify-center size-9 rounded-lg hover:bg-[#ec4913]/10 transition-colors no-underline text-slate-700 hover:text-[#ec4913]"
                title="Admin Panel"
              >
                <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
              </Link>
            )}
            <Link
              to="/profile"
              className="flex items-center justify-center size-9 rounded-lg hover:bg-[#ec4913]/10 transition-colors no-underline text-slate-700 hover:text-[#ec4913]"
              title="Profile"
            >
              <span className="material-symbols-outlined text-[22px]">person</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center size-9 rounded-lg hover:bg-red-50 transition-colors text-slate-700 hover:text-red-500 cursor-pointer border-0 bg-transparent"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="hidden sm:flex items-center justify-center h-9 px-4 rounded-lg text-sm font-bold text-slate-700 hover:text-[#ec4913] hover:bg-[#ec4913]/10 transition-colors no-underline"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex items-center justify-center h-9 px-4 rounded-lg bg-[#ec4913] text-white text-sm font-bold hover:bg-[#ec4913]/90 transition-colors no-underline"
            >
              Register
            </Link>
          </>
        )}

        {/* Mobile menu toggle */}
        <button
          className="flex md:hidden items-center justify-center size-9 rounded-lg hover:bg-slate-100 border-0 bg-transparent cursor-pointer text-slate-700"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[#ec4913]/10 shadow-lg md:hidden flex flex-col py-4 px-6 gap-3 z-50">
          {[
            { label: 'Shop',    to: '/products' },
            { label: 'Recipes', to: '#'         },
            { label: 'About',   to: '#'         },
            { label: 'Gifts',   to: '#'         },
          ].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="text-slate-700 hover:text-[#ec4913] text-sm font-semibold py-1 no-underline"
            >
              {label}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="text-slate-700 hover:text-[#ec4913] text-sm font-semibold py-1 no-underline"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
