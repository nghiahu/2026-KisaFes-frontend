import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface MassDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  count: number;
}

export const MassDeleteModal: React.FC<MassDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count
}) => {
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isDeleting && onClose()} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[440px] p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="text-rose-600 fill-rose-100" />
            <h2 className="text-lg font-bold text-slate-800">Delete selected tasks?</h2>
          </div>
          <button onClick={onClose} disabled={isDeleting} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-slate-600 text-sm leading-relaxed mb-6 pl-8">
          You are about to delete {count} task(s). 
          Deleting is irreversible. It permanently removes the work items, subtasks, 
          comments and attachments.
        </p>
        
        <div className="mb-6 pl-8">
          <label className="block text-[13px] text-slate-600 mb-2">
            Type <strong className="text-slate-800 font-bold">delete</strong> to continue
          </label>
          <input
            type="text"
            autoFocus
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            disabled={isDeleting}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={deleteConfirmText !== 'delete' || isDeleting}
            onClick={async () => {
              try {
                setIsDeleting(true);
                await onConfirm();
              } finally {
                setIsDeleting(false);
              }
            }}
            className={`px-4 py-2 text-sm font-semibold text-white rounded transition-colors flex items-center gap-2 ${deleteConfirmText === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-100 text-slate-400'}`}
          >
            {isDeleting ? <RefreshCw className="animate-spin" size={16} /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
