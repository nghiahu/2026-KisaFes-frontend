import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  KanbanSquare,
  ListTodo,
  Calendar,
  Clock,
  Plus,
  MoreHorizontal,
  Star,
  UserPlus,
  ChevronRight,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  Code,
  ClipboardList,
  GitBranch,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  Share2,
  Maximize2,
  Zap,
  Pencil,
  User
} from 'lucide-react';
import defaultMan from '../../assets/avatar_def_man.png';
import { projectService } from '../../services/project.service';
import categoryService from '../../services/category.service';
import { taskService } from '../../services/task.service';


type TabType = 'overview' | 'list' | 'board' | 'calendar' | 'code' | 'docs' | 'forms' | 'development' | 'backlog' | 'sprint' | 'roadmap' | 'issues';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [currentProject, setCurrentProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [isFavorite, setIsFavorite] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState<string | null>(null);


  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const cats = await categoryService.getAllCategories();
        const data = await projectService.getProjectById(projectId);

        if (data) {
          const catName = cats.find((c: any) => c.id === data.categoryId)?.name || 'General';
          const completedCount = data.completedTasksCount ?? 0;
          const totalCount = data.totalTasksCount ?? 0;
          const progressValue = data.totalTasksCount > 0 ? Math.round((data.completedTasksCount / data.totalTasksCount) * 100) : 0;

          setCurrentProject({
            id: data.id,
            name: data.name,
            code: data.code || data.name?.substring(0, 2).toUpperCase() || 'PR',
            category: catName,
            status: 'ACTIVE',
            progress: progressValue,
            lead: data.members?.[0] ? {
              name: data.members[0].name,
              avatar: data.members[0].avatar || defaultMan
            } : { name: 'Unassigned', avatar: defaultMan },
            membersCount: data.members?.length || 1,
            dueDate: data.deadlineDisplay || 'Not set',
            description: data.description || 'No description provided.',
            tasksCount: totalCount,
            completedTasksCount: completedCount,
            members: data.members || [],
            statuses: data.statuses || []
          });

          // Fetch real tasks from backend database
          const dbTasks = await taskService.getTasksByProjectId(projectId);
          if (dbTasks && dbTasks.length > 0) {
            setTasks(dbTasks.map((t: any) => ({
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
        }
      } catch (err) {
        console.warn("Lỗi khi tải chi tiết dự án từ backend:", err);
        setCurrentProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
    setActiveTab('list');
  }, [projectId]);

  const handleAddTask = (columnStatus: string) => {
    if (!newTaskTitle.trim() || !currentProject) return;
    const nextIdNumber = 100 + tasks.length + 1;
    const newTask = {
      id: `${currentProject.code}-${nextIdNumber}`,
      title: newTaskTitle.trim(),
      status: columnStatus,
      priority: 'Medium',
      assignee: 'Unassigned',
      reporter: 'nghĩa Ngô',
      type: 'task'
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setShowAddTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Low': return 'bg-slate-50 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

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

  // Dynamic stats calculation for Summary Dashboard
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'Done' || t.status?.toLowerCase().includes('done') || t.status?.toLowerCase().includes('hoàn thành')).length;
  const updatedCount = totalCount;
  const createdCount = totalCount;
  const dueSoonCount = 0;

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  tasks.forEach(t => {
    const label = t.status || 'To Do';
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  });

  const uniqueStatuses = currentProject?.statuses?.map((s: any) => s.label) || ['To Do', 'In Progress', 'Done'];
  const statusColors = ['#8EB83E', '#3B82F6', '#9B51E0', '#F2994A', '#EB5757', '#2F80ED'];
  const statusGroups = uniqueStatuses.map((label: string, index: number) => {
    return {
      label,
      count: statusCounts[label] || 0,
      color: statusColors[index % statusColors.length]
    };
  });

  // Render donut chart segments dynamically
  const renderDonutSegments = () => {
    let accumulatedPercent = 0;
    return statusGroups.map((group: any, idx: number) => {
      if (totalCount === 0 || group.count === 0) return null;
      const percentage = (group.count / totalCount) * 100;
      const strokeDashArray = `${percentage} ${100 - percentage}`;
      const strokeDashOffset = -accumulatedPercent;
      accumulatedPercent += percentage;

      return (
        <circle
          key={idx}
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          stroke={group.color}
          strokeWidth="12"
          strokeDasharray={strokeDashArray}
          strokeDashoffset={strokeDashOffset}
          className="transition-all duration-500 hover:stroke-[14px] cursor-pointer"
          style={{ transformOrigin: 'center' }}
        />
      );
    });
  };

  // Priority breakdown
  const priorityCounts: Record<string, number> = {
    Highest: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Lowest: 0
  };
  tasks.forEach(t => {
    let p = t.priority || 'Medium';
    if (p.toLowerCase() === 'highest') p = 'Highest';
    else if (p.toLowerCase() === 'high') p = 'High';
    else if (p.toLowerCase() === 'medium') p = 'Medium';
    else if (p.toLowerCase() === 'low') p = 'Low';
    else if (p.toLowerCase() === 'lowest') p = 'Lowest';
    else p = 'Medium';
    priorityCounts[p] = (priorityCounts[p] || 0) + 1;
  });

  const priorityStats = [
    { label: 'Highest', count: priorityCounts.Highest, icon: '⏫', color: '#E13C3C' },
    { label: 'High', count: priorityCounts.High, icon: '🔼', color: '#E13C3C' },
    { label: 'Medium', count: priorityCounts.Medium, icon: '＝', color: '#F79B2D' },
    { label: 'Low', count: priorityCounts.Low, icon: '🔽', color: '#2D7DF7' },
    { label: 'Lowest', count: priorityCounts.Lowest, icon: '⏬', color: '#2D7DF7' }
  ];

  // Types of work
  const typeCounts: Record<string, number> = {
    Epic: 0,
    Task: 0,
    Bug: 0,
    Subtask: 0
  };
  tasks.forEach(t => {
    let type = t.type || 'task';
    if (type.toLowerCase() === 'epic') typeCounts.Epic++;
    else if (type.toLowerCase() === 'task' || type.toLowerCase() === 'story') typeCounts.Task++;
    else if (type.toLowerCase() === 'bug') typeCounts.Bug++;
    else if (type.toLowerCase() === 'subtask') typeCounts.Subtask++;
    else typeCounts.Task++;
  });

  const typeStats = [
    { label: 'Epic', count: typeCounts.Epic, icon: '⚡', color: '#9B51E0' },
    { label: 'Task', count: typeCounts.Task, icon: '☑️', color: '#4B93FF' },
    { label: 'Service Request', count: typeCounts.Bug, icon: '🐞', color: '#FF4D4D' },
    { label: 'Subtask', count: typeCounts.Subtask, icon: '🌿', color: '#56CCF2' }
  ].map(item => {
    const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
    return { ...item, percentage };
  });

  // Team workload
  const assigneeCounts: Record<string, number> = {};
  tasks.forEach(t => {
    const name = t.assignee || 'Unassigned';
    assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
  });

  const uniqueAssignees = Array.from(new Set(tasks.map(t => t.assignee || 'Unassigned')));
  if (uniqueAssignees.length === 0) uniqueAssignees.push('Unassigned');

  const assigneeStats = uniqueAssignees.map(name => {
    const count = assigneeCounts[name] || 0;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return {
      name,
      count,
      percentage,
      avatar: name === 'Unassigned' ? null : defaultMan
    };
  });

  // Recent activity
  const activityLog = tasks.slice(0, 5).map((t, idx) => {
    const timeAgos = ['2 minutes ago', '14 minutes ago', '1 hour ago', '3 hours ago', 'Yesterday'];
    return {
      userName: t.reporter || 'nghĩa Ngô',
      action: idx % 2 === 0 ? 'created' : 'updated',
      taskKey: t.id,
      taskTitle: t.title,
      taskType: t.type,
      status: t.status,
      timeAgo: timeAgos[idx % timeAgos.length]
    };
  });

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

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="p-6 bg-[#F4F5F7] flex flex-col gap-6 overflow-y-auto h-full flex-1">
            
            {/* Filter Bar Row */}
            <div className="flex items-center justify-between shrink-0">
              <button className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-[4px] text-[13px] font-bold transition-colors shadow-sm">
                <Filter size={13} className="text-slate-500" />
                <span>Filter</span>
              </button>
            </div>

            {/* Metrics cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
              {/* Completed */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800 leading-tight">
                    {completedCount} completed
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">in the last 7 days</p>
                </div>
              </div>

              {/* Updated */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 bg-slate-50 rounded-[4px] flex items-center justify-center text-slate-600 shrink-0 border border-slate-200">
                  <Pencil size={16} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800 leading-tight">
                    {updatedCount} updated
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">in the last 7 days</p>
                </div>
              </div>

              {/* Created */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 bg-slate-50 rounded-[4px] flex items-center justify-center text-slate-600 shrink-0 border border-slate-200">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800 leading-tight">
                    {createdCount} created
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">in the last 7 days</p>
                </div>
              </div>

              {/* Due soon */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 bg-slate-50 rounded-[4px] flex items-center justify-center text-slate-600 shrink-0 border border-slate-200">
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800 leading-tight">
                    {dueSoonCount} due soon
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5">in the next 7 days</p>
                </div>
              </div>
            </div>

            {/* Row 2: Status overview & Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status overview */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Status overview</h3>
                  <p className="text-[12px] text-slate-500 font-medium mt-1">
                    Get a snapshot of the status of your work items.{" "}
                    <button onClick={() => setActiveTab('list')} className="text-blue-600 hover:underline font-bold">
                      View all work items
                    </button>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-10 py-4 flex-1">
                  {/* SVG Donut Chart */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {totalCount > 0 ? (
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {renderDonutSegments()}
                      </svg>
                    ) : (
                      <div className="w-full h-full rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 font-bold text-xs">
                        No work items
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[26px] font-black text-slate-800 leading-none">{totalCount}</span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-tight mt-1 text-center max-w-[80px]">
                        Total work item...
                      </span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="flex flex-col gap-2.5 min-w-[120px]">
                    {statusGroups.map((group: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5 text-[12px] font-bold text-slate-600">
                        <span className="w-3 h-3 rounded-[2px] shrink-0" style={{ backgroundColor: group.color }} />
                        <span>{group.label}: {group.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-800">Recent activity</h3>
                    <p className="text-[12px] text-slate-500 font-medium mt-1">
                      Stay up to date with what's happening across the space.
                    </p>
                  </div>
                  <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors shrink-0">
                    <Maximize2 size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[200px] pr-2 flex flex-col gap-4 scrollbar-thin">
                  {activityLog.length > 0 ? (
                    activityLog.map((act, idx) => (
                      <div key={idx} className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm uppercase">
                          {act.userName?.substring(0, 2) || 'NN'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-slate-700 leading-snug">
                            <span className="font-bold text-slate-850 hover:underline cursor-pointer">{act.userName}</span>{" "}
                            {act.action === 'created' ? 'created' : `updated field "Rank" on`}{" "}
                            <button 
                              onClick={() => setActiveTab('list')}
                              className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 rounded px-1 py-0.5 text-[10px] align-baseline uppercase"
                            >
                              {act.taskKey}
                            </button>
                            <span className="ml-1 text-slate-600 font-bold">: {act.taskTitle}</span>
                            <span className="ml-1.5 text-[9px] font-black bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase inline-block scale-90 origin-left">
                              {act.status}
                            </span>
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-1">{act.timeAgo}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
                      <Activity size={20} className="stroke-[1.5]" />
                      <span className="text-xs font-bold">No recent activities</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Priority breakdown & Types of work */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority breakdown */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Priority breakdown</h3>
                  <p className="text-[12px] text-slate-500 font-medium mt-1">
                    Get a holistic view of how work is being prioritized.{" "}
                    <a href="#spaces" className="text-blue-600 hover:underline font-bold">
                      How to manage priorities for spaces
                    </a>
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-end min-h-[160px] pt-4">
                  <div className="flex justify-between items-end px-4 border-b border-slate-200 pb-2 flex-1 gap-2">
                    {priorityStats.map((item, idx) => {
                      const maxCount = Math.max(...priorityStats.map(p => p.count), 1);
                      const percentHeight = (item.count / maxCount) * 100;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 w-12 group relative">
                          <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow pointer-events-none">
                            {item.count} items
                          </div>
                          <div 
                            className="w-7 bg-[#858A99] hover:bg-blue-500 rounded-[1px] transition-all duration-300"
                            style={{ height: `${percentHeight}%`, minHeight: item.count > 0 ? '12px' : '2px' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between items-center px-2 pt-2">
                    {priorityStats.map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center w-12">
                        <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-500 capitalize">
                          <span className="scale-90">{item.icon}</span>
                          <span className="hidden sm:inline">{item.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Types of work */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Types of work</h3>
                  <p className="text-[12px] text-slate-500 font-medium mt-1">
                    Get a breakdown of work items by their types.{" "}
                    <button onClick={() => setActiveTab('list')} className="text-blue-600 hover:underline font-bold">
                      View all items
                    </button>
                  </p>
                </div>

                <div className="flex-1 flex flex-col gap-3 pt-2 justify-center">
                  {typeStats.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex items-center gap-2.5 text-[12px] font-bold text-slate-600 w-28 shrink-0">
                        <span className="scale-100">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>

                      <div className="flex-1 h-5 bg-slate-100 rounded-[2px] overflow-hidden flex items-center relative border border-slate-200/40">
                        {item.count > 0 && (
                          <div 
                            className="h-full bg-[#858A99] hover:bg-[#4B93FF] transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          />
                        )}
                        <span className="absolute left-2.5 text-[10px] font-black text-slate-600 mix-blend-difference">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Team workload & Empty placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team workload */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Team workload</h3>
                  <p className="text-[12px] text-slate-500 font-medium mt-1">
                    Monitor the capacity of your team.{" "}
                    <a href="#reassign" className="text-blue-600 hover:underline font-bold">
                      Reassign work items to get the right balance
                    </a>
                  </p>
                </div>

                <div className="flex-1 flex flex-col gap-3 pt-2 justify-center">
                  {assigneeStats.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="flex items-center gap-2.5 text-[12px] font-bold text-slate-600 w-28 shrink-0">
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={10} className="text-slate-400" />
                          )}
                        </div>
                        <span className="truncate">{item.name}</span>
                      </div>

                      <div className="flex-1 h-5 bg-slate-100 rounded-[2px] overflow-hidden flex items-center relative border border-slate-200/40">
                        {item.count > 0 && (
                          <div 
                            className="h-full bg-[#858A99] hover:bg-[#4B93FF] transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          />
                        )}
                        <span className="absolute left-2.5 text-[10px] font-black text-slate-600 mix-blend-difference">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Empty placeholder */}
              <div className="bg-white border border-slate-200/80 rounded-[4px] p-6 shadow-sm flex items-center justify-center min-h-[140px]">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="relative w-14 h-14 flex items-center justify-center scale-90">
                    <div className="grid grid-cols-2 gap-1 w-8 h-8">
                      <div className="bg-slate-200 rounded-[1px]"></div>
                      <div className="bg-slate-200 rounded-[1px]"></div>
                      <div className="bg-slate-200 rounded-[1px]"></div>
                      <div className="bg-slate-200 rounded-[1px]"></div>
                    </div>
                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                      +
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* LIST TAB (JIRA-STYLE LIST VIEW) */}
        {activeTab === 'list' && (
          <div className="flex flex-col flex-1 min-h-0 bg-white">
            {/* Toolbar Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-white border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                {/* Ask AI Button */}
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-all shadow-sm">
                  <Sparkles size={13} className="text-violet-500 fill-violet-100" />
                  <span>Ask AI</span>
                </button>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search work"
                    className="pl-8 pr-3 py-1.5 w-44 bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg text-xs font-semibold text-slate-700 outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Assignee Avatar */}
                <div className="flex items-center -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center border border-white ring-1 ring-slate-100 shadow-sm" title="nghĩa Ngô">
                    NN
                  </div>
                </div>

                {/* Filter Button */}
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-all shadow-sm">
                  <Filter size={13} className="text-slate-400" />
                  <span>Filter</span>
                </button>

                {/* Group Button */}
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-all shadow-sm">
                  <KanbanSquare size={13} className="text-slate-400" />
                  <span>Group</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold text-slate-400">Saved filters v</span>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-50 shadow-sm">
                  <button className="p-1 bg-white rounded-md shadow-sm border border-slate-100 text-slate-800 shrink-0">
                    <ListTodo size={13} />
                  </button>
                  <button className="p-1 text-slate-400 hover:text-slate-600 shrink-0">
                    <KanbanSquare size={13} />
                  </button>
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto bg-white p-6">
              <div className="min-w-[800px] border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="w-12 py-3 px-4 text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </th>
                      <th className="py-3 px-4 text-slate-700">Work</th>
                      <th className="w-48 py-3 px-4 text-slate-700">Assignee</th>
                      <th className="w-48 py-3 px-4 text-slate-700">Reporter</th>
                      <th className="w-36 py-3 px-4 text-slate-700">Priority</th>
                      <th className="w-36 py-3 px-4 text-slate-700">Status</th>
                      <th className="w-12 py-3 px-4 text-center">
                        <div className="w-4 h-4 rounded hover:bg-slate-200 flex items-center justify-center cursor-pointer text-slate-500">
                          <Plus size={12} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const isStory = task.type === 'story';
                      return (
                        <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                          {/* Checkbox */}
                          <td className="py-3.5 px-4 text-center">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          </td>

                          {/* Work */}
                          <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                            <div className="flex items-center gap-2.5">
                              {isStory ? (
                                <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-600 shrink-0 font-black shadow-sm" title="Story">
                                  ⚡
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 shrink-0 font-black shadow-sm" title="Task">
                                  ✓
                                </span>
                              )}
                              <span className="text-blue-600 hover:underline cursor-pointer font-bold">{task.id}</span>
                              <span className="text-slate-700 group-hover:text-blue-600 transition-colors truncate max-w-md">{task.title}</span>

                              <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-2 transition-all shrink-0">
                                <ArrowUpRight size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                                <Plus size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                              </span>
                            </div>
                          </td>

                          {/* Assignee */}
                          <td className="py-3.5 px-4 text-slate-500 text-xs font-semibold">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-[10px] shrink-0">
                                👤
                              </div>
                              <span className={task.assignee === 'Unassigned' ? 'text-slate-400 font-medium' : 'text-slate-600'}>
                                {task.assignee}
                              </span>
                            </div>
                          </td>

                          {/* Reporter */}
                          <td className="py-3.5 px-4 text-slate-600 text-xs font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black shrink-0 shadow-inner">
                                NN
                              </div>
                              <span className="text-slate-700">{task.reporter || 'nghĩa Ngô'}</span>
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-black text-xs">=</span>
                              <span>{task.priority}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <div className="relative inline-block">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!currentProject || !currentProject.statuses || currentProject.statuses.length === 0) return;

                                  const statuses = currentProject.statuses;
                                  const currentIndex = statuses.findIndex((s: any) => s.label === task.status || s.statusId === task.statusId);
                                  const nextStatusObj = statuses[(currentIndex + 1) % statuses.length];
                                  const nextStatusId = nextStatusObj.statusId;
                                  const nextStatusLabel = nextStatusObj.label;

                                  // Update UI immediately for responsiveness
                                  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatusLabel, statusId: nextStatusId } : t));

                                  try {
                                    if (task.dbId) {
                                      await taskService.updateTaskStatus(task.dbId, nextStatusId);
                                    }
                                  } catch (err) {
                                    console.error("Failed to update status in backend:", err);
                                  }
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[9px] font-black tracking-wider uppercase transition-colors shadow-sm ${task.status === 'Done' || task.status?.toLowerCase().includes('done') || task.status?.toLowerCase().includes('hoàn thành')
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : task.status === 'In Progress' || task.status?.toLowerCase().includes('progress') || task.status?.toLowerCase().includes('đang')
                                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                              >
                                <span>{task.status}</span>
                                <span className="text-[7px] text-slate-400">▼</span>
                              </button>
                            </div>
                          </td>

                          {/* Col Spacer */}
                          <td className="py-3.5 px-4"></td>
                        </tr>
                      );
                    })}

                    {/* Quick Create Inline Row */}
                    <tr className="bg-slate-50/20">
                      <td className="py-3 px-4 text-center"></td>
                      <td className="py-3 px-4" colSpan={6}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const title = prompt("Nhập tiêu đề task mới:");
                              if (!title || !title.trim() || !currentProject) return;

                              const firstStatusId = currentProject.statuses?.[0]?.statusId || "";
                              const firstStatusLabel = currentProject.statuses?.[0]?.label || "To Do";

                              try {
                                const response = await taskService.createTask({
                                  projectId: currentProject.id,
                                  title: title.trim(),
                                  statusId: firstStatusId,
                                  type: 'task'
                                });

                                if (response) {
                                  setTasks(prev => [...prev, {
                                    id: response.taskKey,
                                    dbId: response.id,
                                    title: response.title,
                                    status: response.statusLabel || firstStatusLabel,
                                    statusId: response.statusId || firstStatusId,
                                    priority: response.priority || 'Medium',
                                    assignee: response.assigneeName || 'Unassigned',
                                    reporter: response.reporterName || 'nghĩa Ngô',
                                    type: response.type || 'task'
                                  }]);
                                }
                              } catch (err) {
                                console.error("Failed to create task in backend:", err);
                              }
                            }}
                            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-bold text-xs transition-colors py-1 px-2 hover:bg-blue-50/50 rounded-lg"
                          >
                            <Plus size={14} />
                            <span>Create</span>
                          </button>
                          <div className="w-px h-4 bg-slate-200" />
                          <span className="text-[10px] font-bold text-slate-400">
                            {tasks.length} of {tasks.length} tasks
                          </span>
                          <button
                            onClick={async () => {
                              if (!projectId) return;
                              try {
                                const dbTasks = await taskService.getTasksByProjectId(projectId);
                                if (dbTasks) {
                                  setTasks(dbTasks.map((t: any) => ({
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
                                }
                              } catch (err) {
                                console.error("Failed to reload tasks from backend:", err);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
                            title="Reset tasks"
                          >
                            <RefreshCw size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BOARD TAB (KANBAN BOARD) */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">

            {['To Do', 'In Progress', 'Review', 'Done'].map((status) => {
              const columnTasks = tasks.filter(t => t.status === status);
              return (
                <div key={status} className="bg-slate-50 p-4 rounded-3xl border border-slate-200/60 min-w-[250px] flex flex-col gap-3 min-h-[300px]">
                  <div className="flex items-center justify-between px-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-700">{status}</h4>
                      <span className="text-xs bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                        {columnTasks.length}
                      </span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Task list inside column */}
                  <div className="flex flex-col gap-2 flex-1">
                    {columnTasks.map((task) => (
                      <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group cursor-pointer">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">{task.id}</span>
                        <h5 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors">{task.title}</h5>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <img src={defaultMan} alt="Assignee" className="w-6 h-6 rounded-full border border-white shadow-sm" title={task.assignee} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add task option */}
                  {showAddTask === status ? (
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-inner mt-2">
                      <textarea
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full text-xs font-semibold text-slate-700 placeholder:text-slate-400 border-0 focus:ring-0 resize-none p-1"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1.5 mt-2">
                        <button
                          onClick={() => setShowAddTask(null)}
                          className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddTask(status)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowAddTask(status);
                        setNewTaskTitle('');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/20 rounded-2xl text-slate-400 hover:text-blue-600 text-xs font-bold transition-all mt-2"
                    >
                      <Plus size={14} />
                      <span>Add Issue</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* BACKLOG TAB */}
        {activeTab === 'backlog' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Product Backlog</h3>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Collect, organize and prioritize requirements</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('board');
                  setShowAddTask('To Do');
                }}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-600 transition-colors"
              >
                <Plus size={14} />
                <span>Create Backlog Item</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500/20" checked={task.status === 'Done'} readOnly />
                    <span className="text-xs font-extrabold text-slate-400 shrink-0 select-all">{task.id}</span>
                    <span className="text-sm font-bold text-slate-700 truncate">{task.title}</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                      {task.status}
                    </span>
                    <img src={defaultMan} alt="Assignee" className="w-6 h-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE SPRINT TAB */}
        {activeTab === 'sprint' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs bg-blue-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                  <h3 className="font-extrabold text-slate-800 text-xl">Sprint 1 (Sprint Hạt Nhân)</h3>
                </div>
                <p className="text-slate-400 text-xs font-semibold mt-1">May 15, 2026 - May 29, 2026 • 2 Weeks</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
                  <Clock size={14} />
                  <span>5 days remaining</span>
                </span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors shadow-md shadow-blue-200">
                  Complete Sprint
                </button>
              </div>
            </div>

            {/* Sprint Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Story Points</span>
                <h4 className="text-2xl font-black text-slate-800 mt-1">24</h4>
              </div>
              <div className="bg-blue-50/20 rounded-2xl p-4 border border-blue-100/30 text-center">
                <span className="text-xs text-blue-500 font-bold uppercase tracking-wider block">Completed Points</span>
                <h4 className="text-2xl font-black text-blue-600 mt-1">16</h4>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">In Progress Points</span>
                <h4 className="text-2xl font-black text-slate-800 mt-1">5</h4>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Unstarted Points</span>
                <h4 className="text-2xl font-black text-slate-800 mt-1">3</h4>
              </div>
            </div>

            {/* Sprint tasks list */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-3">Sprint Task List</h4>
              <div className="flex flex-col gap-2">
                {tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-slate-100 hover:bg-slate-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className={task.status === 'Done' ? 'text-emerald-500' : 'text-slate-300'} />
                      <span className="text-xs font-bold text-slate-400">{task.id}</span>
                      <span className="text-sm font-bold text-slate-700">{task.title}</span>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROADMAP TAB */}
        {activeTab === 'roadmap' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Project Timeline & Phases</h3>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Visualize project milestones, epics, and high-level roadmap</p>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <div className="border border-slate-100 rounded-3xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <h4 className="font-bold text-sm text-slate-800">Phase 1: Architecture & Auth Cache</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">May 1 - May 20 (Completed)</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="border border-slate-100 rounded-3xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <h4 className="font-bold text-sm text-slate-800">Phase 2: Project Management Wizard & Categories</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">May 20 - Jun 15 (Active)</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div className="border border-slate-100 rounded-3xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-300" />
                    <h4 className="font-bold text-sm text-slate-800">Phase 3: Sprints & Analytics Timeline</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">Jun 15 - Jul 10 (Planning)</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Issues & Bugs</h3>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Filter, track and debug items across the project scope</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('board');
                  setShowAddTask('To Do');
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-colors shadow-md shadow-blue-200"
              >
                <Plus size={14} />
                <span>Log New Issue</span>
              </button>
            </div>

            {/* List of active issue tickets */}
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all gap-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={16} className={task.priority === 'High' ? 'text-rose-500' : 'text-slate-400'} />
                    <span className="text-xs font-extrabold text-slate-400 select-all">{task.id}</span>
                    <span className="text-sm font-bold text-slate-700">{task.title}</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                      {task.status}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{task.assignee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
