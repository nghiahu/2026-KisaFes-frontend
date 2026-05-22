import { ReactNode } from 'react';
import { Icons } from '../../assets/icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDestructive = false,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" onClick={!isLoading ? onClose : undefined} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {isDestructive ? <Icons.alertCircle size={24} /> : <Icons.helpCircle size={24} />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                {message}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' 
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              }`}
            >
              {isLoading && <Icons.refreshCw size={14} className="animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
