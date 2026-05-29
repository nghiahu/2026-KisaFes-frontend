import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Icons } from '../../assets/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories } from '../../store/slices/categorySlice';
import { createProject } from '../../store/slices/projectSlice';
import { userService } from '../../services/userService';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import type { Category } from '../../types/category.interface';

interface ProjectRole {
  name: string;
  permissions: string[];
}

interface ProjectStatus {
  statusId: string;
  label: string;
  category: 'TO_DO' | 'IN_PROGRESS' | 'DONE';
  color: string;
}

const PERMISSION_GROUPS = [
  {
    name: 'Dự án',
    permissions: [
      { id: 'PROJECT_VIEW', label: 'Xem dự án' },
      { id: 'PROJECT_UPDATE', label: 'Cập nhật dự án' },
      { id: 'PROJECT_CREATE', label: 'Tạo dự án' },
      { id: 'PROJECT_DELETE', label: 'Xóa dự án' },
      { id: 'PROJECT_ARCHIVE', label: 'Lưu trữ dự án' },
    ]
  },
  {
    name: 'Công việc',
    permissions: [
      { id: 'TASK_VIEW', label: 'Xem công việc' },
      { id: 'TASK_CREATE', label: 'Tạo công việc' },
      { id: 'TASK_UPDATE', label: 'Sửa công việc' },
      { id: 'TASK_DELETE', label: 'Xóa công việc' },
      { id: 'TASK_ASSIGN', label: 'Giao việc' },
      { id: 'TASK_CHANGE_STATUS', label: 'Đổi trạng thái' },
    ]
  },
  {
    name: 'Bảng (Board)',
    permissions: [
      { id: 'BOARD_VIEW', label: 'Xem bảng' },
      { id: 'BOARD_UPDATE', label: 'Cấu hình bảng' },
    ]
  },
  {
    name: 'Thành viên',
    permissions: [
      { id: 'MEMBER_INVITE', label: 'Mời thành viên' },
      { id: 'MEMBER_REMOVE', label: 'Xóa thành viên' },
      { id: 'MEMBER_UPDATE_ROLE', label: 'Đổi quyền thành viên' },
    ]
  },
  {
    name: 'Bình luận & Đính kèm',
    permissions: [
      { id: 'COMMENT_CREATE', label: 'Tạo bình luận' },
      { id: 'COMMENT_UPDATE', label: 'Sửa bình luận' },
      { id: 'COMMENT_DELETE', label: 'Xóa bình luận' },
      { id: 'ATTACHMENT_UPLOAD', label: 'Tải file' },
      { id: 'ATTACHMENT_DELETE', label: 'Xóa file' },
    ]
  },
  {
    name: 'Phân quyền',
    permissions: [
      { id: 'ROLE_MANAGE', label: 'Quản lý Role' },
      { id: 'PERMISSION_MANAGE', label: 'Quản lý Phân quyền' },
    ]
  }
];

