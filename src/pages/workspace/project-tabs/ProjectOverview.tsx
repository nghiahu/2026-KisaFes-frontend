import { Icons } from '../../../assets/icons';
import defaultMan from '../../../assets/avatar_def_man.png';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

import { useTasksQuery } from '../../../hooks/api/useTasks';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProjectOverviewProps {
  currentProject: any;
  setActiveTab: (tab: any) => void;
}

export default function ProjectOverview({ currentProject, setActiveTab }: ProjectOverviewProps) {
  const { projectId } = useParams();
  const { data: tasksData } = useTasksQuery(projectId || '', { page: 0, size: 100 });
  const tasks = tasksData?.content || [];
  const { t } = useLanguage();

  // Dynamic stats calculation for Summary Dashboard
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => {
    const statusObj = currentProject?.statuses?.find((s: any) => s.statusId === t.statusId);
    const label = statusObj?.label || t.status || '';
    return label === 'Done' || label.toLowerCase().includes('done') || label.toLowerCase().includes('hoàn thành');
  }).length;
  const updatedCount = totalCount;
  const createdCount = totalCount;
  const dueSoonCount = 0;

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  tasks.forEach(t => {
    const statusObj = currentProject?.statuses?.find((s: any) => s.statusId === t.statusId);
    const label = statusObj?.label || t.status || 'To Do';
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  });

  const uniqueStatuses = currentProject?.statuses?.map((s: any) => s.label) || ['To Do', 'In Progress', 'Done'];
  const statusColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];
  const statusGroups = uniqueStatuses.map((label: string, index: number) => {
    return {
      label,
      count: statusCounts[label] || 0,
      color: statusColors[index % statusColors.length]
    };
  });

  const chartData = {
    labels: statusGroups.map((g: any) => g.label),
    datasets: [
      {
        data: statusGroups.map((g: any) => g.count),
        backgroundColor: statusGroups.map((g: any) => g.color),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} task${ctx.raw !== 1 ? 's' : ''}`,
        },
      },
    },
    animation: { animateScale: true, animateRotate: true, duration: 1000 },
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
    { label: 'Highest', count: priorityCounts.Highest, icon: <Icons.chevronsUp size={14} className="text-red-500" />, color: 'linear-gradient(to top, #ef4444, #f87171)' },
    { label: 'High', count: priorityCounts.High, icon: <Icons.chevronUp size={14} className="text-orange-500" />, color: 'linear-gradient(to top, #f97316, #fb923c)' },
    { label: 'Medium', count: priorityCounts.Medium, icon: <Icons.equal size={14} strokeWidth={3} className="text-amber-500" />, color: 'linear-gradient(to top, #f59e0b, #fbbf24)' },
    { label: 'Low', count: priorityCounts.Low, icon: <Icons.chevronDown size={14} className="text-blue-500" />, color: 'linear-gradient(to top, #3b82f6, #60a5fa)' },
    { label: 'Lowest', count: priorityCounts.Lowest, icon: <Icons.chevronsDown size={14} className="text-muted-foreground" />, color: 'linear-gradient(to top, #94a3b8, #cbd5e1)' }
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
    { label: 'Epic', count: typeCounts.Epic, icon: <Icons.zap size={14} color="#9B51E0" />, color: '#9B51E0' },
    { label: 'Task', count: typeCounts.Task, icon: <Icons.checkCircle2 size={14} color="#4B93FF" />, color: '#4B93FF' },
    { label: 'Service Request', count: typeCounts.Bug, icon: <Icons.bug size={14} color="#FF4D4D" />, color: '#FF4D4D' },
    { label: 'Subtask', count: typeCounts.Subtask, icon: <Icons.gitCommit size={14} color="#56CCF2" />, color: '#56CCF2' }
  ].map(item => {
    const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
    return { ...item, percentage };
  });

  // Team workload
  const assigneeCounts: Record<string, { count: number, avatar?: string }> = {};
  tasks.forEach(t => {
    const name = t.assigneeName || t.assignee || 'Unassigned';
    if (!assigneeCounts[name]) {
      assigneeCounts[name] = { count: 0, avatar: t.assigneeAvatar };
    }
    assigneeCounts[name].count += 1;
  });

  const assigneeStats = Object.keys(assigneeCounts).map(name => {
    const data = assigneeCounts[name];
    const percentage = totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0;
    return {
      name,
      count: data.count,
      percentage,
      avatar: name === 'Unassigned' ? undefined : (data.avatar || defaultMan)
    };
  }).sort((a, b) => b.count - a.count);

  // Recent activity
  const activityLog = tasks.slice(0, 5).map((task, idx) => {
    const statusObj = currentProject?.statuses?.find((s: any) => s.statusId === task.statusId);
    const timeAgos = ['2 minutes ago', '14 minutes ago', '1 hour ago', '3 hours ago', 'Yesterday'];
    return {
      userName: task.reporterName || task.reporter || 'nghĩa Ngô',
      action: idx % 2 === 0 ? t('overview.created_action') : t('overview.updated_field'),
      taskKey: task.taskKey || task.id,
      taskTitle: task.title,
      taskType: task.type,
      status: statusObj?.label || task.status || 'To Do',
      timeAgo: timeAgos[idx % timeAgos.length]
    };
  });

  return (
    <div className="p-6 bg-[#F4F5F7] flex flex-col gap-6 overflow-y-auto h-full flex-1">
      {/* Filter Bar Row */}
      <div className="flex items-center justify-between shrink-0">
        <button className="flex items-center gap-1.5 bg-card border border-slate-300 hover:bg-background text-foreground px-3.5 py-1.5 rounded-[4px] text-[13px] font-bold transition-colors shadow-sm">
          <Icons.filter size={13} className="text-muted-foreground" />
          <span>{t('overview.filter')}</span>
        </button>
      </div>

      {/* Metrics cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Completed */}
        <div className="bg-card border border-border/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <Icons.checkCircle2 size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-foreground leading-tight">
              {completedCount} {t('overview.completed')}
            </h4>
            <p className="text-[11px] text-muted-foreground font-bold mt-0.5">{t('overview.last_7_days')}</p>
          </div>
        </div>

        {/* Updated */}
        <div className="bg-card border border-border/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 bg-background rounded-[4px] flex items-center justify-center text-muted-foreground shrink-0 border border-border">
            <Icons.pencil size={16} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-foreground leading-tight">
              {updatedCount} {t('overview.updated')}
            </h4>
            <p className="text-[11px] text-muted-foreground font-bold mt-0.5">{t('overview.last_7_days')}</p>
          </div>
        </div>

        {/* Created */}
        <div className="bg-card border border-border/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 bg-background rounded-[4px] flex items-center justify-center text-muted-foreground shrink-0 border border-border">
            <Icons.clipboardList size={16} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-foreground leading-tight">
              {createdCount} {t('overview.created')}
            </h4>
            <p className="text-[11px] text-muted-foreground font-bold mt-0.5">{t('overview.last_7_days')}</p>
          </div>
        </div>

        {/* Due soon */}
        <div className="bg-card border border-border/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 bg-background rounded-[4px] flex items-center justify-center text-muted-foreground shrink-0 border border-border">
            <Icons.calendar size={16} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-foreground leading-tight">
              {dueSoonCount} {t('overview.due_soon')}
            </h4>
            <p className="text-[11px] text-muted-foreground font-bold mt-0.5">{t('overview.next_7_days')}</p>
          </div>
        </div>
      </div>

      {/* Row 2: Status overview & Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status overview */}
        <div className="bg-card border border-border/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">{t('overview.status_overview')}</h3>
            <p className="text-[12px] text-muted-foreground font-medium mt-1">
              {t('overview.status_desc')} {" "}
              <button onClick={() => setActiveTab('list')} className="text-blue-600 hover:underline font-bold">
                {t('overview.view_all_items')}
              </button>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 py-4 flex-1">
            {/* Chart.js Donut Chart */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {totalCount > 0 ? (
                <div className="w-full h-full">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="w-full h-full rounded-full border border-border bg-background flex items-center justify-center text-slate-300 font-bold text-xs">
                  {t('overview.no_tasks')}
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[26px] font-black text-foreground leading-none">{totalCount}</span>
                <span className="text-[10px] text-muted-foreground font-bold tracking-tight mt-1 text-center max-w-[80px]">
                  {t('overview.total_work_item')}
                </span>
              </div>
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-2.5 min-w-[120px]">
              {statusGroups.map((group: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2.5 text-[12px] font-bold text-muted-foreground">
                  <span className="w-3 h-3 rounded-[2px] shrink-0" style={{ backgroundColor: group.color }} />
                  <span>{group.label}: {group.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-foreground">{t('overview.recent_activity')}</h3>
              <p className="text-[12px] text-muted-foreground font-medium mt-1">
                {t('overview.recent_desc')}
              </p>
            </div>
            <button className="p-1 text-muted-foreground hover:text-muted-foreground hover:bg-background rounded transition-colors shrink-0">
              <Icons.maximize2 size={14} />
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
                    <p className="text-[12px] font-medium text-foreground leading-snug">
                      <span className="font-bold text-slate-850 hover:underline cursor-pointer">{act.userName}</span>{" "}
                      {act.action}{" "}
                      <button 
                        onClick={() => setActiveTab('list')}
                        className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 bg-background border border-border/60 rounded px-1 py-0.5 text-[10px] align-baseline uppercase"
                      >
                        {act.taskKey}
                      </button>
                      <span className="ml-1 text-muted-foreground font-bold">: {act.taskTitle}</span>
                      <span className="ml-1.5 text-[9px] font-black bg-muted text-muted-foreground px-1 py-0.5 rounded uppercase inline-block scale-90 origin-left">
                        {act.status}
                      </span>
                    </p>
                    <span className="text-[10px] text-muted-foreground font-semibold block mt-1">{act.timeAgo}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
                <Icons.activity size={20} className="stroke-[1.5]" />
                <span className="text-xs font-bold">{t('overview.no_recent')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Priority breakdown & Types of work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority breakdown */}
        <div className="bg-card border border-border/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">{t('overview.priority_breakdown')}</h3>
            <p className="text-[12px] text-muted-foreground font-medium mt-1">
              {t('overview.priority_desc')}{" "}
              <a href="#spaces" className="text-blue-600 hover:underline font-bold">
                {t('overview.how_to_manage')}
              </a>
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-end min-h-[160px] pt-4">
            <div className="flex justify-between items-end px-4 border-b border-border pb-2 flex-1 gap-2">
              {priorityStats.map((item, idx) => {
                const maxCount = Math.max(...priorityStats.map(p => p.count), 1);
                const percentHeight = (item.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-12 group relative">
                    <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow pointer-events-none">
                      {item.count} {t('overview.items')}
                    </div>
                    <div 
                      className="w-7 rounded-t-lg transition-all duration-500 ease-out hover:scale-x-115 hover:shadow-md cursor-pointer"
                      style={{ 
                        height: `${percentHeight}%`, 
                        minHeight: item.count > 0 ? '12px' : '2px',
                        background: item.color,
                        transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center px-2 pt-2">
              {priorityStats.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center w-12">
                  <div className="flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground capitalize">
                    <span className="scale-90">{item.icon}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Types of work */}
        <div className="bg-card border border-border/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">{t('overview.types_of_work')}</h3>
            <p className="text-[12px] text-muted-foreground font-medium mt-1">
              {t('overview.types_desc')}{" "}
              <button onClick={() => setActiveTab('list')} className="text-blue-600 hover:underline font-bold">
                {t('overview.view_all_items')}
              </button>
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-3 pt-2 justify-center">
            {typeStats.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 text-[12px] font-bold text-muted-foreground w-28 shrink-0">
                  <span className="scale-100">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
                <div className="w-12 text-right">
                  <span className="text-[12px] font-bold text-foreground">{item.count}</span>
                  <span className="text-[10px] text-muted-foreground ml-1 font-semibold">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Team workload */}
      <div className="bg-card border border-border/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">{t('overview.team_workload')}</h3>
            <p className="text-[12px] text-muted-foreground font-medium mt-1">
              {t('overview.team_desc')}
            </p>
          </div>
          <button className="text-blue-600 hover:underline font-bold text-[12px]">
            {t('overview.view_workload')}
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {assigneeStats.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 w-40 shrink-0">
                {item.avatar ? (
                  <img  src={item.avatar} alt={item.name} className="w-6 h-6 rounded-full border border-border object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground text-[10px] font-bold">
                    ?
                  </div>
                )}
                <span className="text-[12px] font-bold text-foreground truncate">{item.name}</span>
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="w-12 text-right">
                <span className="text-[12px] font-bold text-foreground">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
