import { useState, useEffect } from 'react';
import { Icons } from '../../../assets/icons';
import { useAppDispatch } from '../../../store/hooks';
import { createTask, fetchTasksByProject, updateTaskStatus } from '../../../store/slices/taskSlice';
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
  tasks: any[];
}

import { createPortal } from 'react-dom';
import { updateTaskTitle, updateTaskAssignee, updateTaskPriority, updateTaskDueDate } from '../../../store/slices/taskSlice';

const PRIORITIES = [
  { label: 'Highest', icon: <Icons.chevronsUp size={12} className="text-rose-500" />, color: 'text-rose-600' },
  { label: 'High', icon: <Icons.chevronUp size={12} className="text-orange-500" />, color: 'text-orange-500' },
  { label: 'Medium', icon: <Icons.equal size={12} strokeWidth={3} className="text-amber-500" />, color: 'text-amber-500' },
  { label: 'Low', icon: <Icons.chevronDown size={12} className="text-blue-400" />, color: 'text-blue-400' },
  { label: 'Lowest', icon: <Icons.chevronsDown size={12} className="text-slate-400" />, color: 'text-slate-400' },
];

const getPriorityColor = (priority: string) => {
  const p = PRIORITIES.find(x => x.label?.toLowerCase() === (priority || '').toLowerCase());
  return p ? p.color : 'text-slate-500';
};
const getPriorityIcon = (priority: string) => {
  const p = PRIORITIES.find(x => x.label?.toLowerCase() === (priority || '').toLowerCase());
  return p ? p.icon : <Icons.equal size={12} strokeWidth={3} className="text-amber-500" />;
};

