import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, Pencil, Trash2, MoreHorizontal, Plus, Zap, CheckSquare, AlertCircle, Calendar, User, Search, X, Check } from 'lucide-react';
import defaultMan from '../../../../assets/avatar_def_man.png';
import { DraggableTaskRow } from './DraggableTaskRow';
import { InlineTaskCreator } from '../../../../components/workspace/InlineTaskCreator';
import { useLanguage } from '../../../../contexts/LanguageContext';

// ─── Sprint Section ────────────────────────────────────────────────────────
export function SprintSection({ sprint, tasks, project, isExpanded, onToggle, onEdit, onDelete, onStart, onComplete, onMoveToSprint, onDeleteTask, allSprints, selectedTaskIds, onToggleTask, onTaskUpdated, onCreateTask, onTaskClick }: any) {
  const { setNodeRef: setSprintNodeRef, isOver } = useDroppable({
    id: sprint.id,
    data: { type: 'sprint', sprintId: sprint.id }
  });

  const [isCreating, setIsCreating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sprintTasks = tasks.filter((t: any) => t.sprintId === sprint.id);
  const isAllSelected = sprintTasks.length > 0 && sprintTasks.every((t: any) => selectedTaskIds?.has(t.id));

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const checked = e.target.checked;
    sprintTasks.forEach((t: any) => {
      if (checked && !selectedTaskIds.has(t.id)) onToggleTask(t.id);
      else if (!checked && selectedTaskIds.has(t.id)) onToggleTask(t.id);
    });
  };

  const completedCount = sprintTasks.filter((t: any) => {
    const st = project?.statuses?.find((s: any) => s.statusId === t.statusId);
    return st?.category === 'DONE';
  }).length;
  const totalPoints = sprintTasks.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0);

  const statusBadge: Record<string, string> = {
    ACTIVE: 'bg-emerald-500 text-white',
    PLANNING: 'bg-blue-500 text-white',
    COMPLETED: 'bg-slate-400 text-white',
  };

  const daysLeft = sprint.endDate ? Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className={`mb-6 ${isOver ? 'ring-2 ring-blue-400 rounded-sm' : ''}`} ref={setSprintNodeRef}>
      {/* Sprint Header */}
      <div className={`flex items-center gap-2 px-2 py-1.5 bg-background cursor-pointer select-none transition-colors group border border-border rounded-sm ${isExpanded ? 'border-b-0 rounded-b-none' : ''}`}
        onClick={onToggle}>
        <button className="text-muted-foreground hover:bg-slate-200 p-0.5 rounded transition-colors shrink-0 w-5 flex items-center justify-center">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={handleToggleAll}
          onClick={e => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
        />

        <h3 className="font-bold text-foreground text-[13px] truncate">{sprint.name}</h3>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <button className="flex items-center gap-1 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-colors" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil size={11} />
            {sprint.startDate && sprint.endDate ? `${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()}` : t('sprint_section.add_dates')}
          </button>
          <span>{sprintTasks.length === 1 ? t('backlog.work_item').replace('{count}', String(sprintTasks.length)) : t('backlog.work_items').replace('{count}', String(sprintTasks.length))}</span>
          {daysLeft !== null && sprint.status === 'ACTIVE' && (
            <span className={`px-1.5 ${daysLeft < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
              {daysLeft < 0 ? t('sprint_section.overdue') : t('sprint_section.days_remaining').replace('{days}', String(daysLeft))}
            </span>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold">
          <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 ml-2">
            {sprint.status === 'PLANNING' && (
              <button onClick={onStart}
                className="bg-muted hover:bg-slate-200 text-foreground px-3 py-1 rounded font-semibold transition-colors">
                {t('sprint_section.start_sprint')}
              </button>
            )}
            {sprint.status === 'ACTIVE' && (
              <button onClick={onComplete}
                className="bg-muted hover:bg-slate-200 text-foreground px-3 py-1 rounded font-semibold transition-colors">
                {t('sprint_section.complete_sprint')}
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1 text-muted-foreground hover:bg-slate-200 rounded transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-card rounded-lg shadow-xl border border-border py-1 z-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit?.(); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-background flex items-center gap-2"
                  >
                    <Pencil size={14} />
                    {t('sprint_section.edit_sprint')}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete?.(); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    {t('sprint_section.delete_sprint')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      {isExpanded && (
        <div className="flex flex-col border border-border border-t-0 bg-card rounded-b-sm">
          <SortableContext items={sprintTasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
            {sprintTasks.length === 0 && (
              <div className="border border-dashed border-slate-300 bg-background/50 text-muted-foreground text-[13px] text-center py-6 mx-2 my-2 rounded-sm select-none">
                {t('sprint_section.sprint_empty')}
              </div>
            )}
            {sprintTasks.map((task: any) => (
              <DraggableTaskRow
                key={task.id}
                task={task}
                project={project}
                onMoveToSprint={onMoveToSprint}
                onDeleteTask={onDeleteTask}
                sprints={allSprints}
                isSelected={selectedTaskIds?.has(task.id)}
                onToggle={onToggleTask}
                onTaskUpdated={onTaskUpdated}
                onTaskClick={onTaskClick}
              />
            ))}
          </SortableContext>
          {!isCreating ? (
            <div
              onClick={() => setIsCreating(true)}
              className="px-8 py-2 hover:bg-background cursor-pointer text-muted-foreground flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
            >
              <Plus size={14} /> {t('backlog.create')}
            </div>
          ) : (
            <div className="px-2 pb-2">
              <InlineTaskCreator
                onAdd={(title, type, assignee, dueDate) => {
                  onCreateTask(sprint.id, title, type, assignee, dueDate);
                  setIsCreating(false);
                }}
                onCancel={() => setIsCreating(false)}
                projectMembers={project?.members || []}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
