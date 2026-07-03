import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard',        icon: 'dashboard',        label: 'Dashboard',       end: true },
  { divider: true, label: 'People' },
  { to: '/users',            icon: 'group',            label: 'Users'                      },
  { to: '/staff-permissions', icon: 'badge',            label: 'Staff Permissions'          },
  { to: '/delivery-agents',  icon: 'local_shipping',   label: 'Delivery Agents'            },
  { divider: true, label: 'Catalog' },
  { to: '/categories',       icon: 'category',         label: 'Categories'                 },
  { to: '/tags',             icon: 'label',            label: 'Tags'                       },
  { to: '/products',         icon: 'inventory_2',      label: 'Products'                   },
  { divider: true, label: 'Commerce' },
  { to: '/orders',           icon: 'receipt_long',     label: 'Orders'                     },
  { to: '/coupons',          icon: 'local_offer',      label: 'Coupons'                    },
  { to: '/reviews',          icon: 'rate_review',      label: 'Reviews'                    },
  { divider: true, label: 'Raw Material' },
  { to: '/raw-material/suppliers',  icon: 'agriculture',      label: 'Suppliers'             },
  { to: '/raw-material/raw-lots',   icon: 'weight',           label: 'Raw Material Lots'     },
  { to: '/raw-material/batches',    icon: 'blender',          label: 'Processing Batches'    },
  { to: '/raw-material/scan',       icon: 'barcode_scanner',  label: 'Barcode Lookup'        },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <aside className="w-64 shrink-0 bg-stone-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-800">
        <span className="material-symbols-outlined text-3xl text-[#ec4913]">skillet</span>
        <div>
          <p className="text-white font-black text-base leading-tight">Vanvedha</p>
          <p className="text-[#ec4913] text-xs font-semibold tracking-widest uppercase">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((item) =>
          item.divider ? (
            <p key={item.label} className="px-4 pt-4 pb-1 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
              {item.label}
            </p>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#ec4913] text-white shadow-lg shadow-[#ec4913]/20'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      {/* Bottom user area */}
      <div className="px-3 pb-4 border-t border-stone-800 pt-4 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="h-8 w-8 rounded-full bg-[#ec4913] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Admin'}
            </p>
            <p className="text-stone-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-all w-full text-left cursor-pointer bg-transparent border-0"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
