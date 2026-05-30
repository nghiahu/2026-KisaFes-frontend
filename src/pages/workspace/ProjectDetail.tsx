import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icons } from '../../assets/icons';
import defaultMan from '../../assets/avatar_def_man.png';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useProject } from '../../hooks/api/useProjects';
import { useCategories } from '../../hooks/api/useCategories';
import { useProjectWebSocket } from '../../hooks/api/useProjectWebSocket';
import { projectService } from '../../services/project.service';
import categoryService from '../../services/category.service';


import ProjectOverview from './project-tabs/ProjectOverview';
import ProjectList from './project-tabs/ProjectList';
import ProjectBoard from './project-tabs/ProjectBoard';
import ProjectBacklog from './project-tabs/ProjectBacklog';
import ProjectSprint from './project-tabs/ProjectSprint';
import ProjectRoadmap from './project-tabs/ProjectRoadmap';

import ProjectIssues from './project-tabs/ProjectIssues';
import ProjectMembers from './project-tabs/ProjectMembers';
import ProjectSettings from './project-tabs/ProjectSettings';
import InviteMemberModal from '../../components/workspace/InviteMemberModal';
import { Skeleton } from '../../components/ui/Skeleton';

type TabType = 'overview' | 'list' | 'board' | 'members' | 'forms' | 'backlog' | 'sprint' | 'roadmap' | 'issues' | 'settings';

