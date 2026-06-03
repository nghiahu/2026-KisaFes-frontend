import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from './SortableTaskCard';
import { Icons } from '../../../../assets/icons';

export const DroppableColumn = ({ column, tasks, children, projectMembers, onTaskUpdate }: any) => {
  const { setNodeRef } = useDroppable({
    id: column.id || column.name,
    data: column
  });

  return (
    <div className="bg-background p-4 rounded-3xl border border-border/60 w-[320px] shrink-0 flex flex-col gap-3 max-h-full">
      <div className="flex items-center justify-between px-2 mb-1 shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="font-extrabold text-sm text-foreground">{column.name}</h4>
          <span className="text-xs bg-slate-200/80 text-muted-foreground px-1.5 py-0.5 rounded-full font-bold">
            {tasks.length}
          </span>
        </div>
        <button className="text-muted-foreground hover:text-muted-foreground">
          <Icons.moreHorizontal size={16} />
        </button>
      </div>

      <div ref={setNodeRef} className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-none pr-1">
        <SortableContext items={tasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task: any) => (
            <SortableTaskCard key={task.id} task={task} projectMembers={projectMembers} onTaskUpdate={onTaskUpdate} />
          ))}
        </SortableContext>
      </div>

      {children}
    </div>
  );
};
