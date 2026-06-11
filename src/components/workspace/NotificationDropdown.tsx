import { useEffect, useRef, useState } from 'react';
import { useNotificationsQuery, useAcceptInvitationMutation, useDeclineInvitationMutation, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../../hooks/api/useNotifications';
import { Icons } from '../../assets/icons';
import { X } from 'lucide-react';



import { Button } from '@/components/ui/Button';
import type { NotificationDropdownProps } from '../../types/components.interface';
export default function NotificationDropdown({ onClose, onNotificationsCountChange, ignoreRef }: NotificationDropdownProps) {
  const { data: notifications = [], isLoading: loading } = useNotificationsQuery();
  const acceptInvitationMutation = useAcceptInvitationMutation();
  const declineInvitationMutation = useDeclineInvitationMutation();
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local UI state — bypasses React Query cache + localStorage persister race condition.
  // Maps notificationId → overridden status string ('ACCEPTED' | 'DECLINED')
  const [localStatus, setLocalStatus] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        (!ignoreRef || !ignoreRef.current || !ignoreRef.current.contains(event.target as Node))
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleAccept = (id: string) => {
    // Flip UI immediately — no waiting for API response
    setLocalStatus(prev => new Map(prev).set(id, 'ACCEPTED'));

    acceptInvitationMutation.mutate(id, {
      onError: () => {
        // Revert local override if the API actually failed
        setLocalStatus(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  const handleDecline = (id: string) => {
    setLocalStatus(prev => new Map(prev).set(id, 'DECLINED'));

    declineInvitationMutation.mutate(id, {
      onError: () => {
        setLocalStatus(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  const timeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 60) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHr < 24) return `${diffHr} giờ trước`;
      return `${diffDay} ngày trước`;
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-background border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground text-[0.9rem] flex items-center gap-2">
          <Icons.bell size={16} className="text-primary" />
          Thông báo của bạn
        </h3>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[0.75rem] px-2 py-0.5 bg-primary/20 text-primary font-bold rounded-full">
              {notifications.filter(n => !n.read).length} mới
            </span>
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Đánh dấu tất cả đã đọc"
            >
              <Icons.check size={14} strokeWidth={3} />
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[0.8rem] text-muted-foreground">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Icons.bell size={22} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-[0.85rem]">Không có thông báo nào</p>
              <p className="text-[0.75rem] text-muted-foreground mt-1">
                Khi bạn có lời mời tham gia dự án hoặc cập nhật, chúng sẽ xuất hiện ở đây.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.read;
            // localStatus overrides server status for instant visual feedback
            const effectiveStatus = localStatus.get(item.id) ?? item.status;
            const isActioning = acceptInvitationMutation.isPending || declineInvitationMutation.isPending;

            return (
              <div
                key={item.id}
                onClick={() => { if (isUnread) markAsReadMutation.mutate(item.id); }}
                className={`p-4 transition-all flex gap-3 cursor-pointer ${isUnread ? 'bg-primary/10/30 hover:bg-primary/10/50' : 'hover:bg-background/50'
                  }`}
              >
                {/* Avatar */}
                <div className="shrink-0 w-9 h-9">
                  {item.senderAvatar ? (
                    <img 
                      src={item.senderAvatar} 
                      alt={item.senderName} 
                      className="w-full h-full rounded-full object-cover border border-border"
                     
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[0.85rem] border border-blue-100">
                      {item.senderName ? item.senderName.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <p className="text-[0.82rem] font-bold text-foreground truncate">
                      {item.senderName || 'Hệ thống'}
                    </p>
                    <span className="text-[0.7rem] text-muted-foreground shrink-0">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[0.8rem] text-muted-foreground mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Invitation actions */}
                  {item.type === 'INVITATION' && (
                    <div className="mt-3">
                      {effectiveStatus === 'PENDING' ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleAccept(item.id); }}
                            disabled={isActioning}
                            className="px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-lg text-[0.75rem] font-bold flex items-center gap-1 transition-all shadow-sm shadow-blue-100"
                          >
                            <Icons.check size={13} />
                            Đồng ý
                          </Button>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleDecline(item.id); }}
                            disabled={isActioning}
                            className="px-3 py-1.5 bg-muted hover:bg-accent disabled:opacity-60 text-muted-foreground rounded-lg text-[0.75rem] font-bold flex items-center gap-1 transition-all"
                          >
                            Từ chối
                          </Button>
                        </div>
                      ) : effectiveStatus === 'ACCEPTED' ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[0.72rem] font-bold rounded-lg border border-emerald-100">
                          <Icons.check size={12} />
                          Đã đồng ý
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-[0.72rem] font-bold rounded-lg border border-rose-100">
                          <X size={12} />
                          Đã từ chối
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