const editProjectSchema = z.object({
  name: z.string().min(1, 'Tên dự án không được để trống'),
  categoryId: z.string().min(1, 'Category không được để trống'),
  description: z.string().optional()
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();

  const { data: backendProject, isLoading: isProjectLoading, refetch: refetchProject } = useProject(projectId);

  const [currentProject, setCurrentProject] = useState<any>(null);
  const loading = isProjectLoading || isCategoriesLoading;
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const { register: registerEdit, handleSubmit: handleEditSubmitWrapper, reset: resetEditForm, formState: { errors: editErrors } } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: { name: '', description: '', categoryId: '' }
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const { user } = useAppSelector(state => state.auth);

  const hasProjectUpdatePermission = () => {
    if (!currentProject || !user) return false;
    if (currentProject.ownerId === user.id) return true;
    const memberObj = currentProject.members?.find((m: any) => m.id === user.id);
    if (!memberObj) return false;
    const roleObj = currentProject.customRoles?.find((r: any) => r.id === memberObj.roleId);
    return roleObj?.permissions?.includes('PROJECT_UPDATE') ?? false;
  };

  const handleStartEditName = () => {
    if (!hasProjectUpdatePermission()) {
      import('../../utils/permission-denied-event').then(({ permissionDeniedEvent }) => {
        permissionDeniedEvent.emit('Bạn không có quyền chỉnh sửa tên dự án này.');
      });
      return;
    }
    setEditingName(currentProject.name);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 50);
  };

  const handleSaveName = async () => {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === currentProject.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await projectService.updateProjectName(currentProject.id, trimmed);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    } catch {
      // axiosClient interceptor shows permission-denied toast for 403
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveName(); }
    if (e.key === 'Escape') { setIsEditingName(false); }
  };

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const onEditSubmit = async (data: EditProjectFormValues) => {
    try {
      setIsUpdating(true);
      await projectService.updateProjectInfo(currentProject.id, data as any);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsEditingInfo(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update project info');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    if (deleteInput !== `delete ${currentProject.code}`) {
      alert(`Vui lòng nhập đúng "delete ${currentProject.code}" để xác nhận.`);
      return;
    }
    // Perform deletion
    // TODO: Call API to delete project here
    navigate('/workspace/projects');
  };

  useEffect(() => {
    if (!projectId) return;

    const savedTab = localStorage.getItem(`project_tab_${projectId}`);
    setActiveTab((savedTab as TabType) || 'list');
  }, [projectId]);

  useEffect(() => {
    if (!currentProject) return;

    if (currentProject.methodology === 'SCRUM' && activeTab === 'board') {
      setActiveTab('sprint');
      if (projectId) localStorage.setItem(`project_tab_${projectId}`, 'sprint');
    } else if (currentProject.methodology === 'KANBAN' && (activeTab === 'sprint' || activeTab === 'backlog')) {
      setActiveTab('board');
      if (projectId) localStorage.setItem(`project_tab_${projectId}`, 'board');
    }
  }, [currentProject?.methodology, activeTab, projectId, currentProject]);

  // Handle WebSockets for this project
  useProjectWebSocket(projectId);



  useEffect(() => {
    if (backendProject && backendProject.id === projectId) {
      const catName = categories.find((c: any) => c.id === backendProject.categoryId)?.name || 'General';
      const completedCount = backendProject.completedTasksCount ?? 0;
      const totalCount = backendProject.totalTasksCount ?? 0;
      const progressValue = backendProject.totalTasksCount > 0 ? Math.round((backendProject.completedTasksCount / backendProject.totalTasksCount) * 100) : 0;

      setCurrentProject({
        id: backendProject.id,
        name: backendProject.name,
        code: backendProject.code || backendProject.name?.substring(0, 2).toUpperCase() || 'PR',
        category: catName,
        status: 'ACTIVE',
        methodology: (backendProject.methodology as 'SCRUM' | 'KANBAN') || 'KANBAN',
        progress: progressValue,
        lead: backendProject.members?.[0] ? {
          name: backendProject.members[0].name,
          avatar: backendProject.members[0].avatar || defaultMan
        } : { name: 'Unassigned', avatar: defaultMan },
        membersCount: backendProject.members?.length || 1,
        dueDate: backendProject.deadlineDisplay || 'Not set',
        description: backendProject.description || 'No description provided.',
        tasksCount: totalCount,
        completedTasksCount: completedCount,
        members: backendProject.members || [],
        statuses: backendProject.statuses || [],
        boardColumns: backendProject.boardColumns || [],
        customRoles: backendProject.customRoles || [],
        ownerId: backendProject.ownerId
      });
    } else if (!isProjectLoading && !backendProject) {
      setCurrentProject(null);
    }
  }, [backendProject, categories, projectId, isProjectLoading]);

  const isScrum = currentProject?.methodology === 'SCRUM';

  // Base tabs (common for both Scrum and Kanban)
  const baseTabs = [
    { id: 'overview' as TabType, label: 'Summary', icon: Icons.fileText },
    { id: 'list' as TabType, label: 'List', icon: Icons.listTodo },
    { id: 'board' as TabType, label: 'Board', icon: Icons.layoutDashboard },
    { id: 'members' as TabType, label: 'Members', icon: Icons.users },
    { id: 'forms' as TabType, label: 'Forms', icon: Icons.clipboardList },
    { id: 'settings' as TabType, label: 'Settings', icon: Icons.settings },
  ];

  const scrumOnlyTabs = [
    { id: 'backlog' as TabType, label: 'Backlog', icon: Icons.layers },
    { id: 'sprint' as TabType, label: 'Active Sprint', icon: Icons.zap },
  ];

  const tabs = isScrum
    ? [
      baseTabs[0], // Summary
      baseTabs[1], // List
      scrumOnlyTabs[0], // Backlog
      scrumOnlyTabs[1], // Sprint Board
      baseTabs[3], // Members
      baseTabs[5], // Settings
    ]
    : baseTabs;

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-88px)] bg-slate-50/30">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center gap-2 px-6 pt-5 shrink-0">
          <Skeleton className="h-3 w-14 bg-slate-200" />
          <Skeleton className="h-3 w-3 bg-slate-100 rounded-full" />
          <Skeleton className="h-3 w-28 bg-slate-200" />
        </div>

        {/* Title row skeleton */}
        <div className="flex items-center gap-3 px-6 pt-4 pb-2 shrink-0">
          <Skeleton className="w-8 h-8 rounded-lg bg-blue-100" />
          <Skeleton className="h-7 w-48 bg-slate-200" />
          <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex items-center gap-1 px-6 pt-2 pb-0 border-b border-slate-200 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-t-md bg-slate-200 mx-0.5" />
          ))}
        </div>

        {/* Content area is left empty so individual tabs can show their own specific skeletons */}
        <div className="flex-1" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
        <Icons.alertCircle className="text-rose-500" size={48} />
        <span className="text-base font-bold text-slate-700">Không tìm thấy dự án</span>
        <button
          onClick={() => navigate('/workspace/projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded-[10px] text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          Quay lại danh sách dự án
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] bg-slate-50/30 animate-in fade-in duration-300">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex items-center gap-1.5 px-6 pt-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
        <button
          onClick={() => navigate('/workspace/projects')}
          className="hover:text-blue-600 transition-colors"
        >
          Project
        </button>
        <Icons.chevronRight size={10} className="text-slate-300" />
        <span className="text-slate-700">{currentProject.name}</span>
      </div>

      {/* Project Title Row */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md shadow-blue-500/10">
            {currentProject.code?.substring(0, 2).toUpperCase() || 'K'}
          </div>
          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleNameKeyDown}
              disabled={isSavingName}
              autoFocus
              className="text-2xl font-black text-slate-800 tracking-tight bg-transparent border-b-2 border-blue-500 outline-none px-0 min-w-[120px] max-w-[400px] w-auto"
              style={{ width: `${Math.max(editingName.length, 10)}ch` }}
            />
          ) : (
            <h1
              className="text-2xl font-black text-slate-800 tracking-tight cursor-pointer hover:text-blue-600 transition-colors group flex items-center gap-1.5"
              onClick={handleStartEditName}
              title="Nhấn để đổi tên dự án"
            >
              {currentProject.name}
              <Icons.pencil size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
            </h1>
          )}
          {/* Methodology badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest border ${currentProject.methodology === 'SCRUM'
            ? 'bg-violet-50 text-violet-600 border-violet-200'
            : 'bg-cyan-50 text-cyan-600 border-cyan-200'
            }`}>
            {currentProject.methodology === 'SCRUM'
              ? <><Icons.zap size={12} className="text-violet-500" /> SCRUM</>
              : <><Icons.kanbanSquare size={12} className="text-teal-500" /> KANBAN</>}
          </span>
          <button
            onClick={() => setShowInviteModal(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="Invite to project"
          >
            <Icons.userPlus size={15} />
          </button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
              <Icons.moreHorizontal size={15} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button onClick={() => { setIsFavorite(!isFavorite); setShowDropdown(false); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                  <Icons.star size={13} className={isFavorite ? 'text-amber-400' : 'text-slate-400'} fill={isFavorite ? 'currentColor' : 'none'} />
                  <span>{isFavorite ? 'Remove from starred' : 'Add to starred'}</span>
                </button>
                <button onClick={() => { 
                    setShowDropdown(false); 
                    resetEditForm({ name: currentProject.name, description: currentProject.description || '', categoryId: categories.find((c: any) => c.name === currentProject.category)?.id || '' }); 
                    setIsEditingInfo(true); 
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                  <Icons.settings size={13} className="text-slate-400" />
                  <span>Edit project</span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => { setShowDropdown(false); setIsDeleting(true); setDeleteInput(''); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                  <Icons.alertCircle size={13} className="text-rose-500" />
                  <span>Delete project</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Icons.share2 size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Icons.zap size={16} />
          </button>
          <button
            onClick={() => setIsFavorite(prev => !prev)}
            className={`p-1.5 rounded-lg transition-colors hover:bg-slate-100 ${isFavorite ? 'text-amber-400' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Icons.star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Icons.maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Segmented Context Tabs */}
      <div className="flex border-b border-slate-200/80 overflow-x-auto scrollbar-none px-6 py-2 bg-transparent gap-4 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (projectId) localStorage.setItem(`project_tab_${projectId}`, tab.id);
              }}
              className={`flex items-center gap-1.5 px-1 py-2.5 border-b-2 font-bold text-xs transition-all duration-200 whitespace-nowrap -mb-[2px] ${isActiveTab
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
            >
              <Icon size={14} className={isActiveTab ? 'text-slate-800' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tabs Content Viewport */}
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {activeTab === 'overview' && <ProjectOverview currentProject={currentProject} setActiveTab={(t) => {
          setActiveTab(t);
          if (projectId) localStorage.setItem(`project_tab_${projectId}`, t);
        }} />}
        {activeTab === 'list' && <ProjectList projectId={projectId!} currentProject={currentProject} />}
        {activeTab === 'board' && <ProjectBoard currentProject={currentProject} />}
        {activeTab === 'backlog' && <ProjectBacklog projectId={projectId!} currentProject={currentProject} />}
        {activeTab === 'sprint' && <ProjectSprint projectId={projectId!} currentProject={currentProject} />}

        {activeTab === 'roadmap' && <ProjectRoadmap />}
        {activeTab === 'issues' && <ProjectIssues />}
        {activeTab === 'members' && (
          <ProjectMembers
            currentProject={currentProject}
            onUpdate={() => refetchProject()}
          />
        )}
        {activeTab === 'settings' && (
          <ProjectSettings
            currentProject={currentProject}
            onUpdate={() => refetchProject()}
          />
        )}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          projectName={currentProject.name}
          projectId={currentProject.id}
        />
      )}

      {/* Edit Project Modal */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Project</h3>
            <form onSubmit={handleEditSubmitWrapper(onEditSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Project Name</label>
                <input type="text" className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrors.name ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                  {...registerEdit('name')} />
                {editErrors.name && <p className="text-rose-500 text-xs font-medium">{editErrors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrors.categoryId ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                  {...registerEdit('categoryId')}>
                  <option value="" disabled>Select category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {editErrors.categoryId && <p className="text-rose-500 text-xs font-medium">{editErrors.categoryId.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" rows={3}
                  {...registerEdit('description')} />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsEditingInfo(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <Icons.alertCircle size={24} />
              <h3 className="text-xl font-bold text-slate-900">Delete Project</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Bạn sắp xóa dự án <strong>{currentProject.name}</strong>. Hành động này không thể hoàn tác. Để xác nhận, vui lòng nhập <code className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 font-bold">delete {currentProject.code}</code> vào ô bên dưới.
            </p>
            <form onSubmit={handleDeleteSubmit} className="flex flex-col gap-4">
              <input required type="text" className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                placeholder={`delete ${currentProject.code}`} value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
              <div className="flex items-center justify-end gap-3 mt-2">
                <button type="button" onClick={() => { setIsDeleting(false); setDeleteInput(''); }} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={deleteInput !== `delete ${currentProject.code}`} className="px-4 py-2 text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors">
                  Confirm Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
