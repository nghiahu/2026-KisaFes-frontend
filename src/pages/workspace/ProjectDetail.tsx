import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../../assets/icons';
import defaultMan from '../../assets/avatar_def_man.png';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProjectById } from '../../store/slices/projectSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchTasksByProject } from '../../store/slices/taskSlice';

import ProjectOverview from './project-tabs/ProjectOverview';
import ProjectList from './project-tabs/ProjectList';
import ProjectBoard from './project-tabs/ProjectBoard';
import ProjectBacklog from './project-tabs/ProjectBacklog';
import ProjectSprint from './project-tabs/ProjectSprint';
import ProjectRoadmap from './project-tabs/ProjectRoadmap';
import ProjectIssues from './project-tabs/ProjectIssues';
import ProjectMembers from './project-tabs/ProjectMembers';
import InviteMemberModal from '../../components/workspace/InviteMemberModal';

type TabType = 'overview' | 'list' | 'board' | 'calendar' | 'members' | 'docs' | 'forms' | 'development' | 'backlog' | 'sprint' | 'roadmap' | 'issues';

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

  useEffect(() => {
    if (!projectId) return;
    dispatch(fetchCategories());
    dispatch(fetchProjectById(projectId));
    dispatch(fetchTasksByProject({ projectId }));
    setActiveTab('list');
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
    { id: 'docs' as TabType, label: 'Docs', icon: Icons.fileText },
    { id: 'forms' as TabType, label: 'Forms', icon: Icons.clipboardList },
    { id: 'development' as TabType, label: 'Development', icon: Icons.gitBranch },
  ];

  // Scrum-specific tabs inserted after Board
  const scrumTabs = [
    { id: 'backlog' as TabType, label: 'Backlog', icon: Icons.listTodo },
    { id: 'sprint' as TabType, label: 'Sprint', icon: Icons.zap },
    { id: 'roadmap' as TabType, label: 'Roadmap', icon: Icons.gitBranch },
    { id: 'issues' as TabType, label: 'Issues', icon: Icons.alertCircle },
  ];

  const tabs = isScrum
    ? [
      baseTabs[0], // Summary
      baseTabs[1], // List
      baseTabs[2], // Board (Kanban-style)
      scrumTabs[0], // Backlog
      scrumTabs[1], // Sprint Board
      scrumTabs[2], // Roadmap
      scrumTabs[3], // Issues
      baseTabs[3], // Calendar
      baseTabs[4], // Code
      baseTabs[5], // Docs
      baseTabs[6], // Forms
      baseTabs[7], // Development
    ]
    : baseTabs;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
        <span className="text-sm font-semibold text-[#64748B] tracking-tight">Đang tải chi tiết dự án...</span>
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{currentProject.name}</h1>
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
              onClick={() => setActiveTab(tab.id)}
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
        <button className="px-2 py-2.5 text-slate-400 hover:text-slate-600 -mb-[2px] shrink-0">
          <Icons.plus size={14} />
        </button>
      </div>

      {/* Dynamic Tabs Content Viewport */}
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {activeTab === 'overview' && <ProjectOverview currentProject={currentProject} tasks={tasks} setActiveTab={setActiveTab} />}
        {activeTab === 'list' && <ProjectList projectId={projectId!} currentProject={currentProject} tasks={tasks} setTasks={setTasks} />}
        {activeTab === 'board' && <ProjectBoard currentProject={currentProject} tasks={tasks} />}
        {activeTab === 'backlog' && <ProjectBacklog tasks={tasks} setActiveTab={setActiveTab} />}
        {activeTab === 'sprint' && <ProjectSprint projectId={projectId!} tasks={tasks} />}
        {activeTab === 'roadmap' && <ProjectRoadmap />}
        {activeTab === 'issues' && <ProjectIssues tasks={tasks} />}
        {activeTab === 'members' && (
          <ProjectMembers
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