const SortableTask = ({ task, isOverlay = false, projectMembers = [], onTaskUpdate }: { task: any, isOverlay?: boolean, projectMembers?: any[], onTaskUpdate?: (id: string, updates: any) => void }) => {
  const dispatch = useAppDispatch();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: task });
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);

  const [showAssignee, setShowAssignee] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneePos, setAssigneePos] = useState({ top: 0, left: 0 });

  const [showPriority, setShowPriority] = useState(false);
  const [priorityPos, setPriorityPos] = useState({ top: 0, left: 0 });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  const handleTitleSubmit = async () => {
    if (!titleValue.trim() || titleValue.trim() === task.title) {
      setIsEditingTitle(false);
      return;
    }
    const newTitle = titleValue.trim();
    if (onTaskUpdate) onTaskUpdate(task.id, { title: newTitle });
    setIsEditingTitle(false);
    try {
      if (task.dbId) await dispatch(updateTaskTitle({ taskId: task.dbId, title: newTitle })).unwrap();
    } catch (err) {
      console.error(err);
      if (onTaskUpdate) onTaskUpdate(task.id, { title: task.title });
    }
  };

  const handlePrioritySelect = async (priority: string) => {
    setShowPriority(false);
    const old = task.priority;
    if (onTaskUpdate) onTaskUpdate(task.id, { priority });
    try {
      if (task.dbId) await dispatch(updateTaskPriority({ taskId: task.dbId, priority })).unwrap();
    } catch (err) {
      console.error(err);
      if (onTaskUpdate) onTaskUpdate(task.id, { priority: old });
    }
  };

  const handleAssigneeSelect = async (member: any) => {
    setShowAssignee(false);
    const oldId = task.assigneeId;
    const oldName = task.assigneeName;
    const oldAvatar = task.assigneeAvatar;
    const newId = member ? member.id : null;
    const newName = member ? member.name : 'Unassigned';
    const newAvatar = member ? member.avatar : null;
    
    if (onTaskUpdate) onTaskUpdate(task.id, { assigneeId: newId, assigneeName: newName, assigneeAvatar: newAvatar });
    try {
      if (task.dbId) await dispatch(updateTaskAssignee({ taskId: task.dbId, assigneeId: newId })).unwrap();
    } catch (err) {
      console.error(err);
      if (onTaskUpdate) onTaskUpdate(task.id, { assigneeId: oldId, assigneeName: oldName, assigneeAvatar: oldAvatar });
    }
  };

  const handleDueDateChange = async (newDate: string) => {
    const formatted = newDate ? `${newDate}T00:00:00` : null;
    const old = task.dueDate;
    if (onTaskUpdate) onTaskUpdate(task.id, { dueDate: formatted });
    try {
      if (task.dbId) await dispatch(updateTaskDueDate({ taskId: task.dbId, dueDate: formatted })).unwrap();
    } catch (err) {
      console.error(err);
      if (onTaskUpdate) onTaskUpdate(task.id, { dueDate: old });
    }
  };

  const filteredMembers = projectMembers.filter(m => m.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) || m.email?.toLowerCase().includes(assigneeSearch.toLowerCase()));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-[10px] text-slate-400 font-bold block">{task.taskKey || task.id}</span>
        
        {/* Due Date */}
        <div className="relative group/date">
          <div 
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            onClick={(e) => {
              const input = e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement;
              if (input) { try { input.showPicker(); } catch (err) { input.focus(); } }
            }}
            onPointerDown={e => e.stopPropagation()}
          >
            <Icons.calendar size={10} />
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set date'}</span>
          </div>
          <input
            type="date"
            value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
            onChange={(e) => handleDueDateChange(e.target.value)}
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
          />
        </div>
      </div>
      
      {isEditingTitle ? (
        <div className="flex items-center gap-1 mb-2" onPointerDown={e => e.stopPropagation()}>
          <input 
            type="text" 
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') { setIsEditingTitle(false); setTitleValue(task.title); }
            }}
            autoFocus
            className="flex-1 border border-blue-400 bg-white px-2 py-1 rounded-[3px] text-xs outline-none focus:ring-1 focus:ring-blue-400 min-w-0 font-bold"
          />
          <button onClick={handleTitleSubmit} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0"><Icons.check size={14} className="text-slate-700" /></button>
          <button onClick={() => { setIsEditingTitle(false); setTitleValue(task.title); }} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0"><Icons.x size={14} className="text-slate-700" /></button>
        </div>
      ) : (
        <h5 
          onClick={() => { setIsEditingTitle(true); setTitleValue(task.title); }}
          onPointerDown={e => e.stopPropagation()}
          className="font-bold text-slate-800 text-sm leading-snug hover:text-blue-600 transition-colors cursor-pointer mb-2"
        >
          {task.title}
        </h5>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <button 
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPriorityPos({ top: rect.bottom + 4, left: rect.left });
            setShowPriority(true);
          }}
          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border hover:bg-slate-100 transition-colors ${getPriorityColor(task.priority)}`}
        >
          {getPriorityIcon(task.priority)}
          <span>{task.priority || 'Medium'}</span>
        </button>

        <button 
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setAssigneePos({ top: rect.bottom + 4, left: rect.left - 150 });
            setShowAssignee(true);
            setAssigneeSearch('');
          }}
          className="flex items-center gap-1.5 hover:ring-2 hover:ring-blue-200 rounded-full transition-all"
        >
          <img src={task.assigneeAvatar || defaultMan} alt="Assignee" className="w-6 h-6 rounded-full border border-slate-200 shadow-sm object-cover" title={task.assigneeName || 'Unassigned'} />
        </button>
      </div>

      {showPriority && createPortal(
        <div
          className="fixed w-[140px] bg-white border border-slate-200 shadow-2xl rounded-xl py-1 z-[9999] overflow-hidden"
          style={{ top: priorityPos.top, left: priorityPos.left }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-3 py-1 mb-1 border-b border-slate-100">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
             <button onClick={() => setShowPriority(false)}><Icons.x size={12} className="text-slate-400 hover:text-slate-700"/></button>
          </div>
          {PRIORITIES.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePrioritySelect(p.label)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors text-left text-slate-700"
            >
              {p.icon} <span>{p.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}

      {showAssignee && createPortal(
        <div
          className="fixed w-[200px] bg-white border border-slate-200 shadow-2xl rounded-xl py-2 z-[9999] overflow-hidden"
          style={{ top: assigneePos.top, left: assigneePos.left }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-3 mb-2">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee</span>
             <button onClick={() => setShowAssignee(false)}><Icons.x size={12} className="text-slate-400 hover:text-slate-700"/></button>
          </div>
          <div className="px-3 pb-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search users..."
              value={assigneeSearch}
              onChange={(e) => setAssigneeSearch(e.target.value)}
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
            />
          </div>
          <div className="max-h-[150px] overflow-y-auto py-1">
            <button onClick={() => handleAssigneeSelect(null)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 text-left text-slate-600">
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Icons.user size={10} /></div>
              <span>Unassigned</span>
            </button>
            {filteredMembers.map((m: any) => (
              <button key={m.id} onClick={() => handleAssigneeSelect(m)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 text-left text-slate-700">
                <img src={m.avatar || defaultMan} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                <span className="truncate">{m.name}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const DroppableColumn = ({ column, tasks, children, projectMembers, onTaskUpdate }: any) => {
  const { setNodeRef } = useDroppable({
    id: column.id || column.name,
    data: column
  });

  return (
    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/60 w-[320px] shrink-0 flex flex-col gap-3 max-h-full">
      <div className="flex items-center justify-between px-2 mb-1 shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="font-extrabold text-sm text-slate-700">{column.name}</h4>
          <span className="text-xs bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
            {tasks.length}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <Icons.moreHorizontal size={16} />
        </button>
      </div>

      <div ref={setNodeRef} className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-none pr-1">
        <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task: any) => (
            <SortableTask key={task.id} task={task} projectMembers={projectMembers} onTaskUpdate={onTaskUpdate} />
          ))}
        </SortableContext>
      </div>

      {children}
    </div>
  );
};

export default function ProjectBoard({ currentProject, tasks }: ProjectBoardProps) {
  const dispatch = useAppDispatch();
  const [boardTasks, setBoardTasks] = useState(tasks);

  useEffect(() => {
    setBoardTasks(tasks);
  }, [tasks]);

  const handleTaskUpdate = (taskId: string, updates: any) => {
    setBoardTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('task');
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require moving 5px before drag starts to allow clicking buttons
      },
    })
  );

  useEffect(() => {
    if (currentProject?.id) {
      dispatch(fetchTasksByProject({ 
        projectId: currentProject.id, 
        params: { size: 1000 } 
      }));
    }
  }, [currentProject?.id, dispatch]);

  const handleAddTask = async (columnId: string) => {
    if (!newTaskTitle.trim() || !currentProject) return;
    const columns = currentProject.boardColumns || [];
    const column = columns.find((c: any) => (c.id || c.name) === columnId) || columns[0];
    
    const statusId = column?.defaultStatusId || column?.mappedStatusIds?.[0] || '';

    try {
      await dispatch(createTask({
        projectId: currentProject.id,
        title: newTaskTitle.trim(),
        statusId: statusId,
        type: newTaskType
      })).unwrap();
      setNewTaskTitle('');
      setShowAddTask(null);
      
      dispatch(fetchTasksByProject({ 
        projectId: currentProject.id,
        params: { size: 1000 }
      }));
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
             if (draggedTask.dbId) {
                await dispatch(updateTaskStatus({ taskId: draggedTask.dbId, statusId: targetStatusId })).unwrap();
                // Optionally refetch tasks to ensure board is perfectly in sync
                dispatch(fetchTasksByProject({ 
                  projectId: currentProject.id,
                  params: { size: 1000 }
                }));
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
                      onClick={() => handleAddTask(columnId)}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAddTask(columnId);
                    setNewTaskTitle('');
                  }}
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
        {activeTask ? <SortableTask task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
