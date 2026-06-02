import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../../../../assets/icons';
import { useProjectList } from './ProjectListContext';
import defaultAvatar from '../../../../../assets/avatar_def_man.png';

export function ProjectListNewRow() {
  const {
    currentProject,
    isCreatingTask,
    setIsCreatingTask,
    tasksState: { tasks, createTaskMutation },
    columnsState: { columns }
  } = useProjectList();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<any>(null); // 'automatic' or user object or null
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [showNewTaskAssigneeDropdown, setShowNewTaskAssigneeDropdown] = useState(false);
  const [newTaskAssigneeDropdownPos, setNewTaskAssigneeDropdownPos] = useState<{ top?: number, bottom?: number, left: number }>({ top: 0, left: 0 });
  const [newTaskType, setNewTaskType] = useState('Epic');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<any>({ top: 0, left: 0, bottom: 'auto' });

  const newTaskAssigneeTriggerRef = useRef<HTMLButtonElement>(null);
  const newTaskAssigneeDropdownRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inlineRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDropdown = dropdownRef.current ? !dropdownRef.current.contains(event.target as Node) : true;
      const isOutsideTrigger = triggerRef.current ? !triggerRef.current.contains(event.target as Node) : true;
      if (isOutsideDropdown && isOutsideTrigger) setShowTypeDropdown(false);

      const isOutsideNewTaskAssignee = newTaskAssigneeDropdownRef.current ? !newTaskAssigneeDropdownRef.current.contains(event.target as Node) : true;
      const isOutsideNewTaskAssigneeTrigger = newTaskAssigneeTriggerRef.current ? !newTaskAssigneeTriggerRef.current.contains(event.target as Node) : true;
      if (isOutsideNewTaskAssignee && isOutsideNewTaskAssigneeTrigger) setShowNewTaskAssigneeDropdown(false);

      const isOutsideInlineRow = inlineRowRef.current ? !inlineRowRef.current.contains(event.target as Node) : true;
      if (isCreatingTask && isOutsideInlineRow && isOutsideDropdown && isOutsideNewTaskAssignee) {
        setIsCreatingTask(false);
      }
    };
    if (showTypeDropdown || showNewTaskAssigneeDropdown || isCreatingTask) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTypeDropdown, showNewTaskAssigneeDropdown, isCreatingTask]);

  const handleCreateTask = async () => {
    if (!newTaskTitle || !newTaskTitle.trim() || !currentProject) return;
    const firstStatusId = currentProject.statuses?.[0]?.statusId || "";
    try {
      await createTaskMutation.mutateAsync({
        projectId: currentProject.id,
        title: newTaskTitle.trim(),
        statusId: firstStatusId,
        type: newTaskType.toLowerCase(),
        assigneeId: newTaskAssignee && newTaskAssignee !== 'automatic' ? newTaskAssignee.id : null,
        dueDate: newTaskDueDate ? `${newTaskDueDate}T00:00:00` : null
      });

      setNewTaskTitle('');
      setNewTaskAssignee(null);
      setNewTaskDueDate('');
      setIsCreatingTask(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleToggleDropdown = () => {
    if (!showTypeDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 160) {
        setDropdownPos({ top: 'auto', bottom: window.innerHeight - rect.top + 4, left: rect.left });
      } else {
        setDropdownPos({ top: rect.bottom + 4, bottom: 'auto', left: rect.left });
      }
    }
    setShowTypeDropdown(!showTypeDropdown);
  };

  const projectMembers = currentProject?.members?.filter((m: any) => m.active !== false) || [];

  return (
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
            <button className="p-1 text-slate-400 hover:text-slate-600 rounded shrink-0" title="Reset tasks">
              <Icons.refreshCw size={11} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full max-w-[1050px] bg-white border-2 border-[#3B82F6] rounded-[4px] p-[3px] shadow-sm relative">
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
              {showTypeDropdown && createPortal(
                <div
                  ref={dropdownRef}
                  className="fixed w-[180px] bg-white border border-slate-200 shadow-xl rounded-[4px] py-1.5 z-[9999]"
                  style={{ top: dropdownPos.top, bottom: dropdownPos.bottom, left: dropdownPos.left }}
                >
                  <div className="px-1">
                    <button onClick={() => { setNewTaskType('Epic'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-3 px-3 py-1.5 text-[14px] rounded-[3px] text-left ${newTaskType === 'Epic' ? 'bg-[#EEF2FF] text-[#3B82F6] border-l-2 border-[#3B82F6]' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}><Icons.zap size={15} className={newTaskType === 'Epic' ? "fill-[#8B5CF6] text-[#8B5CF6]" : "text-[#8B5CF6] fill-[#8B5CF6]"} /> Epic</button>
                    <button onClick={() => { setNewTaskType('Task'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-3 px-3 py-1.5 text-[14px] rounded-[3px] text-left ${newTaskType === 'Task' ? 'bg-[#EEF2FF] text-[#3B82F6] border-l-2 border-[#3B82F6]' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}><Icons.checkSquare size={15} className="text-[#3B82F6]" /> Task</button>
                    <button onClick={() => { setNewTaskType('Incident'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-3 px-3 py-1.5 text-[14px] rounded-[3px] text-left ${newTaskType === 'Incident' ? 'bg-[#EEF2FF] text-[#3B82F6] border-l-2 border-[#3B82F6]' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}><Icons.alertCircle size={15} className="text-[#EF4444]" /> Incident</button>
                    <button onClick={() => { setNewTaskType('Service Request'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-3 px-3 py-1.5 text-[14px] rounded-[3px] text-left ${newTaskType === 'Service Request' ? 'bg-[#EEF2FF] text-[#3B82F6] border-l-2 border-[#3B82F6]' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'}`}><Icons.alertCircle size={15} className="text-[#F59E0B]" /> Service Request</button>
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

            <div className="flex items-center gap-1.5 pr-1 shrink-0">
              <div className="relative flex items-center">
                <button
                  onClick={() => { try { dateInputRef.current?.showPicker(); } catch (e) { dateInputRef.current?.focus(); } }}
                  className={`p-1.5 rounded-[3px] transition-colors ${newTaskDueDate ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                  title={newTaskDueDate ? `Due date: ${newTaskDueDate}` : 'Set due date'}
                >
                  <Icons.calendar size={15} />
                </button>
                <input type="date" ref={dateInputRef} value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="absolute opacity-0 pointer-events-none w-0 h-0" style={{ top: '100%', right: 0 }} />
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
                  className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors border ${newTaskAssignee && newTaskAssignee !== 'automatic' ? 'border-blue-200' : 'border-transparent hover:bg-slate-100 text-slate-500'}`}
                  title={newTaskAssignee ? (newTaskAssignee === 'automatic' ? 'Assignee: Automatic' : `Assignee: ${newTaskAssignee.name}`) : 'Assign'}
                >
                  {newTaskAssignee && newTaskAssignee !== 'automatic' ? (
                    <img src={newTaskAssignee.avatar || defaultAvatar} alt={newTaskAssignee.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Icons.user size={15} />
                  )}
                </button>

                {showNewTaskAssigneeDropdown && createPortal(
                  <div
                    ref={newTaskAssigneeDropdownRef}
                    className="fixed w-[230px] bg-white border border-slate-200 shadow-xl rounded-[4px] py-1.5 z-[9999]"
                    style={{
                      ...(newTaskAssigneeDropdownPos.top ? { top: newTaskAssigneeDropdownPos.top } : { bottom: newTaskAssigneeDropdownPos.bottom }),
                      left: newTaskAssigneeDropdownPos.left
                    }}
                  >
                    <div className="px-1 max-h-[250px] overflow-y-auto">
                      <button onClick={() => { setNewTaskAssignee(null); setShowNewTaskAssigneeDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] rounded-[3px] text-left text-slate-700 hover:bg-slate-50 font-medium">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><Icons.userX size={12} /></div> Unassigned
                      </button>
                      <button onClick={() => { setNewTaskAssignee('automatic'); setShowNewTaskAssigneeDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] rounded-[3px] text-left text-slate-700 hover:bg-slate-50 font-medium">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><Icons.settings size={12} /></div> Automatic
                      </button>
                      {projectMembers.map((member: any) => (
                        <button key={member.id} onClick={() => { setNewTaskAssignee(member); setShowNewTaskAssigneeDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-1.5 text-[13px] rounded-[3px] text-left text-slate-700 hover:bg-slate-50 font-medium">
                          <img src={member.avatar || defaultAvatar} alt={member.name} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                          <span className="truncate">{member.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
