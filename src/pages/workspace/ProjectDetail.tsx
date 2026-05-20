import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  KanbanSquare,
  ListTodo,
  Calendar,
  Code,
  ClipboardList,
  GitBranch,
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  Share2,
  Zap,
  Star,
  Maximize2,
  Plus,
  FileText,
  AlertCircle
} from 'lucide-react';
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

type TabType = 'overview' | 'list' | 'board' | 'calendar' | 'code' | 'docs' | 'forms' | 'development' | 'backlog' | 'sprint' | 'roadmap' | 'issues';

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

  useEffect(() => {
    if (!projectId) return;
    dispatch(fetchCategories());
    dispatch(fetchProjectById(projectId));
    dispatch(fetchTasksByProject(projectId));
    setActiveTab('list');
  }, [projectId, dispatch]);

  useEffect(() => {
    setLoading(isProjectLoading || isCategoriesLoading || isTasksLoading);
  }, [isProjectLoading, isCategoriesLoading, isTasksLoading]);

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
        statuses: backendProject.statuses || []
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

  const tabs = [
    { id: 'overview' as TabType, label: 'Summary', icon: FileText },
    { id: 'list' as TabType, label: 'List', icon: ListTodo },
    { id: 'board' as TabType, label: 'Board', icon: KanbanSquare },
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'code' as TabType, label: 'Code', icon: Code },
    { id: 'docs' as TabType, label: 'Docs', icon: FileText },
    { id: 'forms' as TabType, label: 'Forms', icon: ClipboardList },
    { id: 'development' as TabType, label: 'Development', icon: GitBranch }
  ];

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
        <AlertCircle className="text-rose-500" size={48} />
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
    <div className="flex flex-col min-h-screen bg-slate-50/30 animate-in fade-in duration-300">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex items-center gap-1.5 px-6 pt-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
        <button
          onClick={() => navigate('/workspace/projects')}
          className="hover:text-blue-600 transition-colors"
        >
          Project
        </button>
        <ChevronRight size={10} className="text-slate-300" />
        <span className="text-slate-700">{currentProject.name}</span>
      </div>

      {/* Project Title Row */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md shadow-blue-500/10">
            {currentProject.code?.substring(0, 2).toUpperCase() || 'K'}
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{currentProject.name}</h1>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
            <UserPlus size={15} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
            <MoreHorizontal size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Share2 size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Zap size={16} />
          </button>
          <button
            onClick={() => setIsFavorite(prev => !prev)}
            className={`p-1.5 rounded-lg transition-colors hover:bg-slate-100 ${isFavorite ? 'text-amber-400' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Maximize2 size={16} />
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
          <Plus size={14} />
        </button>
      </div>

      {/* Dynamic Tabs Content Viewport */}
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {activeTab === 'overview' && <ProjectOverview currentProject={currentProject} tasks={tasks} setActiveTab={setActiveTab} />}
        {activeTab === 'list' && <ProjectList projectId={projectId!} currentProject={currentProject} tasks={tasks} setTasks={setTasks} />}
        {activeTab === 'board' && <ProjectBoard currentProject={currentProject} tasks={tasks} />}
        {activeTab === 'backlog' && <ProjectBacklog tasks={tasks} setActiveTab={setActiveTab} />}
        {activeTab === 'sprint' && <ProjectSprint tasks={tasks} />}
        {activeTab === 'roadmap' && <ProjectRoadmap />}
        {activeTab === 'issues' && <ProjectIssues tasks={tasks} />}
      </div>
    </div>
  );
}
