import React, { useState } from 'react';
import { Icons } from '../../../../../assets/icons';
import { useProjectList } from './ProjectListContext';
import { ProjectListRow } from './ProjectListRow';
import { ProjectListNewRow } from './ProjectListNewRow';
import { useLanguage } from '../../../../../contexts/LanguageContext';
import { Skeleton } from '../../../../../components/ui/Skeleton';

export function ProjectListTable() {
  const {
    tasksState: { tasks, isLoading },
    filtersState: { filteredTasks, groupedTasks, groupBy },
    columnsState: { columns, handleDragStart, handleDragOver, handleDrop, handleResizeStart, dragOverColId, resizingColId },
    isAllSelected,
    handleMasterCheckboxToggle
  } = useProjectList();

  const { t } = useLanguage();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(key)) newCollapsed.delete(key);
    else newCollapsed.add(key);
    setCollapsedGroups(newCollapsed);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-card p-6">
      <div className="border border-border/80 rounded-2xl shadow-sm overflow-x-auto bg-card">
        <table className="min-w-max w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/75 border-b border-border text-muted-foreground font-bold text-[11px] uppercase tracking-wider divide-x divide-slate-200/60">
              {columns.map((col: any) => (
                <th
                  key={col.id}
                  draggable={!col.unmovable}
                  onDragStart={(e) => !col.unmovable && handleDragStart(e, col.id)}
                  onDragOver={(e) => !col.unmovable && handleDragOver(e, col.id)}
                  onDrop={(e) => !col.unmovable && handleDrop(e, col.id)}
                  style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }}
                  className={`py-3 px-4 relative ${col.unmovable ? '' : 'cursor-move hover:bg-muted/80'} ${dragOverColId === col.id ? 'bg-primary/10/50 border-l-2 border-l-blue-400' : ''}`}
                >
                  <div className="flex items-center h-full w-full">
                    {col.id === 'checkbox' ? (
                      <div className="w-full text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleMasterCheckboxToggle}
                          className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>
                    ) : col.id === 'actions' ? (
                      <div className="w-4 h-4 rounded hover:bg-slate-200 flex items-center justify-center cursor-pointer text-muted-foreground mx-auto">
                        <Icons.plus size={12} />
                      </div>
                    ) : (
                      <span className="truncate">{col.label}</span>
                    )}
                  </div>
                  {col.id !== 'checkbox' && col.id !== 'actions' && (
                    <div
                      onMouseDown={(e) => handleResizeStart(e, col.id, col.width as number)}
                      className={`absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize hover:bg-blue-400 z-10 ${resizingColId === col.id ? 'bg-primary' : ''}`}
                      title="Drag to resize"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="bg-background/50 border-b border-border">
                  {columns.map((col: any) => (
                    <td key={col.id} className="py-3 px-4">
                      {col.id === 'checkbox' ? (
                        <Skeleton className="h-4 w-4 mx-auto" />
                      ) : col.id === 'actions' ? (
                        <Skeleton className="h-4 w-4 mx-auto" />
                      ) : col.id === 'title' ? (
                        <Skeleton className="h-4 w-3/4 max-w-[300px]" />
                      ) : (
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : groupBy ? (
              groupedTasks.map(({ key, tasks: groupTasks }, groupIndex) => {
                const isCollapsed = collapsedGroups.has(key);
                return (
                  <React.Fragment key={key}>
                    <tr className="bg-background/50 border-b border-border">
                      <td colSpan={columns.length} className="py-2.5 px-4 font-bold text-foreground text-[13px]">
                        <div className="flex items-center gap-2 cursor-pointer w-fit" onClick={() => toggleGroup(key)}>
                          <span className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}>
                            <Icons.chevronDown size={14} className="text-muted-foreground" />
                          </span>
                          <span>{key}</span>
                          <span className="text-muted-foreground font-medium text-[11px] bg-card px-1.5 rounded-full border border-border shadow-sm ml-1">
                            {groupTasks.length}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && groupTasks.map((task: any, index: number) => (
                      <ProjectListRow key={task.id} task={task} index={index} />
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="bg-background/30 p-0 border-0 text-left">
                    <div className="sticky left-1/2 -translate-x-1/2 w-max inline-flex flex-col items-center justify-center py-12">
                      <Icons.search size={32} className="mb-3 text-slate-300" />
                      <p className="font-medium text-[13px] text-muted-foreground">{t('list.no_tasks_found')}</p>
                      <p className="text-[12px] text-muted-foreground mt-1">{t('list.try_changing_filters')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task: any, index: number) => (
                  <ProjectListRow key={task.id} task={task} index={index} />
                ))
              )
            )}
            
            <ProjectListNewRow />
            
          </tbody>
        </table>
      </div>
    </div>
  );
}
