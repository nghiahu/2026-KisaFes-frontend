import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../../assets/icons';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateTaskStatus, createTask, fetchTasksByProject, updateTaskAssignee, updateTaskPriority } from '../../../store/slices/taskSlice';
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

  const { totalElements, totalPages } = useAppSelector(state => state.task);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inlineRowRef = useRef<HTMLTableRowElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeSearchRef = useRef<HTMLInputElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPageRef = useRef<HTMLDivElement>(null);

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

      const isOutsidePriorityDropdown = priorityDropdownRef.current ? !priorityDropdownRef.current.contains(event.target as Node) : true;
      if (isOutsidePriorityDropdown) {
        setActivePriorityDropdownId(null);
      }

      const isOutsideItemsPerPage = itemsPerPageRef.current ? !itemsPerPageRef.current.contains(event.target as Node) : true;
      if (isOutsideItemsPerPage) {
        setIsItemsPerPageOpen(false);
      }

      const isOutsideInlineRow = inlineRowRef.current ? !inlineRowRef.current.contains(event.target as Node) : true;
      if (isCreatingTask && isOutsideInlineRow && isOutsideDropdown) {
        setIsCreatingTask(false);
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
    };

    if (showTypeDropdown || isCreatingTask || activeStatusDropdownId || activeAssigneeDropdownId || activePriorityDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    if (showTypeDropdown || activeStatusDropdownId || activeAssigneeDropdownId || activePriorityDropdownId) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showTypeDropdown, isCreatingTask, activeStatusDropdownId, activeAssigneeDropdownId, activePriorityDropdownId]);

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
        type: newTaskType.toLowerCase()
      })).unwrap();
      setNewTaskTitle('');
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
  const endIndex = Math.min(startIndex + tasks.length, totalElements);
  const currentTasks = tasks; // Backend already paginated


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

          {/* Assignee Avatar */}
          <div className="flex items-center -space-x-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center border border-white ring-1 ring-slate-100 shadow-sm" title="nghĩa Ngô">
              NN
            </div>
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-all shadow-sm">
            <Icons.filter size={13} className="text-slate-400" />
            <span>Filter</span>
          </button>

          {/* Group Button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-all shadow-sm">
            <Icons.kanbanSquare size={13} className="text-slate-400" />
            <span>Group</span>
          </button>
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
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="w-12 py-3 px-4 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="py-3 px-4 text-slate-700 w-[350px]">Work</th>
                <th className="w-48 py-3 px-4 text-slate-700">Assignee</th>
                <th className="w-48 py-3 px-4 text-slate-700">Reporter</th>
                <th className="w-36 py-3 px-4 text-slate-700">Priority</th>
                <th className="w-36 py-3 px-4 text-slate-700">Status</th>
                <th className="w-32 py-3 px-4 text-slate-700">Resolution</th>
                <th className="w-44 py-3 px-4 text-slate-700">Created</th>
                <th className="w-44 py-3 px-4 text-slate-700">Updated</th>
                <th className="w-36 py-3 px-4 text-slate-700">Due date</th>
                <th className="w-12 py-3 px-4 text-center">
                  <div className="w-4 h-4 rounded hover:bg-slate-200 flex items-center justify-center cursor-pointer text-slate-500">
                    <Icons.plus size={12} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.map((task, index) => {
                const typeInfo = (() => {
                  const t = (task.type || '').toLowerCase();
                  switch (t) {
                    case 'epic': return { icon: <Icons.zap size={10} className="fill-current" />, bg: 'bg-violet-100', color: 'text-violet-600', label: 'Epic' };
                    case 'story': return { icon: <Icons.zap size={10} className="fill-current" />, bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Story' };
                    case 'incident':
                    case 'bug': return { icon: <Icons.alertCircle size={10} />, bg: 'bg-rose-100', color: 'text-rose-600', label: 'Incident' };
                    case 'service request': return { icon: <Icons.alertCircle size={10} />, bg: 'bg-amber-100', color: 'text-amber-600', label: 'Service Request' };
                    case 'task':
                    default: return { icon: <Icons.checkSquare size={10} />, bg: 'bg-blue-100', color: 'text-blue-600', label: 'Task' };
                  }
                })();

                const isAssigneeOpen = activeAssigneeDropdownId === task.id;
                const hasAssignee = task.assigneeName && task.assigneeName !== 'Unassigned';

                return (
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>

                    {/* Work */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs max-w-[350px]">
                      <div className="flex items-center gap-2.5 min-w-0 w-full">
                        <span className={`w-4 h-4 rounded ${typeInfo.bg} flex items-center justify-center ${typeInfo.color} shrink-0 font-black shadow-sm`} title={typeInfo.label}>
                          {typeInfo.icon}
                        </span>
                        <span className="text-blue-600 hover:underline cursor-pointer font-bold shrink-0 whitespace-nowrap">
                          {task.taskKey || `ISSUE-${String(startIndex + index + 1).padStart(2, '0')}`}
                        </span>
                        <span className="text-slate-700 group-hover:text-blue-600 transition-colors truncate flex-1" title={task.title}>{task.title}</span>

                        <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-2 transition-all shrink-0">
                          <Icons.arrowUpRight size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                          <Icons.plus size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                        </span>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 text-xs font-semibold">
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
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all hover:bg-slate-100 cursor-pointer group/assignee w-full text-left ${isAssigneeOpen ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}
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
                        <span className={`truncate ${hasAssignee ? 'text-slate-700 font-medium' : 'text-slate-400 font-medium'}`} title={task.assigneeName || 'Unassigned'}>
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

                    {/* Reporter */}
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <img
                          src={task.reporterAvatar || defaultAvatar}
                          alt={task.reporterName || 'Reporter'}
                          className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <span className="text-slate-700 truncate" title={task.reporterName || 'Unassigned'}>{task.reporterName || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 text-xs font-semibold">
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
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all w-full text-left ${task.type === 'epic'
                            ? 'cursor-default opacity-70'
                            : 'hover:bg-slate-100 cursor-pointer group/priority'
                          } ${activePriorityDropdownId === task.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}
                      >
                        <span className={`flex items-center justify-center shrink-0 ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)}
                        </span>
                        <span className={getPriorityColor(task.priority)}>{task.priority || 'Medium'}</span>
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

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block">
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
                          className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[9px] font-black tracking-wider uppercase transition-colors shadow-sm ${task.status === 'Done' || task.status?.toLowerCase().includes('done') || task.status?.toLowerCase().includes('hoàn thành')
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : task.status === 'In Progress' || task.status?.toLowerCase().includes('progress') || task.status?.toLowerCase().includes('đang')
                              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          <span>{task.status}</span>
                          <span className="text-[7px] text-slate-400">▼</span>
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

                    {/* Resolution */}
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
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

                    {/* Created */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                        : '—'}
                    </td>

                    {/* Updated */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {task.updatedAt
                        ? new Date(task.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                        : '—'}
                    </td>

                    {/* Due date */}
                    <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                      {task.dueDate
                        ? <span className="text-slate-700">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        : <span className="text-slate-400">None</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all">
                        <Icons.moreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              <tr className="bg-slate-50/20" ref={inlineRowRef}>
                <td className="py-3 px-4 sticky left-0 bg-white" colSpan={11}>
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
                        <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-[3px] transition-colors">
                          <Icons.calendar size={15} />
                        </button>
                        <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-[3px] transition-colors">
                          <Icons.user size={15} />
                        </button>
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
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors text-left ${
                      itemsPerPage === num 
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
            className={`p-1.5 rounded-md text-xs font-semibold border transition-all flex items-center justify-center ${
              validCurrentPage === 1 
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
                    className={`min-w-[28px] h-7 flex items-center justify-center rounded-md text-xs transition-all ${
                      validCurrentPage === pageNum
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
            className={`p-1.5 rounded-md text-xs font-semibold border transition-all flex items-center justify-center ${
              validCurrentPage === totalPages 
                ? 'text-slate-400 bg-slate-50 border-slate-200/60 cursor-not-allowed opacity-70' 
                : 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200 shadow-sm active:scale-95'
            }`}
          >
            <Icons.chevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
