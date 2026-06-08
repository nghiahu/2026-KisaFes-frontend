import React, { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  showCancel?: boolean;
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
  isLoading = false,
  showCancel = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/60 z-[9999] animate-in fade-in duration-200" onClick={!isLoading ? onClose : undefined} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-xl shadow-xl z-[10000] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {isDestructive ? <Icons.alertCircle size={24} /> : <Icons.helpCircle size={24} />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {message}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-end gap-3">
            {showCancel && (
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                {cancelText}
              </button>
            )}
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
    </>,
    document.body
  );
}
