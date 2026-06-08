import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icons } from '../../assets/icons';
import { projectService } from '../../services/project.service';
import { userService } from '../../services/userService';
import { teamService } from '../../services/team.service';
import defaultMan from '../../assets/avatar_def_man.png';
import { useQueryClient } from '@tanstack/react-query';

interface InviteMemberModalProps {
  onClose: () => void;
  projectName: string;
  projectId: string;
}

const inviteSchema = z.object({
  query: z.string().min(1, 'Vui lòng nhập từ khóa tìm kiếm')
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteMemberModal({ onClose, projectName, projectId }: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { query: '' }
  });
  
  const queryValue = watch('query');
  const [activeTab, setActiveTab] = useState<'user' | 'team'>('user');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedItem(null);
    setValue('query', '');
    setSearchResults([]);
    setSearchDropdownOpen(false);
  }, [activeTab, setValue]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const keyword = queryValue.trim();
      const currentSelectedKey = activeTab === 'user' ? selectedItem?.email : selectedItem?.name;
      if (!keyword || currentSelectedKey === keyword) {
        setSearchResults([]);
        setSearchDropdownOpen(false);
        return;
      }
      
      setIsSearching(true);
      try {
        if (activeTab === 'user') {
          const res: any = await userService.searchUsers(keyword);
          setSearchResults(res.data || []);
        } else {
          const res: any = await teamService.searchTeams(keyword);
          setSearchResults(res || []);
        }
        setSearchDropdownOpen(true);
      } catch (error) {
        console.error(`Failed to search ${activeTab}:`, error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [queryValue, selectedItem, activeTab]);

  const selectItem = (item: any) => {
    setSelectedItem(item);
    setValue('query', activeTab === 'user' ? item.email : item.name, { shouldValidate: true });
    setSearchDropdownOpen(false);
  };

  const onInviteSubmit = async () => {
    if (!selectedItem) {
      setError(`Vui lòng chọn một ${activeTab === 'user' ? 'người dùng' : 'nhóm'} từ danh sách`);
      return;
    }
    
    setIsSending(true);
    setError(null);
    try {
      if (activeTab === 'user') {
        await projectService.inviteMember(projectId, selectedItem.email);
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      } else {
        await projectService.addTeamToProject(projectId, selectedItem.id);
        queryClient.invalidateQueries({ queryKey: ['projectTeams', projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện');
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
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md overflow-visible animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card shrink-0 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-foreground">Add to project</h2>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">{projectName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Icons.plus size={20} className="rotate-45" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-border px-6 pt-4">
          <button
            type="button"
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'user' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('user')}
          >
            Mời cá nhân
          </button>
          <button
            type="button"
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'team' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('team')}
          >
            Thêm nhóm (Team)
          </button>
        </div>

        <form onSubmit={handleSubmit(onInviteSubmit)} className="p-6">
          <div className="mb-4 relative">
            <label className="block text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
              {activeTab === 'user' ? 'Tìm kiếm Email hoặc Tên thành viên' : 'Tìm kiếm Tên nhóm'}
            </label>
            <div className="relative">
              <Icons.search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                {...register('query')}
                onChange={(e) => {
                  register('query').onChange(e);
                  const currentSelectedKey = activeTab === 'user' ? selectedItem?.email : selectedItem?.name;
                  if (selectedItem && currentSelectedKey !== e.target.value) {
                    setSelectedItem(null);
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setSearchDropdownOpen(true);
                }}
                placeholder={activeTab === 'user' ? "Nhập email hoặc tên của thành viên..." : "Nhập tên nhóm..."}
                className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:outline-none focus:bg-card focus:ring-4 transition-all font-medium text-sm text-foreground animate-in ${errors.query ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50' : 'border-border focus:border-blue-500 focus:ring-blue-500/10 bg-background'}`}
                disabled={isSending || success}
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {errors.query && (
              <p className="text-rose-500 text-xs mt-2 font-medium flex items-center gap-1">
                <Icons.alertCircle size={12} />
                {errors.query.message}
              </p>
            )}

            {/* Selected Item Badge */}
            {selectedItem && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50/50 border border-blue-100 rounded-xl animate-in zoom-in-95">
                <img  
                  src={selectedItem.avatar || defaultMan} 
                  alt={selectedItem.fullName || selectedItem.name} 
                  className="w-7 h-7 rounded-full object-cover border border-blue-200" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{selectedItem.fullName || selectedItem.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{selectedItem.email || `${selectedItem.members?.length || 0} thành viên`}</div>
                </div>
              </div>
            )}

            {/* Dropdown Results */}
            {searchDropdownOpen && queryValue.trim() !== '' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSearchDropdownOpen(false)} />
                <div className="absolute left-0 right-0 z-20 mt-2 bg-card border border-border rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="p-1">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectItem(item)}
                          className="w-full flex items-center gap-3 p-2.5 hover:bg-background rounded-lg transition-colors text-left"
                        >
                          <img  
                            src={item.avatar || defaultMan} 
                            alt={item.fullName || item.name} 
                            className="w-8 h-8 rounded-full object-cover bg-muted" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-foreground truncate">{item.fullName || item.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{item.email || `${item.members?.length || 0} thành viên`}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="p-4 text-center text-xs text-muted-foreground font-bold">
                        Không tìm thấy {activeTab === 'user' ? 'người dùng' : 'nhóm'} nào phù hợp.
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
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-background rounded-xl transition-colors"
              disabled={isSending || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || success || !selectedItem}
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
                  <span>{activeTab === 'user' ? 'Invited!' : 'Added!'}</span>
                </>
              ) : (
                <span>{activeTab === 'user' ? 'Send Invite' : 'Add Team'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
