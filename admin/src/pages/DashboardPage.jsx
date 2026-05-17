import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';

const STAT_CARDS = (data) => [
  { label: 'Total Users',       value: data?.total_users,            icon: 'group',            color: 'indigo'  },
  { label: 'Customers',         value: data?.total_customers,        icon: 'person',           color: 'sky'     },
  { label: 'Vendors',           value: data?.total_vendors,          icon: 'storefront',       color: 'violet'  },
  { label: 'Delivery Agents',   value: data?.total_delivery_agents,  icon: 'local_shipping',   color: 'emerald' },
  { label: 'Pending Approvals', value: data?.pending_vendor_approvals, icon: 'pending_actions', color: 'amber'  },
  { label: 'Active Users',      value: data?.active_users,           icon: 'how_to_reg',       color: 'orange'  },
];

const COLOR_MAP = {
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  num: 'text-indigo-700'  },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     num: 'text-sky-700'     },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  num: 'text-violet-700'  },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', num: 'text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   num: 'text-amber-700'   },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  num: 'text-orange-700'  },
};

const QUICK_LINKS = [
  { to: '/users',           icon: 'group',          label: 'Manage Users',           desc: 'Activate, verify & manage roles'    },
  { to: '/vendors',         icon: 'storefront',      label: 'Manage Vendors',          desc: 'Approve or reject vendor requests'  },
  { to: '/delivery-agents', icon: 'local_shipping',  label: 'Manage Delivery Agents',  desc: 'Toggle availability & zone info'   },
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data),
  });

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Dashboard" />
      <div className="p-6 flex flex-col gap-6">

        {/* Stat Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="material-symbols-outlined animate-spin text-[#ec4913] text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {STAT_CARDS(data).map(({ label, value, icon, color }) => {
              const c = COLOR_MAP[color];
              return (
                <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex items-center justify-between">
                  <div>
                    <p className="text-stone-500 text-sm mb-1">{label}</p>
                    <p className={`text-3xl font-black ${c.num}`}>{value ?? 0}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-2xl ${c.text}`}>{icon}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="text-base font-bold text-stone-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUICK_LINKS.map(({ to, icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:border-[#ec4913]/30 hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="h-11 w-11 rounded-xl bg-[#ec4913]/10 flex items-center justify-center shrink-0 group-hover:bg-[#ec4913] transition-colors">
                  <span className="material-symbols-outlined text-[#ec4913] group-hover:text-white transition-colors">{icon}</span>
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">{label}</p>
                  <p className="text-stone-400 text-xs mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
