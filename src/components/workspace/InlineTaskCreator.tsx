import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, ChevronDown, CheckSquare, Zap, AlertCircle, User, Calendar, Search, X, CornerDownLeft
} from 'lucide-react';
import defaultMan from '../../assets/avatar_def_man.png';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';

import type { InlineTaskCreatorProps } from '../../types/components.interface';
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
    <div ref={containerRef} className="bg-card p-2.5 rounded-xl border-2 border-primary shadow-sm mt-2 flex flex-col gap-2 w-full">
      <Textarea
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
        className="w-full text-[13px] font-medium text-foreground placeholder:text-muted-foreground border-0 focus-visible:ring-0 resize-none p-1 min-h-[40px] outline-none shadow-none"
        rows={2}
        autoFocus={autoFocus}
      />
      
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          {/* Type Dropdown */}
          <div className="relative">
            <Button
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
            </Button>
            {showTypeDropdown && createPortal(
              <div
                ref={typeDropdownRef}
                className="fixed w-[160px] bg-card border border-border shadow-xl rounded-md py-1 z-[9999]"
                style={{ top: typeDropdownPos.top !== undefined ? typeDropdownPos.top : 'auto', bottom: typeDropdownPos.bottom !== undefined ? typeDropdownPos.bottom : 'auto', left: typeDropdownPos.left }}
              >
                <div className="px-1">
                  <Button onClick={() => { setNewTaskType('epic'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] rounded text-left ${newTaskType === 'epic' ? 'bg-[#EEF2FF] text-[#3B82F6]' : 'text-foreground hover:bg-background'}`}>
                    <Zap size={13} className="text-[#8B5CF6] fill-[#8B5CF6]" /> Epic
                  </Button>
                  <Button onClick={() => { setNewTaskType('task'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] rounded text-left ${newTaskType === 'task' ? 'bg-[#EEF2FF] text-[#3B82F6]' : 'text-foreground hover:bg-background'}`}>
                    <CheckSquare size={13} className="text-[#3B82F6]" /> Task
                  </Button>
                  <Button onClick={() => { setNewTaskType('incident'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] rounded text-left ${newTaskType === 'incident' ? 'bg-[#EEF2FF] text-[#3B82F6]' : 'text-foreground hover:bg-background'}`}>
                    <AlertCircle size={13} className="text-[#EF4444]" /> Incident
                  </Button>
                  <Button onClick={() => { setNewTaskType('service request'); setShowTypeDropdown(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[13px] rounded text-left ${newTaskType === 'service request' ? 'bg-[#EEF2FF] text-[#3B82F6]' : 'text-foreground hover:bg-background'}`}>
                    <AlertCircle size={13} className="text-[#F59E0B]" /> Service
                  </Button>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Due Date Picker */}
          {!hideDueDate && (
            <div className="relative">
              <Button type="button" 
                onClick={() => {
                  try { dateInputRef.current?.showPicker(); } catch (e) { dateInputRef.current?.focus(); }
                }}
                className={`p-1 rounded transition-colors border ${newTaskDueDate ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border'}`} title={newTaskDueDate ? `Due date: ${newTaskDueDate}` : 'Set due date'}>
                <Calendar size={14} />
              </Button>
              <input type="date" ref={dateInputRef} value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="absolute opacity-0 pointer-events-none w-0 h-0" style={{ top: '100%', right: 0 }} />
            </div>
          )}

          {/* Assignee Picker */}
          <div className="relative">
            <Button type="button" ref={assigneeTriggerRef}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                if (spaceBelow < 250) { setAssigneeDropdownPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left }); }
                else { setAssigneeDropdownPos({ top: rect.bottom + 4, left: rect.left }); }
                setShowAssigneeDropdown(!showAssigneeDropdown);
              }}
              className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors border ${newTaskAssignee && newTaskAssignee !== 'automatic' ? 'border-primary/20' : 'border-border hover:bg-muted text-muted-foreground'}`} title={newTaskAssignee === 'automatic' ? 'Automatic' : newTaskAssignee ? newTaskAssignee.name : 'Unassigned'}
            >
              {newTaskAssignee && newTaskAssignee !== 'automatic' ? (
                <img  src={newTaskAssignee.avatar || defaultMan} alt={newTaskAssignee.name} className="w-full h-full rounded-full object-cover" />
              ) : newTaskAssignee === 'automatic' ? (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center"><User size={12} className="text-muted-foreground" /></div>
              ) : (
                <User size={13} />
              )}
            </Button>
            {showAssigneeDropdown && createPortal(
              <div ref={assigneeDropdownRef} className="fixed w-[220px] bg-card border border-border shadow-xl rounded-md py-1 z-[9999]" style={{ top: assigneeDropdownPos.top !== undefined ? assigneeDropdownPos.top : 'auto', bottom: assigneeDropdownPos.bottom !== undefined ? assigneeDropdownPos.bottom : 'auto', left: assigneeDropdownPos.left }}>
                <div className="px-2 pb-2 border-b border-border mt-1">
                  <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1.5 focus-within:border-blue-400 focus-within:bg-card transition-all">
                    <Search size={12} className="text-muted-foreground shrink-0" />
                    <input value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)} type="text" placeholder="Find user..." className="flex-1 text-[12px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground" />
                    {assigneeSearch && <Button type="button" onClick={() => setAssigneeSearch('')} className="text-muted-foreground hover:text-muted-foreground shrink-0"><X size={11} /></Button>}
                  </div>
                </div>
                <div className="max-h-[200px] overflow-y-auto py-1">
                  {(!assigneeSearch.trim() || 'unassigned'.includes(assigneeSearch.toLowerCase())) && (
                    <Button type="button" onClick={() => { setNewTaskAssignee(null); setShowAssigneeDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors text-left ${!newTaskAssignee ? 'bg-primary/10/50' : 'hover:bg-background'}`}>
                      <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0"><User size={12} className="text-muted-foreground" /></div>
                      <span className={!newTaskAssignee ? 'text-primary font-medium' : 'text-foreground'}>Unassigned</span>
                    </Button>
                  )}
                  {(!assigneeSearch.trim() || 'automatic'.includes(assigneeSearch.toLowerCase())) && (
                    <Button type="button" onClick={() => { setNewTaskAssignee('automatic'); setShowAssigneeDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] transition-colors text-left border-b border-border pb-2 mb-1 ${newTaskAssignee === 'automatic' ? 'bg-primary/10/50 text-primary' : 'hover:bg-background text-foreground'}`}>
                      <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0"><User size={12} className="text-muted-foreground" /></div>
                      <span>Automatic</span>
                    </Button>
                  )}
                  {filteredMembers.map((m: any) => {
                    const isSelected = newTaskAssignee?.id === m.id;
                    return (
                      <Button type="button" key={m.id} onClick={() => { setNewTaskAssignee(m); setShowAssigneeDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors text-left ${isSelected ? 'bg-primary/10/50' : 'hover:bg-background'}`}>
                        <img  src={m.avatar || defaultMan} alt={m.name} className="w-6 h-6 rounded-full object-cover shrink-0 border border-border" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-foreground font-medium">{m.name}</span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSubmit}
          className="h-7 text-xs"
        >
          Create
          <div className="flex items-center justify-center w-4 h-4 rounded bg-background/50 ml-1.5 text-current">
            <CornerDownLeft size={10} />
          </div>
        </Button>
      </div>
    </div>
  );
};
