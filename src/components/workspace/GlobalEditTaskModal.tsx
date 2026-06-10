import { useState } from 'react';
import { Icons } from '../../assets/icons';
import { createPortal } from 'react-dom';
import type { AiTaskEditAction } from '../../services/task.service';

interface GlobalEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  edits: AiTaskEditAction[];
  onConfirm: (confirmedEdits: AiTaskEditAction[]) => void;
  isSubmitting: boolean;
}

export default function GlobalEditTaskModal({ isOpen, onClose, edits, onConfirm, isSubmitting }: GlobalEditTaskModalProps) {
  const [selectedEdits, setSelectedEdits] = useState<Set<number>>(new Set(edits.map((_, i) => i)));

  if (!isOpen) return null;

  const toggleEdit = (index: number) => {
    const newSet = new Set(selectedEdits);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedEdits(newSet);
  };

  const handleConfirm = () => {
    const confirmed = edits.filter((_, i) => selectedEdits.has(i));
    onConfirm(confirmed);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-card rounded-xl shadow-2xl w-full max-w-[700px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Icons.sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-[15px]">Confirm AI Edits</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Review and apply the suggested changes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-slate-200 rounded-md transition-colors">
            <Icons.x size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {edits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found to edit based on your request.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 px-1 border-b border-border">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={selectedEdits.size === edits.length && edits.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEdits(new Set(edits.map((_, i) => i)));
                      } else {
                        setSelectedEdits(new Set());
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  Select All ({edits.length} tasks)
                </label>
              </div>
              {edits.map((edit, idx) => (
                <label 
                  key={idx}
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedEdits.has(idx) 
                      ? 'border-blue-200 bg-blue-50/30' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="mt-1">
                    <input 
                      type="checkbox"
                      checked={selectedEdits.has(idx)}
                      onChange={() => toggleEdit(idx)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-foreground">
                        {edit.taskKey} <span className="text-muted-foreground font-normal ml-1">Change {edit.fieldToChange}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <div className="px-2 py-1 bg-red-50 text-red-600 rounded line-through opacity-70 truncate max-w-[200px]">
                        {edit.oldValueDisplay || edit.oldValue || 'Empty'}
                      </div>
                      <Icons.arrowRight size={14} className="text-muted-foreground" />
                      <div className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium truncate max-w-[200px]">
                        {edit.newValueDisplay || edit.newValue || 'Empty'}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground italic flex items-start gap-1.5">
                      <Icons.helpCircle size={14} className="shrink-0 mt-0.5" />
                      {edit.reason}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-card">
          <div className="text-xs font-medium text-muted-foreground">
            {selectedEdits.size} of {edits.length} selected
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selectedEdits.size === 0 || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
