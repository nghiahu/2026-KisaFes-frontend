import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, pointerWithin, type DragStartEvent, type DragEndEvent, type CollisionDetection
} from '@dnd-kit/core';
import { Trash2, CheckSquare, Zap, X, MoveRight, AlertCircle } from 'lucide-react';
import { sprintService, type Sprint } from '../../../services/sprint.service';
import { taskService } from '../../../services/task.service';
import SprintModal from '../../../components/workspace/SprintModal';
import CompleteSprintModal from '../../../components/workspace/CompleteSprintModal';
import { MassChangeStatusModal } from '../../../components/workspace/MassChangeStatusModal';
import { MassEditFieldsModal } from '../../../components/workspace/MassEditFieldsModal';
import { MassDeleteModal } from '../../../components/workspace/MassDeleteModal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { DraggableTaskRow } from './components/DraggableTaskRow';
import { SprintSection } from './components/SprintSection';
import { BacklogSection } from './components/BacklogSection';
import TaskDetailView from '../../../components/workspace/TaskDetailView';
import { BacklogToolbar } from './components/BacklogToolbar';
import { MassActionBar } from './components/MassActionBar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProjectBacklogProps {
  projectId: string;
  currentProject: any;
}



// ─── Main Component ────────────────────────────────────────────────────────
export default function ProjectBacklog({ projectId, currentProject }: ProjectBacklogProps) {
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData(['projectBacklog', projectId]) as any;

  const { t } = useLanguage();

  const [sprints, setSprints] = useState<Sprint[]>(cachedData?.sprints || []);
  const [backlogTasks, setBacklogTasks] = useState<any[]>(cachedData?.backlogTasks || []);
  const [sprintTasks, setSprintTasks] = useState<any[]>(cachedData?.sprintTasks || []); // all tasks in sprints
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any | null>(null);

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

  // Custom collision: ưu tiên droppable nằm dưới con trỏ trực tiếp trước
  const collisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) return pointerHits;
    return closestCorners(args);
  };

  const [deleteSprintConfirm, setDeleteSprintConfirm] = useState<string | null>(null);
  const [errorAlertMessage, setErrorAlertMessage] = useState<string | null>(null);

  // --- Filter State ---
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState('Assignee');
  const [filterAssignees, setFilterAssignees] = useState<string[]>([]);
  const [filterAssigneeSearch, setFilterAssigneeSearch] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);

  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(event.target as Node)
      ) {
        setShowFilterPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalActiveFilters = filterAssignees.length + filterTypes.length + filterStatuses.length + filterPriorities.length;
  // ---------------------

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

  const { data: backlogData, isFetching } = useQuery({
    queryKey: ['projectBacklog', projectId],
    queryFn: async () => {
      const [sprintsData, backlog] = await Promise.all([
        sprintService.getSprintsByProject(projectId),
        sprintService.getBacklog(projectId),
      ]);
      const allSprintTasks: any[] = [];
      await Promise.all(
        sprintsData.map(async (s) => {
          const tasks = await sprintService.getSprintTasks(projectId, s.id);
          const tasksWithSprintId = tasks.map((t: any) => ({ ...t, sprintId: s.id }));
          allSprintTasks.push(...tasksWithSprintId);
        })
      );
      return {
        sprints: sprintsData,
        backlogTasks: backlog.map((t: any) => ({ ...t, sprintId: null })),
        sprintTasks: allSprintTasks
      };
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (backlogData) {
      setSprints(prevSprints => {
        setExpandedSprints(prevExpanded => {
          const nextExpanded = new Set(prevExpanded);
          const existingIds = new Set(prevSprints.map(s => s.id));
          if (existingIds.size === 0) {
            backlogData.sprints.forEach((s: any) => {
              if (s.status !== 'COMPLETED') nextExpanded.add(s.id);
            });
          } else {
            backlogData.sprints.forEach((s: any) => {
              if (!existingIds.has(s.id) && s.status !== 'COMPLETED') {
                nextExpanded.add(s.id);
              }
            });
          }
          return nextExpanded;
        });
        return backlogData.sprints;
      });
      setSprintTasks(backlogData.sprintTasks);
      setBacklogTasks(backlogData.backlogTasks);
      setIsLoading(false);
    }
  }, [backlogData]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    await queryClient.invalidateQueries({ queryKey: ['projectBacklog', projectId] });
    if (!silent) setIsLoading(false);
  }, [projectId, queryClient]);

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
      const all = [...backlogTasks, ...sprintTasks];
      const taskToMove = all.find(t => t.id === taskId);

      if (taskToMove) {
        const updatedTask = { ...taskToMove, sprintId };
        
        if (sprintId === null) {
          // Move to backlog
          setSprintTasks(prev => prev.filter(t => t.id !== taskId));
          setBacklogTasks(prev => {
            if (!prev.find(t => t.id === taskId)) return [...prev, updatedTask];
            return prev.map(t => t.id === taskId ? updatedTask : t);
          });
        } else {
          // Move to sprint
          setBacklogTasks(prev => prev.filter(t => t.id !== taskId));
          setSprintTasks(prev => {
            if (!prev.find(t => t.id === taskId)) return [...prev, updatedTask];
            return prev.map(t => t.id === taskId ? updatedTask : t);
          });
        }
      }

      await sprintService.moveTaskToSprint(taskId, sprintId);
      load(true); // Silent load to sync exact order
    } catch (e) {
      console.error("Move task failed", e);
      load(true); // revert
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      const updated = await sprintService.startSprint(projectId, sprintId);
      setSprints(prev => prev.map(s => s.id === sprintId ? updated : s));
    } catch (e: any) { 
      setErrorAlertMessage(e?.response?.data?.message || t('backlog.cannot_start_sprint')); 
    }
  };

  const handleDeleteSprint = (sprintId: string) => {
    setDeleteSprintConfirm(sprintId);
  };

  const executeDeleteSprint = async () => {
    if (!deleteSprintConfirm) return;
    try {
      await sprintService.deleteSprint(projectId, deleteSprintConfirm);
      await load();
      setDeleteSprintConfirm(null);
    } catch (e: any) { 
      setDeleteSprintConfirm(null);
      setErrorAlertMessage(e?.response?.data?.message || t('backlog.cannot_delete_sprint')); 
    }
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
    console.log('[DragEnd] over:', over?.id, 'overData:', over?.data?.current, 'active sprintId:', active?.data?.current?.sprintId);
    if (!over) return;

    const draggedTaskId = String(active.id);
    const overId = String(over.id);
    const overData = over.data.current;

    // Tìm sprint đích
    let targetSprintId: string | null = null;

    if (overId === 'backlog-container' || overId === 'backlog-context' || overId === 'backlog-empty-drop' || overData?.type === 'backlog') {
      targetSprintId = null;
    } else if (overData?.type === 'sprint') {
      targetSprintId = overData.sprintId;
    } else if (overData?.type === 'task') {
      // Nếu thả lên một task, lấy sprintId của task đó
      targetSprintId = overData.sprintId ?? null;
    } else {
      // Fallback cho SortableContext của sprint nếu nó sinh ra id tự động là sprint id
      const sprintExists = sprints.find(s => s.id === overId);
      if (sprintExists) {
        targetSprintId = sprintExists.id;
      } else {
        return;
      }
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



  const rawAllTasks = [...backlogTasks, ...sprintTasks];
  const allTasks = rawAllTasks.filter(task => {
    if (searchKeyword.trim() && !task.title?.toLowerCase().includes(searchKeyword.toLowerCase()) && !task.taskKey?.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false;
    }
    if (filterAssignees.length > 0) {
      const assigneeMatch = filterAssignees.includes('unassigned')
        ? (!task.assigneeName || task.assigneeName === 'Unassigned')
        : filterAssignees.includes(task.assigneeId);
      const assigneeOr = filterAssignees.includes(task.assigneeId) ||
        (filterAssignees.includes('unassigned') && (!task.assigneeName || task.assigneeName === 'Unassigned'));
      if (!assigneeOr) return false;
    }
    if (filterTypes.length > 0) {
      if (!filterTypes.map(t => t.toLowerCase()).includes((task.type || '').toLowerCase())) return false;
    }
    if (filterStatuses.length > 0) {
      if (!filterStatuses.includes(task.statusId) && !filterStatuses.includes(task.status)) return false;
    }
    if (filterPriorities.length > 0) {
      if (!filterPriorities.map(p => p.toLowerCase()).includes((task.priority || 'medium').toLowerCase())) return false;
    }
    return true;
  });

  const filteredBacklogTasks = allTasks.filter(t => !t.sprintId);
  const backlogPoints = filteredBacklogTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

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
      <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4 mx-[2%] mt-[1%]">
          {/* Toolbar */}
          <BacklogToolbar
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            showFilterPanel={showFilterPanel}
            setShowFilterPanel={setShowFilterPanel}
            activeFilterCategory={activeFilterCategory}
            setActiveFilterCategory={setActiveFilterCategory}
            filterAssignees={filterAssignees}
            setFilterAssignees={setFilterAssignees}
            filterAssigneeSearch={filterAssigneeSearch}
            setFilterAssigneeSearch={setFilterAssigneeSearch}
            filterTypes={filterTypes}
            setFilterTypes={setFilterTypes}
            filterStatuses={filterStatuses}
            setFilterStatuses={setFilterStatuses}
            filterPriorities={filterPriorities}
            setFilterPriorities={setFilterPriorities}
            totalActiveFilters={totalActiveFilters}
            filterBtnRef={filterBtnRef}
            filterPanelRef={filterPanelRef}
            currentProject={currentProject}
          />

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
              onTaskClick={(t: any) => setSelectedTaskDetail(t)}
            />
          ))}

          {/* Backlog Section */}
          <BacklogSection
            tasks={filteredBacklogTasks}
            project={currentProject}
            sprints={sprints}
            onCreateSprint={() => setSprintModal({ open: true, sprint: null })}
            onMoveToSprint={handleMoveToSprint}
            onDeleteTask={handleDeleteTask}
            selectedTaskIds={selectedTaskIds}
            onToggleTask={handleToggleTask}
            onTaskUpdated={() => load(true)}
            onTaskClick={(t) => setSelectedTaskDetail(t)}
            onCreateTask={(title, type, assignee, dueDate) => handleCreateTask(undefined, title, type, assignee, dueDate)}
            searchKeyword={searchKeyword}
            totalActiveFilters={totalActiveFilters}
          />
        </div>

        <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeTask && (
            <div className="bg-card rounded-md shadow-2xl border border-primary/20 opacity-95 scale-[1.02] rotate-1 w-full pointer-events-none">
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
      <MassActionBar
        selectedTaskIds={selectedTaskIds}
        allTasks={allTasks}
        setSelectedTaskIds={setSelectedTaskIds}
        setShowMassEditFieldsModal={setShowMassEditFieldsModal}
        setShowMassChangeStatusModal={setShowMassChangeStatusModal}
        setShowMassMoveModal={setShowMassMoveModal}
        setShowMassDeleteModal={setShowMassDeleteModal}
      />

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
          <div className="bg-card rounded-2xl shadow-2xl w-[400px] overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="font-extrabold text-foreground text-sm">{t('backlog.move_tasks').replace('{count}', String(selectedTaskIds.size))}</h3>
              <button onClick={() => setShowMassMoveModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-colors"><X size={14} /></button>
            </div>
            <div className="p-3 max-h-[350px] overflow-y-auto flex flex-col gap-1.5">
              <button
                onClick={async () => {
                  setShowMassMoveModal(false);
                  setIsChangingStatus(true);
                  try {
                    await Promise.all(Array.from(selectedTaskIds).map(id => sprintService.moveTaskToSprint(id, null)));
                  } catch (e) { console.error(e); }
                  setSelectedTaskIds(new Set());
                  setIsChangingStatus(false);
                  load(true);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all text-foreground hover:bg-muted`}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/60">
                  <CheckSquare size={14} />
                </div>
                {t('backlog.backlog_label')}
              </button>

              {sprints?.length ? (
                <div className="px-3 py-2 mt-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('backlog.sprints_label')}</span>
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
                    } catch (e) { console.error(e); }
                    setSelectedTaskIds(new Set());
                    setIsChangingStatus(false);
                    load(true);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all text-foreground hover:bg-muted`}
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

      {/* Task Detail Modal */}
      {selectedTaskDetail && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedTaskDetail(null)}
          />
          <div className="relative bg-card w-full max-w-[1000px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex-1 flex overflow-hidden">
              <TaskDetailView
                task={selectedTaskDetail}
                currentProject={currentProject}
                onClose={() => setSelectedTaskDetail(null)}
                onUpdateTaskLocally={(taskId, updates) => {
                  setSelectedTaskDetail(prev => prev && prev.id === taskId ? { ...prev, ...updates } : prev);
                  load(true);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Delete Sprint Confirm Modal */}
      {deleteSprintConfirm && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-2xl w-[400px] overflow-hidden border border-border scale-in-center">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-rose-50/50">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm">{t('backlog.delete_sprint_title')}</h3>
            </div>
            <div className="px-5 py-4 text-[13px] text-muted-foreground font-medium">
              {t('backlog.delete_sprint_desc')}
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-2 bg-background/50">
              <button 
                onClick={() => setDeleteSprintConfirm(null)} 
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-slate-200 rounded-lg transition-colors"
              >
                {t('backlog.cancel')}
              </button>
              <button 
                onClick={executeDeleteSprint} 
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                {t('backlog.delete_sprint')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Error Alert Modal */}
      {errorAlertMessage && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-2xl w-[360px] overflow-hidden border border-border scale-in-center">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm">{t('backlog.notification_title')}</h3>
            </div>
            <div className="px-5 py-5 text-[13px] text-muted-foreground font-medium text-center">
              {errorAlertMessage}
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-center bg-background/50">
              <button 
                onClick={() => setErrorAlertMessage(null)} 
                className="px-6 py-2 w-full text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors"
              >
                {t('backlog.close')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}
