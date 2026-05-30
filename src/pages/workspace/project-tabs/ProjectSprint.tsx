import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Zap, Target, Clock, CheckCircle2, GripVertical, BookOpen,
  Bug, SquareCheck, CircleDot, Play, AlertCircle,
} from 'lucide-react';
import { sprintService, type Sprint } from '../../../services/sprint.service';
// Removed useAppDispatch
import defaultMan from '../../../assets/avatar_def_man.png';

interface ProjectSprintProps {
  projectId: string;
  currentProject: any;
}

import { SortableTaskCard } from './components/SortableTaskCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Progress } from '../../../components/ui/Progress';

import { DroppableColumn } from './components/DroppableColumn';
import { Icons } from '../../../assets/icons';
import { useTasksQuery, useUpdateTaskStatusMutation, useDeleteTaskMutation, useCreateTaskMutation } from '../../../hooks/api/useTasks';
import { InlineTaskCreator } from '../../../components/workspace/InlineTaskCreator';


// ─── Main Component ────────────────────────────────────────────────────────
export default function ProjectSprint({ projectId, currentProject }: ProjectSprintProps) {
  const updateStatusMutation = useUpdateTaskStatusMutation(projectId);
  const createTaskMutation = useCreateTaskMutation(projectId);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddTask, setShowAddTask] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const boardColumns = currentProject?.boardColumns || [];

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const sprint = await sprintService.getActiveSprint(projectId).catch(() => null);
      setActiveSprint(sprint);
      if (sprint) {
        const sprintTaskData = await sprintService.getSprintTasks(projectId, sprint.id);
        setTasks(sprintTaskData);
      }
    } catch (e) {
      setError('Không thể tải dữ liệu sprint');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = String(active.id);
    let overColumnId = String(over.id);

    // Check if dropped over a task → use that task's column
    const isOverTask = tasks.some(t => t.id === overColumnId);
    if (isOverTask) {
      const overTask = tasks.find(t => t.id === overColumnId);
      const col = boardColumns.find((c: any) => c.mappedStatusIds?.includes(overTask?.statusId));
      if (col) overColumnId = col.id || col.name;
    }

    const draggedTask = tasks.find(t => t.id === activeTaskId);
    if (!draggedTask) return;

    const sourceCol = boardColumns.find((c: any) => c.mappedStatusIds?.includes(draggedTask.statusId));
    const sourceColId = sourceCol?.id || sourceCol?.name;

    if (sourceColId !== overColumnId) {
      const targetCol = boardColumns.find((c: any) => (c.id || c.name) === overColumnId);
      const targetStatusId = targetCol?.mappedStatusIds?.[0];

      if (targetStatusId && targetStatusId !== draggedTask.statusId) {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, statusId: targetStatusId } : t));
        try {
          await updateStatusMutation.mutateAsync({ taskId: draggedTask.id, statusId: targetStatusId });
          await load(true); // refresh metrics silently
        } catch (e) {
          console.error('Failed to update status', e);
          setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, statusId: draggedTask.statusId } : t));
        }
      }
    }
  };

  const deleteTaskMutation = useDeleteTaskMutation(currentProject?.id || '');

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    if (updates._delete) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      try {
        await deleteTaskMutation.mutateAsync(taskId);
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
      return;
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const handleAddTask = async (columnId: string, title: string, type: string, assignee: any, dueDate: string) => {
    if (!title.trim() || !currentProject || !activeSprint) return;
    const columns = currentProject.boardColumns || [];
    const column = columns.find((c: any) => (c.id || c.name) === columnId) || columns[0];
    
    const statusId = column?.defaultStatusId || column?.mappedStatusIds?.[0] || '';

    try {
      const res = await createTaskMutation.mutateAsync({
        projectId: currentProject.id,
        title: title.trim(),
        statusId: statusId,
        type: type,
        assigneeId: assignee && assignee !== 'automatic' ? assignee.id : null,
        dueDate: dueDate ? `${dueDate}T00:00:00` : null
      });
      
      if (res?.id) {
        await sprintService.moveTaskToSprint(res.id, activeSprint.id);
      }
      
      setShowAddTask(null);
      
      load(true); // Reload sprint tasks silently
    } catch (err) {
      console.error("Failed to add task via UI:", err);
    }
  };

  const getRemainingDays = (endDate?: string) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { text: 'Quá hạn', color: 'text-rose-600' };
    if (diff === 0) return { text: 'Hôm nay', color: 'text-orange-600' };
    return { text: `${diff} ngày còn lại`, color: 'text-slate-500' };
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-6 w-48 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md ml-2" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between mb-1.5">
              <Skeleton className="h-3 w-20 rounded-sm" />
              <Skeleton className="h-3 w-32 rounded-sm" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>

        {/* Board Columns Skeleton */}
        <div className="flex gap-5 overflow-x-auto p-6 items-start flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-3xl border border-slate-200/60 w-[320px] shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between px-2 mb-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-4 w-6 rounded-full" />
                </div>
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                {i % 2 === 0 && <Skeleton className="h-24 w-full rounded-2xl" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── No active sprint ─────────────────────────────────────────────────────
  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center">
          <Zap size={36} className="text-violet-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-black text-slate-700">Không có Sprint đang chạy</h3>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Vào tab Backlog để tạo và bắt đầu một sprint.
          </p>
        </div>
      </div>
    );
  }

  const remaining = getRemainingDays(activeSprint.endDate);
  const progressPct = activeSprint.totalTasks > 0
    ? Math.round((activeSprint.completedTasks / activeSprint.totalTasks) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Sprint Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Active</span>
              <h2 className="text-xl font-black text-slate-800">{activeSprint.name}</h2>
              {activeSprint.goal && (
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Target size={12} /> {activeSprint.goal}
                </span>
              )}
              <span className="text-xs text-slate-400 font-semibold ml-2">
                {activeSprint.startDate ? new Date(activeSprint.startDate).toLocaleDateString('vi-VN') : '—'}
                {' → '}
                {activeSprint.endDate ? new Date(activeSprint.endDate).toLocaleDateString('vi-VN') : '—'}
              </span>
              {remaining && (
                <span className={`text-xs font-bold flex items-center gap-1 ${remaining.color}`}>
                  <Clock size={12} /> {remaining.text}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
            <span>Sprint Progress</span>
            <span>
              {activeSprint.completedTasks}/{activeSprint.totalTasks} tasks · {progressPct}%
            </span>
          </div>
          <Progress value={progressPct} className="mt-1" />
        </div>
      </div>

      {/* Board */}
      {boardColumns.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-slate-400 font-semibold">
          Cấu hình board columns trong Project Settings trước.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-5 overflow-x-auto p-6 items-start flex-1">
            {boardColumns.map((column: any) => {
              const colTasks = tasks.filter((t: any) => column.mappedStatusIds?.includes(t.statusId));
              const columnId = column.id || column.name;
              return (
                <DroppableColumn 
                  key={columnId} 
                  column={column} 
                  tasks={colTasks}
                  projectMembers={currentProject?.members || []}
                  onTaskUpdate={handleTaskUpdate}
                >
                  {/* Add task option */}
                  <div className="shrink-0 mt-2">
                    {showAddTask === columnId ? (
                      <InlineTaskCreator
                        onAdd={(title, type, assignee, dueDate) => handleAddTask(columnId, title, type, assignee, dueDate)}
                        onCancel={() => setShowAddTask(null)}
                        projectMembers={currentProject?.members || []}
                      />
                  ) : (
                    <button
                      onClick={() => setShowAddTask(columnId)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/20 rounded-2xl text-slate-400 hover:text-blue-600 text-xs font-bold transition-all mt-2"
                    >
                      <Icons.plus size={14} />
                      <span>Add Issue</span>
                      </button>
                    )}
                  </div>
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && <SortableTaskCard task={activeTask} isOverlay projectMembers={currentProject?.members || []} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
