import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragStartEvent, type DragEndEvent, useDroppable
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus, ChevronDown, ChevronRight,
  Trash2, CheckSquare, Zap, AlertCircle,
  MousePointer2, Edit3, MinusSquare, X,
  Search, User, Calendar, MoveRight
} from 'lucide-react';
import { sprintService, type Sprint } from '../../../services/sprint.service';
import { taskService } from '../../../services/task.service';
import SprintModal from '../../../components/workspace/SprintModal';
import CompleteSprintModal from '../../../components/workspace/CompleteSprintModal';
import defaultMan from '../../../assets/avatar_def_man.png';
import { Skeleton } from '../../../components/ui/skeleton';
import { MassChangeStatusModal } from '../../../components/workspace/MassChangeStatusModal';
import { MassEditFieldsModal } from '../../../components/workspace/MassEditFieldsModal';
import { MassDeleteModal } from '../../../components/workspace/MassDeleteModal';

interface ProjectBacklogProps {
  projectId: string;
  currentProject: any;
}



import { DraggableTaskRow } from './components/DraggableTaskRow';
import { SprintSection } from './components/SprintSection';
import { InlineTaskCreator } from '../../../components/workspace/InlineTaskCreator';

// ─── Main Component ────────────────────────────────────────────────────────
export default function ProjectBacklog({ projectId, currentProject }: ProjectBacklogProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [sprintTasks, setSprintTasks] = useState<any[]>([]); // all tasks in sprints
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [expandedBacklog, setExpandedBacklog] = useState(true);

  const [sprintModal, setSprintModal] = useState<{ open: boolean; sprint?: Sprint | null }>({ open: false });
  const [completeModal, setCompleteModal] = useState<{ open: boolean; sprint?: Sprint }>({ open: false });
  const [showMassChangeStatusModal, setShowMassChangeStatusModal] = useState(false);
  const [showMassEditFieldsModal, setShowMassEditFieldsModal] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const [showMassMoveModal, setShowMassMoveModal] = useState(false);
  const [singleDeleteTaskId, setSingleDeleteTaskId] = useState<string | null>(null);

  const [activeTask, setActiveTask] = useState<any>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const handleCreateTask = async (sprintId?: string | React.MouseEvent | React.KeyboardEvent, titleOverride?: string, typeOverride?: string, assigneeOverride?: any, dueDateOverride?: string) => {
    const actualSprintId = typeof sprintId === 'string' ? sprintId : undefined;

    const finalTitle = (titleOverride !== undefined ? titleOverride : '').trim();
    const finalType = (typeOverride !== undefined ? typeOverride : 'task').toLowerCase();
    const finalAssignee = assigneeOverride !== undefined ? assigneeOverride : null;
    const finalDueDate = dueDateOverride !== undefined ? dueDateOverride : '';

    if (!finalTitle || !currentProject) return;

    const firstStatusId = currentProject.statuses?.[0]?.statusId || "";
    try {
      const res = await taskService.createTask({
        projectId: currentProject.id,
        sprintId: actualSprintId,
        title: finalTitle,
        statusId: firstStatusId,
        type: finalType,
        assigneeId: finalAssignee && finalAssignee !== 'automatic' ? finalAssignee.id : null,
        dueDate: finalDueDate ? `${finalDueDate}T00:00:00` : null
      });

      if (actualSprintId && res?.id) {
        await sprintService.moveTaskToSprint(res.id, actualSprintId);
      }

      setIsCreatingTask(false);
      load(true);
    } catch (err: any) {
      console.error("Failed to create task:", err);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [sprintsData, backlog] = await Promise.all([
        sprintService.getSprintsByProject(projectId),
        sprintService.getBacklog(projectId),
      ]);
      setSprints(prevSprints => {
        setExpandedSprints(prevExpanded => {
          const nextExpanded = new Set(prevExpanded);
          const existingIds = new Set(prevSprints.map(s => s.id));
          if (existingIds.size === 0) {
            sprintsData.forEach(s => {
              if (s.status !== 'COMPLETED') nextExpanded.add(s.id);
            });
          } else {
            sprintsData.forEach(s => {
              if (!existingIds.has(s.id) && s.status !== 'COMPLETED') {
                nextExpanded.add(s.id);
              }
            });
          }
          return nextExpanded;
        });
        return sprintsData;
      });

      // Load tasks for non-completed sprints
      const allSprintTasks: any[] = [];
      await Promise.all(
        sprintsData.map(async (s) => {
          const tasks = await sprintService.getSprintTasks(projectId, s.id);
          const tasksWithSprintId = tasks.map((t: any) => ({ ...t, sprintId: s.id }));
          allSprintTasks.push(...tasksWithSprintId);
        })
      );
      setSprintTasks(allSprintTasks);
      setBacklogTasks(backlog.map((t: any) => ({ ...t, sprintId: null })));
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      load();
    }
  }, [projectId, load]);

  const toggleSprint = (id: string) => {
    setExpandedSprints(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleMoveToSprint = async (taskId: string, sprintId: string | null) => {
    try {
      // Optimistic Update
      let movedTask: any = null;
      setSprintTasks(prev => {
        const idx = prev.findIndex(t => t.id === taskId);
        if (idx !== -1) {
          movedTask = { ...prev[idx], sprintId };
          return prev.filter(t => t.id !== taskId);
        }
        return prev;
      });
      setBacklogTasks(prev => {
        const idx = prev.findIndex(t => t.id === taskId);
        if (idx !== -1) {
          movedTask = { ...prev[idx], sprintId };
          return prev.filter(t => t.id !== taskId);
        }
        return prev;
      });

      // Wait for state to settle to avoid race conditions, though setState is async
      setTimeout(() => {
        if (!movedTask) {
          const all = [...backlogTasks, ...sprintTasks];
          movedTask = all.find(t => t.id === taskId);
          if (movedTask) movedTask = { ...movedTask, sprintId };
        }
        if (movedTask) {
          if (sprintId === null) {
            setBacklogTasks(prev => [...prev, movedTask]);
          } else {
            setSprintTasks(prev => [...prev, movedTask]);
          }
        }
      }, 0);

      await sprintService.moveTaskToSprint(taskId, sprintId);
      load(true); // Silent load to sync exact order
    } catch (e) {
      console.error(e);
      load(true); // revert
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      const updated = await sprintService.startSprint(projectId, sprintId);
      setSprints(prev => prev.map(s => s.id === sprintId ? updated : s));
    } catch (e: any) { alert(e?.response?.data?.message || 'Không thể bắt đầu sprint'); }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm('Xóa sprint? Các task sẽ được chuyển về backlog.')) return;
    try {
      await sprintService.deleteSprint(projectId, sprintId);
      await load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Không thể xóa sprint'); }
  };

  const handleDeleteTask = (taskId: string) => {
    setSingleDeleteTaskId(taskId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const allTasks = [...backlogTasks, ...sprintTasks];
    const task = allTasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTaskId = String(active.id);
    const overId = String(over.id);
    const overData = over.data.current;

    // Tìm sprint đích
    let targetSprintId: string | null = null;

    if (overId === 'backlog-container' || overData?.type === 'backlog') {
      targetSprintId = null;
    } else if (overData?.type === 'sprint') {
      targetSprintId = overData.sprintId;
    } else if (overData?.type === 'task') {
      // Nếu thả lên một task, lấy sprintId của task đó
      targetSprintId = overData.sprintId ?? null;
    } else {
      // Fallback
      return;
    }

    // Kiểm tra xem có thực sự thay đổi sprint không
    const currentSprintId = active.data.current?.sprintId ? String(active.data.current.sprintId) : null;
    const finalTargetId = targetSprintId ? String(targetSprintId) : null;

    if (currentSprintId !== finalTargetId) {
      try {
        await handleMoveToSprint(draggedTaskId, finalTargetId);
      } catch (e) {
        console.error("Failed to move task:", e);
      }
    }
  };

  const allTasks = [...backlogTasks, ...sprintTasks];
  const backlogPoints = backlogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  const { setNodeRef: setBacklogNodeRef, isOver: isBacklogOver } = useDroppable({
    id: 'backlog-container',
    data: { type: 'backlog', sprintId: null }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mx-[2%] mt-[1%]">
        {/* Toolbar skeleton */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-8 w-48 rounded-sm" />
          <Skeleton className="h-8 w-16 rounded-sm" />
        </div>

        {/* Sprint skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-full rounded-sm mb-1" />
          <Skeleton className="h-8 w-full rounded-sm mb-1" />
          <Skeleton className="h-8 w-full rounded-sm mb-1" />
        </div>

        {/* Backlog skeleton */}
        <div className="mb-10">
          <Skeleton className="h-10 w-full rounded-sm mb-1" />
          <Skeleton className="h-8 w-full rounded-sm mb-1" />
          <Skeleton className="h-8 w-full rounded-sm mb-1" />
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4 mx-[2%] mt-[1%]">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <input type="text" placeholder="Search backlog" className="pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-sm w-48 focus:outline-none focus:border-blue-400" />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded-sm">
              Filter
            </div>
          </div>

          {/* Sprint Sections */}
          {sprints.map(sprint => (
            <SprintSection
              key={sprint.id}
              sprint={sprint}
              tasks={allTasks}
              project={currentProject}
              isExpanded={expandedSprints.has(sprint.id)}
              onToggle={() => toggleSprint(sprint.id)}
              onEdit={() => setSprintModal({ open: true, sprint })}
              onDelete={() => handleDeleteSprint(sprint.id)}
              onStart={() => handleStartSprint(sprint.id)}
              onComplete={() => setCompleteModal({ open: true, sprint })}
              onMoveToSprint={handleMoveToSprint}
              onDeleteTask={handleDeleteTask}
              allSprints={sprints}
              selectedTaskIds={selectedTaskIds}
              onToggleTask={handleToggleTask}
              onTaskUpdated={() => load(true)}
            />
          ))}

          {/* Backlog Section */}
          <div
            ref={setBacklogNodeRef}
            className={`mb-10 rounded-sm transition-all ${isBacklogOver ? 'ring-2 ring-blue-400 bg-blue-50/10' : ''}`}
          >
            {/* Header */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 bg-slate-50 cursor-pointer select-none transition-colors group border border-slate-200 rounded-sm ${expandedBacklog ? 'border-b-0 rounded-b-none' : ''}`}
              onClick={() => setExpandedBacklog(p => !p)}
            >
              <button className="text-slate-500 hover:bg-slate-200 p-0.5 rounded transition-colors shrink-0 w-5 flex items-center justify-center">
                {expandedBacklog ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              <input
                type="checkbox"
                checked={backlogTasks.length > 0 && backlogTasks.every(t => selectedTaskIds.has(t.id))}
                onChange={(e) => {
                  e.stopPropagation();
                  const checked = e.target.checked;
                  backlogTasks.forEach(t => {
                    if (checked && !selectedTaskIds.has(t.id)) handleToggleTask(t.id);
                    else if (!checked && selectedTaskIds.has(t.id)) handleToggleTask(t.id);
                  });
                }}
                onClick={e => e.stopPropagation()}
                className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              />

              <h3 className="font-bold text-slate-800 text-[13px] truncate">Backlog</h3>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span>({backlogTasks.length} work {backlogTasks.length === 1 ? 'item' : 'items'})</span>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold">
                <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 ml-2">
                  <button onClick={() => setSprintModal({ open: true, sprint: null })}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded font-semibold transition-colors">
                    Create sprint
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks */}
            {expandedBacklog && (
              <div className="flex flex-col border border-slate-200 border-t-0 bg-white rounded-b-sm min-h-[100px] pointer-events-auto">
                <SortableContext id="backlog-context" items={backlogTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {backlogTasks.length === 0 && (
                    <div className="border border-dashed border-slate-300 bg-slate-50/50 text-slate-500 text-[13px] text-center py-6 mx-2 my-2 rounded-sm select-none">
                      Backlog của bạn đang trống.
                    </div>
                  )}
                  {backlogTasks.map(task => (
                    <DraggableTaskRow
                      key={task.id}
                      task={task}
                      project={currentProject}
                      onMoveToSprint={handleMoveToSprint}
                      onDeleteTask={handleDeleteTask}
                      sprints={sprints}
                      isSelected={selectedTaskIds.has(task.id)}
                      onToggle={handleToggleTask}
                      onTaskUpdated={() => load(true)}
                    />
                  ))}
                </SortableContext>
                {!isCreatingTask ? (
                  <div
                    onClick={() => setIsCreatingTask(true)}
                    className="px-8 py-2 hover:bg-slate-50 cursor-pointer text-slate-600 flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
                  >
                    <Plus size={14} /> Create
                  </div>
                ) : (
                  <div className="px-2 pb-2">
                    <InlineTaskCreator
                      onAdd={(title, type, assignee, dueDate) => handleCreateTask(undefined, title, type, assignee, dueDate)}
                      onCancel={() => setIsCreatingTask(false)}
                      projectMembers={currentProject?.members || []}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeTask && (
            <div className="bg-white rounded-md shadow-2xl border border-blue-200 opacity-95 scale-[1.02] rotate-1 w-full pointer-events-none">
              <DraggableTaskRow
                task={activeTask}
                project={currentProject}
                isOverlay={true}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Floating Action Bar */}
      {selectedTaskIds.size > 0 && createPortal(
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#28282b] text-white px-3 py-2 rounded-lg shadow-2xl z-[99999] text-[13px] font-medium border border-white/10 animate-slide-up">
          <div className="flex items-center gap-2 pr-2">
            <span className="bg-white/10 text-white font-bold px-2 py-0.5 rounded text-[12px]">
              {selectedTaskIds.size}
            </span>
            <span className="text-[#d4d4d8]">selected</span>
          </div>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => {
            const allIds = allTasks.map((t: any) => t.id);
            setSelectedTaskIds(new Set(allIds));
          }}>
            <MousePointer2 size={14} />
            <span>Select all</span>
          </button>

          <div className="w-[1px] h-4 bg-white/20 mx-2"></div>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassEditFieldsModal(true)}>
            <Edit3 size={14} />
            <span>Edit fields</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassChangeStatusModal(true)}>
            <MinusSquare size={14} />
            <span>Change status</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassMoveModal(true)}>
            <MoveRight size={14} />
            <span>Move</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassDeleteModal(true)}>
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <div className="w-[1px] h-4 bg-white/20 mx-2"></div>

          <button className="p-1 hover:bg-white/10 rounded-md transition-colors ml-1 text-[#d4d4d8]" onClick={() => setSelectedTaskIds(new Set())}>
            <X size={16} />
          </button>
        </div>,
        document.body
      )}

      {/* Sprint Modal */}
      {sprintModal.open && (
        <SprintModal
          projectId={projectId}
          sprint={sprintModal.sprint}
          onClose={() => setSprintModal({ open: false })}
          onSuccess={async () => { setSprintModal({ open: false }); await load(); }}
        />
      )}

      {/* Complete Sprint Modal */}
      {completeModal.open && completeModal.sprint && (
        <CompleteSprintModal
          projectId={projectId}
          sprint={completeModal.sprint}
          sprints={sprints}
          onClose={() => setCompleteModal({ open: false })}
          onSuccess={async () => { setCompleteModal({ open: false }); await load(); }}
        />
      )}

      {/* Mass Modals */}
      {showMassChangeStatusModal && (
        <MassChangeStatusModal
          isOpen={showMassChangeStatusModal}
          onClose={() => setShowMassChangeStatusModal(false)}
          statuses={currentProject?.statuses || []}
          isSubmitting={isChangingStatus}
          onSubmit={async (statusId) => {
            try {
              setIsChangingStatus(true);
              await Promise.all(Array.from(selectedTaskIds).map(id => taskService.updateTaskStatus(id, statusId)));
            } catch (e) {
              console.error(e);
            } finally {
              setIsChangingStatus(false);
              setShowMassChangeStatusModal(false);
              setSelectedTaskIds(new Set());
              await load();
            }
          }}
        />
      )}

      {showMassEditFieldsModal && (
        <MassEditFieldsModal
          isOpen={showMassEditFieldsModal}
          onClose={() => setShowMassEditFieldsModal(false)}
          members={currentProject?.members || []}
          isSubmitting={isEditingFields}
          onSubmit={async (data) => {
            try {
              setIsEditingFields(true);
              const taskPromises = Array.from(selectedTaskIds).map(async (taskId) => {
                if (data.assigneeId !== undefined) {
                  await taskService.updateTaskAssignee(taskId, data.assigneeId);
                }
                if (data.priority !== undefined) {
                  await taskService.updateTaskPriority(taskId, data.priority);
                }
                if (data.dueDate !== undefined) {
                  await taskService.updateTaskDueDate(taskId, data.dueDate);
                }
              });
              await Promise.all(taskPromises);
            } catch (e) {
              console.error(e);
            } finally {
              setIsEditingFields(false);
              setShowMassEditFieldsModal(false);
              setSelectedTaskIds(new Set());
              await load();
            }
          }}
        />
      )}

      {showMassMoveModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={() => setShowMassMoveModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm">Di chuyển {selectedTaskIds.size} Task</h3>
              <button onClick={() => setShowMassMoveModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"><X size={14}/></button>
            </div>
            <div className="p-3 max-h-[350px] overflow-y-auto flex flex-col gap-1.5">
              <button 
                onClick={async () => { 
                  setShowMassMoveModal(false);
                  setIsChangingStatus(true);
                  try {
                    await Promise.all(Array.from(selectedTaskIds).map(id => sprintService.moveTaskToSprint(id, null)));
                  } catch(e) { console.error(e); }
                  setSelectedTaskIds(new Set());
                  setIsChangingStatus(false);
                  load(true);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all text-slate-700 hover:bg-slate-100`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/60">
                  <CheckSquare size={14} />
                </div>
                Backlog
              </button>
              
              {sprints?.length ? (
                <div className="px-3 py-2 mt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sprints</span>
                </div>
              ) : null}

              {sprints?.map(sprint => (
                <button 
                  key={sprint.id}
                  onClick={async () => { 
                    setShowMassMoveModal(false);
                    setIsChangingStatus(true);
                    try {
                      await Promise.all(Array.from(selectedTaskIds).map(id => sprintService.moveTaskToSprint(id, sprint.id)));
                    } catch(e) { console.error(e); }
                    setSelectedTaskIds(new Set());
                    setIsChangingStatus(false);
                    load(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all text-slate-700 hover:bg-slate-100`}
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-500 shrink-0 border border-violet-200/60">
                    <Zap size={14} className="fill-current" />
                  </div>
                  {sprint.name}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <MassDeleteModal
        isOpen={showMassDeleteModal || !!singleDeleteTaskId}
        onClose={() => {
          setShowMassDeleteModal(false);
          setSingleDeleteTaskId(null);
        }}
        count={singleDeleteTaskId ? 1 : selectedTaskIds.size}
        onConfirm={async () => {
          if (singleDeleteTaskId) {
            await taskService.deleteTask(singleDeleteTaskId);
            setSingleDeleteTaskId(null);
          } else {
            await Promise.all(Array.from(selectedTaskIds).map(id => taskService.deleteTask(id)));
            setShowMassDeleteModal(false);
            setSelectedTaskIds(new Set());
          }
          await load();
        }}
      />
    </>
  );
}
