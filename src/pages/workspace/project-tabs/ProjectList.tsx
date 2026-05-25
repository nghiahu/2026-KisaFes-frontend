import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../../assets/icons';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateTaskStatus, createTask, fetchTasksByProject, updateTaskAssignee, updateTaskPriority, updateTaskDueDate, updateTaskTitle, deleteTask } from '../../../store/slices/taskSlice';
import defaultAvatar from '../../../assets/avatar_def_man.png';

interface ProjectListProps {
  projectId: string;
  currentProject: any;
  tasks: any[];
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ProjectList({ projectId, currentProject, tasks, setTasks }: ProjectListProps) {
  const dispatch = useAppDispatch();
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<any>(null); // 'automatic' or user object or null (unassigned)
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [showNewTaskAssigneeDropdown, setShowNewTaskAssigneeDropdown] = useState(false);
  const [newTaskAssigneeDropdownPos, setNewTaskAssigneeDropdownPos] = useState<{ top?: number, bottom?: number, left: number }>({ top: 0, left: 0 });

  const newTaskAssigneeTriggerRef = useRef<HTMLButtonElement>(null);
  const newTaskAssigneeDropdownRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [newTaskType, setNewTaskType] = useState('Epic');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<any>({ top: 0, left: 0, bottom: 'auto' });
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState<string | null>(null);
  const [statusDropdownPos, setStatusDropdownPos] = useState({ top: 0, left: 0 });
  // Assignee dropdown state
  const [activeAssigneeDropdownId, setActiveAssigneeDropdownId] = useState<string | null>(null);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({ top: 0, left: 0 });
  const [assigneeSearch, setAssigneeSearch] = useState('');
  // Priority dropdown state
  const [activePriorityDropdownId, setActivePriorityDropdownId] = useState<string | null>(null);
  const [priorityDropdownPos, setPriorityDropdownPos] = useState({ top: 0, left: 0 });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isItemsPerPageOpen, setIsItemsPerPageOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Title inline edit state
  const [activeEditTitleId, setActiveEditTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Filter state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Delete Modal state
  const [deleteModalTask, setDeleteModalTask] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState('Assignee');
  const [filterAssignees, setFilterAssignees] = useState<string[]>([]); // ids or 'unassigned'
  const [filterAssigneeSearch, setFilterAssigneeSearch] = useState('');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  // Group state
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const groupBtnRef = useRef<HTMLButtonElement>(null);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  const { totalElements, totalPages } = useAppSelector(state => state.task);

  const GROUP_OPTIONS = [
    { id: 'status', label: 'Status' },
    { id: 'assignee', label: 'Assignee' },
    { id: 'priority', label: 'Priority' },
    { id: 'type', label: 'Work type' },
    { id: 'reporter', label: 'Reporter' },
  ];

  const totalActiveFilters = filterAssignees.length + filterTypes.length + filterStatuses.length + filterPriorities.length;

  // Columns Drag & Drop state
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem(`project_list_columns_${projectId || 'default'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse columns from localStorage", e);
      }
    }
    return [
      { id: 'checkbox', label: '', width: 48, minWidth: 48, unmovable: true },
      { id: 'work', label: 'Work', width: 350, minWidth: 150, unmovable: true },
      { id: 'assignee', label: 'Assignee', width: 192, minWidth: 70 },
      { id: 'reporter', label: 'Reporter', width: 192, minWidth: 70 },
      { id: 'priority', label: 'Priority', width: 144, minWidth: 70 },
      { id: 'status', label: 'Status', width: 144, minWidth: 70 },
      { id: 'resolution', label: 'Resolution', width: 128, minWidth: 70 },
      { id: 'created', label: 'Created', width: 176, minWidth: 70 },
      { id: 'updated', label: 'Updated', width: 176, minWidth: 70 },
      { id: 'dueDate', label: 'Due date', width: 144, minWidth: 70 },
      { id: 'actions', label: '', width: 48, minWidth: 48, unmovable: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem(`project_list_columns_${projectId || 'default'}`, JSON.stringify(columns));
  }, [columns, projectId]);
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires dataTransfer data to be set
    e.dataTransfer.setData('text/plain', colId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (colId !== dragOverColId) {
      setDragOverColId(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggedColId || draggedColId === targetColId) return;

    setColumns(prev => {
      const oldIndex = prev.findIndex(c => c.id === draggedColId);
      const newIndex = prev.findIndex(c => c.id === targetColId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const newCols = [...prev];
      const [removed] = newCols.splice(oldIndex, 1);
      newCols.splice(newIndex, 0, removed);
      return newCols;
    });
    setDraggedColId(null);
  };

  // Resize Handlers
  const handleResizeStart = (e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent drag-and-drop
    setResizingColId(colId);
    setStartX(e.clientX);
    setStartWidth(currentWidth);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColId) return;
      const dx = e.clientX - startX;
      setColumns(prev => prev.map(col => {
        if (col.id === resizingColId) {
          const newWidth = Math.max(col.minWidth || 100, startWidth + dx);
          return { ...col, width: newWidth };
        }
        return col;
      }));
    };

    const handleMouseUp = () => {
      if (resizingColId) {
        setResizingColId(null);
      }
    };

    if (resizingColId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColId, startX, startWidth]);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inlineRowRef = useRef<HTMLTableRowElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeSearchRef = useRef<HTMLInputElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);
  
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);
  const [actionDropdownPos, setActionDropdownPos] = useState({ top: 0, left: 0 });
  const actionDropdownRef = useRef<HTMLDivElement>(null);

  // Project members list for assignee dropdown
  const projectMembers: any[] = currentProject?.members?.filter((m: any) => m.active !== false) || [];

  const filteredMembers = projectMembers.filter((m: any) =>
    !assigneeSearch.trim() ||
    (m.name || '').toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDropdown = dropdownRef.current ? !dropdownRef.current.contains(event.target as Node) : true;
      const isOutsideTrigger = triggerRef.current ? !triggerRef.current.contains(event.target as Node) : true;

      if (isOutsideDropdown && isOutsideTrigger) {
        setShowTypeDropdown(false);
      }

      const isOutsideStatusDropdown = statusDropdownRef.current ? !statusDropdownRef.current.contains(event.target as Node) : true;
      if (isOutsideStatusDropdown) {
        setActiveStatusDropdownId(null);
      }

      const isOutsideAssigneeDropdown = assigneeDropdownRef.current ? !assigneeDropdownRef.current.contains(event.target as Node) : true;
      if (isOutsideAssigneeDropdown) {
        setActiveAssigneeDropdownId(null);
        setAssigneeSearch('');
      }

      const isOutsideNewTaskAssignee = newTaskAssigneeDropdownRef.current ? !newTaskAssigneeDropdownRef.current.contains(event.target as Node) : true;
      const isOutsideNewTaskAssigneeTrigger = newTaskAssigneeTriggerRef.current ? !newTaskAssigneeTriggerRef.current.contains(event.target as Node) : true;
      if (isOutsideNewTaskAssignee && isOutsideNewTaskAssigneeTrigger) {
        setShowNewTaskAssigneeDropdown(false);
      }

      const isOutsidePriorityDropdown = priorityDropdownRef.current ? !priorityDropdownRef.current.contains(event.target as Node) : true;
      if (isOutsidePriorityDropdown) {
        setActivePriorityDropdownId(null);
      }

      const isOutsideItemsPerPage = itemsPerPageRef.current ? !itemsPerPageRef.current.contains(event.target as Node) : true;
      if (isOutsideItemsPerPage) {
        setIsItemsPerPageOpen(false);
      }

      const isOutsideActionDropdown = actionDropdownRef.current ? !actionDropdownRef.current.contains(event.target as Node) : true;
      if (isOutsideActionDropdown) {
        setActiveActionDropdownId(null);
      }

      const isOutsideInlineRow = inlineRowRef.current ? !inlineRowRef.current.contains(event.target as Node) : true;
      if (isCreatingTask && isOutsideInlineRow && isOutsideDropdown && isOutsideNewTaskAssignee) {
        setIsCreatingTask(false);
      }

      // Close filter panel
      const isOutsideFilter = filterPanelRef.current ? !filterPanelRef.current.contains(event.target as Node) : true;
      const isOutsideFilterBtn = filterBtnRef.current ? !filterBtnRef.current.contains(event.target as Node) : true;
      if (isOutsideFilter && isOutsideFilterBtn) {
        setShowFilterPanel(false);
      }

      // Close group dropdown
      const isOutsideGroup = groupDropdownRef.current ? !groupDropdownRef.current.contains(event.target as Node) : true;
      const isOutsideGroupBtn = groupBtnRef.current ? !groupBtnRef.current.contains(event.target as Node) : true;
      if (isOutsideGroup && isOutsideGroupBtn) {
        setShowGroupDropdown(false);
      }
    };

    const handleScroll = () => {
      if (showTypeDropdown) setShowTypeDropdown(false);
      if (activeStatusDropdownId) setActiveStatusDropdownId(null);
      if (activeAssigneeDropdownId) {
        setActiveAssigneeDropdownId(null);
        setAssigneeSearch('');
      }
      if (activePriorityDropdownId) setActivePriorityDropdownId(null);
      if (activeActionDropdownId) setActiveActionDropdownId(null);
    };

    if (showTypeDropdown || isCreatingTask || activeStatusDropdownId || activeAssigneeDropdownId || activePriorityDropdownId || showFilterPanel || showGroupDropdown || activeActionDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    if (showTypeDropdown || activeStatusDropdownId || activeAssigneeDropdownId || activePriorityDropdownId || activeActionDropdownId) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showTypeDropdown, isCreatingTask, activeStatusDropdownId, activeAssigneeDropdownId, activePriorityDropdownId, showFilterPanel, showGroupDropdown]);

  // Fetch from backend when pagination or search changes
  useEffect(() => {
    if (projectId) {
      // Debounce search slightly or just fetch directly
      const timer = setTimeout(() => {
        dispatch(fetchTasksByProject({
          projectId,
          params: {
            page: currentPage,
            size: itemsPerPage,
            keyword: searchKeyword || undefined
          }
        }));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [projectId, currentPage, itemsPerPage, searchKeyword, dispatch]);

  // Auto-focus search input when assignee dropdown opens
  useEffect(() => {
    if (activeAssigneeDropdownId && assigneeSearchRef.current) {
      setTimeout(() => assigneeSearchRef.current?.focus(), 50);
    }
  }, [activeAssigneeDropdownId]);

  const handleToggleDropdown = () => {
    if (!showTypeDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 160) { // Nếu không đủ chỗ dưới
        setDropdownPos({ top: 'auto', bottom: window.innerHeight - rect.top + 4, left: rect.left });
      } else {
        setDropdownPos({ top: rect.bottom + 4, bottom: 'auto', left: rect.left });
      }
    }
    setShowTypeDropdown(!showTypeDropdown);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle || !newTaskTitle.trim() || !currentProject) return;
    const firstStatusId = currentProject.statuses?.[0]?.statusId || "";
    try {
      await dispatch(createTask({
        projectId: currentProject.id,
        title: newTaskTitle.trim(),
        statusId: firstStatusId,
        type: newTaskType.toLowerCase(),
        assigneeId: newTaskAssignee && newTaskAssignee !== 'automatic' ? newTaskAssignee.id : null,
        dueDate: newTaskDueDate ? `${newTaskDueDate}T00:00:00` : null
      })).unwrap();

      // Refetch current page to maintain correct pagination UI
      dispatch(fetchTasksByProject({
        projectId: currentProject.id,
        params: {
          page: currentPage,
          size: itemsPerPage,
          keyword: searchKeyword || undefined
        }
      }));

      setNewTaskTitle('');
      setNewTaskAssignee(null);
      setNewTaskDueDate('');
      setIsCreatingTask(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleAssigneeSelect = async (task: any, member: any | null) => {
    setActiveAssigneeDropdownId(null);
    setAssigneeSearch('');

    const newAssigneeId = member ? member.id : null;
    const newAssigneeName = member ? member.name : 'Unassigned';

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, assigneeId: newAssigneeId, assigneeName: newAssigneeName } : t
    ));

    try {
      if (task.dbId) {
        await dispatch(updateTaskAssignee({ taskId: task.dbId, assigneeId: newAssigneeId })).unwrap();
      }
    } catch (err) {
      console.error("Failed to update assignee:", err);
      // Rollback on error
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, assigneeId: task.assigneeId, assigneeName: task.assigneeName } : t
      ));
    }
  };

  const handlePrioritySelect = async (task: any, priority: string) => {
    setActivePriorityDropdownId(null);
    const oldPriority = task.priority;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority } : t));
    try {
      if (task.dbId) {
        await dispatch(updateTaskPriority({ taskId: task.dbId, priority })).unwrap();
      }
    } catch (err) {
      console.error('Failed to update priority:', err);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority: oldPriority } : t));
    }
  };

  const handleDueDateChange = async (task: any, newDate: string) => {
    const formattedDate = newDate ? `${newDate}T00:00:00` : null;
    const oldDate = task.dueDate;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, dueDate: formattedDate } : t));
    try {
      if (task.dbId) {
        await dispatch(updateTaskDueDate({ taskId: task.dbId, dueDate: formattedDate })).unwrap();
      }
    } catch (err) {
      console.error("Failed to update due date:", err);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, dueDate: oldDate } : t));
    }
  };

  const handleTitleSubmit = async (task: any) => {
    if (!editTitleValue.trim() || editTitleValue.trim() === task.title) {
      setActiveEditTitleId(null);
      return;
    }
    const newTitle = editTitleValue.trim();
    const oldTitle = task.title;
    // optimistic
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: newTitle } : t));
    setActiveEditTitleId(null);
    try {
      if (task.dbId) {
        await dispatch(updateTaskTitle({ taskId: task.dbId, title: newTitle })).unwrap();
      }
    } catch (err) {
      console.error("Failed to update task title:", err);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: oldTitle } : t));
    }
  };

  const PRIORITIES = [
    { label: 'Highest', icon: <Icons.chevronsUp size={12} className="text-rose-500" />, color: 'text-rose-600' },
    { label: 'High', icon: <Icons.chevronUp size={12} className="text-orange-500" />, color: 'text-orange-500' },
    { label: 'Medium', icon: <Icons.equal size={12} strokeWidth={3} className="text-amber-500" />, color: 'text-amber-500' },
    { label: 'Low', icon: <Icons.chevronDown size={12} className="text-blue-400" />, color: 'text-blue-400' },
    { label: 'Lowest', icon: <Icons.chevronsDown size={12} className="text-slate-400" />, color: 'text-slate-400' },
  ];

  const getPriorityIcon = (priority: string | null | undefined) => {
    const p = PRIORITIES.find(x => x.label?.toLowerCase() === (priority || '').toLowerCase());
    return p ? p.icon : <Icons.equal size={12} strokeWidth={3} className="text-amber-500" />;
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    const p = PRIORITIES.find(x => x.label?.toLowerCase() === (priority || '').toLowerCase());
    return p ? p.color : 'text-slate-500';
  };

  // Pagination Logic (Backend)
  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIndex = (validCurrentPage - 1) * itemsPerPage;

  // Client-side filter on the fetched page
  const filteredTasks = tasks.filter(task => {
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

  const endIndex = Math.min(startIndex + filteredTasks.length, totalElements);

  // Group logic
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

  // Build grouped structure
  const groupedTasks: { key: string; tasks: any[] }[] = [];
  if (groupBy) {
    const map = new Map<string, any[]>();
    filteredTasks.forEach(task => {
      const key = getGroupKey(task);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    map.forEach((tArr, key) => groupedTasks.push({ key, tasks: tArr }));
  }

  const currentTasks = filteredTasks; // used for non-grouped rendering

  const getTypeInfo = (type: string) => {
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'epic': return { icon: <Icons.zap size={10} className="fill-current" />, bg: 'bg-violet-100', color: 'text-violet-600', label: 'Epic' };
      case 'story': return { icon: <Icons.zap size={10} className="fill-current" />, bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Story' };
      case 'incident':
      case 'bug': return { icon: <Icons.alertCircle size={10} />, bg: 'bg-rose-100', color: 'text-rose-600', label: 'Incident' };
      case 'service request': return { icon: <Icons.alertCircle size={10} />, bg: 'bg-amber-100', color: 'text-amber-600', label: 'Service Request' };
      case 'task':
      default: return { icon: <Icons.checkSquare size={10} />, bg: 'bg-blue-100', color: 'text-blue-600', label: 'Task' };
    }
  };


  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Icons.search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search work"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 w-44 bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg text-xs font-semibold text-slate-700 outline-none transition-all shadow-sm"
            />
          </div>
          {/* Filter Button */}
          <div className="relative">
            <button
              ref={filterBtnRef}
              onClick={() => { setShowFilterPanel(v => !v); setShowGroupDropdown(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${
                totalActiveFilters > 0
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
                {/* Categories + Values side-by-side */}
                <div className="flex" style={{ minHeight: 240 }}>
                  {/* Left: Filter Categories */}
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
                        className={`w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-left transition-colors ${
                          activeFilterCategory === cat.id
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

                  {/* Right: Filter Values */}
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
                            ...projectMembers.map((m: any) => ({ id: m.id, name: m.name, avatar: m.avatar }))
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
                              <span className="flex items-center gap-1.5">
                                {getPriorityIcon(priority)}
                                <span className={`text-[12px] font-medium ${getPriorityColor(priority)}`}>{priority}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => { setFilterAssignees([]); setFilterTypes([]); setFilterStatuses([]); setFilterPriorities([]); }}
                    className={`text-[11px] font-semibold transition-colors ${
                      totalActiveFilters > 0 ? 'text-slate-500 hover:text-slate-800' : 'text-slate-300 cursor-default'
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

          {/* Group Button */}
          <div className="relative">
            <button
              ref={groupBtnRef}
              onClick={() => { setShowGroupDropdown(v => !v); setShowFilterPanel(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${
                groupBy
                  ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Icons.layers size={13} className={groupBy ? 'text-blue-500' : 'text-slate-400'} />
              <span>Group{groupBy ? `: ${GROUP_OPTIONS.find(g => g.id === groupBy)?.label}` : ''}</span>
            </button>

            {/* Group Dropdown */}
            {showGroupDropdown && (
              <div
                ref={groupDropdownRef}
                className="absolute top-full left-0 mt-1.5 w-[240px] bg-white border border-slate-200 shadow-2xl rounded-xl py-2 z-[200] overflow-hidden"
              >
                <div className="px-3 pb-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
                    <Icons.search size={12} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search grouping options"
                      value={groupSearch}
                      onChange={e => setGroupSearch(e.target.value)}
                      autoFocus
                      className="flex-1 text-[12px] text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  <div className="px-3 py-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All fields</span>
                  </div>
                  {GROUP_OPTIONS.filter(g => g.label.toLowerCase().includes(groupSearch.toLowerCase())).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setGroupBy(groupBy === opt.id ? null : opt.id); setShowGroupDropdown(false); setGroupSearch(''); setCollapsedGroups(new Set()); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium transition-colors text-left ${
                        groupBy === opt.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {groupBy === opt.id && <Icons.check size={13} className="text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-1 pt-1 px-3">
                  <button
                    onClick={() => { setGroupBy(null); setShowGroupDropdown(false); setCollapsedGroups(new Set()); }}
                    className={`text-[12px] font-medium py-1.5 transition-colors ${
                      groupBy ? 'text-slate-500 hover:text-slate-700' : 'text-slate-300 cursor-default'
                    }`}
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold text-slate-400">Saved filters v</span>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-50 shadow-sm">
            <button className="p-1 bg-white rounded-md shadow-sm border border-slate-100 text-slate-800 shrink-0">
              <Icons.listTodo size={13} />
            </button>
            <button className="p-1 text-slate-400 hover:text-slate-600 shrink-0">
              <Icons.kanbanSquare size={13} />
            </button>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            <Icons.moreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-y-auto bg-white p-6">
        <div className="border border-slate-200/80 rounded-2xl shadow-sm overflow-x-auto bg-white">
          <table className="min-w-max w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider divide-x divide-slate-200/60">
                {columns.map(col => (
                  <th
                    key={col.id}
                    draggable={!col.unmovable}
                    onDragStart={(e) => !col.unmovable && handleDragStart(e, col.id)}
                    onDragOver={(e) => !col.unmovable && handleDragOver(e, col.id)}
                    onDrop={(e) => !col.unmovable && handleDrop(e, col.id)}
                    style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }}
                    className={`py-3 px-4 relative ${col.unmovable ? '' : 'cursor-move hover:bg-slate-100/80'} ${dragOverColId === col.id ? 'bg-blue-50/50 border-l-2 border-l-blue-400' : ''}`}
                  >
                    <div className="flex items-center h-full w-full">
                      {col.id === 'checkbox' ? (
                        <div className="w-full text-center">
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </div>
                      ) : col.id === 'actions' ? (
                        <div className="w-4 h-4 rounded hover:bg-slate-200 flex items-center justify-center cursor-pointer text-slate-500 mx-auto">
                          <Icons.plus size={12} />
                        </div>
                      ) : (
                        <span className="truncate">{col.label}</span>
                      )}
                    </div>
                    {col.id !== 'checkbox' && col.id !== 'actions' && (
                      <div
                        onMouseDown={(e) => handleResizeStart(e, col.id, col.width as number)}
                        className={`absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize hover:bg-blue-400 z-10 ${resizingColId === col.id ? 'bg-blue-500' : ''}`}
                        title="Drag to resize"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupBy ? (
                groupedTasks.map(({ key, tasks: groupTasks }) => {
                  const isCollapsed = collapsedGroups.has(key);
                  return (
                    <React.Fragment key={key}>
                      {/* Group Header Row */}
                      <tr key={`group-hdr-${key}`} className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={columns.length} className="py-2 px-4">
                          <button
                            onClick={() => setCollapsedGroups(prev => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key); else next.add(key);
                              return next;
                            })}
                            className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors"
                          >
                            <span className={`transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}>
                              <Icons.chevronRight size={13} className="text-slate-400" />
                            </span>
                            <span className="text-[12px] font-bold">{key}</span>
                            <span className="text-[11px] font-medium text-slate-400 ml-1">({groupTasks.length})</span>
                          </button>
                        </td>
                      </tr>
                      {/* Group Task Rows */}
                      {!isCollapsed && groupTasks.map((task, index) => {
                        const typeInfo = getTypeInfo(task.type);
                        const isAssigneeOpen = activeAssigneeDropdownId === task.id;
                        const hasAssignee = task.assigneeName && task.assigneeName !== 'Unassigned';
                        return (
                          <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group divide-x divide-slate-200/60">
                            {columns.map(col => {
                              switch (col.id) {
                                case 'checkbox': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
                                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                  </td>
                                );
                                case 'work': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                                    <div className="flex items-center gap-2.5 min-w-0 w-full overflow-hidden">
                                      <span className={`w-4 h-4 rounded ${typeInfo.bg} flex items-center justify-center ${typeInfo.color} shrink-0 font-black shadow-sm`} title={typeInfo.label}>{typeInfo.icon}</span>
                                      <span className="text-blue-600 hover:underline cursor-pointer font-bold shrink-0 whitespace-nowrap">{task.taskKey || `ISSUE-${String(startIndex + index + 1).padStart(2, '0')}`}</span>
                                      {activeEditTitleId === task.id ? (
                                        <div className="flex items-center flex-1 min-w-0 gap-1" onClick={e => e.stopPropagation()}>
                                          <input 
                                            type="text" 
                                            value={editTitleValue}
                                            onChange={e => setEditTitleValue(e.target.value)}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') handleTitleSubmit(task);
                                              if (e.key === 'Escape') setActiveEditTitleId(null);
                                            }}
                                            autoFocus
                                            className="flex-1 border border-blue-400 bg-white px-2 py-1 rounded-[3px] text-xs outline-none focus:ring-1 focus:ring-blue-400 min-w-0"
                                          />
                                          <button onClick={(e) => { e.stopPropagation(); handleTitleSubmit(task); }} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0 flex items-center justify-center"><Icons.check size={14} className="text-slate-700" /></button>
                                          <button onClick={(e) => { e.stopPropagation(); setActiveEditTitleId(null); }} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0 flex items-center justify-center"><Icons.x size={14} className="text-slate-700" /></button>
                                        </div>
                                      ) : (
                                        <span 
                                          className="text-slate-700 group-hover:text-blue-600 transition-colors truncate flex-1 cursor-pointer" 
                                          title={task.title}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveEditTitleId(task.id);
                                            setEditTitleValue(task.title);
                                          }}
                                        >
                                          {task.title}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                                case 'assignee': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs font-semibold">
                                    <span className={`truncate flex-1 ${hasAssignee ? 'text-slate-700' : 'text-slate-400'}`}>{task.assigneeName || 'Unassigned'}</span>
                                  </td>
                                );
                                case 'reporter': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                                    {task.reporterName || '—'}
                                  </td>
                                );
                                case 'priority': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs font-semibold">
                                    <span className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                      {getPriorityIcon(task.priority)}
                                      <span>{task.priority || 'Medium'}</span>
                                    </span>
                                  </td>
                                );
                                case 'status': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${
                                      (task.status || '').toLowerCase().includes('done') || (task.status || '').toLowerCase().includes('hoàn')
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : (task.status || '').toLowerCase().includes('progress') || (task.status || '').toLowerCase().includes('đang')
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}>{task.status}</span>
                                  </td>
                                );
                                case 'resolution': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                                    {task.resolution || '—'}
                                  </td>
                                );
                                case 'created': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs text-slate-500 font-medium truncate">
                                    {task.createdAt ? new Date(task.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                  </td>
                                );
                                case 'updated': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs text-slate-500 font-medium truncate">
                                    {task.updatedAt ? new Date(task.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                  </td>
                                );
                                case 'dueDate': return (
                                  <td 
                                    key={col.id} 
                                    style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} 
                                    className="py-3.5 px-4 text-xs font-medium truncate group/date relative cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={(e) => {
                                      const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                                      if (input) {
                                        try { input.showPicker(); } catch (err) { input.focus(); }
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between pointer-events-none">
                                      {task.dueDate ? <span className="text-slate-700">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span className="text-slate-400">None</span>}
                                      {task.dueDate && (
                                        <button 
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDueDateChange(task, ''); }} 
                                          className="opacity-0 group-hover/date:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity ml-2 z-[20] relative pointer-events-auto"
                                          title="Clear due date"
                                        >
                                          <Icons.x size={13} />
                                        </button>
                                      )}
                                    </div>
                                    <input
                                      type="date"
                                      value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                                      onChange={(e) => handleDueDateChange(task, e.target.value)}
                                      className="absolute w-0 h-0 opacity-0 pointer-events-none"
                                      title="Click to edit due date"
                                    />
                                  </td>
                                );
                                case 'actions': return (
                                  <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
                                    <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all">
                                      <Icons.moreHorizontal size={14} />
                                    </button>
                                  </td>
                                );
                                default: return null;
                              }
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                currentTasks.map((task, index) => {
                  const typeInfo = getTypeInfo(task.type);
                  const isAssigneeOpen = activeAssigneeDropdownId === task.id;
                  const hasAssignee = task.assigneeName && task.assigneeName !== 'Unassigned';

                  return (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group divide-x divide-slate-200/60">
                      {columns.map(col => {
                        switch (col.id) {
                          case 'checkbox': return (
                            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
                              <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            </td>
                          );
                          case 'work': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0 w-full overflow-hidden">
                              <span className={`w-4 h-4 rounded ${typeInfo.bg} flex items-center justify-center ${typeInfo.color} shrink-0 font-black shadow-sm`} title={typeInfo.label}>
                                {typeInfo.icon}
                              </span>
                              <span className="text-blue-600 hover:underline cursor-pointer font-bold shrink-0 whitespace-nowrap">
                                {task.taskKey || `ISSUE-${String(startIndex + index + 1).padStart(2, '0')}`}
                              </span>
                              {activeEditTitleId === task.id ? (
                                <div className="flex items-center flex-1 min-w-0 gap-1" onClick={e => e.stopPropagation()}>
                                  <input 
                                    type="text" 
                                    value={editTitleValue}
                                    onChange={e => setEditTitleValue(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleTitleSubmit(task);
                                      if (e.key === 'Escape') setActiveEditTitleId(null);
                                    }}
                                    autoFocus
                                    className="flex-1 border border-blue-400 bg-white px-2 py-1 rounded-[3px] text-xs outline-none focus:ring-1 focus:ring-blue-400 min-w-0"
                                  />
                                  <button onClick={(e) => { e.stopPropagation(); handleTitleSubmit(task); }} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0 flex items-center justify-center"><Icons.check size={14} className="text-slate-700" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); setActiveEditTitleId(null); }} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0 flex items-center justify-center"><Icons.x size={14} className="text-slate-700" /></button>
                                </div>
                              ) : (
                                <span 
                                  className="text-slate-700 group-hover:text-blue-600 transition-colors truncate flex-1 cursor-pointer" 
                                  title={task.title}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveEditTitleId(task.id);
                                    setEditTitleValue(task.title);
                                  }}
                                >
                                  {task.title}
                                </span>
                              )}
                              
                              <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-2 transition-all shrink-0">
                                <Icons.arrowUpRight size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                                <Icons.plus size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                              </span>
                            </div>
                          </td>
                        );
                        case 'assignee': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs font-semibold">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAssigneeOpen) {
                                  setActiveAssigneeDropdownId(null);
                                  setAssigneeSearch('');
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setAssigneeDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                  setActiveAssigneeDropdownId(task.id);
                                  setAssigneeSearch('');
                                }
                              }}
                              className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all hover:bg-slate-100 cursor-pointer group/assignee w-full text-left overflow-hidden ${isAssigneeOpen ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}
                            >
                              {hasAssignee ? (
                                <img
                                  src={task.assigneeAvatar || defaultAvatar}
                                  alt={task.assigneeName}
                                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                                  <Icons.user size={10} />
                                </div>
                              )}
                              <span className={`truncate flex-1 ${hasAssignee ? 'text-slate-700 font-medium' : 'text-slate-400 font-medium'}`} title={task.assigneeName || 'Unassigned'}>
                                {task.assigneeName || 'Unassigned'}
                              </span>
                              <Icons.chevronDown size={10} className="ml-auto text-slate-300 opacity-0 group-hover/assignee:opacity-100 transition-opacity shrink-0" />
                            </button>

                            {/* Assignee Dropdown Portal */}
                            {isAssigneeOpen && createPortal(
                              <div
                                ref={assigneeDropdownRef}
                                className="fixed w-[230px] bg-white border border-slate-200 shadow-2xl rounded-xl py-2 z-[9999] overflow-hidden"
                                style={{ top: assigneeDropdownPos.top, left: assigneeDropdownPos.left }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Search bar */}
                                <div className="px-3 pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
                                    <Icons.search size={12} className="text-slate-400 shrink-0" />
                                    <input
                                      ref={assigneeSearchRef}
                                      type="text"
                                      placeholder="Tìm người dùng..."
                                      value={assigneeSearch}
                                      onChange={(e) => setAssigneeSearch(e.target.value)}
                                      className="flex-1 text-[12px] text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                                    />
                                    {assigneeSearch && (
                                      <button
                                        onClick={() => setAssigneeSearch('')}
                                        className="text-slate-400 hover:text-slate-600 shrink-0"
                                      >
                                        <Icons.x size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Member list */}
                                <div className="max-h-[220px] overflow-y-auto py-1">
                                  {/* Unassigned option */}
                                  {(!assigneeSearch.trim() || 'unassigned'.includes(assigneeSearch.toLowerCase())) && (
                                    <button
                                      onClick={() => handleAssigneeSelect(task, null)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${!hasAssignee ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                                        <Icons.user size={11} />
                                      </div>
                                      <span>Unassigned</span>
                                      {!hasAssignee && (
                                        <Icons.check size={12} className="ml-auto text-blue-500 shrink-0" />
                                      )}
                                    </button>
                                  )}

                                  {/* Members */}
                                  {filteredMembers.length > 0 && (
                                    <>
                                      {!assigneeSearch.trim() && (
                                        <div className="px-3 py-1 mt-1">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thành viên dự án</span>
                                        </div>
                                      )}
                                      {filteredMembers.map((member: any) => {
                                        const isSelected = task.assigneeId === member.id;
                                        return (
                                          <button
                                            key={member.id}
                                            onClick={() => handleAssigneeSelect(task, member)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                                              }`}
                                          >
                                            <img
                                              src={member.avatar || defaultAvatar}
                                              alt={member.name}
                                              className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
                                            />
                                            <div className="flex flex-col min-w-0">
                                              <span className="truncate font-semibold">{member.name}</span>
                                              {member.email && (
                                                <span className="truncate text-[10px] text-slate-400 font-normal">{member.email}</span>
                                              )}
                                            </div>
                                            {isSelected && (
                                              <Icons.check size={12} className="ml-auto text-blue-500 shrink-0" />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </>
                                  )}

                                  {/* No search results */}
                                  {filteredMembers.length === 0 && assigneeSearch.trim() && (
                                    <div className="px-3 py-4 text-center">
                                      <Icons.userX size={20} className="text-slate-300 mx-auto mb-1" />
                                      <p className="text-[11px] text-slate-400">Không tìm thấy người dùng</p>
                                    </div>
                                  )}

                                  {/* No members at all */}
                                  {projectMembers.length === 0 && (
                                    <div className="px-3 py-4 text-center">
                                      <p className="text-[11px] text-slate-400">Chưa có thành viên nào</p>
                                    </div>
                                  )}
                                </div>
                              </div>,
                              document.body
                            )}
                          </td>
                        );
                        case 'reporter': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-slate-600 text-xs font-bold">
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                              <img
                                src={task.reporterAvatar || defaultAvatar}
                                alt={task.reporterName || 'Reporter'}
                                className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <span className="text-slate-700 truncate" title={task.reporterName || 'Unassigned'}>{task.reporterName || 'Unassigned'}</span>
                            </div>
                          </td>
                        );
                        case 'priority': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs font-semibold">
                            <button
                              disabled={task.type === 'epic'}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task.type === 'epic') return;
                                if (activePriorityDropdownId === task.id) {
                                  setActivePriorityDropdownId(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setPriorityDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                  setActivePriorityDropdownId(task.id);
                                }
                              }}
                              title={task.type === 'epic' ? 'Epic luôn có priority Medium' : undefined}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all w-full text-left overflow-hidden ${task.type === 'epic'
                                ? 'cursor-default opacity-70'
                                : 'hover:bg-slate-100 cursor-pointer group/priority'
                                } ${activePriorityDropdownId === task.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}
                            >
                              <span className={`flex items-center justify-center shrink-0 ${getPriorityColor(task.priority)}`}>
                                {getPriorityIcon(task.priority)}
                              </span>
                              <span className={`truncate flex-1 ${getPriorityColor(task.priority)}`}>{task.priority || 'Medium'}</span>
                              {task.type !== 'epic' && (
                                <Icons.chevronDown size={10} className="ml-auto text-slate-300 opacity-0 group-hover/priority:opacity-100 transition-opacity shrink-0" />
                              )}
                            </button>

                            {/* Priority Dropdown Portal */}
                            {activePriorityDropdownId === task.id && createPortal(
                              <div
                                ref={priorityDropdownRef}
                                className="fixed w-[160px] bg-white border border-slate-200 shadow-2xl rounded-xl py-1.5 z-[9999] overflow-hidden"
                                style={{ top: priorityDropdownPos.top, left: priorityDropdownPos.left }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {PRIORITIES.map((p) => {
                                  const isSelected = (task.priority || 'Medium').toLowerCase() === p.label.toLowerCase();
                                  return (
                                    <button
                                      key={p.label}
                                      onClick={() => handlePrioritySelect(task, p.label)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                      <span className="shrink-0">{p.icon}</span>
                                      <span>{p.label}</span>
                                      {isSelected && <Icons.check size={11} className="ml-auto text-blue-500 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>,
                              document.body
                            )}
                          </td>
                        );
                        case 'status': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4">
                            <div className="relative inline-block w-full overflow-hidden">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeStatusDropdownId === task.id) {
                                    setActiveStatusDropdownId(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setStatusDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                    setActiveStatusDropdownId(task.id);
                                  }
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[9px] font-black tracking-wider uppercase transition-colors shadow-sm max-w-full ${task.status === 'Done' || task.status?.toLowerCase().includes('done') || task.status?.toLowerCase().includes('hoàn thành')
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                  : task.status === 'In Progress' || task.status?.toLowerCase().includes('progress') || task.status?.toLowerCase().includes('đang')
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                              >
                                <span className="truncate">{task.status}</span>
                                <span className="text-[7px] text-slate-400 shrink-0">▼</span>
                              </button>

                              {/* Status Dropdown (Portal) */}
                              {activeStatusDropdownId === task.id && createPortal(
                                <div
                                  ref={statusDropdownRef}
                                  className="fixed w-[180px] bg-white border border-slate-200 shadow-xl rounded-[4px] py-1.5 z-[9999]"
                                  style={{ top: statusDropdownPos.top, left: statusDropdownPos.left }}
                                >
                                  <div className="px-1 max-h-[250px] overflow-y-auto">
                                    {currentProject?.statuses?.map((statusObj: any) => {
                                      const isSelected = statusObj.label === task.status || statusObj.statusId === task.statusId;
                                      return (
                                        <button
                                          key={statusObj.statusId}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            setActiveStatusDropdownId(null);
                                            if (isSelected) return;

                                            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: statusObj.label, statusId: statusObj.statusId } : t));
                                            try {
                                              if (task.dbId) {
                                                await dispatch(updateTaskStatus({ taskId: task.dbId, statusId: statusObj.statusId })).unwrap();
                                              }
                                            } catch (err) {
                                              console.error("Failed to update status in backend:", err);
                                            }
                                          }}
                                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold rounded-[3px] text-left transition-colors ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                          <div className="w-4 flex items-center justify-center shrink-0">
                                            {isSelected && <Icons.check size={12} className="text-blue-600" />}
                                          </div>
                                          <span className="truncate">{statusObj.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>,
                                document.body
                              )}
                            </div>
                          </td>
                        );
                        case 'resolution': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs font-semibold text-slate-600 truncate">
                            {(() => {
                              const res = task.resolution;
                              if (!res) return 'Unresolved';
                              const mapping: Record<string, string> = {
                                UNRESOLVED: 'Unresolved',
                                DONE: 'Done',
                                WONT_FIX: "Won't Fix",
                                DUPLICATE: 'Duplicate',
                                CANNOT_REPRODUCE: 'Cannot Reproduce',
                                FIXED: 'Fixed'
                              };
                              return mapping[res] || res;
                            })()}
                          </td>
                        );
                        case 'created': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs text-slate-500 font-medium truncate">
                            {task.createdAt
                              ? new Date(task.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                              : '—'}
                          </td>
                        );
                        case 'updated': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs text-slate-500 font-medium truncate">
                            {task.updatedAt
                              ? new Date(task.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                              : '—'}
                          </td>
                        );
                        case 'dueDate': return (
                          <td 
                            key={col.id} 
                            style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} 
                            className="py-3.5 px-4 text-xs font-medium truncate group/date relative cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={(e) => {
                              const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                              if (input) {
                                try { input.showPicker(); } catch (err) { input.focus(); }
                              }
                            }}
                          >
                            <div className="flex items-center justify-between pointer-events-none">
                              {task.dueDate ? <span className="text-slate-700">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span className="text-slate-400">None</span>}
                              {task.dueDate && (
                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDueDateChange(task, ''); }} 
                                  className="opacity-0 group-hover/date:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity ml-2 z-[20] relative pointer-events-auto"
                                  title="Clear due date"
                                >
                                  <Icons.x size={13} />
                                </button>
                              )}
                            </div>
                            <input
                              type="date"
                              value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                              onChange={(e) => handleDueDateChange(task, e.target.value)}
                              className="absolute w-0 h-0 opacity-0 pointer-events-none"
                              title="Click to edit due date"
                            />
                          </td>
                        );
                        case 'actions': return (
                          <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeActionDropdownId === task.id) {
                                  setActiveActionDropdownId(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setActionDropdownPos({ top: rect.bottom + 4, left: rect.left - 120 });
                                  setActiveActionDropdownId(task.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
                            >
                              <Icons.moreHorizontal size={14} />
                            </button>
                            {activeActionDropdownId === task.id && createPortal(
                              <div
                                ref={actionDropdownRef}
                                className="fixed w-[150px] bg-white border border-slate-200 shadow-xl rounded-md py-1 z-[9999]"
                                style={{ top: actionDropdownPos.top, left: actionDropdownPos.left }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Icons.eye size={14} className="text-slate-400" /> View
                                </button>
                                <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                  <Icons.activity size={14} className="text-slate-400" /> Comment
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionDropdownId(null);
                                    setDeleteModalTask(task);
                                    setDeleteConfirmText('');
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Icons.trash2 size={14} className="text-rose-500" /> Delete
                                </button>
                              </div>,
                              document.body
                            )}
                          </td>
                        );
                        default: return null;
                      }
                    })}
                  </tr>
                );
              })
              )}

              <tr className="bg-slate-50/20" ref={inlineRowRef}>
                <td className="py-3 px-4 sticky left-0 bg-white" colSpan={columns.length}>
                  {!isCreatingTask ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCreatingTask(true)}
                        className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-bold text-xs transition-colors py-1 px-2 hover:bg-blue-50/50 rounded-lg"
                      >
                        <Icons.plus size={14} />
                        <span>Create</span>
                      </button>
                      <div className="w-px h-4 bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400">
                        {tasks.length} of {tasks.length} tasks
                      </span>
                      <button
                        onClick={() => {
                          if (projectId) dispatch(fetchTasksByProject({
                            projectId,
                            params: {
                              page: currentPage,
                              size: itemsPerPage,
                              keyword: searchKeyword || undefined
                            }
                          }));
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
                        title="Reset tasks"
                      >
                        <Icons.refreshCw size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full max-w-[1050px] bg-white border-2 border-[#3B82F6] rounded-[4px] p-[3px] shadow-sm relative">
                      {/* Task type dropdown trigger */}
                      <div className="relative shrink-0">
                        <button
                          ref={triggerRef}
                          onClick={handleToggleDropdown}
                          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-2 py-1.5 rounded-[3px] transition-colors"
                        >
                          {newTaskType === 'Epic' && <Icons.zap size={16} className="text-[#8B5CF6] fill-[#8B5CF6]" />}
                          {newTaskType === 'Task' && <Icons.checkSquare size={16} className="text-[#3B82F6]" />}
                          {newTaskType === 'Incident' && <Icons.alertCircle size={16} className="text-[#EF4444]" />}
                          {newTaskType === 'Service Request' && <Icons.alertCircle size={16} className="text-[#F59E0B]" />}
                          <Icons.chevronDown size={14} className="text-slate-500" />
                        </button>

                        {/* Task type dropdown (Portal) */}
                        {showTypeDropdown && createPortal(
                          <div
                            ref={dropdownRef}
                            className="fixed w-[180px] bg-white border border-slate-200 shadow-xl rounded-[4px] py-1.5 z-[9999]"
                            style={{ top: dropdownPos.top, bottom: dropdownPos.bottom, left: dropdownPos.left }}
                          >
                            <div className="px-1">
                              <button onClick={() => { setNewTaskType('Epic'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-3 px-3 py-1.5 text-[14px] rounded-[3px] text-left ${newTaskType === 'Epic' ? 'bg-[#EEF2FF] text-[#3B82F6] border-l-2 border-[#3B82F6]' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}>
                                <Icons.zap size={15} className={newTaskType === 'Epic' ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-[#8B5CF6] fill-[#8B5CF6]"} />
                                Epic
                              </button>
                              <button onClick={() => { setNewTaskType('Task'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-3 px-3 py-1.5 text-[14px] rounded-[3px] text-left ${newTaskType === 'Task' ? 'bg-[#EEF2FF] text-[#3B82F6] border-l-2 border-[#3B82F6]' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}>
                                <Icons.checkSquare size={15} className="text-[#3B82F6]" />
                                Task
                              </button>
                              <button onClick={() => { setNewTaskType('Incident'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-3 px-3 py-1.5 text-[14px] rounded-[3px] text-left ${newTaskType === 'Incident' ? 'bg-[#EEF2FF] text-[#3B82F6] border-l-2 border-[#3B82F6]' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}>
                                <Icons.alertCircle size={15} className="text-[#EF4444]" />
                                Incident
                              </button>
                              <button onClick={() => { setNewTaskType('Service Request'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-3 px-3 py-1.5 text-[14px] rounded-[3px] text-left ${newTaskType === 'Service Request' ? 'bg-[#EEF2FF] text-[#3B82F6] border-l-2 border-[#3B82F6]' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}>
                                <Icons.alertCircle size={15} className="text-[#F59E0B]" />
                                Service Request
                              </button>
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>

                      <input
                        type="text"
                        autoFocus
                        placeholder="What needs to be done?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTask();
                          if (e.key === 'Escape') setIsCreatingTask(false);
                        }}
                        className="flex-1 text-[13px] text-slate-800 placeholder:text-slate-400 bg-transparent border-none outline-none focus:ring-0 px-2 font-medium"
                      />

                      {/* Deadline and Assignee icons on the right */}
                      <div className="flex items-center gap-1.5 pr-1 shrink-0">
                        <div className="relative flex items-center">
                          <button
                            onClick={() => {
                              try {
                                dateInputRef.current?.showPicker();
                              } catch (e) {
                                dateInputRef.current?.focus();
                              }
                            }}
                            className={`p-1.5 rounded-[3px] transition-colors ${newTaskDueDate ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            title={newTaskDueDate ? `Due date: ${newTaskDueDate}` : 'Set due date'}
                          >
                            <Icons.calendar size={15} />
                          </button>
                          <input
                            type="date"
                            ref={dateInputRef}
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className="absolute opacity-0 pointer-events-none w-0 h-0"
                            style={{ top: '100%', right: 0 }}
                          />
                        </div>

                        <div className="relative">
                          <button
                            ref={newTaskAssigneeTriggerRef}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              if (spaceBelow < 300) {
                                setNewTaskAssigneeDropdownPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left - 100 });
                              } else {
                                setNewTaskAssigneeDropdownPos({ top: rect.bottom + 4, left: rect.left - 100 });
                              }
                              setShowNewTaskAssigneeDropdown(!showNewTaskAssigneeDropdown);
                            }}
                            className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors border ${newTaskAssignee && newTaskAssignee !== 'automatic'
                                ? 'border-blue-200'
                                : 'border-transparent hover:bg-slate-100 text-slate-500'
                              }`}
                            title={newTaskAssignee === 'automatic' ? 'Automatic' : newTaskAssignee ? newTaskAssignee.name : 'Unassigned'}
                          >
                            {newTaskAssignee && newTaskAssignee !== 'automatic' ? (
                              <img src={newTaskAssignee.avatar || defaultAvatar} alt={newTaskAssignee.name} className="w-full h-full rounded-full object-cover" />
                            ) : newTaskAssignee === 'automatic' ? (
                              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center">
                                <Icons.user size={14} className="text-slate-400" />
                              </div>
                            ) : (
                              <Icons.user size={15} />
                            )}
                          </button>

                          {showNewTaskAssigneeDropdown && createPortal(
                            <div
                              ref={newTaskAssigneeDropdownRef}
                              className="fixed w-[260px] bg-white border border-slate-200 shadow-xl rounded-md py-1 z-[9999]"
                              style={{
                                top: newTaskAssigneeDropdownPos.top !== undefined ? newTaskAssigneeDropdownPos.top : 'auto',
                                bottom: newTaskAssigneeDropdownPos.bottom !== undefined ? newTaskAssigneeDropdownPos.bottom : 'auto',
                                left: newTaskAssigneeDropdownPos.left
                              }}
                            >
                              {/* Search bar */}
                              <div className="px-3 pb-2 border-b border-slate-100 mt-1">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
                                  <Icons.search size={12} className="text-slate-400 shrink-0" />
                                  <input
                                    ref={assigneeSearchRef}
                                    type="text"
                                    placeholder="Tìm người dùng..."
                                    value={assigneeSearch}
                                    onChange={(e) => setAssigneeSearch(e.target.value)}
                                    className="flex-1 text-[12px] text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                                  />
                                  {assigneeSearch && (
                                    <button
                                      onClick={() => setAssigneeSearch('')}
                                      className="text-slate-400 hover:text-slate-600 shrink-0"
                                    >
                                      <Icons.x size={11} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
                                {(!assigneeSearch.trim() || 'unassigned'.includes(assigneeSearch.toLowerCase())) && (
                                  <button
                                    onClick={() => { setNewTaskAssignee(null); setShowNewTaskAssigneeDropdown(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-left ${!newTaskAssignee ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                  >
                                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                      <Icons.user size={14} className="text-slate-400" />
                                    </div>
                                    <span className={!newTaskAssignee ? 'text-blue-600 bg-blue-600/10 px-1 rounded font-medium' : 'text-slate-700'}>Unassigned</span>
                                  </button>
                                )}

                                {(!assigneeSearch.trim() || 'automatic'.includes(assigneeSearch.toLowerCase())) && (
                                  <button
                                    onClick={() => { setNewTaskAssignee('automatic'); setShowNewTaskAssigneeDropdown(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-left border-b border-slate-100 pb-3 mb-1 ${newTaskAssignee === 'automatic' ? 'bg-blue-50/50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
                                  >
                                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                      <Icons.user size={14} className="text-slate-400" />
                                    </div>
                                    <span>Automatic</span>
                                  </button>
                                )}

                                {filteredMembers.map((member: any) => {
                                  const isSelected = newTaskAssignee?.id === member.id;
                                  return (
                                    <button
                                      key={member.id}
                                      onClick={() => { setNewTaskAssignee(member); setShowNewTaskAssigneeDropdown(false); }}
                                      className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors text-left ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                    >
                                      <img src={member.avatar || defaultAvatar} alt={member.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate text-slate-700 font-medium">{member.name}</span>
                                        {member.email && <span className="truncate text-[11px] text-slate-400">{member.email}</span>}
                                      </div>
                                    </button>
                                  );
                                })}

                                {filteredMembers.length === 0 && assigneeSearch.trim() && (
                                  <div className="px-3 py-4 text-center">
                                    <Icons.userX size={20} className="text-slate-300 mx-auto mb-1" />
                                    <p className="text-[11px] text-slate-400">Không tìm thấy người dùng</p>
                                  </div>
                                )}
                              </div>
                            </div>,
                            document.body
                          )}
                        </div>
                        <button
                          onClick={handleCreateTask}
                          className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-[3px] text-[12px] font-bold transition-colors ml-1"
                        >
                          <span>Create</span>
                          <span className="text-[10px] border border-slate-300 rounded px-1 shadow-sm text-slate-500 bg-white font-black">↵</span>
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Space */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white shrink-0 mt-auto">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500">
            Showing {totalElements === 0 ? 0 : startIndex + 1} to {endIndex} of {totalElements} results
          </span>
          <div className="relative" ref={itemsPerPageRef}>
            <button
              onClick={() => setIsItemsPerPageOpen(!isItemsPerPageOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-md transition-colors shadow-sm"
            >
              {itemsPerPage} / page
              <Icons.chevronDown size={12} className={`transition-transform text-slate-400 ${isItemsPerPageOpen ? 'rotate-180' : ''}`} />
            </button>
            {isItemsPerPageOpen && (
              <div className="absolute bottom-full left-0 mb-1.5 w-[110px] bg-white border border-slate-200 shadow-xl rounded-lg py-1.5 z-50 overflow-hidden">
                {[10, 20, 50, 100].map(num => (
                  <button
                    key={num}
                    onClick={() => {
                      setItemsPerPage(num);
                      setCurrentPage(1);
                      setIsItemsPerPageOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors text-left ${itemsPerPage === num
                        ? 'bg-blue-50 text-blue-600 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                  >
                    <span>{num}</span>
                    <span className="text-slate-400 font-normal">/ page</span>
                    {itemsPerPage === num && <Icons.check size={11} className="ml-auto text-blue-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            title="Previous page"
            className={`p-1.5 rounded-md text-xs font-semibold border transition-all flex items-center justify-center ${validCurrentPage === 1
                ? 'text-slate-400 bg-slate-50 border-slate-200/60 cursor-not-allowed opacity-70'
                : 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200 shadow-sm active:scale-95'
              }`}
          >
            <Icons.chevronLeft size={16} />
          </button>

          <div className="flex items-center gap-0.5 px-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (
                totalPages <= 5 ||
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= validCurrentPage - 1 && pageNum <= validCurrentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[28px] h-7 flex items-center justify-center rounded-md text-xs transition-all ${validCurrentPage === pageNum
                        ? 'font-bold bg-blue-600 text-white shadow-sm shadow-blue-500/20 ring-1 ring-blue-600'
                        : 'font-medium text-slate-600 bg-transparent hover:bg-slate-100'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === validCurrentPage - 2 || pageNum === validCurrentPage + 2) {
                return <span key={pageNum} className="text-slate-400 text-[10px] px-1 font-bold tracking-widest">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages}
            title="Next page"
            className={`p-1.5 rounded-md text-xs font-semibold border transition-all flex items-center justify-center ${validCurrentPage === totalPages
                ? 'text-slate-400 bg-slate-50 border-slate-200/60 cursor-not-allowed opacity-70'
                : 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200 shadow-sm active:scale-95'
              }`}
          >
            <Icons.chevronRight size={16} />
          </button>

          {/* Delete Confirmation Modal */}
          {deleteModalTask && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteModalTask(null)} />
              <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[440px] p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Icons.alertCircle size={22} className="text-rose-600 fill-rose-100" />
                    <h2 className="text-lg font-bold text-slate-800">Delete or archive {deleteModalTask.taskKey || deleteModalTask.id}?</h2>
                  </div>
                  <button onClick={() => setDeleteModalTask(null)} className="text-slate-400 hover:text-slate-600">
                    <Icons.x size={20} />
                  </button>
                </div>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-6 pl-8">
                  You can choose to delete or archive this work item and all its subtasks. 
                  Deleting is irreversible. It permanently removes the work item, subtasks, 
                  comments and attachments. To keep subtasks move them to a different parent.
                </p>
                
                <div className="mb-6 pl-8">
                  <label className="block text-[13px] text-slate-600 mb-2">
                    Type <strong className="text-slate-800 font-bold">delete</strong> to continue
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setDeleteModalTask(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  >
                    Archive
                  </button>
                  <button
                    disabled={deleteConfirmText !== 'delete' || isDeleting}
                    onClick={async () => {
                      try {
                        setIsDeleting(true);
                        await dispatch(deleteTask(deleteModalTask.dbId || deleteModalTask.id)).unwrap();
                        setDeleteModalTask(null);
                        if (tasks.length === 1 && currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        } else if (projectId) {
                          dispatch(fetchTasksByProject({ projectId, params: { page: currentPage, size: itemsPerPage } }));
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className={`px-4 py-2 text-sm font-semibold text-white rounded transition-colors flex items-center gap-2 ${deleteConfirmText === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {isDeleting ? <Icons.refreshCw className="animate-spin" size={16} /> : null}
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}
