import React from 'react';
import { createPortal } from 'react-dom';
import { MousePointer2, Edit3, MinusSquare, Trash2, X, MoveRight } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MassActionBarProps {
  selectedTaskIds: Set<string>;
  allTasks: any[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setShowMassEditFieldsModal: (v: boolean) => void;
  setShowMassChangeStatusModal: (v: boolean) => void;
  setShowMassMoveModal: (v: boolean) => void;
  setShowMassDeleteModal: (v: boolean) => void;
}

export function MassActionBar({
  selectedTaskIds,
  allTasks,
  setSelectedTaskIds,
  setShowMassEditFieldsModal,
  setShowMassChangeStatusModal,
  setShowMassMoveModal,
  setShowMassDeleteModal
}: MassActionBarProps) {
  const { t } = useLanguage();

  if (selectedTaskIds.size === 0) return null;

  return createPortal(
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#28282b] text-white px-3 py-2 rounded-lg shadow-2xl z-[99999] text-[13px] font-medium border border-white/10 animate-slide-up">
      <div className="flex items-center gap-2 pr-2">
        <span className="bg-card/10 text-white font-bold px-2 py-0.5 rounded text-[12px]">
          {selectedTaskIds.size}
        </span>
        <span className="text-[#d4d4d8]">{t('backlog.selected')}</span>
      </div>

      <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-card/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => {
        const allIds = allTasks.map((t: any) => t.id);
        setSelectedTaskIds(new Set(allIds));
      }}>
        <MousePointer2 size={14} />
        <span>{t('backlog.select_all')}</span>
      </button>

      <div className="w-[1px] h-4 bg-card/20 mx-2"></div>

      <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-card/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassEditFieldsModal(true)}>
        <Edit3 size={14} />
        <span>{t('backlog.edit_fields')}</span>
      </button>

      <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-card/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassChangeStatusModal(true)}>
        <MinusSquare size={14} />
        <span>{t('backlog.change_status')}</span>
      </button>

      <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-card/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassMoveModal(true)}>
        <MoveRight size={14} />
        <span>{t('backlog.move')}</span>
      </button>

      <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-card/10 rounded-md transition-colors text-[#d4d4d8]" onClick={() => setShowMassDeleteModal(true)}>
        <Trash2 size={14} />
        <span>{t('backlog.delete')}</span>
      </button>

      <div className="w-[1px] h-4 bg-card/20 mx-2"></div>

      <button className="p-1 hover:bg-card/10 rounded-md transition-colors ml-1 text-[#d4d4d8]" onClick={() => setSelectedTaskIds(new Set())}>
        <X size={16} />
      </button>
    </div>,
    document.body
  );
}
