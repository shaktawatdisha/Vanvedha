import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/admin',                icon: 'dashboard',      label: 'Dashboard',       end: true  },
  { to: '/admin/users',          icon: 'group',          label: 'Users',           end: false },
  { to: '/admin/vendors',        icon: 'storefront',     label: 'Vendors',         end: false },
  { to: '/admin/delivery-agents',icon: 'local_shipping', label: 'Delivery Agents', end: false },
  { to: '/admin/tags',           icon: 'label',          label: 'Tags',            end: false },
];

export default function AdminSidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-stone-900 text-white flex flex-col">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-800">
        <span className="material-symbols-outlined text-[#ec4913] text-3xl">skillet</span>
        <span className="font-bold text-lg text-[#ec4913] tracking-tight">Vanvedha Admin</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4">
        {links.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#ec4913] text-white'
                  : 'text-stone-400 hover:bg-stone-800 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user info + sign out */}
      <div className="border-t border-stone-800 px-6 py-4">
        {user?.email && (
          <p className="text-xs text-stone-500 mb-3 truncate">{user.email}</p>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-xl leading-none">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
