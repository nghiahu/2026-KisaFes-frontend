import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useNotificationsQuery, useAcceptInvitationMutation, useDeclineInvitationMutation, useMarkAsReadMutation, useMarkAllAsReadMutation, NOTIFICATION_KEYS } from '../../hooks/api/useNotifications';
import { useQueryClient } from '@tanstack/react-query';
import { Icons } from '../../assets/icons';
import { Check, Info, AlertTriangle, Send } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '@/components/ui/Button';

const timeAgo = (dateStr: string, t: any) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return t('inbox.just_now');
    if (diffMin < 60) return t('inbox.mins_ago').replace('{min}', diffMin.toString());
    if (diffHr < 24) return t('inbox.hrs_ago').replace('{hr}', diffHr.toString());
    if (diffDay === 1) return t('inbox.yesterday');
    return t('inbox.days_ago').replace('{day}', diffDay.toString());
  } catch (e) {
    return '';
  }
};

export default function Inbox() {
  const { data: notifications = [], isLoading: loading } = useNotificationsQuery();
  const acceptInvitationMutation = useAcceptInvitationMutation();
  const declineInvitationMutation = useDeclineInvitationMutation();
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();
  const { t } = useLanguage();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Local status override — same pattern as NotificationDropdown
  // Needed because selectedItem is a stale snapshot and won't update automatically
  const [localStatus, setLocalStatus] = useState<Map<string, string>>(new Map());
  const queryClient = useQueryClient();

  // Use real data from Redux
  const displayNotifications = notifications;

  const filteredNotifications = displayNotifications.filter(item => {
    if (filter === 'UNREAD') return !item.read;
    return true;
  });

  const handleAccept = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic local update
    setLocalStatus(prev => new Map(prev).set(id, 'ACCEPTED'));
    try {
      setActioningId(id);
      await acceptInvitationMutation.mutateAsync(id);
      // Force refresh so localStorage persister gets the correct data
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      // Revert on failure
      setLocalStatus(prev => { const m = new Map(prev); m.delete(id); return m; });
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocalStatus(prev => new Map(prev).set(id, 'DECLINED'));
    try {
      setActioningId(id);
      await declineInvitationMutation.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      setLocalStatus(prev => { const m = new Map(prev); m.delete(id); return m; });
    } finally {
      setActioningId(null);
    }
  };

  // Helper to render icon based on type
  const renderNotificationIcon = (item: any) => {
    if (item.type === 'SUCCESS' || item.type === 'ACCEPTED') {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
          <Check size={18} strokeWidth={2.5} />
        </div>
      );
    }
    if (item.type === 'WARNING' || item.type === 'DECLINED') {
      return (
        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
          <AlertTriangle size={18} strokeWidth={2.5} />
        </div>
      );
    }

    // Default to Avatar
    if (item.senderAvatar) {
      return <img src={item.senderAvatar} alt={item.senderName} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />;
    }
    return (
      <div className="w-10 h-10 rounded-full bg-background text-foreground flex items-center justify-center font-bold text-sm border border-border shrink-0">
        {item.senderName ? item.senderName.charAt(0).toUpperCase() : 'S'}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">

      {/* Container - Split Screen */}
      <div className="flex flex-1 overflow-hidden m-4 md:m-6 rounded-xl border border-border bg-card shadow-sm">

        {/* LEFT COLUMN: 40% */}
        <div className="w-full md:w-[40%] flex flex-col border-r border-border bg-card">
          {/* Left Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-border">
            <h1 className="text-xl font-bold text-foreground tracking-tight">{t('inbox.title')}</h1>

            <div className="flex items-center gap-3">
              <div className="flex p-0.5 bg-background rounded-lg border border-border">
                <Button
                  variant="ghost"
                  onClick={() => setFilter('ALL')}
                  className={`px-3 h-7 text-xs font-semibold rounded-md transition-all ${filter === 'ALL' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                    }`}
                >
                  {t('inbox.filter_all')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setFilter('UNREAD')}
                  className={`px-3 h-7 text-xs font-semibold rounded-md transition-all ${filter === 'UNREAD' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                    }`}
                >
                  {t('inbox.filter_unread')}
                </Button>
              </div>

              {/* Mark all as read */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => markAllAsReadMutation.mutate()}
                className="w-8 h-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                title={t('inbox.mark_all_read')}
              >
                <Check size={18} strokeWidth={2.5} />
              </Button>
            </div>
          </div>

          {/* Left Content List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {loading && filteredNotifications.length === 0 ? (
              <div className="p-8 flex items-center justify-center text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-slate-300 mb-4">
                  <Check size={24} />
                </div>
                <p className="font-semibold text-foreground">{t('inbox.empty_title')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('inbox.empty_desc')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-transparent">
                {filteredNotifications.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isUnread = !item.read;
                  return (
                    <li
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        if (isUnread) {
                          markAsReadMutation.mutate(item.id);
                        }
                      }}
                      className={`p-4 cursor-pointer transition-all flex gap-3 m-2 rounded-lg ${isSelected
                        ? 'bg-background border border-border shadow-sm relative'
                        : 'hover:bg-muted/50 border border-transparent'
                        }`}
                    >
                      {/* Active Blue Indicator */}
                      {isSelected && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#2563EB] rounded-r-full" />
                      )}

                      <div className="relative pl-1">
                        {renderNotificationIcon(item)}
                        {isUnread && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-[#2563EB] rounded-full border-2 border-white shadow-sm" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <p className={`text-[13px] leading-snug pr-2 ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {item.message}
                          </p>
                          <span className="text-[11px] text-muted-foreground font-medium shrink-0 whitespace-nowrap mt-0.5">
                            {timeAgo(item.createdAt, t)}
                          </span>
                        </div>
                        {/* Tags for specific types */}
                        {item.type === 'WARNING' && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[10px] font-bold uppercase tracking-wider">
                              {t('inbox.high_priority')}
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 60% */}
        <div className="hidden md:flex flex-col w-[60%] bg-card">
          {!selectedItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-background">
              <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
                <Icons.inbox size={24} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t('inbox.select_item_title')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t('inbox.select_item_desc')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">

              {/* Right Header (Context & Metadata) */}
              <div className="px-8 py-6 border-b border-border shrink-0 bg-card">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-4">
                  <span className="hover:text-[#2563EB] cursor-pointer transition-colors">{t('inbox.workspace')}</span>
                  <span>/</span>
                  <span className="hover:text-[#2563EB] cursor-pointer transition-colors">
                    {selectedItem.projectName || 'Notifications'}
                  </span>
                  <span>/</span>
                  <span className="text-foreground">{t('inbox.message')}</span>
                </div>

                <h2 className="text-2xl font-bold text-foreground leading-tight mb-4">
                  {selectedItem.message}
                </h2>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">{t('inbox.status')}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${(localStatus.get(selectedItem.id) ?? selectedItem.status) === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      (localStatus.get(selectedItem.id) ?? selectedItem.status) === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        (localStatus.get(selectedItem.id) ?? selectedItem.status) === 'DECLINED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-muted text-foreground border border-border'
                      }`}>
                      {localStatus.get(selectedItem.id) ?? selectedItem.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">{t('inbox.type')}</span>
                    <span className="px-2.5 py-1 bg-background text-muted-foreground border border-border rounded-md text-[11px] font-bold uppercase tracking-wide">
                      {selectedItem.type}
                    </span>
                  </div>
                </div>

                {/* Invitations Action block (if real invitation) */}
                {selectedItem.type === 'INVITATION' && (() => {
                  // effectiveStatus: prefer local override over stale selectedItem snapshot
                  const effectiveStatus = localStatus.get(selectedItem.id) ?? selectedItem.status;
                  return (
                    <>
                      {effectiveStatus === 'PENDING' && (
                        <div className="mt-6 p-4 bg-primary/10/50 rounded-xl border border-blue-100 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{t('inbox.invitation_title')}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('inbox.invitation_desc')}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="kisafres"
                              onClick={(e) => handleAccept(selectedItem.id, e)}
                              disabled={!!actioningId}
                              className="px-4 h-8 rounded-lg text-xs font-bold shadow-sm"
                            >
                              {actioningId === selectedItem.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : t('inbox.accept')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={(e) => handleDecline(selectedItem.id, e)}
                              disabled={!!actioningId}
                              className="px-4 h-8 rounded-lg text-xs font-bold"
                            >
                              {t('inbox.decline')}
                            </Button>
                          </div>
                        </div>
                      )}

                      {effectiveStatus === 'ACCEPTED' && (
                        <div className="mt-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Check size={16} strokeWidth={3} />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{t('inbox.accepted_title')}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('inbox.accepted_desc')}</p>
                          </div>
                        </div>
                      )}

                      {effectiveStatus === 'DECLINED' && (
                        <div className="mt-6 p-4 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                            <Icons.ban size={16} strokeWidth={3} />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{t('inbox.declined_title')}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('inbox.declined_desc')}</p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}


              </div>

              {/* Right Body (Activity Log) */}
              <div className="flex-1 overflow-y-auto p-8 bg-background">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">{t('inbox.activity')}</h4>

                <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#E5E7EB] before:via-[#E5E7EB] before:to-transparent">

                  {/* Activity Item 1 */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute left-0 w-2 h-2 rounded-full bg-[#2563EB] mt-2"></div>
                    <div className="pl-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[13px] text-foreground">{selectedItem.senderName || t('inbox.system')}</span>
                        <span className="text-xs text-muted-foreground">{t('inbox.sent_notification')}</span>
                        <span className="text-[11px] text-muted-foreground">{timeAgo(selectedItem.createdAt, t)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
