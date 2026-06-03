import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, ChevronDown, CheckSquare, Zap, AlertCircle, User, Calendar, Search, X, CornerDownLeft
} from 'lucide-react';
import defaultMan from '../../assets/avatar_def_man.png';

interface InlineTaskCreatorProps {
  onAdd: (title: string, type: string, assignee: any, dueDate: string) => void;
  onCancel: () => void;
  projectMembers: any[];
  autoFocus?: boolean;
  hideDueDate?: boolean;
}

export const InlineTaskCreator: React.FC<InlineTaskCreatorProps> = ({
  onAdd,
  onCancel,
  projectMembers,
  autoFocus = true,
  hideDueDate = false
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('task');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<any>(null);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState<any>({ top: 0, left: 0, bottom: 'auto' });
  const [typeDropdownPos, setTypeDropdownPos] = useState<any>({ top: 0, left: 0, bottom: 'auto' });

  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const typeTriggerRef = useRef<HTMLButtonElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const assigneeTriggerRef = useRef<HTMLButtonElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredMembers = projectMembers.filter((m: any) =>
    !assigneeSearch.trim() ||
    (m.name || '').toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node) &&
        typeTriggerRef.current && !typeTriggerRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node) &&
        assigneeTriggerRef.current && !assigneeTriggerRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        (!typeDropdownRef.current || !typeDropdownRef.current.contains(event.target as Node)) &&
        (!assigneeDropdownRef.current || !assigneeDropdownRef.current.contains(event.target as Node))
      ) {
        onCancel();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const handleSubmit = () => {
    if (!newTaskTitle.trim()) return;
    onAdd(newTaskTitle, newTaskType, newTaskAssignee, newTaskDueDate);
  };

  return (
    <div ref={containerRef} className="bg-card p-2.5 rounded-xl border-2 border-blue-500 shadow-sm mt-2 flex flex-col gap-2 w-full">
      <textarea
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="What needs to be done?"
        className="w-full text-[13px] font-medium text-foreground placeholder:text-muted-foreground border-0 focus:ring-0 resize-none p-1 min-h-[40px] outline-none"
        rows={2}
        autoFocus={autoFocus}
      />
      
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          {/* Type Dropdown */}
          <div className="relative">
            <button
              ref={typeTriggerRef}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                if (spaceBelow < 200) { setTypeDropdownPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left }); }
                else { setTypeDropdownPos({ top: rect.bottom + 4, left: rect.left }); }
                setShowTypeDropdown(!showTypeDropdown);
              }}
              className="flex items-center gap-1 bg-background hover:bg-muted p-1 rounded transition-colors border border-border"
            >
              {newTaskType === 'epic' && <Zap size={14} className="text-[#8B5CF6] fill-[#8B5CF6]" />}
              {newTaskType === 'task' && <CheckSquare size={14} className="text-[#3B82F6]" />}
              {newTaskType === 'incident' && <AlertCircle size={14} className="text-[#EF4444]" />}
              {newTaskType === 'service request' && <AlertCircle size={14} className="text-[#F59E0B]" />}
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
            {showTypeDropdown && createPortal(
              <div
                ref={typeDropdownRef}
                className="fixed w-[160px] bg-card border border-border shadow-xl rounded-md py-1 z-[9999]"
                style={{ top: typeDropdownPos.top !== undefined ? typeDropdownPos.top : 'auto', bottom: typeDropdownPos.bottom !== undefined ? typeDropdownPos.bottom : 'auto', left: typeDropdownPos.left }}
              >
                <div className="px-1">
                  <button onClick={() => { setNewTaskType('epic'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] rounded text-left ${newTaskType === 'epic' ? 'bg-[#EEF2FF] text-[#3B82F6]' : 'text-foreground hover:bg-background'}`}>
                    <Zap size={13} className="text-[#8B5CF6] fill-[#8B5CF6]" /> Epic
                  </button>
                  <button onClick={() => { setNewTaskType('task'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] rounded text-left ${newTaskType === 'task' ? 'bg-[#EEF2FF] text-[#3B82F6]' : 'text-foreground hover:bg-background'}`}>
                    <CheckSquare size={13} className="text-[#3B82F6]" /> Task
                  </button>
                  <button onClick={() => { setNewTaskType('incident'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] rounded text-left ${newTaskType === 'incident' ? 'bg-[#EEF2FF] text-[#3B82F6]' : 'text-foreground hover:bg-background'}`}>
                    <AlertCircle size={13} className="text-[#EF4444]" /> Incident
                  </button>
                  <button onClick={() => { setNewTaskType('service request'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] rounded text-left ${newTaskType === 'service request' ? 'bg-[#EEF2FF] text-[#3B82F6]' : 'text-foreground hover:bg-background'}`}>
                    <AlertCircle size={13} className="text-[#F59E0B]" /> Service
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Due Date Picker */}
          {!hideDueDate && (
            <div className="relative">
              <button type="button" 
                onClick={() => {
                  try { dateInputRef.current?.showPicker(); } catch (e) { dateInputRef.current?.focus(); }
                }}
                className={`p-1 rounded transition-colors border ${newTaskDueDate ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border'}`} title={newTaskDueDate ? `Due date: ${newTaskDueDate}` : 'Set due date'}>
                <Calendar size={14} />
              </button>
              <input type="date" ref={dateInputRef} value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="absolute opacity-0 pointer-events-none w-0 h-0" style={{ top: '100%', right: 0 }} />
            </div>
          )}

          {/* Assignee Picker */}
          <div className="relative">
            <button type="button" ref={assigneeTriggerRef}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                if (spaceBelow < 250) { setAssigneeDropdownPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left }); }
                else { setAssigneeDropdownPos({ top: rect.bottom + 4, left: rect.left }); }
                setShowAssigneeDropdown(!showAssigneeDropdown);
              }}
              className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors border ${newTaskAssignee && newTaskAssignee !== 'automatic' ? 'border-blue-200' : 'border-border hover:bg-muted text-muted-foreground'}`} title={newTaskAssignee === 'automatic' ? 'Automatic' : newTaskAssignee ? newTaskAssignee.name : 'Unassigned'}
            >
              {newTaskAssignee && newTaskAssignee !== 'automatic' ? (
                <img src={newTaskAssignee.avatar || defaultMan} alt={newTaskAssignee.name} className="w-full h-full rounded-full object-cover" />
              ) : newTaskAssignee === 'automatic' ? (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center"><User size={12} className="text-muted-foreground" /></div>
              ) : (
                <User size={13} />
              )}
            </button>
            {showAssigneeDropdown && createPortal(
              <div ref={assigneeDropdownRef} className="fixed w-[220px] bg-card border border-border shadow-xl rounded-md py-1 z-[9999]" style={{ top: assigneeDropdownPos.top !== undefined ? assigneeDropdownPos.top : 'auto', bottom: assigneeDropdownPos.bottom !== undefined ? assigneeDropdownPos.bottom : 'auto', left: assigneeDropdownPos.left }}>
                <div className="px-2 pb-2 border-b border-border mt-1">
                  <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1.5 focus-within:border-blue-400 focus-within:bg-card transition-all">
                    <Search size={12} className="text-muted-foreground shrink-0" />
                    <input value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)} type="text" placeholder="Find user..." className="flex-1 text-[12px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground" />
                    {assigneeSearch && <button type="button" onClick={() => setAssigneeSearch('')} className="text-muted-foreground hover:text-muted-foreground shrink-0"><X size={11} /></button>}
                  </div>
                </div>
                <div className="max-h-[200px] overflow-y-auto py-1">
                  {(!assigneeSearch.trim() || 'unassigned'.includes(assigneeSearch.toLowerCase())) && (
                    <button type="button" onClick={() => { setNewTaskAssignee(null); setShowAssigneeDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors text-left ${!newTaskAssignee ? 'bg-blue-50/50' : 'hover:bg-background'}`}>
                      <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0"><User size={12} className="text-muted-foreground" /></div>
                      <span className={!newTaskAssignee ? 'text-blue-600 font-medium' : 'text-foreground'}>Unassigned</span>
                    </button>
                  )}
                  {(!assigneeSearch.trim() || 'automatic'.includes(assigneeSearch.toLowerCase())) && (
                    <button type="button" onClick={() => { setNewTaskAssignee('automatic'); setShowAssigneeDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors text-left border-b border-border pb-2 mb-1 ${newTaskAssignee === 'automatic' ? 'bg-blue-50/50 text-blue-600' : 'hover:bg-background text-foreground'}`}>
                      <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0"><User size={12} className="text-muted-foreground" /></div>
                      <span>Automatic</span>
                    </button>
                  )}
                  {filteredMembers.map((m: any) => {
                    const isSelected = newTaskAssignee?.id === m.id;
                    return (
                      <button type="button" key={m.id} onClick={() => { setNewTaskAssignee(m); setShowAssigneeDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors text-left ${isSelected ? 'bg-blue-50/50' : 'hover:bg-background'}`}>
                        <img src={m.avatar || defaultMan} alt={m.name} className="w-6 h-6 rounded-full object-cover shrink-0 border border-border" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-foreground font-medium">{m.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          className="p-1 rounded bg-muted text-muted-foreground hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center w-7 h-7"
        >
          <CornerDownLeft size={14} />
        </button>
      </div>
    </div>
  );
};
