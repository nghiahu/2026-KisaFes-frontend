import { useState, useEffect } from 'react';
import { Icons } from '../../assets/icons';
import { projectService } from '../../services/project.service';
import { userService } from '../../services/userService';
import defaultMan from '../../assets/avatar_def_man.png';

interface InviteMemberModalProps {
  onClose: () => void;
  projectName: string;
  projectId: string;
}

export default function InviteMemberModal({ onClose, projectName, projectId }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search for users
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const keyword = email.trim();
      if (!keyword || selectedUser?.email === keyword) {
        setSearchResults([]);
        setSearchDropdownOpen(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const res: any = await userService.searchUsers(keyword);
        const fetchedUsers = res.data || [];
        setSearchResults(fetchedUsers);
        setSearchDropdownOpen(true);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [email, selectedUser]);

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setEmail(user.email);
    setSearchDropdownOpen(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSending(true);
    setError(null);
    try {
      await projectService.inviteMember(projectId, email.trim());
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-visible animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Invite to project</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{projectName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Icons.plus size={20} className="rotate-45" />
          </button>
        </div>
        
        <form onSubmit={handleInvite} className="p-6">
          <div className="mb-4 relative">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Tìm kiếm Email hoặc Tên thành viên
            </label>
            <div className="relative">
              <Icons.search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (selectedUser && selectedUser.email !== e.target.value) {
                    setSelectedUser(null);
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setSearchDropdownOpen(true);
                }}
                placeholder="Nhập email hoặc tên của thành viên..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm text-slate-800 animate-in"
                disabled={isSending || success}
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Selected User Badge */}
            {selectedUser && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50/50 border border-blue-100 rounded-xl animate-in zoom-in-95">
                <img 
                  src={selectedUser.avatar || defaultMan} 
                  alt={selectedUser.fullName} 
                  className="w-7 h-7 rounded-full object-cover border border-blue-200" 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{selectedUser.fullName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{selectedUser.email}</div>
                </div>
              </div>
            )}

            {/* Dropdown Results */}
            {searchDropdownOpen && email.trim() !== '' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSearchDropdownOpen(false)} />
                <div className="absolute left-0 right-0 z-20 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="p-1">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => selectUser(u)}
                          className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors text-left"
                        >
                          <img 
                            src={u.avatar || defaultMan} 
                            alt={u.fullName} 
                            className="w-8 h-8 rounded-full object-cover bg-slate-100" 
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-800 truncate">{u.fullName}</div>
                            <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="p-4 text-center text-xs text-slate-500 font-bold">
                        Không tìm thấy người dùng nào phù hợp.
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {error && (
              <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                <Icons.alertCircle size={12} />
                {error}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
              disabled={isSending || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || success || !email.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Sending...</span>
                </>
              ) : success ? (
                <>
                  <Icons.check size={16} />
                  <span>Invited!</span>
                </>
              ) : (
                <span>Send Invite</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
