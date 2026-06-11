import { useState, useEffect, useRef } from 'react';
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



import { Button } from '@/components/ui/Button';
import type { WorkspaceHeaderProps } from '../../types/components.interface';
export default function WorkspaceHeader({ onOpenMobileMenu }: WorkspaceHeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const notificationWrapperRef = useRef<HTMLDivElement>(null);
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden shrink-0 text-muted-foreground hover:bg-muted dark:hover:bg-accent rounded-md transition-colors"
        >
          <Icons.menu size={20} />
        </Button>

        <div className="relative flex-1 max-w-[280px]">
          <div className={`flex items-center bg-muted dark:bg-slate-700/50 rounded-lg px-3 py-1.5 transition-all ${isSearchFocused ? 'w-full sm:w-96 ring-2 ring-primary/20 bg-card dark:bg-accent border-primary' : 'w-full sm:w-64 border-transparent hover:bg-accent dark:hover:bg-accent'} border`}>
            <Icons.search size={16} className={`${isSearchFocused ? 'text-primary' : 'text-muted-foreground dark:text-muted-foreground'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={t('header.search')}
              className="bg-transparent border-none outline-none text-sm ml-2 w-full placeholder:text-muted-foreground dark:text-muted-foreground"
            />
          </div>

          {isSearchFocused && (
            <GlobalSearchDropdown searchTerm={searchTerm} onClose={() => setIsSearchFocused(false)} />
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-3 md:gap-4 shrink-0">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-2 py-2 sm:px-4 sm:py-2 rounded-lg text-[0.85rem] font-bold transition-all shadow-sm shadow-primary/20 dark:shadow-none dark:shadow-none dark:shadow-none shrink-0"
        >
          <Icons.plus size={16} />
          <span className="hidden sm:inline">{t('common.create') || 'Create'}</span>
        </Button>

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative" ref={notificationWrapperRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground hover:bg-background dark:hover:bg-accent rounded-lg transition-all relative"
              title="Notifications"
            >
              <Icons.bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-destructive border border-white dark:border-border rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white px-0.5">
                  {unreadCount}
                </span>
              )}
            </Button>
            {showNotifications && (
              <NotificationDropdown
                onClose={() => setShowNotifications(false)}
                onNotificationsCountChange={setUnreadCount}
                ignoreRef={notificationWrapperRef}
              />
            )}
          </div>
          <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground hover:bg-background dark:hover:bg-accent rounded-lg transition-all" title="Help">
            <Icons.helpCircle size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/workspace/settings')}
            className="hidden sm:flex text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground hover:bg-background dark:hover:bg-accent rounded-lg transition-all" title="Settings"
          >
            <Icons.settings size={18} />
          </Button>
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
