import { useState, useEffect, useRef } from 'react';
import { Icons } from '../../../assets/icons';
import {
  Plus, ChevronDown, CheckSquare, Zap, AlertCircle, User, Calendar, Search, X, CornerDownLeft
} from 'lucide-react';
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskStatusMutation, useDeleteTaskMutation } from '../../../hooks/api/useTasks';
import defaultMan from '../../../assets/avatar_def_man.png';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

interface ProjectBoardProps {
  currentProject: any;
}

import { createPortal } from 'react-dom';
import { SortableTaskCard } from './components/SortableTaskCard';
import { DroppableColumn } from './components/DroppableColumn';
import { InlineTaskCreator } from '../../../components/workspace/InlineTaskCreator';

export default function ProjectBoard({ currentProject }: ProjectBoardProps) {
  const { data: tasksData } = useTasksQuery(currentProject?.id, { size: 1000 });
  const tasksList = tasksData?.content || [];
  const [boardTasks, setBoardTasks] = useState(tasksList);
  
  const updateStatusMutation = useUpdateTaskStatusMutation(currentProject?.id);
  const createTaskMutation = useCreateTaskMutation(currentProject?.id);

  useEffect(() => {
    setBoardTasks(tasksList);
  }, [tasksList]);

  const deleteTaskMutation = useDeleteTaskMutation(currentProject?.id || '');

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    if (updates._delete) {
      setBoardTasks(prev => prev.filter(t => t.id !== taskId));
      try {
        await deleteTaskMutation.mutateAsync(taskId);
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
      return;
    }
    setBoardTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require moving 5px before drag starts to allow clicking buttons
      },
    })
  );

  // Removed manual fetchTasksByProject dispatch as useTasksQuery handles it automatically

  const handleAddTask = async (columnId: string, title: string, type: string, assignee: any, dueDate: string) => {
    if (!title.trim() || !currentProject) return;
    const columns = currentProject.boardColumns || [];
    const column = columns.find((c: any) => (c.id || c.name) === columnId) || columns[0];
    
    const statusId = column?.defaultStatusId || column?.mappedStatusIds?.[0] || '';

    try {
      await createTaskMutation.mutateAsync({
        projectId: currentProject.id,
        title: title.trim(),
        statusId: statusId,
        type: type,
        assigneeId: assignee && assignee !== 'automatic' ? assignee.id : null,
        dueDate: dueDate ? `${dueDate}T00:00:00` : null
      });
      
      setShowAddTask(null);
    } catch (err) {
      console.error("Failed to add task via UI:", err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = boardTasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTaskId = active.id;
    let overColumnId = over.id;
    
    // Check if dropped over another task instead of an empty column space
    const isOverTask = boardTasks.some(t => t.id === over.id);
    if (isOverTask) {
       const overTask = boardTasks.find(t => t.id === over.id);
       const targetColumn = (currentProject?.boardColumns || []).find((c: any) => c.mappedStatusIds?.includes(overTask?.statusId));
       if (targetColumn) {
         overColumnId = targetColumn.id || targetColumn.name;
       }
    }

    const draggedTask = boardTasks.find(t => t.id === activeTaskId);
    if (!draggedTask) return;

    const sourceColumn = (currentProject?.boardColumns || []).find((c: any) => c.mappedStatusIds?.includes(draggedTask.statusId));
    const sourceColumnId = sourceColumn?.id || sourceColumn?.name;
    
    if (sourceColumnId !== overColumnId) {
       const targetColumn = (currentProject?.boardColumns || []).find((c: any) => (c.id || c.name) === overColumnId);
       const targetStatusId = targetColumn?.defaultStatusId || targetColumn?.mappedStatusIds?.[0];
       
       if (targetStatusId && targetStatusId !== draggedTask.statusId) {
          // Optimistic UI update
          setBoardTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, statusId: targetStatusId } : t));
          
          try {
              if (draggedTask.id) {
                await updateStatusMutation.mutateAsync({ taskId: draggedTask.id, statusId: targetStatusId });
             }
          } catch(err) {
             console.error("Failed to update status on drag drop:", err);
             // Revert optimistic update on failure
             setBoardTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, statusId: draggedTask.statusId } : t));
          }
       }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 p-6 h-full items-start">
        {(currentProject?.boardColumns || []).map((column: any) => {
          const columnId = column.id || column.name;
          const columnTasks = boardTasks.filter(t => column.mappedStatusIds?.includes(t.statusId));
          
          return (
            <DroppableColumn 
              key={columnId} 
              column={column} 
              tasks={columnTasks}
              projectMembers={currentProject?.users || currentProject?.members || []}
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
        {activeTask ? <SortableTaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
