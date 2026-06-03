import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '../../assets/icons';
import { taskService } from '../../services/task.service';
import { useNavigate } from 'react-router-dom';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function GlobalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-tasks', 'calendar'],
    queryFn: () => taskService.getMyTasks({ size: 1000 }), // Get as many as possible
    staleTime: 30000,
  });

  const tasks = data?.content || data?.data?.content || [];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      grid.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month padding (to complete 35 or 42 grid cells)
    const totalCells = grid.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (grid.length < totalCells) {
      grid.push({
        date: new Date(year, month + 1, nextMonthDay++),
        isCurrentMonth: false,
      });
    }
    
    return grid;
  };

  const grid = generateCalendarGrid();
  const today = new Date();

  // Helper to check if two dates are same day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Organize tasks by date
  const tasksByDate = new Map<string, any[]>();
  
  tasks.forEach((task: any) => {
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!tasksByDate.has(dateStr)) {
        tasksByDate.set(dateStr, []);
      }
      tasksByDate.get(dateStr)!.push(task);
    }
  });

  const handleTaskClick = (task: any) => {
    navigate(`/workspace/projects/${task.projectId}`, { 
      state: { openTask: task, tab: 'list' } 
    });
  };

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-card border-b border-border shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Icons.calendar size={26} className="text-blue-600" />
              Calendar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Lịch biểu tổng quát chứa tất cả các công việc của bạn.</p>
          </div>

          {/* Calendar Controls */}
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-foreground w-[160px] text-right">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center bg-card border border-border rounded-lg shadow-sm overflow-hidden shrink-0">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-background text-muted-foreground transition-colors border-r border-border"
              >
                <Icons.chevronLeft size={20} />
              </button>
              <button 
                onClick={handleToday}
                className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-background transition-colors"
              >
                Today
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-background text-muted-foreground transition-colors border-l border-border"
              >
                <Icons.chevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col">
        {isLoading ? (
          <div className="h-full bg-background animate-pulse rounded-2xl border border-border"></div>
        ) : error ? (
          <div className="h-full bg-card rounded-2xl border border-border flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-3">
              <Icons.alertTriangle size={24} />
            </div>
            <p className="text-muted-foreground text-sm">Failed to load tasks</p>
            <button onClick={() => refetch()} className="mt-3 text-sm text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-border bg-background shrink-0">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Days grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
              {grid.map((cell, idx) => {
                const isToday = isSameDay(cell.date, today);
                const dateStr = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
                const dayTasks = tasksByDate.get(dateStr) || [];
                
                return (
                  <div 
                    key={idx} 
                    className={`min-h-[100px] border-r border-b border-border p-2 flex flex-col transition-colors
                      ${!cell.isCurrentMonth ? 'bg-background/50' : 'bg-card hover:bg-background/30'}
                      ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                      ${idx >= grid.length - 7 ? 'border-b-0' : ''}
                    `}
                  >
                    {/* Date header */}
                    <div className="flex justify-between items-start mb-1.5">
                      <div 
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold 
                          ${isToday ? 'bg-blue-600 text-white shadow-sm' : cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                        `}
                      >
                        {cell.date.getDate()}
                      </div>
                    </div>
                    
                    {/* Tasks container */}
                    <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1">
                      {dayTasks.map(task => {
                        const isDone = (task.statusLabel || '').toLowerCase().includes('done') || (task.statusLabel || '').toLowerCase().includes('hoàn thành');
                        return (
                          <div 
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className={`text-xs border rounded-md px-2 py-1.5 truncate cursor-pointer transition-colors shadow-sm
                              ${isDone 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-200'}
                            `}
                            title={task.title}
                          >
                            <span className="font-bold mr-1 opacity-70">[{task.projectCode}-{task.taskKey?.split('-')[1]}]</span>
                            <span className={isDone ? 'line-through opacity-70' : ''}>{task.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
