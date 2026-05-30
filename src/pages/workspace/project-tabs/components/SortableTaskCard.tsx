import { useState, useEffect } from 'react';
import { Icons } from '../../../../assets/icons';
import { useAppDispatch } from '../../../../store/hooks';
import defaultMan from '../../../../assets/avatar_def_man.png';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { useUpdateTaskTitleMutation, useUpdateTaskAssigneeMutation, useUpdateTaskPriorityMutation, useUpdateTaskDueDateMutation } from '../../../../hooks/api/useTasks';

const PRIORITIES = [
  { label: 'Highest', icon: <Icons.chevronsUp size={12} className="text-rose-500" />, color: 'text-rose-600' },
  { label: 'High', icon: <Icons.chevronUp size={12} className="text-orange-500" />, color: 'text-orange-500' },
  { label: 'Medium', icon: <Icons.equal size={12} strokeWidth={3} className="text-amber-500" />, color: 'text-amber-500' },
  { label: 'Low', icon: <Icons.chevronDown size={12} className="text-blue-400" />, color: 'text-blue-400' },
  { label: 'Lowest', icon: <Icons.chevronsDown size={12} className="text-slate-400" />, color: 'text-slate-400' },
];

export const getPriorityColor = (priority: string) => {
  const p = PRIORITIES.find(x => x.label?.toLowerCase() === (priority || '').toLowerCase());
  return p ? p.color : 'text-slate-500';
};

export const getPriorityIcon = (priority: string) => {
  const p = PRIORITIES.find(x => x.label?.toLowerCase() === (priority || '').toLowerCase());
  return p ? p.icon : <Icons.equal size={12} strokeWidth={3} className="text-amber-500" />;
};

