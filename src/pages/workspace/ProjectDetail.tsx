import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icons } from '../../assets/icons';
import defaultMan from '../../assets/avatar_def_man.png';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useProject } from '../../hooks/api/useProjects';
import { useCategories } from '../../hooks/api/useCategories';
import { useProjectWebSocket } from '../../hooks/api/useProjectWebSocket';
import { projectService } from '../../services/project.service';
import categoryService from '../../services/category.service';
import { useLanguage } from '../../contexts/LanguageContext';


import ProjectOverview from './project-tabs/ProjectOverview';
import ProjectList from './project-tabs/ProjectList';
import ProjectBoard from './project-tabs/ProjectBoard';
import ProjectBacklog from './project-tabs/ProjectBacklog';
import ProjectSprint from './project-tabs/ProjectSprint';
import ProjectCalendar from './project-tabs/ProjectCalendar';
import ProjectMembers from './project-tabs/ProjectMembers';
import ProjectSettings from './project-tabs/ProjectSettings';
import InviteMemberModal from '../../components/workspace/InviteMemberModal';
import { Skeleton } from '../../components/ui/Skeleton';

type TabType = 'overview' | 'list' | 'board' | 'calendar' | 'members' | 'forms' | 'backlog' | 'sprint' | 'settings';

const editProjectSchema = z.object({
  name: z.string().min(1, 'TĂªn dá»± Ă¡n khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  categoryId: z.string().min(1, 'Category khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
  description: z.string().optional()
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const initializedProjectId = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();

  const { data: backendProject, isLoading: isProjectLoading, refetch: refetchProject } = useProject(projectId);

  const [currentProject, setCurrentProject] = useState<any>(null);
  const loading = isProjectLoading || isCategoriesLoading;
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
        permissionDeniedEvent.emit(t('project_detail.no_permission_rename'));
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
      alert(t('project_detail.confirm_delete_type').replace('{code}', currentProject.code));
      return;
    }
    // Perform deletion
    // TODO: Call API to delete project here
    navigate('/workspace/projects');
  };

  useEffect(() => {
    if (!projectId) return;

    if (location.state?.tab) {
      setActiveTab(location.state.tab as TabType);
      localStorage.setItem(`project_tab_${projectId}`, location.state.tab as string);
      initializedProjectId.current = projectId;
    } else {
      if (initializedProjectId.current !== projectId) {
        const savedTab = localStorage.getItem(`project_tab_${projectId}`);
        setActiveTab((savedTab as TabType) || 'list');
        initializedProjectId.current = projectId;
      }
    }
  }, [projectId, location.state?.tab]);

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

  const baseTabs = [
    { id: 'overview' as TabType, label: t('project_detail.tab_summary'), icon: Icons.fileText },
    { id: 'list' as TabType, label: t('project_detail.tab_list'), icon: Icons.listTodo },
    { id: 'board' as TabType, label: t('project_detail.tab_board'), icon: Icons.layoutDashboard },
    { id: 'calendar' as TabType, label: t('project_detail.tab_calendar'), icon: Icons.calendar },
    { id: 'members' as TabType, label: t('project_detail.tab_members'), icon: Icons.users },
    { id: 'settings' as TabType, label: t('project_detail.tab_settings'), icon: Icons.settings, bottom: true }
  ];

  const scrumOnlyTabs = [
    { id: 'backlog' as TabType, label: t('project_detail.tab_backlog'), icon: Icons.layers },
    { id: 'sprint' as TabType, label: t('project_detail.tab_sprint'), icon: Icons.zap },
  ];

  const tabs = isScrum
    ? [
      baseTabs[0], // Summary
      baseTabs[1], // List
      scrumOnlyTabs[0], // Backlog
      scrumOnlyTabs[1], // Sprint Board
      baseTabs[3], // Calendar
      baseTabs[4], // Members
      baseTabs[5], // Settings
    ]
    : baseTabs;

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-88px)] bg-background/30">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center gap-2 px-6 pt-5 shrink-0">
          <Skeleton className="h-3 w-14 bg-slate-200" />
          <Skeleton className="h-3 w-3 bg-muted rounded-full" />
          <Skeleton className="h-3 w-28 bg-slate-200" />
        </div>
        {/* Title row skeleton */}
        <div className="flex items-center gap-3 px-6 pt-4 pb-2 shrink-0">
          <Skeleton className="w-8 h-8 rounded-lg bg-blue-100" />
          <Skeleton className="h-7 w-48 bg-slate-200" />
          <Skeleton className="h-5 w-16 rounded-full bg-muted" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex items-center gap-1 px-6 pt-2 pb-0 border-b border-border shrink-0">
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
        <span className="text-base font-bold text-foreground">{t('project_detail.no_project')}</span>
        <button
          onClick={() => navigate('/workspace/projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded-[10px] text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          {t('project_detail.back_to_list')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] bg-background/30 animate-in fade-in duration-300">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex items-center gap-1.5 px-6 pt-5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
        <button
          onClick={() => navigate('/workspace/projects')}
          className="hover:text-blue-600 transition-colors"
        >
          {t('project_detail.project')}
        </button>
        <Icons.chevronRight size={10} className="text-slate-300" />
        <span className="text-foreground">{currentProject.name}</span>
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
              className="text-2xl font-black text-foreground tracking-tight bg-transparent border-b-2 border-blue-500 outline-none px-0 min-w-[120px] max-w-[400px] w-auto"
              style={{ width: `${Math.max(editingName.length, 10)}ch` }}
            />
          ) : (
            <h1
              className="text-2xl font-black text-foreground tracking-tight cursor-pointer hover:text-blue-600 transition-colors group flex items-center gap-1.5"
              onClick={handleStartEditName}
              title={t('project_detail.rename_tooltip')}
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
            className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
            title={t('project_detail.invite_tooltip')}
          >
            <Icons.userPlus size={15} />
          </button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors shrink-0"
            >
              <Icons.moreHorizontal size={15} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-card rounded-xl shadow-xl border border-border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button onClick={() => { setIsFavorite(!isFavorite); setShowDropdown(false); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-background flex items-center gap-2.5 transition-colors">
                  <Icons.star size={13} className={isFavorite ? 'text-amber-400' : 'text-muted-foreground'} fill={isFavorite ? 'currentColor' : 'none'} />
                  <span>{isFavorite ? t('projects.remove_starred') : t('projects.add_starred')}</span>
                </button>
                <button onClick={() => { 
                    setShowDropdown(false); 
                    resetEditForm({ name: currentProject.name, description: currentProject.description || '', categoryId: categories.find((c: any) => c.name === currentProject.category)?.id || '' }); 
                    setIsEditingInfo(true); 
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-background flex items-center gap-2.5 transition-colors">
                  <Icons.settings size={13} className="text-muted-foreground" />
                  <span>{t('projects.edit_project')}</span>
                </button>
                <div className="h-px bg-muted my-1" />
                <button onClick={() => { setShowDropdown(false); setIsDeleting(true); setDeleteInput(''); }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                  <Icons.alertCircle size={13} className="text-rose-500" />
                  <span>{t('projects.delete_project')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <Icons.share2 size={16} />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <Icons.zap size={16} />
          </button>
          <button
            onClick={() => setIsFavorite(prev => !prev)}
            className={`p-1.5 rounded-lg transition-colors hover:bg-muted ${isFavorite ? 'text-amber-400' : 'text-muted-foreground hover:text-muted-foreground'}`}
          >
            <Icons.star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <Icons.maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Segmented Context Tabs */}
      <div className="flex border-b border-border/80 overflow-x-auto scrollbar-none px-6 py-2 bg-transparent gap-4 shrink-0">
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
                ? 'border-slate-800 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300'
                }`}
            >
              <Icon size={14} className={isActiveTab ? 'text-foreground' : 'text-muted-foreground'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tabs Content Viewport */}
      <div className="flex-1 flex flex-col min-h-0 bg-card">
        {activeTab === 'overview' && <ProjectOverview currentProject={currentProject} setActiveTab={(t) => {
          setActiveTab(t);
          if (projectId) localStorage.setItem(`project_tab_${projectId}`, t);
        }} />}
        {activeTab === 'list' && <ProjectList projectId={projectId!} currentProject={currentProject} />}
        {activeTab === 'calendar' && (
          <div className="flex-1 flex flex-col min-h-0">
            <ProjectCalendar currentProject={currentProject} projectId={projectId!} />
          </div>
        )}
        {activeTab === 'board' && <ProjectBoard currentProject={currentProject} />}
        {activeTab === 'backlog' && <ProjectBacklog projectId={projectId!} currentProject={currentProject} />}
        {activeTab === 'sprint' && <ProjectSprint projectId={projectId!} currentProject={currentProject} />}


        {activeTab === 'members' && (
          <ProjectMembers
            currentProject={currentProject}
            onUpdate={() => refetchProject()}
            onOpenInviteModal={() => setShowInviteModal(true)}
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
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-4">{t('projects.edit_project')}</h3>
            <form onSubmit={handleEditSubmitWrapper(onEditSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">{t('projects.project_name')}</label>
                <input type="text" className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrors.name ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-border focus:ring-blue-500/20 focus:border-blue-500'}`}
                  {...registerEdit('name')} />
                {editErrors.name && <p className="text-rose-500 text-xs font-medium">{editErrors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">{t('projects.category')}</label>
                <select className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrors.categoryId ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-border focus:ring-blue-500/20 focus:border-blue-500'}`}
                  {...registerEdit('categoryId')}>
                  <option value="" disabled>{t('projects.select_category')}</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {editErrors.categoryId && <p className="text-rose-500 text-xs font-medium">{editErrors.categoryId.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">{t('projects.description')}</label>
                <textarea className="border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" rows={3}
                  {...registerEdit('description')} />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsEditingInfo(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">{t('common.cancel')}</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {isUpdating ? t('projects.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 border border-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <Icons.alertCircle size={24} />
              <h3 className="text-xl font-bold text-foreground">{t('projects.delete_project')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6" dangerouslySetInnerHTML={{
              __html: t('projects.delete_confirm_desc')
                .replace('{projectName}', currentProject.name)
                .replace('{projectCode}', currentProject.code)
            }}>
            </p>
            <form onSubmit={handleDeleteSubmit} className="flex flex-col gap-4">
              <input required type="text" className="border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                placeholder={`delete ${currentProject.code}`} value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
              <div className="flex items-center justify-end gap-3 mt-2">
                <button type="button" onClick={() => { setIsDeleting(false); setDeleteInput(''); }} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">{t('common.cancel')}</button>
                <button type="submit" disabled={deleteInput !== `delete ${currentProject.code}`} className="px-4 py-2 text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors">
                  {t('projects.confirm_delete')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
