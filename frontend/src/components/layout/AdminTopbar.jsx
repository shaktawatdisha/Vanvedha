import { useAuthStore } from '../../store/authStore';

export default function AdminTopbar({ title }) {
  const { user } = useAuthStore();

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email[0].toUpperCase()
    : 'A';

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left: Page Title */}
      <h1 className="text-xl font-semibold text-stone-800">{title}</h1>

      {/* Right: Notification + User */}
      <div className="flex items-center gap-4">
        {/* Bell icon */}
        <button className="relative p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all">
          <span className="material-symbols-outlined text-2xl leading-none">notifications</span>
        </button>

        {/* User avatar + email */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#ec4913] flex items-center justify-center text-white text-sm font-bold select-none">
            {initials}
          </div>
          {user?.email && (
            <span className="text-xs text-stone-500 hidden sm:block max-w-[160px] truncate">
              {user.email}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
