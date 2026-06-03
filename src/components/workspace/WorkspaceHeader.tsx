import { useState, useEffect } from 'react';
import { Icons } from '../../assets/icons';
import UserDropdown from '../common/UserDropdown';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearchDropdown from './GlobalSearchDropdown';
import GlobalCreateTaskModal from './GlobalCreateTaskModal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { NOTIFICATION_KEYS, useNotificationsQuery } from '../../hooks/api/useNotifications';
import { useNotificationWebSocket } from '../../hooks/api/useNotificationWebSocket';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface WorkspaceHeaderProps {
  onOpenMobileMenu?: () => void;
}

export default function WorkspaceHeader({ onOpenMobileMenu }: WorkspaceHeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useNotificationsQuery();

  // Read user directly from Redux store — always in sync with login/logout
  const rawUser = useAppSelector(state => state.auth.user);

  // Normalize field names to handle API response inconsistency (fullname vs fullName)
  const user = rawUser ? {
    ...rawUser,
    fullName: rawUser.fullName || rawUser.fullname || rawUser.full_name || '',
    userName: rawUser.userName || rawUser.username || rawUser.user_name || '',
    avatar: rawUser.avatar || rawUser.avatarUrl || rawUser.avatar_url || null,
  } : null;

  // Removed dispatch(fetchNotifications()) as useNotificationsQuery will handle fetching

  // Handle WebSockets for user notifications
  useNotificationWebSocket(user?.id);

  useEffect(() => {
    const unread = notifications.filter((n: any) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  return (
    <header className="h-18 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-30 shrink-0 transition-colors">
      {/* Left: Hamburger & Search */}
      <div className="flex flex-1 items-center gap-2 max-w-xl min-w-0 mr-4">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden shrink-0 p-2 text-muted-foreground hover:bg-muted dark:hover:bg-slate-700 rounded-md transition-colors"
        >
          <Icons.menu size={20} />
        </button>

        <div className="relative flex-1 max-w-[280px]">
          <div className={`flex items-center bg-muted dark:bg-slate-700/50 rounded-lg px-3 py-1.5 transition-all ${isSearchFocused ? 'w-full sm:w-96 ring-2 ring-blue-500/20 bg-card dark:bg-slate-700 border-blue-500' : 'w-full sm:w-64 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'} border`}>
            <Icons.search size={16} className={`${isSearchFocused ? 'text-blue-500' : 'text-muted-foreground dark:text-muted-foreground'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={t('header.search')}
              className="bg-transparent border-none outline-none text-sm ml-2 w-full placeholder:text-muted-foreground dark:text-slate-200"
            />
          </div>

          {isSearchFocused && (
            <GlobalSearchDropdown searchTerm={searchTerm} onClose={() => setIsSearchFocused(false)} />
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-3 md:gap-4 shrink-0">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 sm:px-4 sm:py-2 rounded-lg text-[0.85rem] font-bold transition-all shadow-sm shadow-blue-200 dark:shadow-none dark:shadow-none dark:shadow-none shrink-0"
        >
          <Icons.plus size={16} />
          <span className="hidden sm:inline">{t('common.create') || 'Create'}</span>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 hover:bg-background dark:hover:bg-slate-700 rounded-lg transition-all relative"
              title="Notifications"
            >
              <Icons.bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-rose-500 border border-white dark:border-slate-800 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white px-0.5">
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
          <button className="hidden sm:flex p-2 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 hover:bg-background dark:hover:bg-slate-700 rounded-lg transition-all" title="Help">
            <Icons.helpCircle size={18} />
          </button>
          <button
            onClick={() => navigate('/workspace/settings')}
            className="hidden sm:flex p-2 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200 hover:bg-background dark:hover:bg-slate-700 rounded-lg transition-all" title="Settings"
          >
            <Icons.settings size={18} />
          </button>
        </div>

        {/* Avatar */}
        {user && (
          <div className="shrink-0">
            <UserDropdown user={user} variant="workspace" />
          </div>
        )}
      </div>

      <GlobalCreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </header>
  );
}
