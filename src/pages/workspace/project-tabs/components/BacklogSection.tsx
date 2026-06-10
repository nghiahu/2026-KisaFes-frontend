import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { DraggableTaskRow } from './DraggableTaskRow';
import { InlineTaskCreator } from '../../../../components/workspace/InlineTaskCreator';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface BacklogSectionProps {
  tasks: any[];
  project: any;
  sprints: any[];
  onCreateSprint: () => void;
  onMoveToSprint: (taskId: string, sprintId: string | null) => void;
  onDeleteTask: (taskId: string) => void;
  selectedTaskIds: Set<string>;
  onToggleTask: (id: string) => void;
  onTaskUpdated: () => void;
  onTaskClick: (task: any) => void;
  onCreateTask: (title: string, type: string, assignee: any, dueDate: string) => void;
  searchKeyword: string;
  totalActiveFilters: number;
}

export function BacklogSection({
  tasks,
  project,
  sprints,
  onCreateSprint,
  onMoveToSprint,
  onDeleteTask,
  selectedTaskIds,
  onToggleTask,
  onTaskUpdated,
  onTaskClick,
  onCreateTask,
  searchKeyword,
  totalActiveFilters,
}: BacklogSectionProps) {
  const { t } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Droppable trên toàn bộ section (giống SprintSection)
  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog-container',
    data: { type: 'backlog', sprintId: null },
  });

  const isAllSelected =
    tasks.length > 0 && tasks.every((t: any) => selectedTaskIds?.has(t.id));

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const checked = e.target.checked;
    tasks.forEach((t: any) => {
      if (checked && !selectedTaskIds.has(t.id)) onToggleTask(t.id);
      else if (!checked && selectedTaskIds.has(t.id)) onToggleTask(t.id);
    });
  };

  return (
    <div className={`mb-10 ${isOver ? 'ring-2 ring-blue-400 rounded-sm' : ''}`} ref={setNodeRef}>
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-2 py-1.5 bg-background cursor-pointer select-none transition-colors group border border-border rounded-sm ${isExpanded ? 'border-b-0 rounded-b-none' : ''}`}
        onClick={() => setIsExpanded(p => !p)}
      >
        <button className="text-muted-foreground hover:bg-slate-200 p-0.5 rounded transition-colors shrink-0 w-5 flex items-center justify-center">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={handleToggleAll}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded-sm border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
        />

        <h3 className="font-bold text-foreground text-[13px] truncate">{t('backlog.backlog_label')}</h3>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <span>
            {tasks.length === 1
              ? t('backlog.work_item').replace('{count}', String(tasks.length))
              : t('backlog.work_items').replace('{count}', String(tasks.length))}
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold">
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 ml-2">
            <button
              onClick={onCreateSprint}
              className="bg-muted hover:bg-slate-200 text-foreground px-3 py-1 rounded font-semibold transition-colors"
            >
              {t('backlog.create_sprint')}
            </button>
          </div>
        </div>
      </div>

      {/* Tasks */}
      {isExpanded && (
        <div className="flex flex-col border border-border border-t-0 bg-card rounded-b-sm">
          <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 && (
              <div className="border border-dashed border-slate-300 bg-background/50 text-muted-foreground text-[13px] text-center py-6 mx-2 my-2 rounded-sm select-none">
                {searchKeyword || totalActiveFilters > 0
                  ? t('backlog.no_tasks_filtered')
                  : t('backlog.backlog_empty')}
              </div>
            )}
            {tasks.map((task: any) => (
              <DraggableTaskRow
                key={task.id}
                task={task}
                project={project}
                onMoveToSprint={onMoveToSprint}
                onDeleteTask={onDeleteTask}
                sprints={sprints}
                isSelected={selectedTaskIds.has(task.id)}
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
                  onCreateTask(title, type, assignee, dueDate);
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
