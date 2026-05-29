import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../../assets/icons';
import defaultMan from '../../assets/avatar_def_man.png';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProjectById } from '../../store/slices/projectSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { socketService } from '../../services/socketService';
import { wsUpdateTask, wsCreateTask, wsDeleteTask } from '../../store/slices/taskSlice';
import { projectService } from '../../services/project.service';


import ProjectOverview from './project-tabs/ProjectOverview';
import ProjectList from './project-tabs/ProjectList';
import ProjectBoard from './project-tabs/ProjectBoard';
import ProjectBacklog from './project-tabs/ProjectBacklog';
import ProjectSprint from './project-tabs/ProjectSprint';
import ProjectRoadmap from './project-tabs/ProjectRoadmap';

import ProjectIssues from './project-tabs/ProjectIssues';
import ProjectMembers from './project-tabs/ProjectMembers';
import ProjectSettings from './project-tabs/ProjectSettings';
import ProjectCalendar from './project-tabs/ProjectCalendar';
import InviteMemberModal from '../../components/workspace/InviteMemberModal';
import { Skeleton } from '../../components/ui/skeleton';

type TabType = 'overview' | 'list' | 'board' | 'calendar' | 'members' | 'forms' | 'backlog' | 'sprint' | 'roadmap' | 'issues' | 'settings';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { currentProject: backendProject, loading: isProjectLoading } = useAppSelector(state => state.project);
  const { categories, loading: isCategoriesLoading } = useAppSelector(state => state.category);
  const { tasks: backendTasks, loading: isTasksLoading } = useAppSelector(state => state.task);

  const [currentProject, setCurrentProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [isFavorite, setIsFavorite] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
      import('../../utils/permissionDeniedEvent').then(({ permissionDeniedEvent }) => {
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
      // WebSocket will broadcast UPDATE_PROJECT – fetchProjectById will re-run
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
    if (!projectId) return;
    dispatch(fetchCategories());
    dispatch(fetchProjectById(projectId));
    
    const savedTab = localStorage.getItem(`project_tab_${projectId}`);
    setActiveTab((savedTab as TabType) || 'list');
  }, [projectId, dispatch]);

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

  useEffect(() => {
    if (!projectId) return;

    socketService.connect(() => {
      const sub = socketService.subscribe(`/topic/project/${projectId}`, (event: any) => {
        console.log("WebSocket event received:", event);
        if (event && event.type) {
          switch (event.type) {
            case "CREATE_TASK":
              dispatch(wsCreateTask(event.data));
              break;
            case "UPDATE_TASK":
              dispatch(wsUpdateTask(event.data));
              break;
            case "TASK_MOVED":
              dispatch(wsUpdateTask(event.data));
              break;
            case "TASK_REORDERED":
              dispatch(wsUpdateTask(event.data));
              break;
            case "UPDATE_PROJECT":
              dispatch(fetchProjectById(projectId));
              break;
            case "DELETE_TASK":
              dispatch(wsDeleteTask(event.data));
              break;
            case "SPRINT_CREATED":
            case "SPRINT_UPDATED":
            case "SPRINT_STARTED":
            case "SPRINT_COMPLETED":
            case "SPRINT_DELETED":
              // Sprint changes are handled by the individual tab components via their own reload
              break;
            default:
              break;
          }
        }
      });

      return () => {
        if (sub) sub.unsubscribe();
      };
    });

    return () => {
      socketService.disconnect();
    };
  }, [projectId, dispatch]);

  useEffect(() => {
    setLoading(isProjectLoading || isCategoriesLoading);
  }, [isProjectLoading, isCategoriesLoading]);

  useEffect(() => {
    if (backendProject) {
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
    } else {
      setCurrentProject(null);
    }

    if (backendTasks && backendTasks.length > 0) {
      setTasks(backendTasks.map((t: any) => ({
        ...t,
        id: t.taskKey,
        dbId: t.id,
        title: t.title,
        status: t.statusLabel || 'To Do',
        statusId: t.statusId,
        priority: t.priority || 'Medium',
        assignee: t.assigneeName || 'Unassigned',
        reporter: t.reporterName || 'nghĩa Ngô',
        type: t.type || 'task'
      })));
    } else {
      setTasks([]);
    }
  }, [backendProject, backendTasks, categories]);

  const isScrum = currentProject?.methodology === 'SCRUM';

  // Base tabs (common for both Scrum and Kanban)
  const baseTabs = [
    { id: 'overview' as TabType, label: 'Summary', icon: Icons.fileText },
    { id: 'list' as TabType, label: 'List', icon: Icons.listTodo },
    { id: 'board' as TabType, label: 'Board', icon: Icons.kanbanSquare },
    { id: 'calendar' as TabType, label: 'Calendar', icon: Icons.calendar },
    { id: 'members' as TabType, label: 'Members', icon: Icons.users },
    { id: 'forms' as TabType, label: 'Forms', icon: Icons.clipboardList },
    { id: 'settings' as TabType, label: 'Settings', icon: Icons.settings },
  ];

  // Scrum-specific tabs
  const scrumOnlyTabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'backlog', label: 'Backlog', icon: Icons.listTodo },
    { id: 'sprint', label: 'Sprint Board', icon: Icons.zap },
  ];

  const tabs = isScrum
    ? [
      baseTabs[0], // Summary
      baseTabs[1], // List
      scrumOnlyTabs[0], // Backlog
      scrumOnlyTabs[1], // Sprint Board
      baseTabs[3], // Calendar
      baseTabs[4], // Members
      baseTabs[6], // Settings
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
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
            <Icons.moreHorizontal size={15} />
          </button>
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
        {activeTab === 'overview' && <ProjectOverview currentProject={currentProject} tasks={tasks} setActiveTab={(t) => {
          setActiveTab(t);
          if (projectId) localStorage.setItem(`project_tab_${projectId}`, t);
        }} />}
        {activeTab === 'list' && <ProjectList projectId={projectId!} currentProject={currentProject} tasks={tasks} setTasks={setTasks} />}
        {activeTab === 'board' && <ProjectBoard currentProject={currentProject} tasks={tasks} />}
        {activeTab === 'calendar' && <ProjectCalendar currentProject={currentProject} tasks={tasks} />}
        {activeTab === 'backlog' && <ProjectBacklog projectId={projectId!} currentProject={currentProject} />}
        {activeTab === 'sprint' && <ProjectSprint projectId={projectId!} currentProject={currentProject} />}

        {activeTab === 'roadmap' && <ProjectRoadmap />}
        {activeTab === 'issues' && <ProjectIssues tasks={tasks} />}
        {activeTab === 'members' && (
          <ProjectMembers
            currentProject={currentProject}
            onUpdate={() => dispatch(fetchProjectById(projectId!))}
          />
        )}
        {activeTab === 'settings' && (
          <ProjectSettings
            currentProject={currentProject}
            onUpdate={() => dispatch(fetchProjectById(projectId!))}
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
    </div>
  );
}
