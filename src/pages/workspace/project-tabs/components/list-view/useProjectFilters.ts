import { useState, useMemo } from 'react';

export function useProjectFilters(tasks: any[], currentProject: any) {
  const [activeFilterCategory, setActiveFilterCategory] = useState('Assignee');
  const [filterAssignees, setFilterAssignees] = useState<string[]>([]);
  const [filterAssigneeSearch, setFilterAssigneeSearch] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);

  const [groupBy, setGroupBy] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
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
  }, [tasks, filterAssignees, filterTypes, filterStatuses, filterPriorities]);

  const groupedTasks = useMemo(() => {
    if (!groupBy) return [];
    
    const getGroupKey = (task: any): string => {
      switch (groupBy) {
        case 'status': return task.status || 'No Status';
        case 'assignee': return task.assigneeName || 'Unassigned';
        case 'priority': return task.priority || 'Medium';
        case 'type': return task.type ? (task.type.charAt(0).toUpperCase() + task.type.slice(1)) : 'Task';
        case 'reporter': return task.reporterName || 'Unknown';
        default: return '';
      }
    };

    const map = new Map<string, any[]>();
    filteredTasks.forEach(task => {
      const key = getGroupKey(task);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });

    const groups: { key: string; tasks: any[] }[] = [];
    map.forEach((tArr, key) => groups.push({ key, tasks: tArr }));
    return groups;
  }, [filteredTasks, groupBy]);

  const totalActiveFilters = filterAssignees.length + filterTypes.length + filterStatuses.length + filterPriorities.length;

  const clearAllFilters = () => {
    setFilterAssignees([]);
    setFilterTypes([]);
    setFilterStatuses([]);
    setFilterPriorities([]);
  };

  return {
    activeFilterCategory,
    setActiveFilterCategory,
    filterAssignees,
    setFilterAssignees,
    filterAssigneeSearch,
    setFilterAssigneeSearch,
    filterTypes,
    setFilterTypes,
    filterStatuses,
    setFilterStatuses,
    filterPriorities,
    setFilterPriorities,
    groupBy,
    setGroupBy,
    filteredTasks,
    groupedTasks,
    totalActiveFilters,
    clearAllFilters
  };
}
