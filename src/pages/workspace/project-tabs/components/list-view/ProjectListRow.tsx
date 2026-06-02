import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../../../../assets/icons';
import { useProjectList } from './ProjectListContext';
import defaultAvatar from '../../../../../assets/avatar_def_man.png';

interface ProjectListRowProps {
  task: any;
  index: number;
}

export function ProjectListRow({ task, index }: ProjectListRowProps) {
  const {
    currentProject,
    columnsState: { columns },
    isAllSelected,
    selectedTaskIds,
    excludedTaskIds,
    handleTaskCheckboxToggle,
    setSelectedTask,
    setDeleteModalTask,
    setDeleteConfirmText,
    tasksState: {
      startIndex,
      setTasks,
      updateStatusMutation,
      updateAssigneeMutation,
      updatePriorityMutation,
      updateDueDateMutation,
      updateTitleMutation
    }
  } = useProjectList();

  // Inline edit state
  const [activeEditTitleId, setActiveEditTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Dropdown states local to the row
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({ top: 0, left: 0 });
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [priorityDropdownPos, setPriorityDropdownPos] = useState({ top: 0, left: 0 });
  
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusDropdownPos, setStatusDropdownPos] = useState({ top: 0, left: 0 });

  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionDropdownPos, setActionDropdownPos] = useState({ top: 0, left: 0 });

  // Refs for click outside
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeSearchRef = useRef<HTMLInputElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const actionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAssigneeOpen && assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeOpen(false);
      }
      if (isPriorityOpen && priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityOpen(false);
      }
      if (isStatusOpen && statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
      if (isActionOpen && actionDropdownRef.current && !actionDropdownRef.current.contains(event.target as Node)) {
        setIsActionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAssigneeOpen, isPriorityOpen, isStatusOpen, isActionOpen]);

  // Auto-focus search input when assignee dropdown opens
  useEffect(() => {
    if (isAssigneeOpen && assigneeSearchRef.current) {
      setTimeout(() => assigneeSearchRef.current?.focus(), 50);
    }
  }, [isAssigneeOpen]);

  const hasAssignee = !!task.assigneeId;
  const projectMembers = currentProject?.members?.filter((m: any) => m.active !== false) || [];
  const filteredMembers = projectMembers.filter((m: any) =>
    !assigneeSearch.trim() ||
    (m.name || '').toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(assigneeSearch.toLowerCase())
  );

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

  const handleTitleSubmit = async () => {
    if (!editTitleValue.trim() || editTitleValue.trim() === task.title) {
      setActiveEditTitleId(null);
      return;
    }
    const newTitle = editTitleValue.trim();
    const oldTitle = task.title;
    setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, title: newTitle } : t));
    setActiveEditTitleId(null);
    try {
      if (task.id) await updateTitleMutation.mutateAsync({ taskId: task.id, title: newTitle });
    } catch (err) {
      console.error("Failed to update task title:", err);
      setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, title: oldTitle } : t));
    }
  };

  const handleAssigneeSelect = async (member: any | null) => {
    setIsAssigneeOpen(false);
    setAssigneeSearch('');
    const newAssigneeId = member ? member.id : null;
    const newAssigneeName = member ? member.name : 'Unassigned';
    setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, assigneeId: newAssigneeId, assigneeName: newAssigneeName } : t));
    try {
      if (task.id) await updateAssigneeMutation.mutateAsync({ taskId: task.id, assigneeId: newAssigneeId });
    } catch (err) {
      console.error("Failed to update assignee:", err);
      setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, assigneeId: task.assigneeId, assigneeName: task.assigneeName } : t));
    }
  };

  const handlePrioritySelect = async (priority: string) => {
    setIsPriorityOpen(false);
    const oldPriority = task.priority;
    setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, priority } : t));
    try {
      if (task.id) await updatePriorityMutation.mutateAsync({ taskId: task.id, priority });
    } catch (err) {
      console.error('Failed to update priority:', err);
      setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, priority: oldPriority } : t));
    }
  };

  const handleDueDateChange = async (newDate: string) => {
    const formattedDate = newDate ? `${newDate}T00:00:00` : null;
    const oldDate = task.dueDate;
    setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, dueDate: formattedDate } : t));
    try {
      if (task.id) await updateDueDateMutation.mutateAsync({ taskId: task.id, dueDate: formattedDate });
    } catch (err) {
      console.error("Failed to update due date:", err);
      setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, dueDate: oldDate } : t));
    }
  };

  const typeInfo = getTypeInfo(task.type);

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group divide-x divide-slate-200/60">
      {columns.map(col => {
        switch (col.id) {
          case 'checkbox': return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
              <input
                type="checkbox"
                checked={isAllSelected ? !excludedTaskIds.has(task.id) : selectedTaskIds.has(task.id)}
                onChange={() => handleTaskCheckboxToggle(task.id)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </td>
          );
          case 'work': return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
              <div className="flex items-center gap-2.5 min-w-0 w-full overflow-hidden">
                <span className={`w-4 h-4 rounded ${typeInfo.bg} flex items-center justify-center ${typeInfo.color} shrink-0 font-black shadow-sm`} title={typeInfo.label}>
                  {typeInfo.icon}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTask(task);
                  }}
                  className="text-blue-600 hover:underline cursor-pointer font-bold shrink-0 whitespace-nowrap"
                >
                  {task.taskKey || `ISSUE-${String(startIndex + index + 1).padStart(2, '0')}`}
                </span>
                {activeEditTitleId === task.id ? (
                  <div className="flex items-center flex-1 min-w-0 gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={e => setEditTitleValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleTitleSubmit();
                        if (e.key === 'Escape') setActiveEditTitleId(null);
                      }}
                      autoFocus
                      className="flex-1 border border-blue-400 bg-white px-2 py-1 rounded-[3px] text-xs outline-none focus:ring-1 focus:ring-blue-400 min-w-0"
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleTitleSubmit(); }} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0 flex items-center justify-center"><Icons.check size={14} className="text-slate-700" /></button>
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
                  <Icons.arrowUpRight
                    size={12}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                    }}
                  />
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
                    setIsAssigneeOpen(false);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setAssigneeDropdownPos({ top: rect.bottom + 4, left: rect.left });
                    setIsAssigneeOpen(true);
                  }
                }}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all hover:bg-slate-100 cursor-pointer group/assignee w-full text-left overflow-hidden ${isAssigneeOpen ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}
              >
                {hasAssignee ? (
                  <img src={task.assigneeAvatar || defaultAvatar} alt={task.assigneeName} className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200" />
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
              {isAssigneeOpen && createPortal(
                <div ref={assigneeDropdownRef} className="fixed w-[230px] bg-white border border-slate-200 shadow-2xl rounded-xl py-2 z-[9999] overflow-hidden" style={{ top: assigneeDropdownPos.top, left: assigneeDropdownPos.left }} onClick={(e) => e.stopPropagation()}>
                  <div className="px-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
                      <Icons.search size={12} className="text-slate-400 shrink-0" />
                      <input ref={assigneeSearchRef} type="text" placeholder="Tìm người dùng..." value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)} className="flex-1 text-[12px] text-slate-700 bg-transparent outline-none placeholder:text-slate-400" />
                      {assigneeSearch && <button onClick={() => setAssigneeSearch('')} className="text-slate-400 hover:text-slate-600 shrink-0"><Icons.x size={11} /></button>}
                    </div>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto py-1">
                    {(!assigneeSearch.trim() || 'unassigned'.includes(assigneeSearch.toLowerCase())) && (
                      <button onClick={() => handleAssigneeSelect(null)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${!hasAssignee ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0"><Icons.user size={11} /></div>
                        <span>Unassigned</span>
                        {!hasAssignee && <Icons.check size={12} className="ml-auto text-blue-500 shrink-0" />}
                      </button>
                    )}
                    {filteredMembers.length > 0 && (
                      <>
                        {!assigneeSearch.trim() && <div className="px-3 py-1 mt-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thành viên dự án</span></div>}
                        {filteredMembers.map((member: any) => {
                          const isSelected = task.assigneeId === member.id;
                          return (
                            <button key={member.id} onClick={() => handleAssigneeSelect(member)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
                              <img src={member.avatar || defaultAvatar} alt={member.name} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200" />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate font-semibold">{member.name}</span>
                                {member.email && <span className="truncate text-[10px] text-slate-400 font-normal">{member.email}</span>}
                              </div>
                              {isSelected && <Icons.check size={12} className="ml-auto text-blue-500 shrink-0" />}
                            </button>
                          );
                        })}
                      </>
                    )}
                    {filteredMembers.length === 0 && assigneeSearch.trim() && <div className="px-3 py-4 text-center"><Icons.userX size={20} className="text-slate-300 mx-auto mb-1" /><p className="text-[11px] text-slate-400">Không tìm thấy người dùng</p></div>}
                    {projectMembers.length === 0 && <div className="px-3 py-4 text-center"><p className="text-[11px] text-slate-400">Chưa có thành viên nào</p></div>}
                  </div>
                </div>,
                document.body
              )}
            </td>
          );
          case 'reporter': return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-slate-600 text-xs font-bold">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <img src={task.reporterAvatar || defaultAvatar} alt={task.reporterName || 'Reporter'} className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200" />
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
                  if (isPriorityOpen) {
                    setIsPriorityOpen(false);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPriorityDropdownPos({ top: rect.bottom + 4, left: rect.left });
                    setIsPriorityOpen(true);
                  }
                }}
                title={task.type === 'epic' ? 'Epic luôn có priority Medium' : undefined}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all w-full text-left overflow-hidden ${task.type === 'epic' ? 'cursor-default opacity-70' : 'hover:bg-slate-100 cursor-pointer group/priority'} ${isPriorityOpen ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}
              >
                <span className={`flex items-center justify-center shrink-0 ${getPriorityColor(task.priority)}`}>{getPriorityIcon(task.priority)}</span>
                <span className={`truncate flex-1 ${getPriorityColor(task.priority)}`}>{task.priority || 'Medium'}</span>
                {task.type !== 'epic' && <Icons.chevronDown size={10} className="ml-auto text-slate-300 opacity-0 group-hover/priority:opacity-100 transition-opacity shrink-0" />}
              </button>
              {isPriorityOpen && createPortal(
                <div ref={priorityDropdownRef} className="fixed w-[160px] bg-white border border-slate-200 shadow-2xl rounded-xl py-1.5 z-[9999] overflow-hidden" style={{ top: priorityDropdownPos.top, left: priorityDropdownPos.left }} onClick={(e) => e.stopPropagation()}>
                  {PRIORITIES.map((p) => {
                    const isSelected = (task.priority || 'Medium').toLowerCase() === p.label.toLowerCase();
                    return (
                      <button key={p.label} onClick={() => handlePrioritySelect(p.label)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
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
          case 'status': {
            const currentStatusObj = currentProject?.statuses?.find((s: any) => s.statusId === task.statusId || s.label === task.status);
            const displayStatus = currentStatusObj ? currentStatusObj.label : (task.status || task.statusName || 'No Status');
            
            return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4">
              <div className="relative inline-block w-full overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isStatusOpen) {
                      setIsStatusOpen(false);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setStatusDropdownPos({ top: rect.bottom + 4, left: rect.left });
                      setIsStatusOpen(true);
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[9px] font-black tracking-wider uppercase transition-colors shadow-sm max-w-full ${displayStatus === 'Done' || displayStatus?.toLowerCase().includes('done') || displayStatus?.toLowerCase().includes('hoàn thành') ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : displayStatus === 'In Progress' || displayStatus?.toLowerCase().includes('progress') || displayStatus?.toLowerCase().includes('đang') ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  <span className="truncate">{displayStatus}</span>
                  <span className="text-[7px] text-slate-400 shrink-0">▼</span>
                </button>
                {isStatusOpen && createPortal(
                  <div ref={statusDropdownRef} className="fixed w-[180px] bg-white border border-slate-200 shadow-xl rounded-[4px] py-1.5 z-[9999]" style={{ top: statusDropdownPos.top, left: statusDropdownPos.left }}>
                    <div className="px-1 max-h-[250px] overflow-y-auto">
                      {currentProject?.statuses?.map((statusObj: any) => {
                        const isSelected = statusObj.label === task.status || statusObj.statusId === task.statusId;
                        return (
                          <button key={statusObj.statusId} onClick={async (e) => {
                            e.stopPropagation();
                            setIsStatusOpen(false);
                            if (isSelected) return;
                            setTasks((prev: any) => prev.map((t: any) => t.id === task.id ? { ...t, status: statusObj.label, statusId: statusObj.statusId } : t));
                            try {
                              if (task.id) await updateStatusMutation.mutateAsync({ taskId: task.id, statusId: statusObj.statusId });
                            } catch (err) {
                              console.error("Failed to update status:", err);
                            }
                          }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold rounded-[3px] text-left transition-colors ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}>
                            <div className="w-4 flex items-center justify-center shrink-0">{isSelected && <Icons.check size={12} className="text-blue-600" />}</div>
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
          }
          case 'resolution': return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs font-semibold text-slate-600 truncate">
              {(() => {
                const res = task.resolution;
                if (!res) return 'Unresolved';
                const mapping: Record<string, string> = { UNRESOLVED: 'Unresolved', DONE: 'Done', WONT_FIX: "Won't Fix", DUPLICATE: 'Duplicate', CANNOT_REPRODUCE: 'Cannot Reproduce', FIXED: 'Fixed' };
                return mapping[res] || res;
              })()}
            </td>
          );
          case 'created': return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs text-slate-500 font-medium truncate">
              {task.createdAt ? new Date(task.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
            </td>
          );
          case 'updated': return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs text-slate-500 font-medium truncate">
              {task.updatedAt ? new Date(task.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
            </td>
          );
          case 'dueDate': return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-xs font-medium truncate group/date relative cursor-pointer hover:bg-slate-50 transition-colors" onClick={(e) => {
              const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
              if (input) { try { input.showPicker(); } catch (err) { input.focus(); } }
            }}>
              <div className="flex items-center justify-between pointer-events-none">
                {task.dueDate ? <span className="text-slate-700">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span className="text-slate-400">None</span>}
                {task.dueDate && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDueDateChange(''); }} className="opacity-0 group-hover/date:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity ml-2 z-[20] relative pointer-events-auto" title="Clear due date"><Icons.x size={13} /></button>}
              </div>
              <input type="date" value={task.dueDate ? task.dueDate.substring(0, 10) : ''} onChange={(e) => handleDueDateChange(e.target.value)} className="absolute w-0 h-0 opacity-0 pointer-events-none" title="Click to edit due date" />
            </td>
          );
          case 'actions': return (
            <td key={col.id} style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }} className="py-3.5 px-4 text-center">
              <button onClick={(e) => {
                e.stopPropagation();
                if (isActionOpen) setIsActionOpen(false);
                else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActionDropdownPos({ top: rect.bottom + 4, left: rect.left - 120 });
                  setIsActionOpen(true);
                }
              }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"><Icons.moreHorizontal size={14} /></button>
              {isActionOpen && createPortal(
                <div ref={actionDropdownRef} className="fixed w-[150px] bg-white border border-slate-200 shadow-xl rounded-md py-1 z-[9999]" style={{ top: actionDropdownPos.top, left: actionDropdownPos.left }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setIsActionOpen(false); setSelectedTask(task); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"><Icons.settings size={14} className="text-slate-400" /> Edit Task</button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setIsActionOpen(false);
                    setDeleteModalTask(task);
                    setDeleteConfirmText('');
                  }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"><Icons.trash2 size={14} className="text-rose-500" /> Delete</button>
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
}
