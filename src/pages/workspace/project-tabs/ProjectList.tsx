import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../../assets/icons';
import { useAppDispatch } from '../../../store/hooks';
import { updateTaskStatus, createTask, fetchTasksByProject } from '../../../store/slices/taskSlice';

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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inlineRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the dropdown and the trigger
      const isOutsideDropdown = dropdownRef.current ? !dropdownRef.current.contains(event.target as Node) : true;
      const isOutsideTrigger = triggerRef.current ? !triggerRef.current.contains(event.target as Node) : true;

      if (isOutsideDropdown && isOutsideTrigger) {
        setShowTypeDropdown(false);
      }

      // Check if click is outside the inline create row
      const isOutsideInlineRow = inlineRowRef.current ? !inlineRowRef.current.contains(event.target as Node) : true;
      if (isCreatingTask && isOutsideInlineRow && isOutsideDropdown) {
        setIsCreatingTask(false);
      }
    };

    // Also handle scroll to close dropdown because portal doesn't move automatically
    const handleScroll = () => {
      if (showTypeDropdown) setShowTypeDropdown(false);
    };

    if (showTypeDropdown || isCreatingTask) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    if (showTypeDropdown) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showTypeDropdown, isCreatingTask]);

  const handleToggleDropdown = () => {
    if (!showTypeDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
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

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          {/* Ask AI Button */}
          {/* <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-all shadow-sm">
            <Icons.sparkles size={13} className="text-violet-500 fill-violet-100" />
            <span>Ask AI</span>
          </button> */}

          {/* Search Bar */}
          <div className="relative">
            <Icons.search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search work"
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
              {tasks.map((task, index) => {
                const isStory = task.type === 'story';
                return (
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>

                    {/* Work */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isStory ? (
                          <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-black shadow-sm" title="Story">
                            <Icons.zap size={10} />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-black shadow-sm" title="Task">
                            <Icons.check size={10} />
                          </span>
                        )}
                        <span className="text-blue-600 hover:underline cursor-pointer font-bold shrink-0 whitespace-nowrap">
                          {task.taskKey || `ISSUE-${String(index + 1).padStart(2, '0')}`}
                        </span>
                        <span className="text-slate-700 group-hover:text-blue-600 transition-colors truncate whitespace-nowrap">{task.title}</span>

                        <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-2 transition-all shrink-0">
                          <Icons.arrowUpRight size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                          <Icons.plus size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                        </span>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <Icons.user size={10} />
                        </div>
                        <span className={!task.assigneeName || task.assigneeName === 'Unassigned' ? 'text-slate-400 font-medium' : 'text-slate-600'}>
                          {task.assigneeName || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Reporter */}
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black shrink-0 shadow-inner">
                          {task.reporterName ? task.reporterName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'NN'}
                        </div>
                        <span className="text-slate-700">{task.reporterName || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 flex items-center justify-center">
                          <Icons.equal size={12} strokeWidth={3} />
                        </span>
                        <span>{task.priority}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!currentProject || !currentProject.statuses || currentProject.statuses.length === 0) return;

                            const statuses = currentProject.statuses;
                            const currentIndex = statuses.findIndex((s: any) => s.label === task.status || s.statusId === task.statusId);
                            const nextStatusObj = statuses[(currentIndex + 1) % statuses.length];
                            const nextStatusId = nextStatusObj.statusId;
                            const nextStatusLabel = nextStatusObj.label;

                            // Update UI immediately for responsiveness
                            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatusLabel, statusId: nextStatusId } : t));

                            try {
                              if (task.dbId) {
                                await dispatch(updateTaskStatus({ taskId: task.dbId, statusId: nextStatusId })).unwrap();
                              }
                            } catch (err) {
                              console.error("Failed to update status in backend:", err);
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
                          if (projectId) dispatch(fetchTasksByProject(projectId));
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
                        title="Reset tasks"
                      >
                        <Icons.refreshCw size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full max-w-[1050px] bg-white border-2 border-[#3B82F6] rounded-[4px] p-[3px] shadow-sm relative">
                      {/* Dropdown trigger */}
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

                        {/* Dropdown Menu (Portal) */}
                        {showTypeDropdown && createPortal(
                          <div
                            ref={dropdownRef}
                            className="fixed w-[180px] bg-white border border-slate-200 shadow-xl rounded-[4px] py-1.5 z-[9999]"
                            style={{ top: dropdownPos.top, left: dropdownPos.left }}
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
    </div>
  );
}
