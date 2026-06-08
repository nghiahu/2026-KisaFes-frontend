import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../store/hooks';
import { projectService } from '../../services/project.service';
import { taskService } from '../../services/task.service';
import { reportService } from '../../services/report.service';
import { Icons } from '../../assets/icons';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useLanguage } from '../../contexts/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

// Format priority helper
const getPriorityStyle = (priority: string) => {
  const p = (priority || '').toUpperCase();
  if (p === 'URGENT') return 'bg-rose-100 text-rose-600';
  if (p === 'HIGH') return 'bg-amber-100 text-amber-600';
  if (p === 'MEDIUM') return 'bg-blue-100 text-blue-600';
  return 'bg-muted text-muted-foreground'; // LOW
};

const getStatusStyle = (statusLabel: string) => {
  const s = (statusLabel || '').toLowerCase();
  if (s.includes('done') || s.includes('hoàn thành')) return { text: 'text-emerald-600', dot: 'bg-emerald-500' };
  if (s.includes('progress') || s.includes('đang làm')) return { text: 'text-blue-600', dot: 'bg-blue-500' };
  return { text: 'text-muted-foreground', dot: 'bg-slate-400' };
};

// Preset colors for the doughnut chart
const CHART_COLORS = ['#1D4ED8', '#047857', '#64748B', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function GlobalReports() {
  const { user } = useAppSelector(state => state.auth);
  const { t } = useLanguage();

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
    staleTime: 60000,
  });

  const { data: myTasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => taskService.getMyTasks({ size: 10 }),
    staleTime: 60000,
  });

  const [timeRange, setTimeRange] = useState<number>(30);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const { data: globalReportResp, isLoading: isLoadingReport } = useQuery({
    queryKey: ['global-report', timeRange, selectedProjectId],
    queryFn: () => reportService.getGlobalReport(timeRange, selectedProjectId),
    staleTime: 60000,
  });

  const projects = Array.isArray(projectsData) ? projectsData : projectsData?.content || [];
  const rawMyTasks = myTasksData?.content || myTasksData?.data?.content || [];
  const recentTasks = rawMyTasks.slice(0, 5);
  // Safely extract the report data since axiosClient might wrap it inside `.data`
  const reportData = (globalReportResp as any)?.data || globalReportResp;

  const stats = useMemo(() => {
    if (!projects.length) return { total: 0, completedTasks: 0, totalTasks: 0, inProgress: 0, progress: 0, kanbanTasks: 0, scrumTasks: 0, blockedCount: 0 };
    
    let totalTasks = 0;
    let completedTasks = 0;
    let kanbanTasks = 0;
    let scrumTasks = 0;
    let blockedCount = 0;
    
    const filteredProjects = selectedProjectId === 'all' 
      ? projects 
      : projects.filter((p: any) => p.id === selectedProjectId);

    filteredProjects.forEach((p: any) => {
      const pTotal = p.tasksCount || p.totalTasksCount || 0;
      totalTasks += pTotal;
      completedTasks += (p.completedTasksCount || 0);
      blockedCount += (p.blockedTasksCount || 0);

      if (p.methodology === 'SCRUM') {
        scrumTasks += pTotal;
      } else {
        kanbanTasks += pTotal;
      }
    });

    return {
      total: filteredProjects.length,
      completedTasks,
      totalTasks,
      inProgress: totalTasks - completedTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      kanbanTasks,
      scrumTasks,
      blockedCount
    };
  }, [projects, selectedProjectId]);

  // Chart Data
  const burndownChartData = reportData?.burndownChart || { labels: [], planned: [], actual: [] };
  const workDistributionData = reportData?.workDistribution || [];

  const burnDownData = {
    labels: burndownChartData.labels.length > 0 ? burndownChartData.labels : [''],
    datasets: [
      {
        label: t('reports.chart_burndown_planned'),
        data: burndownChartData.planned.length > 0 ? burndownChartData.planned : [0],
        backgroundColor: '#EFF6FF',
        barPercentage: 0.9,
        categoryPercentage: 0.9,
      },
      {
        label: t('reports.chart_burndown_actual'),
        data: burndownChartData.actual.length > 0 ? burndownChartData.actual : [0],
        backgroundColor: '#1D4ED8',
        barPercentage: 0.9,
        categoryPercentage: 0.9,
      },
    ],
  };

  const burnDownOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: { usePointStyle: true, boxWidth: 6, boxHeight: 6, font: { size: 11, family: 'Inter' } }
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { font: { size: 9 } } },
      y: { stacked: false, display: false, beginAtZero: true },
    },
  };

  const doughnutData = {
    labels: workDistributionData.map((d: any) => d.teamName),
    datasets: [
      {
        data: workDistributionData.map((d: any) => d.percentage),
        backgroundColor: workDistributionData.map((_: any, i: number) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  if (isLoadingProjects || isLoadingTasks || isLoadingReport) {
    return (
      <div className="flex flex-col h-full bg-background p-8 gap-6 animate-in fade-in duration-300">
        <Skeleton className="h-10 w-64 rounded-lg bg-muted" />
      </div>
    );
  }

  const kanbanPercent = stats.totalTasks > 0 ? Math.round((stats.kanbanTasks / stats.totalTasks) * 100) : 0;
  const scrumPercent = stats.totalTasks > 0 ? Math.round((stats.scrumTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-y-auto animate-in fade-in duration-300" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      <div className="p-8 max-w-[1200px] mx-auto w-full">
        {/* HEADER & FILTERS */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('reports.title')}</h1>
            <p className="text-[13px] text-muted-foreground mt-1">{t('reports.desc')}</p>
          </div>
          
          <div className="flex items-center gap-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex flex-col px-4 py-2 border-r border-border hover:bg-background transition-colors cursor-pointer min-w-[140px] relative">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{t('reports.time_range')}</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{t('reports.last_days').replace('{days}', timeRange.toString())}</span>
                <Icons.chevronDown size={14} className="text-muted-foreground" />
              </div>
              <select 
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <option value={7}>{t('reports.last_days').replace('{days}', '7')}</option>
                <option value={30}>{t('reports.last_days').replace('{days}', '30')}</option>
                <option value={90}>{t('reports.last_days').replace('{days}', '90')}</option>
              </select>
            </div>
            
            <div className="flex flex-col px-4 py-2 border-r border-border hover:bg-background transition-colors cursor-pointer min-w-[140px] relative">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{t('reports.project')}</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
                  {selectedProjectId === 'all' ? t('reports.all_projects') : projects.find((p: any) => p.id === selectedProjectId)?.name || t('reports.all_projects')}
                </span>
                <Icons.chevronDown size={14} className="text-muted-foreground" />
              </div>
              <select 
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="all">{t('reports.all_projects')}</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button className="flex items-center gap-2 px-5 py-3.5 hover:bg-background transition-colors text-muted-foreground">
              <Icons.filter size={14} />
              <span className="text-xs font-semibold">{t('reports.more_filters')}</span>
            </button>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1 */}
          <div className="bg-card rounded-[16px] border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Icons.fileText size={18} />
              </div>
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground mb-1">{t('reports.stat_total')}</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.totalTasks.toLocaleString()}</h3>
          </div>

          {/* Card 2 */}
          <div className="bg-card rounded-[16px] border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Icons.checkCircle2 size={18} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">{stats.progress}%</span>
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground mb-1">{t('reports.stat_completed')}</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.completedTasks.toLocaleString()}</h3>
          </div>

          {/* Card 3 */}
          <div className="bg-card rounded-[16px] border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Icons.clock size={18} />
              </div>
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground mb-1">{t('reports.stat_in_progress')}</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.inProgress.toLocaleString()}</h3>
          </div>

          {/* Card 4 */}
          <div className="bg-card rounded-[16px] border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <Icons.calendarX2 size={18} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold">{t('reports.warning')}</span>
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground mb-1">{t('reports.stat_blocked')}</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">{stats.blockedCount.toLocaleString()}</h3>
          </div>
        </div>

        {/* MIDDLE SECTION (CHARTS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Burn-down Chart */}
          <div className="lg:col-span-2 bg-card rounded-[16px] border border-border p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <h3 className="text-[15px] font-bold text-foreground mb-6 flex items-center gap-2">{t('reports.chart_burndown')} ({timeRange} Ngày) <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md font-bold">{t('reports.live_data')}</span></h3>
            <div className="flex-1 w-full min-h-[220px]">
              <Bar data={burnDownData} options={burnDownOptions} />
            </div>
          </div>

          {/* Work Distribution Chart */}
          <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <h3 className="text-[15px] font-bold text-foreground mb-6 flex items-center justify-between">{t('reports.chart_distribution')} <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md font-bold">{t('reports.live_data')}</span></h3>
            
            {workDistributionData.length > 0 ? (
              <>
                <div className="relative w-full aspect-square max-h-[180px] mx-auto mb-6">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-foreground tracking-tighter">{workDistributionData.length}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t('reports.team')}</span>
                  </div>
                </div>
                
                <div className="space-y-3 mt-auto px-2 max-h-[150px] overflow-y-auto">
                  {workDistributionData.map((dist: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="text-[13px] font-medium text-muted-foreground truncate max-w-[120px]">{dist.teamName}</span>
                      </div>
                      <span className="text-[13px] font-bold text-foreground">{dist.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Icons.inbox size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">{t('reports.no_distribution_data')}</p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Status */}
          <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <h3 className="text-[15px] font-bold text-foreground mb-6">{t('reports.task_status')}</h3>
            
            <div className="space-y-6 mb-8">
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[13px] font-semibold text-foreground">Kanban</span>
                  <span className="text-[13px] font-bold text-blue-600">{stats.kanbanTasks} tasks</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${kanbanPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[13px] font-semibold text-foreground">Scrum</span>
                  <span className="text-[13px] font-bold text-emerald-600">{stats.scrumTasks} tasks</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-700 rounded-full" style={{ width: `${scrumPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-auto bg-blue-50 dark:bg-blue-950/50 rounded-xl p-4 flex gap-3">
              <Icons.lightbulb className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                {t('reports.distribution_ratio').replace('{kanbanPercent}', kanbanPercent.toString()).replace('{scrumPercent}', scrumPercent.toString())}
              </p>
            </div>
          </div>

          {/* Recent Tasks List */}
          <div className="lg:col-span-2 bg-card rounded-[16px] border border-border shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-[15px] font-bold text-foreground">{t('reports.recent_tasks_title')}</h3>
              <button className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">{t('reports.view_all')}</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">{t('reports.col_task_name')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">{t('reports.col_priority')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">{t('reports.col_assignee')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">{t('reports.col_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTasks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm font-medium">
                        {t('reports.no_recent_tasks')}
                      </td>
                    </tr>
                  ) : recentTasks.map((task: any) => {
                    const status = getStatusStyle(task.statusLabel);
                    return (
                      <tr key={task.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-[13px] font-bold text-foreground truncate max-w-[200px]">{task.title}</p>
                          <p className="text-[10px] font-bold text-muted-foreground mt-1">[{task.projectCode}-{task.taskKey?.split('-')[1]}] {task.projectName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-[6px] text-[9px] font-black tracking-wider ${getPriorityStyle(task.priority)}`}>
                            {task.priority || 'NORMAL'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {user?.avatar ? (
                              <img  src={user.avatar} alt={user.fullName || 'Bạn'} className="w-7 h-7 rounded-full object-cover shrink-0 border border-border" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                <div className="w-full h-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-bold">
                                  {(user?.fullName || user?.username || 'Bạn').charAt(0).toUpperCase()}
                                </div>
                              </div>
                            )}
                            <span className="text-[13px] font-medium text-muted-foreground">{user?.fullName || user?.username || 'Bạn'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            <span className={`text-[12px] font-medium ${status.text}`}>{task.statusLabel || 'Chưa rõ'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
