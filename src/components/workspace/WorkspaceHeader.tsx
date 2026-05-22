import { useState, useEffect } from 'react';
import { Icons } from '../../assets/icons';
import UserDropdown from '../common/UserDropdown';
import NotificationDropdown from './NotificationDropdown';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications } from '../../store/slices/notificationSlice';

export default function WorkspaceHeader() {
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.notification.notifications);

  // Read user directly from Redux store — always in sync with login/logout
  const rawUser = useAppSelector(state => state.auth.user);

  // Normalize field names to handle API response inconsistency (fullname vs fullName)
  const user = rawUser ? {
    ...rawUser,
    fullName: rawUser.fullName || rawUser.fullname || rawUser.full_name || '',
    userName: rawUser.userName || rawUser.username || rawUser.user_name || '',
    avatar: rawUser.avatar || rawUser.avatarUrl || rawUser.avatar_url || null,
  } : null;

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const pending = notifications.filter((n: any) => n.status === 'PENDING').length;
    setUnreadCount(pending);
  }, [notifications]);

  return (
    <header className="h-18 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Search */}
      <div className="flex-1 max-w-md mr-4 sm:mr-0">
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all w-full max-w-[230px] sm:max-w-none">
          <Icons.search size={16} className="text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent border-none outline-none text-[0.85rem] w-full"
          />
        </div>
      </div>

      {/* Center: Nav Tabs (Hidden on mobile) */}
      <nav className="hidden md:flex items-center gap-8 absolute left-[65%] -translate-x-1/2">
        <a href="/workspace" className="text-[0.85rem] font-bold text-blue-600 border-b-2 border-blue-600 py-5 transition-all">
          Boards
        </a>
        <a href="/workspace/team" className="text-[0.85rem] font-semibold text-slate-500 hover:text-slate-700 py-5 transition-all">
          Team
        </a>
        <a href="/workspace/calendar" className="text-[0.85rem] font-semibold text-slate-500 hover:text-slate-700 py-5 transition-all">
          Calendar
        </a>
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-[0.85rem] font-bold transition-all shadow-sm shadow-blue-200">
          <Icons.plus size={16} />
          <span className="hidden sm:inline">Create</span>
        </button>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all relative"
              title="Notifications"
            >
              <Icons.bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-rose-500 border border-white rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white px-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown
                onClose={() => setShowNotifications(false)}
                onNotificationsCountChange={setUnreadCount}
              />
            )}
          </div>
          <button className="hidden sm:flex p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all" title="Help">
            <Icons.helpCircle size={18} />
          </button>
          <button className="hidden sm:flex p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all" title="Settings">
            <Icons.settings size={18} />
          </button>
        </div>

        {/* Avatar */}
        {user && <UserDropdown user={user} variant="workspace" />}
      </div>
    </header>
  );
}
