import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../assets/icons';
import defaultAvatar from '../../assets/avatar_def_man.png';
import { useAppDispatch } from '../../store/hooks';
import { updateTaskStatus, updateTaskAssignee, updateTaskPriority, updateTaskDueDate, updateTaskTitle, addSubTask, toggleSubTask, deleteSubTask, updateTaskDescription } from '../../store/slices/taskSlice';
import TiptapEditor from './TiptapEditor';

interface TaskDetailViewProps {
  task: any;
  currentProject: any;
  onClose: () => void;
  onUpdateTaskLocally: (taskId: string, updates: any) => void;
}

export default function TaskDetailView({ task, currentProject, onClose, onUpdateTaskLocally }: TaskDetailViewProps) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'All' | 'Comments' | 'History' | 'Work log'>('All');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [subtaskIdToDelete, setSubtaskIdToDelete] = useState<string | null>(null);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = async () => {
    if (!editTitle.trim() || editTitle.trim() === task.title) {
      setIsEditingTitle(false);
      setEditTitle(task.title);
      return;
    }
    const newTitle = editTitle.trim();
    onUpdateTaskLocally(task.id, { title: newTitle });
    setIsEditingTitle(false);
    try {
      if (task.dbId) {
        await dispatch(updateTaskTitle({ taskId: task.dbId, title: newTitle })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update title:", error);
      onUpdateTaskLocally(task.id, { title: task.title });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task.dbId) return;
    
    try {
      const updatedTask = await dispatch(addSubTask({ taskId: task.dbId, title: newSubtaskTitle.trim() })).unwrap();
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
      onUpdateTaskLocally(task.id, updatedTask);
    } catch (error) {
      console.error("Failed to add subtask:", error);
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task.dbId) return;
    try {
      const updatedTask = await dispatch(toggleSubTask({ taskId: task.dbId, subtaskId })).unwrap();
      onUpdateTaskLocally(task.id, updatedTask);
    } catch (error) {
      console.error("Failed to toggle subtask:", error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    setSubtaskIdToDelete(subtaskId);
  };

  const confirmDeleteSubtask = async () => {
    if (!task.dbId || !subtaskIdToDelete) return;
    try {
      const updatedTask = await dispatch(deleteSubTask({ taskId: task.dbId, subtaskId: subtaskIdToDelete })).unwrap();
      onUpdateTaskLocally(task.id, updatedTask);
    } catch (error) {
      console.error("Failed to delete subtask:", error);
    } finally {
      setSubtaskIdToDelete(null);
    }
  };

  const handleStatusUpdate = async (statusId: string, statusLabel: string) => {
    setShowStatusDropdown(false);
    if (task.statusId === statusId || task.status === statusLabel) return;
    onUpdateTaskLocally(task.id, { status: statusLabel, statusId });
    try {
      if (task.dbId) {
        await dispatch(updateTaskStatus({ taskId: task.dbId, statusId })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleAssigneeUpdate = async (member: any) => {
    setShowAssigneeDropdown(false);
    const newAssigneeId = member ? member.id : null;
    const newAssigneeName = member ? member.name : 'Unassigned';
    onUpdateTaskLocally(task.id, { assigneeId: newAssigneeId, assigneeName: newAssigneeName });
    try {
      if (task.dbId) {
        await dispatch(updateTaskAssignee({ taskId: task.dbId, assigneeId: newAssigneeId })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update assignee:", error);
    }
  };

  const handlePriorityUpdate = async (priority: string) => {
    setShowPriorityDropdown(false);
    if (task.priority === priority) return;
    onUpdateTaskLocally(task.id, { priority });
    try {
      if (task.dbId) {
        await dispatch(updateTaskPriority({ taskId: task.dbId, priority })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  const handleDueDateUpdate = async (newDate: string) => {
    const formattedDate = newDate ? `${newDate}T00:00:00` : null;
    onUpdateTaskLocally(task.id, { dueDate: formattedDate });
    try {
      if (task.dbId) {
        await dispatch(updateTaskDueDate({ taskId: task.dbId, dueDate: formattedDate })).unwrap();
      }
    } catch (error) {
      console.error("Failed to update due date:", error);
    }
  };

  const PRIORITIES = [
    { label: 'Highest', icon: <Icons.chevronsUp size={14} className="text-rose-500" /> },
    { label: 'High', icon: <Icons.chevronUp size={14} className="text-orange-500" /> },
    { label: 'Medium', icon: <Icons.equal size={14} strokeWidth={3} className="text-amber-500" /> },
    { label: 'Low', icon: <Icons.chevronDown size={14} className="text-blue-400" /> },
    { label: 'Lowest', icon: <Icons.chevronsDown size={14} className="text-slate-400" /> },
  ];

  const getPriorityIcon = (priority: string) => {
    const p = PRIORITIES.find(x => x.label.toLowerCase() === (priority || 'medium').toLowerCase());
    return p ? p.icon : <Icons.equal size={14} strokeWidth={3} className="text-amber-500" />;
  };

  const hasAssignee = task.assigneeName && task.assigneeName !== 'Unassigned';
  const projectMembers = currentProject?.members || [];

  return (
    <div className="flex-1 flex overflow-hidden bg-white animate-in fade-in duration-300">
      {/* LEFT PANEL */}
          <div className="flex-1 flex flex-col overflow-y-auto border-r border-slate-200 p-8 scrollbar-thin">
            {/* Breadcrumb & Actions */}
            <div className="flex items-center text-[13px] text-slate-500 mb-6 gap-2 font-medium">
              <button onClick={onClose} className="hover:bg-slate-100 p-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Icons.chevronLeft size={16} /> Back
              </button>
              <div className="w-px h-4 bg-slate-300 mx-2"></div>
              <button className="hover:bg-slate-100 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Icons.gitBranch size={14} /> Add epic
              </button>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-1.5 text-blue-600 hover:underline cursor-pointer px-1 py-1.5 rounded-lg">
                <Icons.checkSquare size={14} className="text-blue-500" />
                {task.taskKey || 'KAN-9'}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              {isEditingTitle ? (
                <textarea
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTitleSubmit();
                    }
                    if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setEditTitle(task.title);
                    }
                  }}
                  autoFocus
                  className="w-full text-2xl font-black text-slate-800 border-2 border-blue-500 rounded-lg p-2 outline-none resize-none overflow-hidden"
                  rows={2}
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-2xl font-black text-slate-800 hover:bg-slate-50 p-2 -ml-2 rounded-lg cursor-pointer transition-colors"
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2 mb-8">
              <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.link size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.gitBranch size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.link size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.moreHorizontal size={16} />
              </button>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-[15px] font-semibold text-[#172b4d] mb-3">Description</h3>
              {isEditingDescription ? (
                <TiptapEditor
                  content={editDescription}
                  onChange={setEditDescription}
                  onSave={async () => {
                    setIsEditingDescription(false);
                    onUpdateTaskLocally(task.id, { description: editDescription });
                    if (task.dbId) {
                      try {
                        const updatedTask = await dispatch(updateTaskDescription({ taskId: task.dbId, description: editDescription })).unwrap();
                        onUpdateTaskLocally(task.id, updatedTask);
                      } catch (error) {
                        console.error("Failed to update description:", error);
                      }
                    }
                  }}
                  onCancel={() => {
                    setIsEditingDescription(false);
                    setEditDescription(task.description || '');
                  }}
                />
              ) : (
                <div 
                  onClick={() => setIsEditingDescription(true)}
                  className={`text-[14px] p-2 -ml-2 rounded cursor-text transition-colors min-h-[40px] prose prose-sm max-w-none ${task.description ? 'text-[#172b4d] hover:bg-[#091e420a]' : 'text-[#42526e] hover:bg-[#091e420a]'}`}
                >
                  {task.description ? (
                    <div dangerouslySetInnerHTML={{ __html: task.description }} />
                  ) : (
                    'Add a description...'
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="mb-8">
              <h3 className="text-[15px] font-bold text-slate-800 mb-3">Subtasks</h3>
              
              <div className="flex flex-col gap-1 mb-2">
                {task.subTasks?.map((st: any) => (
                  <div key={st.id} className="group flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                    <input 
                      type="checkbox" 
                      checked={st.done} 
                      onChange={() => handleToggleSubtask(st.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                    <span className={`text-[14px] flex-1 ${st.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {st.title}
                    </span>
                    <button 
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    >
                      <Icons.trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {showAddSubtask ? (
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1 text-[14px] px-3 py-1.5 border border-blue-400 rounded-md outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
                    autoFocus
                  />
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors">
                    Add
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddSubtask(false);
                      setNewSubtaskTitle('');
                    }}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <Icons.x size={16} />
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setShowAddSubtask(true)}
                  className="text-[14px] font-semibold text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Icons.plus size={16} className="text-slate-400" />
                  Add subtask
                </button>
              )}
            </div>


            {/* Activity */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-slate-800">Activity</h3>
              </div>

              <div className="flex gap-2 border-b border-slate-200 mb-4">
                {['All', 'Comments', 'History', 'Work log'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-3 py-2 text-[13px] font-bold border-b-2 transition-colors ${activeTab === tab
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <img src={defaultAvatar} className="w-8 h-8 rounded-full border border-slate-200" alt="Me" />
                <div className="flex-1">
                  <div className="border border-slate-200 rounded-xl bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all p-3">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="w-full outline-none text-[14px] placeholder:text-slate-400 text-slate-700"
                    />
                    <div className="mt-3 flex items-center gap-2 text-slate-400">
                      <button className="hover:bg-slate-100 p-1.5 rounded transition-colors"><Icons.pencil size={14} /></button>
                      <button className="hover:bg-slate-100 p-1.5 rounded transition-colors"><Icons.listTodo size={14} /></button>
                      <button className="hover:bg-slate-100 p-1.5 rounded transition-colors"><Icons.link size={14} /></button>
                      <button className="hover:bg-slate-100 p-1.5 rounded transition-colors"><Icons.user size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="w-[360px] bg-white p-6 overflow-y-auto scrollbar-thin flex flex-col">
            {/* Top actions */}
            <div className="flex items-center justify-end gap-2 mb-8">
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm" title="Lock">
                <Icons.lockKeyhole size={16} />
              </button>
              <button className="p-1.5 text-blue-600 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm flex items-center gap-1.5 font-semibold text-xs px-2.5">
                <Icons.eye size={14} /> 1
              </button>
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm" title="Share">
                <Icons.share2 size={16} />
              </button>
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.moreHorizontal size={16} />
              </button>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-2 mb-6">
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-[13px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                >
                  {task.status || 'To Do'}
                  <Icons.chevronDown size={14} />
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 w-[200px] bg-white border border-slate-200 shadow-xl rounded-lg py-1.5 z-50">
                    {currentProject?.statuses?.map((s: any, idx: number) => {
                      const statusLabel = typeof s === 'string' ? s : (s.label || s.name);
                      const statusId = typeof s === 'string' ? s : (s.statusId || s.id);
                      return (
                        <button
                          key={statusId || idx}
                          onClick={() => handleStatusUpdate(statusId, statusLabel)}
                          className="w-full text-left px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                        >
                          {statusLabel}
                          {(task.statusId === statusId || task.status === statusLabel) && <Icons.check size={14} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm">
                <Icons.zap size={16} />
              </button>
            </div>

            {/* Details section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 cursor-pointer">
                <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                  <Icons.chevronDown size={14} className="text-slate-500" />
                  Details
                </h3>
                <button className="text-slate-400 hover:text-slate-600"><Icons.settings size={14} /></button>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {/* Assignee */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Assignee</div>
                  <div className="relative flex-1" ref={assigneeDropdownRef}>
                    <button
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="flex items-center gap-2 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors w-full"
                    >
                      {hasAssignee ? (
                        <img src={task.assigneeAvatar || defaultAvatar} alt="Assignee" className="w-6 h-6 rounded-full border border-slate-200 shrink-0 object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0"><Icons.user size={12} /></div>
                      )}
                      <span className={`text-[13px] truncate ${hasAssignee ? 'text-slate-700 font-semibold' : 'text-slate-400 font-medium'}`}>
                        {task.assigneeName || 'Unassigned'}
                      </span>
                    </button>

                    {showAssigneeDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-[220px] bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50">
                        <button
                          onClick={() => handleAssigneeUpdate(null)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0"><Icons.user size={12} /></div>
                          Unassigned
                        </button>
                        {projectMembers.map((m: any) => (
                          <button
                            key={m.id}
                            onClick={() => handleAssigneeUpdate(m)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <img src={m.avatar || defaultAvatar} className="w-6 h-6 rounded-full border border-slate-200 object-cover shrink-0" alt="" />
                            <span className="truncate">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Priority</div>
                  <div className="relative flex-1" ref={priorityDropdownRef}>
                    <button
                      onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                      className="flex items-center gap-2 hover:bg-slate-100 p-1.5 -ml-1.5 rounded transition-colors w-full"
                    >
                      {getPriorityIcon(task.priority)}
                      <span className="text-[13px] font-semibold text-slate-700">{task.priority || 'Medium'}</span>
                    </button>

                    {showPriorityDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-[160px] bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50">
                        {PRIORITIES.map(p => (
                          <button
                            key={p.label}
                            onClick={() => handlePriorityUpdate(p.label)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            {p.icon}
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Parent</div>
                  <button className="text-[13px] font-medium text-slate-400 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1 text-left">None</button>
                </div>

                {/* Due Date */}
                <div className="flex items-center relative group">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Due date</div>
                  <div className="flex-1 flex items-center relative">
                    <button
                      className={`text-[13px] font-medium hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1 text-left ${task.dueDate ? 'text-slate-700' : 'text-slate-400'}`}
                      onClick={(e) => {
                        const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                        if (input) {
                          try { input.showPicker(); } catch (err) { input.focus(); }
                        }
                      }}
                    >
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'}
                    </button>
                    <input
                      type="date"
                      value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
                      onChange={(e) => handleDueDateUpdate(e.target.value)}
                      className="absolute w-0 h-0 opacity-0 pointer-events-none"
                    />
                    {task.dueDate && (
                      <button
                        onClick={() => handleDueDateUpdate('')}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity absolute right-2"
                      >
                        <Icons.x size={14} />
                      </button>
                    )}
                  </div>
                </div>


                {/* Team */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Team</div>
                  <button className="text-[13px] font-medium text-slate-400 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1 text-left">None</button>
                </div>

                <div className="h-px bg-slate-200 my-2"></div>

                {/* Start date */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Start date</div>
                  <button className="text-[13px] font-medium text-slate-400 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1 text-left">None</button>
                </div>

                {/* Reporter */}
                <div className="flex items-center">
                  <div className="w-[120px] text-[13px] font-semibold text-slate-500 shrink-0">Reporter</div>
                  <button className="flex items-center gap-2 hover:bg-slate-100 p-1 -ml-1 rounded transition-colors flex-1">
                    <img src={task.reporterAvatar || defaultAvatar} alt="Reporter" className="w-6 h-6 rounded-full border border-slate-200 shrink-0 object-cover" />
                    <span className="text-[13px] font-semibold text-slate-700 truncate">{task.reporterName || 'nghĩa Ngô'}</span>
                  </button>
                </div>

              </div>
            </div>

            <div className="mt-6 text-[12px] text-slate-400 text-right">
              <div>Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'a while ago'}</div>
              <div>Updated {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'a while ago'}</div>
            </div>
          </div>
          
          {/* Subtask Delete Confirmation Modal */}
          {subtaskIdToDelete && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40" onClick={() => setSubtaskIdToDelete(null)}>
              <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <Icons.alertCircle size={24} />
                  <h3 className="text-lg font-bold text-slate-800">Delete subtask?</h3>
                </div>
                <p className="text-[14px] text-slate-600 mb-6">
                  Are you sure you want to delete this subtask? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setSubtaskIdToDelete(null)}
                    className="px-4 py-2 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDeleteSubtask}
                    className="px-4 py-2 text-[14px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
