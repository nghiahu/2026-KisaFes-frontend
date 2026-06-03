import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icons } from '../../../assets/icons';
import { taskService } from '../../../services/task.service';
import TaskDetailView from '../../../components/workspace/TaskDetailView';
import { useUpdateTaskDueDateMutation, useCreateTaskMutation } from '../../../hooks/api/useTasks';
import { InlineTaskCreator } from '../../../components/workspace/InlineTaskCreator';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProjectCalendarProps {
  currentProject: any;
  projectId: string;
}

export default function ProjectCalendar({ currentProject, projectId }: ProjectCalendarProps) {
  const { t } = useLanguage();
  const DAYS_OF_WEEK = [t('calendar.sun'), t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat')];
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  
  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unscheduledSearch, setUnscheduledSearch] = useState('');

  // Inline Task Creation
  const [inlineCreateDate, setInlineCreateDate] = useState<string | null>(null);
  
  // Popover for "+ X more"
  const [morePopoverData, setMorePopoverData] = useState<{ dateStr: string, tasks: any[], top: number, left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filters
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drag state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [dragOverSidebar, setDragOverSidebar] = useState(false);
  const dragCounterRef = useRef<Record<string, number>>({});

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['project-tasks', 'calendar', projectId],
    queryFn: () => taskService.getTasksByProjectId(projectId, { size: 1000 }),
    staleTime: 30000,
  });

  const updateDueDateMutation = useUpdateTaskDueDateMutation(projectId);
  const createTaskMutation = useCreateTaskMutation(projectId);

  const tasks = data?.content || data?.data?.content || [];

  // Derived state for filters
  const members = currentProject?.members || [];
  const statuses = currentProject?.statuses || [];
  const types = ['Task', 'Bug', 'Story', 'Epic', 'Incident', 'Service Request'];

  const filteredTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      if (assigneeFilter && task.assigneeId !== assigneeFilter) return false;
      if (typeFilter && task.type !== typeFilter) return false;
      if (statusFilter && task.statusId !== statusFilter) return false;
      return true;
    });
  }, [tasks, assigneeFilter, typeFilter, statusFilter]);

  const unscheduledTasks = useMemo(() => {
    return filteredTasks.filter((t: any) => !t.dueDate && (!unscheduledSearch || t.title.toLowerCase().includes(unscheduledSearch.toLowerCase())));
  }, [filteredTasks, unscheduledSearch]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    filteredTasks.forEach((task: any) => {
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map.has(dateStr)) map.set(dateStr, []);
        map.get(dateStr)!.push(task);
      }
    });
    return map;
  }, [filteredTasks]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid: { date: Date; isCurrentMonth: boolean }[] = [];
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      grid.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    const totalCells = grid.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (grid.length < totalCells) {
      grid.push({ date: new Date(year, month + 1, nextMonthDay++), isCurrentMonth: false });
    }
    
    return grid;
  };

  const grid = generateCalendarGrid();
  const today = new Date();

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, task: any) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverCell(null);
    setDragOverSidebar(false);
    dragCounterRef.current = {};
  };

  const handleCellDragEnter = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    dragCounterRef.current[dateStr] = (dragCounterRef.current[dateStr] || 0) + 1;
    setDragOverCell(dateStr);
  };

  const handleCellDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCellDragLeave = (e: React.DragEvent, dateStr: string) => {
    dragCounterRef.current[dateStr] = (dragCounterRef.current[dateStr] || 1) - 1;
    if (dragCounterRef.current[dateStr] <= 0) {
      dragCounterRef.current[dateStr] = 0;
      setDragOverCell(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, cellDate: Date, dateStr: string) => {
    e.preventDefault();
    dragCounterRef.current[dateStr] = 0;
    setDragOverCell(null);
    setDraggingTaskId(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const dropDate = new Date(cellDate);
    dropDate.setHours(23, 59, 59);
    const dueDateISO = dropDate.toISOString();

    // Optimistic update: move task to new date immediately
    queryClient.setQueryData(['project-tasks', 'calendar', projectId], (old: any) => {
      if (!old) return old;
      const content = old.content || [];
      return { ...old, content: content.map((t: any) => t.id === taskId ? { ...t, dueDate: dueDateISO } : t) };
    });

    try {
      await updateDueDateMutation.mutateAsync({ taskId, dueDate: dueDateISO });
    } catch (err) {
      console.error('Failed to update task due date', err);
      refetch(); // rollback on error
    }
  };

  const handleSidebarDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSidebar(true);
  };

  const handleSidebarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSidebarDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSidebar(false);
    }
  };

  const handleRemoveDueDate = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSidebar(false);
    setDraggingTaskId(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Optimistic update: remove dueDate immediately
    queryClient.setQueryData(['project-tasks', 'calendar', projectId], (old: any) => {
      if (!old) return old;
      const content = old.content || [];
      return { ...old, content: content.map((t: any) => t.id === taskId ? { ...t, dueDate: null } : t) };
    });

    try {
      await updateDueDateMutation.mutateAsync({ taskId, dueDate: null });
    } catch (err) {
      console.error('Failed to remove task due date', err);
      refetch(); // rollback on error
    }
  };

  // Inline Create
  const handleInlineAdd = async (title: string, type: string, assignee: any, dueDateStr: string, cellDateStr: string) => {
    if (!currentProject?.statuses?.length) return;
    const defaultStatus = currentProject.statuses[0].statusId;
    
    const [year, month, day] = cellDateStr.split('-').map(Number);
    const dropDate = new Date(year, month, day, 23, 59, 59);

    try {
      await createTaskMutation.mutateAsync({
        title,
        projectId,
        type: type,
        statusId: defaultStatus,
        description: '',
        priority: 'Medium',
        storyPoints: 0,
        assigneeId: assignee?.id || null,
        reporterId: currentProject.ownerId,
        dueDate: dropDate.toISOString()
      });
      setInlineCreateDate(null);
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };

  // Click outside for Popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setMorePopoverData(null);
      }
    }
    if (morePopoverData) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [morePopoverData]);

  const renderTaskCard = (task: any, isDraggable = true) => {
    const isDone = (task.statusLabel || '').toLowerCase().includes('done') || (task.statusLabel || '').toLowerCase().includes('hoàn thành');
    const isBeingDragged = draggingTaskId === task.id;
    return (
      <div 
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        onClick={(e) => { if (!draggingTaskId) { e.stopPropagation(); setSelectedTask(task); } }}
        className={`text-[11px] border rounded px-2 py-1 mb-1 cursor-grab active:cursor-grabbing transition-all shadow-sm flex items-center gap-1.5 select-none
          ${isBeingDragged ? 'opacity-40 scale-95' : ''}
          ${isDone 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
            : 'bg-card text-foreground border-border hover:border-blue-300 hover:shadow-md'}
        `}
        title={task.title}
      >
        <div className={`w-2 h-2 rounded-full shrink-0 pointer-events-none ${isDone ? 'bg-emerald-400' : 'bg-blue-400'}`} />
        <span className="font-bold opacity-70 shrink-0 pointer-events-none">[{task.taskKey?.split('-')[1]}]</span>
        <span className={`truncate pointer-events-none ${isDone ? 'line-through opacity-70' : ''}`}>{task.title}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-1 bg-background relative rounded-3xl overflow-hidden border border-border shadow-sm min-h-0">
      
      {/* MAIN CALENDAR AREA */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header & Filters */}
        <div className="px-5 py-4 bg-card border-b border-border shrink-0 z-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select className="appearance-none bg-background border border-border rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
                  <option value="">{t('calendar.assignee')}</option>
                  {members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <Icons.chevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-background border border-border rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="">{t('calendar.type')}</option>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Icons.chevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-background border border-border rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">{t('calendar.status')}</option>
                  {statuses.map((s: any) => <option key={s.statusId} value={s.statusId}>{s.label}</option>)}
                </select>
                <Icons.chevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleToday} className="px-3 py-1.5 text-xs font-bold text-foreground bg-card border border-border hover:bg-background rounded-lg transition-colors shadow-sm">
                {t('calendar.today')}
              </button>
              
              <div className="flex items-center bg-card border border-border rounded-lg shadow-sm overflow-hidden shrink-0">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-background text-muted-foreground transition-colors border-r border-border"><Icons.chevronLeft size={16} /></button>
                <span className="px-3 text-xs font-bold text-foreground w-[110px] text-center">
                  {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                </span>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-background text-muted-foreground transition-colors border-l border-border"><Icons.chevronRight size={16} /></button>
              </div>

              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-1.5 rounded-lg border transition-colors shadow-sm flex items-center justify-center ${isSidebarOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-card border-border text-muted-foreground hover:bg-background'}`}
                title={t('calendar.toggle_unscheduled')}
              >
                {isSidebarOpen ? <Icons.panelRightClose size={18} /> : <Icons.panelRightOpen size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col bg-background">
          {isLoading ? (
            <div className="h-full bg-card animate-pulse rounded-2xl border border-border shadow-sm"></div>
          ) : (
            <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 border-b border-border bg-background/80 shrink-0">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="py-2.5 text-center text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="overflow-y-auto grid grid-cols-7" style={{ gridTemplateRows: `repeat(${Math.ceil(grid.length / 7)}, minmax(140px, 1fr))` }}>
                {grid.map((cell, idx) => {
                  const isToday = isSameDay(cell.date, today);
                  const dateStr = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
                  const dayTasks = tasksByDate.get(dateStr) || [];
                  const displayTasks = dayTasks.slice(0, 2);
                  const overflowCount = dayTasks.length - 2;
                  const isCreatingInline = inlineCreateDate === dateStr;
                  
                  return (
                    <div 
                      key={idx} 
                    className={`group relative min-h-[140px] border-r border-b border-border p-2 flex flex-col transition-colors
                        ${!cell.isCurrentMonth ? 'bg-background/50' : 'bg-card'}
                        ${dragOverCell === dateStr ? '!bg-blue-50 ring-2 ring-inset ring-blue-400' : ''}
                        ${cell.isCurrentMonth && dragOverCell !== dateStr ? 'hover:bg-background/30' : ''}
                        ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                        ${idx >= grid.length - 7 ? 'border-b-0' : ''}
                      `}
                      onDragEnter={(e) => handleCellDragEnter(e, dateStr)}
                      onDragOver={handleCellDragOver}
                      onDragLeave={(e) => handleCellDragLeave(e, dateStr)}
                      onDrop={(e) => handleDrop(e, cell.date, dateStr)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold 
                            ${isToday ? 'bg-blue-600 text-white shadow-sm' : cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                          `}
                        >
                          {cell.date.getDate()}
                        </div>
                        <button 
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineCreateDate(dateStr);
                          }}
                          title={t('calendar.create_work_item')}
                        >
                          <Icons.plus size={14} />
                        </button>
                      </div>
                      
                      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                        {displayTasks.map(t => <div key={t.id}>{renderTaskCard(t)}</div>)}
                        
                        {overflowCount > 0 && (
                          <button 
                            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted text-left px-2 py-1 rounded transition-colors w-full mt-0.5"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMorePopoverData({
                                dateStr: cell.date.toLocaleDateString(),
                                tasks: dayTasks,
                                top: rect.bottom + 4,
                                left: rect.left
                              });
                            }}
                          >
                            {overflowCount} {t('calendar.more')}
                          </button>
                        )}
                      </div>

                      {isCreatingInline && (
                        <div 
                          className="absolute top-10 z-[60] w-[280px] animate-in fade-in zoom-in-95 duration-200 shadow-xl rounded-xl ring-1 ring-black/5"
                          style={{
                            ...(idx % 7 >= 4 ? { right: '8px' } : { left: '8px' })
                          }}
                        >
                          <InlineTaskCreator 
                            projectMembers={members}
                            onAdd={(title, type, assignee, dueDate) => handleInlineAdd(title, type, assignee, dueDate, dateStr)}
                            onCancel={() => setInlineCreateDate(null)}
                            hideDueDate={true}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UNSCHEDULED WORK SIDEBAR */}
      {isSidebarOpen && (
        <div className="w-[320px] bg-card border-l border-border flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-300 z-20 shadow-xl">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground text-lg">{t('calendar.unscheduled_work')}</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
              <Icons.x size={18} />
            </button>
          </div>
          
          <div className="p-4 flex-1 flex flex-col overflow-hidden bg-background/50">
            <p className="text-xs text-muted-foreground mb-4 font-medium leading-relaxed">
              {t('calendar.drag_instruction')}
            </p>
            
            <div className="relative mb-4">
              <Icons.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder={t('calendar.search_unscheduled')} 
                className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-card"
                value={unscheduledSearch}
                onChange={(e) => setUnscheduledSearch(e.target.value)}
              />
            </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-1"
            onDragEnter={handleSidebarDragEnter}
            onDragOver={handleSidebarDragOver}
            onDragLeave={handleSidebarDragLeave}
            onDrop={handleRemoveDueDate}
          >
              {unscheduledTasks.length === 0 ? (
                <div 
                  className={`border border-dashed rounded-xl p-6 text-center transition-colors ${
                    dragOverSidebar ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' : 'bg-muted/50 border-slate-300'
                  }`}
                >
                  <p className="font-bold text-sm text-foreground mb-2">{t('calendar.all_scheduled')}</p>
                  <p className="text-xs text-muted-foreground">{t('calendar.remove_instruction')}</p>
                </div>
              ) : (
                <div 
                  className={`flex flex-col gap-2 min-h-full rounded-xl p-2 transition-colors ${
                    dragOverSidebar ? 'bg-blue-50 ring-2 ring-blue-300' : ''
                  }`}
                >
                  {unscheduledTasks.map((t: any) => <div key={t.id}>{renderTaskCard(t)}</div>)}
                </div>
              )}
          </div>
          </div>
        </div>
      )}

      {/* Overflow Popover */}
      {morePopoverData && createPortal(
        <div 
          ref={popoverRef}
          className="fixed bg-card border border-border shadow-xl rounded-xl p-3 z-[9999] w-[260px] animate-in zoom-in-95 duration-150"
          style={{ top: Math.min(morePopoverData.top, window.innerHeight - 300), left: morePopoverData.left }}
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <h4 className="font-bold text-foreground text-sm">{morePopoverData.dateStr}</h4>
            <button onClick={() => setMorePopoverData(null)} className="text-muted-foreground hover:text-muted-foreground"><Icons.x size={14} /></button>
          </div>
          <div className="flex flex-col max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
            {morePopoverData.tasks.map(t => <div key={t.id}>{renderTaskCard(t)}</div>)}
          </div>
        </div>,
        document.body
      )}

      {selectedTask && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedTask(null)}
          />
          <div className="relative bg-card w-full max-w-[1000px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex-1 flex overflow-hidden">
              <TaskDetailView
                task={selectedTask}
                currentProject={currentProject}
                onClose={() => setSelectedTask(null)}
                onUpdateTaskLocally={(taskId, updates) => {
                  setSelectedTask((prev: any) => (prev && prev.id === taskId ? { ...prev, ...updates } : prev));
                  refetch();
                }}
                onDeleteRequest={() => {
                  refetch();
                  setSelectedTask(null);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
