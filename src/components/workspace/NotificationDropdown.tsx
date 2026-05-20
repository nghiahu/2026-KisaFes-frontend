import { useEffect, useState, useRef } from 'react';
import { type NotificationResponse } from '../../services/notification.service';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications, acceptInvitation, declineInvitation } from '../../store/slices/notificationSlice';
import { Icons } from '../../assets/icons';
import { X } from 'lucide-react';

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationsCountChange: (count: number) => void;
}

export default function NotificationDropdown({ onClose, onNotificationsCountChange }: NotificationDropdownProps) {
  const dispatch = useAppDispatch();
  const { notifications, loading } = useAppSelector(state => state.notification);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchNotifications());

    // Click outside listener
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch, onClose]);

  const handleAccept = async (id: string) => {
    try {
      setActioningId(id);
      await dispatch(acceptInvitation(id)).unwrap();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      setActioningId(id);
      await dispatch(declineInvitation(id)).unwrap();
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    } finally {
      setActioningId(null);
    }
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
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-[0.9rem] flex items-center gap-2">
          <Icons.bell size={16} className="text-blue-600" />
          Thông báo của bạn
        </h3>
        {notifications.length > 0 && (
          <span className="text-[0.75rem] px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-full">
            {notifications.filter(n => n.status === 'PENDING').length} mới
          </span>
        )}
      </div>

      {/* List Container */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[0.8rem] text-slate-400">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Icons.bell size={22} />
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-[0.85rem]">Không có thông báo nào</p>
              <p className="text-[0.75rem] text-slate-400 mt-1">Khi bạn có lời mời tham gia dự án hoặc cập nhật, chúng sẽ xuất hiện ở đây.</p>
            </div>
          </div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-all flex gap-3">
              {/* Avatar / Icon */}
              <div className="shrink-0">
                {item.senderAvatar ? (
                  <img
                    src={item.senderAvatar}
                    alt={item.senderName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-100"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[0.85rem] border border-blue-100">
                    {item.senderName ? item.senderName.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <p className="text-[0.82rem] font-bold text-slate-800 truncate">
                    {item.senderName || 'Hệ thống'}
                  </p>
                  <span className="text-[0.7rem] text-slate-400 shrink-0">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
                <p className="text-[0.8rem] text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>

                {/* Actions (if Invitation & Pending) */}
                {item.type === 'INVITATION' && (
                  <div className="mt-3">
                    {item.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button
                          disabled={actioningId !== null}
                          onClick={() => handleAccept(item.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-[0.75rem] font-bold flex items-center gap-1 transition-all shadow-sm shadow-blue-100"
                        >
                          {actioningId === item.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Icons.check size={13} />
                          )}
                          Đồng ý
                        </button>
                        <button
                          disabled={actioningId !== null}
                          onClick={() => handleDecline(item.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-600 rounded-lg text-[0.75rem] font-bold flex items-center gap-1 transition-all"
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : item.status === 'ACCEPTED' ? (
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
          ))
        )}
      </div>
    </div>
  );
}
