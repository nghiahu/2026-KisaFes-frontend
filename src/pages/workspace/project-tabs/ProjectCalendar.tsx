import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../../assets/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateTaskDueDate, fetchTasksByProject, createTask } from '../../../store/slices/taskSlice';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface ProjectCalendarProps {
  currentProject: any;
  tasks: any[];
}

// Format date to YYYY-MM-DD in local time
const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- Sub-components ---

const QuickAddPopover = ({ date, pos, onClose, onSubmit, projectMembers }: any) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Task');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const getTypeIcon = (t: string) => {
    switch (t.toLowerCase()) {
      case 'epic': return <Icons.zap size={12} className="text-purple-500" />;
      case 'story': return <Icons.bookmark size={12} className="text-green-500" />;
      case 'bug': return <Icons.bug size={12} className="text-red-500" />;
      default: return <Icons.checkSquare size={12} className="text-blue-500" />;
    }
  };

  const selectedAssignee = projectMembers?.find((m: any) => m.id === assigneeId);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div 
        className="fixed bg-white border border-blue-400 shadow-2xl rounded-md z-[9999] flex flex-col p-3 w-[320px] animate-in zoom-in-95 duration-150"
        style={{ top: pos.top, left: pos.left }}
        onClick={e => e.stopPropagation()}
      >
        <textarea 
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full resize-none text-sm outline-none placeholder:text-slate-400 mb-3"
          rows={2}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (title.trim()) onSubmit({ title, type, assigneeId });
            }
          }}
        />
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 px-1.5 py-1 rounded">
              {getTypeIcon(type)} {type} <Icons.chevronDown size={12} className="text-slate-400" />
            </button>
            <button className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              {selectedAssignee?.avatar ? (
                <img src={selectedAssignee.avatar} alt="" className="w-full h-full rounded-full" />
              ) : (
                <Icons.user size={12} />
              )}
            </button>
          </div>
          <button 
            disabled={!title.trim()}
            onClick={() => onSubmit({ title, type, assigneeId })}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 font-bold text-xs rounded hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            Create <Icons.cornerDownLeft size={12} className="opacity-50" />
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

