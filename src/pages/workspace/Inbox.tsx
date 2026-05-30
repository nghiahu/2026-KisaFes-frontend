import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useNotificationsQuery, useAcceptInvitationMutation, useDeclineInvitationMutation, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../../hooks/api/useNotifications';
import { Icons } from '../../assets/icons';
import { Check, Info, AlertTriangle, Send } from 'lucide-react';

const timeAgo = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay}d ago`;
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
  
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Use real data from Redux
  const displayNotifications = notifications;

  const filteredNotifications = displayNotifications.filter(item => {
    if (filter === 'UNREAD') return !item.read;
    return true;
  });

  const handleAccept = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setActioningId(id);
      await acceptInvitationMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setActioningId(id);
      await declineInvitationMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to decline invitation:', error);
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
      return <img src={item.senderAvatar} alt={item.senderName} className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB] shrink-0" />;
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[#F8F9FA] text-slate-700 flex items-center justify-center font-bold text-sm border border-[#E5E7EB] shrink-0">
        {item.senderName ? item.senderName.charAt(0).toUpperCase() : 'S'}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] animate-in fade-in duration-500">
      
      {/* Container - Split Screen */}
      <div className="flex flex-1 overflow-hidden m-4 md:m-6 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm">
        
        {/* LEFT COLUMN: 40% */}
        <div className="w-full md:w-[40%] flex flex-col border-r border-[#E5E7EB] bg-[#FFFFFF]">
          {/* Left Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-[#E5E7EB]">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inbox</h1>
            
            <div className="flex items-center gap-3">
              {/* Pill Tabs */}
              <div className="flex p-0.5 bg-[#F8F9FA] rounded-lg border border-[#E5E7EB]">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    filter === 'ALL' ? 'bg-[#FFFFFF] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('UNREAD')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    filter === 'UNREAD' ? 'bg-[#FFFFFF] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Unread
                </button>
              </div>
              
              {/* Mark all as read */}
              <button 
                onClick={() => markAllAsReadMutation.mutate()}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                title="Mark all as read"
              >
                <Check size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Left Content List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {loading && filteredNotifications.length === 0 ? (
              <div className="p-8 flex items-center justify-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#F8F9FA] flex items-center justify-center text-slate-300 mb-4">
                  <Check size={24} />
                </div>
                <p className="font-semibold text-slate-700">You're all caught up</p>
                <p className="text-xs text-slate-400 mt-1">No new notifications.</p>
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
                      className={`p-4 cursor-pointer transition-all flex gap-3 m-2 rounded-lg ${
                        isSelected 
                          ? 'bg-[#F8F9FA] border border-[#E5E7EB] shadow-sm relative' 
                          : 'hover:bg-[#F8F9FA]/50 border border-transparent'
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
                          <p className={`text-[13px] leading-snug pr-2 ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                            {item.message}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium shrink-0 whitespace-nowrap mt-0.5">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        {/* Tags for specific types */}
                        {item.type === 'WARNING' && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[10px] font-bold uppercase tracking-wider">
                              High Priority
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
        <div className="hidden md:flex flex-col w-[60%] bg-[#FFFFFF]">
          {!selectedItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#F8F9FA]">
              <div className="w-16 h-16 mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Icons.inbox size={24} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Select an item to view</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Click on any notification from the list on the left to see its details and take action.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
              
              {/* Right Header (Context & Metadata) */}
              <div className="px-8 py-6 border-b border-[#E5E7EB] shrink-0 bg-[#FFFFFF]">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
                  <span className="hover:text-[#2563EB] cursor-pointer transition-colors">Workspace</span>
                  <span>/</span>
                  <span className="hover:text-[#2563EB] cursor-pointer transition-colors">
                    {selectedItem.projectName || 'Notifications'}
                  </span>
                  <span>/</span>
                  <span className="text-slate-700">Message</span>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-4">
                  {selectedItem.message}
                </h2>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Status</span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                      selectedItem.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      selectedItem.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      selectedItem.status === 'DECLINED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {selectedItem.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Type</span>
                    <span className="px-2.5 py-1 bg-[#F8F9FA] text-slate-600 border border-[#E5E7EB] rounded-md text-[11px] font-bold uppercase tracking-wide">
                      {selectedItem.type}
                    </span>
                  </div>
                </div>

                {/* Invitations Action block (if real invitation) */}
                {selectedItem.type === 'INVITATION' && selectedItem.status === 'PENDING' && (
                  <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Project Invitation</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Please accept or decline this invitation to proceed.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleAccept(selectedItem.id, e)}
                        className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => handleDecline(selectedItem.id, e)}
                        className="px-4 py-1.5 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedItem.type === 'INVITATION' && selectedItem.status === 'ACCEPTED' && (
                  <div className="mt-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Accepted</h4>
                      <p className="text-xs text-slate-600 mt-0.5">You have successfully joined the project.</p>
                    </div>
                  </div>
                )}

                {selectedItem.type === 'INVITATION' && selectedItem.status === 'DECLINED' && (
                  <div className="mt-6 p-4 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                      <Icons.ban size={16} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Declined</h4>
                      <p className="text-xs text-slate-600 mt-0.5">You have declined this invitation.</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right Body (Activity Log) */}
              <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Activity</h4>
                
                <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#E5E7EB] before:via-[#E5E7EB] before:to-transparent">
                  
                  {/* Activity Item 1 */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute left-0 w-2 h-2 rounded-full bg-[#2563EB] mt-2"></div>
                    <div className="pl-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[13px] text-slate-900">{selectedItem.senderName || 'System'}</span>
                        <span className="text-xs text-slate-500">sent this notification</span>
                        <span className="text-[11px] text-slate-400">{timeAgo(selectedItem.createdAt)}</span>
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
