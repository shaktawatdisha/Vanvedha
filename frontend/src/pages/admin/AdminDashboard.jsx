import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import AdminTopbar from '../../components/layout/AdminTopbar';

const cards = (data) => [
  {
    label: 'Total Users',
    value: data?.total_users,
    icon: 'group',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    label: 'Customers',
    value: data?.total_customers,
    icon: 'person',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    label: 'Vendors',
    value: data?.total_vendors,
    icon: 'storefront',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Delivery Agents',
    value: data?.total_delivery_agents,
    icon: 'local_shipping',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Pending Approvals',
    value: data?.pending_vendor_approvals,
    icon: 'pending_actions',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Active Users',
    value: data?.active_users,
    icon: 'how_to_reg',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
];

const quickActions = [
  { label: 'Manage Users',    desc: 'View, activate and manage user accounts', to: '/admin/users',          icon: 'group',         iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'     },
  { label: 'Manage Vendors',  desc: 'Approve or reject vendor applications',   to: '/admin/vendors',        icon: 'storefront',    iconBg: 'bg-violet-100',  iconColor: 'text-violet-600'  },
  { label: 'Manage Delivery', desc: 'Monitor delivery agent availability',      to: '/admin/delivery-agents',icon: 'local_shipping',iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data),
  });

  return (
    <div className="flex flex-col">
      <AdminTopbar title="Dashboard" />

      <div className="p-6">
        {/* Stat Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-stone-400">
            <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {cards(data).map(({ label, value, icon, iconBg, iconColor }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex items-center justify-between"
              >
                <div>
                  <p className="text-stone-500 text-sm mb-1">{label}</p>
                  <p className="text-3xl font-bold text-stone-800">{value ?? 0}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-2xl ${iconColor}`}>{icon}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-semibold text-stone-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map(({ label, desc, to, icon, iconBg, iconColor }) => (
              <Link
                key={to}
                to={to}
                className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex items-start gap-4 hover:shadow-md hover:border-stone-200 transition-all group"
              >
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-2xl ${iconColor}`}>{icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-stone-800 text-sm group-hover:text-[#ec4913] transition-colors">{label}</p>
                  <p className="text-stone-500 text-xs mt-0.5 leading-snug">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