export const SortableTaskCard = ({ task, isOverlay = false, projectMembers = [], onTaskUpdate }: { task: any, isOverlay?: boolean, projectMembers?: any[], onTaskUpdate?: (id: string, updates: any) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: task });
  
  const projectId = task.projectId;
  const updateTitleMutation = useUpdateTaskTitleMutation(projectId);
  const updateAssigneeMutation = useUpdateTaskAssigneeMutation(projectId);
  const updatePriorityMutation = useUpdateTaskPriorityMutation(projectId);
  const updateDueDateMutation = useUpdateTaskDueDateMutation(projectId);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);

  const [showAssignee, setShowAssignee] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneePos, setAssigneePos] = useState({ top: 0, left: 0 });

  const [showPriority, setShowPriority] = useState(false);
  const [priorityPos, setPriorityPos] = useState({ top: 0, left: 0 });

  const [showActions, setShowActions] = useState(false);
  const [actionsPos, setActionsPos] = useState({ top: 0, left: 0 });

  const deleteTaskMutation = useUpdateTaskTitleMutation(projectId); // Will use delete mutation below

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowPriority(false);
      setShowAssignee(false);
      setShowActions(false);
    };
    if (showPriority || showAssignee || showActions) {
      window.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [showPriority, showAssignee, showActions]);

  const handleTitleSubmit = async () => {
    if (!titleValue.trim() || titleValue.trim() === task.title) {
      setIsEditingTitle(false);
      return;
    }
    const newTitle = titleValue.trim();
    if (onTaskUpdate) onTaskUpdate(task.id, { title: newTitle });
    setIsEditingTitle(false);
    try {
      if (task.id) await updateTitleMutation.mutateAsync({ taskId: task.id, title: newTitle });
    } catch (err) {
      console.error(err);
      if (onTaskUpdate) onTaskUpdate(task.id, { title: task.title });
    }
  };

  const handlePrioritySelect = async (priority: string) => {
    setShowPriority(false);
    const old = task.priority;
    if (onTaskUpdate) onTaskUpdate(task.id, { priority });
    try {
      if (task.id) await updatePriorityMutation.mutateAsync({ taskId: task.id, priority });
    } catch (err) {
      console.error(err);
      if (onTaskUpdate) onTaskUpdate(task.id, { priority: old });
    }
  };

  const handleAssigneeSelect = async (member: any) => {
    setShowAssignee(false);
    const oldId = task.assigneeId;
    const oldName = task.assigneeName;
    const oldAvatar = task.assigneeAvatar;
    const newId = member ? member.id : null;
    const newName = member ? member.name : 'Unassigned';
    const newAvatar = member ? member.avatar : null;
    
    if (onTaskUpdate) onTaskUpdate(task.id, { assigneeId: newId, assigneeName: newName, assigneeAvatar: newAvatar });
    try {
      if (task.id) await updateAssigneeMutation.mutateAsync({ taskId: task.id, assigneeId: newId });
    } catch (err) {
      console.error(err);
      if (onTaskUpdate) onTaskUpdate(task.id, { assigneeId: oldId, assigneeName: oldName, assigneeAvatar: oldAvatar });
    }
  };

  const handleDueDateChange = async (newDate: string) => {
    const formatted = newDate ? `${newDate}T00:00:00` : null;
    const old = task.dueDate;
    if (onTaskUpdate) onTaskUpdate(task.id, { dueDate: formatted });
    try {
      if (task.id) await updateDueDateMutation.mutateAsync({ taskId: task.id, dueDate: formatted });
    } catch (err) {
      console.error(err);
      if (onTaskUpdate) onTaskUpdate(task.id, { dueDate: old });
    }
  };

  const filteredMembers = projectMembers.filter(m => m.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) || m.email?.toLowerCase().includes(assigneeSearch.toLowerCase()));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-[10px] text-slate-400 font-bold block">{task.taskKey || task.id}</span>
        
        {/* Due Date */}
        <div className="relative group/date">
          <div 
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            onClick={(e) => {
              const input = e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement;
              if (input) { try { input.showPicker(); } catch (err) { input.focus(); } }
            }}
            onPointerDown={e => e.stopPropagation()}
          >
            <Icons.calendar size={10} />
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set date'}</span>
          </div>
          <input
            type="date"
            value={task.dueDate ? task.dueDate.substring(0, 10) : ''}
            onChange={(e) => handleDueDateChange(e.target.value)}
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
          />
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button 
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setActionsPos({ top: rect.bottom + 4, left: rect.left - 100 });
              setShowActions(true);
            }}
            className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
          >
            <Icons.moreHorizontal size={14} />
          </button>
        </div>
      </div>
      
      {isEditingTitle ? (
        <div className="flex items-center gap-1 mb-2" onPointerDown={e => e.stopPropagation()}>
          <input 
            type="text" 
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') { setIsEditingTitle(false); setTitleValue(task.title); }
            }}
            onBlur={handleTitleSubmit}
            autoFocus
            className="flex-1 border border-blue-400 bg-white px-2 py-1 rounded-[3px] text-xs outline-none focus:ring-1 focus:ring-blue-400 min-w-0 font-bold"
          />
          <button onClick={handleTitleSubmit} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0"><Icons.check size={14} className="text-slate-700" /></button>
          <button onClick={() => { setIsEditingTitle(false); setTitleValue(task.title); }} className="p-1 border border-slate-200 bg-white rounded shadow-sm hover:bg-slate-50 shrink-0"><Icons.x size={14} className="text-slate-700" /></button>
        </div>
      ) : (
        <h5 
          onClick={() => { setIsEditingTitle(true); setTitleValue(task.title); }}
          onPointerDown={e => e.stopPropagation()}
          className="font-bold text-slate-800 text-sm leading-snug hover:text-blue-600 transition-colors cursor-pointer mb-2"
        >
          {task.title}
        </h5>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <button 
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPriorityPos({ top: rect.bottom + 4, left: rect.left });
            setShowPriority(true);
          }}
          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border hover:bg-slate-100 transition-colors ${getPriorityColor(task.priority)}`}
        >
          {getPriorityIcon(task.priority)}
          <span>{task.priority || 'Medium'}</span>
        </button>

        <button 
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setAssigneePos({ top: rect.bottom + 4, left: rect.left - 150 });
            setShowAssignee(true);
            setAssigneeSearch('');
          }}
          className="flex items-center gap-1.5 hover:ring-2 hover:ring-blue-200 rounded-full transition-all"
        >
          <img src={task.assigneeAvatar || defaultMan} alt="Assignee" className="w-6 h-6 rounded-full border border-slate-200 shadow-sm object-cover" title={task.assigneeName || 'Unassigned'} />
        </button>
      </div>

      {showPriority && createPortal(
        <div
          className="fixed w-[140px] bg-white border border-slate-200 shadow-2xl rounded-xl py-1 z-[9999] overflow-hidden"
          style={{ top: priorityPos.top, left: priorityPos.left }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-3 py-1 mb-1 border-b border-slate-100">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
             <button onClick={() => setShowPriority(false)}><Icons.x size={12} className="text-slate-400 hover:text-slate-700"/></button>
          </div>
          {PRIORITIES.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePrioritySelect(p.label)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors text-left text-slate-700"
            >
              {p.icon} <span>{p.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}

      {showAssignee && createPortal(
        <div
          className="fixed w-[200px] bg-white border border-slate-200 shadow-2xl rounded-xl py-2 z-[9999] overflow-hidden"
          style={{ top: assigneePos.top, left: assigneePos.left }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-3 mb-2">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee</span>
             <button onClick={() => setShowAssignee(false)}><Icons.x size={12} className="text-slate-400 hover:text-slate-700"/></button>
          </div>
          <div className="px-3 pb-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search users..."
              value={assigneeSearch}
              onChange={(e) => setAssigneeSearch(e.target.value)}
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
            />
          </div>
          <div className="max-h-[150px] overflow-y-auto py-1">
            <button onClick={() => handleAssigneeSelect(null)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 text-left text-slate-600">
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Icons.user size={10} /></div>
              <span>Unassigned</span>
            </button>
            {filteredMembers.map((m: any) => (
              <button key={m.id} onClick={() => handleAssigneeSelect(m)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 text-left text-slate-700">
                <img src={m.avatar || defaultMan} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                <span className="truncate">{m.name}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Actions Dropdown */}
      {showActions && createPortal(
        <div
          className="fixed w-[120px] bg-white border border-slate-200 shadow-xl rounded-md py-1 z-[9999]"
          style={{ top: actionsPos.top, left: actionsPos.left }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => {
              setShowActions(false);
              // Fire an update with 'DELETE' signal or call delete mutation here
              if (onTaskUpdate) onTaskUpdate(task.id, { _delete: true });
            }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Icons.trash2 size={14} className="text-rose-500" /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
