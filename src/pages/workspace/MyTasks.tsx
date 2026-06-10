import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '../../assets/icons';
import { taskService } from '../../services/task.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '@/components/ui/Button';

export default function MyTasks() {
  const { t } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => taskService.getMyTasks({ size: 100 }),
    staleTime: 30000,
  });

  const tasks = data?.content || data?.data?.content || [];

  // Data processing
  const {
    overdue, today, upcoming, noDate,
    stats,
    projectWorkloads
  } = useMemo(() => {
    const overdue: any[] = [];
    const todayTasks: any[] = [];
    const upcoming: any[] = [];
    const noDate: any[] = [];
    
    const projectMap: Record<string, { id: string, name: string, code: string, total: number, done: number }> = {};
    let pendingCount = 0;
    let doneCount = 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    tasks.forEach((task: any) => {
      const isDone = (task.statusLabel || '').toLowerCase().includes('done') || (task.statusLabel || '').toLowerCase().includes('hoàn thành');
      
      if (isDone) {
        doneCount++;
      } else {
        pendingCount++;
      }

      // Group by project
      const pId = task.projectId || 'unknown';
      if (!projectMap[pId]) {
        projectMap[pId] = {
          id: pId,
          name: task.projectName || 'Unknown Project',
          code: task.projectCode || 'UNK',
          total: 0,
          done: 0
        };
      }
      projectMap[pId].total++;
      if (isDone) projectMap[pId].done++;

      // Only show incomplete tasks in the priority list
      if (!isDone) {
        if (!task.dueDate) {
          noDate.push(task);
        } else {
          const dueDate = new Date(task.dueDate);
          const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          if (dueStart < todayStart) {
            overdue.push(task);
          } else if (dueStart.getTime() === todayStart.getTime()) {
            todayTasks.push(task);
          } else {
            upcoming.push(task);
          }
        }
      }
    });
    
    return { 
      overdue, 
      today: todayTasks, 
      upcoming, 
      noDate,
      stats: {
        pendingCount,
        urgentCount: overdue.length + todayTasks.length,
        doneCount,
        projectCount: Object.keys(projectMap).length
      },
      projectWorkloads: Object.values(projectMap).sort((a, b) => (b.total - b.done) - (a.total - a.done))
    };
  }, [tasks]);

  const renderPriority = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'URGENT') return <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-rose-100 dark:border-rose-900/50 shrink-0">Urgent</span>;
    if (p === 'HIGH') return <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-100 dark:border-amber-900/50 shrink-0">High</span>;
    if (p === 'MEDIUM') return <span className="px-2.5 py-1 bg-primary/10 dark:bg-blue-950/50 text-primary dark:text-primary/70 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100 dark:border-blue-900/50 shrink-0">Medium</span>;
    return <span className="px-2.5 py-1 bg-background text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded-md border border-border shrink-0">Low</span>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderTaskRow = (task: any, isOverdue = false, isToday = false) => (
    <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-background transition-colors group cursor-pointer">
      <div className="flex-1 min-w-0 flex items-start gap-3">
        <Button variant="outline" size="icon" className="w-5 h-5 mt-0.5 shrink-0 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-transparent hover:border-primary dark:hover:border-blue-400 hover:text-primary dark:hover:text-primary/70 transition-colors">
          <Icons.check size={14} strokeWidth={3} />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground group-hover:text-primary dark:group-hover:text-primary/70 transition-colors truncate">
            <span className="text-muted-foreground font-normal mr-1.5 shrink-0">[{task.projectCode}-{task.taskKey?.split('-')[1]}]</span>
            {task.title}
          </p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md flex items-center gap-1.5 max-w-[150px] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
              <span className="truncate">{task.projectName}</span>
            </span>
            {renderPriority(task.priority)}
            {task.dueDate && (
              <span className={`text-[11px] font-bold shrink-0 ${isOverdue ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md' : isToday ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md' : 'text-muted-foreground'}`}>
                {isOverdue ? t('tasks.label_overdue') : isToday ? t('tasks.label_today') : t('tasks.label_due')}{formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-card border-b border-border shrink-0">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icons.layoutDashboard size={26} className="text-primary" />
          {t('tasks.dashboard_title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('tasks.dashboard_desc')}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 dark:bg-blue-950/50 text-primary dark:text-primary/70 rounded-xl flex items-center justify-center shrink-0">
                <Icons.listTodo size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t('tasks.stat_pending')}</p>
                <p className="text-2xl font-black text-foreground">{isLoading ? '-' : stats.pendingCount}</p>
              </div>
            </div>
            
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                <Icons.alertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t('tasks.stat_urgent')}</p>
                <p className="text-2xl font-black text-foreground">{isLoading ? '-' : stats.urgentCount}</p>
              </div>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <Icons.checkCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t('tasks.stat_done')}</p>
                <p className="text-2xl font-black text-foreground">{isLoading ? '-' : stats.doneCount}</p>
              </div>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shrink-0">
                <Icons.briefcase size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t('tasks.stat_projects')}</p>
                <p className="text-2xl font-black text-foreground">{isLoading ? '-' : stats.projectCount}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4 mt-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card border border-border animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* Left Column: Priority List */}
              <div className="flex-1 w-full flex flex-col gap-6">
                
                {stats.pendingCount === 0 && (
                  <div className="bg-card rounded-3xl border border-border border-dashed p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                      <Icons.partyPopper size={36} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('tasks.empty_title')}</h3>
                    <p className="text-muted-foreground">{t('tasks.empty_desc')}</p>
                  </div>
                )}

                {overdue.length > 0 && (
                  <div className="bg-card rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm overflow-hidden">
                    <div className="bg-rose-50 dark:bg-rose-950/30 px-5 py-3 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                        <Icons.alertTriangle size={16} /> {t('tasks.group_overdue')}
                      </h3>
                      <span className="bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-xs font-black px-2 py-0.5 rounded-full">{overdue.length}</span>
                    </div>
                    <div className="divide-y divide-border">
                      {overdue.map(t => renderTaskRow(t, true, false))}
                    </div>
                  </div>
                )}

                {today.length > 0 && (
                  <div className="bg-card rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm overflow-hidden">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 px-5 py-3 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <Icons.sun size={16} /> {t('tasks.group_today')}
                      </h3>
                      <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black px-2 py-0.5 rounded-full">{today.length}</span>
                    </div>
                    <div className="divide-y divide-border">
                      {today.map(t => renderTaskRow(t, false, true))}
                    </div>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="bg-background px-5 py-3 border-b border-border flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Icons.calendar size={16} /> {t('tasks.group_upcoming')}
                      </h3>
                      <span className="bg-slate-200 dark:bg-slate-700 text-muted-foreground dark:text-slate-200 text-xs font-black px-2 py-0.5 rounded-full">{upcoming.length}</span>
                    </div>
                    <div className="divide-y divide-border">
                      {upcoming.map(t => renderTaskRow(t))}
                    </div>
                  </div>
                )}

                {noDate.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <div className="bg-background px-5 py-3 border-b border-border flex items-center justify-between">
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Icons.clock size={16} /> {t('tasks.group_backlog')}
                      </h3>
                      <span className="bg-slate-200 dark:bg-slate-700 text-muted-foreground dark:text-slate-200 text-xs font-black px-2 py-0.5 rounded-full">{noDate.length}</span>
                    </div>
                    <div className="divide-y divide-border">
                      {noDate.map(t => renderTaskRow(t))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Workload by Project */}
              {projectWorkloads.length > 0 && (
                <div className="w-full lg:w-96 shrink-0 bg-card rounded-3xl border border-border shadow-sm p-6">
                  <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <Icons.pieChart size={20} className="text-primary" />
                    {t('tasks.workload_title')}
                  </h3>
                  
                  <div className="flex flex-col gap-5">
                    {projectWorkloads.map(pw => {
                      const percent = pw.total > 0 ? Math.round((pw.done / pw.total) * 100) : 0;
                      return (
                        <div key={pw.id} className="group cursor-pointer">
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{pw.name}</p>
                              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{pw.total - pw.done} {t('tasks.pending_suffix')}</p>
                            </div>
                            <span className="text-xs font-black text-foreground bg-muted px-2 py-1 rounded-lg">
                              {percent}%
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
