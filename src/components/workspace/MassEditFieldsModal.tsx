import React, { useState } from 'react';
import { createPortal } from 'react-dom';



import { Button } from '@/components/ui/Button';
import type { MassEditFieldsModalProps } from '../../types/components.interface';
export const MassEditFieldsModal: React.FC<MassEditFieldsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  members,
  isSubmitting
}) => {
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const data: any = {};
    if (assigneeId !== '') {
      data.assigneeId = assigneeId === 'unassigned' ? null : assigneeId;
    }
    if (priority !== '') {
      data.priority = priority;
    }
    if (dueDate !== '') {
      data.dueDate = dueDate === 'clear' ? null : `${dueDate}T00:00:00`;
    }
    onSubmit(data);
  };

  const hasAnyUpdate = assigneeId !== '' || priority !== '' || dueDate !== '';

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={() => !isSubmitting && onClose()} 
      />
      <div className="relative bg-[#2C2D33] rounded-lg shadow-2xl w-full max-w-[440px] p-6 animate-in zoom-in-95 duration-200 border border-white/10">
        <h2 className="text-[16px] font-bold text-white mb-5">Edit fields</h2>
        
        <p className="text-muted-foreground text-xs mb-4">Any selected field will be applied to all checked tasks. Leave empty to keep unchanged.</p>

        <div className="space-y-4 mb-6">
          {/* Assignee */}
          <div className="flex items-center gap-3">
            <label className="text-white text-[13px] font-medium w-20 shrink-0">Assignee</label>
            <div className="relative flex-1">
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={isSubmitting}
                className="w-full appearance-none bg-[#2C2D33] text-muted-foreground px-3 py-2 border border-slate-500/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] hover:bg-[#34353B] transition-colors"
              >
                <option value="">Don't change</option>
                <option value="unassigned">Unassigned (Clear)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <label className="text-white text-[13px] font-medium w-20 shrink-0">Priority</label>
            <div className="relative flex-1">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isSubmitting}
                className="w-full appearance-none bg-[#2C2D33] text-muted-foreground px-3 py-2 border border-slate-500/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] hover:bg-[#34353B] transition-colors"
              >
                <option value="">Don't change</option>
                {['Highest', 'High', 'Medium', 'Low', 'Lowest'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-3">
            <label className="text-white text-[13px] font-medium w-20 shrink-0">Due date</label>
            <div className="flex items-center flex-1 gap-2">
              <input
                type="date"
                value={dueDate !== 'clear' ? dueDate : ''}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting || dueDate === 'clear'}
                className="flex-1 appearance-none bg-[#2C2D33] text-muted-foreground px-3 py-2 border border-slate-500/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] hover:bg-[#34353B] transition-colors [color-scheme:dark] disabled:opacity-50"
              />
              <Button
                type="button"
                onClick={() => setDueDate(dueDate === 'clear' ? '' : 'clear')}
                className={`px-2 py-2 border rounded-md text-[12px] font-semibold transition-colors ${dueDate === 'clear' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'border-slate-500/50 text-muted-foreground hover:bg-accent'}`}
                title="Clear due date on selected tasks"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2">
          <Button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-card/10 rounded-md transition-colors"
          >
            Cancel
          </Button>
          <Button
            disabled={!hasAnyUpdate || isSubmitting}
            onClick={handleSubmit}
            className="px-3 py-1.5 text-[13px] font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-primary/30 disabled:text-white/40 rounded-md transition-colors flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Submit
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
