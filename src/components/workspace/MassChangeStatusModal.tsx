import React, { useState } from 'react';
import { createPortal } from 'react-dom';



import { Button } from '@/components/ui/Button';
import type { MassChangeStatusModalProps } from '../../types/components.interface';
export const MassChangeStatusModal: React.FC<MassChangeStatusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  statuses,
  isSubmitting
}) => {
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={() => !isSubmitting && onClose()} 
      />
      <div className="relative bg-[#2C2D33] rounded-lg shadow-2xl w-full max-w-[400px] p-6 animate-in zoom-in-95 duration-200 border border-white/10">
        <h2 className="text-[16px] font-bold text-white mb-5">Change status</h2>
        
        <div className="mb-6 relative">
          <select
            value={selectedStatusId}
            onChange={(e) => setSelectedStatusId(e.target.value)}
            disabled={isSubmitting}
            className="w-full appearance-none bg-[#2C2D33] text-muted-foreground px-3 py-2 border border-slate-500/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[13px] hover:bg-[#34353B] transition-colors"
          >
            <option value="" disabled>Select status</option>
            {statuses.map(s => (
              <option key={s.statusId} value={s.statusId}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-muted-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
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
            disabled={!selectedStatusId || isSubmitting}
            onClick={() => onSubmit(selectedStatusId)}
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
