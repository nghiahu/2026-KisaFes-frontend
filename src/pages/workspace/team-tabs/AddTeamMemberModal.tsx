import { useState, useEffect, useRef } from 'react';
import { Icons } from '../../../assets/icons';
import { userService } from '../../../services/userService';
import { teamService } from '../../../services/team.service';
import type { Team } from '../../../types/team.interface';

interface AddTeamMemberModalProps {
  team: Team;
  onClose: () => void;
  onSuccess: (updatedTeam: Team) => void;
}

export default function AddTeamMemberModal({ team, onClose, onSuccess }: AddTeamMemberModalProps) {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(async () => {
      const keyword = searchInput.trim();
      if (!keyword) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      try {
        setIsSearching(true);
        const res: any = await userService.searchUsers(keyword);
        const users = res.data || [];
        // Lọc những người chưa có trong team
        const filteredUsers = users.filter((u: any) => 
          !team.members.some(m => m.id === u.id || m.name === u.fullName)
        );
        setSearchResults(filteredUsers);
      } catch (err) {
        console.error('Search error', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, team.members]);

  const handleAddMember = async (user: any) => {
    try {
      setIsAdding(true);
      setError(null);
      const updatedTeam = await teamService.addMember(team.id, user.email);
      setInvitedUsers(prev => new Set(prev).add(user.id));
      onSuccess(updatedTeam);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi mời thành viên');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-visible animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground text-lg">Mời thành viên</h3>
            <p className="text-sm text-muted-foreground">Tìm kiếm người dùng để gửi lời mời tham gia nhóm.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Icons.x size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <Icons.search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              className="w-full bg-background border border-border pl-11 pr-5 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
              placeholder="Search users by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl flex items-center gap-2 border border-rose-100">
              <Icons.alertCircle size={16} />
              {error}
            </div>
          )}

          <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
            {!searchInput.trim() ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Icons.users size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Type a name or email to search</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-background rounded-xl transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      {(user.avatar || user.avatarUrl) ? (
                        <img  src={user.avatar || user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full object-cover bg-muted" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {user.fullName?.charAt(0) || user.email?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-foreground text-sm">{user.fullName || "User"}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user)}
                      disabled={isAdding || invitedUsers.has(user.id)}
                      className={`px-4 py-1.5 font-bold rounded-lg transition-colors text-xs ${
                        invitedUsers.has(user.id)
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {invitedUsers.has(user.id) ? 'Đã mời' : 'Mời'}
                    </button>
                  </div>
                ))}
              </div>
            ) : !isSearching ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <p className="text-sm">No users found matching "{searchInput}"</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
