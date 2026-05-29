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
  Trash2, CheckSquare, Zap,
  MousePointer2, Edit3, MinusSquare, X, MoveRight, AlertCircle
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
import { Icons } from '../../../assets/icons';

interface ProjectBacklogProps {
  projectId: string;
  currentProject: any;
}



import { DraggableTaskRow } from './components/DraggableTaskRow';
import { SprintSection } from './components/SprintSection';
import { InlineTaskCreator } from '../../../components/workspace/InlineTaskCreator';
import TaskDetailView from '../../../components/workspace/TaskDetailView';

import { useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Main Component ────────────────────────────────────────────────────────
export default function ProjectBacklog({ projectId, currentProject }: ProjectBacklogProps) {
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData(['projectBacklog', projectId]) as any;

  const [sprints, setSprints] = useState<Sprint[]>(cachedData?.sprints || []);
  const [backlogTasks, setBacklogTasks] = useState<any[]>(cachedData?.backlogTasks || []);
  const [sprintTasks, setSprintTasks] = useState<any[]>(cachedData?.sprintTasks || []); // all tasks in sprints
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [expandedBacklog, setExpandedBacklog] = useState(true);
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

  const [isCreatingTask, setIsCreatingTask] = useState(false);
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
      setErrorAlertMessage(e?.response?.data?.message || 'Không thể bắt đầu sprint'); 
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
      setErrorAlertMessage(e?.response?.data?.message || 'Không thể xóa sprint'); 
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
              <input
                type="text"
                placeholder="Search backlog"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-sm w-48 focus:outline-none focus:border-blue-400"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icons.search size={14} />
              </div>
            </div>

            <div className="relative">
              <button
                ref={filterBtnRef}
                onClick={() => setShowFilterPanel(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${totalActiveFilters > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
              >
                <Icons.filter size={13} className={totalActiveFilters > 0 ? 'text-blue-500' : 'text-slate-400'} />
                <span>Filter</span>
                {totalActiveFilters > 0 && (
                  <span className="ml-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {totalActiveFilters}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              {showFilterPanel && (
                <div
                  ref={filterPanelRef}
                  className="absolute top-full left-0 mt-1.5 w-[420px] bg-white border border-slate-200 shadow-2xl rounded-xl z-[200] overflow-hidden"
                >
                  <div className="flex" style={{ minHeight: 240 }}>
                    <div className="w-36 border-r border-slate-100 py-1.5 shrink-0 bg-slate-50/60">
                      {[
                        { id: 'Assignee', count: filterAssignees.length },
                        { id: 'Work type', count: filterTypes.length },
                        { id: 'Status', count: filterStatuses.length },
                        { id: 'Priority', count: filterPriorities.length },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveFilterCategory(cat.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-left transition-colors ${activeFilterCategory === cat.id
                              ? 'bg-white text-blue-700 border-l-2 border-blue-600 shadow-sm'
                              : 'text-slate-600 hover:bg-white/70 border-l-2 border-transparent'
                            }`}
                        >
                          <span>{cat.id}</span>
                          {cat.count > 0 && (
                            <span className="bg-blue-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0">{cat.count}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 py-2 px-3 overflow-y-auto max-h-[300px]">
                      {activeFilterCategory === 'Assignee' && (
                        <div className="flex flex-col h-full">
                          <div className="sticky top-0 bg-white pb-2 z-10">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
                              <Icons.search size={12} className="text-slate-400 shrink-0" />
                              <input
                                type="text"
                                placeholder="Search assignee..."
                                value={filterAssigneeSearch}
                                onChange={e => setFilterAssigneeSearch(e.target.value)}
                                className="flex-1 text-[12px] text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                              />
                              {filterAssigneeSearch && (
                                <button onClick={() => setFilterAssigneeSearch('')} className="text-slate-400 hover:text-slate-600 shrink-0">
                                  <Icons.x size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="overflow-y-auto space-y-0.5">
                            {[
                              { id: 'unassigned', name: 'Unassigned', avatar: null },
                              ...(currentProject?.members || []).map((m: any) => ({ id: m.id, name: m.name, avatar: m.avatar }))
                            ].filter(member => !filterAssigneeSearch.trim() || member.name.toLowerCase().includes(filterAssigneeSearch.toLowerCase())).map(member => {
                              const checked = filterAssignees.includes(member.id);
                              return (
                                <label key={member.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setFilterAssignees(prev => checked ? prev.filter(x => x !== member.id) : [...prev, member.id])}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                  />
                                  {member.avatar
                                    ? <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0" />
                                    : <div className="w-5 h-5 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0"><Icons.user size={10} /></div>
                                  }
                                  <span className="text-[12px] font-medium text-slate-700 truncate">{member.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {activeFilterCategory === 'Work type' && (
                        <div className="space-y-0.5">
                          {[{ v: 'Epic', color: 'text-violet-600' }, { v: 'Task', color: 'text-blue-600' }, { v: 'Incident', color: 'text-rose-600' }, { v: 'Service Request', color: 'text-amber-600' }].map(({ v, color }) => {
                            const checked = filterTypes.includes(v);
                            return (
                              <label key={v} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={() => setFilterTypes(prev => checked ? prev.filter(x => x !== v) : [...prev, v])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                                <span className={`text-[12px] font-semibold ${color}`}>{v}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {activeFilterCategory === 'Status' && (
                        <div className="space-y-0.5">
                          {(currentProject?.statuses || []).map((s: any) => {
                            const checked = filterStatuses.includes(s.statusId);
                            return (
                              <label key={s.statusId} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={() => setFilterStatuses(prev => checked ? prev.filter(x => x !== s.statusId) : [...prev, s.statusId])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                                <span className="text-[12px] font-medium text-slate-700">{s.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {activeFilterCategory === 'Priority' && (
                        <div className="space-y-0.5">
                          {['Highest', 'High', 'Medium', 'Low', 'Lowest'].map(priority => {
                            const checked = filterPriorities.includes(priority);
                            return (
                              <label key={priority} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={() => setFilterPriorities(prev => checked ? prev.filter(x => x !== priority) : [...prev, priority])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                                <span className={`text-[12px] font-medium`}>{priority}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => { setFilterAssignees([]); setFilterTypes([]); setFilterStatuses([]); setFilterPriorities([]); }}
                      className={`text-[11px] font-semibold transition-colors ${totalActiveFilters > 0 ? 'text-slate-500 hover:text-slate-800' : 'text-slate-300 cursor-default'
                        }`}
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilterPanel(false)}
                      className="text-[11px] font-bold px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
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
              onTaskClick={(t: any) => setSelectedTaskDetail(t)}
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
                checked={filteredBacklogTasks.length > 0 && filteredBacklogTasks.every(t => selectedTaskIds.has(t.id))}
                onChange={(e) => {
                  e.stopPropagation();
                  const checked = e.target.checked;
                  filteredBacklogTasks.forEach(t => {
                    if (checked && !selectedTaskIds.has(t.id)) handleToggleTask(t.id);
                    else if (!checked && selectedTaskIds.has(t.id)) handleToggleTask(t.id);
                  });
                }}
                onClick={e => e.stopPropagation()}
                className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              />

              <h3 className="font-bold text-slate-800 text-[13px] truncate">Backlog</h3>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span>({filteredBacklogTasks.length} work {filteredBacklogTasks.length === 1 ? 'item' : 'items'})</span>
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
                <SortableContext id="backlog-context" items={filteredBacklogTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {filteredBacklogTasks.length === 0 && (
                    <div className="border border-dashed border-slate-300 bg-slate-50/50 text-slate-500 text-[13px] text-center py-6 mx-2 my-2 rounded-sm select-none">
                      {searchKeyword || totalActiveFilters > 0 ? "Không có task nào thỏa mãn điều kiện lọc." : "Backlog của bạn đang trống."}
                    </div>
                  )}
                  {filteredBacklogTasks.map(task => (
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
                      onTaskClick={(t) => setSelectedTaskDetail(t)}
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
              <button onClick={() => setShowMassMoveModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"><X size={14} /></button>
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
                    } catch (e) { console.error(e); }
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

      {/* Task Detail Modal */}
      {selectedTaskDetail && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedTaskDetail(null)}
          />
          <div className="relative bg-white w-full max-w-[1000px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
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
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden border border-slate-200 scale-in-center">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-rose-50/50">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Xóa Sprint</h3>
            </div>
            <div className="px-5 py-4 text-[13px] text-slate-600 font-medium">
              Bạn có chắc chắn muốn xóa sprint này không? Tất cả các công việc (tasks) trong sprint sẽ được chuyển về Backlog. Hành động này không thể hoàn tác.
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button 
                onClick={() => setDeleteSprintConfirm(null)} 
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={executeDeleteSprint} 
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Xóa Sprint
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Error Alert Modal */}
      {errorAlertMessage && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[360px] overflow-hidden border border-slate-200 scale-in-center">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Thông báo</h3>
            </div>
            <div className="px-5 py-5 text-[13px] text-slate-600 font-medium text-center">
              {errorAlertMessage}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-center bg-slate-50/50">
              <button 
                onClick={() => setErrorAlertMessage(null)} 
                className="px-6 py-2 w-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}