const CalendarDroppableDay = ({ date, isCurrentMonth, tasks, onTaskClick, onQuickAdd }: { date: Date, isCurrentMonth: boolean, tasks: any[], onTaskClick: (task: any) => void, onQuickAdd: (date: Date, e: React.MouseEvent) => void }) => {
  const [showMore, setShowMore] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const dateStr = formatDateStr(date);
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: { type: 'calendar-day', date: dateStr }
  });

  const isToday = dateStr === formatDateStr(new Date());

  const MAX_VISIBLE = 2;
  const visibleTasks = tasks.slice(0, MAX_VISIBLE);
  const hiddenCount = tasks.length - MAX_VISIBLE;

  return (
    <div
      ref={setNodeRef}
      className={`group min-h-[120px] border-b border-r border-slate-200 p-2 flex flex-col gap-1 transition-colors relative ${
        !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'
      } ${isOver ? 'bg-blue-50/50 ring-2 ring-blue-300 ring-inset' : ''}`}
    >
      <div className="flex justify-between items-center mb-1 shrink-0">
        <span className={`text-xs font-semibold ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-600 ml-1'}`}>
          {date.getDate()}
        </span>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onQuickAdd(date, e); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"
            title="Create task"
          >
            <Icons.plus size={14} />
          </button>
          {date.getDate() === 1 && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              {date.toLocaleString('default', { month: 'short' })}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-1 overflow-y-hidden">
        {visibleTasks.map(task => (
          <ScheduledTaskPill key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
        {hiddenCount > 0 && (
          <div 
            className="text-[12px] font-medium text-slate-600 hover:text-slate-800 hover:underline cursor-pointer px-1 mt-auto pt-1 pb-0.5 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
              if (rect) {
                const popupWidth = 260;
                let left = rect.left - 4;
                if (left + popupWidth > window.innerWidth) {
                  left = window.innerWidth - popupWidth - 10;
                }
                setPopoverPos({ top: rect.top - 8, left: Math.max(10, left) });
                setShowMore(true);
              }
            }}
          >
            {hiddenCount} more
          </div>
        )}
      </div>

      {showMore && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setShowMore(false); }} />
          <div 
            className="fixed bg-white border border-slate-200 shadow-2xl rounded-xl z-[9999] flex flex-col w-[260px]"
            style={{ top: popoverPos.top, left: popoverPos.left }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-black text-slate-800">
                {date.toLocaleString('default', { month: 'short', day: 'numeric' })}
              </span>
              <button onClick={() => setShowMore(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><Icons.x size={16} className="text-slate-500 hover:text-slate-800" /></button>
            </div>
            <div className="p-3 flex flex-col gap-1.5 max-h-[300px] overflow-y-auto scrollbar-thin">
              {tasks.map(task => (
                <ScheduledTaskPill key={task.id} task={task} onClick={() => { setShowMore(false); onTaskClick(task); }} />
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

const ScheduledTaskPill = ({ task, onClick }: { task: any, onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `scheduled-${task.id}`,
    data: { type: 'scheduled-task', task }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const getStatusColor = (status: string) => {
    if (status?.toLowerCase().includes('done') || status === 'Resolved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (status?.toLowerCase().includes('progress')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`text-[10px] font-semibold px-2 py-1 rounded-[4px] border truncate cursor-grab active:cursor-grabbing hover:brightness-95 transition-all ${getStatusColor(task.status)}`}
      title={task.title}
    >
      <span className="mr-1 opacity-60 font-bold">{task.taskKey || task.id}</span>
      {task.title}
    </div>
  );
};

const UnscheduledTaskCard = ({ task }: { task: any }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unscheduled-${task.id}`,
    data: { type: 'unscheduled-task', task }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm hover:border-blue-400 cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="text-sm font-semibold text-slate-800 mb-2 leading-snug">{task.title}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
           <span className="text-[10px] font-bold text-slate-500">{task.taskKey || task.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
             {task.status || 'To Do'}
          </span>
          {task.assigneeAvatar && (
            <img src={task.assigneeAvatar} alt="" className="w-5 h-5 rounded-full border border-slate-200" />
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function ProjectCalendar({ currentProject, tasks: initialTasks }: ProjectCalendarProps) {
  const dispatch = useAppDispatch();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localTasks, setLocalTasks] = useState(initialTasks);
  const [activeDragTask, setActiveDragTask] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
  const [quickAddPos, setQuickAddPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

  const handleQuickAddOpen = (date: Date, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect();
    if (rect) {
      setQuickAddPos({ top: rect.bottom + 5, left: Math.min(rect.left - 260, window.innerWidth - 330) });
      setQuickAddDate(date);
    }
  };

  const handleQuickAddSubmit = async (data: any) => {
    if (!quickAddDate || !currentProject) return;
    
    const dueDateStr = `${formatDateStr(quickAddDate)}T00:00:00`;
    setQuickAddDate(null);
    
    try {
      await dispatch(createTask({
        title: data.title,
        projectId: currentProject.id,
        type: data.type,
        dueDate: dueDateStr,
        assigneeId: data.assigneeId
      })).unwrap();
      
      dispatch(fetchTasksByProject({ projectId: currentProject.id, params: { size: 1000 } }));
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  // Calendar Grid Generation
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    // Pad previous month days (Start from Monday)
    let startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 0 is Mon, 6 is Sun
    for (let i = startDayOfWeek; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Pad next month days to complete 6 rows (42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Drag and Drop Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskData = active.data.current?.task;
    if (taskData) {
      setActiveDragTask(taskData);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over || !active.data.current?.task) return;

    const task = active.data.current.task;
    const dropTargetId = over.id as string; // 'YYYY-MM-DD' or 'unscheduled-sidebar'
    
    // Check if drop target is a calendar day
    const isDateTarget = /^\d{4}-\d{2}-\d{2}$/.test(dropTargetId);
    
    let newDueDateStr: string | null = null;
    if (isDateTarget) {
      newDueDateStr = `${dropTargetId}T00:00:00`;
    }

    // Avoid updating if the date didn't actually change
    const oldDateStr = task.dueDate ? task.dueDate.substring(0, 10) : null;
    if (isDateTarget && oldDateStr === dropTargetId) return;

    // Optimistic Update
    setLocalTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, dueDate: newDueDateStr } : t
    ));

    try {
      if (task.dbId) {
        await dispatch(updateTaskDueDate({ taskId: task.dbId, dueDate: newDueDateStr })).unwrap();
        // Optionally refresh
        dispatch(fetchTasksByProject({ projectId: currentProject.id, params: { size: 1000 } }));
      }
    } catch (err) {
      console.error('Failed to update due date:', err);
      // Rollback
      setLocalTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, dueDate: task.dueDate } : t
      ));
    }
  };

  // Categorize tasks
  const scheduledTasks = localTasks.filter(t => t.dueDate);
  const unscheduledTasks = localTasks.filter(t => !t.dueDate);

  // Unscheduled sidebar droppable
  const { setNodeRef: setSidebarRef, isOver: isSidebarOver } = useDroppable({
    id: 'unscheduled-sidebar',
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Icons.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search calendar" 
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all w-[240px]"
              />
            </div>
            
            {/* Filters placeholders */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Assignee <Icons.chevronDown size={14} />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Type <Icons.chevronDown size={14} />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Status <Icons.chevronDown size={14} />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                More filters <Icons.chevronDown size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button onClick={handleToday} className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors mr-2">
                Today
              </button>
              <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={handlePrevMonth} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"><Icons.chevronLeft size={16} /></button>
                <div className="px-4 py-1.5 text-sm font-bold text-slate-800 min-w-[120px] text-center border-l border-r border-slate-200">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextMonth} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"><Icons.chevronRight size={16} /></button>
              </div>
            </div>
            
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Month <Icons.chevronDown size={14} />
            </button>
            {!showSidebar && (
              <button 
                onClick={() => setShowSidebar(true)} 
                className="flex items-center p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors ml-2"
                title="Show unscheduled work"
              >
                <Icons.calendarPlus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Split */}
        <div className="flex flex-1 min-h-0">
          {/* Calendar Grid Area */}
          <div className="flex-1 flex flex-col h-full p-6 bg-slate-50/50 min-w-0">
            <div className="bg-white rounded-xl border-t border-l border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 shrink-0 sticky top-0 z-10">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="py-2.5 text-center text-xs font-bold text-slate-600 border-r border-slate-200 bg-slate-50/50">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Grid Cells */}
                <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(120px,auto)]">
                {daysInMonth.map((date, i) => {
                  const dateStr = formatDateStr(date);
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const dayTasks = scheduledTasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
                  
                  return (
                    <CalendarDroppableDay 
                      key={dateStr}
                      date={date}
                      isCurrentMonth={isCurrentMonth}
                      tasks={dayTasks}
                      onTaskClick={(t) => console.log('Clicked', t)}
                      onQuickAdd={handleQuickAddOpen}
                    />
                  );
                })}
                </div>
              </div>
            </div>
          </div>

          {/* Unscheduled Sidebar */}
          {showSidebar && (
            <div 
              ref={setSidebarRef}
              className={`w-[320px] bg-white border-l border-slate-200 flex flex-col shrink-0 transition-colors ${isSidebarOver ? 'bg-slate-50' : ''}`}
            >
              <div className="p-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-slate-800">Unscheduled work</h3>
                  <button onClick={() => setShowSidebar(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"><Icons.x size={18} /></button>
                </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Drag each work item onto the calendar to set a due date for the work.
              </p>
              <input 
                type="text" 
                placeholder="Search unscheduled items" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer hover:text-slate-800 transition-colors">
                  Most recent <Icons.chevronDown size={12} />
                </span>
                <button className="text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:text-slate-800 transition-colors">
                  <Icons.filter size={12} /> Filters
                </button>
              </div>
              
              {unscheduledTasks.map(task => (
                <UnscheduledTaskCard key={task.id} task={task} />
              ))}
              
              {unscheduledTasks.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No unscheduled tasks found.
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragTask ? (
          <div className="rotate-2 scale-105 shadow-2xl">
            <UnscheduledTaskCard task={activeDragTask} />
          </div>
        ) : null}
      </DragOverlay>

      {quickAddDate && (
        <QuickAddPopover
          date={quickAddDate}
          pos={quickAddPos}
          onClose={() => setQuickAddDate(null)}
          onSubmit={handleQuickAddSubmit}
          projectMembers={currentProject?.members || currentProject?.users || []}
        />
      )}
    </DndContext>
  );
}
