import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Icons } from '../../assets/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories } from '../../store/slices/categorySlice';
import { createProject } from '../../store/slices/projectSlice';
import { authService } from '../../services/auth.service';
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

const ALL_PERMISSIONS = [
  'PROJECT_VIEW', 'PROJECT_UPDATE', 'PROJECT_DELETE',
  'TASK_CREATE', 'TASK_VIEW', 'TASK_UPDATE', 'TASK_DELETE',
  'BOARD_UPDATE', 'MEMBER_INVITE', 'MEMBER_REMOVE', 'ROLE_MANAGE'
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

  const [members, setMembers] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [roles, setRoles] = useState<ProjectRole[]>([]);
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

  const addMember = async () => {
    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showAlert("Định dạng email không hợp lệ!", "Lỗi định dạng", "error");
      return;
    }

    if (members.includes(trimmedEmail)) {
      showAlert("Thành viên này đã được thêm vào danh sách mời!", "Trùng lặp", "warning");
      return;
    }

    if (currentUser?.email && trimmedEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      showAlert("Bạn không thể tự mời chính mình vào dự án!", "Cảnh báo", "warning");
      return;
    }

    setIsValidatingEmail(true);
    try {
      const res: any = await authService.checkEmail(trimmedEmail);
      const exists = res.data; 

      if (exists) {
        setMembers([...members, trimmedEmail]);
        setEmailInput('');
      } else {
        showAlert(`Người dùng với email ${trimmedEmail} không tồn tại trên hệ thống!`, "Không tìm thấy", "error");
      }
    } catch (error) {
      console.error('Error validating email:', error);
      showAlert("Không thể xác thực email. Vui lòng kiểm tra lại kết nối mạng!", "Lỗi hệ thống", "error");
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const removeMember = (email: string) => {
    setMembers(members.filter(m => m !== email));
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

  const removeRole = (idx: number) => {
    setRoles(roles.filter((_, i) => i !== idx));
  };

  const removeStatus = (idx: number) => {
    setStatuses(statuses.filter((_, i) => i !== idx));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.categoryId) {
      showAlert("Vui lòng chọn lĩnh vực dự án (Category) trước khi tiếp tục!", "Thiếu thông tin", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = {
        ...formData,
        members,
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
              <div className="grid grid-cols-2 gap-8">
                <InputGroup label="Project Name" value={formData.name} onChange={(val) => setFormData({ ...formData, name: val })} placeholder="e.g. Apollo Mission" />
                <InputGroup label="Project Key" value={formData.code} onChange={(val) => setFormData({ ...formData, code: val.toUpperCase() })} placeholder="APO" />
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <div className="relative group">
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className={`w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none 
                          focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all 
                          font-semibold appearance-none cursor-pointer pr-12
                        ${!formData.categoryId ? "text-slate-400" : "text-slate-800"}`}
                    >
                      <option value="" disabled>Select project category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors">
                      <Icons.chevronRight className="rotate-90" size={20} />
                    </div>
                  </div>
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
              <div className="flex gap-3 items-center w-full">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    disabled={isValidatingEmail}
                    className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Enter email address..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMember()}
                  />
                  {isValidatingEmail && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isValidatingEmail || !emailInput}
                  onClick={addMember}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all flex items-center gap-2"
                >
                  {isValidatingEmail ? 'Checking...' : 'Invite'}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invited Members ({members.length})</label>
                <div className="flex flex-wrap gap-2">
                  {members.map(email => (
                    <div key={email} className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold border border-blue-100 group animate-in zoom-in-95 duration-200">
                      <span>{email}</span>
                      <button onClick={() => removeMember(email)} className="text-blue-300 hover:text-blue-600 transition-colors">
                        <Icons.plus size={16} className="rotate-45" />
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
                {roles.map((role, idx) => (
                  <div key={idx} className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Icons.lockKeyhole size={20} />
                        </div>
                        <input
                          className="text-lg font-bold bg-transparent outline-none border-b border-transparent focus:border-blue-500 px-1"
                          value={role.name}
                          onChange={(e) => {
                            const newRoles = [...roles];
                            newRoles[idx].name = e.target.value;
                            setRoles(newRoles);
                          }}
                        />
                      </div>
                      <button 
                        onClick={() => removeRole(idx)}
                        className="text-rose-500 hover:text-rose-700 p-2 transition-colors"
                      >
                        <Icons.plus size={20} className="rotate-45" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {ALL_PERMISSIONS.map(perm => (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => togglePermission(idx, perm)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[0.65rem] font-black tracking-wider transition-all border ${role.permissions.includes(perm)
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                            }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${role.permissions.includes(perm) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          {perm.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setRoles([...roles, { name: 'New Role', permissions: [] }])}
                  className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all"
                >
                  <Icons.plus size={20} />
                  Add Custom Role
                </button>
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
                        className="flex-1 font-bold text-slate-700 bg-transparent outline-none"
                        value={status.label}
                        onChange={(e) => {
                          const newStatus = [...statuses];
                          newStatus[idx].label = e.target.value;
                          setStatuses(newStatus);
                        }}
                      />
                      <button 
                        onClick={() => removeStatus(idx)}
                        className="text-slate-300 group-hover:text-rose-500 transition-colors"
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Board Columns</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {boardColumns.map((column, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-slate-50/50 border border-slate-200 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <input 
                          className="font-bold text-slate-900 bg-transparent outline-none"
                          value={column.name}
                          onChange={(e) => {
                            const newCols = [...boardColumns];
                            newCols[idx].name = e.target.value;
                            setBoardColumns(newCols);
                          }}
                        />
                        <button 
                          onClick={() => setBoardColumns(boardColumns.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Icons.plus size={14} className="rotate-45" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {column.mappedStatusIds?.map((sid: string) => {
                          const s = statuses.find(st => st.statusId === sid);
                          return (
                            <span key={sid} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                              {s?.label || sid}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setBoardColumns([...boardColumns, { name: 'New Column', mappedStatusIds: [], position: boardColumns.length }])}
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

function InputGroup({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type="text"
        className="bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-800 placeholder:text-slate-300"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