export default function CreateProject() {
  const navigate = useNavigate();
  const currentUser = useSelector((state: any) => state.auth.user);
  const dispatch = useAppDispatch();
  const categories = useAppSelector(state => state.category.categories);

  const [activeTab, setActiveTab] = useState<'basic' | 'team' | 'roles' | 'workflow'>('basic');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    categoryId: '',
  });

  const [methodology, setMethodology] = useState<'SCRUM' | 'KANBAN'>('KANBAN');

  const [members, setMembers] = useState<any[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [roles, setRoles] = useState<ProjectRole[]>([]);
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [boardColumns, setBoardColumns] = useState<any[]>([]);

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const showAlert = (message: string, title = 'Cảnh báo', type: 'error' | 'warning' | 'info' = 'error') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Update defaults when category changes
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      if (selectedCategory) {
        setRoles(selectedCategory.defaultRoles.map(r => ({
          name: r.name,
          permissions: r.permissions
        })));
        setStatuses(selectedCategory.defaultStatuses.map(s => ({
          statusId: s.statusId,
          label: s.label,
          category: s.category,
          color: s.color
        })));
        setBoardColumns(selectedCategory.defaultBoardColumns);
      }
    }
  }, [formData.categoryId, categories]);

  // Debounced Search Users
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const keyword = emailInput.trim();
      if (!keyword) {
        setSearchResults([]);
        setSearchDropdownOpen(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const res: any = await userService.searchUsers(keyword);
        // axiosClient đã tự động return response.data (ResponseWrapper)
        // Nên danh sách user thực sự nằm ở res.data
        const fetchedUsers = res.data || [];
        
        // Filter out users already in members
        const filteredUsers = fetchedUsers.filter((u: any) => 
          !members.some(m => m.email === u.email)
        );
        setSearchResults(filteredUsers);
        setSearchDropdownOpen(true);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [emailInput, members, currentUser]);

  const addSelectedMember = (user: any) => {
    if (members.some(m => m.email === user.email)) {
      showAlert("Thành viên này đã được thêm vào danh sách mời!", "Trùng lặp", "warning");
      return;
    }
    if (currentUser?.email && user.email.toLowerCase() === currentUser.email.toLowerCase()) {
      showAlert("Bạn không thể tự mời chính mình vào dự án!", "Cảnh báo", "warning");
      return;
    }
    setMembers([...members, user]);
    setEmailInput('');
    setSearchDropdownOpen(false);
  };

  const removeMember = (email: string) => {
    setMembers(members.filter(m => m.email !== email));
  };

  const togglePermission = (roleIdx: number, perm: string) => {
    const newRoles = [...roles];
    const role = newRoles[roleIdx];
    if (role.permissions.includes(perm)) {
      role.permissions = role.permissions.filter(p => p !== perm);
    } else {
      role.permissions = [...role.permissions, perm];
    }
    setRoles(newRoles);
  };

  const toggleGroupPermissions = (roleIdx: number, groupPermissions: string[]) => {
    const newRoles = [...roles];
    const role = newRoles[roleIdx];
    const allIncluded = groupPermissions.every(p => role.permissions.includes(p));
    
    if (allIncluded) {
      role.permissions = role.permissions.filter(p => !groupPermissions.includes(p));
    } else {
      const newSet = new Set([...role.permissions, ...groupPermissions]);
      role.permissions = Array.from(newSet);
    }
    setRoles(newRoles);
  };

  const removeRole = (idx: number) => {
    setRoles(roles.filter((_, i) => i !== idx));
    if (activeRoleIndex === idx) {
      setActiveRoleIndex(Math.max(0, idx - 1));
    } else if (activeRoleIndex > idx) {
      setActiveRoleIndex(activeRoleIndex - 1);
    }
  };

  const removeStatus = (idx: number) => {
    setStatuses(statuses.filter((_, i) => i !== idx));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Project Name is required";
    if (!formData.code.trim()) newErrors.code = "Project Key is required";
    if (!formData.categoryId) newErrors.categoryId = "Project Category is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('basic');
      showAlert("Vui lòng điền đầy đủ các trường thông tin bắt buộc!", "Thiếu thông tin", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = {
        ...formData,
        methodology,
        members: members.map(m => m.email),
        roles,
        statuses,
        boardColumns
      };
      await dispatch(createProject(finalData)).unwrap();
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        navigate('/workspace/projects');
      }, 1500);

    } catch (error: any) {
      console.error('Failed to create project:', error);
      setIsSubmitting(false);
      
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to create project. Please try again.";
      showAlert(errorMessage, "Lỗi tạo dự án", "error");
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Loading & Success Overlays */}
      {(isSubmitting || showSuccess) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 border border-slate-100 animate-in zoom-in-95 duration-300">
            {isSubmitting ? (
              <>
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900">Creating Project</h3>
                  <p className="text-slate-500 font-medium mt-1">Initializing workspace and roles...</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                  <Icons.check size={40} strokeWidth={3} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900">Project Ready!</h3>
                  <p className="text-slate-500 font-medium mt-1">Taking you to your workspace...</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className={`flex flex-col gap-6 p-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 ${isSubmitting || showSuccess ? 'blur-sm' : ''}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/workspace/projects')}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group"
          >
            <Icons.chevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create project</h1>
            <p className="text-slate-500 font-medium text-sm">Design your professional workflow in seconds</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workspace/projects')}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white/50 transition-all"
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 hover:scale-[1.02]"
          >
            Save & Launch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Navigation Sidebar */}
        <aside className="flex flex-col gap-2">
          <NavItem active={activeTab === 'basic'} onClick={() => setActiveTab('basic')} icon={<Icons.layers size={18} />} label="General Information" />
          <NavItem active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={<Icons.users size={18} />} label="Team Members" />
          <NavItem active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} icon={<Icons.lockKeyhole size={18} />} label="Roles & Permissions" />
          <NavItem active={activeTab === 'workflow'} onClick={() => setActiveTab('workflow')} icon={<Icons.slidersHorizontal size={18} />} label="Workflow Setup" />
        </aside>

        {/* Main Content Area */}
        <main className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-blue-500/5 p-10 overflow-hidden min-h-[600px]">
          {activeTab === 'basic' && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader title="Project Details" description="Basic information about your project." />

              {/* Methodology Selector */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Methodology</label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Scrum Card */}
                  <button
                    type="button"
                    onClick={() => setMethodology('SCRUM')}
                    className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden ${
                      methodology === 'SCRUM'
                        ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-100'
                        : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/30'
                    }`}
                  >
                    <img
                      src="https://internship.rikkei.edu.vn/assets/scrum-illustration.svg"
                      alt="Scrum methodology"
                      className={`w-full h-32 object-contain transition-all duration-300 ${
                        methodology === 'SCRUM' ? 'scale-105' : 'opacity-70 group-hover:opacity-100'
                      }`}
                    />
                    <div className="text-center">
                      <h4 className={`font-black text-base transition-colors ${
                        methodology === 'SCRUM' ? 'text-violet-800' : 'text-slate-700'
                      }`}>Scrum</h4>
                      <p className={`text-[11px] font-semibold mt-0.5 transition-colors ${
                        methodology === 'SCRUM' ? 'text-violet-500' : 'text-slate-400'
                      }`}>Sprint-based delivery</p>
                    </div>
                    {methodology === 'SCRUM' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                        <span className="text-white text-[10px] font-black">✓</span>
                      </div>
                    )}
                  </button>

                  {/* Kanban Card */}
                  <button
                    type="button"
                    onClick={() => setMethodology('KANBAN')}
                    className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden ${
                      methodology === 'KANBAN'
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-100'
                        : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/30'
                    }`}
                  >
                    <img
                      src="https://internship.rikkei.edu.vn/assets/kaban-illistration.svg"
                      alt="Kanban methodology"
                      className={`w-full h-32 object-contain transition-all duration-300 ${
                        methodology === 'KANBAN' ? 'scale-105' : 'opacity-70 group-hover:opacity-100'
                      }`}
                    />
                    <div className="text-center">
                      <h4 className={`font-black text-base transition-colors ${
                        methodology === 'KANBAN' ? 'text-cyan-800' : 'text-slate-700'
                      }`}>Kanban</h4>
                      <p className={`text-[11px] font-semibold mt-0.5 transition-colors ${
                        methodology === 'KANBAN' ? 'text-cyan-500' : 'text-slate-400'
                      }`}>Continuous flow</p>
                    </div>
                    {methodology === 'KANBAN' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                        <span className="text-white text-[10px] font-black">✓</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-8">
                <InputGroup 
                  label="Project Name" 
                  value={formData.name} 
                  onChange={(val) => {
                    setFormData({ ...formData, name: val });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }} 
                  placeholder="e.g. Apollo Mission" 
                  error={errors.name}
                />
                <InputGroup 
                  label="Project Key" 
                  value={formData.code} 
                  onChange={(val) => {
                    setFormData({ ...formData, code: val.toUpperCase() });
                    if (errors.code) setErrors({ ...errors, code: '' });
                  }} 
                  placeholder="APO" 
                  error={errors.code}
                />
                <div className="flex flex-col gap-2">
                  <label className={`text-xs font-bold uppercase tracking-widest ml-1 ${errors.categoryId ? 'text-rose-500' : 'text-slate-400'}`}>Category</label>
                  <div className="relative group">
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        setFormData({ ...formData, categoryId: e.target.value });
                        if (errors.categoryId) setErrors({ ...errors, categoryId: '' });
                      }}
                      className={`w-full p-4 rounded-2xl outline-none focus:ring-2 transition-all font-semibold appearance-none cursor-pointer pr-12
                        ${errors.categoryId ? 'bg-rose-50/30 border border-rose-400 focus:ring-rose-500/10 focus:border-rose-500 text-slate-800' : 'bg-slate-50 border border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'}
                        ${!formData.categoryId && !errors.categoryId ? "text-slate-400" : "text-slate-800"}`}
                    >
                      <option value="" disabled>Select project category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Icons.chevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                  </div>
                  {errors.categoryId && <span className="text-xs font-bold text-rose-500 mt-1 ml-1 flex items-center gap-1"><Icons.alertCircle size={12} /> {errors.categoryId}</span>}
                  {categories.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-bold mt-1 ml-1 animate-pulse">
                      Fetching available categories...
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Description</label>
                <textarea
                  rows={4}
                  className="bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 resize-none"
                  placeholder="Describe your project goals..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader title="Invite Team" description="Add members by email and assign them to roles later." />
              <div className="flex flex-col gap-1 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Icons.search size={20} />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 pl-11 pr-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                    placeholder="Search users by name or email..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setSearchDropdownOpen(true);
                    }}
                    onBlur={() => {
                      // Timeout to allow click event on dropdown items
                      setTimeout(() => setSearchDropdownOpen(false), 200);
                    }}
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Search Dropdown */}
                  {searchDropdownOpen && emailInput.trim() !== '' && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-hidden">
                      {searchResults.length > 0 ? (
                        <div className="p-2">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Kết quả tìm kiếm</div>
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => addSelectedMember(user)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                            >
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                  {user.fullName?.charAt(0) || user.email?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-800">{user.fullName || "User"}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        !isSearching && (
                          <div className="p-6 text-center text-slate-500 text-sm font-medium">
                            Không tìm thấy người dùng nào phù hợp.
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invited Members ({members.length})</label>
                <div className="flex flex-col gap-2">
                  {members.map(member => (
                    <div key={member.email} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl shadow-sm group animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.fullName} className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {member.fullName?.charAt(0) || member.email?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800 text-[14px]">{member.fullName || "User"}</div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </div>
                      </div>
                      <button onClick={() => removeMember(member.email)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                        <Icons.trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-sm text-slate-400 italic">No members invited yet.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader title="Roles & Permissions" description="Define what each team member can do." />

              <div className="flex flex-col gap-6">
                {/* Horizontal Role Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 hide-scrollbar">
                  {roles.map((role, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveRoleIndex(idx)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        activeRoleIndex === idx 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <Icons.lockKeyhole size={16} />
                      {role.name || 'Unnamed Role'}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setRoles([...roles, { name: 'New Role', permissions: [] }]);
                      setActiveRoleIndex(roles.length);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all whitespace-nowrap bg-slate-50"
                  >
                    <Icons.plus size={16} />
                    Add Role
                  </button>
                </div>

                {/* Active Role Content */}
                {roles.length > 0 && activeRoleIndex >= 0 && activeRoleIndex < roles.length ? (
                  <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Icons.pencil size={20} />
                        </div>
                        <input
                          className="text-lg font-bold bg-transparent outline-none border-b border-transparent focus:border-blue-500 px-1"
                          value={roles[activeRoleIndex].name}
                          placeholder="Role Name"
                          onChange={(e) => {
                            const newRoles = [...roles];
                            newRoles[activeRoleIndex].name = e.target.value;
                            setRoles(newRoles);
                          }}
                        />
                      </div>
                      <button 
                        onClick={() => removeRole(activeRoleIndex)}
                        className="flex items-center gap-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                      >
                        <Icons.trash2 size={16} />
                        Xóa Role
                      </button>
                    </div>

                    <div className="space-y-6 mt-4">
                      {PERMISSION_GROUPS.map((group) => {
                        const groupPermIds = group.permissions.map(p => p.id);
                        const allIncluded = groupPermIds.every(p => roles[activeRoleIndex].permissions.includes(p));
                        const someIncluded = groupPermIds.some(p => roles[activeRoleIndex].permissions.includes(p));

                        return (
                          <div key={group.name} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                              <h4 className="font-bold text-sm text-slate-800">{group.name}</h4>
                              <button
                                type="button"
                                onClick={() => toggleGroupPermissions(activeRoleIndex, groupPermIds)}
                                className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                                  allIncluded ? 'bg-blue-100 text-blue-700' : 
                                  someIncluded ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {allIncluded ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                              {group.permissions.map((perm) => {
                                const isChecked = roles[activeRoleIndex].permissions.includes(perm.id);
                                return (
                                  <label key={perm.id} onClick={() => togglePermission(activeRoleIndex, perm.id)} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                      isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'
                                    }`}>
                                      {isChecked && <Icons.check size={12} className="text-white" />}
                                    </div>
                                    <span className={`text-xs select-none transition-colors ${isChecked ? 'text-slate-800 font-bold' : 'text-slate-600'}`}>
                                      {perm.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
                    <div className="w-12 h-12 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icons.lockKeyhole size={24} />
                    </div>
                    <h3 className="text-slate-700 font-bold">Chưa có Role nào</h3>
                    <p className="text-slate-500 text-sm mt-1">Hãy thêm role mới để cấu hình phân quyền cho dự án.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader title="Workflow Flow" description="Customize project statuses and column structure." />
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Statuses</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statuses.map((status, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm group">
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      <input
                        className="flex-1 min-w-0 font-bold text-slate-700 bg-transparent outline-none"
                        value={status.label}
                        onChange={(e) => {
                          const newStatus = [...statuses];
                          newStatus[idx] = { ...newStatus[idx], label: e.target.value };
                          setStatuses(newStatus);
                        }}
                      />
                      <button 
                        onClick={() => removeStatus(idx)}
                        className="text-slate-300 group-hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Icons.plus size={16} className="rotate-45" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setStatuses([...statuses, { statusId: crypto.randomUUID(), label: 'New Status', category: 'TO_DO', color: 'bg-slate-500' }])}
                    className="flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 p-4 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all"
                  >
                    <Icons.plus size={20} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unmapped Statuses (Drag to assign)</label>
                <div 
                  className="min-h-[60px] p-4 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-wrap gap-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const statusId = e.dataTransfer.getData('statusId');
                    if (!statusId) return;
                    const newCols = boardColumns.map(col => {
                      if (!col.mappedStatusIds?.includes(statusId)) return col;
                      const newMapped = col.mappedStatusIds.filter((id: string) => id !== statusId);
                      return {
                        ...col,
                        mappedStatusIds: newMapped,
                        defaultStatusId: col.defaultStatusId === statusId ? (newMapped[0] || '') : col.defaultStatusId
                      };
                    });
                    setBoardColumns(newCols);
                  }}
                >
                  {statuses.filter(s => !boardColumns.some(c => c.mappedStatusIds?.includes(s.statusId))).length === 0 && (
                    <span className="text-slate-400 text-sm font-semibold italic">All statuses are mapped</span>
                  )}
                  {statuses.filter(s => !boardColumns.some(c => c.mappedStatusIds?.includes(s.statusId))).map(st => (
                    <div
                      key={st.statusId}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('statusId', st.statusId)}
                      className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-xs font-bold text-slate-700 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-2"
                    >
                      <div className={`w-2 h-2 rounded-full ${st.color || 'bg-slate-500'}`} />
                      {st.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Board Columns</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {boardColumns.map((column, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-slate-50/50 border border-slate-200 p-4 rounded-2xl">
                      <div className="flex items-center justify-between gap-2">
                        <input 
                          className="flex-1 min-w-0 font-bold text-slate-900 bg-transparent outline-none"
                          value={column.name}
                          onChange={(e) => {
                            const newCols = [...boardColumns];
                            newCols[idx] = { ...newCols[idx], name: e.target.value };
                            setBoardColumns(newCols);
                          }}
                        />
                        <button 
                          onClick={() => setBoardColumns(boardColumns.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                        >
                          <Icons.plus size={14} className="rotate-45" />
                        </button>
                      </div>
                      <div 
                        className={`flex flex-col gap-2 mt-2 min-h-[60px] bg-white border border-dashed rounded-xl p-2 transition-colors ${(!column.mappedStatusIds || column.mappedStatusIds.length === 0) ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 hover:border-blue-400'}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const statusId = e.dataTransfer.getData('statusId');
                          if (!statusId) return;
                          
                          const newCols = boardColumns.map((c, i) => {
                            if (i === idx) {
                              if (c.mappedStatusIds?.includes(statusId)) return c;
                              const mapped = [...(c.mappedStatusIds || []), statusId];
                              return { ...c, mappedStatusIds: mapped, defaultStatusId: c.defaultStatusId || statusId };
                            } else {
                              if (!c.mappedStatusIds?.includes(statusId)) return c;
                              const mapped = c.mappedStatusIds.filter((id: string) => id !== statusId);
                              return { ...c, mappedStatusIds: mapped, defaultStatusId: c.defaultStatusId === statusId ? (mapped[0] || '') : c.defaultStatusId };
                            }
                          });
                          setBoardColumns(newCols);
                        }}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1 ${(!column.mappedStatusIds || column.mappedStatusIds.length === 0) ? 'text-rose-500' : 'text-slate-500'}`}>Mapped Statuses</span>
                        <div className="flex flex-wrap gap-1">
                          {column.mappedStatusIds?.map((sid: string) => {
                            const st = statuses.find(s => s.statusId === sid);
                            if (!st) return null;
                            return (
                              <div
                                key={st.statusId}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('statusId', st.statusId)}
                                className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[10px] font-bold cursor-grab active:cursor-grabbing flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${st.color || 'bg-slate-500'}`} />
                                {st.label}
                              </div>
                            );
                          })}
                          {(!column.mappedStatusIds || column.mappedStatusIds.length === 0) && (
                            <div className="flex items-center gap-1 text-rose-500 p-1">
                              <Icons.alertCircle size={12} />
                              <span className="text-[10px] italic font-bold">Please drag at least 1 status here</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setBoardColumns([...boardColumns, { name: 'New Column', mappedStatusIds: [], defaultStatusId: '', position: boardColumns.length }])}
                    className="flex items-center justify-center bg-white border border-dashed border-slate-300 p-4 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    <Icons.plus size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <Icons.helpCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Flow Strategy</h4>
                  <p className="text-sm text-blue-600 leading-relaxed mt-1">
                    Your statuses will automatically map to your Kanban board columns. You can refine column mapping later in Project Settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Custom Alert Modal */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-5 max-w-sm w-full mx-4 border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            {alertConfig.type === 'error' && (
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center animate-bounce">
                <XCircle size={32} />
              </div>
            )}
            {alertConfig.type === 'warning' && (
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle size={32} />
              </div>
            )}
            {alertConfig.type === 'info' && (
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Info size={32} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-black text-slate-900">{alertConfig.title}</h3>
              <p className="text-slate-500 font-semibold text-sm mt-2 leading-relaxed">{alertConfig.message}</p>
            </div>
            <button
              onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })}
              className={`w-full py-3.5 rounded-2xl font-bold transition-all text-white shadow-lg active:scale-95 ${
                alertConfig.type === 'error' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
                alertConfig.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' :
                'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-sm ${active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
        : 'bg-white/50 text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200'
        }`}
    >
      {icon}
      <span>{label}</span>
      {active && <Icons.chevronRight size={16} className="ml-auto" />}
    </button>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-6">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-500 font-medium">{description}</p>
    </div>
  );
}

function InputGroup({ label, value, onChange, placeholder, error }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className={`text-xs font-bold uppercase tracking-widest ml-1 ${error ? 'text-rose-500' : 'text-slate-400'}`}>{label}</label>
      <input
        type="text"
        className={`p-4 rounded-2xl outline-none focus:ring-2 transition-all font-semibold text-slate-800 placeholder:text-slate-300 ${error ? 'bg-rose-50/30 border border-rose-400 focus:ring-rose-500/10 focus:border-rose-500' : 'bg-slate-50 border border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="text-xs font-bold text-rose-500 ml-1 flex items-center gap-1"><Icons.alertCircle size={12} /> {error}</span>}
    </div>
  );
}
