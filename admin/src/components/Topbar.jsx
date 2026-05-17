import { useAuthStore } from '../store/authStore';

export default function Topbar({ title }) {
  const { user } = useAuthStore();

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'A';

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-xl font-bold text-stone-800">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer bg-transparent border-0">
          <span className="material-symbols-outlined text-stone-500">notifications</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#ec4913] flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-stone-800 leading-tight">
              {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Admin'}
            </p>
            <p className="text-xs text-stone-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
