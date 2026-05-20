import { Icons } from '../../../assets/icons';
import defaultMan from '../../../assets/avatar_def_man.png';

interface ProjectOverviewProps {
  currentProject: any;
  tasks: any[];
  setActiveTab: (tab: any) => void;
}

export default function ProjectOverview({ currentProject, tasks, setActiveTab }: ProjectOverviewProps) {
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
    { label: 'Highest', count: priorityCounts.Highest, icon: <Icons.chevronsUp size={14} color="#E13C3C" />, color: '#E13C3C' },
    { label: 'High', count: priorityCounts.High, icon: <Icons.chevronUp size={14} color="#E13C3C" />, color: '#E13C3C' },
    { label: 'Medium', count: priorityCounts.Medium, icon: <Icons.minus size={14} color="#F79B2D" />, color: '#F79B2D' },
    { label: 'Low', count: priorityCounts.Low, icon: <Icons.chevronDown size={14} color="#2D7DF7" />, color: '#2D7DF7' },
    { label: 'Lowest', count: priorityCounts.Lowest, icon: <Icons.chevronsDown size={14} color="#2D7DF7" />, color: '#2D7DF7' }
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
    <div className="p-6 bg-[#F4F5F7] flex flex-col gap-6 overflow-y-auto h-full flex-1">
      {/* Filter Bar Row */}
      <div className="flex items-center justify-between shrink-0">
        <button className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-[4px] text-[13px] font-bold transition-colors shadow-sm">
          <Icons.filter size={13} className="text-slate-500" />
          <span>Filter</span>
        </button>
      </div>

      {/* Metrics cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Completed */}
        <div className="bg-white border border-slate-200/80 rounded-[4px] p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <Icons.checkCircle2 size={18} className="stroke-[2.5]" />
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
            <Icons.pencil size={16} />
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
            <Icons.clipboardList size={16} />
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
            <Icons.calendar size={16} />
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
                <Icons.activity size={20} className="stroke-[1.5]" />
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
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
                <div className="w-12 text-right">
                  <span className="text-[12px] font-bold text-slate-800">{item.count}</span>
                  <span className="text-[10px] text-slate-400 ml-1 font-semibold">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Team workload */}
      <div className="bg-white border border-slate-200/80 rounded-[4px] p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">Team workload</h3>
            <p className="text-[12px] text-slate-500 font-medium mt-1">
              Keep an eye on who is doing what.
            </p>
          </div>
          <button className="text-blue-600 hover:underline font-bold text-[12px]">
            View workload report
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {assigneeStats.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 w-40 shrink-0">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.name} className="w-6 h-6 rounded-full border border-slate-200 object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                    ?
                  </div>
                )}
                <span className="text-[12px] font-bold text-slate-700 truncate">{item.name}</span>
              </div>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="w-12 text-right">
                <span className="text-[12px] font-bold text-slate-800">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
